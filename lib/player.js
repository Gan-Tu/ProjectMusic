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
import { getAudioSrc } from "./media";
import { DEFAULT_QUEUE } from "../utils/defaultQueue";

// Global audio player. The <audio> element lives here (rendered once in _app) so
// playback continues across page navigations.
//
// Track shape: { id, title, artist, cover, albumId?, albumName?, duration?, src? }
// `src` is optional; tracks without one get a deterministic sample file.

// v2: tracks use canonical album-track ids (v1 queues are discarded).
const STORAGE_KEY = "pm-player-v2";
const DEFAULTS = { queue: DEFAULT_QUEUE, index: 0, volume: 0.7, repeat: "off", shuffle: false };
const REPEAT_MODES = ["off", "all", "one"];

// All queue indices except `exclude`, in random order (Fisher-Yates).
function shuffledIndices(length, exclude) {
  const order = Array.from({ length }, (_, i) => i).filter((i) => i !== exclude);
  for (let i = order.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [order[i], order[j]] = [order[j], order[i]];
  }
  return order;
}

const PlayerContext = createContext(null);
const ProgressContext = createContext({ currentTime: 0, duration: 0, buffered: 0 });

function playerReducer(state, action) {
  switch (action.type) {
    case "hydrate":
      return { ...state, ...action.payload, hydrated: true };
    case "volume":
      return { ...state, volume: Math.max(0, Math.min(1, action.volume)) };
    case "repeat":
      return {
        ...state,
        repeat: REPEAT_MODES[(REPEAT_MODES.indexOf(state.repeat) + 1) % REPEAT_MODES.length]
      };
    case "shuffle":
      return { ...state, shuffle: !state.shuffle };
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

export function PlayerProvider({ children }) {
  const audioRef = useRef(null);
  const [{ queue, index, volume, repeat, shuffle, hydrated }, dispatch] = useReducer(
    playerReducer,
    { ...DEFAULTS, hydrated: false }
  );
  const [isPlaying, setIsPlaying] = useState(false);
  const [muted, setMuted] = useState(false);
  const [progress, setProgress] = useState({ currentTime: 0, duration: 0, buffered: 0 });

  const wantPlay = useRef(false);
  const lastMedia = useRef(null); // the element that most recently started playing
  // Shuffle bookkeeping: `order` holds the indices still to play (null = not started),
  // `history` the ones already played (for "previous"). Reset with the queue/mode.
  const shuffleState = useRef({ order: null, history: [] });
  useEffect(() => {
    shuffleState.current = { order: null, history: [] };
  }, [queue, shuffle]);
  const live = useRef({ queue, index, repeat, shuffle });
  useEffect(() => {
    live.current = { queue, index, repeat, shuffle };
  }, [queue, index, repeat, shuffle]);

  const track = queue[index] || null;
  const src = track ? track.src || getAudioSrc(track.id) : null;

  // Restore the last session (queue, position in queue, volume) without autoplaying.
  useEffect(() => {
    const payload = {};
    try {
      const saved = JSON.parse(window.localStorage.getItem(STORAGE_KEY) || "null");
      if (saved?.queue?.length) {
        payload.queue = saved.queue;
        payload.index = Math.min(saved.index || 0, saved.queue.length - 1);
      }
      if (typeof saved?.volume === "number") payload.volume = saved.volume;
      if (REPEAT_MODES.includes(saved?.repeat)) payload.repeat = saved.repeat;
      if (typeof saved?.shuffle === "boolean") payload.shuffle = saved.shuffle;
    } catch {
      // ignore corrupt storage
    }
    dispatch({ type: "hydrate", payload });
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      window.localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ queue, index, volume, repeat, shuffle })
      );
    } catch {
      // storage unavailable
    }
  }, [hydrated, queue, index, volume, repeat, shuffle]);

  const advance = useCallback((direction, { fromEnded = false } = {}) => {
    const audio = audioRef.current;
    const { queue: q, index: i, repeat: r, shuffle: s } = live.current;
    if (!q.length) return;
    if (fromEnded && r === "one" && audio) {
      audio.currentTime = 0;
      audio.play().catch(() => {});
      return;
    }
    if (direction < 0 && audio && audio.currentTime > 3) {
      audio.currentTime = 0;
      return;
    }
    let nextIndex;
    if (s && q.length > 1) {
      const sh = shuffleState.current;
      if (direction < 0) {
        const previous = sh.history.pop();
        if (previous === undefined) {
          if (audio) audio.currentTime = 0;
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
      if (audio) {
        audio.currentTime = 0;
        if (wantPlay.current) audio.play().catch(() => {});
      }
      return;
    }
    dispatch({ type: "jump", index: nextIndex });
  }, []);

  // Wire audio element events once.
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    const onTime = () => setProgress((p) => ({ ...p, currentTime: audio.currentTime }));
    const onMeta = () => setProgress((p) => ({ ...p, duration: audio.duration || 0 }));
    const onBuffer = () => {
      const b = audio.buffered;
      if (b.length) setProgress((p) => ({ ...p, buffered: b.end(b.length - 1) }));
    };
    const onReset = () => setProgress({ currentTime: 0, duration: 0, buffered: 0 });
    const onPlay = () => setIsPlaying(true);
    const onPause = () => setIsPlaying(false);
    const onEnded = () => advance(1, { fromEnded: true });
    const events = [
      ["timeupdate", onTime],
      ["loadedmetadata", onMeta],
      ["durationchange", onMeta],
      ["progress", onBuffer],
      ["emptied", onReset],
      ["play", onPlay],
      ["pause", onPause],
      ["ended", onEnded]
    ];
    events.forEach(([name, fn]) => audio.addEventListener(name, fn));
    return () => events.forEach(([name, fn]) => audio.removeEventListener(name, fn));
  }, [advance]);

  // Only one thing plays at a time: the music starting pauses any playing video,
  // and a video starting pauses the music ("play" doesn't bubble, so capture it).
  useEffect(() => {
    const audio = audioRef.current;
    const onMediaPlay = (e) => {
      const el = e.target;
      if (el instanceof HTMLMediaElement) lastMedia.current = el;
      if (el === audio) {
        document.querySelectorAll("video").forEach((video) => {
          if (!video.paused) video.pause();
        });
      } else if (el instanceof HTMLMediaElement && audio && !audio.paused) {
        wantPlay.current = false;
        audio.pause();
      }
    };
    document.addEventListener("play", onMediaPlay, true);
    return () => document.removeEventListener("play", onMediaPlay, true);
  }, []);

  // Load the current track. Keyed by track identity as well as URL: different
  // tracks can share a sample file, and switching between them must restart.
  const trackId = track?.id;
  const loadedTrackId = useRef(null);
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
    if (wantPlay.current) audio.play().catch(() => setIsPlaying(false));
  }, [trackId, src]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.volume = volume;
    audio.muted = muted;
  }, [volume, muted]);

  const play = useCallback(() => {
    wantPlay.current = true;
    audioRef.current?.play().catch(() => setIsPlaying(false));
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
      if (q[i]?.id === nextTrack.id) {
        if (nextQueue?.length) dispatch({ type: "play", track: nextTrack, queue: nextQueue });
        togglePlay();
        return;
      }
      if (!nextQueue) {
        const target = q.findIndex((t) => t.id === nextTrack.id);
        if (target >= 0) noteManualSelection(target);
      }
      wantPlay.current = true;
      dispatch({ type: "play", track: nextTrack, queue: nextQueue });
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
      wantPlay.current = true;
      dispatch({ type: "play", track: start, queue: nextQueue });
      if (q[i]?.id === start.id) play();
    },
    [play]
  );

  const seek = useCallback((seconds) => {
    const audio = audioRef.current;
    if (!audio || !Number.isFinite(seconds)) return;
    const duration = Number.isFinite(audio.duration) ? audio.duration : seconds;
    audio.currentTime = Math.max(0, Math.min(seconds, duration));
    setProgress((p) => ({ ...p, currentTime: audio.currentTime }));
  }, []);

  const seekBy = useCallback((delta) => seek((audioRef.current?.currentTime || 0) + delta), [seek]);

  const setVolume = useCallback((v) => {
    dispatch({ type: "volume", volume: v });
    setMuted(false);
  }, []);

  // Media Session: OS / headphone controls and lock-screen artwork.
  useEffect(() => {
    if (!track || typeof navigator === "undefined" || !("mediaSession" in navigator)) return;
    try {
      navigator.mediaSession.metadata = new window.MediaMetadata({
        title: track.title,
        artist: track.artist,
        album: track.albumName || "Projct Music",
        artwork: track.cover ? [{ src: track.cover, sizes: "300x300" }] : []
      });
      navigator.mediaSession.setActionHandler("play", play);
      navigator.mediaSession.setActionHandler("pause", pause);
      navigator.mediaSession.setActionHandler("nexttrack", () => advance(1));
      navigator.mediaSession.setActionHandler("previoustrack", () => advance(-1));
    } catch {
      // Media Session is best-effort.
    }
  }, [track, play, pause, advance]);

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
      toggleMute: () => setMuted((m) => !m),
      // Back to the initial queue and settings (used by "Reset demo data").
      reset: () => {
        pause();
        if (audioRef.current) audioRef.current.currentTime = 0;
        setMuted(false);
        dispatch({ type: "hydrate", payload: DEFAULTS });
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

  return (
    <PlayerContext.Provider value={value}>
      <ProgressContext.Provider value={progress}>
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
