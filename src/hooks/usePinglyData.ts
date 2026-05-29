import { useCallback, useEffect, useState } from "react";
import {
  createPin,
  deletePin,
  deleteAccount,
  followUser,
  getBootstrap,
  pullUp,
  reactToMemory,
  reportTarget,
  sendDm,
  unfollowUser,
  uploadMemory
} from "../services/api";
import type { BootstrapPayload, Memory, Pin, VibeStreak } from "../types";

type CreatePinInput = {
  title: string;
  area: string;
  category?: string;
  startsAt?: string;
  latitude?: number;
  longitude?: number;
};

export function usePinglyData() {
  const [data, setData] = useState<BootstrapPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const payload = await getBootstrap();
      setData(payload);
      setError(null);
    } catch (refreshError) {
      setError(refreshError instanceof Error ? refreshError.message : "Could not load Pin");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const addPin = useCallback(async (input: CreatePinInput) => {
    const pin = await createPin(input);
    setData((current) => (current ? { ...current, pins: [...current.pins, pin] } : current));
    return pin;
  }, []);

  const removePin = useCallback(async (pinId: string) => {
    await deletePin(pinId);
    setData((current) =>
      current
        ? {
            ...current,
            pins: current.pins.filter((pin) => pin.id !== pinId),
            memories: current.memories.filter((memory) => memory.pinId !== pinId)
          }
        : current
    );
  }, []);

  const markPullingUp = useCallback(async (pinId: string) => {
    const result = await pullUp(pinId);
    setData((current) =>
      current
        ? {
            ...current,
            pins: current.pins.map((pin) =>
              pin.id === pinId ? { ...pin, pullingUp: result.pullingUp } : pin
            )
          }
        : current
    );
    return result;
  }, []);

  const addMemory = useCallback(async (pinId: string) => {
    const memory = await uploadMemory({ pinId });
    setData((current) =>
      current
        ? {
            ...current,
            memories: [...current.memories, memory],
            pins: current.pins.map((pin) => (pin.id === pinId ? { ...pin, hasMemories: true } : pin))
          }
        : current
    );
    return memory;
  }, []);

  const sendReaction = useCallback(async (memory: Memory, emoji: string) => {
    const result = await reactToMemory(memory.id, emoji);
    setData((current) => {
      if (!current) return current;
      const nextStreak: VibeStreak = result.streak || current.streak;
      return {
        ...current,
        memories: current.memories.map((item) =>
          item.id === memory.id ? { ...item, reacted: true } : item
        ),
        streak: nextStreak
      };
    });
    return result.streak;
  }, []);

  const follow = useCallback(async (memory: Memory) => {
    if (!memory.ownerId) return;
    await followUser(memory.ownerId);
    setData((current) =>
      current
        ? {
            ...current,
            memories: current.memories.map((item) =>
              item.ownerId === memory.ownerId ? { ...item, followed: true } : item
            )
          }
        : current
    );
  }, []);

  const unfollow = useCallback(async (userId: string) => {
    await unfollowUser(userId);
    setData((current) =>
      current
        ? {
            ...current,
            memories: current.memories.map((item) =>
              item.ownerId === userId ? { ...item, followed: false } : item
            )
          }
        : current
    );
  }, []);

  const report = useCallback(async (targetType: "pin" | "memory" | "user", targetId: string, reason: string) => {
    await reportTarget({ targetType, targetId, reason });
    if (targetType === "pin") {
      setData((current) =>
        current
          ? {
              ...current,
              pins: current.pins.map((pin) => (pin.id === targetId ? { ...pin, unsafe: true } : pin))
            }
          : current
      );
    }
  }, []);

  const closeAccount = useCallback(async () => {
    await deleteAccount();
    setData((current) =>
      current
        ? { ...current, user: { ...current.user, deletedAt: new Date().toISOString() } }
        : current
    );
  }, []);

  const sendMessage = useCallback(async (toUserId: string, body: string) => {
    const message = await sendDm({ toUserId, body });
    setData((current) =>
      current ? { ...current, dms: [...current.dms, message] } : current
    );
    return message;
  }, []);

  return {
    data,
    loading,
    error,
    refresh,
    addPin,
    removePin,
    markPullingUp,
    addMemory,
    sendReaction,
    follow,
    unfollow,
    report,
    sendMessage,
    closeAccount
  };
}
