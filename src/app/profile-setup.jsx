import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { User } from "lucide-react-native";
import { useTheme } from "@/utils/theme";
import { getUserData, saveUserData } from "../utils/storage";

export default function ProfileSetup() {
  const insets = useSafeAreaInsets();
  const theme = useTheme();
  const [name, setName] = useState("");
  const [error, setError] = useState("");

  const handleContinue = async () => {
    setError("");

    if (!name || name.trim().length < 2) {
      setError("Please enter your name");
      return;
    }

    // Save user data with name
    const userData = await getUserData();
    await saveUserData({
      ...userData,
      name: name.trim(),
    });

    router.replace("/(tabs)/home");
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={{ flex: 1, backgroundColor: theme.colors.background }}
    >
      <StatusBar style={theme.isDark ? "light" : "dark"} />

      <View
        style={{
          flex: 1,
          paddingTop: insets.top + 40,
          paddingHorizontal: 24,
          justifyContent: "space-between",
          paddingBottom: insets.bottom + 24,
        }}
      >
        <View>
          {/* Title */}
          <View style={{ marginBottom: 48 }}>
            <Text
              style={{
                fontSize: 28,
                fontWeight: "bold",
                color: theme.colors.text.primary,
                marginBottom: 8,
              }}
            >
              What's your name?
            </Text>
            <Text
              style={{
                fontSize: 16,
                color: theme.colors.text.secondary,
              }}
            >
              Let us know how to address you
            </Text>
          </View>

          {/* Name Input */}
          <View style={{ marginBottom: 24 }}>
            <Text
              style={{
                fontSize: 14,
                fontWeight: "500",
                color: theme.colors.text.primary,
                marginBottom: 8,
              }}
            >
              Full Name
            </Text>

            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                backgroundColor: theme.colors.input.background,
                borderWidth: 1,
                borderColor: error ? theme.colors.error : theme.colors.border,
                borderRadius: 12,
                paddingHorizontal: 16,
                height: 56,
              }}
            >
              <User
                color={theme.colors.text.tertiary}
                size={20}
                style={{ marginRight: 12 }}
              />
              <TextInput
                placeholder="Enter your full name"
                placeholderTextColor={theme.colors.input.placeholder}
                value={name}
                onChangeText={(text) => {
                  setName(text);
                  setError("");
                }}
                style={{
                  flex: 1,
                  fontSize: 16,
                  color: theme.colors.text.primary,
                }}
              />
            </View>

            {error ? (
              <Text
                style={{
                  fontSize: 12,
                  color: theme.colors.error,
                  marginTop: 8,
                }}
              >
                {error}
              </Text>
            ) : null}
          </View>
        </View>

        {/* Continue Button */}
        <TouchableOpacity
          onPress={handleContinue}
          style={{
            backgroundColor: theme.colors.primary,
            height: 56,
            borderRadius: 12,
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <Text
            style={{
              fontSize: 16,
              fontWeight: "600",
              color: "white",
            }}
          >
            Continue
          </Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}
