import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { router, useLocalSearchParams } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ArrowLeft } from "lucide-react-native";
import { useTheme } from "@/utils/theme";
import { saveUserData } from "../utils/storage";

export default function OTP() {
  const insets = useSafeAreaInsets();
  const theme = useTheme();
  const { phoneNumber } = useLocalSearchParams();

  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [error, setError] = useState("");
  const [timer, setTimer] = useState(30);
  const inputRefs = useRef([]);

  useEffect(() => {
    const interval = setInterval(() => {
      setTimer((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleOtpChange = (value, index) => {
    setError("");
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Auto-focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    // Auto-verify when all filled
    if (newOtp.every((digit) => digit) && index === 5) {
      verifyOtp(newOtp.join(""));
    }
  };

  const handleKeyPress = (e, index) => {
    if (e.nativeEvent.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const verifyOtp = async (otpCode) => {
    // Mock verification - accept any 6-digit OTP
    if (otpCode.length === 6) {
      await saveUserData({
        isLoggedIn: true,
        phoneNumber: phoneNumber,
      });
      router.replace("/profile-setup");
    } else {
      setError("Invalid OTP");
    }
  };

  const handleResend = () => {
    setTimer(30);
    setOtp(["", "", "", "", "", ""]);
    setError("");
    inputRefs.current[0]?.focus();
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
          paddingTop: insets.top + 16,
          paddingHorizontal: 24,
        }}
      >
        {/* Header */}
        <TouchableOpacity
          onPress={() => router.back()}
          style={{
            width: 40,
            height: 40,
            borderRadius: 20,
            backgroundColor: theme.colors.input.background,
            justifyContent: "center",
            alignItems: "center",
            marginBottom: 32,
          }}
        >
          <ArrowLeft color={theme.colors.text.primary} size={20} />
        </TouchableOpacity>

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
            Verify OTP
          </Text>
          <Text
            style={{
              fontSize: 16,
              color: theme.colors.text.secondary,
            }}
          >
            Enter the code sent to {phoneNumber}
          </Text>
        </View>

        {/* OTP Inputs */}
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            marginBottom: 24,
          }}
        >
          {otp.map((digit, index) => (
            <TextInput
              key={index}
              ref={(ref) => (inputRefs.current[index] = ref)}
              value={digit}
              onChangeText={(value) => handleOtpChange(value, index)}
              onKeyPress={(e) => handleKeyPress(e, index)}
              keyboardType="number-pad"
              maxLength={1}
              style={{
                width: 50,
                height: 56,
                borderRadius: 12,
                backgroundColor: theme.colors.input.background,
                borderWidth: 2,
                borderColor: digit
                  ? theme.colors.primary
                  : error
                    ? theme.colors.error
                    : theme.colors.border,
                fontSize: 24,
                fontWeight: "bold",
                textAlign: "center",
                color: theme.colors.text.primary,
              }}
            />
          ))}
        </View>

        {error ? (
          <Text
            style={{
              fontSize: 14,
              color: theme.colors.error,
              textAlign: "center",
              marginBottom: 16,
            }}
          >
            {error}
          </Text>
        ) : null}

        {/* Resend */}
        <View
          style={{
            flexDirection: "row",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <Text
            style={{
              fontSize: 14,
              color: theme.colors.text.secondary,
              marginRight: 8,
            }}
          >
            Didn't receive code?
          </Text>
          {timer > 0 ? (
            <Text
              style={{
                fontSize: 14,
                color: theme.colors.text.tertiary,
              }}
            >
              Resend in {timer}s
            </Text>
          ) : (
            <TouchableOpacity onPress={handleResend}>
              <Text
                style={{
                  fontSize: 14,
                  fontWeight: "600",
                  color: theme.colors.primary,
                }}
              >
                Resend OTP
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}
