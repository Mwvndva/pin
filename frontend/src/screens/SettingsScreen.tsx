import { Pressable, StyleSheet, Text, View } from "react-native";
import { colors } from "../theme";
import type { AppTheme, PinglyUser, ThemeMode } from "../types";

type SettingsScreenProps = {
  theme: AppTheme;
  user?: PinglyUser;
  themeMode: ThemeMode;
  onToggleTheme: () => void;
  onDeleteAccount: () => Promise<void>;
};

export function SettingsScreen({
  theme,
  user,
  themeMode,
  onToggleTheme,
  onDeleteAccount
}: SettingsScreenProps) {
  const isDark = themeMode === "dark";

  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <View>
          <Text style={[styles.handle, { color: theme.muted }]}>
            @{user?.handle ?? "nairobiuser"}
          </Text>
          <Text style={[styles.title, { color: theme.text }]}>Settings</Text>
        </View>
      </View>

      <View style={styles.appearanceCard}>
        <View>
          <Text style={styles.appearanceLabel}>Appearance</Text>
          <Text style={styles.appearanceMode}>{isDark ? "Dark mode" : "Light mode"}</Text>
        </View>
        <Pressable onPress={onToggleTheme} style={styles.themeButton}>
          <Text style={styles.themeButtonText}>
            {isDark ? "Light mode" : "Dark mode"}
          </Text>
        </Pressable>
      </View>

      <View style={styles.list}>
        <SettingsRow theme={theme} title="◎ Profile basics" value="Edit" />
        <SettingsRow theme={theme} title="⌖ Location permission" value="On" />
        <SettingsRow theme={theme} title="○ Notifications" value="Tonight" />
        <SettingsRow theme={theme} title="◒ Privacy" value="Counts only" />
        <SettingsRow theme={theme} title="x Blocked users" value="Manage" />
        <SettingsRow theme={theme} title="! Report or help" value="Open" />
        <SettingsRow
          theme={theme}
          title={user?.deletedAt ? "Account deleted" : "Delete account"}
          value={user?.deletedAt ? "Done" : "Required"}
          onPress={onDeleteAccount}
        />
      </View>

      <View style={styles.safetyNote}>
        <Text style={styles.safetyLabel}>Safety default</Text>
        <Text style={styles.safetyText}>
          No live personal location is shown on public pins.
        </Text>
      </View>
    </View>
  );
}

type SettingsRowProps = {
  theme: AppTheme;
  title: string;
  value: string;
  onPress?: () => void;
};

function SettingsRow({ theme, title, value, onPress }: SettingsRowProps) {
  return (
    <Pressable onPress={onPress} style={[styles.row, { backgroundColor: theme.panel }]}>
      <Text style={[styles.rowTitle, { color: theme.text }]}>{title}</Text>
      <Text style={[styles.rowValue, { color: theme.muted }]}>{value}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    paddingBottom: 90
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16
  },
  handle: {
    fontSize: 12
  },
  title: {
    fontSize: 28,
    fontWeight: "900"
  },
  appearanceCard: {
    minHeight: 80,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    borderRadius: 24,
    padding: 15,
    backgroundColor: colors.accent.green
  },
  appearanceLabel: {
    color: colors.black,
    fontSize: 12,
    fontWeight: "800"
  },
  appearanceMode: {
    color: colors.black,
    fontSize: 20,
    fontWeight: "900"
  },
  themeButton: {
    minHeight: 42,
    justifyContent: "center",
    borderRadius: 999,
    paddingHorizontal: 16,
    backgroundColor: colors.black
  },
  themeButtonText: {
    color: colors.white,
    fontSize: 12,
    fontWeight: "900"
  },
  list: {
    gap: 9,
    marginVertical: 16
  },
  row: {
    minHeight: 56,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    borderRadius: 18,
    paddingHorizontal: 15
  },
  rowTitle: {
    fontSize: 15
  },
  rowValue: {
    fontSize: 12,
    fontWeight: "800"
  },
  safetyNote: {
    borderRadius: 24,
    padding: 15,
    backgroundColor: colors.accent.orange
  },
  safetyLabel: {
    color: colors.black,
    fontSize: 12,
    fontWeight: "900"
  },
  safetyText: {
    marginTop: 5,
    color: colors.black,
    lineHeight: 21
  }
});
