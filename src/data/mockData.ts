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
    reactions: ["🔥", "🎵", "😍"]
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
    reactions: ["😋", "✨", "🥂"]
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
    reactions: ["🎮", "🔥", "😄"]
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
    reactions: []
  }
];

export const memories: Memory[] = [
  {
    id: "zuri-feed",
    owner: "Zuri",
    age: "12m",
    audience: "feed",
    mutual: false,
    followed: false
  },
  {
    id: "nia-following",
    owner: "Nia",
    age: "2d",
    audience: "following",
    mutual: true,
    followed: true
  }
];
