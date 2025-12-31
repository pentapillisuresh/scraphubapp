import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useLocalSearchParams } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { User } from "lucide-react-native";
import { useTheme } from "@/utils/theme";
import { getUserData, saveUserData } from "../utils/storage";
import ApiService from "../utils/ApiService";
import AsyncStorage from "@react-native-async-storage/async-storage";

export default function ProfileSetup() {
  const insets = useSafeAreaInsets();
  const theme = useTheme();
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [userToken, setUserToken] = useState("");
  const { phoneNumber } = useLocalSearchParams();

  useEffect(() => {
    const rrr = async () => {
      const token = await AsyncStorage.getItem("Token");
      console.log("rrr::", token)
      setUserToken(token);
    }
    rrr();
  })
  const handleContinue = async () => {
    setError("");

    if (!name || name.trim().length < 2) {
      setError("Please enter your name");
      return;
    }

    try {
      const regPayload = {
        phone: phoneNumber,
        full_name: name.trim(),
      }
      const response = await ApiService.put(
        "/user", regPayload,
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${userToken}`,
          },
        }
      );

      const data = await response.data;
      // ✅ Save registered user data locally
      await saveUserData({
        id: data.id,
        phone: data.phone,
        name: data.full_name,
      });
      // ✅ Navigate to OTP verification screen
      console.log('userUpdate:::', response)

      router.replace({
        pathname: "/(tabs)/home",
        params: {
          phoneNumber: data.phone,
        },
      });
    } catch (err) {
      setError("Network error. Please try again.");
    }
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
            Submit
          </Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}
