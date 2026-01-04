import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  Modal,
  Animated,
  Dimensions,
  ActivityIndicator
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Check, Edit, ArrowLeft, CheckCircle, MapPin, Package, Camera, Home, Loader } from "lucide-react-native";
import { useTheme } from "@/utils/theme";
import { getDraftRequest, clearDraftRequest } from "../../utils/storage";
import { useFocusEffect } from "expo-router";
import ApiService from "../../utils/ApiService";

const { width } = Dimensions.get('window');

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
  const [redirectTimer, setRedirectTimer] = useState(3);

  // Animation values
  const fadeAnim = useState(new Animated.Value(0))[0];
  const scaleAnim = useState(new Animated.Value(0.9))[0];
  const modalScale = useState(new Animated.Value(0.8))[0];
  const modalOpacity = useState(new Animated.Value(0))[0];
  const successIconScale = useState(new Animated.Value(0))[0];

  useFocusEffect(
    useCallback(() => {
      async function fetchDraft() {
        const draft = await getDraftRequest();
        console.log("Draft data:", draft);
        if (draft) {
          setDraftData(draft);

          // Animate content in
          Animated.parallel([
            Animated.timing(fadeAnim, {
              toValue: 1,
              duration: 400,
              useNativeDriver: true,
            }),
            Animated.spring(scaleAnim, {
              toValue: 1,
              tension: 50,
              friction: 7,
              useNativeDriver: true,
            }),
          ]).start();
        } else {
          router.replace("/(tabs)/home");
        }
      }

      fetchDraft();

      return () => {
        fadeAnim.setValue(0);
        scaleAnim.setValue(0.9);
      };
    }, [])
  );

  const animateSuccessIcon = () => {
    // Reset and animate success icon
    successIconScale.setValue(0);
    Animated.spring(successIconScale, {
      toValue: 1,
      tension: 100,
      friction: 10,
      useNativeDriver: true,
    }).start();
  };

  const animateModalIn = () => {
    modalScale.setValue(0.8);
    modalOpacity.setValue(0);

    Animated.parallel([
      Animated.timing(modalOpacity, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.spring(modalScale, {
        toValue: 1,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }),
    ]).start(() => {
      animateSuccessIcon();

      // Start countdown for auto-navigation
      const timerInterval = setInterval(() => {
        setRedirectTimer((prev) => {
          if (prev <= 1) {
            clearInterval(timerInterval);
            animateModalOut();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    });
  };

  const animateModalOut = () => {
    Animated.parallel([
      Animated.timing(modalOpacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(modalScale, {
        toValue: 0.8,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setShowSuccess(false);
      setRedirectTimer(3);
       setDraftData(null);

          // 🔥 Clear ALL draft data from storage
          clearDraftRequest();
      router.replace("/(tabs)/home");
    });
  };

  const submitRequest = async () => {
    try {
      setSubmitting(true);

      const formData = new FormData();
      formData.append("address_id", draftData.address_id);

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
      let imageIndex = 0;
      draftData.categories.forEach((catObj, itemIndex) => {
        const categoryId = Object.keys(catObj)[0];
        const images = draftData.photos?.[categoryId] || [];

        images.forEach((uri) => {
          formData.append("images", {
            uri,
            name: `image_${imageIndex}.jpg`,
            type: "image/jpeg",
          });
          formData.append("image_item_index", itemIndex);
          imageIndex++;
        });
      });

      const token = await AsyncStorage.getItem("Token");
      const res = await ApiService.post(
        "/scrap/requests",
        formData,
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

      // Generate a request ID
      const generatedId = `SCR${Math.floor(100000 + Math.random() * 900000)}`;
      setRequestId(generatedId);

      await clearDraftRequest();
      setShowSuccess(true);
      animateModalIn();

    } catch (err) {
      console.error("Submission error:", err);
      Alert.alert(
        "Submission Failed",
        "Unable to submit request. Please try again.",
        [{ text: "OK" }]
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (!draftData) {
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
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
        <Text style={{
          marginTop: 20,
          fontSize: 16,
          fontWeight: '500',
          color: theme.colors.text.secondary
        }}>
          Loading request data...
        </Text>
      </View>
    );
  }

  const totalPhotos = Object.values(draftData.photos || {}).reduce(
    (sum, photos) => sum + photos.length,
    0,
  );

  const totalWeight = draftData.weights
    ? Object.values(draftData.weights).reduce((sum, w) => sum + parseFloat(w || 0), 0)
    : 0;

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <StatusBar style={theme.isDark ? "light" : "dark"} />

      {/* Header */}
      <Animated.View
        style={{
          paddingTop: insets.top + 16,
          paddingHorizontal: 20,
          paddingBottom: 16,
          backgroundColor: theme.colors.surface,
          borderBottomWidth: 1,
          borderBottomColor: theme.colors.border,
          transform: [{ scale: scaleAnim }],
          opacity: fadeAnim,
        }}
      >
        <View style={{ flexDirection: "row", alignItems: "center" }}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={{
              width: 44,
              height: 44,
              borderRadius: 22,
              backgroundColor: theme.colors.input.background,
              justifyContent: "center",
              alignItems: "center",
              marginRight: 16,
            }}
          >
            <ArrowLeft color={theme.colors.text.primary} size={22} />
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={{
              fontSize: 24,
              fontWeight: "bold",
              color: theme.colors.text.primary,
            }}>
              Review & Submit
            </Text>
            <Text style={{
              fontSize: 14,
              color: theme.colors.text.secondary,
              marginTop: 2,
            }}>
              Final check before pickup scheduling
            </Text>
          </View>
          <View style={{
            paddingHorizontal: 12,
            paddingVertical: 6,
            backgroundColor: theme.colors.primary + "20",
            borderRadius: 12,
          }}>
            <Text style={{
              fontSize: 12,
              fontWeight: "600",
              color: theme.colors.primary,
            }}>
              {draftData.categories.length} Items
            </Text>
          </View>
        </View>
      </Animated.View>

      <Animated.ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{
          paddingTop: 24,
          paddingHorizontal: 20,
          paddingBottom: insets.bottom + 100,
        }}
        showsVerticalScrollIndicator={false}
        opacity={fadeAnim}
        transform={[{ scale: scaleAnim }]}
      >
        {/* Summary Cards */}
        <View style={{ flexDirection: "row", gap: 12, marginBottom: 16 }}>
          {/* Photos Summary Card */}
          <View style={{
            flex: 1,
            backgroundColor: theme.colors.surface,
            borderRadius: 16,
            padding: 16,
            borderWidth: 1,
            borderColor: theme.colors.border,
            alignItems: 'center',
          }}>
            <View style={{
              width: 48,
              height: 48,
              borderRadius: 24,
              backgroundColor: '#3498DB20',
              justifyContent: 'center',
              alignItems: 'center',
              marginBottom: 8,
            }}>
              <Camera size={24} color="#3498DB" />
            </View>
            <Text style={{
              fontSize: 24,
              fontWeight: "bold",
              color: theme.colors.text.primary,
            }}>
              {totalPhotos}
            </Text>
            <Text style={{
              fontSize: 12,
              color: theme.colors.text.secondary,
              marginTop: 2,
            }}>
              Photos
            </Text>
          </View>

          {/* Weight Summary Card */}
          <View style={{
            flex: 1,
            backgroundColor: theme.colors.surface,
            borderRadius: 16,
            padding: 16,
            borderWidth: 1,
            borderColor: theme.colors.border,
            alignItems: 'center',
          }}>
            <View style={{
              width: 48,
              height: 48,
              borderRadius: 24,
              backgroundColor: '#E67E2220',
              justifyContent: 'center',
              alignItems: 'center',
              marginBottom: 8,
            }}>
              <Package size={24} color="#E67E22" />
            </View>
            <Text style={{
              fontSize: 24,
              fontWeight: "bold",
              color: theme.colors.text.primary,
            }}>
              {totalWeight.toFixed(1)}
            </Text>
            <Text style={{
              fontSize: 12,
              color: theme.colors.text.secondary,
              marginTop: 2,
            }}>
              kg Total
            </Text>
          </View>
        </View>

        {/* Categories Section */}
        <View style={{
          backgroundColor: theme.colors.surface,
          borderRadius: 16,
          padding: 20,
          marginBottom: 16,
          borderWidth: 1,
          borderColor: theme.colors.border,
          shadowColor: theme.colors.text.primary,
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.05,
          shadowRadius: 8,
          elevation: 2,
        }}>
          <View style={{
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 16,
          }}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <View style={{
                width: 4,
                height: 20,
                borderRadius: 2,
                backgroundColor: theme.colors.primary,
                marginRight: 12,
              }} />
              <Text style={{
                fontSize: 18,
                fontWeight: "600",
                color: theme.colors.text.primary,
              }}>
                Scrap Categories
              </Text>
            </View>
            <TouchableOpacity
              onPress={() => router.push("/(tabs)/home")}
              style={{
                padding: 8,
                borderRadius: 8,
                backgroundColor: theme.colors.input.background,
              }}
            >
              <Edit size={18} color={theme.colors.primary} />
            </TouchableOpacity>
          </View>

          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10 }}>
            {draftData.categories.map((catObj, index) => {
              const categoryId = Object.keys(catObj)[0];
              const categoryName = catObj[categoryId];
              const color = categoryColors[categoryId] || theme.colors.primary;

              return (
                <View
                  key={categoryId}
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    backgroundColor: `${color}15`,
                    paddingHorizontal: 16,
                    paddingVertical: 10,
                    borderRadius: 20,
                    borderWidth: 1,
                    borderColor: `${color}30`,
                  }}
                >
                  <View style={{
                    width: 12,
                    height: 12,
                    borderRadius: 6,
                    backgroundColor: color,
                    marginRight: 8,
                  }} />
                  <Text style={{
                    fontSize: 14,
                    fontWeight: "600",
                    color: theme.colors.text.primary,
                  }}>
                    {categoryName}
                  </Text>
                  {draftData.weights?.[categoryId] && (
                    <Text style={{
                      fontSize: 12,
                      fontWeight: "500",
                      color: theme.colors.text.secondary,
                      marginLeft: 8,
                    }}>
                      ({draftData.weights[categoryId]}kg)
                    </Text>
                  )}
                </View>
              );
            })}
          </View>
        </View>

        {/* Photos Section */}
        <View style={{
          backgroundColor: theme.colors.surface,
          borderRadius: 16,
          padding: 20,
          marginBottom: 16,
          borderWidth: 1,
          borderColor: theme.colors.border,
          shadowColor: theme.colors.text.primary,
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.05,
          shadowRadius: 8,
          elevation: 2,
        }}>
          <View style={{
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 20,
          }}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <View style={{
                width: 4,
                height: 20,
                borderRadius: 2,
                backgroundColor: '#3498DB',
                marginRight: 12,
              }} />
              <View>
                <Text style={{
                  fontSize: 18,
                  fontWeight: "600",
                  color: theme.colors.text.primary,
                }}>
                  Scrap Photos
                </Text>
                <Text style={{
                  fontSize: 12,
                  color: theme.colors.text.secondary,
                  marginTop: 2,
                }}>
                  {totalPhotos} photos across {draftData.categories.length} categories
                </Text>
              </View>
            </View>
            <TouchableOpacity
              onPress={() => router.push("/(tabs)/photo-upload")}
              style={{
                padding: 8,
                borderRadius: 8,
                backgroundColor: theme.colors.input.background,
              }}
            >
              <Edit size={18} color="#3498DB" />
            </TouchableOpacity>
          </View>

          {draftData.categories.map((catObj) => {
            const categoryId = Object.keys(catObj)[0];
            const categoryPhotos = draftData.photos?.[categoryId] || [];
            const categoryWeight = draftData.weights?.[categoryId];

            if (categoryPhotos.length === 0) return null;

            return (
              <View key={categoryId} style={{ marginBottom: 24, backgroundColor: `${categoryColors[categoryId]}10`, borderRadius: 12, padding: 16 }}>
                <View style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: 12,
                }}>
                  <View style={{ flexDirection: "row", alignItems: "center" }}>
                    <View style={{
                      width: 12,
                      height: 12,
                      borderRadius: 6,
                      backgroundColor: categoryColors[categoryId] || theme.colors.primary,
                      marginRight: 8,
                    }} />
                    <Text style={{
                      fontSize: 16,
                      fontWeight: "600",
                      color: theme.colors.text.primary,
                    }}>
                      {categoryNames[categoryId]}
                    </Text>
                  </View>

                  <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                    <View style={{
                      backgroundColor: `${categoryColors[categoryId]}20`,
                      paddingHorizontal: 10,
                      paddingVertical: 4,
                      borderRadius: 12,
                    }}>
                      <Text style={{
                        fontSize: 12,
                        fontWeight: "600",
                        color: categoryColors[categoryId],
                      }}>
                        {categoryPhotos.length} photo{categoryPhotos.length !== 1 ? 's' : ''}
                      </Text>
                    </View>
                    {categoryWeight && (
                      <View style={{
                        backgroundColor: theme.colors.primary + "20",
                        paddingHorizontal: 10,
                        paddingVertical: 4,
                        borderRadius: 12,
                      }}>
                        <Text style={{
                          fontSize: 12,
                          fontWeight: "600",
                          color: theme.colors.primary,
                        }}>
                          {categoryWeight} kg
                        </Text>
                      </View>
                    )}
                  </View>
                </View>

                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={{ paddingRight: 8 }}
                >
                  <View style={{ flexDirection: "row", gap: 12 }}>
                    {categoryPhotos.map((photo, index) => (
                      <Image
                        key={index}
                        source={{ uri: photo }}
                        style={{
                          width: 120,
                          height: 120,
                          borderRadius: 8,
                          borderWidth: 2,
                          borderColor: `${categoryColors[categoryId]}30`,
                        }}
                      />
                    ))}
                  </View>
                </ScrollView>
              </View>
            );
          })}
        </View>

        {/* Address Section - FIXED DARK MODE TEXT */}
        {draftData.address && (
          <View style={{
            backgroundColor: theme.colors.surface,
            borderRadius: 16,
            padding: 20,
            marginBottom: 16,
            borderWidth: 1,
            borderColor: theme.colors.border,
            shadowColor: theme.colors.text.primary,
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.05,
            shadowRadius: 8,
            elevation: 2,
          }}>
            <View style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 16,
            }}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <View style={{
                  width: 4,
                  height: 20,
                  borderRadius: 2,
                  backgroundColor: '#9B59B6',
                  marginRight: 12,
                }} />
                <Text style={{
                  fontSize: 18,
                  fontWeight: "600",
                  color: theme.colors.text.primary,
                }}>
                  Pickup Address
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => router.push("/(tabs)/address")}
                style={{
                  padding: 8,
                  borderRadius: 8,
                  backgroundColor: theme.colors.input.background,
                }}
              >
                <Edit size={18} color="#9B59B6" />
              </TouchableOpacity>
            </View>

            <View style={{
              flexDirection: 'row',
              alignItems: 'flex-start',
              backgroundColor: `${theme.colors.primary}08`,
              borderRadius: 12,
              padding: 16,
              borderWidth: 1,
              borderColor: `${theme.colors.primary}15`,
            }}>
              <View style={{
                width: 40,
                height: 40,
                borderRadius: 20,
                backgroundColor: `${theme.colors.primary}20`,
                justifyContent: 'center',
                alignItems: 'center',
                marginRight: 12,
                marginTop: 2,
              }}>
                <MapPin size={20} color={theme.colors.primary} />
              </View>

              <View style={{ flex: 1 }}>
                <Text style={{
                  fontSize: 15,
                  fontWeight: "600",
                  color: theme.colors.text.primary,
                  marginBottom: 4,
                  lineHeight: 22,
                }}>
                  {draftData.address.address_line1}
                </Text>

                {draftData.address.address_line2 && (
                  <Text style={{
                    fontSize: 14,
                    color: theme.colors.text.secondary,
                    marginBottom: 4,
                    lineHeight: 20,
                  }}>
                    {draftData.address.address_line2}
                  </Text>
                )}

                <Text style={{
                  fontSize: 14,
                  color: theme.colors.text.secondary,
                  marginBottom: 4,
                  lineHeight: 20,
                }}>
                  {draftData.address.city} - {draftData.address.pincode}
                </Text>

                {draftData.address.landmark && (
                  <Text style={{
                    fontSize: 14,
                    color: theme.colors.text.secondary,
                    lineHeight: 20,
                  }}>
                    <Text style={{ fontWeight: '500' }}>Landmark:</Text> {draftData.address.landmark}
                  </Text>
                )}

                <Text style={{
                  fontSize: 14,
                  color: theme.colors.text.secondary,
                  lineHeight: 20,
                }}>
                  {draftData.address.state}, India
                </Text>
              </View>
            </View>
          </View>
        )}
      </Animated.ScrollView>

      {/* Submit Button */}
      <View style={{
        position: "absolute",
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: theme.colors.surface,
        borderTopWidth: 1,
        borderTopColor: theme.colors.border,
        paddingHorizontal: 20,
        paddingTop: 16,
        paddingBottom: insets.bottom + 16,
        shadowColor: theme.colors.text.primary,
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
        elevation: 10,
      }}>
        <TouchableOpacity
          onPress={submitRequest}
          disabled={submitting}
          style={{
            backgroundColor: theme.colors.primary,
            height: 56,
            borderRadius: 14,
            flexDirection: "row",
            justifyContent: "center",
            alignItems: "center",
            opacity: submitting ? 0.7 : 1,
            shadowColor: theme.colors.primary,
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.3,
            shadowRadius: 8,
            elevation: 4,
          }}
        >
          {submitting ? (
            <ActivityIndicator color="white" size="small" style={{ marginRight: 10 }} />
          ) : (
            <Check size={22} color="white" style={{ marginRight: 10 }} />
          )}
          <Text style={{
            fontSize: 17,
            fontWeight: "600",
            color: "white",
          }}>
            {submitting ? "Processing..." : "Schedule Pickup"}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Success Modal with Animation */}
      <Modal
        visible={showSuccess}
        transparent
        animationType="none"
        onShow={animateModalIn}
      >
        <Animated.View
          style={{
            flex: 1,
            backgroundColor: "rgba(0, 0, 0, 0.7)",
            justifyContent: "center",
            alignItems: "center",
            padding: 24,
            opacity: modalOpacity,
          }}
        >
          <Animated.View
            style={{
              backgroundColor: theme.colors.surface,
              borderRadius: 24,
              padding: 32,
              alignItems: "center",
              width: "100%",
              maxWidth: 400,
              transform: [{ scale: modalScale }],
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 10 },
              shadowOpacity: 0.3,
              shadowRadius: 20,
              elevation: 20,
            }}
          >
            {/* Animated Success Icon */}
            <Animated.View
              style={{
                width: 120,
                height: 120,
                borderRadius: 60,
                backgroundColor: `${theme.colors.success}20`,
                justifyContent: 'center',
                alignItems: 'center',
                marginBottom: 24,
                transform: [{ scale: successIconScale }],
              }}
            >
              <CheckCircle size={60} color={theme.colors.success || "#4CAF50"} />
            </Animated.View>

            <Text style={{
              fontSize: 28,
              fontWeight: "bold",
              color: theme.colors.text.primary,
              marginBottom: 8,
              textAlign: 'center',
            }}>
              Pickup Scheduled!
            </Text>

            <Text style={{
              fontSize: 16,
              color: theme.colors.text.secondary,
              textAlign: "center",
              marginBottom: 24,
              lineHeight: 24,
            }}>
              Your scrap pickup has been successfully scheduled. Our executive will contact you shortly.
            </Text>

            {/* Request ID Card */}
            <View style={{
              backgroundColor: `${theme.colors.primary}10`,
              borderRadius: 16,
              padding: 20,
              width: '100%',
              marginBottom: 32,
              borderWidth: 1,
              borderColor: `${theme.colors.primary}20`,
              alignItems: 'center',
            }}>
              <Text style={{
                fontSize: 12,
                fontWeight: "500",
                color: theme.colors.text.secondary,
                marginBottom: 8,
                letterSpacing: 1,
              }}>
                REQUEST ID
              </Text>
              <Text style={{
                fontSize: 28,
                fontWeight: "bold",
                color: theme.colors.primary,
                letterSpacing: 2,
              }}>
                {requestId}
              </Text>
              <Text style={{
                fontSize: 12,
                color: theme.colors.text.secondary,
                marginTop: 8,
              }}>
                Save this ID for tracking
              </Text>
            </View>

            {/* Action Buttons */}
            <View style={{ flexDirection: 'row', gap: 12, width: '100%' }}>
              <TouchableOpacity
                onPress={animateModalOut}
                style={{
                  flex: 1,
                  height: 56,
                  borderRadius: 14,
                  backgroundColor: theme.colors.primary,
                  justifyContent: "center",
                  alignItems: "center",
                  flexDirection: 'row',
                  shadowColor: theme.colors.primary,
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.3,
                  shadowRadius: 8,
                  elevation: 4,
                }}
              >
                <Home size={20} color="white" style={{ marginRight: 8 }} />
                <Text style={{
                  fontSize: 16,
                  fontWeight: "600",
                  color: "white",
                }}>
                  Go to Home ({redirectTimer}s)
                </Text>
              </TouchableOpacity>
            </View>

            {/* Progress Bar for timer */}
            <View style={{
              width: '100%',
              height: 4,
              backgroundColor: theme.colors.border,
              borderRadius: 2,
              marginTop: 16,
              overflow: 'hidden',
            }}>
              <Animated.View style={{
                width: `${(redirectTimer / 3) * 100}%`,
                height: '100%',
                backgroundColor: theme.colors.primary,
                borderRadius: 2,
              }} />
            </View>
          </Animated.View>
        </Animated.View>
      </Modal>
    </View>
  );
}