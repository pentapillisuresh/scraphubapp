import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { router, useLocalSearchParams } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import SmsRetriever from "react-native-sms-retriever";

import { useTheme } from "@/utils/theme";
import { saveUserData } from "../utils/storage";
import ApiService from "../utils/ApiService";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { sendSMS } from "../components/sendSMS";

export default function OTP() {
  const insets = useSafeAreaInsets();
  const theme = useTheme();
  const { phoneNumber } = useLocalSearchParams();

  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [error, setError] = useState("");
  const [timer, setTimer] = useState(30);

  const inputRefs = useRef([]);

  /* ---------------- TIMER ---------------- */
  useEffect(() => {
    const interval = setInterval(() => {
      setTimer((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [phoneNumber]);

  /* ---------------- ANDROID AUTO READ OTP ---------------- */
  useEffect(() => {
    if (Platform.OS !== "android") return;

    const startListener = async () => {
      try {
        const registered = await SmsRetriever.startSmsRetriever();
        if (registered) {
          SmsRetriever.addSmsListener(event => {
            const message = event.message;
            const code = message.match(/\b\d{6}\b/)?.[0];

            if (code) {
              const arr = code.split("");
              setOtp(arr);
              verifyOtp(code);
            }

            SmsRetriever.removeSmsListener();
          });
        }
      } catch (e) {
        console.log("SMS Retriever error", e);
      }
    };

    startListener();
    return () => SmsRetriever.removeSmsListener();
  }, []);

  /* ---------------- OTP INPUT ---------------- */
  const handleOtpChange = (value, index) => {
    setError("");
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    if (newOtp.every(d => d) && index === 5) {
      verifyOtp(newOtp.join(""));
    }
  };

  const handleKeyPress = (e, index) => {
    if (e.nativeEvent.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  /* ---------------- VERIFY OTP ---------------- */
  const verifyOtp = async (otpCode) => {
    try {
      if (otpCode.length !== 6) {
        setError("Invalid OTP");
        return;
      }

      const response = await ApiService.post(
        "auth/login/phone/verify",
        { phone: phoneNumber, otp: otpCode },
        { headers: { "Content-Type": "application/json" } }
      );

      if (!response.success) {
        setError(response.message || "Invalid OTP");
        return;
      }

      await saveUserData({
        id: response.user.id,
        phone: response.user.phone,
        name: response.user.full_name,
        isLoggedIn: true,
      });

      await AsyncStorage.setItem("Token", response.token);

      if (!response.user.full_name) {
        router.replace("/profile-setup");
      } else {
        router.replace("/(tabs)/home");
      }
    } catch {
      setError("Network error. Please try again.");
    }
  };

  /* ---------------- RESEND OTP ---------------- */
  const handleResend = async () => {
    setTimer(30);
    setOtp(["", "", "", "", "", ""]);
    setError("");
    inputRefs.current[0]?.focus();

    const response = await ApiService.post(
      "/auth/login/phone",
      { phone: phoneNumber },
      { headers: { "Content-Type": "application/json" } }
    );

    if (response.success) {
      await sendSMS(response.phone, response.otp);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: theme.colors.background }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={Platform.OS === "ios" ? insets.top : 0}
    >
      <StatusBar style={theme.isDark ? "light" : "dark"} />

      <ScrollView
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          flexGrow: 1,
          paddingHorizontal: 24,
          paddingTop: insets.top + 16,
          paddingBottom: insets.bottom + 16,
        }}
      >
        <View style={{ flex: 1, justifyContent: "center" }}>
          <Text
            style={{
              fontSize: 28,
              fontWeight: "bold",
              color: theme.colors.text.primary,
              textAlign: "center",
              marginBottom: 8,
            }}
          >
            Verify OTP
          </Text>

          <Text
            style={{
              fontSize: 16,
              color: theme.colors.text.secondary,
              textAlign: "center",
              marginBottom: 40,
            }}
          >
            Enter the code sent to {phoneNumber}
          </Text>

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
                onChangeText={(v) => handleOtpChange(v, index)}
                onKeyPress={(e) => handleKeyPress(e, index)}
                keyboardType="number-pad"
                textContentType="oneTimeCode"   // iOS auto-fill
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

          {error && (
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
          )}

          <View style={{ alignItems: "center", marginBottom: 24 }}>
            {timer > 0 ? (
              <Text style={{ color: theme.colors.text.tertiary }}>
                Resend in {timer}s
              </Text>
            ) : (
              <TouchableOpacity onPress={handleResend}>
                <Text style={{ color: theme.colors.primary, fontWeight: "600" }}>
                  Resend OTP
                </Text>
              </TouchableOpacity>
            )}
          </View>

          <TouchableOpacity
            onPress={() => router.push("./login")}
            style={{
              height: 40,
              borderRadius: 12,
              backgroundColor: theme.colors.input.background,
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <Text style={{ color: theme.colors.primary, fontWeight: "600" }}>
              Back to Login
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
