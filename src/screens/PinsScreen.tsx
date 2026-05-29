import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Animated,
  Modal,
  PanResponder,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View
} from "react-native";
import { colors } from "../theme";
import type { AppTheme, Pin, VibeStreak } from "../types";

type PinsScreenProps = {
  theme: AppTheme;
  pins: Pin[];
  streak: VibeStreak;
  currentUserId?: string;
  onCreatePin: (input: { title: string; area: string; category?: string; startsAt?: string }) => Promise<Pin>;
  onDeletePin: (pinId: string) => Promise<void>;
  onPullUp: (pinId: string) => Promise<{ pullingUp: number } | void>;
  onReportPin: (pinId: string) => Promise<void>;
};

const memorySlides = [
  { backgroundColor: "#1f1f1f", personColor: "#111" },
  { backgroundColor: "#251b2b", personColor: "#120d16" },
  { backgroundColor: "#16252b", personColor: "#0b1215" }
];

export function PinsScreen({
  theme,
  pins,
  streak,
  currentUserId,
  onCreatePin,
  onDeletePin,
  onPullUp,
  onReportPin
}: PinsScreenProps) {
  const [selectedPin, setSelectedPin] = useState<Pin | null>(null);
  const [detailsVisible, setDetailsVisible] = useState(false);
  const [createVisible, setCreateVisible] = useState(false);
  const [pullingUp, setPullingUp] = useState(false);
  const [newPinTitle, setNewPinTitle] = useState("");
  const [newPinArea, setNewPinArea] = useState("");
  const [newPinDate, setNewPinDate] = useState("");
  const [newPinTime, setNewPinTime] = useState("");
  const [newPinError, setNewPinError] = useState<string | null>(null);
  const [memoryIndex, setMemoryIndex] = useState(0);
  const [memoryOverlayInteractive, setMemoryOverlayInteractive] = useState(true);
  const memoryOverlayOpacity = useRef(new Animated.Value(1)).current;
  const memoryOverlayTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const hideMemoryOverlay = useCallback(() => {
    Animated.timing(memoryOverlayOpacity, {
      toValue: 0,
      duration: 250,
      useNativeDriver: true
    }).start(() => setMemoryOverlayInteractive(false));
  }, [memoryOverlayOpacity]);

  const showMemoryOverlay = useCallback(() => {
    if (memoryOverlayTimer.current) {
      clearTimeout(memoryOverlayTimer.current);
    }
    setMemoryOverlayInteractive(true);
    Animated.timing(memoryOverlayOpacity, {
      toValue: 1,
      duration: 180,
      useNativeDriver: true
    }).start();
    memoryOverlayTimer.current = setTimeout(hideMemoryOverlay, 3000);
  }, [hideMemoryOverlay, memoryOverlayOpacity]);

  const openPin = (pin: Pin) => {
    setSelectedPin(pin);
    setDetailsVisible(true);
    setPullingUp(false);
    setMemoryIndex(0);
  };

  const pullUpCount = (pin: Pin) => pin.pullingUp ?? pin.interested;
  const canDeleteSelectedPin = Boolean(selectedPin && selectedPin.creatorId === currentUserId);
  const activeMemorySlide = memorySlides[memoryIndex] ?? memorySlides[0];
  const memorySwipeResponder = useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponder: (_, gesture) =>
          Boolean(selectedPin?.hasMemories) &&
          Math.abs(gesture.dx) > 18 &&
          Math.abs(gesture.dx) > Math.abs(gesture.dy),
        onPanResponderRelease: (_, gesture) => {
          if (!selectedPin?.hasMemories) {
            return;
          }

          if (gesture.dx < -35) {
            setMemoryIndex((index) => Math.min(index + 1, memorySlides.length - 1));
          }

          if (gesture.dx > 35) {
            setMemoryIndex((index) => Math.max(index - 1, 0));
          }
        }
      }),
    [selectedPin?.hasMemories]
  );

  useEffect(() => {
    if (detailsVisible && selectedPin?.hasMemories) {
      showMemoryOverlay();
      return;
    }

    if (memoryOverlayTimer.current) {
      clearTimeout(memoryOverlayTimer.current);
    }
    memoryOverlayOpacity.setValue(1);
    setMemoryOverlayInteractive(true);
  }, [detailsVisible, memoryOverlayOpacity, selectedPin?.hasMemories, showMemoryOverlay]);

  useEffect(
    () => () => {
      if (memoryOverlayTimer.current) {
        clearTimeout(memoryOverlayTimer.current);
      }
    },
    []
  );

  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <View style={styles.streakBlock}>
          <Text style={[styles.eyebrow, { color: theme.muted }]}>
            Streak
          </Text>
          <View style={[styles.streakPill, { backgroundColor: theme.panel }]}>
            <View style={styles.fireIcon} />
            <Text style={[styles.streakText, { color: theme.text }]}>
              {streak.days} days
            </Text>
          </View>
        </View>
        <View style={styles.headerCenterSpacer} />
        <Pressable
          accessibilityLabel="Create pin"
          onPress={() => setCreateVisible(true)}
          style={[styles.circleButton, { backgroundColor: theme.panel }]}
        >
          <Text style={[styles.circleButtonText, { color: theme.text }]}>+</Text>
        </Pressable>
      </View>

      <View style={styles.filters}>
        {["Now", "Tonight", "Weekend", "18+"].map((filter, index) => (
          <View
            key={filter}
            style={[
              styles.filter,
              {
                backgroundColor: index === 0 ? colors.accent.green : theme.panel
              }
            ]}
          >
            <Text
              style={[
                styles.filterText,
                { color: index === 0 ? colors.black : theme.text }
              ]}
            >
              {filter}
            </Text>
          </View>
        ))}
      </View>

      <View style={[styles.mapPanel, { backgroundColor: theme.panel }]}>
        <Text style={[styles.area, styles.areaWestlands, { backgroundColor: theme.panel2, color: theme.text }]}>
          Westlands
        </Text>
        <Text style={[styles.area, styles.areaCbd, { backgroundColor: theme.panel2, color: theme.text }]}>
          CBD
        </Text>

        {pins.map((pin, index) => (
          <Pressable
            key={pin.id}
            onPress={() => openPin(pin)}
            style={[
              styles.pin,
              pinPositions[index],
            ]}
          >
            <View
              style={[
                styles.pinShape,
                {
                  backgroundColor: pin.color,
                  borderColor: selectedPin?.id === pin.id ? colors.white : colors.black
                }
              ]}
            >
              <Text
                style={[
                  styles.pinText,
                  { color: pin.color === colors.accent.purple ? colors.white : colors.black }
                ]}
              >
                {pullUpCount(pin)}
              </Text>
            </View>
          </Pressable>
        ))}

        {detailsVisible && (
          <Pressable
            accessibilityLabel="Close pin details by tapping map"
            onPress={() => setDetailsVisible(false)}
            style={styles.dismissLayer}
          />
        )}

        {detailsVisible && selectedPin && (
          <View
            style={[
              styles.pinPopup,
              selectedPin.hasMemories && styles.floatingPopup,
              !selectedPin.hasMemories && { backgroundColor: theme.panel }
            ]}
          >
            {!selectedPin.hasMemories && (
              <>
            <Pressable
              accessibilityLabel="Close pin details"
              onPress={() => setDetailsVisible(false)}
              style={[styles.closeButton, { backgroundColor: theme.panel2 }]}
            >
              <Text style={[styles.closeText, { color: theme.text }]}>x</Text>
            </Pressable>
            <View style={styles.topSignals}>
              <Text style={[styles.category, { backgroundColor: theme.panel2, color: theme.text }]}>
                {selectedPin.category}
              </Text>
              {selectedPin.unsafe && <Text style={styles.unsafe}>Marked unsafe</Text>}
            </View>
              </>
            )}

            {selectedPin.hasMemories ? (
              <View style={styles.photoStack} {...memorySwipeResponder.panHandlers}>
                  <View style={styles.slideFrame}>
                    <View
                      style={[
                        styles.memoryPhotoFrame
                      ]}
                    >
                      <View
                        style={[
                          styles.singlePhotoCard,
                          {
                            backgroundColor: activeMemorySlide.backgroundColor,
                            borderColor: selectedPin.color
                          }
                        ]}
                      >
                        <View style={[styles.photoPerson, { backgroundColor: activeMemorySlide.personColor }]} />
                      </View>
                    <Pressable
                      accessibilityLabel="Show pin memory details"
                      onPress={showMemoryOverlay}
                      style={styles.memoryTapLayer}
                    />
                    <Animated.View
                      pointerEvents={memoryOverlayInteractive ? "auto" : "none"}
                      style={[styles.memoryOverlayLayer, { opacity: memoryOverlayOpacity }]}
                    >
                    <View style={styles.memoryTextScrim} />
                    <Pressable
                      accessibilityLabel="Close pin details"
                      onPress={() => setDetailsVisible(false)}
                      style={[styles.closeButton, styles.floatingCloseButton]}
                    >
                      <Text style={[styles.closeText, { color: colors.white }]}>x</Text>
                    </Pressable>
                    <View style={styles.topSignals}>
                      <Text style={styles.floatingCategory}>{selectedPin.category}</Text>
                      {selectedPin.unsafe && <Text style={styles.unsafe}>Marked unsafe</Text>}
                    </View>
                    <View style={styles.popupFooter}>
                      <View style={styles.popupCopy}>
                        <Text numberOfLines={1} style={[styles.popupTitle, { color: colors.white }]}>
                          {selectedPin.title}
                        </Text>
                        <Text numberOfLines={1} style={[styles.popupMeta, { color: colors.white }]}>
                          {selectedPin.time} • {pullUpCount(selectedPin)} pulling up
                        </Text>
                        <View style={styles.reactions}>
                          {selectedPin.reactions.map((reaction) => (
                            <Text key={reaction} style={styles.reactionBubble}>
                              {reaction}
                            </Text>
                          ))}
                        </View>
                      </View>
                      <View style={styles.popupActions}>
                        <Pressable
                          onPress={async () => {
                            setPullingUp((value) => !value);
                            const result = await onPullUp(selectedPin.id);
                            if (result?.pullingUp !== undefined) {
                              setSelectedPin((pin) =>
                                pin ? { ...pin, pullingUp: result.pullingUp } : pin
                              );
                            }
                          }}
                          style={styles.floatingPullButton}
                        >
                          <Text style={styles.floatingPullButtonText}>
                            {pullingUp ? "Going" : "Pulling up"}
                          </Text>
                        </Pressable>
                        <Pressable style={styles.floatingIconButton}>
                          <Text style={styles.floatingIconText}>›</Text>
                        </Pressable>
                        <Pressable style={[styles.floatingIconButton, styles.routeButton]}>
                          <Text style={styles.routeText}>+</Text>
                        </Pressable>
                      <Pressable
                        accessibilityLabel="Report unsafe pin"
                        onPress={() => onReportPin(selectedPin.id)}
                        style={[styles.floatingIconButton, styles.reportButton]}
                      >
                        <Text style={[styles.iconText, { color: colors.white }]}>!</Text>
                      </Pressable>
                      {canDeleteSelectedPin && (
                        <Pressable
                          accessibilityLabel="Delete pin"
                          onPress={async () => {
                            await onDeletePin(selectedPin.id);
                            setDetailsVisible(false);
                            setSelectedPin(null);
                          }}
                          style={[styles.floatingDeleteButton, styles.deleteButton]}
                        >
                          <Text style={styles.deleteButtonText}>Del</Text>
                        </Pressable>
                      )}
                    </View>
                  </View>
                  </Animated.View>
                  </View>
                </View>
              </View>
            ) : (
              <View style={styles.emptyMemory}>
                <Text style={[styles.emptyTitle, { color: theme.text }]}>
                  No memories yet
                </Text>
                <Text style={[styles.emptyBody, { color: theme.muted }]}>
                  Be the first to add a memory when you pull up.
                </Text>
              </View>
            )}

            {!selectedPin.hasMemories && (
            <View style={[styles.popupFooter, styles.emptyPopupFooter]}>
              <View style={[styles.popupCopy, styles.emptyPopupFooterCopy]}>
                <Text
                  numberOfLines={1}
                  style={[
                    styles.popupTitle,
                    { color: selectedPin.hasMemories ? colors.white : theme.text }
                  ]}
                >
                  {selectedPin.title}
                </Text>
                <Text
                  numberOfLines={1}
                  style={[
                    styles.popupMeta,
                    { color: selectedPin.hasMemories ? colors.white : theme.text }
                  ]}
                >
                  {selectedPin.time} • {pullUpCount(selectedPin)} pulling up
                </Text>
              </View>
              <View style={styles.emptyPopupActions}>
                <Pressable
                  onPress={async () => {
                    setPullingUp((value) => !value);
                    const result = await onPullUp(selectedPin.id);
                    if (result?.pullingUp !== undefined) {
                      setSelectedPin((pin) =>
                        pin ? { ...pin, pullingUp: result.pullingUp } : pin
                      );
                    }
                  }}
                  style={[styles.pullButton, { backgroundColor: theme.panel2 }]}
                >
                  <Text style={[styles.pullButtonText, { color: theme.text }]}>
                    {pullingUp ? "Going" : "Pulling up"}
                  </Text>
                </Pressable>
                <Pressable style={[styles.iconButton, { backgroundColor: theme.panel2 }]}>
                  <Text style={[styles.iconText, { color: theme.text }]}>›</Text>
                </Pressable>
                <Pressable style={[styles.iconButton, styles.routeButton]}>
                  <Text style={styles.routeText}>+</Text>
                </Pressable>
                <Pressable
                  accessibilityLabel="Report unsafe pin"
                  onPress={() => onReportPin(selectedPin.id)}
                  style={[styles.iconButton, styles.reportButton]}
                >
                  <Text style={[styles.iconText, { color: colors.white }]}>!</Text>
                </Pressable>
                {canDeleteSelectedPin && (
                  <Pressable
                    accessibilityLabel="Delete pin"
                    onPress={async () => {
                      await onDeletePin(selectedPin.id);
                      setDetailsVisible(false);
                      setSelectedPin(null);
                    }}
                    style={[styles.deleteButton, styles.deleteTextButton]}
                  >
                    <Text style={styles.deleteButtonText}>Delete</Text>
                  </Pressable>
                )}
              </View>
            </View>
            )}
          </View>
        )}
      </View>

      <Modal animationType="slide" transparent visible={createVisible}>
        <View style={styles.modalOverlay}>
          <View style={[styles.sheet, { backgroundColor: theme.panel }]}>
            <View style={styles.sheetHeader}>
              <View>
                <Text style={[styles.eyebrow, { color: theme.muted }]}>
                  Create pin
                </Text>
                <Text style={[styles.sheetTitle, { color: theme.text }]}>
                  Add what is happening
                </Text>
              </View>
              <Pressable onPress={() => setCreateVisible(false)} style={[styles.sheetClose, { backgroundColor: theme.panel2 }]}>
                <Text style={[styles.closeText, { color: theme.text }]}>x</Text>
              </Pressable>
            </View>
            <TextInput
              placeholder="Event name"
              placeholderTextColor={theme.muted}
              value={newPinTitle}
              onChangeText={setNewPinTitle}
              style={[styles.input, { color: theme.text, borderColor: theme.line }]}
            />
            <TextInput
              placeholder="Area"
              placeholderTextColor={theme.muted}
              value={newPinArea}
              onChangeText={setNewPinArea}
              style={[styles.input, { color: theme.text, borderColor: theme.line }]}
            />
            <View style={styles.inputRow}>
              <TextInput
                placeholder="Date (optional)"
                placeholderTextColor={theme.muted}
                value={newPinDate}
                onChangeText={setNewPinDate}
                style={[styles.input, styles.inputHalf, { color: theme.text, borderColor: theme.line }]}
              />
              <TextInput
                placeholder="Time (optional)"
                placeholderTextColor={theme.muted}
                value={newPinTime}
                onChangeText={setNewPinTime}
                style={[styles.input, styles.inputHalf, { color: theme.text, borderColor: theme.line }]}
              />
            </View>
            {newPinError && <Text style={styles.formError}>{newPinError}</Text>}
            <Pressable
              onPress={async () => {
                try {
                  setNewPinError(null);
                  const dateInput = newPinDate.trim();
                  const timeInput = newPinTime.trim();
                  const startsAt =
                    dateInput && timeInput
                      ? new Date(`${dateInput} ${timeInput}`).toISOString()
                      : undefined;
                  await onCreatePin({
                    title: newPinTitle || "Untitled pin",
                    area: newPinArea || "Nairobi",
                    category: "Pop-up",
                    ...(startsAt ? { startsAt } : {})
                  });
                  setNewPinTitle("");
                  setNewPinArea("");
                  setNewPinDate("");
                  setNewPinTime("");
                  setCreateVisible(false);
                } catch (error) {
                  setNewPinError(error instanceof Error ? error.message : "Use a valid optional date and time");
                }
              }}
              style={styles.publishButton}
            >
              <Text style={styles.publishText}>Publish pin</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const pinPositions = [
  { left: "54%" as const, top: "20%" as const },
  { left: "18%" as const, top: "48%" as const },
  { right: "18%" as const, top: "62%" as const },
  { left: "38%" as const, top: "76%" as const }
];

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    paddingBottom: 90
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 14
  },
  streakBlock: {
    width: 118,
    alignItems: "flex-start"
  },
  headerCenterSpacer: {
    flex: 1
  },
  eyebrow: {
    fontSize: 11,
    fontWeight: "800"
  },
  streakPill: {
    minWidth: 110,
    minHeight: 34,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 999,
    marginVertical: 3
  },
  fireIcon: {
    position: "absolute",
    left: 14,
    width: 15,
    height: 18,
    borderRadius: 8,
    backgroundColor: colors.accent.orange,
    transform: [{ rotate: "-45deg" }]
  },
  streakText: {
    fontSize: 15,
    fontWeight: "900"
  },
  circleButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center"
  },
  circleButtonText: {
    fontSize: 26
  },
  filters: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 14
  },
  filter: {
    minHeight: 36,
    justifyContent: "center",
    borderRadius: 999,
    paddingHorizontal: 15
  },
  filterText: {
    fontSize: 13,
    fontWeight: "900"
  },
  mapPanel: {
    flex: 1,
    overflow: "hidden",
    borderRadius: 30,
    padding: 16
  },
  area: {
    position: "absolute",
    zIndex: 1,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
    fontSize: 11
  },
  areaWestlands: {
    left: 20,
    top: 24
  },
  areaCbd: {
    left: 44,
    bottom: 132
  },
  pin: {
    position: "absolute",
    width: 62,
    height: 72,
    alignItems: "center",
    justifyContent: "center"
  },
  pinShape: {
    width: 50,
    height: 50,
    borderWidth: 3,
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
    borderBottomLeftRadius: 26,
    borderBottomRightRadius: 7,
    alignItems: "center",
    justifyContent: "center",
    transform: [{ rotate: "45deg" }]
  },
  pinText: {
    fontSize: 16,
    fontWeight: "900",
    transform: [{ rotate: "-45deg" }]
  },
  pinPopup: {
    position: "absolute",
    left: 28,
    right: 28,
    top: 92,
    minHeight: 380,
    zIndex: 8,
    overflow: "hidden",
    borderRadius: 30
  },
  floatingPopup: {
    overflow: "visible",
    backgroundColor: "transparent"
  },
  dismissLayer: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 4
  },
  closeButton: {
    position: "absolute",
    right: 18,
    top: 18,
    zIndex: 4,
    width: 28,
    height: 28,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 14,
    backgroundColor: "rgba(0,0,0,0.35)"
  },
  floatingCloseButton: {
    backgroundColor: "rgba(0,0,0,0.44)"
  },
  closeText: {
    fontSize: 22
  },
  topSignals: {
    position: "absolute",
    zIndex: 3,
    left: 20,
    top: 20,
    flexDirection: "row",
    gap: 6
  },
  category: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
    fontSize: 10,
    fontWeight: "900"
  },
  floatingCategory: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: "rgba(0,0,0,0.5)",
    color: colors.white,
    fontSize: 10,
    fontWeight: "900"
  },
  unsafe: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: colors.accent.red,
    color: colors.white,
    fontSize: 10,
    fontWeight: "900"
  },
  photoStack: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    bottom: 0
  },
  slideFrame: {
    flex: 1,
    position: "relative",
    padding: 16
  },
  memoryPhotoFrame: {
    position: "absolute",
    left: 16,
    right: 16,
    top: 16,
    bottom: 16,
    borderRadius: 24
  },
  singlePhotoCard: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    borderWidth: 3,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "flex-end"
  },
  memoryTapLayer: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 1
  },
  memoryOverlayLayer: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 2
  },
  photoPerson: {
    width: 132,
    height: 164,
    borderRadius: 42,
    backgroundColor: "#111",
    marginBottom: 18
  },
  memoryTextScrim: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 6,
    height: 112,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    backgroundColor: "transparent"
  },
  emptyMemory: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: "900"
  },
  emptyBody: {
    maxWidth: 220,
    marginTop: 8,
    textAlign: "center",
    lineHeight: 20
  },
  popupFooter: {
    position: "absolute",
    left: 20,
    right: 20,
    bottom: 9,
    gap: 7
  },
  popupCopy: {
    maxWidth: "100%",
    paddingRight: 134
  },
  emptyPopupFooter: {
    right: 14,
    bottom: 18
  },
  emptyPopupFooterCopy: {
    paddingRight: 0
  },
  emptyPopupActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    alignSelf: "flex-end",
    marginTop: 7
  },
  popupTitle: {
    fontSize: 14,
    fontWeight: "900"
  },
  popupMeta: {
    fontSize: 10,
    marginTop: 2
  },
  reactions: {
    flexDirection: "row",
    gap: 5,
    marginTop: 5
  },
  reactionBubble: {
    width: 23,
    height: 23,
    textAlign: "center",
    textAlignVertical: "center",
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.9)",
    fontSize: 14
  },
  popupActions: {
    position: "absolute",
    right: 0,
    bottom: 0,
    flexDirection: "row",
    gap: 5,
    alignItems: "center",
    justifyContent: "flex-end"
  },
  pullButton: {
    minHeight: 32,
    justifyContent: "center",
    borderRadius: 999,
    paddingHorizontal: 13,
    backgroundColor: "rgba(255,255,255,0.2)"
  },
  pullButtonText: {
    fontSize: 10,
    fontWeight: "900"
  },
  iconButton: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 17,
    backgroundColor: "rgba(255,255,255,0.18)"
  },
  floatingPullButton: {
    minHeight: 28,
    justifyContent: "center",
    borderRadius: 999,
    paddingHorizontal: 10,
    backgroundColor: "rgba(0,0,0,0.42)"
  },
  floatingPullButtonText: {
    color: colors.white,
    fontSize: 9,
    fontWeight: "900"
  },
  floatingIconButton: {
    width: 30,
    height: 30,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 16,
    backgroundColor: "rgba(0,0,0,0.42)"
  },
  floatingIconText: {
    color: colors.white,
    fontSize: 15,
    fontWeight: "900"
  },
  routeButton: {
    backgroundColor: colors.accent.orange
  },
  reportButton: {
    backgroundColor: colors.accent.red
  },
  deleteButton: {
    backgroundColor: colors.accent.red
  },
  floatingDeleteButton: {
    minHeight: 28,
    justifyContent: "center",
    borderRadius: 999,
    paddingHorizontal: 10
  },
  deleteTextButton: {
    minHeight: 36,
    justifyContent: "center",
    borderRadius: 999,
    paddingHorizontal: 12
  },
  deleteButtonText: {
    color: colors.white,
    fontSize: 10,
    fontWeight: "900"
  },
  iconText: {
    fontSize: 17,
    fontWeight: "900"
  },
  routeText: {
    color: colors.black,
    fontSize: 17,
    fontWeight: "900"
  },
  modalOverlay: {
    flex: 1,
    justifyContent: "flex-end",
    padding: 16,
    backgroundColor: "rgba(0,0,0,0.55)"
  },
  sheet: {
    borderRadius: 28,
    padding: 16
  },
  sheetHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 14
  },
  sheetTitle: {
    fontSize: 20,
    fontWeight: "900"
  },
  sheetClose: {
    width: 38,
    height: 38,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 19,
    backgroundColor: "rgba(255,255,255,0.1)"
  },
  input: {
    minHeight: 44,
    borderWidth: 1,
    borderRadius: 16,
    paddingHorizontal: 13,
    marginBottom: 11
  },
  inputRow: {
    flexDirection: "row",
    gap: 10
  },
  inputHalf: {
    flex: 1
  },
  formError: {
    marginBottom: 10,
    color: colors.accent.red,
    fontSize: 12,
    fontWeight: "800"
  },
  publishButton: {
    minHeight: 44,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 999,
    backgroundColor: colors.accent.green
  },
  publishText: {
    color: colors.black,
    fontWeight: "900"
  }
});
