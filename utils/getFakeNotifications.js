const S3 = "https://s3.amazonaws.com/projctmusic.com";

// Seed activity feed. `label` is a fixed display string (keeps SSR/CSR identical);
// notifications created at runtime use an ISO `at` instead.
export const DEFAULT_NOTIFICATIONS = [
  {
    id: "n1",
    type: "follow",
    actor: "Little Simz",
    image: `${S3}/little_simz_500x500_4944914752144939467.jpg`,
    text: "followed you",
    href: "/artists/little-simz",
    label: "2 minutes ago",
    read: false
  },
  {
    id: "n2",
    type: "friend",
    actor: "Smino",
    image: `${S3}/smino_500x500_3314714878444994791.jpg`,
    text: "accepted your friend request",
    href: "/artists/smino",
    label: "3 hours ago",
    read: false
  },
  {
    id: "n3",
    type: "message",
    text: "You have a new message in your inbox",
    highlight: "new message",
    action: "chat",
    label: "1 day ago",
    read: false
  },
  {
    id: "n4",
    type: "gift",
    text: "We have sent you a gift. Check your rewards in your profile.",
    highlight: "gift",
    href: "/profile?tab=rewards",
    label: "15 September 2022",
    read: true
  },
  {
    id: "n5",
    type: "shop",
    text: "New hat available from Projct Music",
    highlight: "New hat",
    href: "/shop?category=hats",
    label: "21 October 2022",
    read: true
  }
];
