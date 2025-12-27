import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  TextInput,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as ImagePicker from "expo-image-picker";
import {
  Camera,
  Image as ImageIcon,
  X,
  ArrowLeft,
  ArrowRight,
  Plus,
} from "lucide-react-native";
import { useTheme } from "@/utils/theme";
import { getDraftRequest, saveDraftRequest } from "../../utils/storage";

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
  const [categories, setCategories] = useState([]);
  const [photos, setPhotos] = useState({});
  const [weights, setWeights] = useState({});

  useEffect(() => {
    loadDraft();
  }, []);

  const loadDraft = async () => {
    const draft = await getDraftRequest();
    if (draft && draft.categories) {
      setCategories(draft.categories);
      if (draft.photos) {
        setPhotos(draft.photos);
      }
      if (draft.weights) {
        setWeights(draft.weights);
      }
    } else {
      router.replace("/(tabs)/home");
    }
  };

  const pickImage = async (categoryId, useCamera = false) => {
    try {
      let result;

      if (useCamera) {
        const permission = await ImagePicker.requestCameraPermissionsAsync();
        if (!permission.granted) {
          Alert.alert("Permission needed", "Camera permission is required");
          return;
        }
        result = await ImagePicker.launchCameraAsync({
          allowsEditing: false,
          quality: 0.8,
        });
      } else {
        result = await ImagePicker.launchImageLibraryAsync({
          allowsEditing: false,
          allowsMultipleSelection: false,
          quality: 0.8,
        });
      }

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const newPhotos = { ...photos };
        if (!newPhotos[categoryId]) {
          newPhotos[categoryId] = [];
        }
        newPhotos[categoryId].push(result.assets[0].uri);
        setPhotos(newPhotos);
      }
    } catch (error) {
      console.error("Error picking image:", error);
      Alert.alert("Error", "Failed to pick image");
    }
  };

  const removePhoto = (categoryId, index) => {
    const newPhotos = { ...photos };
    newPhotos[categoryId].splice(index, 1);
    if (newPhotos[categoryId].length === 0) {
      delete newPhotos[categoryId];
    }
    setPhotos(newPhotos);
  };

  const updateWeight = (categoryId, value) => {
    const newWeights = { ...weights };
    newWeights[categoryId] = value;
    setWeights(newWeights);
  };

  const handleContinue = async () => {
    // Check if all categories have at least 1 photo
    const missingPhotos = categories.filter(
      (cat) => !photos[cat] || photos[cat].length === 0,
    );

    if (missingPhotos.length > 0) {
      Alert.alert(
        "Photos Required",
        `Please add at least 1 photo for: ${missingPhotos
          .map((id) => categoryNames[id])
          .join(", ")}`,
      );
      return;
    }

    const draft = await getDraftRequest();
    await saveDraftRequest({
      ...draft,
      photos,
      weights,
    });

    router.push("/(tabs)/address");
  };

  const totalPhotos = Object.values(photos).reduce(
    (sum, imgs) => sum + imgs.length,
    0,
  );
  const allCategoriesHavePhotos = categories.every(
    (cat) => photos[cat] && photos[cat].length > 0,
  );

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
            onPress={() => router.back()}
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
        {categories.map((categoryId, index) => {
          const categoryColor = categoryColors[categoryId];

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
                      {categoryNames[categoryId]}
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
                    {photos[categoryId]?.length || 0} photo
                    {photos[categoryId]?.length !== 1 ? "s" : ""}
                  </Text>
                </View>
              </View>

              {/* Photo Grid */}
              {photos[categoryId] && photos[categoryId].length > 0 && (
                <View
                  style={{
                    flexDirection: "row",
                    flexWrap: "wrap",
                    gap: 8,
                    marginBottom: 16,
                  }}
                >
                  {photos[categoryId].map((uri, photoIndex) => (
                    <View
                      key={photoIndex}
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
                      >
                        <X size={14} color="white" />
                      </TouchableOpacity>
                    </View>
                  ))}

                  {/* Add more photos button */}
                  <TouchableOpacity
                    onPress={() => pickImage(categoryId, false)}
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
                    }}
                  >
                    <Plus size={24} color={theme.colors.text.secondary} />
                  </TouchableOpacity>
                </View>
              )}

              {/* Upload Buttons - Show only if no photos */}
              {(!photos[categoryId] || photos[categoryId].length === 0) && (
                <View
                  style={{ flexDirection: "row", gap: 8, marginBottom: 16 }}
                >
                  <TouchableOpacity
                    onPress={() => pickImage(categoryId, true)}
                    style={{
                      flex: 1,
                      height: 48,
                      borderRadius: 8,
                      borderWidth: 1.5,
                      borderColor: theme.colors.primary,
                      borderStyle: "dashed",
                      flexDirection: "row",
                      justifyContent: "center",
                      alignItems: "center",
                    }}
                  >
                    <Camera
                      size={18}
                      color={theme.colors.primary}
                      style={{ marginRight: 6 }}
                    />
                    <Text
                      style={{
                        fontSize: 14,
                        fontWeight: "500",
                        color: theme.colors.primary,
                      }}
                    >
                      Camera
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={() => pickImage(categoryId, false)}
                    style={{
                      flex: 1,
                      height: 48,
                      borderRadius: 8,
                      borderWidth: 1.5,
                      borderColor: theme.colors.primary,
                      borderStyle: "dashed",
                      flexDirection: "row",
                      justifyContent: "center",
                      alignItems: "center",
                    }}
                  >
                    <ImageIcon
                      size={18}
                      color={theme.colors.primary}
                      style={{ marginRight: 6 }}
                    />
                    <Text
                      style={{
                        fontSize: 14,
                        fontWeight: "500",
                        color: theme.colors.primary,
                      }}
                    >
                      Gallery
                    </Text>
                  </TouchableOpacity>
                </View>
              )}

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