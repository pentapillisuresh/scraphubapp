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
import { ArrowLeft, Clock } from "lucide-react-native";
import { useTheme } from "@/utils/theme";
import { saveUserData } from "../utils/storage";
import ApiService from "../utils/ApiService";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { sendSMS } from "../components/sendSMS";
import * as Clipboard from 'expo-clipboard';
import { AppState } from "react-native";

export default function OTP() {
  const insets = useSafeAreaInsets();
  const theme = useTheme();
  const { phoneNumber, otps, expiresAt } = useLocalSearchParams();
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [error, setError] = useState("");
  const [timer, setTimer] = useState(30);
  const [isCheckingClipboard, setIsCheckingClipboard] = useState(false);
  const [autoFillStatus, setAutoFillStatus] = useState("");
  const inputRefs = useRef([]);
  const appState = useRef(AppState.currentState);
  const autoFillTimeoutRef = useRef(null);

  // Handle auto-fill from URL params (for development/testing)
  useEffect(() => {
    if (otps && typeof otps === "string") {
      // Take only first 6 digits if there are more
      const cleanOtp = otps.replace(/\D/g, '').slice(0, 6);
      if (cleanOtp.length === 6) {
        setAutoFillStatus("Auto-filling OTP...");

        // Fill the exact 6 digits
        const otpArray = cleanOtp.split("");
        setOtp(otpArray);

        // Focus the last input
        inputRefs.current[5]?.focus();

        setTimeout(() => {
          setAutoFillStatus("Auto-verifying in 5 seconds...");
          setTimeout(() => {
            verifyOtp(cleanOtp);
          }, 5000);
        }, 2000);
      }
    }
  }, [otps]);

  useEffect(() => {
    const interval = setInterval(() => {
      setTimer((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [phoneNumber]);

  // Clean up timeouts on unmount
  useEffect(() => {
    return () => {
      if (autoFillTimeoutRef.current) {
        clearTimeout(autoFillTimeoutRef.current);
      }
    };
  }, []);

  // Check clipboard for OTP when app becomes active
  useEffect(() => {
    const subscription = AppState.addEventListener('change', async (nextAppState) => {
      if (
        appState.current.match(/inactive|background/) &&
        nextAppState === 'active'
      ) {
        // Wait 2.5 seconds before checking clipboard
        setTimeout(async () => {
          await checkClipboardForOTP();
        }, 2500);
      }
      appState.current = nextAppState;
    });

    return () => {
      subscription.remove();
    };
  }, []);

  // Check clipboard on component mount
  useEffect(() => {
    const initialCheck = async () => {
      autoFillTimeoutRef.current = setTimeout(async () => {
        await checkClipboardForOTP();
      }, 3000);
    };
    initialCheck();

    return () => {
      if (autoFillTimeoutRef.current) {
        clearTimeout(autoFillTimeoutRef.current);
      }
    };
  }, []);

  const checkClipboardForOTP = async () => {
    if (isCheckingClipboard || autoFillStatus.includes("Auto-filling")) return;

    setIsCheckingClipboard(true);
    try {
      setAutoFillStatus("Checking for OTP...");
      const clipboardText = await Clipboard.getStringAsync();

      // Extract exactly 6 digits from clipboard
      const digits = clipboardText.match(/\d/g);

      if (digits && digits.length >= 6) {
        // Take exactly 6 digits
        const cleanOtp = digits.slice(0, 6).join('');

        if (cleanOtp.length === 6) {
          setAutoFillStatus("6-digit OTP detected! Auto-filling...");

          // Fill exactly 6 digits
          const otpArray = cleanOtp.split("");
          setOtp(otpArray);

          // Focus the last input
          inputRefs.current[5]?.focus();

          setTimeout(() => {
            setAutoFillStatus("Auto-verifying in 4 seconds...");
            setTimeout(() => {
              verifyOtp(cleanOtp);
            }, 4000);
          }, 1500);
        }
      } else {
        // Try specific patterns for exact 6-digit OTP
        const otpPatterns = [
          /OTP[:\s-]*(\d{6})\b/i,
          /code[:\s-]*(\d{6})\b/i,
          /verification[:\s-]*(\d{6})\b/i,
          /\b(\d{6})[-\s]*is your OTP/i,
          /\b(\d{6})[-\s]*is your code/i,
          /\b(\d{6})[-\s]*is your verification code/i,
        ];

        let foundOtp = null;
        for (const pattern of otpPatterns) {
          const match = clipboardText.match(pattern);
          if (match && match[1] && match[1].length === 6) {
            foundOtp = match[1];
            break;
          }
        }

        if (foundOtp) {
          setAutoFillStatus("6-digit OTP detected! Auto-filling...");

          // Fill exactly 6 digits
          const otpArray = foundOtp.split("");
          setOtp(otpArray);

          // Focus the last input
          inputRefs.current[5]?.focus();

          setTimeout(() => {
            setAutoFillStatus("Auto-verifying in 4 seconds...");
            setTimeout(() => {
              verifyOtp(foundOtp);
            }, 4000);
          }, 1500);
        } else {
          setAutoFillStatus("");
        }
      }
    } catch (error) {
      console.log("Clipboard read error:", error);
      setAutoFillStatus("");
    } finally {
      setIsCheckingClipboard(false);
    }
  };

  const handleOtpChange = (value, index) => {
    setError("");
    setAutoFillStatus(""); // Clear auto-fill status when user types

    const newOtp = [...otp];

    // Allow only numeric input
    const numericValue = value.replace(/[^0-9]/g, '');

    if (numericValue.length > 1) {
      // User pasted multiple digits - take exactly 6 digits
      const digits = numericValue.match(/\d/g) || [];
      const exactSixDigits = digits.slice(0, 6);

      if (exactSixDigits.length === 6) {
        const updatedOtp = [...otp];
        exactSixDigits.forEach((digit, idx) => {
          if (idx < 6) {
            updatedOtp[idx] = digit;
          }
        });

        setOtp(updatedOtp);

        // Focus last input
        inputRefs.current[5]?.focus();

        // Show message and wait before auto-verifying
        setAutoFillStatus("OTP entered! Verifying in 3 seconds...");
        setTimeout(() => {
          verifyOtp(updatedOtp.join(""));
        }, 3000);
      } else {
        // If not exactly 6 digits, just fill what we can
        const updatedOtp = [...otp];
        exactSixDigits.forEach((digit, idx) => {
          if (index + idx < 6) {
            updatedOtp[index + idx] = digit;
          }
        });

        setOtp(updatedOtp);

        // Focus the last filled input
        const lastIndex = Math.min(index + exactSixDigits.length - 1, 5);
        inputRefs.current[lastIndex]?.focus();
      }
      return;
    }

    // Single digit entry
    newOtp[index] = numericValue;
    setOtp(newOtp);

    // Auto-focus next input
    if (numericValue && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    // Auto-verify when all 6 are filled
    if (newOtp.every((digit) => digit) && index === 5) {
      setAutoFillStatus("Auto-verifying in 3 seconds...");
      setTimeout(() => {
        verifyOtp(newOtp.join(""));
      }, 3000);
    }
  };

  const handleKeyPress = (e, index) => {
    if (e.nativeEvent.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const verifyOtp = async (otpCode) => {
    try {
      // Ensure exactly 6 digits
      if (otpCode.length !== 6) {
        setError("OTP must be exactly 6 digits");
        setAutoFillStatus("");
        return;
      }

      setAutoFillStatus("Verifying...");
      const verifyPayload = {
        phone: phoneNumber,
        otp: otpCode,
      }

      console.log("Verifying OTP:", verifyPayload);
      const response = await ApiService.post(
        "auth/login/phone/verify", verifyPayload,
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      console.log("Response:", response);
      if (!response.success) {
        setError(response.message || "Invalid OTP");
        setAutoFillStatus("");
        return;
      }

      // ✅ Save auth data
      await saveUserData({
        id: response.user.id,
        phone: response.user.phone,
        name: response.user.full_name,
        isLoggedIn: true,
      });
      await AsyncStorage.setItem("Token", response.token)

      setAutoFillStatus("Success! Redirecting...");

      // ✅ Route based on profile completion
      setTimeout(() => {
        if (!response.user.full_name) {
          router.replace({
            pathname: "/profile-setup", params: {
              phoneNumber: response.phone,
              otps: response.otp,
              expiresAt: response.expires_at,
            }
          });
        } else {
          router.replace("/(tabs)/home");
        }
      }, 1500);

    } catch (err) {
      setError("Network error. Please try again.");
      setAutoFillStatus("");
    }
  };

  const handleResend = async () => {
    setTimer(30);
    setOtp(["", "", "", "", "", ""]);
    setError("");
    setAutoFillStatus("");
    inputRefs.current[0]?.focus();

    const logonPayload = {
      phone: phoneNumber,
    }

    const response = await ApiService.post(
      "/auth/login/phone", logonPayload,
      {
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    console.log("Resend response:", response);
    if (response.success) {
      await sendSMS(response.phone, response.otp);
      setAutoFillStatus("New OTP sent! Check your SMS.");
      setTimeout(() => {
        setAutoFillStatus("");
      }, 3000);
    }
  };

  const handlePaste = async () => {
    try {
      setAutoFillStatus("Checking clipboard...");
      const clipboardText = await Clipboard.getStringAsync();

      // Extract exactly 6 digits
      const digits = clipboardText.match(/\d/g);

      if (digits && digits.length >= 6) {
        const cleanOtp = digits.slice(0, 6).join('');

        if (cleanOtp.length === 6) {
          setAutoFillStatus("Pasting 6-digit OTP...");

          // Fill exactly 6 digits
          const otpArray = cleanOtp.split("");
          setOtp(otpArray);

          // Focus the last input
          inputRefs.current[5]?.focus();

          setTimeout(() => {
            setAutoFillStatus("Auto-verifying in 4 seconds...");
            setTimeout(() => {
              verifyOtp(cleanOtp);
            }, 4000);
          }, 1500);
        } else {
          setAutoFillStatus("Could not find 6-digit OTP");
          setTimeout(() => {
            setAutoFillStatus("");
          }, 2000);
        }
      } else {
        setAutoFillStatus("No 6-digit OTP found in clipboard");
        setTimeout(() => {
          setAutoFillStatus("");
        }, 2000);
      }
    } catch (error) {
      console.log("Paste error:", error);
      setAutoFillStatus("Error reading clipboard");
      setTimeout(() => {
        setAutoFillStatus("");
      }, 2000);
    }
  };

  // Handle backspace to clear and move focus
  const handleBackspace = (index) => {
    const newOtp = [...otp];
    newOtp[index] = "";
    setOtp(newOtp);

    if (index > 0) {
      inputRefs.current[index - 1]?.focus();
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
          paddingTop: insets.top + 16,
          paddingHorizontal: 24,
          justifyContent: 'center',
        }}
      >
        {/* Title */}
        <View style={{ marginBottom: 48 }}>
          <Text
            style={{
              fontSize: 28,
              fontWeight: "bold",
              color: theme.colors.text.primary,
              marginBottom: 8,
              textAlign: 'center',
            }}
          >
            Verify OTP
          </Text>
          <Text
            style={{
              fontSize: 16,
              color: theme.colors.text.secondary,
              textAlign: 'center',
              marginBottom: 8,
            }}
          >
            Enter the 6-digit code sent to {phoneNumber}
          </Text>

          {autoFillStatus ? (
            <View style={{
              alignItems: 'center',
              marginTop: 8,
              padding: 8,
              backgroundColor: theme.colors.primary + '10',
              borderRadius: 8,
              borderWidth: 1,
              borderColor: theme.colors.primary + '30',
            }}>
              <Text
                style={{
                  fontSize: 12,
                  color: theme.colors.primary,
                  fontStyle: 'italic',
                  textAlign: 'center',
                }}
              >
                {autoFillStatus}
              </Text>
            </View>
          ) : (
            <Text
              style={{
                fontSize: 12,
                color: theme.colors.primary,
                marginTop: 8,
                fontStyle: 'italic',
                textAlign: 'center',
              }}
            >
              OTP will be auto-filled from SMS
            </Text>
          )}
        </View>

        {/* OTP Inputs - Exactly 6 boxes */}
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            marginBottom: 24,
            paddingHorizontal: 10,
          }}
        >
          {[0, 1, 2, 3, 4, 5].map((index) => (
            <TextInput
              key={index}
              ref={(ref) => (inputRefs.current[index] = ref)}
              value={otp[index]}
              onChangeText={(value) => handleOtpChange(value, index)}
              onKeyPress={(e) => {
                if (e.nativeEvent.key === 'Backspace' && !otp[index]) {
                  handleBackspace(index);
                }
              }}
              keyboardType="number-pad"
              maxLength={1}
              style={{
                width: 48,
                height: 56,
                borderRadius: 12,
                backgroundColor: theme.colors.input.background,
                borderWidth: 2,
                borderColor: otp[index]
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

        {/* Status message */}
        {autoFillStatus && (
          <View style={{
            alignItems: 'center',
            marginBottom: 16,
          }}>
            <Text style={{
              fontSize: 12,
              color: theme.colors.text.secondary,
              textAlign: 'center',
              marginBottom: 4,
            }}>
              ⏳ {autoFillStatus}
            </Text>
          </View>
        )}

        {/* Paste Button */}
        <TouchableOpacity
          onPress={handlePaste}
          style={{
            alignSelf: 'center',
            paddingHorizontal: 20,
            paddingVertical: 12,
            backgroundColor: theme.colors.primary + '15',
            borderRadius: 10,
            marginBottom: 24,
            borderWidth: 1,
            borderColor: theme.colors.primary + '40',
            flexDirection: 'row',
            alignItems: 'center',
            width: '80%',
            justifyContent: 'center',
          }}
        >
          <Text
            style={{
              fontSize: 15,
              fontWeight: '600',
              color: theme.colors.primary,
            }}
          >
            📋 Paste 6-digit OTP
          </Text>
        </TouchableOpacity>

        {error ? (
          <View style={{
            backgroundColor: theme.colors.error + '10',
            padding: 12,
            borderRadius: 8,
            marginBottom: 16,
            borderWidth: 1,
            borderColor: theme.colors.error + '30',
          }}>
            <Text
              style={{
                fontSize: 14,
                color: theme.colors.error,
                textAlign: "center",
              }}
            >
              ⚠️ {error}
            </Text>
          </View>
        ) : null}

        {/* Resend */}
        <View
          style={{
            flexDirection: "row",
            justifyContent: "center",
            alignItems: "center",
            marginBottom: 24,
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
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Clock size={14} color={theme.colors.text.tertiary} style={{ marginRight: 4 }} />
              <Text
                style={{
                  fontSize: 14,
                  color: theme.colors.text.tertiary,
                  fontWeight: '500',
                }}
              >
                {timer}s
              </Text>
            </View>
          ) : (
            <TouchableOpacity onPress={handleResend} style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Text
                style={{
                  fontSize: 14,
                  fontWeight: "600",
                  color: theme.colors.primary,
                  marginRight: 4,
                }}
              >
                Resend OTP
              </Text>
              <Clock size={14} color={theme.colors.primary} />
            </TouchableOpacity>
          )}
        </View>

        {/* Back to Login Button */}
        <TouchableOpacity
          onPress={() => router.push('./login')}
          style={{
            alignSelf: 'center',
            paddingHorizontal: 20,
            paddingVertical: 12,
            backgroundColor: theme.colors.input.background,
            borderRadius: 10,
            borderWidth: 1,
            borderColor: theme.colors.border,
            flexDirection: 'row',
            alignItems: 'center',
            width: '80%',
            justifyContent: 'center',
          }}
        >
          <ArrowLeft size={16} color={theme.colors.primary} style={{ marginRight: 8 }} />
          <Text
            style={{
              fontSize: 15,
              fontWeight: "600",
              color: theme.colors.primary,
            }}
          >
            Back to Login
          </Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}