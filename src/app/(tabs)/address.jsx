import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Location from "expo-location";
import { MapPin, ArrowLeft, ArrowRight, Loader } from "lucide-react-native";
import { useTheme } from "@/utils/theme";
import { getDraftRequest, saveDraftRequest } from "../../utils/storage";

export default function Address() {
  const insets = useSafeAreaInsets();
  const theme = useTheme();
  const [loading, setLoading] = useState(false);
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [pincode, setPincode] = useState("");
  const [landmark, setLandmark] = useState("");
  const [coordinates, setCoordinates] = useState(null);

  useEffect(() => {
    loadDraft();
  }, []);

  const loadDraft = async () => {
    const draft = await getDraftRequest();
    if (draft && draft.address) {
      setAddress(draft.address.address || "");
      setCity(draft.address.city || "");
      setPincode(draft.address.pincode || "");
      setLandmark(draft.address.landmark || "");
      setCoordinates(draft.address.coordinates || null);
    }
  };

  const detectLocation = async () => {
    setLoading(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          "Permission denied",
          "Please grant location permissions to detect your address",
        );
        setLoading(false);
        return;
      }

      const location = await Location.getCurrentPositionAsync({});
      setCoordinates({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      });

      // Reverse geocode to get address
      const geocoded = await Location.reverseGeocodeAsync({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      });

      if (geocoded && geocoded.length > 0) {
        const place = geocoded[0];
        setAddress(`${place.street || ""} ${place.streetNumber || ""}`);
        setCity(`${place.city || ""}, ${place.region || ""}`);
        setPincode(place.postalCode || "");
      }

      setLoading(false);
    } catch (error) {
      console.error("Error detecting location:", error);
      Alert.alert("Error", "Failed to detect location. Please enter manually.");
      setLoading(false);
    }
  };

  const handleContinue = async () => {
    if (!address || !city || !pincode) {
      Alert.alert("Incomplete address", "Please fill in all required fields");
      return;
    }

    const draft = await getDraftRequest();
    await saveDraftRequest({
      ...draft,
      address: {
        address,
        city,
        pincode,
        landmark,
        coordinates,
      },
    });

    router.push("/(tabs)/review");
  };

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
              Pickup Address
            </Text>
            <Text
              style={{
                fontSize: 14,
                color: theme.colors.text.secondary,
                marginTop: 2,
              }}
            >
              Where should we pick up?
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
        {/* GPS Detection Button */}
        <TouchableOpacity
          onPress={detectLocation}
          disabled={loading}
          style={{
            backgroundColor: theme.colors.primary,
            height: 56,
            borderRadius: 12,
            flexDirection: "row",
            justifyContent: "center",
            alignItems: "center",
            marginBottom: 24,
          }}
        >
          {loading ? (
            <ActivityIndicator color="white" />
          ) : (
            <>
              <MapPin size={20} color="white" style={{ marginRight: 8 }} />
              <Text
                style={{
                  fontSize: 16,
                  fontWeight: "600",
                  color: "white",
                }}
              >
                Detect My Location
              </Text>
            </>
          )}
        </TouchableOpacity>

        {/* Divider */}
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            marginBottom: 24,
          }}
        >
          <View
            style={{
              flex: 1,
              height: 1,
              backgroundColor: theme.colors.divider,
            }}
          />
          <Text
            style={{
              marginHorizontal: 16,
              fontSize: 14,
              color: theme.colors.text.tertiary,
            }}
          >
            OR ENTER MANUALLY
          </Text>
          <View
            style={{
              flex: 1,
              height: 1,
              backgroundColor: theme.colors.divider,
            }}
          />
        </View>

        {/* Address Form */}
        <View style={{ marginBottom: 16 }}>
          <Text
            style={{
              fontSize: 14,
              fontWeight: "500",
              color: theme.colors.text.primary,
              marginBottom: 8,
            }}
          >
            Address <Text style={{ color: theme.colors.error }}>*</Text>
          </Text>
          <TextInput
            placeholder="Street address"
            placeholderTextColor={theme.colors.input.placeholder}
            value={address}
            onChangeText={setAddress}
            style={{
              backgroundColor: theme.colors.input.background,
              borderWidth: 1,
              borderColor: theme.colors.border,
              borderRadius: 12,
              paddingHorizontal: 16,
              height: 56,
              fontSize: 16,
              color: theme.colors.text.primary,
            }}
          />
        </View>

        <View style={{ marginBottom: 16 }}>
          <Text
            style={{
              fontSize: 14,
              fontWeight: "500",
              color: theme.colors.text.primary,
              marginBottom: 8,
            }}
          >
            City <Text style={{ color: theme.colors.error }}>*</Text>
          </Text>
          <TextInput
            placeholder="City, State"
            placeholderTextColor={theme.colors.input.placeholder}
            value={city}
            onChangeText={setCity}
            style={{
              backgroundColor: theme.colors.input.background,
              borderWidth: 1,
              borderColor: theme.colors.border,
              borderRadius: 12,
              paddingHorizontal: 16,
              height: 56,
              fontSize: 16,
              color: theme.colors.text.primary,
            }}
          />
        </View>

        <View style={{ marginBottom: 16 }}>
          <Text
            style={{
              fontSize: 14,
              fontWeight: "500",
              color: theme.colors.text.primary,
              marginBottom: 8,
            }}
          >
            Pincode <Text style={{ color: theme.colors.error }}>*</Text>
          </Text>
          <TextInput
            placeholder="Pincode"
            placeholderTextColor={theme.colors.input.placeholder}
            value={pincode}
            onChangeText={setPincode}
            keyboardType="number-pad"
            style={{
              backgroundColor: theme.colors.input.background,
              borderWidth: 1,
              borderColor: theme.colors.border,
              borderRadius: 12,
              paddingHorizontal: 16,
              height: 56,
              fontSize: 16,
              color: theme.colors.text.primary,
            }}
          />
        </View>

        <View style={{ marginBottom: 16 }}>
          <Text
            style={{
              fontSize: 14,
              fontWeight: "500",
              color: theme.colors.text.primary,
              marginBottom: 8,
            }}
          >
            Landmark (Optional)
          </Text>
          <TextInput
            placeholder="Nearby landmark"
            placeholderTextColor={theme.colors.input.placeholder}
            value={landmark}
            onChangeText={setLandmark}
            style={{
              backgroundColor: theme.colors.input.background,
              borderWidth: 1,
              borderColor: theme.colors.border,
              borderRadius: 12,
              paddingHorizontal: 16,
              height: 56,
              fontSize: 16,
              color: theme.colors.text.primary,
            }}
          />
        </View>
      </ScrollView>

      {/* Continue Button */}
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
            Review Request
          </Text>
          <ArrowRight size={20} color="white" />
        </TouchableOpacity>
      </View>
    </View>
  );
}
