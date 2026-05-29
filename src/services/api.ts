import { Platform } from "react-native";
import { memories as fallbackMemories, pins as fallbackPins } from "../data/mockData";
import type { BootstrapPayload, DirectMessage, Memory, Pin, VibeStreak } from "../types";

const API_BASE =
  process.env.EXPO_PUBLIC_API_URL ||
  (Platform.OS === "android" ? "http://10.0.2.2:3101" : "http://127.0.0.1:3101");

const fallbackBootstrap: BootstrapPayload = {
  user: {
    id: "user-current",
    handle: "nairobiuser",
    displayName: "Nairobi User",
    ageVerified: true,
    deletedAt: null
  },
  pins: fallbackPins,
  memories: fallbackMemories,
  notifications: [
    {
      id: "notification-local-1",
      userId: "user-current",
      type: "reaction",
      title: "🔥 8 reactions",
      body: "Westlands rooftop is heating up.",
      read: false,
      createdAt: new Date().toISOString()
    }
  ],
  dms: [
    {
      id: "dm-local-1",
      fromUserId: "user-nia",
      toUserId: "user-current",
      body: "Pulling up?",
      createdAt: new Date().toISOString()
    }
  ],
  streak: {
    days: 4,
    expiresAt: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000).toISOString(),
    status: "Both reacted"
  }
};

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: "Bearer dev-token",
      ...options?.headers
    }
  });
  const body = await response.json();
  if (!response.ok) {
    throw new Error(body.error || "Pin API request failed");
  }
  return body as T;
}

export async function getBootstrap(): Promise<BootstrapPayload> {
  try {
    return await request<BootstrapPayload>("/api/bootstrap");
  } catch {
    return fallbackBootstrap;
  }
}

export async function createPin(input: {
  title: string;
  area: string;
  category?: string;
  startsAt?: string;
  latitude?: number;
  longitude?: number;
}): Promise<Pin> {
  return request<Pin>("/api/pins", {
    method: "POST",
    body: JSON.stringify(input)
  });
}

export async function deletePin(pinId: string): Promise<{ ok: boolean }> {
  return request<{ ok: boolean }>(`/api/pins/${pinId}`, {
    method: "DELETE"
  });
}

export async function signUp(input: {
  handle: string;
  displayName?: string;
  ageVerified: boolean;
}) {
  return request("/api/auth/signup", {
    method: "POST",
    body: JSON.stringify(input)
  });
}

export async function logIn(handle: string) {
  return request("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ handle })
  });
}

export async function logOut() {
  return request("/api/auth/logout", { method: "POST" });
}

export async function pullUp(pinId: string): Promise<{ ok: boolean; pullingUp: number }> {
  return request<{ ok: boolean; pullingUp: number }>(`/api/pins/${pinId}/pull-up`, { method: "POST" });
}

export async function uploadMemory(input: {
  pinId: string;
  mediaUrl?: string | null;
}): Promise<Memory> {
  return request<Memory>("/api/memories", {
    method: "POST",
    body: JSON.stringify(input)
  });
}

export async function reactToMemory(memoryId: string, emoji: string): Promise<{ streak: VibeStreak }> {
  return request<{ streak: VibeStreak }>(`/api/memories/${memoryId}/reactions`, {
    method: "POST",
    body: JSON.stringify({ emoji })
  });
}

export async function followUser(userId: string): Promise<{ ok: boolean; mutual: boolean }> {
  return request<{ ok: boolean; mutual: boolean }>(`/api/users/${userId}/follow`, {
    method: "POST"
  });
}

export async function unfollowUser(userId: string): Promise<{ ok: boolean }> {
  return request<{ ok: boolean }>(`/api/users/${userId}/follow`, {
    method: "DELETE"
  });
}

export async function reportTarget(input: {
  targetType: "pin" | "memory" | "user";
  targetId: string;
  reason: string;
}) {
  return request("/api/reports", {
    method: "POST",
    body: JSON.stringify(input)
  });
}

export async function blockUser(userId: string) {
  return request("/api/blocks", {
    method: "POST",
    body: JSON.stringify({ userId })
  });
}

export async function sendDm(input: { toUserId: string; body: string }): Promise<DirectMessage> {
  return request<DirectMessage>("/api/dms", {
    method: "POST",
    body: JSON.stringify(input)
  });
}

export async function deleteAccount() {
  return request("/api/account", { method: "DELETE" });
}
