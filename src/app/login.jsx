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
import { Recycle, Phone, CheckCircle, XCircle } from "lucide-react-native";
import { useTheme } from "../utils/theme";
import ApiService from "../utils/ApiService";

export default function Login() {
  const insets = useSafeAreaInsets();
  const theme = useTheme();
  const [phoneNumber, setPhoneNumber] = useState("");
  const [error, setError] = useState("");
  const [isValid, setIsValid] = useState(false);
  const [loading, setLoading] = useState(false);

  const validatePhoneNumber = (text) => {
    // Remove all non-digit characters
    const cleaned = text.replace(/\D/g, '');

    // Limit to 10 digits
    const limited = cleaned.slice(0, 10);

    setPhoneNumber(limited);

    // Validate
    if (limited.length === 10) {
      setIsValid(true);
      setError("");
    } else {
      setIsValid(false);
      if (limited.length > 0) {
        setError("Phone number must be exactly 10 digits");
      } else {
        setError("");
      }
    }
  };

  const formatPhoneNumber = (text) => {
    // Format as XXX-XXX-XXXX
    const cleaned = text.replace(/\D/g, '');
    const match = cleaned.match(/^(\d{0,3})(\d{0,3})(\d{0,4})$/);

    if (match) {
      return !match[2] ? match[1] : `${match[1]}-${match[2]}${match[3] ? `-${match[3]}` : ''}`;
    }
    return text;
  };

  const handleSendOTP = async () => {
    setError("");

    if (!phoneNumber) {
      setError("Please enter your phone number");
      return;
    }

    if (phoneNumber.length !== 10) {
      setError("Phone number must be exactly 10 digits");
      return;
    }

    const cleanNumber = phoneNumber.replace(/\D/g, '');

    try {
      setLoading(true);
      const logonPayload = {
        phone: cleanNumber,
      }
      const response = await ApiService.post(
        "/auth/login/phone", logonPayload,
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      if (response.success) {
        router.push({
          pathname: "/otp",
          params: {
            phoneNumber: response.phone,
            otps: response.otp,              // ⚠️ For development only
            expiresAt: response.expires_at,
          },
        });
        setError(data.message);
        return;
      }
      
    } catch (err) {
      console.log("error::", err.data.message)
           setError(err.data.message);
    } finally {
      setLoading(false);
    }
  };

  // Format the displayed phone number
  const displayPhoneNumber = formatPhoneNumber(phoneNumber);

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
        }}
      >
        {/* Logo */}
        <View style={{ alignItems: "center", marginBottom: 48 }}>
          <View
            style={{
              width: 80,
              height: 80,
              borderRadius: 40,
              backgroundColor: theme.colors.primary,
              justifyContent: "center",
              alignItems: "center",
              marginBottom: 16,
            }}
          >
            <Recycle color="white" size={40} strokeWidth={2} />
          </View>
          <Text
            style={{
              fontSize: 28,
              fontWeight: "bold",
              color: theme.colors.text.primary,
              marginBottom: 8,
            }}
          >
            Welcome Back
          </Text>
          <Text
            style={{
              fontSize: 16,
              color: theme.colors.text.secondary,
              textAlign: "center",
            }}
          >
            Enter your 10-digit phone number to continue
          </Text>
        </View>

        {/* Phone Input */}
        <View style={{ marginBottom: 24 }}>
          <Text
            style={{
              fontSize: 14,
              fontWeight: "500",
              color: theme.colors.text.primary,
              marginBottom: 8,
            }}
          >
            Phone Number
            <Text style={{ color: theme.colors.text.tertiary, fontSize: 12 }}>
              {" "}(10 digits required)
            </Text>
          </Text>

          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              backgroundColor: theme.colors.input.background,
              borderWidth: 1,
              borderColor: error
                ? theme.colors.error
                : isValid
                  ? theme.colors.success
                  : theme.colors.border,
              borderRadius: 12,
              paddingHorizontal: 16,
              height: 56,
            }}
          >
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                flex: 1,
              }}
            >
              <Phone
                color={theme.colors.text.tertiary}
                size={20}
                style={{ marginRight: 12 }}
              />
              <TextInput
                placeholder="XXX-XXX-XXXX"
                placeholderTextColor={theme.colors.input.placeholder}
                keyboardType="phone-pad"
                value={displayPhoneNumber}
                onChangeText={validatePhoneNumber}
                maxLength={12} // Account for dashes: XXX-XXX-XXXX
                style={{
                  flex: 1,
                  fontSize: 16,
                  color: theme.colors.text.primary,
                }}
              />
            </View>

            {phoneNumber.length > 0 && (
              <View style={{ marginLeft: 12 }}>
                {isValid ? (
                  <CheckCircle size={20} color={theme.colors.success} />
                ) : (
                  <XCircle size={20} color={theme.colors.error} />
                )}
              </View>
            )}
          </View>

          {/* Character counter and status */}
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
              marginTop: 8,
            }}
          >
            <Text
              style={{
                fontSize: 12,
                color: error
                  ? theme.colors.error
                  : isValid
                    ? theme.colors.success
                    : theme.colors.text.tertiary,
              }}
            >
              {error || (isValid ? "✓ Valid phone number" : `Enter ${10 - phoneNumber.length} more digits`)}
            </Text>
            <Text
              style={{
                fontSize: 12,
                color: theme.colors.text.tertiary,
              }}
            >
              {phoneNumber.length}/10
            </Text>
          </View>
        </View>

        {/* Send OTP Button */}
        <TouchableOpacity
          onPress={handleSendOTP}
          disabled={!isValid || loading}
          style={{
            backgroundColor: isValid ? theme.colors.primary : theme.colors.input.background,
            height: 56,
            borderRadius: 12,
            justifyContent: "center",
            alignItems: "center",
            marginBottom: 16,
            opacity: isValid && !loading ? 1 : 0.6,
          }}
        >
          <Text
            style={{
              fontSize: 16,
              fontWeight: "600",
              color: isValid ? "white" : theme.colors.text.secondary,
            }}
          >
            {loading ? "Sending OTP..." : "Send OTP"}
          </Text>
        </TouchableOpacity>

        {/* Example format */}
        <View
          style={{
            backgroundColor: theme.colors.card.background,
            borderRadius: 8,
            padding: 12,
            marginBottom: 16,
            borderWidth: 1,
            borderColor: theme.colors.border,
          }}
        >
          <Text
            style={{
              fontSize: 12,
              fontWeight: "500",
              color: theme.colors.text.secondary,
              marginBottom: 4,
            }}
          >
            Example format:
          </Text>
          <Text
            style={{
              fontSize: 14,
              color: theme.colors.text.primary,
            }}
          >
            987-654-3210
          </Text>
        </View>

        {/* Terms */}
        <Text
          style={{
            fontSize: 12,
            color: theme.colors.text.tertiary,
            textAlign: "center",
            lineHeight: 18,
          }}
        >
          By continuing, you agree to our{" "}
          <Text style={{ color: theme.colors.primary }}>Terms of Service</Text>{" "}
          and{" "}
          <Text style={{ color: theme.colors.primary }}>Privacy Policy</Text>
        </Text>
      </View>
    </KeyboardAvoidingView>
  );
}