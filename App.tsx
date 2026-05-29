import { StatusBar } from "expo-status-bar";
import { useMemo, useState } from "react";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { PinsScreen } from "./src/screens/PinsScreen";
import { MemoriesScreen } from "./src/screens/MemoriesScreen";
import { SettingsScreen } from "./src/screens/SettingsScreen";
import { colors } from "./src/theme";
import { usePinglyData } from "./src/hooks/usePinglyData";
import type { AppTab, ThemeMode } from "./src/types";

const tabs: AppTab[] = ["Pins", "Memories", "Settings"];

export default function App() {
  const [activeTab, setActiveTab] = useState<AppTab>("Pins");
  const [themeMode, setThemeMode] = useState<ThemeMode>("dark");
  const pingly = usePinglyData();

  const theme = useMemo(
    () => (themeMode === "dark" ? colors.dark : colors.light),
    [themeMode]
  );

  return (
    <SafeAreaProvider>
      <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.shell }]}>
        <StatusBar style={themeMode === "dark" ? "light" : "dark"} />
        <View style={[styles.app, { backgroundColor: theme.shell }]}>
          {pingly.loading && (
            <View style={styles.loading}>
              <Text style={[styles.loadingText, { color: theme.text }]}>Loading Pin</Text>
            </View>
          )}
          {activeTab === "Pins" && (
            <PinsScreen
              pins={pingly.data?.pins ?? []}
              streak={pingly.data?.streak ?? { days: 0, expiresAt: null, status: "Loading" }}
              theme={theme}
              currentUserId={pingly.data?.user.id}
              onCreatePin={pingly.addPin}
              onDeletePin={pingly.removePin}
              onPullUp={pingly.markPullingUp}
              onReportPin={(pinId) => pingly.report("pin", pinId, "unsafe")}
            />
          )}
          {activeTab === "Memories" && (
            <MemoriesScreen
              memories={pingly.data?.memories ?? []}
              notifications={pingly.data?.notifications ?? []}
              dms={pingly.data?.dms ?? []}
              theme={theme}
              onSendReaction={pingly.sendReaction}
              onFollow={pingly.follow}
              onUnfollow={pingly.unfollow}
              onCaptureMemory={(pinId) => pingly.addMemory(pinId)}
              onSendMessage={pingly.sendMessage}
            />
          )}
          {activeTab === "Settings" && (
            <SettingsScreen
              user={pingly.data?.user}
              theme={theme}
              themeMode={themeMode}
              onToggleTheme={() =>
                setThemeMode((mode) => (mode === "dark" ? "light" : "dark"))
              }
              onDeleteAccount={pingly.closeAccount}
            />
          )}

          <View style={[styles.nav, { backgroundColor: theme.panel }]}>
            {tabs.map((tab) => {
              const isActive = activeTab === tab;
              return (
                <Pressable
                  key={tab}
                  onPress={() => setActiveTab(tab)}
                  style={[
                    styles.navButton,
                    isActive && { backgroundColor: colors.accent.green }
                  ]}
                >
                  <Text
                    style={[
                      styles.navText,
                      { color: isActive ? colors.black : theme.muted }
                    ]}
                  >
                    {tab}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1
  },
  app: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 6
  },
  nav: {
    position: "absolute",
    left: 16,
    right: 16,
    bottom: 16,
    flexDirection: "row",
    gap: 8,
    borderRadius: 999,
    padding: 6
  },
  navButton: {
    flex: 1,
    minHeight: 44,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 999
  },
  navText: {
    fontSize: 13,
    fontWeight: "800"
  },
  loading: {
    position: "absolute",
    left: 16,
    right: 16,
    top: 8,
    zIndex: 10,
    alignItems: "center"
  },
  loadingText: {
    fontSize: 11,
    fontWeight: "800"
  }
});
