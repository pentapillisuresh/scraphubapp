// import React, { useState, useEffect,useCallback } from "react";
// import {
//   View,
//   Text,
//   TextInput,
//   TouchableOpacity,
//   ScrollView,
//   Alert,
//   ActivityIndicator,
// } from "react-native";
// import { StatusBar } from "expo-status-bar";
// import { router } from "expo-router";
// import { useSafeAreaInsets } from "react-native-safe-area-context";
// import * as Location from "expo-location";
// import { MapPin, ArrowLeft, ArrowRight, Loader } from "lucide-react-native";
// import { useTheme } from "@/utils/theme";
// import { getDraftRequest, saveDraftRequest } from "../../utils/storage";
// import { useFocusEffect } from "expo-router";

// export default function Address() {
//   const insets = useSafeAreaInsets();
//   const theme = useTheme();
//   const [loading, setLoading] = useState(false);
//   const [address, setAddress] = useState("");
//   const [city, setCity] = useState("");
//   const [pincode, setPincode] = useState("");
//   const [landmark, setLandmark] = useState("");
//   const [coordinates, setCoordinates] = useState(null);

//   useFocusEffect(
//     useCallback(() => {
//       loadDraft();

//       return () => {
//         // optional cleanup when screen loses focus
//       };
//     }, [loadDraft])
//   );

//   const loadDraft = async () => {
//     const draft = await getDraftRequest();
//     console.log("rrr::",draft)
//     if (draft && draft.address) {
//       setAddress(draft.address.address || "");
//       setCity(draft.address.city || "");
//       setPincode(draft.address.pincode || "");
//       setLandmark(draft.address.landmark || "");
//       setCoordinates(draft.address.coordinates || null);
//     }
//   };

//   const detectLocation = async () => {
//     setLoading(true);
//     try {
//       const { status } = await Location.requestForegroundPermissionsAsync();
//       if (status !== "granted") {
//         Alert.alert(
//           "Permission denied",
//           "Please grant location permissions to detect your address",
//         );
//         setLoading(false);
//         return;
//       }

//       const location = await Location.getCurrentPositionAsync({});
//       setCoordinates({
//         latitude: location.coords.latitude,
//         longitude: location.coords.longitude,
//       });

//       // Reverse geocode to get address
//       const geocoded = await Location.reverseGeocodeAsync({
//         latitude: location.coords.latitude,
//         longitude: location.coords.longitude,
//       });

//       if (geocoded && geocoded.length > 0) {
//         const place = geocoded[0];
//         setAddress(`${place.street || ""} ${place.streetNumber || ""}`);
//         setCity(`${place.city || ""}, ${place.region || ""}`);
//         setPincode(place.postalCode || "");
//       }

//       setLoading(false);
//     } catch (error) {
//       console.error("Error detecting location:", error);
//       Alert.alert("Error", "Failed to detect location. Please enter manually.");
//       setLoading(false);
//     }
//   };

//   const handleContinue = async () => {
//     if (!address || !city || !pincode) {
//       Alert.alert("Incomplete address", "Please fill in all required fields");
//       return;
//     }

//     const draft = await getDraftRequest();
//     await saveDraftRequest({
//       ...draft,
//       address: {
//         address,
//         city,
//         pincode,
//         landmark,
//         coordinates,
//       },
//     });

//     router.push("/(tabs)/review");
//   };

//   return (
//     <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
//       <StatusBar style={theme.isDark ? "light" : "dark"} />

//       {/* Header */}
//       <View
//         style={{
//           paddingTop: insets.top + 16,
//           paddingHorizontal: 24,
//           paddingBottom: 16,
//           backgroundColor: theme.colors.surface,
//           borderBottomWidth: 1,
//           borderBottomColor: theme.colors.border,
//         }}
//       >
//         <View style={{ flexDirection: "row", alignItems: "center" }}>
//           <TouchableOpacity
//             onPress={() => router.back()}
//             style={{
//               width: 40,
//               height: 40,
//               borderRadius: 20,
//               backgroundColor: theme.colors.input.background,
//               justifyContent: "center",
//               alignItems: "center",
//               marginRight: 16,
//             }}
//           >
//             <ArrowLeft color={theme.colors.text.primary} size={20} />
//           </TouchableOpacity>
//           <View>
//             <Text
//               style={{
//                 fontSize: 20,
//                 fontWeight: "bold",
//                 color: theme.colors.text.primary,
//               }}
//             >
//               Pickup Address
//             </Text>
//             <Text
//               style={{
//                 fontSize: 14,
//                 color: theme.colors.text.secondary,
//                 marginTop: 2,
//               }}
//             >
//               Where should we pick up?
//             </Text>
//           </View>
//         </View>
//       </View>

//       <ScrollView
//         style={{ flex: 1 }}
//         contentContainerStyle={{
//           paddingTop: 24,
//           paddingHorizontal: 24,
//           paddingBottom: insets.bottom + 100,
//         }}
//         showsVerticalScrollIndicator={false}
//       >
//         {/* GPS Detection Button */}
//         <TouchableOpacity
//           onPress={detectLocation}
//           disabled={loading}
//           style={{
//             backgroundColor: theme.colors.primary,
//             height: 56,
//             borderRadius: 12,
//             flexDirection: "row",
//             justifyContent: "center",
//             alignItems: "center",
//             marginBottom: 24,
//           }}
//         >
//           {loading ? (
//             <ActivityIndicator color="white" />
//           ) : (
//             <>
//               <MapPin size={20} color="white" style={{ marginRight: 8 }} />
//               <Text
//                 style={{
//                   fontSize: 16,
//                   fontWeight: "600",
//                   color: "white",
//                 }}
//               >
//                 Detect My Location
//               </Text>
//             </>
//           )}
//         </TouchableOpacity>

//         {/* Divider */}
//         <View
//           style={{
//             flexDirection: "row",
//             alignItems: "center",
//             marginBottom: 24,
//           }}
//         >
//           <View
//             style={{
//               flex: 1,
//               height: 1,
//               backgroundColor: theme.colors.divider,
//             }}
//           />
//           <Text
//             style={{
//               marginHorizontal: 16,
//               fontSize: 14,
//               color: theme.colors.text.tertiary,
//             }}
//           >
//             OR ENTER MANUALLY
//           </Text>
//           <View
//             style={{
//               flex: 1,
//               height: 1,
//               backgroundColor: theme.colors.divider,
//             }}
//           />
//         </View>

//         {/* Address Form */}
//         <View style={{ marginBottom: 16 }}>
//           <Text
//             style={{
//               fontSize: 14,
//               fontWeight: "500",
//               color: theme.colors.text.primary,
//               marginBottom: 8,
//             }}
//           >
//             Address <Text style={{ color: theme.colors.error }}>*</Text>
//           </Text>
//           <TextInput
//             placeholder="Street address"
//             placeholderTextColor={theme.colors.input.placeholder}
//             value={address}
//             onChangeText={setAddress}
//             style={{
//               backgroundColor: theme.colors.input.background,
//               borderWidth: 1,
//               borderColor: theme.colors.border,
//               borderRadius: 12,
//               paddingHorizontal: 16,
//               height: 56,
//               fontSize: 16,
//               color: theme.colors.text.primary,
//             }}
//           />
//         </View>

//         <View style={{ marginBottom: 16 }}>
//           <Text
//             style={{
//               fontSize: 14,
//               fontWeight: "500",
//               color: theme.colors.text.primary,
//               marginBottom: 8,
//             }}
//           >
//             City <Text style={{ color: theme.colors.error }}>*</Text>
//           </Text>
//           <TextInput
//             placeholder="City, State"
//             placeholderTextColor={theme.colors.input.placeholder}
//             value={city}
//             onChangeText={setCity}
//             style={{
//               backgroundColor: theme.colors.input.background,
//               borderWidth: 1,
//               borderColor: theme.colors.border,
//               borderRadius: 12,
//               paddingHorizontal: 16,
//               height: 56,
//               fontSize: 16,
//               color: theme.colors.text.primary,
//             }}
//           />
//         </View>

//         <View style={{ marginBottom: 16 }}>
//           <Text
//             style={{
//               fontSize: 14,
//               fontWeight: "500",
//               color: theme.colors.text.primary,
//               marginBottom: 8,
//             }}
//           >
//             Pincode <Text style={{ color: theme.colors.error }}>*</Text>
//           </Text>
//           <TextInput
//             placeholder="Pincode"
//             placeholderTextColor={theme.colors.input.placeholder}
//             value={pincode}
//             onChangeText={setPincode}
//             keyboardType="number-pad"
//             style={{
//               backgroundColor: theme.colors.input.background,
//               borderWidth: 1,
//               borderColor: theme.colors.border,
//               borderRadius: 12,
//               paddingHorizontal: 16,
//               height: 56,
//               fontSize: 16,
//               color: theme.colors.text.primary,
//             }}
//           />
//         </View>

//         <View style={{ marginBottom: 16 }}>
//           <Text
//             style={{
//               fontSize: 14,
//               fontWeight: "500",
//               color: theme.colors.text.primary,
//               marginBottom: 8,
//             }}
//           >
//             Landmark (Optional)
//           </Text>
//           <TextInput
//             placeholder="Nearby landmark"
//             placeholderTextColor={theme.colors.input.placeholder}
//             value={landmark}
//             onChangeText={setLandmark}
//             style={{
//               backgroundColor: theme.colors.input.background,
//               borderWidth: 1,
//               borderColor: theme.colors.border,
//               borderRadius: 12,
//               paddingHorizontal: 16,
//               height: 56,
//               fontSize: 16,
//               color: theme.colors.text.primary,
//             }}
//           />
//         </View>
//       </ScrollView>

//       {/* Continue Button */}
//       <View
//         style={{
//           position: "absolute",
//           bottom: 0,
//           left: 0,
//           right: 0,
//           backgroundColor: theme.colors.surface,
//           borderTopWidth: 1,
//           borderTopColor: theme.colors.border,
//           paddingHorizontal: 24,
//           paddingTop: 16,
//           paddingBottom: insets.bottom + 16,
//         }}
//       >
//         <TouchableOpacity
//           onPress={handleContinue}
//           style={{
//             backgroundColor: theme.colors.primary,
//             height: 56,
//             borderRadius: 12,
//             flexDirection: "row",
//             justifyContent: "center",
//             alignItems: "center",
//           }}
//         >
//           <Text
//             style={{
//               fontSize: 16,
//               fontWeight: "600",
//               color: "white",
//               marginRight: 8,
//             }}
//           >
//             Review Request
//           </Text>
//           <ArrowRight size={20} color="white" />
//         </TouchableOpacity>
//       </View>
//     </View>
//   );
// }


import React, { useState, useEffect, useCallback } from "react";
import { View, Text, TextInput, TouchableOpacity, ScrollView, Alert, ActivityIndicator, Dimensions } from "react-native";
import { StatusBar } from "expo-status-bar";
import { router, useFocusEffect } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ArrowLeft, ArrowRight, MapPin, Plus, Check, X, Navigation } from "lucide-react-native";
import { useTheme } from "../../utils/theme";
import { getDraftRequest, getUserData, saveDraftRequest } from "../../utils/storage";
import * as Location from "expo-location";
import ApiService from "../../utils/ApiService";
import AsyncStorage from "@react-native-async-storage/async-storage";

const { width } = Dimensions.get('window');

export default function Address() {
  const insets = useSafeAreaInsets();
  const theme = useTheme();

  const [addresses, setAddresses] = useState([]);
  const [selectedAddressId, setSelectedAddressId] = useState(null);
  const [selectedAddress, setSelectedAddress] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [userToken, setUserToken] = useState("");
  const [isDetectingLocation, setIsDetectingLocation] = useState(false);

  const [form, setForm] = useState({
    address_line1: "",
    address_line2: "",
    landmark: "",
    city: "",
    state: "",
    pincode: "",
    latitude: null,
    longitude: null,
  });

  useEffect(() => {
    const loadToken = async () => {
      const token = await AsyncStorage.getItem("Token");
      setUserToken(token);
    };
    loadToken();
  }, []);

  const detectLocation = async () => {
    try {
      setIsDetectingLocation(true);

      const { status } = await Location.requestForegroundPermissionsAsync();

      if (status !== "granted") {
        Alert.alert(
          "Permission Required",
          "Please allow location access to automatically fill your address",
          [
            { text: "Cancel", style: "cancel" },
            { text: "Settings", onPress: () => Location.requestForegroundPermissionsAsync() }
          ]
        );
        return;
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      const { latitude, longitude } = location.coords;

      setForm((prev) => ({
        ...prev,
        latitude,
        longitude,
      }));

      const geocode = await Location.reverseGeocodeAsync({
        latitude,
        longitude,
      });

      if (geocode.length) {
        const place = geocode[0];
        setForm((prev) => ({
          ...prev,
          address_line1: `${place.street || ""} ${place.streetNumber || ""}`.trim(),
          city: place.city || "",
          state: place.region || "",
          pincode: place.postalCode || "",
        }));

        Alert.alert("Success", "Location detected successfully!");
      }
    } catch (err) {
      console.error("Location error:", err);
      Alert.alert("Error", "Unable to detect location. Please try again or enter manually.");
    } finally {
      setIsDetectingLocation(false);
    }
  };

  /* ---------------- FETCH ADDRESSES ---------------- */

  const fetchAddresses = useCallback(async () => {
    if (!userToken) return;

    try {
      setLoading(true);
      const res = await ApiService.get(`/userAddresses/`, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${userToken}`,
        },
      });
      setAddresses(res.data || []);
    } catch (e) {
      console.error("Fetch addresses error:", e);
      Alert.alert("Error", "Unable to fetch addresses");
    } finally {
      setLoading(false);
    }
  }, [userToken]);

  useFocusEffect(
    useCallback(() => {
      fetchAddresses();
    }, [fetchAddresses])
  );

  /* ---------------- SELECT ADDRESS ---------------- */

  const toggleSelectAddress = (id, address) => {
    if (selectedAddressId === id) {
      setSelectedAddressId(null);
      setSelectedAddress(null);
    } else {
      setSelectedAddressId(id);
      setSelectedAddress(address);
    }
  };

  /* ---------------- CONTINUE ---------------- */

  const handleContinue = async () => {
    if (!selectedAddressId || !selectedAddress) {
      Alert.alert("Select Address", "Please select a pickup address to continue");
      return;
    }

    const draft = await getDraftRequest();
    await saveDraftRequest({
      ...draft,
      address_id: selectedAddressId,
      address: selectedAddress,
    });

    router.push("/(tabs)/review");
  };

  /* ---------------- CREATE ADDRESS ---------------- */

  const createAddress = async () => {
    const requiredFields = ['address_line1', 'city', 'pincode'];
    const missingFields = requiredFields.filter(field => !form[field].trim());

    if (missingFields.length > 0) {
      Alert.alert(
        "Required Fields",
        `Please fill in: ${missingFields.map(f => f.replace('_', ' ')).join(', ')}`
      );
      return;
    }

    const rrr = await getUserData();
    const USER_ID = rrr.id;

    const addAddressPayload = {
      user_id: USER_ID,
      ...form,
      country: "India",
      is_default: false,
    }

    setLoading(true);
    try {
      const res = await ApiService.post(`/userAddresses/`, addAddressPayload, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${userToken}`,
        }
      });

      if (res.success) {
        setAddresses((prev) => [...prev, res.data]);
        setSelectedAddressId(res.data.id);
        setSelectedAddress(res.data);
        setShowForm(false);

        // Reset form
        setForm({
          address_line1: "",
          address_line2: "",
          landmark: "",
          city: "",
          state: "",
          pincode: "",
          latitude: null,
          longitude: null,
        });

        Alert.alert("Success", "Address saved successfully!");
      }
    } catch (err) {
      console.error("Create address error:", err);
      Alert.alert("Error", "Failed to save address. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  /* ---------------- RENDER ADDRESS CARD ---------------- */

  const renderAddressCard = (addr) => {
    const selected = selectedAddressId === addr.id;

    return (
      <TouchableOpacity
        key={addr.id}
        onPress={() => toggleSelectAddress(addr.id, addr)}
        style={{
          width: width * 0.8,
          marginRight: 16,
          borderRadius: 16,
          borderWidth: selected ? 2 : 1,
          borderColor: selected ? theme.colors.primary : theme.colors.border,
          backgroundColor: theme.colors.surface,
          padding: 20,
          shadowColor: theme.colors.text.primary,
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.1,
          shadowRadius: 8,
          elevation: 3,
        }}
      >
        {/* Selection indicator */}
        <View style={{
          position: 'absolute',
          top: 12,
          right: 12,
          width: 24,
          height: 24,
          borderRadius: 12,
          borderWidth: 2,
          borderColor: selected ? theme.colors.primary : theme.colors.border,
          backgroundColor: selected ? theme.colors.primary : 'transparent',
          justifyContent: 'center',
          alignItems: 'center'
        }}>
          {selected && (
            <Check size={14} color="white" />
          )}
        </View>

        {/* Address Icon */}
        <View style={{
          width: 40,
          height: 40,
          borderRadius: 20,
          backgroundColor: `${theme.colors.primary}20`,
          justifyContent: 'center',
          alignItems: 'center',
          marginBottom: 12
        }}>
          <MapPin
            size={20}
            color={theme.colors.primary}
          />
        </View>

        {/* Address Details */}
        <Text style={{
          fontSize: 16,
          fontWeight: "600",
          color: theme.colors.text.primary,
          marginBottom: 4
        }}>
          {addr.address_line1}
        </Text>

        {addr.address_line2 ? (
          <Text style={{
            fontSize: 14,
            color: theme.colors.text.secondary,
            marginBottom: 4
          }}>
            {addr.address_line2}
          </Text>
        ) : null}

        {addr.landmark ? (
          <Text style={{
            fontSize: 14,
            color: theme.colors.text.secondary,
            marginBottom: 4
          }}>
            Near: {addr.landmark}
          </Text>
        ) : null}

        <Text style={{
          fontSize: 14,
          color: theme.colors.text.secondary,
          marginTop: 8
        }}>
          {addr.city}, {addr.state} - {addr.pincode}
        </Text>
      </TouchableOpacity>
    );
  };

  /* ---------------- RENDER FORM FIELD ---------------- */

  const renderFormField = (field) => {
    const label = field.replace("_", " ").replace(/\b\w/g, l => l.toUpperCase());
    const isRequired = ['address_line1', 'city', 'pincode'].includes(field);

    return (
      <View key={field} style={{ marginBottom: 16 }}>
        <Text style={{
          fontSize: 14,
          fontWeight: "500",
          color: theme.colors.text.primary,
          marginBottom: 8,
          marginLeft: 4
        }}>
          {label} {isRequired && <Text style={{ color: '#FF3B30' }}>*</Text>}
        </Text>
        <TextInput
          placeholder={`Enter ${label.toLowerCase()}`}
          placeholderTextColor={theme.colors.text.tertiary}
          value={form[field]}
          onChangeText={(t) => setForm((p) => ({ ...p, [field]: t }))}
          style={{
            backgroundColor: theme.colors.input.background || theme.colors.surface,
            borderWidth: 1,
            borderColor: form[field] ? theme.colors.primary : theme.colors.input.border,
            borderRadius: 12,
            paddingHorizontal: 16,
            height: 56,
            fontSize: 16,
            color: theme.colors.text.primary,
          }}
        />
      </View>
    );
  };

  /* ---------------- UI ---------------- */

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <StatusBar style={theme.isDark ? "light" : "dark"} />

      {/* Header */}
      <View style={{
        paddingTop: insets.top + 16,
        paddingHorizontal: 20,
        paddingBottom: 16,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.border,
        backgroundColor: theme.colors.surface
      }}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={{
              width: 40,
              height: 40,
              borderRadius: 20,
              backgroundColor: `${theme.colors.text.primary}10`,
              justifyContent: 'center',
              alignItems: 'center',
              marginRight: 12
            }}
          >
            <ArrowLeft size={22} color={theme.colors.text.primary} />
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={{
              fontSize: 24,
              fontWeight: "bold",
              color: theme.colors.text.primary
            }}>
              Pickup Address
            </Text>
            <Text style={{
              fontSize: 14,
              color: theme.colors.text.secondary,
              marginTop: 2
            }}>
              Select or add a pickup location
            </Text>
          </View>
        </View>
      </View>

      {/* Main Content */}
      <ScrollView
        style={{ flex: 1 }}
        showsVerticalScrollIndicator={false}
      >
        {/* ADDRESS SELECTION SECTION */}
        <View style={{ padding: 20 }}>
          {loading && addresses.length === 0 ? (
            <View style={{
              height: 200,
              justifyContent: 'center',
              alignItems: 'center'
            }}>
              <ActivityIndicator size="large" color={theme.colors.primary} />
              <Text style={{
                marginTop: 12,
                color: theme.colors.text.secondary
              }}>
                Loading addresses...
              </Text>
            </View>
          ) : addresses.length > 0 ? (
            <>
              <Text style={{
                fontSize: 18,
                fontWeight: "600",
                color: theme.colors.text.primary,
                marginBottom: 16
              }}>
                Your Addresses
              </Text>

              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={{ marginHorizontal: -4 }}
                contentContainerStyle={{ paddingHorizontal: 4 }}
              >
                {addresses.map(renderAddressCard)}
              </ScrollView>
            </>
          ) : (
            <View style={{
              backgroundColor: `${theme.colors.primary}10`,
              borderRadius: 16,
              padding: 24,
              alignItems: 'center',
              borderWidth: 1,
              borderColor: `${theme.colors.primary}20`,
              borderStyle: 'dashed'
            }}>
              <MapPin
                size={48}
                color={theme.colors.primary}
                style={{ marginBottom: 12 }}
              />
              <Text style={{
                fontSize: 16,
                fontWeight: "600",
                color: theme.colors.text.primary,
                marginBottom: 8,
                textAlign: 'center'
              }}>
                No Addresses Found
              </Text>
              <Text style={{
                fontSize: 14,
                color: theme.colors.text.secondary,
                textAlign: 'center',
                marginBottom: 20
              }}>
                Add your first pickup address to continue
              </Text>
            </View>
          )}
        </View>

        {/* FORM OR ADD BUTTON */}
        {!showForm ? (
          <View style={{ paddingHorizontal: 20, paddingTop: 20 }}>
            <TouchableOpacity
              onPress={() => setShowForm(true)}
              style={{
                height: 56,
                borderRadius: 12,
                backgroundColor: 'transparent',
                borderWidth: 2,
                borderColor: theme.colors.primary,
                borderStyle: 'dashed',
                justifyContent: 'center',
                alignItems: 'center',
                flexDirection: 'row'
              }}
            >
              <Plus size={20} color={theme.colors.primary} style={{ marginRight: 8 }} />
              <Text style={{
                color: theme.colors.primary,
                fontWeight: "600",
                fontSize: 16
              }}>
                Add New Address
              </Text>
            </TouchableOpacity>
          </View>
        ) : (
          /* ADDRESS FORM */
          <View style={{
            padding: 20,
            margin: 20,
            marginTop: 0,
            borderRadius: 20,
            backgroundColor: theme.colors.surface,
            shadowColor: theme.colors.text.primary,
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.1,
            shadowRadius: 12,
            elevation: 5
          }}>
            {/* Form Header */}
            <View style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: 24
            }}>
              <Text style={{
                fontSize: 20,
                fontWeight: "bold",
                color: theme.colors.text.primary
              }}>
                Add New Address
              </Text>
              <TouchableOpacity
                onPress={() => {
                  setShowForm(false);
                  setForm({
                    address_line1: "",
                    address_line2: "",
                    landmark: "",
                    city: "",
                    state: "",
                    pincode: "",
                    latitude: null,
                    longitude: null,
                  });
                }}
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 18,
                  backgroundColor: `${theme.colors.text.primary}10`,
                  justifyContent: 'center',
                  alignItems: 'center'
                }}
              >
                <X size={20} color={theme.colors.text.primary} />
              </TouchableOpacity>
            </View>

            {/* Location Detection Button */}
            <TouchableOpacity
              onPress={detectLocation}
              disabled={isDetectingLocation}
              style={{
                height: 56,
                borderRadius: 12,
                backgroundColor: `${theme.colors.primary}10`,
                borderWidth: 1,
                borderColor: theme.colors.primary,
                flexDirection: 'row',
                justifyContent: 'center',
                alignItems: 'center',
                marginBottom: 24
              }}
            >
              {isDetectingLocation ? (
                <>
                  <ActivityIndicator color={theme.colors.primary} size="small" />
                  <Text style={{
                    fontSize: 16,
                    fontWeight: "600",
                    color: theme.colors.primary,
                    marginLeft: 8
                  }}>
                    Detecting Location...
                  </Text>
                </>
              ) : (
                <>
                  <Navigation size={20} color={theme.colors.primary} style={{ marginRight: 8 }} />
                  <Text style={{
                    fontSize: 16,
                    fontWeight: "600",
                    color: theme.colors.primary
                  }}>
                    Use Current Location
                  </Text>
                </>
              )}
            </TouchableOpacity>

            {/* Form Fields */}
            {['address_line1', 'address_line2', 'landmark', 'city', 'state', 'pincode'].map(renderFormField)}

            {/* Action Buttons */}
            <View style={{ flexDirection: 'row', gap: 12, marginTop: 8 }}>
              <TouchableOpacity
                onPress={() => {
                  setShowForm(false);
                  setForm({
                    address_line1: "",
                    address_line2: "",
                    landmark: "",
                    city: "",
                    state: "",
                    pincode: "",
                    latitude: null,
                    longitude: null,
                  });
                }}
                style={{
                  flex: 1,
                  height: 56,
                  borderRadius: 12,
                  backgroundColor: theme.colors.border,
                  justifyContent: 'center',
                  alignItems: 'center'
                }}
              >
                <Text style={{
                  color: theme.colors.text.secondary,
                  fontWeight: "600",
                  fontSize: 16
                }}>
                  Cancel
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={createAddress}
                disabled={loading}
                style={{
                  flex: 1,
                  height: 56,
                  borderRadius: 12,
                  backgroundColor: theme.colors.primary,
                  justifyContent: 'center',
                  alignItems: 'center',
                  opacity: loading ? 0.7 : 1
                }}
              >
                {loading ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <Text style={{
                    color: "white",
                    fontWeight: "600",
                    fontSize: 16
                  }}>
                    Save Address
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Spacer for continue button */}
        <View style={{ height: 100 }} />
      </ScrollView>

      {/* CONTINUE BUTTON (Fixed at bottom) */}
      <View
        style={{
          padding: 20,
          paddingBottom: insets.bottom + 20,
          borderTopWidth: 1,
          borderTopColor: theme.colors.border,
          backgroundColor: theme.colors.surface
        }}
      >
        <TouchableOpacity
          onPress={handleContinue}
          disabled={!selectedAddressId}
          style={{
            height: 56,
            borderRadius: 12,
            backgroundColor: selectedAddressId
              ? theme.colors.primary
              : theme.colors.border,
            flexDirection: "row",
            justifyContent: "center",
            alignItems: "center",
            opacity: selectedAddressId ? 1 : 0.6
          }}
        >
          <Text style={{
            color: selectedAddressId ? "white" : theme.colors.text.secondary,
            fontWeight: "600",
            fontSize: 16,
            marginRight: 8
          }}>
            Continue to Review
          </Text>
          <ArrowRight
            color={selectedAddressId ? "white" : theme.colors.text.secondary}
            size={20}
          />
        </TouchableOpacity>
      </View>
    </View>
  );
}