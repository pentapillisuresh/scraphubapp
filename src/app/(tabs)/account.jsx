import React, { useState,useEffect, useCallback } from "react";
import { View, Text, ScrollView, TouchableOpacity, Switch, Alert, useColorScheme, Appearance, Modal, TextInput, Image, } from "react-native";
import { StatusBar } from "expo-status-bar";
import { router, useFocusEffect } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { User, Moon, Sun, LogOut, ChevronRight, Phone, Pencil, Camera, Image as ImageIcon, X, } from "lucide-react-native";
import * as ImagePicker from "expo-image-picker";
import { useTheme } from "@/utils/theme";
import { getUserData, clearUserData, saveThemePreference, getThemePreference, } from "../../utils/storage";
import ApiService from "../../utils/ApiService";
import AsyncStorage from "@react-native-async-storage/async-storage";

const API_URL = "/user";

export default function Account() {
  const insets = useSafeAreaInsets();
  const theme = useTheme();
  const colorScheme = useColorScheme();
  const [userData, setUserData] = useState(null);
  const [isDarkMode, setIsDarkMode] = useState(colorScheme === "dark");


  // Edit modal states
  const [editVisible, setEditVisible] = useState(false);
  const [fullName, setFullName] = useState("");
  const [image, setImage] = useState(null);

  useFocusEffect(
    useCallback(() => {
      fetchProfile();
      loadThemePreference();
    }, [])
  );

  useEffect(() => {
    loadUserData();
    loadThemePreference();
  }, []);

  const fetchProfile = async () => {
    try {
      const token = await AsyncStorage.getItem("Token");
      const res = await ApiService.get(API_URL, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (res.success) {
        setUserData(res.data);
        setFullName(res.data.full_name);
      }
    } catch (err) {
      console.log("Profile fetch error:", err);
    }
  };
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

  /* ------------------ IMAGE PICKER ------------------ */
  const pickFromGallery = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      allowsEditing: false,
      allowsMultipleSelection: false,
      quality: 0.8,
    });

    if (!result.canceled) {
      setImage(result.assets[0]);
    }
  };

  const pickFromCamera = async () => {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) return;

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: false,
      quality: 0.8,
    });

    if (!result.canceled) {
      setImage(result.assets[0]);
    }
  };

  /* ------------------ UPDATE PROFILE ------------------ */
  const updateProfile = async () => {
    try {
      const token = await AsyncStorage.getItem("Token");

      const formData = new FormData();
      formData.append("full_name", fullName);

      if (image) {
        formData.append("profile_image", {
          uri: image.uri,
          name: "profile.jpg",
          type: "image/jpeg",
        });
      }

      const res = await ApiService.put(API_URL, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (res.success) {
        setEditVisible(false);
        setImage(null);
        fetchProfile();
      } else {
        Alert.alert("Error", "Failed to update profile");
      }
    } catch (err) {
      console.log("Update error:", err);
    }
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
            marginTop: 24,
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
            {userData?.profile_image ?
              <Image
                source={
                  userData?.profile_image
                    ? { uri: userData.profile_image }
                    : undefined
                }
                style={{
                  width: 60,
                  height: 60,
                  borderRadius: 30,
                  backgroundColor: "rgba(255,255,255,0.3)",
                }}
              /> :
              <User size={30} color="white" />
            }
          </View>
          <View style={{ flex: 1, marginLeft: 16 }}>
            <Text
              style={{
                fontSize: 20,
                fontWeight: "bold",
                color: "white",
                marginBottom: 4,
              }}
            >
              {userData?.full_name || "User"}
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
                {userData?.phone || "Not available"}
              </Text>
            </View>
          </View>
          <TouchableOpacity onPress={() => setEditVisible(true)}>
            <Pencil size={20} color="white" />
          </TouchableOpacity>
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
      <Modal visible={editVisible} transparent animationType="slide">
        <View
          style={{
            flex: 1,
            backgroundColor: "rgba(0,0,0,0.5)",
            justifyContent: "center",
            padding: 24,
          }}
        >
          <View
            style={{
              backgroundColor: theme.colors.card.background,
              borderRadius: 16,
              padding: 20,
            }}
          >
            {/* Header */}
            <View
              style={{ flexDirection: "row", justifyContent: "space-between" }}
            >
              <Text style={{ fontSize: 18, fontWeight: "bold" }}>
                Edit Profile
              </Text>
              <TouchableOpacity onPress={() => setEditVisible(false)}>
                <X />
              </TouchableOpacity>
            </View>

            {/* PROFILE IMAGE PREVIEW */}
            <View
              style={{
                alignItems: "center",
                marginTop: 20,
                marginBottom: 8,
              }}
            >
              <Image
                source={{
                  uri: image?.uri || userData?.profile_image,
                }}
                style={{
                  width: 90,
                  height: 90,
                  borderRadius: 45,
                  backgroundColor: theme.colors.border,
                }}
              />
              <Text
                style={{
                  marginTop: 8,
                  fontSize: 12,
                  color: theme.colors.text.secondary,
                }}
              >
                Tap camera or gallery to change
              </Text>
            </View>

            {/* FULL NAME INPUT */}
            <TextInput
              value={fullName}
              onChangeText={setFullName}
              placeholder="Full Name"
              style={{
                borderWidth: 1,
                borderColor: theme.colors.border,
                marginTop: 16,
                padding: 12,
                borderRadius: 8,
              }}
            />

            {/* IMAGE PICKERS */}
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-around",
                marginTop: 16,
              }}
            >
              <TouchableOpacity
                onPress={pickFromCamera}
                style={{ alignItems: "center" }}
              >
                <Camera size={24} />
                <Text style={{ fontSize: 12, marginTop: 4 }}>Camera</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={pickFromGallery}
                style={{ alignItems: "center" }}
              >
                <ImageIcon size={24} />
                <Text style={{ fontSize: 12, marginTop: 4 }}>Gallery</Text>
              </TouchableOpacity>
            </View>

            {/* SAVE BUTTON */}
            <TouchableOpacity
              onPress={updateProfile}
              style={{
                marginTop: 24,
                backgroundColor: theme.colors.primary,
                padding: 14,
                borderRadius: 8,
                alignItems: "center",
              }}
            >
              <Text style={{ color: "white", fontWeight: "bold" }}>
                Save Changes
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}
