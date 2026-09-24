import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  useState
} from "react";
import toast from "react-hot-toast";
import { getAudioSrc } from "./media";
import { DEFAULT_QUEUE } from "../utils/defaultQueue";

// Global audio player. The <audio> element lives here (rendered once in _app) so
// playback continues across page navigations.
//
// Track shape: { id, title, artist, cover, albumId?, albumName?, duration?, src? }
// `src` is optional; tracks without one get a deterministic sample file.

// v2: tracks use canonical album-track ids (v1 queues are discarded).
const STORAGE_KEY = "pm-player-v2";
// Where the current track was, saved separately (and often) while it plays.
const POSITION_KEY = "pm-player-position";
const DEFAULTS = {
  queue: DEFAULT_QUEUE,
  index: 0,
  volume: 0.7,
  muted: false,
  repeat: "off",
  shuffle: false,
  // Saved position to resume from once the track loads: { trackId, time, duration }.
  resume: null
};
const REPEAT_MODES = ["off", "all", "one"];

// Starts playback. After a failed load (e.g. offline) the element stays in its
// error state, so reload first: pressing play again then retries the file.
function startAudio(audio) {
  if (audio.error) audio.load();
  return audio.play();
}

// OS / headphone controls and lock-screen info (best-effort: not every browser has it).
function setMediaSession(metadata, handlers) {
  if (typeof navigator === "undefined" || !("mediaSession" in navigator)) return;
  try {
    navigator.mediaSession.metadata = new window.MediaMetadata(metadata);
    for (const [action, handler] of Object.entries(handlers)) {
      navigator.mediaSession.setActionHandler(action, handler);
    }
  } catch {
    // Media Session is best-effort.
  }
}

// Serializes player-state saves across tabs (each is a read-merge-write).
function withPlayerLock(fn) {
  if (typeof navigator !== "undefined" && navigator.locks?.request) {
    return navigator.locks.request("pm-player", fn);
  }
  return Promise.resolve().then(fn);
}

// The saved player state: { valid, value } (value is null when missing or unreadable).
function readPlayerState() {
  try {
    const value = JSON.parse(window.localStorage.getItem(STORAGE_KEY) || "null");
    const valid = Boolean(value) && typeof value === "object" && !Array.isArray(value);
    return { valid, value: valid ? value : null };
  } catch {
    return { valid: false, value: null };
  }
}

function writePosition({ trackId, time, duration }) {
  try {
    window.localStorage.setItem(POSITION_KEY, JSON.stringify({ trackId, time, duration }));
  } catch {
    // storage unavailable
  }
}

// All queue indices except `exclude`, in random order (Fisher-Yates).
function shuffledIndices(length, exclude) {
  const order = Array.from({ length }, (_, i) => i).filter((i) => i !== exclude);
  for (let i = order.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [order[i], order[j]] = [order[j], order[i]];
  }
  return order;
}

// Same tracks in the same order (play buttons often pass a fresh copy of the queue).
function sameQueue(a, b) {
  return a.length === b.length && a.every((track, i) => track.id === b[i].id);
}

const PlayerContext = createContext(null);
const ProgressContext = createContext({ currentTime: 0, duration: 0, buffered: 0 });

function reducePlayer(state, action) {
  switch (action.type) {
    case "hydrate":
      return { ...state, ...action.payload, hydrated: true };
    case "volume":
      return { ...state, volume: Math.max(0, Math.min(1, action.volume)), muted: false };
    case "mute":
      return { ...state, muted: !state.muted };
    case "repeat":
      return {
        ...state,
        repeat: REPEAT_MODES[(REPEAT_MODES.indexOf(state.repeat) + 1) % REPEAT_MODES.length]
      };
    case "shuffle":
      return { ...state, shuffle: !state.shuffle };
    case "resume/set":
      return state.resume
        ? { ...state, resume: { ...state.resume, time: action.time, explicit: true } }
        : state;
    case "resume/clear":
      return state.resume ? { ...state, resume: null } : state;
    case "play": {
      if (action.queue && action.queue.length) {
        let queue = action.queue;
        let index = queue.findIndex((t) => t.id === action.track.id);
        if (index < 0) {
          queue = [action.track, ...queue];
          index = 0;
        }
        return { ...state, queue, index };
      }
      const existing = state.queue.findIndex((t) => t.id === action.track.id);
      if (existing >= 0) return { ...state, index: existing };
      const queue = [...state.queue];
      queue.splice(state.index + 1, 0, action.track);
      return { ...state, queue, index: state.index + 1 };
    }
    case "enqueue":
      if (state.queue.some((t) => t.id === action.track.id)) return state;
      return { ...state, queue: [...state.queue, action.track] };
    case "jump":
      return { ...state, index: action.index };
    case "remove": {
      const removeAt = state.queue.findIndex((t) => t.id === action.id);
      if (removeAt < 0 || state.queue.length === 1) return state;
      const queue = state.queue.filter((t) => t.id !== action.id);
      const index =
        removeAt < state.index ? state.index - 1 : Math.min(state.index, queue.length - 1);
      return { ...state, queue, index };
    }
    default:
      throw new Error(`Unknown player action: ${action.type}`);
  }
}

// A saved position only applies to the track it was saved for: picking another
// track drops it.
function playerReducer(state, action) {
  const next = reducePlayer(state, action);
  if (next.resume && next.queue[next.index]?.id !== next.resume.trackId) {
    return { ...next, resume: null };
  }
  return next;
}

export function PlayerProvider({ children }) {
  const audioRef = useRef(null);
  const [{ queue, index, volume, muted, repeat, shuffle, resume, hydrated }, dispatch] = useReducer(
    playerReducer,
    { ...DEFAULTS, hydrated: false }
  );
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState({ currentTime: 0, duration: 0, buffered: 0 });

  const wantPlay = useRef(false);
  const lastMedia = useRef(null); // the element that most recently started playing
  // Whether this tab has the latest playback position: set by playing or seeking
  // here, lost when another tab saves one. Only the owner saves on pause/close, so an
  // idle (or restored-but-untouched) tab never overwrites newer progress.
  const ownsPosition = useRef(false);
  const resetGen = useRef(0); // how many demo resets this tab has applied
  // Shuffle bookkeeping: `order` holds the indices still to play (null = not started),
  // `history` the ones already played (for "previous"). Reset with the queue/mode.
  const shuffleState = useRef({ order: null, history: [] });
  useEffect(() => {
    shuffleState.current = { order: null, history: [] };
  }, [queue, shuffle]);
  const live = useRef({ queue, index, repeat, shuffle, resume });
  useEffect(() => {
    live.current = { queue, index, repeat, shuffle, resume };
  }, [queue, index, repeat, shuffle, resume]);
  const loadedTrackId = useRef(null); // the track the <audio> element holds

  const track = queue[index] || null;
  const src = track ? track.src || getAudioSrc(track.id) : null;

  // Restore the last session (queue, position in queue, volume) without autoplaying.
  useEffect(() => {
    const payload = {};
    try {
      const saved = JSON.parse(window.localStorage.getItem(STORAGE_KEY) || "null");
      const validQueue =
        Array.isArray(saved?.queue) &&
        saved.queue.length > 0 &&
        saved.queue.every((t) => typeof t?.id === "string" && typeof t.title === "string");
      if (validQueue) {
        payload.queue = saved.queue;
        const savedIndex = Number.isInteger(saved.index) ? saved.index : 0;
        payload.index = Math.max(0, Math.min(savedIndex, saved.queue.length - 1));
      }
      if (Number.isFinite(saved?.volume)) payload.volume = Math.max(0, Math.min(1, saved.volume));
      if (typeof saved?.muted === "boolean") payload.muted = saved.muted;
      if (REPEAT_MODES.includes(saved?.repeat)) payload.repeat = saved.repeat;
      if (typeof saved?.shuffle === "boolean") payload.shuffle = saved.shuffle;
      if (Number.isInteger(saved?.resets)) resetGen.current = saved.resets;
      const position = JSON.parse(window.localStorage.getItem(POSITION_KEY) || "null");
      if (
        typeof position?.trackId === "string" &&
        Number.isFinite(position.time) &&
        Number.isFinite(position.duration) &&
        position.time > 1 &&
        position.time < position.duration - 2
      ) {
        payload.resume = {
          trackId: position.trackId,
          time: position.time,
          duration: position.duration
        };
      }
    } catch {
      // ignore corrupt storage
    }
    dispatch({ type: "hydrate", payload });
  }, []);

  // A tab that sees a newer "Reset demo data" count (resetGen, saved with the player
  // state) goes back to the defaults instead of saving its old queue over them.
  const applyReset = useCallback((generation) => {
    resetGen.current = generation;
    wantPlay.current = false;
    const audio = audioRef.current;
    if (audio) {
      audio.pause();
      audio.currentTime = 0;
    }
    dispatch({ type: "hydrate", payload: DEFAULTS });
  }, []);

  // Save only what changed in this tab, merged into the latest saved state: another
  // tab may have moved on (e.g. picked a new track), and an idle tab toggling mute
  // mustn't put its old queue back.
  const lastSaved = useRef(null);
  useEffect(() => {
    if (!hydrated) return;
    const current = { queue, index, volume, muted, repeat, shuffle };
    const previous = lastSaved.current;
    lastSaved.current = current;
    const changed = previous
      ? Object.fromEntries(
          Object.entries(current).filter(([key, value]) => value !== previous[key])
        )
      : current;
    // The index only means something together with its queue.
    if ("queue" in changed || "index" in changed) Object.assign(changed, { queue, index });
    if (!Object.keys(changed).length) return;
    // A different track was picked here (not the restore on load): it starts from the
    // beginning, so any saved position is obsolete, and this tab now owns playback.
    const trackChanged =
      previous !== null && previous.queue[previous.index]?.id !== queue[index]?.id;
    if (trackChanged) ownsPosition.current = true;
    withPlayerLock(() => {
      const stored = readPlayerState();
      // Another tab reset the demo since this one loaded: adopt it, don't write back.
      if ((stored.value?.resets || 0) > resetGen.current) {
        applyReset(stored.value.resets);
        return;
      }
      // An unreadable saved value is replaced with this tab's full state.
      const next = stored.valid ? { ...stored.value, ...changed } : current;
      try {
        window.localStorage.setItem(
          STORAGE_KEY,
          JSON.stringify({ ...next, resets: resetGen.current })
        );
        if (trackChanged) window.localStorage.removeItem(POSITION_KEY);
      } catch {
        // storage unavailable
      }
    });
  }, [hydrated, queue, index, volume, muted, repeat, shuffle, applyReset]);

  // Playing or seeking here makes this tab's track the one to come back to: the first
  // time, save its queue and place in it too, so the saved track and the saved
  // playback position always belong together.
  const claimPlayback = useCallback(() => {
    if (ownsPosition.current) return;
    ownsPosition.current = true;
    const { queue: q, index: i } = live.current;
    withPlayerLock(() => {
      const stored = readPlayerState();
      if ((stored.value?.resets || 0) > resetGen.current) return; // a reset elsewhere wins
      try {
        window.localStorage.setItem(
          STORAGE_KEY,
          JSON.stringify({ ...stored.value, queue: q, index: i, resets: resetGen.current })
        );
      } catch {
        // storage unavailable
      }
    });
  }, []);

  // Moves a restored position that hasn't been applied yet (the track isn't
  // loaded), and saves it so a reload keeps it too.
  const setResumeTime = useCallback(
    (time) => {
      const pending = live.current.resume;
      if (!pending) return;
      const next = { ...pending, time, explicit: true }; // chosen by the user
      live.current = { ...live.current, resume: next }; // seen by handlers before re-render
      dispatch({ type: "resume/set", time });
      claimPlayback();
      writePosition(next);
    },
    [claimPlayback]
  );

  // Where the current track is: the restored position until the track loads.
  const currentPosition = useCallback(
    () => live.current.resume?.time ?? audioRef.current?.currentTime ?? 0,
    []
  );

  const restartTrack = useCallback(() => {
    if (live.current.resume) setResumeTime(0);
    else if (audioRef.current) audioRef.current.currentTime = 0;
  }, [setResumeTime]);

  const advance = useCallback(
    (direction, { fromEnded = false } = {}) => {
      const audio = audioRef.current;
      const { queue: q, index: i, repeat: r, shuffle: s } = live.current;
      if (!q.length) return;
      if (fromEnded && r === "one" && audio) {
        audio.currentTime = 0;
        startAudio(audio).catch(() => {});
        return;
      }
      if (direction < 0 && currentPosition() > 3) {
        restartTrack();
        return;
      }
      let nextIndex;
      if (s && q.length > 1) {
        const sh = shuffleState.current;
        if (direction < 0) {
          const previous = sh.history.pop();
          if (previous === undefined) {
            restartTrack();
            return;
          }
          sh.order?.unshift(i);
          nextIndex = previous;
        } else {
          if (sh.order && !sh.order.length) {
            // Every track has played once: stop unless repeating (or the user pressed next).
            if (fromEnded && r !== "all") {
              wantPlay.current = false;
              return;
            }
            sh.order = null;
          }
          if (!sh.order) sh.order = shuffledIndices(q.length, i);
          sh.history.push(i);
          nextIndex = sh.order.shift();
        }
      } else {
        nextIndex = i + direction;
        if (nextIndex >= q.length || nextIndex < 0) {
          if (r === "all" || !fromEnded) nextIndex = (nextIndex + q.length) % q.length;
          else {
            wantPlay.current = false;
            return;
          }
        }
      }
      wantPlay.current = fromEnded || wantPlay.current || !audio?.paused;
      if (nextIndex === i) {
        // Only one entry in the queue: restart it instead of a no-op jump.
        restartTrack();
        if (audio && wantPlay.current) startAudio(audio).catch(() => {});
        return;
      }
      dispatch({ type: "jump", index: nextIndex });
    },
    [currentPosition, restartTrack]
  );

  // Wire audio element events once.
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    let lastSaved = 0;
    let restoring = false;
    const savePosition = () => {
      if (!ownsPosition.current) return;
      const pending = live.current.resume;
      const trackId = loadedTrackId.current;
      lastSaved = Date.now();
      // Not resumed yet: the restored position (possibly moved) still stands.
      if (pending) writePosition(pending);
      else if (trackId && audio.readyState >= 1) {
        writePosition({ trackId, time: audio.currentTime, duration: audio.duration || 0 });
      }
    };
    const onTime = () => {
      setProgress((p) => ({ ...p, currentTime: audio.currentTime }));
      if (Date.now() - lastSaved > 5000) savePosition();
    };
    const onMeta = () => {
      // Continue where the last visit left off (once, for the track it was saved for).
      const pending = live.current.resume;
      if (pending?.trackId === loadedTrackId.current) {
        // A saved position right at the end would just end the track; a spot the
        // user picked (seek, restart) always applies.
        if (pending.explicit || pending.time < audio.duration - 2) {
          restoring = true; // this seek isn't the user's: don't claim the position
          audio.currentTime = Math.min(pending.time, audio.duration || pending.time);
        }
        live.current = { ...live.current, resume: null }; // applied: seek normally from now on
        dispatch({ type: "resume/clear" });
      }
      setProgress((p) => ({
        ...p,
        currentTime: audio.currentTime,
        duration: audio.duration || 0
      }));
    };
    const onHide = () => {
      if (document.visibilityState === "hidden") savePosition();
    };
    const onBuffer = () => {
      const b = audio.buffered;
      if (b.length) setProgress((p) => ({ ...p, buffered: b.end(b.length - 1) }));
    };
    const onReset = () => setProgress({ currentTime: 0, duration: 0, buffered: 0 });
    const onPlay = () => {
      claimPlayback();
      setIsPlaying(true);
    };
    const onSeeked = () => {
      if (restoring) {
        restoring = false;
        return;
      }
      claimPlayback();
      savePosition();
    };
    const onStorage = (e) => {
      // Another tab saved a newer position: it owns playback progress now.
      if (e.key === POSITION_KEY) ownsPosition.current = false;
      if (e.key === STORAGE_KEY) {
        const saved = readPlayerState().value;
        const resets = saved?.resets || 0;
        if (resets > resetGen.current) applyReset(resets);
        // Another tab picked a different track: this tab's position no longer
        // matches the saved track, so stop saving it (until it plays or seeks again).
        const { queue: q, index: i } = live.current;
        if (
          saved &&
          (saved.index !== i || !Array.isArray(saved.queue) || !sameQueue(saved.queue, q))
        ) {
          ownsPosition.current = false;
        }
      }
    };
    const onPause = () => {
      setIsPlaying(false);
      savePosition();
    };
    const onEnded = () => advance(1, { fromEnded: true });
    const onError = () => {
      setIsPlaying(false);
      if (!wantPlay.current) return; // nobody asked for this track to play yet
      wantPlay.current = false;
      const title = live.current.queue[live.current.index]?.title;
      toast.error(
        `Couldn't play ${title ? `“${title}”` : "this track"}. Check your connection, then press play to try again.`,
        { id: "player-error" }
      );
    };
    const events = [
      ["timeupdate", onTime],
      ["loadedmetadata", onMeta],
      ["durationchange", onMeta],
      ["progress", onBuffer],
      ["emptied", onReset],
      ["play", onPlay],
      ["pause", onPause],
      ["ended", onEnded],
      ["error", onError],
      ["seeked", onSeeked]
    ];
    events.forEach(([name, fn]) => audio.addEventListener(name, fn));
    window.addEventListener("pagehide", savePosition);
    window.addEventListener("storage", onStorage);
    document.addEventListener("visibilitychange", onHide);
    return () => {
      events.forEach(([name, fn]) => audio.removeEventListener(name, fn));
      window.removeEventListener("pagehide", savePosition);
      window.removeEventListener("storage", onStorage);
      document.removeEventListener("visibilitychange", onHide);
    };
  }, [advance, applyReset, claimPlayback]);

  // Load the current track. Keyed by track identity as well as URL: different
  // tracks can share a sample file, and switching between them must restart.
  const trackId = track?.id;
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !src) return;
    const trackChanged = loadedTrackId.current !== trackId;
    loadedTrackId.current = trackId;
    if (audio.getAttribute("src") !== src) {
      audio.setAttribute("src", src);
      audio.load();
    } else if (trackChanged && audio.currentTime > 0) {
      audio.currentTime = 0;
    }
    if (wantPlay.current) startAudio(audio).catch(() => setIsPlaying(false));
  }, [trackId, src]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.volume = volume;
    audio.muted = muted;
  }, [volume, muted]);

  const play = useCallback(() => {
    wantPlay.current = true;
    if (audioRef.current) startAudio(audioRef.current).catch(() => setIsPlaying(false));
  }, []);

  const pause = useCallback(() => {
    wantPlay.current = false;
    audioRef.current?.pause();
  }, []);

  const togglePlay = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    if (audio.paused) play();
    else pause();
  }, [play, pause]);

  // A manually picked entry counts as played for shuffle and is never picked again
  // as "next" in the same pass.
  const noteManualSelection = useCallback((to) => {
    const { index: from } = live.current;
    const sh = shuffleState.current;
    // Start the shuffle pass here if needed so both the previous and the picked
    // entries count as played (an empty remainder then means the pass is over).
    if (!sh.order) sh.order = shuffledIndices(live.current.queue.length, from);
    if (from !== to) sh.history.push(from);
    sh.order = sh.order.filter((i) => i !== to);
  }, []);

  // Play `track`; pass `queue` to replace the queue (e.g. "play this album").
  // Calling it with the current track toggles play/pause (adopting `queue` if given),
  // so every play/pause button can simply call playTrack.
  const playTrack = useCallback(
    (nextTrack, nextQueue) => {
      const { queue: q, index: i } = live.current;
      // An equivalent queue is kept as-is so shuffle history isn't reset.
      const queueArg = nextQueue?.length && !sameQueue(nextQueue, q) ? nextQueue : undefined;
      if (q[i]?.id === nextTrack.id) {
        if (queueArg) dispatch({ type: "play", track: nextTrack, queue: queueArg });
        togglePlay();
        return;
      }
      if (!queueArg) {
        const target = q.findIndex((t) => t.id === nextTrack.id);
        if (target >= 0) noteManualSelection(target);
      }
      wantPlay.current = true;
      dispatch({ type: "play", track: nextTrack, queue: queueArg });
    },
    [togglePlay, noteManualSelection]
  );

  // Start `nextQueue` at `startIndex` and make sure it plays (never toggles off),
  // e.g. "Play all" on an album whose first track is already playing.
  const playQueue = useCallback(
    (nextQueue, startIndex = 0) => {
      if (!nextQueue?.length) return;
      const start = nextQueue[Math.min(Math.max(0, startIndex), nextQueue.length - 1)];
      const { queue: q, index: i } = live.current;
      const same = sameQueue(nextQueue, q);
      if (same && q[i]?.id !== start.id) noteManualSelection(q.findIndex((t) => t.id === start.id));
      wantPlay.current = true;
      dispatch({ type: "play", track: start, queue: same ? undefined : nextQueue });
      if (q[i]?.id === start.id) play();
    },
    [play, noteManualSelection]
  );

  const seek = useCallback(
    (seconds) => {
      const audio = audioRef.current;
      if (!audio || !Number.isFinite(seconds)) return;
      const pending = live.current.resume;
      if (pending) {
        // Not loaded yet: move the restored position instead (applied once it loads).
        setResumeTime(Math.max(0, Math.min(seconds, pending.duration)));
        return;
      }
      const duration = Number.isFinite(audio.duration) ? audio.duration : seconds;
      audio.currentTime = Math.max(0, Math.min(seconds, duration));
      setProgress((p) => ({ ...p, currentTime: audio.currentTime }));
    },
    [setResumeTime]
  );

  const seekBy = useCallback((delta) => seek(currentPosition() + delta), [seek, currentPosition]);

  const setVolume = useCallback((v) => dispatch({ type: "volume", volume: v }), []);

  // The Media Session follows whatever plays: the music, or a video that took over.
  const showMusicSession = useCallback(
    (current) =>
      setMediaSession(
        {
          title: current.title,
          artist: current.artist,
          album: current.albumName || "Projct Music",
          artwork: current.cover ? [{ src: current.cover, sizes: "300x300" }] : []
        },
        { play, pause, nexttrack: () => advance(1), previoustrack: () => advance(-1) }
      ),
    [play, pause, advance]
  );
  // While a video owns the OS controls, watch for it leaving the page (another page,
  // a closed pop-up): then the controls go back to the current track.
  const videoWatch = useRef(null);
  const stopWatchingVideo = useCallback(() => {
    videoWatch.current?.disconnect();
    videoWatch.current = null;
  }, []);
  const showVideoSession = useCallback(
    (video) => {
      setMediaSession(
        {
          title: video.getAttribute("aria-label") || document.title,
          artist: "Projct Music",
          artwork: video.poster ? [{ src: video.poster }] : []
        },
        {
          play: () => (video.isConnected ? video.play().catch(() => {}) : play()),
          pause: () => (video.isConnected ? video.pause() : pause()),
          nexttrack: null,
          previoustrack: null
        }
      );
      stopWatchingVideo();
      const observer = new MutationObserver(() => {
        if (video.isConnected) return;
        stopWatchingVideo();
        const current = live.current.queue[live.current.index];
        if (current) showMusicSession(current);
      });
      observer.observe(document.body, { childList: true, subtree: true });
      videoWatch.current = observer;
    },
    [play, pause, showMusicSession, stopWatchingVideo]
  );
  useEffect(() => stopWatchingVideo, [stopWatchingVideo]);

  // Only one thing plays at a time: the music starting pauses any playing video,
  // and a video starting pauses the music ("play" doesn't bubble, so capture it).
  useEffect(() => {
    const audio = audioRef.current;
    const onMediaPlay = (e) => {
      const el = e.target;
      if (!(el instanceof HTMLMediaElement)) return;
      lastMedia.current = el;
      if (el === audio) {
        document.querySelectorAll("video").forEach((video) => {
          if (!video.paused) video.pause();
        });
        stopWatchingVideo();
        const current = live.current.queue[live.current.index];
        if (current) showMusicSession(current);
        return;
      }
      if (audio && !audio.paused) {
        wantPlay.current = false;
        audio.pause();
      }
      if (el instanceof HTMLVideoElement) showVideoSession(el);
    };
    document.addEventListener("play", onMediaPlay, true);
    return () => document.removeEventListener("play", onMediaPlay, true);
  }, [showMusicSession, showVideoSession, stopWatchingVideo]);

  // Show the current track in the OS controls, unless a video playing on the page
  // owns them.
  useEffect(() => {
    if (!track) return;
    const media = lastMedia.current;
    if (media instanceof HTMLVideoElement && media.isConnected && !media.paused) return;
    showMusicSession(track);
  }, [track, showMusicSession]);

  const value = useMemo(
    () => ({
      track,
      queue,
      index,
      isPlaying,
      volume,
      muted,
      repeat,
      shuffle,
      play,
      pause,
      togglePlay,
      playTrack,
      playQueue,
      next: () => advance(1),
      prev: () => advance(-1),
      seek,
      seekBy,
      setVolume,
      toggleMute: () => dispatch({ type: "mute" }),
      // Back to the initial queue and settings (used by "Reset demo data").
      reset: () => {
        // Stop right away; publish the new reset count under the save lock.
        applyReset(resetGen.current);
        withPlayerLock(() => {
          const resets = Math.max(readPlayerState().value?.resets || 0, resetGen.current) + 1;
          resetGen.current = resets;
          try {
            window.localStorage.removeItem(POSITION_KEY);
            const { resume, ...persisted } = DEFAULTS;
            window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...persisted, resets }));
          } catch {
            // storage unavailable
          }
        });
      },
      cycleRepeat: () => dispatch({ type: "repeat" }),
      toggleShuffle: () => dispatch({ type: "shuffle" }),
      enqueue: (t) => dispatch({ type: "enqueue", track: t }),
      jumpTo: (i) => {
        noteManualSelection(i);
        wantPlay.current = true;
        dispatch({ type: "jump", index: i });
      },
      removeFromQueue: (id) => dispatch({ type: "remove", id }),
      // The video the user was last watching (still on the page), so keyboard
      // shortcuts can control it instead of the music.
      activeVideo: () => {
        const el = lastMedia.current;
        return el instanceof HTMLVideoElement && el.isConnected ? el : null;
      },
      isCurrent: (id) => track?.id === id,
      isTrackPlaying: (id) => track?.id === id && isPlaying
    }),
    [
      applyReset,
      track,
      queue,
      index,
      isPlaying,
      volume,
      muted,
      repeat,
      shuffle,
      play,
      pause,
      togglePlay,
      playTrack,
      playQueue,
      noteManualSelection,
      advance,
      seek,
      seekBy,
      setVolume
    ]
  );

  // Until the track loads, the progress bar shows where it will resume.
  const shownProgress = useMemo(
    () =>
      resume && resume.trackId === trackId && !progress.duration
        ? { currentTime: resume.time, duration: resume.duration, buffered: 0 }
        : progress,
    [progress, resume, trackId]
  );

  return (
    <PlayerContext.Provider value={value}>
      <ProgressContext.Provider value={shownProgress}>
        {children}
        <audio ref={audioRef} preload="none" className="hidden" />
      </ProgressContext.Provider>
    </PlayerContext.Provider>
  );
}

export function usePlayer() {
  const ctx = useContext(PlayerContext);
  if (!ctx) throw new Error("usePlayer must be used inside <PlayerProvider>");
  return ctx;
}

// Separate context so only progress bars re-render on every `timeupdate`.
export function usePlayerProgress() {
  return useContext(ProgressContext);
}
