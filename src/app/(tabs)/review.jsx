import React, { useState, useEffect, useCallback } from "react";
import { View,Text,ScrollView,TouchableOpacity,Image,Alert,Modal} from "react-native";
import { StatusBar } from "expo-status-bar";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Check, Edit, ArrowLeft, CheckCircle } from "lucide-react-native";
import { useTheme } from "@/utils/theme";
import { getDraftRequest, clearDraftRequest } from "../../utils/storage";
import { useFocusEffect } from "expo-router";
import ApiService from "../../utils/ApiService";

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

export default function Review() {
  const insets = useSafeAreaInsets();
  const theme = useTheme();
  const [draftData, setDraftData] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [requestId, setRequestId] = useState("");

  useFocusEffect(
    useCallback(() => {
      // Define the async function inside the effect
      async function fetchDraft() {
        const draft = await getDraftRequest();
        if (draft) {
          setDraftData(draft);
        } else {
          router.replace("/(tabs)/home");
        }
      }
  
      // Call it immediately
      fetchDraft();
  
      // Optionally return a cleanup function (or nothing)
      return () => {};
    }, [])
  );

  const submitRequest = async () => {
    try {
      setSubmitting(true);
  
      const formData = new FormData();
  
      formData.append("address_id", draftData.address_id);
      formData.append("pickup_date", "2025-01-10");
      formData.append("pickup_time_slot", "10AM–12PM");
      formData.append("notes", "Scrap pickup");
  
      // Build items from categories
      const items = draftData.categories.map((catObj) => {
        const categoryId = Object.keys(catObj)[0];
  
        return {
          category_id: Number(categoryId),
          quantity: draftData.photos?.[categoryId]?.length || 1,
          weight: Number(draftData.weights?.[categoryId] || 0),
          estimated_value: 0,
          description: catObj[categoryId],
        };
      });
  
      formData.append("items", JSON.stringify(items));
  
      // Attach images
      Object.values(draftData.photos).flat().forEach((uri, index) => {
        formData.append("images", {
          uri,
          name: `image_${index}.jpg`,
          type: "image/jpeg",
        });
      });
  
      const token = await AsyncStorage.getItem("Token");
  
      const res = await ApiService.post(
        "/scrap/requests",formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data",
          },
        }
      );
  
      if (!res.success) {
        throw new Error("Failed to submit request");
      }
  
      await clearDraftRequest();
      setShowSuccess(true);
  
      setTimeout(() => {
        setShowSuccess(false);
        router.replace("/(tabs)/orders");
      }, 2000);
  
    } catch (err) {
      console.error(err);
      Alert.alert("Error", "Unable to submit request");
    } finally {
      setSubmitting(false);
    }
  };

  if (!draftData) {
    return null;
  }

  const totalPhotos = Object.values(draftData.photos || {}).reduce(
    (sum, photos) => sum + photos.length,
    0,
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
              Review Request
            </Text>
            <Text
              style={{
                fontSize: 14,
                color: theme.colors.text.secondary,
                marginTop: 2,
              }}
            >
              Check everything before submitting
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
        {/* Categories Section */}
        <View
          style={{
            backgroundColor: theme.colors.card.background,
            borderRadius: 12,
            padding: 16,
            marginBottom: 16,
            borderWidth: 1,
            borderColor: theme.colors.border,
          }}
        >
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 12,
            }}
          >
            <Text
              style={{
                fontSize: 16,
                fontWeight: "600",
                color: theme.colors.text.primary,
              }}
            >
              Scrap Categories ({draftData.categories.length})
            </Text>
            <TouchableOpacity onPress={() => router.push("/(tabs)/home")}>
              <Edit size={18} color={theme.colors.primary} />
            </TouchableOpacity>
          </View>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
            {draftData.categories.map((catObj) => {
              const categoryId = Object.keys(catObj)[0];
              const categoryName = catObj[categoryId];

              return (
                <View
                  key={categoryId}
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    backgroundColor: theme.colors.primary + "20",
                    paddingHorizontal: 12,
                    paddingVertical: 6,
                    borderRadius: 16,
                  }}
                >
                  <View
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: 4,
                      backgroundColor: categoryColors[categoryId],
                      marginRight: 6,
                    }}
                  />
                  <Text
                    style={{
                      fontSize: 14,
                      color: theme.colors.primary,
                      fontWeight: "500",
                    }}
                  >
                    {categoryName}
                  </Text>
                </View>
              );
            })}
          </View>
        </View>

        {/* Photos Section */}
        <View
          style={{
            backgroundColor: theme.colors.card.background,
            borderRadius: 12,
            padding: 16,
            marginBottom: 16,
            borderWidth: 1,
            borderColor: theme.colors.border,
          }}
        >
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 16,
            }}
          >
            <View>
              <Text
                style={{
                  fontSize: 16,
                  fontWeight: "600",
                  color: theme.colors.text.primary,
                }}
              >
                Photos ({totalPhotos})
              </Text>
              <Text
                style={{
                  fontSize: 12,
                  color: theme.colors.text.secondary,
                  marginTop: 2,
                }}
              >
                {draftData.categories.length} categories
              </Text>
            </View>
            <TouchableOpacity
              onPress={() => router.push("/(tabs)/photo-upload")}
            >
              <Edit size={18} color={theme.colors.primary} />
            </TouchableOpacity>
          </View>

          {draftData.categories.map((catObj) => {
            const categoryId = Object.keys(catObj)[0];
            const categoryName = catObj[categoryId];

            const categoryPhotos = draftData.photos?.[categoryId] || [];
            const categoryWeight = draftData.weights?.[categoryId];

            if (categoryPhotos.length === 0) return null;
            return (
              <View key={categoryId} style={{ marginBottom: 20 }}>
                <View
                  style={{
                    flexDirection: "row",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: 12,
                    paddingBottom: 8,
                    borderBottomWidth: 1,
                    borderBottomColor: theme.colors.border + "40",
                  }}
                >
                  <View style={{ flexDirection: "row", alignItems: "center" }}>
                    <View
                      style={{
                        width: 12,
                        height: 12,
                        borderRadius: 6,
                        backgroundColor: categoryColors[categoryId] || theme.colors.primary,
                        marginRight: 8,
                      }}
                    />
                    <Text
                      style={{
                        fontSize: 16,
                        fontWeight: "600",
                        color: theme.colors.text.primary,
                      }}
                    >
                      {categoryNames[categoryId]}
                    </Text>
                  </View>

                  <View style={{ flexDirection: "row", alignItems: "center" }}>
                    <Text
                      style={{
                        fontSize: 14,
                        color: theme.colors.text.secondary,
                        marginRight: 8,
                      }}
                    >
                      {categoryPhotos.length} photo
                      {categoryPhotos.length !== 1 ? "s" : ""}
                    </Text>
                    {categoryWeight && (
                      <View
                        style={{
                          backgroundColor: theme.colors.primary + "20",
                          paddingHorizontal: 10,
                          paddingVertical: 4,
                          borderRadius: 12,
                        }}
                      >
                        <Text
                          style={{
                            fontSize: 12,
                            fontWeight: "600",
                            color: theme.colors.primary,
                          }}
                        >
                          {categoryWeight} kg
                        </Text>
                      </View>
                    )}
                  </View>
                </View>

                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  style={{ marginBottom: 8 }}
                >
                  <View style={{ flexDirection: "row", gap: 12 }}>
                    {categoryPhotos.map((photo, index) => (
                      <Image
                        key={index}
                        source={{ uri: photo }}
                        style={{
                          width: 100,
                          height: 100,
                          borderRadius: 8,
                        }}
                      />
                    ))}
                  </View>
                </ScrollView>
              </View>
            );
          })}
        </View>

        {/* Weights Summary */}
        {draftData.weights && Object.keys(draftData.weights).length > 0 && (
          <View
            style={{
              backgroundColor: theme.colors.card.background,
              borderRadius: 12,
              padding: 16,
              marginBottom: 16,
              borderWidth: 1,
              borderColor: theme.colors.border,
            }}
          >
            <Text
              style={{
                fontSize: 16,
                fontWeight: "600",
                color: theme.colors.text.primary,
                marginBottom: 12,
              }}
            >
              Estimated Weights
            </Text>
            <View style={{ gap: 8 }}>
              {Object.entries(draftData.weights).map(([cat, weight]) => (
                <View
                  key={cat}
                  style={{
                    flexDirection: "row",
                    justifyContent: "space-between",
                    alignItems: "center",
                    paddingVertical: 4,
                  }}
                >
                  <View style={{ flexDirection: "row", alignItems: "center" }}>
                    <View
                      style={{
                        width: 8,
                        height: 8,
                        borderRadius: 4,
                        backgroundColor: categoryColors[cat],
                        marginRight: 8,
                      }}
                    />
                    <Text
                      style={{
                        fontSize: 14,
                        color: theme.colors.text.primary,
                      }}
                    >
                      {categoryNames[cat]}
                    </Text>
                  </View>
                  <Text
                    style={{
                      fontSize: 16,
                      fontWeight: "600",
                      color: theme.colors.primary,
                    }}
                  >
                    {weight} kg
                  </Text>
                </View>
              ))}

              {/* Total Weight */}
              <View
                style={{
                  marginTop: 8,
                  paddingTop: 12,
                  borderTopWidth: 1,
                  borderTopColor: theme.colors.border,
                  flexDirection: "row",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <Text
                  style={{
                    fontSize: 16,
                    fontWeight: "bold",
                    color: theme.colors.text.primary,
                  }}
                >
                  Total Estimated Weight
                </Text>
                <Text
                  style={{
                    fontSize: 18,
                    fontWeight: "bold",
                    color: theme.colors.primary,
                  }}
                >
                  {Object.values(draftData.weights)
                    .reduce((sum, w) => sum + parseFloat(w || 0), 0)
                    .toFixed(1)} kg
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* Address Section */}
        {draftData.address && (
          <View
            style={{
              backgroundColor: theme.colors.card.background,
              borderRadius: 12,
              padding: 16,
              marginBottom: 16,
              borderWidth: 1,
              borderColor: theme.colors.border,
            }}
          >
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 12,
              }}
            >
              <Text
                style={{
                  fontSize: 16,
                  fontWeight: "600",
                  color: theme.colors.text.primary,
                }}
              >
                Pickup Address
              </Text>
              <TouchableOpacity onPress={() => router.push("/(tabs)/address")}>
                <Edit size={18} color={theme.colors.primary} />
              </TouchableOpacity>
            </View>
            <Text style={{ fontSize: 14, lineHeight: 20 }}>
              {draftData.address.address_line1}
              {draftData.address.address_line2
                ? `, ${draftData.address.address_line2}`
                : ""}
              {"\n"}
              {draftData.address.city} - {draftData.address.pincode}
              {draftData.address.landmark
                ? `\n${draftData.address.landmark}`
                : ""}
            </Text>

          </View>
        )}
      </ScrollView>

      {/* Submit Button */}
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
          onPress={submitRequest}
          disabled={submitting}
          style={{
            backgroundColor: theme.colors.primary,
            height: 56,
            borderRadius: 12,
            flexDirection: "row",
            justifyContent: "center",
            alignItems: "center",
            opacity: submitting ? 0.6 : 1,
          }}
        >
          <Check size={20} color="white" style={{ marginRight: 8 }} />
          <Text
            style={{
              fontSize: 16,
              fontWeight: "600",
              color: "white",
            }}
          >
            {submitting ? "Submitting..." : "Submit Request"}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Success Modal */}
      <Modal visible={showSuccess} transparent animationType="fade">
        <View
          style={{
            flex: 1,
            backgroundColor: "rgba(0, 0, 0, 0.5)",
            justifyContent: "center",
            alignItems: "center",
            padding: 24,
          }}
        >
          <View
            style={{
              backgroundColor: theme.colors.surface,
              borderRadius: 16,
              padding: 32,
              alignItems: "center",
              width: "100%",
              maxWidth: 400,
            }}
          >
            <View
              style={{
                width: 80,
                height: 80,
                borderRadius: 40,
                backgroundColor: theme.colors.success + "20",
                justifyContent: "center",
                alignItems: "center",
                marginBottom: 24,
              }}
            >
              <CheckCircle size={40} color={theme.colors.success} />
            </View>
            <Text
              style={{
                fontSize: 24,
                fontWeight: "bold",
                color: theme.colors.text.primary,
                marginBottom: 8,
              }}
            >
              Request Submitted!
            </Text>
            <Text
              style={{
                fontSize: 16,
                color: theme.colors.text.secondary,
                textAlign: "center",
                marginBottom: 16,
              }}
            >
              Your pickup request has been successfully created
            </Text>
            <View
              style={{
                backgroundColor: theme.colors.primary + "20",
                paddingHorizontal: 16,
                paddingVertical: 12,
                borderRadius: 8,
              }}
            >
              <Text
                style={{
                  fontSize: 12,
                  color: theme.colors.text.secondary,
                  marginBottom: 4,
                }}
              >
                Request ID
              </Text>
              <Text
                style={{
                  fontSize: 20,
                  fontWeight: "bold",
                  color: theme.colors.primary,
                }}
              >
                {requestId}
              </Text>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}