import { buildAlbumTracks } from "./albumTracks";

// First albums of the catalog, used to fill the player before anything is picked.
// Kept separate from getFakeTracks.js so the global player does not pull the whole catalog.
const DEFAULT_ALBUMS = [
  {
    id: "2W5VVBPNkGAduaArE4sX29",
    name: "Celestial",
    artist: "Ed Sheeran",
    img_url: "https://i.scdn.co/image/ab67616d00001e02c18194a4022ec44507f7b248",
    totalTracks: 1
  },
  {
    id: "1BDj5lr0KVcSQpSNdyqJct",
    name: "This Is Why",
    artist: "Paramore",
    img_url: "https://i.scdn.co/image/ab67616d00001e0294bd724b5ac47de78be093fd",
    totalTracks: 1
  },
  {
    id: "4fu0jN1IzoaXgzCfqdjOjJ",
    name: "I GOT ISSUES",
    artist: "YG",
    img_url: "https://i.scdn.co/image/ab67616d00001e028ea070f7c32c70e6c411642e",
    totalTracks: 14
  },
  {
    id: "0m9hqW0RDEHPNXxhiFUGSq",
    name: "uh oh",
    artist: "Tate McRae",
    img_url: "https://i.scdn.co/image/ab67616d00001e023d0cdc5c7c52338a5a92cec9",
    totalTracks: 1
  },
  {
    id: "0AtlEQ56o0yKOd9qM1EBp0",
    name: "Body Paint",
    artist: "Arctic Monkeys",
    img_url: "https://i.scdn.co/image/ab67616d00001e028187cf1b141898d7c7d04d1a",
    totalTracks: 2
  },
  {
    id: "7ug0WdvzC2sLXTrtHUwNsj",
    name: "Cool It Down",
    artist: "Yeah Yeah Yeahs",
    img_url: "https://i.scdn.co/image/ab67616d00001e02667ca33e4b6d8e74b17a6529",
    totalTracks: 8
  },
  {
    id: "5YLmrfqNRJK66Gl4QVLwHW",
    name: "La Última Misión",
    artist: "Wisin & Yandel",
    img_url: "https://i.scdn.co/image/ab67616d00001e0223d16c92a1a279ce0bbb92f6",
    totalTracks: 21
  },
  {
    id: "7pQNyq4BKpuLhiTURjzR2a",
    name: "Barstool Whiskey Wonderland",
    artist: "Adam Doleac",
    img_url: "https://i.scdn.co/image/ab67616d00001e02cceb24c53b7fa77bf23210a4",
    totalTracks: 18
  },
  {
    id: "1nP2b8dTaVUvvAOyRbDoBe",
    name: "Stop Breathing",
    artist: "Roddy Ricch",
    img_url: "https://i.scdn.co/image/ab67616d00001e0259030e70585a7b645b544df9",
    totalTracks: 1
  },
  {
    id: "4aW4iDepQUl5ZCHd1Gli68",
    name: "Entergalactic",
    artist: "Kid Cudi",
    img_url: "https://i.scdn.co/image/ab67616d00001e0271cecf4c653a4bad539da13d",
    totalTracks: 15
  },
  {
    id: "4czheDpc6NZXB8Fp0YiQ77",
    name: "Better Thangs",
    artist: "Ciara, Summer Walker",
    img_url: "https://i.scdn.co/image/ab67616d00001e0255772cfa0e82a56b0383319d",
    totalTracks: 1
  },
  {
    id: "3a2NKD0RDfoAlr8lNTZzJq",
    name: "Ashley McBryde Presents: Lindeville",
    artist: "Ashley McBryde",
    img_url: "https://i.scdn.co/image/ab67616d00001e02c93aba3c9aaeadcc696e5ec6",
    totalTracks: 13
  }
];

export const DEFAULT_QUEUE = DEFAULT_ALBUMS.map((album) => buildAlbumTracks(album)[0]);
