import React, { useState, useEffect, useCallback } from "react";
import { View, Text, ScrollView, TouchableOpacity, Image, Alert, TextInput } from "react-native";
import { StatusBar } from "expo-status-bar";
import { router, useLocalSearchParams } from "expo-router";
import { useFocusEffect } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as ImagePicker from "expo-image-picker";
import { Camera, Image as ImageIcon, X, ArrowLeft, ArrowRight, Plus } from "lucide-react-native";
import { useTheme } from "@/utils/theme";
import { getDraftRequest, saveDraftRequest, clearDraftRequest } from "../../utils/storage";

const categoryNames = {
  paper: "Paper",
  plastic: "Plastic",
  metal: "Metal",
  electronics: "Electronics",
  appliances: "Appliances",
  other: "Other",
};

const categoryColors = {
  paper: "#FF6B6B",
  plastic: "#4ECDC4",
  metal: "#95A5A6",
  electronics: "#3498DB",
  appliances: "#9B59B6",
  other: "#E67E22",
};

export default function PhotoUpload() {
  const insets = useSafeAreaInsets();
  const theme = useTheme();
  const params = useLocalSearchParams();

  const [categories, setCategories] = useState([]);
  const [photos, setPhotos] = useState({});
  const [weights, setWeights] = useState({});
  const [isCameraReady, setIsCameraReady] = useState(true);
  const [hasLoaded, setHasLoaded] = useState(false);

  // 🔥 COMPLETE Reset function
  const resetState = useCallback(() => {
    console.log("🚀 Resetting PhotoUpload state COMPLETELY...");
    setPhotos({});
    setWeights({});
    setCategories([]);
    setHasLoaded(false);
  }, []);

  // 🔥 Check if we're coming from a fresh start
  useEffect(() => {
    console.log("📱 PhotoUpload component mounted");

    // If we have a refresh param from Home, reset everything
    if (params.refresh) {
      console.log("🔄 Refresh param detected, resetting state");
      resetState();
      clearDraftRequest();
    }

    return () => {
      console.log("📱 PhotoUpload component unmounting");
    };
  }, [params.refresh, resetState]);

  useFocusEffect(
    useCallback(() => {
      console.log("📸 PhotoUpload screen focused");

      // 🔥 ALWAYS reset state first when screen comes into focus
      resetState();

      // Then load fresh data
      loadFreshDraft();

      // Request permissions on focus
      (async () => {
        await ImagePicker.requestCameraPermissionsAsync();
        await ImagePicker.requestMediaLibraryPermissionsAsync();
      })();

      return () => {
        // Cleanup when screen loses focus
        setIsCameraReady(true);
      };
    }, [resetState])
  );

  // 🔥 NEW: Load fresh draft (always starts clean)
  const loadFreshDraft = useCallback(async () => {
    try {
      console.log("📥 Loading fresh draft...");
      const draft = await getDraftRequest();
      console.log("📦 Draft data found:", draft ? "Yes" : "No");

      if (draft && draft.categories && draft.categories.length > 0) {
        console.log("✅ Setting categories from draft:", draft.categories.length);
        setCategories(draft.categories);

        // Only load photos/weights if they exist
        if (draft.photos && Object.keys(draft.photos).length > 0) {
          console.log("🖼️ Setting photos from draft");
          setPhotos(draft.photos);
        }

        if (draft.weights && Object.keys(draft.weights).length > 0) {
          console.log("⚖️ Setting weights from draft");
          setWeights(draft.weights);
        }

        setHasLoaded(true);
      } else {
        console.log("❌ No valid draft found, going back to Home");
        // Clear any leftover data
        await clearDraftRequest();
        router.replace("/(tabs)/home");
      }
    } catch (error) {
      console.error("❌ Error loading draft:", error);
      await clearDraftRequest();
      router.replace("/(tabs)/home");
    }
  }, []);

  const pickImage = async (categoryId, useCamera = false) => {
    try {
      // Prevent multiple camera calls
      if (!isCameraReady) return;

      if (useCamera) {
        setIsCameraReady(false);

        // Request camera permissions with better handling
        const { status } = await ImagePicker.requestCameraPermissionsAsync();

        if (status !== 'granted') {
          Alert.alert(
            "Permission Denied",
            "Camera permission is required to take photos. Please enable it in settings.",
            [
              { text: "Cancel", style: "cancel" },
              { text: "Open Settings", onPress: () => ImagePicker.getCameraPermissionsAsync() }
            ]
          );
          setIsCameraReady(true);
          return;
        }

        // Launch camera with cleanup
        const result = await ImagePicker.launchCameraAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          allowsEditing: false,
          quality: 0.8,
          exif: false,
          base64: false,
        });

        // Handle result
        if (!result.canceled && result.assets && result.assets.length > 0) {
          const newPhotos = { ...photos };
          if (!newPhotos[categoryId]) {
            newPhotos[categoryId] = [];
          }
          newPhotos[categoryId].push(result.assets[0].uri);
          setPhotos(newPhotos);
        }

        // Add a small delay before allowing camera again
        setTimeout(() => {
          setIsCameraReady(true);
        }, 500);

      } else {
        // For gallery
        const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();

        if (!permission.granted) {
          Alert.alert(
            "Permission Denied",
            "Gallery permission is required to select photos.",
            [
              { text: "Cancel", style: "cancel" },
              { text: "Open Settings", onPress: () => ImagePicker.getMediaLibraryPermissionsAsync() }
            ]
          );
          return;
        }

        const result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          allowsEditing: false,
          allowsMultipleSelection: false,
          quality: 0.8,
          selectionLimit: 1,
        });

        if (!result.canceled && result.assets && result.assets.length > 0) {
          const newPhotos = { ...photos };
          if (!newPhotos[categoryId]) {
            newPhotos[categoryId] = [];
          }
          newPhotos[categoryId].push(result.assets[0].uri);
          setPhotos(newPhotos);
        }
      }
    } catch (error) {
      console.error("Error picking image:", error);
      Alert.alert("Error", "Failed to pick image. Please try again.");
      setIsCameraReady(true);
    }
  };

  const removePhoto = (categoryId, index) => {
    const newPhotos = { ...photos };
    if (newPhotos[categoryId]) {
      newPhotos[categoryId].splice(index, 1);
      if (newPhotos[categoryId].length === 0) {
        delete newPhotos[categoryId];
      }
      setPhotos(newPhotos);
    }
  };

  const updateWeight = (categoryId, value) => {
    const newWeights = { ...weights };
    newWeights[categoryId] = value;
    setWeights(newWeights);
  };

  const handleContinue = async () => {
    // Check if all categories have at least 1 photo
    const missingPhotos = categories.filter((catObj) => {
      const id = Object.keys(catObj)[0];
      return !photos[id] || photos[id].length === 0;
    });

    if (missingPhotos.length > 0) {
      Alert.alert(
        "Photos Required",
        `Please add at least 1 photo for: ${missingPhotos
          .map((catObj) => {
            const id = Object.keys(catObj)[0];
            return categoryNames[id] || id;
          })
          .join(", ")}`
      );
      return;
    }

    const draft = await getDraftRequest();
    if (!draft || !draft.categories) {
      Alert.alert("Error", "No categories found. Please start over.");
      resetState();
      clearDraftRequest();
      router.replace("/(tabs)/home");
      return;
    }

    await saveDraftRequest({
      ...draft,
      photos,
      weights,
    });

    router.push("/(tabs)/address");
  };

  const handleBack = () => {
    // 🔥 Reset state before going back
    resetState();
    // Also clear draft since user is going back to start over
    clearDraftRequest();
    router.back();
  };

  const totalPhotos = Object.values(photos).reduce(
    (sum, imgs) => sum + (imgs ? imgs.length : 0),
    0,
  );

  const allCategoriesHavePhotos = categories.every((catObj) => {
    const id = Object.keys(catObj)[0];
    return photos[id] && photos[id].length > 0;
  });

  // Show loading if categories haven't loaded yet
  if (!hasLoaded && categories.length === 0) {
    return (
      <View style={{
        flex: 1,
        backgroundColor: theme.colors.background,
        justifyContent: 'center',
        alignItems: 'center'
      }}>
        <StatusBar style={theme.isDark ? "light" : "dark"} />
        <View style={{
          width: 80,
          height: 80,
          borderRadius: 40,
          backgroundColor: theme.colors.primary + "20",
          justifyContent: 'center',
          alignItems: 'center',
          marginBottom: 20,
        }}>
          <Text style={{ fontSize: 24, color: theme.colors.primary }}>📸</Text>
        </View>
        <Text style={{
          marginTop: 20,
          fontSize: 16,
          fontWeight: '500',
          color: theme.colors.text.secondary
        }}>
          Loading photos...
        </Text>
      </View>
    );
  }

  // If categories array is empty (no draft), show message
  if (categories.length === 0 && hasLoaded) {
    return (
      <View style={{
        flex: 1,
        backgroundColor: theme.colors.background,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20
      }}>
        <StatusBar style={theme.isDark ? "light" : "dark"} />
        <View style={{
          width: 100,
          height: 100,
          borderRadius: 50,
          backgroundColor: theme.colors.primary + "10",
          justifyContent: 'center',
          alignItems: 'center',
          marginBottom: 20,
        }}>
          <Text style={{ fontSize: 40, color: theme.colors.primary }}>📦</Text>
        </View>
        <Text style={{
          fontSize: 20,
          fontWeight: 'bold',
          color: theme.colors.text.primary,
          marginBottom: 10,
          textAlign: 'center'
        }}>
          No Categories Selected
        </Text>
        <Text style={{
          fontSize: 14,
          color: theme.colors.text.secondary,
          marginBottom: 30,
          textAlign: 'center'
        }}>
          Please go back and select categories first
        </Text>
        <TouchableOpacity
          onPress={() => {
            resetState();
            clearDraftRequest();
            router.replace("/(tabs)/home");
          }}
          style={{
            backgroundColor: theme.colors.primary,
            paddingHorizontal: 30,
            paddingVertical: 15,
            borderRadius: 12,
          }}
        >
          <Text style={{
            color: 'white',
            fontSize: 16,
            fontWeight: '600'
          }}>
            Go Back to Home
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <StatusBar style={theme.isDark ? "light" : "dark"} />

      {/* Header */}
      <View
        style={{
          paddingTop: insets.top + 16,
          paddingHorizontal: 24,
          paddingBottom: 16,
          backgroundColor: theme.colors.surface,
          borderBottomWidth: 1,
          borderBottomColor: theme.colors.border,
        }}
      >
        <View style={{ flexDirection: "row", alignItems: "center" }}>
          <TouchableOpacity
            onPress={handleBack}
            style={{
              width: 40,
              height: 40,
              borderRadius: 20,
              backgroundColor: theme.colors.input.background,
              justifyContent: "center",
              alignItems: "center",
              marginRight: 16,
            }}
          >
            <ArrowLeft color={theme.colors.text.primary} size={20} />
          </TouchableOpacity>
          <View>
            <Text
              style={{
                fontSize: 20,
                fontWeight: "bold",
                color: theme.colors.text.primary,
              }}
            >
              Upload Photos
            </Text>
            <Text
              style={{
                fontSize: 14,
                color: theme.colors.text.secondary,
                marginTop: 2,
              }}
            >
              {totalPhotos} photo{totalPhotos !== 1 ? "s" : ""} added •{" "}
              {categories.length}{" "}
              {categories.length === 1 ? "category" : "categories"}
            </Text>
          </View>
        </View>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{
          paddingTop: 24,
          paddingHorizontal: 24,
          paddingBottom: insets.bottom + 100,
        }}
        showsVerticalScrollIndicator={false}
      >
        {/* Info Banner */}
        <View
          style={{
            backgroundColor: theme.colors.primary + "20",
            borderRadius: 12,
            padding: 16,
            marginBottom: 24,
            borderLeftWidth: 4,
            borderLeftColor: theme.colors.primary,
          }}
        >
          <Text
            style={{
              fontSize: 14,
              color: theme.colors.text.primary,
              lineHeight: 20,
              fontWeight: "500",
            }}
          >
            Upload photos for each category. Add weight (optional) for better
            pricing estimates.
          </Text>
        </View>

        {/* Category Sections */}
        {categories.map((categoryObj, index) => {
          const categoryId = Object.keys(categoryObj)[0];
          const categoryName = categoryObj[categoryId];
          const categoryColor = categoryColors[categoryId];
          const categoryPhotos = photos[categoryId] || [];
          const hasPhotos = categoryPhotos.length > 0;

          return (
            <View
              key={categoryId}
              style={{
                backgroundColor: theme.colors.card.background,
                borderRadius: 12,
                padding: 16,
                marginBottom: 16,
                borderWidth: 1,
                borderColor: theme.colors.border,
                borderLeftWidth: 4,
                borderLeftColor: categoryColor,
              }}
            >
              {/* Category Header */}
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginBottom: 16,
                }}
              >
                <View style={{ flex: 1 }}>
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      marginBottom: 4,
                    }}
                  >
                    <View
                      style={{
                        width: 12,
                        height: 12,
                        borderRadius: 6,
                        backgroundColor: categoryColor,
                        marginRight: 8,
                      }}
                    />
                    <Text
                      style={{
                        fontSize: 18,
                        fontWeight: "bold",
                        color: theme.colors.text.primary,
                        flex: 1,
                      }}
                    >
                      {categoryName}
                      <Text style={{ color: theme.colors.error }}>*</Text>
                    </Text>
                    <View
                      style={{
                        backgroundColor: theme.colors.primary + "20",
                        paddingHorizontal: 12,
                        paddingVertical: 6,
                        borderRadius: 8,
                      }}
                    >
                      <Text
                        style={{
                          fontSize: 12,
                          fontWeight: "600",
                          color: theme.colors.primary,
                        }}
                      >
                        {index + 1}/{categories.length}
                      </Text>
                    </View>
                  </View>
                  <Text
                    style={{
                      fontSize: 12,
                      color: theme.colors.text.secondary,
                      marginLeft: 20,
                    }}
                  >
                    {categoryPhotos.length} photo
                    {categoryPhotos.length !== 1 ? "s" : ""}
                  </Text>
                </View>
              </View>

              {/* Photo Grid */}
              {hasPhotos && (
                <View
                  style={{
                    flexDirection: "row",
                    flexWrap: "wrap",
                    gap: 8,
                    marginBottom: 16,
                  }}
                >
                  {categoryPhotos.map((uri, photoIndex) => (
                    <View
                      key={`${categoryId}-${photoIndex}`}
                      style={{
                        width: 80,
                        height: 80,
                        borderRadius: 8,
                        position: "relative",
                      }}
                    >
                      <Image
                        source={{ uri }}
                        style={{
                          width: "100%",
                          height: "100%",
                          borderRadius: 8,
                        }}
                        resizeMode="cover"
                      />
                      <TouchableOpacity
                        onPress={() => removePhoto(categoryId, photoIndex)}
                        style={{
                          position: "absolute",
                          top: -6,
                          right: -6,
                          width: 24,
                          height: 24,
                          borderRadius: 12,
                          backgroundColor: theme.colors.error,
                          justifyContent: "center",
                          alignItems: "center",
                          borderWidth: 2,
                          borderColor: theme.colors.card.background,
                        }}
                        activeOpacity={0.7}
                      >
                        <X size={14} color="white" />
                      </TouchableOpacity>
                    </View>
                  ))}

                  {/* Add more photos button */}
                  <TouchableOpacity
                    onPress={() => pickImage(categoryId, false)}
                    disabled={!isCameraReady}
                    style={{
                      width: 80,
                      height: 80,
                      borderRadius: 8,
                      borderWidth: 1.5,
                      borderColor: theme.colors.border,
                      borderStyle: "dashed",
                      justifyContent: "center",
                      alignItems: "center",
                      backgroundColor: theme.colors.input.background,
                      opacity: isCameraReady ? 1 : 0.5,
                    }}
                    activeOpacity={0.7}
                  >
                    <Plus size={24} color={theme.colors.text.secondary} />
                  </TouchableOpacity>
                </View>
              )}

              {/* Upload Buttons - Show only if no photos or always show camera option */}
              <View
                style={{ flexDirection: "row", gap: 8, marginBottom: 16 }}
              >
                <TouchableOpacity
                  onPress={() => pickImage(categoryId, true)}
                  disabled={!isCameraReady}
                  style={{
                    flex: 1,
                    height: 48,
                    borderRadius: 8,
                    borderWidth: 1.5,
                    borderColor: isCameraReady ? theme.colors.primary : theme.colors.border,
                    borderStyle: "dashed",
                    flexDirection: "row",
                    justifyContent: "center",
                    alignItems: "center",
                    backgroundColor: isCameraReady ? 'transparent' : theme.colors.input.background,
                    opacity: isCameraReady ? 1 : 0.5,
                  }}
                  activeOpacity={0.7}
                >
                  <Camera
                    size={18}
                    color={isCameraReady ? theme.colors.primary : theme.colors.text.secondary}
                    style={{ marginRight: 6 }}
                  />
                  <Text
                    style={{
                      fontSize: 14,
                      fontWeight: "500",
                      color: isCameraReady ? theme.colors.primary : theme.colors.text.secondary,
                    }}
                  >
                    Camera
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => pickImage(categoryId, false)}
                  disabled={!isCameraReady}
                  style={{
                    flex: 1,
                    height: 48,
                    borderRadius: 8,
                    borderWidth: 1.5,
                    borderColor: isCameraReady ? theme.colors.primary : theme.colors.border,
                    borderStyle: "dashed",
                    flexDirection: "row",
                    justifyContent: "center",
                    alignItems: "center",
                    backgroundColor: isCameraReady ? 'transparent' : theme.colors.input.background,
                    opacity: isCameraReady ? 1 : 0.5,
                  }}
                  activeOpacity={0.7}
                >
                  <ImageIcon
                    size={18}
                    color={isCameraReady ? theme.colors.primary : theme.colors.text.secondary}
                    style={{ marginRight: 6 }}
                  />
                  <Text
                    style={{
                      fontSize: 14,
                      fontWeight: "500",
                      color: isCameraReady ? theme.colors.primary : theme.colors.text.secondary,
                    }}
                  >
                    Gallery
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Weight Input (Optional) */}
              <View>
                <Text
                  style={{
                    fontSize: 14,
                    fontWeight: "500",
                    color: theme.colors.text.primary,
                    marginBottom: 8,
                  }}
                >
                  Approximate Weight{" "}
                  <Text
                    style={{ fontSize: 12, color: theme.colors.text.secondary }}
                  >
                    (Optional)
                  </Text>
                </Text>
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    backgroundColor: theme.colors.input.background,
                    borderWidth: 1,
                    borderColor: theme.colors.border,
                    borderRadius: 8,
                    paddingHorizontal: 12,
                    height: 48,
                  }}
                >
                  <TextInput
                    placeholder="Enter weight in kg"
                    placeholderTextColor={theme.colors.input.placeholder}
                    keyboardType="decimal-pad"
                    value={weights[categoryId] || ""}
                    onChangeText={(value) => updateWeight(categoryId, value)}
                    style={{
                      flex: 1,
                      fontSize: 16,
                      color: theme.colors.text.primary,
                    }}
                  />
                  <Text
                    style={{
                      fontSize: 16,
                      fontWeight: "600",
                      color: theme.colors.text.secondary,
                      marginLeft: 8,
                    }}
                  >
                    kg
                  </Text>
                </View>
              </View>
            </View>
          );
        })}
      </ScrollView>

      {/* Continue Button */}
      {allCategoriesHavePhotos && (
        <View
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            backgroundColor: theme.colors.surface,
            borderTopWidth: 1,
            borderTopColor: theme.colors.border,
            paddingHorizontal: 24,
            paddingTop: 16,
            paddingBottom: insets.bottom + 16,
          }}
        >
          <TouchableOpacity
            onPress={handleContinue}
            style={{
              backgroundColor: theme.colors.primary,
              height: 56,
              borderRadius: 12,
              flexDirection: "row",
              justifyContent: "center",
              alignItems: "center",
            }}
            activeOpacity={0.8}
          >
            <Text
              style={{
                fontSize: 16,
                fontWeight: "600",
                color: "white",
                marginRight: 8,
              }}
            >
              Continue to Address
            </Text>
            <ArrowRight size={20} color="white" />
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}