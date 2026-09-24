const S3 = "https://s3.amazonaws.com/projctmusic.com";

// Seed conversations for the single-user demo. `time` labels are fixed strings so
// server and client renders match; messages sent at runtime carry an ISO `at`.
export const DEFAULT_CHATS = [
  {
    id: "andrew-spencer",
    name: "Andrew Spencer",
    avatar: `${S3}/asher_roth_retro_hash_500x500_1522414729771570328.jpg`,
    online: true,
    unread: 3,
    messages: [
      { id: "m1", from: "them", text: "Yo! Loved the new mix you posted.", time: "23:31" },
      { id: "m2", from: "me", text: "Thanks man, still tweaking the low end.", time: "23:35" },
      { id: "m3", from: "them", text: "Hi! How are you?", time: "23:42" }
    ]
  },
  {
    id: "danielle-lim",
    name: "Danielle Lim",
    avatar: `${S3}/kelsey_lu_500x500_8923114767191121302.jpg`,
    online: true,
    unread: 2,
    messages: [
      { id: "m1", from: "them", text: "Are you coming to the Truth Studios party?", time: "21:02" },
      { id: "m2", from: "them", text: "Hi! Have you seen my message?", time: "21:23" }
    ]
  },
  {
    id: "john-snow",
    name: "John Snow",
    avatar: `${S3}/chance_the_rapper_will_star_in_suspense_thriller_musicsnake_500x500_8810514877976907216.jpg`,
    online: false,
    unread: 4,
    messages: [
      { id: "m1", from: "me", text: "Sent you the stems for the remix.", time: "17:55" },
      { id: "m2", from: "them", text: "Got them, sounding crazy already", time: "18:02" },
      { id: "m3", from: "them", text: "Hi! Have you seen my message?", time: "18:20" }
    ]
  },
  {
    id: "michael-fernando",
    name: "Michael Fernando",
    avatar: `${S3}/daniel_caesar_2_500x500_1765814868823448735.jpg`,
    online: false,
    unread: 1,
    messages: [
      { id: "m1", from: "me", text: "Can we finish the session this week?", time: "15 Sep" },
      { id: "m2", from: "them", text: "No, probably it takes a lot of time", time: "15 Sep" }
    ]
  },
  {
    id: "asher-roth",
    name: "Asher Roth",
    avatar: `${S3}/joey_purp_500x500_9547114865041342796.jpg`,
    online: true,
    unread: 2,
    messages: [
      { id: "m1", from: "me", text: "We still on for Friday?", time: "12 Sep" },
      { id: "m2", from: "them", text: "yes, ofc man :)", time: "12 Sep" }
    ]
  }
];

export const CHAT_REPLIES = [
  "Haha for real 🔥",
  "Let me check and get back to you.",
  "Sounds good, see you at the studio!",
  "Send me the link when it's up.",
  "That track is crazy, on repeat all day.",
  "Deal. Talk soon!"
];
