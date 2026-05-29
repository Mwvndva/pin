export type AppTab = "Pins" | "Memories" | "Settings";

export type ThemeMode = "dark" | "light";

export type AppTheme = {
  shell: string;
  panel: string;
  panel2: string;
  line: string;
  text: string;
  muted: string;
};

export type Pin = {
  id: string;
  creatorId?: string;
  title: string;
  area: string;
  category: string;
  time: string;
  startsAt?: string;
  expiresAt?: string;
  interested: number;
  pullingUp?: number;
  color: string;
  unsafe: boolean;
  hasMemories: boolean;
  reactions: string[];
  latitude?: number;
  longitude?: number;
};

export type Memory = {
  id: string;
  ownerId?: string;
  pinId?: string;
  owner: string;
  age: string;
  audience: "feed" | "following";
  mutual: boolean;
  followed: boolean;
  reacted?: boolean;
  mediaUrl?: string | null;
};

export type PinglyUser = {
  id: string;
  handle: string;
  displayName: string;
  ageVerified: boolean;
  deletedAt?: string | null;
};

export type PinglyNotification = {
  id: string;
  userId: string;
  type: string;
  title: string;
  body: string;
  read: boolean;
  createdAt: string;
};

export type DirectMessage = {
  id: string;
  fromUserId: string;
  toUserId: string;
  body: string;
  createdAt: string;
};

export type VibeStreak = {
  days: number;
  expiresAt: string | null;
  status: string;
};

export type BootstrapPayload = {
  user: PinglyUser;
  pins: Pin[];
  memories: Memory[];
  notifications: PinglyNotification[];
  dms: DirectMessage[];
  streak: VibeStreak;
};
