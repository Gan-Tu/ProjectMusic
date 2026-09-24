// Album grids ship only each album's first track; the full tracklist comes from
// /api/public/albums/[id] when an album is played.

const cache = new Map();

export function loadAlbumTracks(albumId) {
  if (!cache.has(albumId)) {
    const request = fetch(`/api/public/albums/${encodeURIComponent(albumId)}`)
      .then((response) => (response.ok ? response.json() : Promise.reject(response.status)))
      .then((data) => data.tracks);
    request.catch(() => cache.delete(albumId)); // retry next time
    cache.set(albumId, request);
  }
  return cache.get(albumId);
}

// Plays an album from its card: starts right away with the tracks at hand (inside the
// click, so browsers allow the audio), then swaps in the full tracklist.
export function playAlbum(player, album) {
  const known = album.tracks || [];
  if (!known.length) return;
  // The album is already the queue (e.g. its full tracklist): plain play / pause.
  if (player.isCurrent(known[0].id) && player.queue.every((t) => t.albumId === album.id)) {
    player.togglePlay();
    return;
  }
  player.playTrack(known[0], known);
  if (known.length >= album.totalTracks) return;
  loadAlbumTracks(album.id)
    .then((tracks) => {
      if (tracks?.length > known.length) player.adoptQueue(tracks, known);
    })
    .catch(() => {});
}
