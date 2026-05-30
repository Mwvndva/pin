import { colors } from "../theme";
import type { Memory, Pin } from "../types";

export const pins: Pin[] = [
  {
    id: "westlands-rooftop",
    title: "Westlands rooftop",
    area: "Westlands",
    category: "Live music",
    time: "Tonight, 8:00 PM",
    interested: 48,
    pullingUp: 48,
    color: colors.accent.yellow,
    unsafe: false,
    hasMemories: true,
    reactions: ["\u{1F525}", "\u{1F3B5}", "\u{1F60D}"],
    reactionCounts: { "\u{1F525}": 8, "\u{1F3B5}": 5, "\u{1F60D}": 3 },
    userReaction: null,
    audience: "friends"
  },
  {
    id: "kilimani-brunch",
    title: "Kilimani brunch",
    area: "Kilimani",
    category: "Food",
    time: "Today, 11:30 AM",
    interested: 22,
    pullingUp: 22,
    color: colors.accent.pink,
    unsafe: false,
    hasMemories: true,
    reactions: ["\u{1F60B}", "\u2728", "\u{1F942}"],
    reactionCounts: { "\u{1F60B}": 6, "\u2728": 4, "\u{1F942}": 2 },
    userReaction: null,
    audience: "public"
  },
  {
    id: "cbd-games",
    title: "CBD games night",
    area: "CBD",
    category: "Games",
    time: "Tonight, 7:00 PM",
    interested: 17,
    pullingUp: 17,
    color: colors.accent.green,
    unsafe: false,
    hasMemories: true,
    reactions: ["\u{1F3AE}", "\u{1F525}", "\u{1F604}"],
    reactionCounts: { "\u{1F3AE}": 3, "\u{1F525}": 4, "\u{1F604}": 2 },
    userReaction: null,
    audience: "public"
  },
  {
    id: "ngong-popup",
    title: "Ngong Road pop-up",
    area: "Ngong Road",
    category: "Pop-up",
    time: "Tomorrow, 4:00 PM",
    interested: 9,
    pullingUp: 9,
    color: colors.accent.purple,
    unsafe: true,
    hasMemories: false,
    reactions: [],
    reactionCounts: { "\u{1F62C}": 1 },
    userReaction: "\u{1F62C}",
    audience: "friends"
  }
];

export const memories: Memory[] = [
  {
    id: "zuri-feed",
    owner: "Zuri",
    age: "12m",
    audience: "feed",
    mutual: false,
    followed: false,
    friendStatus: "none"
  },
  {
    id: "nia-following",
    owner: "Nia",
    age: "6h",
    audience: "friends",
    mutual: true,
    followed: true,
    friendStatus: "friends"
  }
];
