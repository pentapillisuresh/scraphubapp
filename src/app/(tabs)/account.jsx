import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
  useColorScheme,
  Appearance,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  User,
  Moon,
  Sun,
  LogOut,
  ChevronRight,
  Phone,
} from "lucide-react-native";
import { useTheme } from "@/utils/theme";
import {
  getUserData,
  clearUserData,
  saveThemePreference,
  getThemePreference,
} from "../../utils/storage";

export default function Account() {
  const insets = useSafeAreaInsets();
  const theme = useTheme();
  const colorScheme = useColorScheme();
  const [userData, setUserData] = useState(null);
  const [isDarkMode, setIsDarkMode] = useState(colorScheme === "dark");

  useEffect(() => {
    loadUserData();
    loadThemePreference();
  }, []);

  const loadUserData = async () => {
    const data = await getUserData();
    if (data) {
      setUserData(data);
    }
  };

  const loadThemePreference = async () => {
    const preference = await getThemePreference();
    if (preference) {
      setIsDarkMode(preference === "dark");
    }
  };

  const toggleTheme = async (value) => {
    setIsDarkMode(value);
    const newTheme = value ? "dark" : "light";
    await saveThemePreference(newTheme);
    Appearance.setColorScheme(newTheme);
  };

  const handleLogout = () => {
    Alert.alert("Logout", "Are you sure you want to logout?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Logout",
        style: "destructive",
        onPress: async () => {
          await clearUserData();
          router.replace("/login");
        },
      },
    ]);
  };

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <StatusBar style={theme.isDark ? "light" : "dark"} />

      {/* Header */}
      <View
        style={{
          backgroundColor: theme.colors.primary,
          paddingTop: insets.top + 24,
          paddingHorizontal: 24,
          paddingBottom: 32,
          borderBottomLeftRadius: 24,
          borderBottomRightRadius: 24,
        }}
      >
        <Text
          style={{
            fontSize: 28,
            fontWeight: "bold",
            color: "white",
            marginBottom: 24,
          }}
        >
          Account
        </Text>

        {/* Profile Card */}
        <View
          style={{
            backgroundColor: "rgba(255, 255, 255, 0.15)",
            borderRadius: 16,
            padding: 20,
            flexDirection: "row",
            alignItems: "center",
          }}
        >
          <View
            style={{
              width: 60,
              height: 60,
              borderRadius: 30,
              backgroundColor: "rgba(255, 255, 255, 0.3)",
              justifyContent: "center",
              alignItems: "center",
              marginRight: 16,
            }}
          >
            <User size={30} color="white" />
          </View>
          <View style={{ flex: 1 }}>
            <Text
              style={{
                fontSize: 20,
                fontWeight: "bold",
                color: "white",
                marginBottom: 4,
              }}
            >
              {userData?.name || "User"}
            </Text>
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <Phone
                size={14}
                color="rgba(255, 255, 255, 0.8)"
                style={{ marginRight: 6 }}
              />
              <Text
                style={{
                  fontSize: 14,
                  color: "rgba(255, 255, 255, 0.8)",
                }}
              >
                {userData?.phoneNumber || "Not available"}
              </Text>
            </View>
          </View>
        </View>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{
          paddingTop: 24,
          paddingHorizontal: 24,
          paddingBottom: insets.bottom + 24,
        }}
        showsVerticalScrollIndicator={false}
      >
        {/* Settings Section */}
        <View
          style={{
            backgroundColor: theme.colors.card.background,
            borderRadius: 12,
            marginBottom: 16,
            borderWidth: 1,
            borderColor: theme.colors.border,
          }}
        >
          <View
            style={{
              paddingHorizontal: 16,
              paddingVertical: 12,
              borderBottomWidth: 1,
              borderBottomColor: theme.colors.divider,
            }}
          >
            <Text
              style={{
                fontSize: 12,
                fontWeight: "600",
                color: theme.colors.text.tertiary,
                textTransform: "uppercase",
                letterSpacing: 0.5,
              }}
            >
              Appearance
            </Text>
          </View>

          {/* Dark Mode Toggle */}
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              paddingHorizontal: 16,
              paddingVertical: 16,
            }}
          >
            <View
              style={{ flexDirection: "row", alignItems: "center", flex: 1 }}
            >
              {isDarkMode ? (
                <Moon
                  size={20}
                  color={theme.colors.text.primary}
                  style={{ marginRight: 12 }}
                />
              ) : (
                <Sun
                  size={20}
                  color={theme.colors.text.primary}
                  style={{ marginRight: 12 }}
                />
              )}
              <View>
                <Text
                  style={{
                    fontSize: 16,
                    fontWeight: "500",
                    color: theme.colors.text.primary,
                    marginBottom: 2,
                  }}
                >
                  Dark Mode
                </Text>
                <Text
                  style={{
                    fontSize: 13,
                    color: theme.colors.text.secondary,
                  }}
                >
                  {isDarkMode ? "Enabled" : "Disabled"}
                </Text>
              </View>
            </View>
            <Switch
              value={isDarkMode}
              onValueChange={toggleTheme}
              trackColor={{
                false: theme.colors.border,
                true: theme.colors.primary,
              }}
              thumbColor="white"
            />
          </View>
        </View>

        {/* Account Actions */}
        <View
          style={{
            backgroundColor: theme.colors.card.background,
            borderRadius: 12,
            marginBottom: 16,
            borderWidth: 1,
            borderColor: theme.colors.border,
          }}
        >
          <View
            style={{
              paddingHorizontal: 16,
              paddingVertical: 12,
              borderBottomWidth: 1,
              borderBottomColor: theme.colors.divider,
            }}
          >
            <Text
              style={{
                fontSize: 12,
                fontWeight: "600",
                color: theme.colors.text.tertiary,
                textTransform: "uppercase",
                letterSpacing: 0.5,
              }}
            >
              Account
            </Text>
          </View>

          <TouchableOpacity
            onPress={handleLogout}
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              paddingHorizontal: 16,
              paddingVertical: 16,
            }}
          >
            <View
              style={{ flexDirection: "row", alignItems: "center", flex: 1 }}
            >
              <LogOut
                size={20}
                color={theme.colors.error}
                style={{ marginRight: 12 }}
              />
              <Text
                style={{
                  fontSize: 16,
                  fontWeight: "500",
                  color: theme.colors.error,
                }}
              >
                Logout
              </Text>
            </View>
            <ChevronRight size={20} color={theme.colors.error} />
          </TouchableOpacity>
        </View>

        {/* App Info */}
        <View
          style={{
            alignItems: "center",
            marginTop: 24,
          }}
        >
          <Text
            style={{
              fontSize: 12,
              color: theme.colors.text.tertiary,
              marginBottom: 4,
            }}
          >
            ScrapCollect
          </Text>
          <Text
            style={{
              fontSize: 12,
              color: theme.colors.text.tertiary,
            }}
          >
            Version 1.0.0
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}
