import React, { useState, useEffect, useRef, useCallback } from "react";
import { View, Text, ScrollView, TouchableOpacity, Image, Dimensions, FlatList, Animated } from "react-native";
import { StatusBar } from "expo-status-bar";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ArrowRight, ChevronRight,Package, Star, Clock, TrendingUp } from "lucide-react-native";
import { useTheme } from "@/utils/theme";
import { getUserData, getDraftRequest, saveDraftRequest,clearDraftRequest } from "../../utils/storage";
import ApiService from "../../utils/ApiService";
// import { scrap1, scrap2, scrap3, scrap4 } from '../../assets/images';

const { width } = Dimensions.get('window');

const carouselImages = [
  {
    id: "1",
    image: require('../../../assets/images/scrap1.jpeg'),
    title: "Earn More from Scrap",
    subtitle: "Get best prices for your recyclables"
  },
  {
    id: "2",
    image: require('../../../assets/images/scrap2.jpeg'),
    title: "Instant Pickup",
    subtitle: "Schedule pickup at your convenience"
  },
  {
    id: "3",
    image: require('../../../assets/images/scrap3.jpeg'),
    title: "Easy Selling",
    subtitle: "Simple 3-step process"
  },
  {
    id: "4",
    image: require('../../../assets/images/scrap4.jpeg'),
    title: "Cash Payment",
    subtitle: "Instant payment on pickup"
  }
];

// Stats data
const stats = [
  { id: 1, value: "4.8", label: "Rating", icon: Star, color: "#FFD700" },
  { id: 2, value: "24h", label: "Pickup Time", icon: Clock, color: "#4ECDC4" },
  { id: 3, value: "10K+", label: "Happy Sellers", icon: TrendingUp, color: "#3498DB" },
];

export default function Home() {
  const insets = useSafeAreaInsets();
  const theme = useTheme();
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [userName, setUserName] = useState("");
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const scrollX = useRef(new Animated.Value(0)).current;
  const flatListRef = useRef(null);
  const isMounted = useRef(true);
  const hasLoadedData = useRef(false);
  const [categories, setCategories] = useState([]);

  const loadCategories = useCallback(async () => {
    try {
      const response = await ApiService.get("/categories",{
        headers: {
          "Content-Type": "application/json",
        },
      });
      if (response.success) {
        // Map API data to UI-friendly format
        const formattedCategories = response.data.map((item) => ({
          id: item.id,
          name: item.name,
          description: item.description,
          image: item.icon || null,   // 👈 API icon URL
          color: theme.colors.primary, // fallback color
          icon: Package,// 👈 reuse an icon component (or change per category)
        }));

        setCategories(formattedCategories);
      }
    } catch (error) {
      console.error("Failed to load categories:", error);
    }
  }, [theme.colors.primary]); 

  useEffect(() => {
    isMounted.current = true;

    // Load data only once on component mount
    if (!hasLoadedData.current) {
      loadData();
      hasLoadedData.current = true;
    }

    // Auto-slide carousel
    const interval = setInterval(() => {
      if (flatListRef.current && isMounted.current) {
        const nextIndex = (currentIndex + 1) % carouselImages.length;
        flatListRef.current.scrollToIndex({ index: nextIndex, animated: true });
        setCurrentIndex(nextIndex);
      }
    }, 5000);

    return () => {
      isMounted.current = false;
      clearInterval(interval);
    };
  }, []); // Empty dependency array - runs only once on mount

  useEffect(() => {
    const clearDraft=async ()=>{

      await  clearDraftRequest()
    }
    clearDraft()
  }, [isLoading]);

  const loadData = useCallback(async () => {
    if (!isMounted.current) return;
  
    setIsLoading(true);
  
    try {
      const userData = await getUserData();
      if (userData && isMounted.current) {
        setUserName(userData.name);
      }
  
      // const draft = await getDraftRequest();
      // if (draft?.categories && isMounted.current) {
      //   setSelectedCategories(draft.categories);
      // }
  
      await loadCategories();
    } catch (error) {
      console.error("Error loading data:", error);
    } finally {
      if (isMounted.current) {
        setIsLoading(false);
      }
    } 
  }, [loadCategories]);
  
  const saveSelectedCategories = useCallback(async () => {
    try {
      const draft = await getDraftRequest() || {};
      await saveDraftRequest({
        ...draft,
        categories: selectedCategories,
      });
    } catch (error) {
      console.error("Error saving categories:", error);
    }
  }, [selectedCategories]);

  const toggleCategory = useCallback((categoryObj) => {
    const categoryId = Object.keys(categoryObj)[0];
  
    setSelectedCategories((prev) => {
      const exists = prev.some(
        (item) => Object.keys(item)[0] === categoryId
      );
  
      if (exists) {
        return prev.filter(
          (item) => Object.keys(item)[0] !== categoryId
        );
      }
  
      return [...prev, categoryObj];
    });
  }, []);

  const handleContinue = useCallback(async () => {
    if (selectedCategories.length === 0) {
      return;
    }

    // Save current selection to draft before navigating
    await saveSelectedCategories();
    router.push("/(tabs)/photo-upload");
  }, [selectedCategories, saveSelectedCategories]);

  const renderCarouselItem = useCallback(({ item, index }) => {
    const inputRange = [
      (index - 1) * width,
      index * width,
      (index + 1) * width,
    ];

    const scale = scrollX.interpolate({
      inputRange,
      outputRange: [0.9, 1, 0.9],
      extrapolate: 'clamp',
    });

    const opacity = scrollX.interpolate({
      inputRange,
      outputRange: [0.7, 1, 0.7],
    });

    // Get the correct image source
    let imageSource;

    if (typeof item.image === 'number') {
      // This is a local image from require() - it returns a number
      imageSource = item.image;
    } else if (typeof item.image === 'string') {
      // This is a URL string
      imageSource = { uri: item.image };
    } else if (item.image && item.image.uri) {
      // Already has uri property
      imageSource = item.image;
    } else {
      // Fallback to a default image
      imageSource = { uri: 'https://images.unsplash.com/photo-1611273426858-450d8e3c9fce?w=800&auto=format&fit=crop' };
    }

    return (
      <Animated.View
        style={{
          width: width - 48,
          marginHorizontal: 8,
          borderRadius: 20,
          overflow: 'hidden',
          transform: [{ scale }],
          opacity,
          elevation: 5,
          shadowColor: "#000",
          shadowOffset: {
            width: 0,
            height: 2,
          },
          shadowOpacity: 0.25,
          shadowRadius: 3.84,
        }}
      >
        <Image
          source={imageSource}
          style={{
            width: '100%',
            height: 180,
            borderRadius: 20,
          }}
          resizeMode="cover"
        />
        <View
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            backgroundColor: 'rgba(0,0,0,0.7)',
            padding: 16,
            borderBottomLeftRadius: 20,
            borderBottomRightRadius: 20,
          }}
        >
          <Text
            style={{
              fontSize: 20,
              fontWeight: 'bold',
              color: 'white',
              marginBottom: 4,
            }}
          >
            {item.title}
          </Text>
          <Text
            style={{
              fontSize: 14,
              color: 'rgba(255,255,255,0.9)',
            }}
          >
            {item.subtitle}
          </Text>
        </View>
      </Animated.View>
    );
  }, [scrollX]);

  const renderPagination = useCallback(() => {
    return (
      <View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: 16 }}>
        {carouselImages.map((_, index) => {
          const inputRange = [
            (index - 1) * width,
            index * width,
            (index + 1) * width,
          ];

          const dotWidth = scrollX.interpolate({
            inputRange,
            outputRange: [8, 20, 8],
            extrapolate: 'clamp',
          });

          const dotOpacity = scrollX.interpolate({
            inputRange,
            outputRange: [0.3, 1, 0.3],
            extrapolate: 'clamp',
          });

          return (
            <Animated.View
              key={index}
              style={{
                width: dotWidth,
                height: 8,
                borderRadius: 4,
                backgroundColor: theme.colors.primary,
                marginHorizontal: 4,
                opacity: dotOpacity,
              }}
            />
          );
        })}
      </View>
    );
  }, [scrollX, theme.colors.primary]);

  const onScroll = useCallback(Animated.event(
    [{ nativeEvent: { contentOffset: { x: scrollX } } }],
    { useNativeDriver: false }
  ), []);

  const onMomentumScrollEnd = useCallback((event) => {
    const newIndex = Math.round(event.nativeEvent.contentOffset.x / (width - 32));
    if (isMounted.current) {
      setCurrentIndex(newIndex);
    }
  }, []);

  if (isLoading) {
    return (
      <View style={{
        flex: 1,
        backgroundColor: theme.colors.background,
        justifyContent: 'center',
        alignItems: 'center'
      }}>
        <View style={{
          width: 60,
          height: 60,
          borderRadius: 30,
          backgroundColor: theme.colors.primary + '20',
          justifyContent: 'center',
          alignItems: 'center',
          marginBottom: 16
        }}>
          <Text style={{
            fontSize: 24,
            fontWeight: 'bold',
            color: theme.colors.primary
          }}>♻️</Text>
        </View>
        <Text style={{
          fontSize: 16,
          color: theme.colors.text.primary,
          marginTop: 8
        }}>
          Loading...
        </Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <StatusBar style={theme.isDark ? "light" : "dark"} />

      {/* Header */}
      <View
        style={{
          backgroundColor: theme.colors.primary,
          paddingTop: insets.top + 24,
          paddingHorizontal: 24,
          paddingBottom: 24,
          borderBottomLeftRadius: 24,
          borderBottomRightRadius: 24,
        }}
      >
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <View>
            <Text
              style={{
                fontSize: 16,
                color: "rgba(255, 255, 255, 0.9)",
                marginBottom: 4,
              }}
            >
              Hello, {userName || "User"}! 👋
            </Text>
            <Text
              style={{
                fontSize: 28,
                fontWeight: "bold",
                color: "white",
              }}
            >
              What are you selling?
            </Text>
          </View>
          <TouchableOpacity
            onPress={() => router.push("/(tabs)/orders")}
            style={{
              backgroundColor: 'rgba(255,255,255,0.2)',
              paddingHorizontal: 12,
              paddingVertical: 8,
              borderRadius: 20,
              flexDirection: 'row',
              alignItems: 'center',
            }}
          >
            <Text style={{ color: 'white', marginRight: 4, fontSize: 12 }}>Orders</Text>
            <ChevronRight size={14} color="white" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{
          paddingBottom: insets.bottom + 100,
        }}
        showsVerticalScrollIndicator={false}
      >
        {/* Carousel Section */}
        <View style={{ marginTop: 24 }}>
          <FlatList
            ref={flatListRef}
            data={carouselImages}
            renderItem={renderCarouselItem}
            keyExtractor={(item) => item.id}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onScroll={onScroll}
            onMomentumScrollEnd={onMomentumScrollEnd}
            contentContainerStyle={{ paddingHorizontal: 24 }}
            snapToInterval={width - 32}
            decelerationRate="fast"
          />
          {renderPagination()}
        </View>

        {/* Stats Section */}
        <View style={{ paddingHorizontal: 24, marginTop: 24 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            {stats.map((stat) => {
              const Icon = stat.icon;
              return (
                <View
                  key={stat.id}
                  style={{
                    flex: 1,
                    backgroundColor: theme.colors.card.background,
                    borderRadius: 12,
                    padding: 16,
                    marginHorizontal: 4,
                    alignItems: 'center',
                    borderWidth: 1,
                    borderColor: theme.colors.border,
                  }}
                >
                  <Icon size={20} color={stat.color} style={{ marginBottom: 8 }} />
                  <Text style={{ fontSize: 20, fontWeight: 'bold', color: theme.colors.text.primary, marginBottom: 4 }}>
                    {stat.value}
                  </Text>
                  <Text style={{ fontSize: 12, color: theme.colors.text.secondary }}>
                    {stat.label}
                  </Text>
                </View>
              );
            })}
          </View>
        </View>

        {/* Categories Section */}
        <View style={{ paddingHorizontal: 24, marginTop: 32 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <Text
              style={{
                fontSize: 18,
                fontWeight: "bold",
                color: theme.colors.text.primary,
              }}
            >
              Select Categories
            </Text>
            <Text
              style={{
                fontSize: 14,
                fontWeight: "600",
                color: theme.colors.primary,
              }}
            >
              {selectedCategories.length} selected
            </Text>
          </View>

          {/* Category Grid */}
          <View
            style={{
              flexDirection: "row",
              flexWrap: "wrap",
              gap: 12,
            }}
          >
            {categories.map((category) => {
              const Icon = category.icon;
              const isSelected = selectedCategories.some(
                (item) => Object.keys(item)[0] === String(category.id)
              );
              return (
                <TouchableOpacity
                  key={category.id}
                  onPress={() => toggleCategory({ [category.id]: category.name })}
                  style={{
                    width: "48%",
                    borderRadius: 16,
                    overflow: 'hidden',
                    marginBottom: 12,
                    backgroundColor: isSelected
                      ? theme.colors.primary
                      : theme.colors.card.background,
                    borderWidth: isSelected ? 0 : 1,
                    borderColor: theme.colors.border,
                    elevation: 3,
                    shadowColor: "#000",
                    shadowOffset: {
                      width: 0,
                      height: 2,
                    },
                    shadowOpacity: 0.1,
                    shadowRadius: 3.84,
                  }}
                >
                  {/* Category Image */}
                  <Image
                    source={{ uri: category.image }}
                    style={{
                      width: '100%',
                      height: 100,
                      backgroundColor: category.color + '20',
                    }}
                    resizeMode="cover"
                  />

                  {/* Category Content */}
                  <View style={{ padding: 12 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                      <View
                        style={{
                          width: 36,
                          height: 36,
                          borderRadius: 18,
                          backgroundColor: isSelected
                            ? "rgba(255, 255, 255, 0.2)"
                            : category.color + "20",
                          justifyContent: "center",
                          alignItems: "center",
                          marginRight: 8,
                        }}
                      >
                        <Icon
                          size={20}
                          color={isSelected ? "white" : category.color}
                        />
                      </View>
                      <Text
                        style={{
                          fontSize: 16,
                          fontWeight: "600",
                          color: isSelected ? "white" : theme.colors.text.primary,
                          flex: 1,
                        }}
                      >
                        {category.name}
                      </Text>
                    </View>

                    <Text
                      style={{
                        fontSize: 12,
                        color: isSelected ? "rgba(255,255,255,0.8)" : theme.colors.text.secondary,
                        lineHeight: 16,
                      }}
                    >
                      {category.description}
                    </Text>

                    {isSelected && (
                      <View style={{
                        position: 'absolute',
                        top: 8,
                        right: 8,
                        width: 24,
                        height: 24,
                        borderRadius: 12,
                        backgroundColor: 'white',
                        justifyContent: 'center',
                        alignItems: 'center'
                      }}>
                        <Text style={{ fontSize: 12, fontWeight: 'bold', color: theme.colors.primary }}>✓</Text>
                      </View>
                    )}
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Why Choose Us Section */}
        <View style={{ paddingHorizontal: 24, marginTop: 32, marginBottom: 24 }}>
          <Text
            style={{
              fontSize: 18,
              fontWeight: "bold",
              color: theme.colors.text.primary,
              marginBottom: 16,
            }}
          >
            Why Choose ScrapHub?
          </Text>

          <View style={{ gap: 12 }}>
            <View style={{
              flexDirection: 'row',
              alignItems: 'center',
              backgroundColor: theme.colors.card.background,
              padding: 16,
              borderRadius: 12,
              borderWidth: 1,
              borderColor: theme.colors.border
            }}>
              <View style={{
                width: 40,
                height: 40,
                borderRadius: 20,
                backgroundColor: theme.colors.primary + '20',
                justifyContent: 'center',
                alignItems: 'center',
                marginRight: 12
              }}>
                <Text style={{ fontSize: 16, fontWeight: 'bold', color: theme.colors.primary }}>1</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 14, fontWeight: '600', color: theme.colors.text.primary, marginBottom: 4 }}>
                  Select Categories
                </Text>
                <Text style={{ fontSize: 12, color: theme.colors.text.secondary }}>
                  Choose what you want to sell
                </Text>
              </View>
            </View>

            <View style={{
              flexDirection: 'row',
              alignItems: 'center',
              backgroundColor: theme.colors.card.background,
              padding: 16,
              borderRadius: 12,
              borderWidth: 1,
              borderColor: theme.colors.border
            }}>
              <View style={{
                width: 40,
                height: 40,
                borderRadius: 20,
                backgroundColor: theme.colors.primary + '20',
                justifyContent: 'center',
                alignItems: 'center',
                marginRight: 12
              }}>
                <Text style={{ fontSize: 16, fontWeight: 'bold', color: theme.colors.primary }}>2</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 14, fontWeight: '600', color: theme.colors.text.primary, marginBottom: 4 }}>
                  Upload Photos
                </Text>
                <Text style={{ fontSize: 12, color: theme.colors.text.secondary }}>
                  Add photos of your items
                </Text>
              </View>
            </View>

            <View style={{
              flexDirection: 'row',
              alignItems: 'center',
              backgroundColor: theme.colors.card.background,
              padding: 16,
              borderRadius: 12,
              borderWidth: 1,
              borderColor: theme.colors.border
            }}>
              <View style={{
                width: 40,
                height: 40,
                borderRadius: 20,
                backgroundColor: theme.colors.primary + '20',
                justifyContent: 'center',
                alignItems: 'center',
                marginRight: 12
              }}>
                <Text style={{ fontSize: 16, fontWeight: 'bold', color: theme.colors.primary }}>3</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 14, fontWeight: '600', color: theme.colors.text.primary, marginBottom: 4 }}>
                  Schedule Pickup
                </Text>
                <Text style={{ fontSize: 12, color: theme.colors.text.secondary }}>
                  Get instant cash on pickup
                </Text>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Continue Button */}
      {selectedCategories.length > 0 && (
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
            elevation: 10,
            shadowColor: "#000",
            shadowOffset: {
              width: 0,
              height: -3,
            },
            shadowOpacity: 0.1,
            shadowRadius: 4,
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
              elevation: 3,
              shadowColor: "#000",
              shadowOffset: {
                width: 0,
                height: 2,
              },
              shadowOpacity: 0.25,
              shadowRadius: 3.84,
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
              Continue with {selectedCategories.length} {selectedCategories.length === 1 ? 'Category' : 'Categories'}
            </Text>
            <ArrowRight size={20} color="white" />
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}