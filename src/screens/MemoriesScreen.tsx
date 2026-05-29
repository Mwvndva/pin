import { useMemo, useState } from "react";
import { Modal, PanResponder, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { colors } from "../theme";
import type { AppTheme, DirectMessage, Memory, PinglyNotification } from "../types";

type MemoriesScreenProps = {
  theme: AppTheme;
  memories: Memory[];
  notifications: PinglyNotification[];
  dms: DirectMessage[];
  onSendReaction: (memory: Memory, emoji: string) => Promise<unknown>;
  onFollow: (memory: Memory) => Promise<void>;
  onUnfollow: (userId: string) => Promise<void>;
  onCaptureMemory: (pinId: string) => Promise<Memory>;
  onSendMessage: (toUserId: string, body: string) => Promise<DirectMessage>;
};

const messageEmojiOptions = ["❤️", "😂", "🔥", "😍", "🙌"];

const reactionOptions = ["♡", "🔥", "😂", "😍", "🎵"];

export function MemoriesScreen({
  theme,
  memories,
  notifications,
  dms,
  onSendReaction,
  onFollow,
  onUnfollow,
  onCaptureMemory,
  onSendMessage
}: MemoriesScreenProps) {
  const [mode, setMode] = useState<"camera" | "browser">("camera");
  const [audience, setAudience] = useState<"feed" | "following">("feed");
  const [memoryIndex, setMemoryIndex] = useState(0);
  const [reactionIndex, setReactionIndex] = useState(0);
  const [reactedMemoryIds, setReactedMemoryIds] = useState<string[]>([]);
  const [dmVisible, setDmVisible] = useState(false);
  const [activeDmOwner, setActiveDmOwner] = useState<string | null>(null);
  const [activeDmUserId, setActiveDmUserId] = useState<string | null>(null);
  const [draftMessage, setDraftMessage] = useState("");
  const [dmError, setDmError] = useState<string | null>(null);
  const [notificationsVisible, setNotificationsVisible] = useState(false);
  const [peopleVisible, setPeopleVisible] = useState(false);

  const visibleMemories = useMemo(
    () =>
      memories.filter((memory) =>
        audience === "following"
          ? memory.audience === "following" || memory.followed
          : memory.audience === "feed" && !memory.followed
      ),
    [audience, memories]
  );

  const followedPeople = useMemo(() => {
    const people = new Map<string, { id: string; name: string }>();
    memories.forEach((memory) => {
      if (memory.followed && memory.ownerId) {
        people.set(memory.ownerId, { id: memory.ownerId, name: memory.owner });
      }
    });
    return Array.from(people.values());
  }, [memories]);

  const currentMemory =
    visibleMemories[memoryIndex] ??
    visibleMemories[0] ??
    {
        id: "empty-memory",
        owner: "Pin",
        age: "now",
        audience,
        mutual: false,
        followed: false,
        reacted: false
      };
  const hasVisibleMemory = currentMemory.id !== "empty-memory";

  const memorySwipeResponder = useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponder: (_, gesture) =>
          mode === "browser" &&
          Math.abs(gesture.dy) > 24 &&
          Math.abs(gesture.dy) > Math.abs(gesture.dx),
        onPanResponderRelease: (_, gesture) => {
          if (visibleMemories.length < 2) return;
          if (gesture.dy < -35) {
            setMemoryIndex((index) => Math.min(index + 1, visibleMemories.length - 1));
          }
          if (gesture.dy > 35) {
            setMemoryIndex((index) => Math.max(index - 1, 0));
          }
        }
      }),
    [mode, visibleMemories.length]
  );

  const hasReacted = Boolean(!hasVisibleMemory || currentMemory.reacted || reactedMemoryIds.includes(currentMemory.id));

  const sendReaction = async () => {
    if (hasReacted) return;
    await onSendReaction(currentMemory, reactionOptions[reactionIndex]);
    setReactedMemoryIds((ids) => [...ids, currentMemory.id]);
    setReactionIndex(0);
  };

  const showBrowser = () => {
    setMode("browser");
    setMemoryIndex(0);
    setReactionIndex(0);
  };

  const showCamera = () => {
    setMode("camera");
    setMemoryIndex(0);
    setReactionIndex(0);
  };

  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        {mode === "browser" ? (
          <Pressable
            accessibilityLabel="Direct messages"
            onPress={() => {
              setActiveDmOwner(null);
              setActiveDmUserId(null);
              setDraftMessage("");
              setDmError(null);
              setDmVisible(true);
            }}
            style={[styles.circleButton, { backgroundColor: theme.panel }]}
          >
            <View style={[styles.envelopeIcon, { borderColor: theme.text }]}>
              <View style={[styles.envelopeFoldLeft, { backgroundColor: theme.text }]} />
              <View style={[styles.envelopeFoldRight, { backgroundColor: theme.text }]} />
            </View>
          </Pressable>
        ) : (
          <View style={styles.circleButtonSpacer} />
        )}
        <View style={styles.titleBlock}>
          <Text style={[styles.title, { color: theme.text }]}>
            {mode === "camera" ? "Camera" : "Memories"}
          </Text>
        </View>
        {mode === "browser" ? (
          <Pressable
            accessibilityLabel="Notifications"
            onPress={() => setNotificationsVisible(true)}
            style={[styles.circleButton, { backgroundColor: theme.panel }]}
          >
            <View style={styles.notificationIcon}>
              <View style={[styles.notificationDome, { borderColor: theme.text }]} />
              <View style={[styles.notificationClapper, { backgroundColor: theme.text }]} />
            </View>
          </Pressable>
        ) : (
          <View style={styles.circleButtonSpacer} />
        )}
      </View>

      {mode === "camera" ? (
        <View style={[styles.cameraStage, { backgroundColor: theme.panel }]}>
          <View style={styles.cameraLens}>
            <View style={styles.scanLine} />
          </View>
          <Text style={[styles.cameraText, { color: theme.muted }]}>
            Tap capture to add a memory to your current pin.
          </Text>
        </View>
      ) : (
        <View style={styles.browser}>
          <View style={[styles.tabs, { backgroundColor: theme.panel }]}>
            {(["feed", "following"] as const).map((item) => {
              const active = audience === item;
              return (
                <Pressable
                  key={item}
                  onPress={() => {
                    setAudience(item);
                    setMemoryIndex(0);
                    setReactionIndex(0);
                  }}
                  style={[styles.tab, active && { backgroundColor: colors.accent.green }]}
                >
                  <Text
                    style={[
                      styles.tabText,
                      { color: active ? colors.black : theme.muted }
                    ]}
                  >
                    {item === "feed" ? "Feed" : "Following"}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          <View
            style={[styles.memoryFrame, { backgroundColor: theme.panel }]}
            {...memorySwipeResponder.panHandlers}
          >
            {hasVisibleMemory && audience === "feed" && !currentMemory.followed && (
              <Pressable
                onPress={async () => {
                  await onFollow(currentMemory);
                  setMemoryIndex(0);
                }}
                style={styles.followButton}
              >
                <Text style={styles.followText}>Follow</Text>
              </Pressable>
            )}
            {hasVisibleMemory && currentMemory.followed && (
              <Pressable
                accessibilityLabel={`Message ${currentMemory.owner}`}
                onPress={() => {
                  setActiveDmOwner(currentMemory.owner);
                  setActiveDmUserId(currentMemory.ownerId ?? "user-nia");
                  setDraftMessage("");
                  setDmError(null);
                  setDmVisible(true);
                }}
                style={[styles.memoryMessageButton, { backgroundColor: theme.panel2 }]}
              >
                <View style={[styles.memoryMessageIcon, { borderColor: theme.text }]}>
                  <View style={[styles.memoryMessageDot, { backgroundColor: theme.text }]} />
                  <View style={[styles.memoryMessageDot, { backgroundColor: theme.text }]} />
                  <View style={[styles.memoryMessageDot, { backgroundColor: theme.text }]} />
                </View>
              </Pressable>
            )}
            {hasVisibleMemory ? (
              <>
                <View style={styles.photoPerson} />
                <View style={styles.photoPhone} />
              </>
            ) : (
              <View style={styles.emptyMemoryState}>
                <Text style={[styles.emptyMemoryTitle, { color: theme.text }]}>
                  {audience === "feed" ? "No new feed memories" : "No following memories"}
                </Text>
                <Text style={[styles.emptyMemoryBody, { color: theme.muted }]}>
                  {audience === "feed"
                    ? "Followed people move to Following."
                    : "Follow people from Feed to see them here."}
                </Text>
              </View>
            )}
          </View>

          {hasVisibleMemory && (
            <View style={styles.owner}>
              <Text style={[styles.ownerName, { color: theme.text }]}>
                {currentMemory.owner}
              </Text>
              <Text style={[styles.ownerAge, { color: theme.muted }]}>
                {currentMemory.age}
              </Text>
            </View>
          )}
        </View>
      )}

      <View style={styles.controls}>
        <Pressable
          accessibilityLabel={mode === "camera" ? "Open memories" : "Back to camera"}
          onPress={mode === "camera" ? showBrowser : showCamera}
          style={styles.controlButton}
        >
          {mode === "camera" ? (
            <View style={styles.gridIcon}>
              {Array.from({ length: 9 }).map((_, index) => (
                <View
                  key={index}
                  style={[styles.gridDot, { backgroundColor: theme.text }]}
                />
              ))}
            </View>
          ) : (
            <View style={[styles.cameraIcon, { borderColor: theme.text }]}>
              <View style={[styles.cameraTop, { backgroundColor: theme.text }]} />
              <View style={[styles.cameraLensIcon, { borderColor: theme.text }]} />
            </View>
          )}
        </Pressable>

        {mode === "camera" ? (
          <Pressable
            accessibilityLabel="Capture memory"
            onPress={() => onCaptureMemory(currentMemory.pinId || "westlands-rooftop")}
            style={styles.capture}
          />
        ) : (
          <View style={styles.reactionControl}>
            <Pressable
              accessibilityLabel="Choose reaction"
              disabled={hasReacted}
              onPress={() =>
                setReactionIndex((index) => (index + 1) % reactionOptions.length)
              }
              style={[styles.reactionButton, { backgroundColor: theme.panel }]}
            >
              <Text style={styles.reactionText}>{reactionOptions[reactionIndex]}</Text>
            </Pressable>
            <Pressable
              accessibilityLabel={
                hasReacted ? "Already reacted to this memory" : "Send reaction"
              }
              disabled={hasReacted}
              onPress={sendReaction}
              style={[
                styles.sendButton,
                { backgroundColor: theme.panel },
                hasReacted && styles.disabledButton
              ]}
            >
              <Text style={[styles.sendText, { color: theme.text }]}>
                {hasReacted ? "Reacted" : "Send"}
              </Text>
            </Pressable>
          </View>
        )}

        {mode === "browser" ? (
          <Pressable
            accessibilityLabel="People you follow"
            onPress={() => setPeopleVisible(true)}
            style={styles.controlButton}
          >
            <View style={[styles.peopleIconHead, { backgroundColor: theme.text }]} />
            <View style={[styles.peopleIconHeadSmall, { backgroundColor: theme.text }]} />
            <View style={[styles.peopleIconBody, { borderColor: theme.text }]} />
          </Pressable>
        ) : (
          <View style={styles.controlSpacer} />
        )}
      </View>

      <InfoModal
        visible={dmVisible}
        theme={theme}
        eyebrow=""
        title=""
        onClose={() => {
          setDmVisible(false);
          setActiveDmOwner(null);
          setActiveDmUserId(null);
          setDraftMessage("");
          setDmError(null);
        }}
        messages={
          activeDmOwner
            ? dms.slice(0, 3).map((dm) => ({ name: activeDmOwner, body: dm.body }))
            : dms.map((dm, index) => ({
                name: index === 0 ? "Nia" : "Mutual",
                body: `${dm.body} · ${index === 0 ? "1d" : "now"}`,
                userId: dm.fromUserId
              }))
        }
        emptyMessage={activeDmOwner ? "No messages with this person yet." : "No direct messages yet."}
        onMessagePress={
          activeDmOwner
            ? undefined
            : (message) => {
                setActiveDmOwner(message.name);
                setActiveDmUserId(message.userId ?? "user-nia");
                setDraftMessage("");
                setDmError(null);
              }
        }
        draft={activeDmOwner ? draftMessage : undefined}
        error={activeDmOwner ? dmError : null}
        onDraftChange={activeDmOwner ? setDraftMessage : undefined}
        onSend={
          activeDmOwner
            ? async () => {
                if (!activeDmUserId || !draftMessage.trim()) return;
                try {
                  setDmError(null);
                  await onSendMessage(activeDmUserId, draftMessage.trim());
                  setDraftMessage("");
                } catch (error) {
                  setDmError(error instanceof Error ? error.message : "Could not send message");
                }
              }
            : undefined
        }
      />

      <InfoModal
        visible={notificationsVisible}
        theme={theme}
        eyebrow="Notifications"
        title="Activity"
        onClose={() => setNotificationsVisible(false)}
        messages={
          notifications.length
            ? notifications.map((notification) => ({
                name: notification.title,
                body: notification.body
              }))
            : []
        }
        emptyMessage="Reactions, follows, and streak updates will appear here."
      />

      <PeopleModal
        visible={peopleVisible}
        theme={theme}
        people={followedPeople}
        onClose={() => setPeopleVisible(false)}
        onUnfollow={onUnfollow}
      />
    </View>
  );
}

type InfoModalProps = {
  visible: boolean;
  theme: AppTheme;
  eyebrow: string;
  title: string;
  messages: { name: string; body: string; userId?: string }[];
  emptyMessage?: string;
  draft?: string;
  error?: string | null;
  onClose: () => void;
  onMessagePress?: (message: { name: string; body: string; userId?: string }) => void;
  onDraftChange?: (text: string) => void;
  onSend?: () => Promise<void>;
};

function InfoModal({
  visible,
  theme,
  eyebrow,
  title,
  messages,
  emptyMessage,
  draft,
  error,
  onClose,
  onMessagePress,
  onDraftChange,
  onSend
}: InfoModalProps) {
  const showsConversation = Boolean(onSend && !onMessagePress);

  return (
    <Modal transparent animationType="fade" visible={visible}>
      <View style={styles.modalOverlay}>
        <View style={[styles.modalPanel, { backgroundColor: theme.panel }]}>
          <View style={styles.modalHeader}>
            <View>
              {eyebrow ? <Text style={[styles.eyebrow, { color: theme.muted }]}>{eyebrow}</Text> : null}
              {title ? <Text style={[styles.modalTitle, { color: theme.text }]}>{title}</Text> : null}
            </View>
            <Pressable onPress={onClose} style={[styles.modalClose, { backgroundColor: theme.panel2 }]}>
              <Text style={[styles.modalCloseText, { color: theme.text }]}>×</Text>
            </Pressable>
          </View>
          <View style={styles.messageList}>
            {messages.length ? (
              messages.map((message, index) =>
                showsConversation ? (
                  <View
                    key={`${message.name}-${message.body}-${index}`}
                    style={[
                      styles.chatBubble,
                      index % 2 === 0 ? styles.chatBubbleOther : styles.chatBubbleMine,
                      { backgroundColor: index % 2 === 0 ? theme.shell : colors.accent.yellow }
                    ]}
                  >
                    <Text
                      style={[
                        styles.chatBubbleText,
                        { color: index % 2 === 0 ? theme.text : colors.black }
                      ]}
                    >
                      {message.body}
                    </Text>
                  </View>
                ) : (
                  <Pressable
                    key={`${message.name}-${message.body}-${index}`}
                    disabled={!onMessagePress}
                    onPress={() => onMessagePress?.(message)}
                    style={styles.dmRow}
                  >
                    <View style={styles.dmAvatar}>
                      <Text style={styles.dmAvatarText}>{message.name.charAt(0)}</Text>
                    </View>
                    <View style={styles.dmCopy}>
                      <Text style={[styles.dmName, { color: theme.text }]}>{message.name}</Text>
                      <Text numberOfLines={1} style={[styles.dmBody, { color: theme.muted }]}>
                        {message.body}
                      </Text>
                    </View>
                  </Pressable>
                )
              )
            ) : (
              <Text style={[styles.emptyDm, { color: theme.muted }]}>{emptyMessage}</Text>
            )}
          </View>
          {onSend && onDraftChange && (
            <View style={styles.composer}>
              <View style={styles.emojiRow}>
                {messageEmojiOptions.map((emoji) => (
                  <Pressable
                    key={emoji}
                    onPress={() => onDraftChange(`${draft ?? ""}${emoji}`)}
                    style={[styles.emojiButton, { backgroundColor: theme.shell }]}
                  >
                    <Text style={styles.emojiText}>{emoji}</Text>
                  </Pressable>
                ))}
              </View>
              <View style={styles.messageComposerRow}>
                <TextInput
                  value={draft}
                  onChangeText={onDraftChange}
                  placeholder="Write a message"
                  placeholderTextColor={theme.muted}
                  style={[
                    styles.messageInput,
                    {
                      borderColor: theme.line,
                      color: theme.text,
                      backgroundColor: theme.shell
                    }
                  ]}
                />
                <Pressable onPress={onSend} style={styles.messageSendButton}>
                  <View style={styles.sendIcon} />
                </Pressable>
              </View>
              {error && <Text style={styles.messageError}>{error}</Text>}
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
}

type PeopleModalProps = {
  visible: boolean;
  theme: AppTheme;
  people: { id: string; name: string }[];
  onClose: () => void;
  onUnfollow: (userId: string) => Promise<void>;
};

function PeopleModal({ visible, theme, people, onClose, onUnfollow }: PeopleModalProps) {
  return (
    <Modal transparent animationType="fade" visible={visible}>
      <View style={styles.modalOverlay}>
        <View style={[styles.modalPanel, styles.peoplePanel, { backgroundColor: theme.panel }]}>
          <View style={styles.modalHeader}>
            <View>
              <Text style={[styles.eyebrow, { color: theme.muted }]}>Following</Text>
              <Text style={[styles.modalTitle, { color: theme.text }]}>People</Text>
            </View>
            <Pressable onPress={onClose} style={[styles.modalClose, { backgroundColor: theme.panel2 }]}>
              <Text style={[styles.modalCloseText, { color: theme.text }]}>x</Text>
            </Pressable>
          </View>
          <View style={styles.peopleList}>
            {people.length ? (
              people.map((person) => (
                <View key={person.id} style={[styles.personCard, { backgroundColor: theme.shell }]}>
                  <View style={styles.dmAvatar}>
                    <Text style={styles.dmAvatarText}>{person.name.charAt(0)}</Text>
                  </View>
                  <View style={styles.personCopy}>
                    <Text style={[styles.dmName, { color: theme.text }]}>{person.name}</Text>
                    <Text style={[styles.dmBody, { color: theme.muted }]}>Memories show in Following</Text>
                  </View>
                  <Pressable
                    onPress={() => onUnfollow(person.id)}
                    style={styles.unfollowButton}
                  >
                    <Text style={styles.unfollowText}>Unfollow</Text>
                  </Pressable>
                </View>
              ))
            ) : (
              <Text style={[styles.emptyDm, { color: theme.muted }]}>
                People you follow will appear here.
              </Text>
            )}
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    paddingBottom: 144
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 24
  },
  circleButton: {
    width: 48,
    height: 48,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 24
  },
  circleButtonSpacer: {
    width: 48,
    height: 48
  },
  titleBlock: {
    alignItems: "center"
  },
  eyebrow: {
    fontSize: 11,
    fontWeight: "800"
  },
  title: {
    fontSize: 16,
    fontWeight: "900"
  },
  envelopeIcon: {
    width: 24,
    height: 18,
    borderWidth: 2,
    borderColor: colors.white,
    borderRadius: 4,
    overflow: "hidden"
  },
  envelopeFoldLeft: {
    position: "absolute",
    left: -1,
    top: 5,
    width: 17,
    height: 2,
    transform: [{ rotate: "32deg" }]
  },
  envelopeFoldRight: {
    position: "absolute",
    right: -1,
    top: 5,
    width: 17,
    height: 2,
    transform: [{ rotate: "-32deg" }]
  },
  notificationIcon: {
    width: 22,
    height: 24,
    alignItems: "center"
  },
  notificationDome: {
    width: 18,
    height: 17,
    borderWidth: 2,
    borderTopLeftRadius: 10,
    borderTopRightRadius: 10,
    borderBottomLeftRadius: 5,
    borderBottomRightRadius: 5
  },
  notificationClapper: {
    width: 6,
    height: 6,
    marginTop: -2,
    borderRadius: 3,
    backgroundColor: colors.accent.yellow
  },
  cameraStage: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    borderRadius: 38,
    marginBottom: 84
  },
  cameraLens: {
    width: 170,
    height: 170,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: colors.accent.yellow,
    borderRadius: 85,
    backgroundColor: "#151515"
  },
  scanLine: {
    width: 130,
    height: 2,
    backgroundColor: colors.accent.green
  },
  cameraText: {
    position: "absolute",
    left: 34,
    right: 34,
    bottom: 34,
    textAlign: "center",
    lineHeight: 20
  },
  browser: {
    flex: 1,
    gap: 14,
    paddingBottom: 76
  },
  tabs: {
    alignSelf: "center",
    flexDirection: "row",
    gap: 4,
    minHeight: 38,
    borderRadius: 999,
    padding: 4
  },
  tab: {
    minWidth: 86,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 999
  },
  tabText: {
    fontSize: 12,
    fontWeight: "900"
  },
  memoryFrame: {
    flex: 1,
    minHeight: 420,
    overflow: "hidden",
    borderRadius: 38
  },
  followButton: {
    position: "absolute",
    right: 18,
    top: 18,
    zIndex: 2,
    minHeight: 34,
    justifyContent: "center",
    borderRadius: 999,
    paddingHorizontal: 15,
    backgroundColor: colors.accent.green
  },
  followText: {
    color: colors.black,
    fontSize: 12,
    fontWeight: "900"
  },
  memoryMessageButton: {
    position: "absolute",
    right: 18,
    top: 18,
    zIndex: 2,
    width: 38,
    height: 38,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 19
  },
  memoryMessageIcon: {
    width: 20,
    height: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 2,
    borderWidth: 2,
    borderRadius: 7
  },
  memoryMessageDot: {
    width: 3,
    height: 3,
    borderRadius: 2
  },
  photoPerson: {
    position: "absolute",
    left: "50%",
    bottom: 54,
    width: 154,
    height: 190,
    borderRadius: 70,
    backgroundColor: "#101010",
    transform: [{ translateX: -77 }]
  },
  photoPhone: {
    position: "absolute",
    left: "50%",
    top: 178,
    width: 54,
    height: 86,
    borderWidth: 3,
    borderColor: "#111",
    borderRadius: 10,
    backgroundColor: "#2a2a2a",
    transform: [{ translateX: -12 }]
  },
  emptyMemoryState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 28
  },
  emptyMemoryTitle: {
    fontSize: 20,
    fontWeight: "900",
    textAlign: "center"
  },
  emptyMemoryBody: {
    maxWidth: 240,
    marginTop: 8,
    textAlign: "center",
    fontSize: 13,
    lineHeight: 19
  },
  owner: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 8,
    minHeight: 22
  },
  ownerName: {
    fontSize: 13,
    fontWeight: "900"
  },
  ownerAge: {
    fontSize: 13
  },
  controls: {
    position: "absolute",
    left: 28,
    right: 28,
    bottom: 92,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between"
  },
  controlButton: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center"
  },
  gridIcon: {
    width: 24,
    height: 24,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 3
  },
  gridDot: {
    width: 6,
    height: 6
  },
  cameraIcon: {
    width: 24,
    height: 18,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderRadius: 4
  },
  cameraTop: {
    position: "absolute",
    left: 5,
    top: -5,
    width: 8,
    height: 5,
    borderTopLeftRadius: 3,
    borderTopRightRadius: 3,
    backgroundColor: colors.white
  },
  cameraLensIcon: {
    width: 8,
    height: 8,
    borderWidth: 2,
    borderRadius: 4
  },
  peopleIconHead: {
    position: "absolute",
    left: 13,
    top: 10,
    width: 10,
    height: 10,
    borderRadius: 5
  },
  peopleIconHeadSmall: {
    position: "absolute",
    right: 12,
    top: 13,
    width: 8,
    height: 8,
    borderRadius: 4,
    opacity: 0.8
  },
  peopleIconBody: {
    position: "absolute",
    left: 10,
    bottom: 10,
    width: 24,
    height: 13,
    borderWidth: 2,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    borderBottomWidth: 0
  },
  controlSpacer: {
    width: 44
  },
  capture: {
    width: 52,
    height: 52,
    borderWidth: 3,
    borderColor: colors.accent.yellow,
    borderRadius: 26,
    backgroundColor: colors.white
  },
  reactionControl: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6
  },
  reactionButton: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 22,
    backgroundColor: "rgba(255,255,255,0.1)"
  },
  reactionText: {
    fontSize: 22
  },
  sendButton: {
    minHeight: 44,
    justifyContent: "center",
    borderRadius: 999,
    paddingHorizontal: 14,
    backgroundColor: "rgba(255,255,255,0.1)"
  },
  disabledButton: {
    opacity: 0.65
  },
  sendText: {
    fontSize: 12,
    fontWeight: "900"
  },
  modalOverlay: {
    flex: 1,
    padding: 16,
    paddingTop: 64,
    backgroundColor: "rgba(0,0,0,0.55)"
  },
  modalPanel: {
    borderRadius: 28,
    padding: 16,
    minHeight: 430
  },
  peoplePanel: {
    minHeight: 360
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    minHeight: 38,
    marginBottom: 2
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: "900"
  },
  modalClose: {
    width: 38,
    height: 38,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 19,
    backgroundColor: "rgba(255,255,255,0.1)"
  },
  modalCloseText: {
    fontSize: 24
  },
  messageList: {
    flex: 1,
    gap: 14,
    marginBottom: 10
  },
  peopleList: {
    gap: 10
  },
  personCard: {
    minHeight: 62,
    flexDirection: "row",
    alignItems: "center",
    gap: 11,
    borderRadius: 18,
    padding: 10
  },
  personCopy: {
    flex: 1
  },
  unfollowButton: {
    minHeight: 34,
    justifyContent: "center",
    borderRadius: 999,
    paddingHorizontal: 12,
    backgroundColor: colors.accent.red
  },
  unfollowText: {
    color: colors.white,
    fontSize: 11,
    fontWeight: "900"
  },
  dmRow: {
    minHeight: 48,
    flexDirection: "row",
    alignItems: "center",
    gap: 11
  },
  dmAvatar: {
    width: 42,
    height: 42,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 21,
    backgroundColor: colors.accent.yellow
  },
  dmAvatarText: {
    color: colors.black,
    fontSize: 16,
    fontWeight: "900"
  },
  dmCopy: {
    flex: 1
  },
  dmName: {
    fontSize: 14,
    fontWeight: "900"
  },
  dmBody: {
    marginTop: 2,
    fontSize: 12
  },
  chatBubble: {
    maxWidth: "78%",
    borderRadius: 18,
    paddingHorizontal: 13,
    paddingVertical: 10
  },
  chatBubbleOther: {
    alignSelf: "flex-start",
    borderBottomLeftRadius: 6
  },
  chatBubbleMine: {
    alignSelf: "flex-end",
    borderBottomRightRadius: 6
  },
  chatBubbleText: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: "700"
  },
  emptyDm: {
    paddingVertical: 12,
    textAlign: "center",
    fontSize: 13
  },
  composer: {
    gap: 8,
    marginTop: "auto"
  },
  emojiRow: {
    flexDirection: "row",
    gap: 7
  },
  emojiButton: {
    width: 34,
    height: 34,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 17
  },
  emojiText: {
    fontSize: 17
  },
  messageComposerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8
  },
  messageInput: {
    flex: 1,
    minHeight: 44,
    borderWidth: 1,
    borderRadius: 16,
    paddingHorizontal: 12
  },
  messageSendButton: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 22,
    backgroundColor: colors.accent.yellow
  },
  sendIcon: {
    width: 0,
    height: 0,
    marginLeft: 3,
    borderTopWidth: 7,
    borderBottomWidth: 7,
    borderLeftWidth: 12,
    borderTopColor: "transparent",
    borderBottomColor: "transparent",
    borderLeftColor: colors.black
  },
  messageError: {
    color: colors.accent.red,
    fontSize: 12,
    fontWeight: "800"
  }
});
