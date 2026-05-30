const http = require("node:http");
const { randomUUID } = require("node:crypto");
const { URL } = require("node:url");

const PORT = Number(process.env.PORT || 3101);

const now = new Date();
const hoursFromNow = (hours) => new Date(now.getTime() + hours * 60 * 60 * 1000).toISOString();

const db = {
  users: [
    { id: "user-current", handle: "nairobiuser", displayName: "Nairobi User", ageVerified: true, deletedAt: null },
    { id: "user-zuri", handle: "zuri", displayName: "Zuri", ageVerified: true, deletedAt: null },
    { id: "user-nia", handle: "nia", displayName: "Nia", ageVerified: true, deletedAt: null },
    { id: "user-amani", handle: "amani", displayName: "Amani", ageVerified: true, deletedAt: null }
  ],
  sessions: [{ token: "dev-token", userId: "user-current", expiresAt: hoursFromNow(24 * 30) }],
  follows: [
    { followerId: "user-current", followingId: "user-nia" },
    { followerId: "user-nia", followingId: "user-current" },
    { followerId: "user-amani", followingId: "user-current" },
    { followerId: "user-current", followingId: "user-amani" }
  ],
  pins: [
    {
      id: "westlands-rooftop",
      creatorId: "user-nia",
      title: "Westlands rooftop",
      area: "Westlands",
      category: "Live music",
      startsAt: hoursFromNow(3),
      expiresAt: hoursFromNow(24),
      interested: 48,
      color: "#ffcc00",
      unsafe: false,
      latitude: -1.264,
      longitude: 36.803,
      audience: "friends",
      hasMemories: true
    },
    {
      id: "kilimani-brunch",
      creatorId: "user-zuri",
      title: "Kilimani brunch",
      area: "Kilimani",
      category: "Food",
      startsAt: hoursFromNow(6),
      expiresAt: hoursFromNow(24),
      interested: 22,
      color: "#f45bb8",
      unsafe: false,
      latitude: -1.292,
      longitude: 36.787,
      audience: "public",
      hasMemories: true
    },
    {
      id: "cbd-games",
      creatorId: "user-amani",
      title: "CBD games night",
      area: "CBD",
      category: "Games",
      startsAt: hoursFromNow(5),
      expiresAt: hoursFromNow(24),
      interested: 17,
      color: "#a8ff4f",
      unsafe: false,
      latitude: -1.286,
      longitude: 36.817,
      audience: "public",
      hasMemories: true
    },
    {
      id: "ngong-popup",
      creatorId: "user-current",
      title: "Ngong Road pop-up",
      area: "Ngong Road",
      category: "Pop-up",
      startsAt: hoursFromNow(22),
      expiresAt: hoursFromNow(24),
      interested: 9,
      color: "#6017e8",
      unsafe: true,
      latitude: -1.302,
      longitude: 36.75,
      audience: "friends",
      hasMemories: false
    }
  ],
  memories: [
    { id: "zuri-feed", ownerId: "user-zuri", pinId: "kilimani-brunch", audience: "feed", createdAt: new Date(now.getTime() - 12 * 60 * 1000).toISOString(), mediaUrl: null },
    { id: "nia-friends", ownerId: "user-nia", pinId: "westlands-rooftop", audience: "friends", createdAt: new Date(now.getTime() - 6 * 60 * 60 * 1000).toISOString(), mediaUrl: null }
  ],
  reactions: [
    { id: "reaction-1", userId: "user-current", memoryId: "nia-friends", emoji: "🔥", createdAt: now.toISOString() }
  ],
  pinReactions: [
    { id: "pin-reaction-1", userId: "user-nia", pinId: "westlands-rooftop", emoji: "\u{1F525}", createdAt: now.toISOString() },
    { id: "pin-reaction-2", userId: "user-zuri", pinId: "westlands-rooftop", emoji: "\u{1F3B5}", createdAt: now.toISOString() },
    { id: "pin-reaction-3", userId: "user-current", pinId: "ngong-popup", emoji: "\u{1F62C}", createdAt: now.toISOString() }
  ],
  pullUps: [],
  reports: [],
  blocks: [],
  notifications: [
    { id: "notif-1", userId: "user-current", type: "reaction", title: "🔥 8 reactions", body: "Westlands rooftop is heating up.", read: false, createdAt: now.toISOString() },
    { id: "notif-2", userId: "user-current", type: "follow", title: "New follow", body: "Amani followed you back.", read: false, createdAt: now.toISOString() }
  ],
  dms: [
    { id: "dm-1", fromUserId: "user-nia", toUserId: "user-current", body: "Pulling up?", createdAt: now.toISOString() }
  ],
  streaks: [
    { id: "streak-1", userAId: "user-current", userBId: "user-nia", days: 4, lastMutualReactionAt: now.toISOString(), expiresAt: hoursFromNow(24 * 5) }
  ]
};

function send(res, status, body) {
  res.writeHead(status, {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Access-Control-Allow-Methods": "GET,POST,PATCH,DELETE,OPTIONS"
  });
  res.end(JSON.stringify(body));
}

function readJson(req) {
  return new Promise((resolve, reject) => {
    let raw = "";
    req.on("data", (chunk) => {
      raw += chunk;
    });
    req.on("end", () => {
      if (!raw) {
        resolve({});
        return;
      }
      try {
        resolve(JSON.parse(raw));
      } catch (error) {
        reject(error);
      }
    });
  });
}

function currentUser() {
  return db.users.find((user) => user.id === "user-current");
}

function isMutual(userAId, userBId) {
  return (
    db.follows.some((follow) => follow.followerId === userAId && follow.followingId === userBId) &&
    db.follows.some((follow) => follow.followerId === userBId && follow.followingId === userAId)
  );
}

function formatAge(createdAt) {
  const minutes = Math.max(1, Math.floor((Date.now() - new Date(createdAt).getTime()) / 60000));
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;
  return `${Math.floor(hours / 24)}d`;
}

function pinReactionSummary(pinId) {
  return db.pinReactions
    .filter((reaction) => reaction.pinId === pinId)
    .reduce((summary, reaction) => {
      summary[reaction.emoji] = (summary[reaction.emoji] || 0) + 1;
      return summary;
    }, {});
}

function serializePin(pin) {
  const reactions = db.reactions
    .filter((reaction) => db.memories.some((memory) => memory.pinId === pin.id && memory.id === reaction.memoryId))
    .map((reaction) => reaction.emoji);
  const reactionCounts = pinReactionSummary(pin.id);
  const userReaction =
    db.pinReactions.find((reaction) => reaction.pinId === pin.id && reaction.userId === currentUser().id)?.emoji ||
    null;
  const pinReactionEmojis = Object.keys(reactionCounts);
  const pullingUp = db.pullUps.filter((pullUp) => pullUp.pinId === pin.id).length || pin.pullingUp || pin.interested;
  return {
    ...pin,
    pullingUp,
    time: new Date(pin.startsAt).toLocaleString("en-US", { weekday: "short", hour: "numeric", minute: "2-digit" }),
    reactions: pinReactionEmojis.length ? pinReactionEmojis : reactions.length ? reactions : ["\u{1F525}", "\u{1F3B5}", "\u{1F60D}"],
    reactionCounts,
    userReaction
  };
}

function serializeMemory(memory) {
  const owner = db.users.find((user) => user.id === memory.ownerId);
  const userId = currentUser().id;
  const friends = isMutual(userId, memory.ownerId);
  return {
    ...memory,
    owner: owner?.displayName || "Unknown",
    age: formatAge(memory.createdAt),
    audience: memory.audience === "following" ? "friends" : memory.audience,
    mutual: friends,
    followed: friends,
    friendStatus: friends
      ? "friends"
      : db.follows.some((follow) => follow.followerId === userId && follow.followingId === memory.ownerId)
        ? "pending"
        : "none",
    reacted: db.reactions.some((reaction) => reaction.userId === userId && reaction.memoryId === memory.id)
  };
}

function getPrimaryStreak() {
  const userId = currentUser().id;
  const streak = db.streaks.find((item) => item.userAId === userId || item.userBId === userId);
  if (!streak) return { days: 0, expiresAt: null, status: "No mutual streak yet" };
  const expired = new Date(streak.expiresAt).getTime() < Date.now();
  return {
    days: expired ? 0 : streak.days,
    expiresAt: streak.expiresAt,
    status: expired ? "Streak expired" : "Mutual reaction counted"
  };
}

function bootstrap() {
  const activePinIds = new Set(
    db.pins.filter((pin) => new Date(pin.expiresAt).getTime() > Date.now()).map((pin) => pin.id)
  );
  return {
    user: currentUser(),
    pins: db.pins.filter((pin) => new Date(pin.expiresAt).getTime() > Date.now()).map(serializePin),
    memories: db.memories
      .filter((memory) => activePinIds.has(memory.pinId) && Date.now() - new Date(memory.createdAt).getTime() < 24 * 60 * 60 * 1000)
      .map(serializeMemory),
    notifications: db.notifications.filter((notification) => notification.userId === currentUser().id),
    dms: db.dms.filter((dm) => dm.fromUserId === currentUser().id || dm.toUserId === currentUser().id),
    streak: getPrimaryStreak()
  };
}

function publicUser(user) {
  if (!user) return null;
  return {
    id: user.id,
    handle: user.handle,
    displayName: user.displayName,
    ageVerified: user.ageVerified,
    deletedAt: user.deletedAt
  };
}

async function handle(req, res) {
  if (req.method === "OPTIONS") {
    send(res, 204, {});
    return;
  }

  const url = new URL(req.url, `http://${req.headers.host}`);
  const path = url.pathname;

  try {
    if (req.method === "GET" && path === "/health") {
      send(res, 200, { ok: true, service: "pin-api" });
      return;
    }

    if (req.method === "GET" && path === "/api/bootstrap") {
      send(res, 200, bootstrap());
      return;
    }

    if (req.method === "POST" && path === "/api/auth/signup") {
      const body = await readJson(req);
      const handle = String(body.handle || "").trim().replace(/^@/, "").toLowerCase();
      if (!handle || handle.length < 3) {
        send(res, 400, { error: "Handle must be at least 3 characters." });
        return;
      }
      if (db.users.some((user) => user.handle === handle)) {
        send(res, 409, { error: "Handle is already taken." });
        return;
      }
      const user = {
        id: randomUUID(),
        handle,
        displayName: String(body.displayName || handle),
        ageVerified: Boolean(body.ageVerified),
        deletedAt: null
      };
      const token = randomUUID();
      db.users.push(user);
      db.sessions.push({ token, userId: user.id, expiresAt: hoursFromNow(24 * 30) });
      send(res, 201, { user: publicUser(user), token });
      return;
    }

    if (req.method === "POST" && path === "/api/auth/login") {
      const body = await readJson(req);
      const handle = String(body.handle || "").trim().replace(/^@/, "").toLowerCase();
      const user = db.users.find((item) => item.handle === handle && !item.deletedAt);
      if (!user) {
        send(res, 404, { error: "User not found." });
        return;
      }
      const token = randomUUID();
      db.sessions.push({ token, userId: user.id, expiresAt: hoursFromNow(24 * 30) });
      send(res, 200, { user: publicUser(user), token });
      return;
    }

    if (req.method === "POST" && path === "/api/auth/logout") {
      send(res, 200, { ok: true });
      return;
    }

    if (req.method === "POST" && path === "/api/pins") {
      const body = await readJson(req);
      const existing = db.pins.find((pin) => pin.creatorId === currentUser().id && new Date(pin.expiresAt).getTime() > Date.now());
      if (existing) {
        send(res, 409, { error: "Only one active pin is allowed per user." });
        return;
      }
      const pin = {
        id: randomUUID(),
        creatorId: currentUser().id,
        title: String(body.title || "Untitled pin"),
        area: String(body.area || "Nairobi"),
        category: String(body.category || "Pop-up"),
        startsAt: body.startsAt || new Date().toISOString(),
        expiresAt: body.expiresAt || hoursFromNow(24),
        interested: 1,
        color: body.color || "#ffcc00",
        unsafe: false,
        latitude: Number(body.latitude || -1.286),
        longitude: Number(body.longitude || 36.817),
        audience: body.audience === "public" ? "public" : "friends",
        hasMemories: false
      };
      db.pins.push(pin);
      send(res, 201, serializePin(pin));
      return;
    }

    if (req.method === "DELETE" && path.match(/^\/api\/pins\/[^/]+$/)) {
      const pinId = path.split("/")[3];
      const pinIndex = db.pins.findIndex((pin) => pin.id === pinId);
      if (pinIndex === -1) {
        send(res, 404, { error: "Pin not found." });
        return;
      }
      if (db.pins[pinIndex].creatorId !== currentUser().id) {
        send(res, 403, { error: "Only the pin creator can delete this pin." });
        return;
      }

      const deletedMemoryIds = db.memories
        .filter((memory) => memory.pinId === pinId)
        .map((memory) => memory.id);
      db.pins.splice(pinIndex, 1);
      db.memories = db.memories.filter((memory) => memory.pinId !== pinId);
      db.reactions = db.reactions.filter((reaction) => !deletedMemoryIds.includes(reaction.memoryId));
      db.pinReactions = db.pinReactions.filter((reaction) => reaction.pinId !== pinId);
      db.pullUps = db.pullUps.filter((pullUp) => pullUp.pinId !== pinId);
      db.reports = db.reports.filter((report) => report.targetId !== pinId);
      send(res, 200, { ok: true });
      return;
    }

    if (req.method === "POST" && path.match(/^\/api\/pins\/[^/]+\/pull-up$/)) {
      const pinId = path.split("/")[3];
      const existing = db.pullUps.find((pullUp) => pullUp.pinId === pinId && pullUp.userId === currentUser().id);
      if (!existing) {
        db.pullUps.push({ id: randomUUID(), pinId, userId: currentUser().id, createdAt: new Date().toISOString() });
      }
      const pin = db.pins.find((item) => item.id === pinId);
      const pullingUp = db.pullUps.filter((pullUp) => pullUp.pinId === pinId).length || pin?.pullingUp || pin?.interested || 0;
      send(res, 200, { ok: true, pullingUp });
      return;
    }

    if (req.method === "POST" && path.match(/^\/api\/pins\/[^/]+\/reactions$/)) {
      const pinId = path.split("/")[3];
      const body = await readJson(req);
      const pin = db.pins.find((item) => item.id === pinId);
      if (!pin) {
        send(res, 404, { error: "Pin not found." });
        return;
      }

      const emoji = String(body.emoji || "\u{1F525}");
      const existing = db.pinReactions.find(
        (reaction) => reaction.pinId === pinId && reaction.userId === currentUser().id
      );
      if (existing) {
        existing.emoji = emoji;
        existing.createdAt = new Date().toISOString();
      } else {
        db.pinReactions.push({
          id: randomUUID(),
          pinId,
          userId: currentUser().id,
          emoji,
          createdAt: new Date().toISOString()
        });
      }

      const reactionCounts = pinReactionSummary(pinId);
      send(res, 200, {
        ok: true,
        reactions: Object.keys(reactionCounts),
        reactionCounts,
        userReaction: emoji
      });
      return;
    }

    if (req.method === "POST" && path === "/api/memories") {
      const body = await readJson(req);
      const memory = {
        id: randomUUID(),
        ownerId: currentUser().id,
        pinId: String(body.pinId || "westlands-rooftop"),
        audience: body.audience === "public" ? "feed" : "friends",
        createdAt: new Date().toISOString(),
        mediaUrl: body.mediaUrl || null
      };
      db.memories.push(memory);
      const pin = db.pins.find((item) => item.id === memory.pinId);
      if (pin) pin.hasMemories = true;
      send(res, 201, serializeMemory(memory));
      return;
    }

    if (req.method === "POST" && path.match(/^\/api\/memories\/[^/]+\/reactions$/)) {
      const memoryId = path.split("/")[3];
      const body = await readJson(req);
      const memory = db.memories.find((item) => item.id === memoryId);
      if (!memory) {
        send(res, 404, { error: "Memory not found." });
        return;
      }
      const existing = db.reactions.find((reaction) => reaction.memoryId === memoryId && reaction.userId === currentUser().id);
      if (existing) {
        send(res, 409, { error: "User already reacted to this memory." });
        return;
      }
      const reaction = {
        id: randomUUID(),
        memoryId,
        userId: currentUser().id,
        emoji: String(body.emoji || "🔥"),
        createdAt: new Date().toISOString()
      };
      db.reactions.push(reaction);
      if (isMutual(currentUser().id, memory.ownerId)) {
        let streak = db.streaks.find(
          (item) =>
            [item.userAId, item.userBId].includes(currentUser().id) &&
            [item.userAId, item.userBId].includes(memory.ownerId)
        );
        if (!streak) {
          streak = { id: randomUUID(), userAId: currentUser().id, userBId: memory.ownerId, days: 0, lastMutualReactionAt: null, expiresAt: null };
          db.streaks.push(streak);
        }
        streak.days += 1;
        streak.lastMutualReactionAt = reaction.createdAt;
        streak.expiresAt = hoursFromNow(24 * 5);
      }
      send(res, 201, { reaction, streak: getPrimaryStreak() });
      return;
    }

    if (req.method === "POST" && path.match(/^\/api\/users\/[^/]+\/follow$/)) {
      const followingId = path.split("/")[3];
      if (!db.follows.some((follow) => follow.followerId === currentUser().id && follow.followingId === followingId)) {
        db.follows.push({ followerId: currentUser().id, followingId });
      }
      send(res, 200, { ok: true, mutual: isMutual(currentUser().id, followingId) });
      return;
    }

    if (req.method === "DELETE" && path.match(/^\/api\/users\/[^/]+\/follow$/)) {
      const followingId = path.split("/")[3];
      db.follows = db.follows.filter(
        (follow) => !(follow.followerId === currentUser().id && follow.followingId === followingId)
      );
      send(res, 200, { ok: true });
      return;
    }

    if (req.method === "POST" && path === "/api/reports") {
      const body = await readJson(req);
      const report = {
        id: randomUUID(),
        reporterId: currentUser().id,
        targetType: String(body.targetType || "pin"),
        targetId: String(body.targetId || ""),
        reason: String(body.reason || "unsafe"),
        status: "open",
        createdAt: new Date().toISOString()
      };
      db.reports.push(report);
      if (report.targetType === "pin") {
        const pin = db.pins.find((item) => item.id === report.targetId);
        if (pin) pin.unsafe = true;
      }
      send(res, 201, report);
      return;
    }

    if (req.method === "POST" && path === "/api/blocks") {
      const body = await readJson(req);
      const block = { id: randomUUID(), blockerId: currentUser().id, blockedUserId: String(body.userId || ""), createdAt: new Date().toISOString() };
      db.blocks.push(block);
      send(res, 201, block);
      return;
    }

    if (req.method === "POST" && path === "/api/dms") {
      const body = await readJson(req);
      const toUserId = String(body.toUserId || "");
      if (!isMutual(currentUser().id, toUserId)) {
        send(res, 403, { error: "DMs are only available between mutual followers." });
        return;
      }
      const dm = {
        id: randomUUID(),
        fromUserId: currentUser().id,
        toUserId,
        body: String(body.body || ""),
        createdAt: new Date().toISOString()
      };
      db.dms.push(dm);
      send(res, 201, dm);
      return;
    }

    if (req.method === "GET" && path === "/api/admin/reports") {
      send(res, 200, { reports: db.reports });
      return;
    }

    if (req.method === "DELETE" && path === "/api/account") {
      currentUser().deletedAt = new Date().toISOString();
      send(res, 200, { ok: true });
      return;
    }

    send(res, 404, { error: "Not found" });
  } catch (error) {
    send(res, 500, { error: error.message || "Server error" });
  }
}

http.createServer(handle).listen(PORT, "0.0.0.0", () => {
  console.log(`Pin API listening on http://0.0.0.0:${PORT}`);
  console.log("Dev token: dev-token");
});
