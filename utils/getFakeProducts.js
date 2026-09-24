import { getMusics } from "./getFakeTracks";
import { getEvents } from "./getFakeEvents";
import { creditPack } from "../lib/pricing";

export const CATEGORIES = [
  { slug: "credits", label: "Credits", icon: "coins" },
  { slug: "subscriptions", label: "Subscriptions", icon: "pencil" },
  { slug: "vip", label: "VIP", icon: "crown" },
  { slug: "packages", label: "Packages", icon: "bag" },
  { slug: "t-shirts", label: "T-shirts", icon: "shirt" },
  { slug: "hats", label: "Hats", icon: "cap" },
  { slug: "cds", label: "CDs", icon: "disc" },
  { slug: "vinyl", label: "Vinyl", icon: "record" },
  { slug: "downloads", label: "Downloads", icon: "download" },
  { slug: "tickets", label: "Tickets", icon: "ticket" },
  { slug: "accessories", label: "Accessories", icon: "sparkles" },
  { slug: "exclusive", label: "Exclusive", icon: "star" }
];

const slugify = (text) =>
  String(text)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
const image = (name) => `/shop/${name}.webp`;
const periods = ["1 year", "6 months", "3 months", "1 month", "1 week", "1 day"];
const tierPrices = [99, 59, 35, 14, 5, 2];
const durationTiers = (factor = 1) =>
  periods.map((label, index) => ({
    id: slugify(label),
    label,
    price: tierPrices[index] * factor,
    credits: tierPrices[index] * factor * 100
  }));
const planTiers = (factor = 1) => [
  ...["Basic", "Premium", "Custom"].map((label, index) => ({
    id: slugify(label),
    label,
    price: (index + 1) * 39 * factor,
    credits: (index + 1) * 3900 * factor
  })),
  ...durationTiers(factor)
];

function merch(name, category, photo, price, extra = {}) {
  return {
    id: slugify(name),
    name,
    category,
    kind: "merch",
    price,
    credits: Math.round(price * 100),
    images: [image(photo)],
    description:
      "Made for days in the studio and nights out. An everyday essential from the Projct Music collection, selected for its distinctive finish and easy feel. Ships in recyclable packaging.",
    ...extra
  };
}

function digital(id, name, category, description, tiers) {
  return {
    id,
    name,
    category,
    kind: "digital",
    images: ["/shop/digital.svg"],
    description,
    price: tiers[0].price,
    credits: tiers[0].credits,
    tiers,
    featured: true
  };
}

export function getProducts() {
  const shirts = [
    merch("Truth Studios T-shirt", "t-shirts", "truth-tee", 24.99, {
      featured: true,
      sizes: ["XS", "S", "M", "L", "XL", "XXL"],
      colors: ["Black"],
      images: [image("truth-tee"), image("truth-tee-detail")],
      description:
        "The original Truth Studios graphic, in full color on a soft black cotton tee. A relaxed unisex fit, ribbed crew neck, and screen-printed front. Wear the sound. Wash cold, inside out; hang to dry."
    }),
    ...[
      "Studio Type",
      "Wild Session",
      "World Tour",
      "Palm Springs",
      "Signature",
      "Night Shapes",
      "Good Times",
      "Paisley Session"
    ].map((name, index) =>
      merch(`${name} T-shirt`, "t-shirts", `tee-${index + 1}`, 28 + index * 2, {
        sizes: ["S", "M", "L", "XL"],
        colors: [index === 2 ? "Red" : index > 3 ? "Black" : "White"]
      })
    )
  ];
  const hats = [
    merch("Static Snapback", "hats", "static-cap", 59.99, { featured: true }),
    merch("Color Frequency Cap", "hats", "color-cap", 39),
    merch("Studio Pom Beanie", "hats", "beanie", 28),
    ...[
      "Leather Patch",
      "Blue Note",
      "Winter Session",
      "All Stars",
      "Tropical",
      "Sunset Knit",
      "Denim Session",
      "Seafoam"
    ].map((name, index) =>
      merch(`${name} ${index === 5 ? "Beanie" : "Cap"}`, "hats", `hat-${index + 1}`, 24 + index * 3)
    )
  ];
  const accessories = [
    merch("Blue Double Keeper Belt", "accessories", "blue-belt", 79, {
      sizes: ["S", "M", "L"],
      colors: ["Blue"]
    }),
    merch("Leather Wrap Bracelet", "accessories", "leather-bracelet", 32),
    merch("Studio Leather Cuff", "accessories", "black-cuff", 29),
    merch("Silver Skull Ring", "accessories", "skull-ring", 45, {
      sizes: ["6", "7", "8", "9", "10"]
    }),
    merch("Check Bow Tie", "accessories", "check-bow-tie", 35),
    merch("Boxed Leather Wallet", "accessories", "boxed-wallet", 65),
    merch("Winter Trapper", "accessories", "trapper", 48),
    merch("Woven Studio Scarf", "accessories", "accessory-8", 39),
    merch("Cognac Leather Belt", "accessories", "accessory-5", 59, { sizes: ["S", "M", "L"] })
  ];
  const creditPacks = [2000, 500, 1000, 5000, 10000, 25000].map((amount) => {
    const { price } = creditPack(amount);
    return {
      ...digital(
        `credits-${amount}`,
        `${amount.toLocaleString("en-US")} Credits`,
        "credits",
        "Top up your Projct Music balance. Use credits for music, merchandise, tickets, and membership passes. Credits are added to your account as soon as your demo purchase is complete.",
        [
          {
            id: `${amount}`,
            label: `${amount.toLocaleString("en-US")} credits`,
            price,
            credits: null,
            grantsCredits: amount
          }
        ]
      ),
      grantsCredits: amount
    };
  });
  const memberships = [
    digital(
      "premium-subscription",
      "Premium Subscription",
      "subscriptions",
      "Make more room for music. Premium brings full-length listening, curated releases, and early access to new sessions for your selected membership period.",
      planTiers()
    ),
    digital(
      "studio-subscription",
      "Studio Subscription",
      "subscriptions",
      "A closer look inside Truth Studios. Explore behind-the-scenes sessions, producer notes, and the studio archive with your selected pass.",
      durationTiers()
    ),
    digital(
      "vip-unlimited",
      "VIP Unlimited",
      "vip",
      "Your backstage pass to Projct Music. Get premium listening, exclusive sessions, and priority access to selected studio events for the duration of your pass.",
      planTiers(2)
    ),
    digital(
      "unlimited-pack",
      "Unlimited Pack",
      "packages",
      "The complete Projct Music experience: premium listening, the download collection, and VIP access together in one pass.",
      planTiers(3)
    ),
    digital(
      "discovery-pack",
      "Discovery Pack",
      "packages",
      "Find your next favorite. A handpicked collection of independent releases and studio sessions, with a listening pass to keep exploring.",
      planTiers()
    ),
    digital(
      "unlimited-downloads",
      "Unlimited Downloads",
      "downloads",
      "Take the music with you. Download the Projct Music catalog in high-quality audio during your selected pass. Downloads are yours to keep for personal listening.",
      durationTiers()
    )
  ];
  const albums = getMusics()
    .slice(0, 6)
    .flatMap((album, index) =>
      ["vinyl", "cds"].map((category) => ({
        id: `${category}-${album.id}`,
        name: `${album.name} — ${category === "vinyl" ? "Vinyl" : "CD"}`,
        category,
        kind: "merch",
        price: category === "vinyl" ? 29 + index * 2 : 12 + index,
        credits: category === "vinyl" ? 2900 + index * 200 : 1200 + index * 100,
        images: [album.img_url],
        artist: album.artist,
        albumId: album.id,
        description: `${album.name} by ${album.artist}. ${category === "vinyl" ? "Pressed on heavyweight vinyl with a printed inner sleeve." : "The complete album on compact disc with a printed booklet."} A physical edition for your collection.`,
        featured: index === 0
      }))
    );
  const tickets = getEvents().map((event, index) => ({
    id: `ticket-${event.id || slugify(event.title)}`,
    eventId: String(event.id || slugify(event.title)),
    name: `${event.title} — Ticket`,
    category: "tickets",
    kind: "ticket",
    // Same cart line and prices as the Events page ("Get tickets").
    cartId: `ticket:${event.id}`,
    price: event.price,
    credits: event.credits,
    tiers: event.tiers.map((tier) => ({
      id: tier.name.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
      label: tier.name,
      price: tier.price,
      credits: tier.credits
    })),
    images: [image("ticket")],
    description: `One general admission ticket to ${event.title}. ${event.address?.[0] || event.venue || "Truth Studios"}. Your demo ticket is saved with your purchase.`,
    subtitle: `${event.month}/${event.day}/${event.year} · ${event.time}`
  }));
  const exclusive = [
    merch("Truth Studios Vol. 1 Limited Edition", "exclusive", "limited-edition", 59.99, {
      featured: true,
      description:
        "The Truth Studios collection in a limited collector's edition. Full-color artwork, exclusive liner notes, and the sounds that started it all."
    }),
    merch("Studio Collector Box", "exclusive", "boxed-wallet", 99, {
      description:
        "A boxed leather wallet from the studio collection, presented in a natural wood keepsake box. A limited release for collectors."
    })
  ];
  return [
    shirts[0],
    hats[0],
    creditPacks[0],
    exclusive[0],
    ...shirts.slice(1),
    ...hats.slice(1),
    ...accessories,
    ...creditPacks.slice(1),
    ...memberships,
    ...albums,
    ...tickets,
    exclusive[1]
  ].map((product, index) => ({
    ...product,
    featured: Boolean(product.featured),
    addedAt: `2026-09-${String(23 - (index % 22)).padStart(2, "0")}`
  }));
}

export function getProductById(id) {
  return getProducts().find((product) => product.id === id) || null;
}

export function getProductsByCategory(category) {
  return getProducts().filter((product) => product.category === category);
}

export function getRelatedProducts(productOrId, limit = 8) {
  const product = typeof productOrId === "string" ? getProductById(productOrId) : productOrId;
  if (!product) return [];
  return getProducts()
    .filter((item) => item.id !== product.id)
    .sort(
      (a, b) => Number(b.category === product.category) - Number(a.category === product.category)
    )
    .slice(0, limit);
}
