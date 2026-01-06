import React, {
  useState,
  useCallback,
  useEffect,
  useRef,
} from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Modal,
  Image,
  Animated,
  Dimensions,
  Platform,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { router, useFocusEffect } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  Package,
  Clock,
  CheckCircle,
  XCircle,
  ChevronRight,
  MapPin,
  Calendar,
  Clock as TimeIcon,
  X,
  AlertTriangle,
  Truck,
  DollarSign,
  Scale,
  Image as ImageIcon,
} from "lucide-react-native";
import { useTheme } from "@/utils/theme";
import ApiService from "../../utils/ApiService";
import AsyncStorage from "@react-native-async-storage/async-storage";

const { width } = Dimensions.get('window');

/* ---------------- STATUS CONFIG ---------------- */

const statusConfig = {
  pending: {
    label: "Pending",
    color: "#FFB020",
    icon: Clock,
    bgColor: "#FFB02020",
    description: "Waiting for confirmation"
  },
  accepted: {
    label: "Accepted",
    color: "#1485FF",
    icon: Package,
    bgColor: "#1485FF20",
    description: "Pickup request accepted"
  },
  scheduled: {
    label: "Scheduled",
    color: "#1485FF",
    icon: Calendar,
    bgColor: "#1485FF20",
    description: "Pickup scheduled"
  },
  collected: {
    label: "Collected",
    color: "#1AB85F",
    icon: CheckCircle,
    bgColor: "#1AB85F20",
    description: "Items collected"
  },
  cancelled: {
    label: "Cancelled",
    color: "#EF4444",
    icon: XCircle,
    bgColor: "#EF444420",
    description: "Request cancelled"
  },
};

/* ---------------- SKELETON LOADER ---------------- */

const SkeletonCard = ({ theme }) => (
  <View
    style={{
      height: 120,
      backgroundColor: theme.colors.surface,
      borderRadius: 16,
      marginBottom: 16,
      padding: 16,
      borderWidth: 1,
      borderColor: theme.colors.border,
      opacity: 0.7,
    }}
  >
    <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
      <View>
        <View style={{
          width: 120,
          height: 16,
          backgroundColor: theme.colors.border,
          borderRadius: 4,
          marginBottom: 8
        }} />
        <View style={{
          width: 80,
          height: 12,
          backgroundColor: theme.colors.border,
          borderRadius: 4
        }} />
      </View>
      <View style={{
        width: 70,
        height: 28,
        backgroundColor: theme.colors.border,
        borderRadius: 14
      }} />
    </View>
    <View style={{
      width: '60%',
      height: 12,
      backgroundColor: theme.colors.border,
      borderRadius: 4,
      marginTop: 16
    }} />
  </View>
);

/* ---------------- MAIN COMPONENT ---------------- */

export default function Orders() {
  const insets = useSafeAreaInsets();
  const theme = useTheme();

  const [orders, setOrders] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [userToken, setUserToken] = useState("");

  /* ---------------- ANIMATIONS ---------------- */

  const pulse = useRef(new Animated.Value(1)).current;
  const modalScale = useRef(new Animated.Value(0.9)).current;
  const modalOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1.05,
          duration: 700,
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 1,
          duration: 700,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  const animateModalIn = () => {
    modalScale.setValue(0.9);
    modalOpacity.setValue(0);

    Animated.parallel([
      Animated.timing(modalOpacity, {
        toValue: 1,
        duration: 250,
        useNativeDriver: true,
      }),
      Animated.spring(modalScale, {
        toValue: 1,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const animateModalOut = () => {
    Animated.parallel([
      Animated.timing(modalOpacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(modalScale, {
        toValue: 0.9,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setSelectedOrder(null);
    });
  };

  /* ---------------- API ---------------- */

  const fetchOrders = async (pageNumber = 1, append = false) => {
    try {
      if (!append) setLoading(true);
      const token = await AsyncStorage.getItem("Token");

      const res = await ApiService.get(
        `/scrap/requests?page=${pageNumber}&limit=10`,
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );
      if (res.success) {
        setOrders((prev) =>
          append ? [...prev, ...res.data.requests] : res.data.requests
        );
        setPage(pageNumber);
        setTotalPages(res.data.pagination.totalPages);
      }
    } catch (err) {
      console.error("Orders API Error:", err);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchOrders();
    }, [])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchOrders(1);
    setRefreshing(false);
  };

  const loadMore = () => {
    if (page < totalPages && !loadingMore) {
      setLoadingMore(true);
      fetchOrders(page + 1, true).finally(() =>
        setLoadingMore(false)
      );
    }
  };

  const formatDate = (date) =>
    new Date(date).toLocaleString("en-US", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

  const formatDateShort = (date) =>
    new Date(date).toLocaleDateString("en-US", {
      day: "numeric",
      month: "short",
    });

  /* ---------------- CANCEL ORDER ---------------- */

  const cancelOrder = async (id) => {
    const token = await AsyncStorage.getItem("Token");

    try {
      const res = await ApiService.put(
        `scrap/requests/${id}/cancel`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      animateModalOut();
      fetchOrders(1);
    } catch (err) {
      console.error("Cancel error:", err);
    }
  };

  /* ---------------- RENDER ORDER CARD ---------------- */

  const renderOrderCard = (order) => {
    const status = statusConfig[order.status] || statusConfig.pending;
    const StatusIcon = status.icon;

    return (
      <TouchableOpacity
        key={order.id}
        onPress={() => {
          setSelectedOrder(order);
          animateModalIn();
        }}
        style={{
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
        }}
      >
        {/* Header Section */}
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" }}>
          <View style={{ flex: 1 }}>
            <Text style={{
              fontSize: 16,
              fontWeight: "700",
              color: theme.colors.text.primary,
              marginBottom: 4
            }}>
              {order.request_number}
            </Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
              <Calendar size={12} color={theme.colors.text.secondary} />
              <Text style={{
                fontSize: 12,
                color: theme.colors.text.secondary,
                marginLeft: 6
              }}>
                {formatDateShort(order.createdAt)}
              </Text>
            </View>
          </View>

          <Animated.View
            style={{
              transform: order.status === "pending" ? [{ scale: pulse }] : [],
              flexDirection: "row",
              alignItems: "center",
              backgroundColor: status.bgColor,
              paddingHorizontal: 12,
              paddingVertical: 6,
              borderRadius: 16,
              borderWidth: 1,
              borderColor: status.color + '30',
            }}
          >
            <StatusIcon size={14} color={status.color} />
            <Text style={{
              color: status.color,
              marginLeft: 6,
              fontSize: 12,
              fontWeight: '600',
            }}>
              {status.label}
            </Text>
          </Animated.View>
        </View>

        {/* Address Section */}
        <View style={{
          flexDirection: 'row',
          alignItems: 'flex-start',
          marginTop: 16,
          backgroundColor: `${theme.colors.primary}08`,
          borderRadius: 12,
          padding: 12,
          borderWidth: 1,
          borderColor: `${theme.colors.primary}15`,
        }}>
          <MapPin size={14} color={theme.colors.primary} style={{ marginTop: 2, marginRight: 10 }} />
          <View style={{ flex: 1 }}>
            <Text style={{
              fontSize: 13,
              color: theme.colors.text.primary,
              lineHeight: 18,
            }}>
              {order.UserAddress?.address_line1}
            </Text>
            <Text style={{
              fontSize: 12,
              color: theme.colors.text.secondary,
              marginTop: 2,
            }}>
              {order.UserAddress?.city} • {order.UserAddress?.pincode}
            </Text>
          </View>
        </View>

        {/* Footer Section */}
        <View style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginTop: 16,
          paddingTop: 16,
          borderTopWidth: 1,
          borderTopColor: theme.colors.border + '40',
        }}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <View style={{
              width: 6,
              height: 6,
              borderRadius: 3,
              backgroundColor: status.color,
              marginRight: 8
            }} />
            <Text style={{
              fontSize: 12,
              color: theme.colors.text.secondary,
            }}>
              {status.description}
            </Text>
          </View>

          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Text style={{
              fontSize: 12,
              color: theme.colors.text.secondary,
              marginRight: 6,
            }}>
              View Details
            </Text>
            <ChevronRight size={16} color={theme.colors.text.secondary} />
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  /* ---------------- UI ---------------- */

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <StatusBar style={theme.isDark ? "light" : "dark"} />

      {/* HEADER */}
      <View style={{
        backgroundColor: theme.colors.primary,
        paddingTop: insets.top + 20,
        paddingHorizontal: 20,
        paddingBottom: 24,
        borderBottomLeftRadius: 24,
        borderBottomRightRadius: 24,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 12,
        elevation: 8,
      }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <View>
            <Text style={{
              fontSize: 28,
              fontWeight: "800",
              color: "white",
              letterSpacing: -0.5,
            }}>
              My Orders
            </Text>
            <Text style={{
              fontSize: 14,
              color: "rgba(255,255,255,0.9)",
              marginTop: 6,
              fontWeight: '500',
            }}>
              {orders.length} pickup request{orders.length !== 1 ? "s" : ""}
            </Text>
          </View>

          <TouchableOpacity
            onPress={() => router.push("/(tabs)/home")}
            style={{
              width: 44,
              height: 44,
              borderRadius: 22,
              backgroundColor: 'rgba(255,255,255,0.2)',
              justifyContent: 'center',
              alignItems: 'center',
            }}
          >
            <Text style={{ color: 'white', fontSize: 20, fontWeight: 'bold' }}>+</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* ORDERS LIST */}
      <ScrollView
        contentContainerStyle={{
          padding: 20,
          paddingBottom: insets.bottom + 20,
        }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={theme.colors.primary}
            colors={[theme.colors.primary]}
          />
        }
        onScroll={({ nativeEvent }) => {
          const { layoutMeasurement, contentOffset, contentSize } = nativeEvent;
          if (layoutMeasurement.height + contentOffset.y >= contentSize.height - 50) {
            loadMore();
          }
        }}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}
      >
        {loading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <SkeletonCard key={i} theme={theme} />
          ))
        ) : orders.length > 0 ? (
          <>
            {orders.map(renderOrderCard)}

            {loadingMore && (
              <View style={{ alignItems: 'center', marginTop: 16 }}>
                <Text style={{
                  fontSize: 14,
                  color: theme.colors.text.secondary
                }}>
                  Loading more orders...
                </Text>
              </View>
            )}

            {page >= totalPages && orders.length > 5 && (
              <View style={{
                alignItems: 'center',
                marginTop: 24,
                paddingTop: 24,
                borderTopWidth: 1,
                borderTopColor: theme.colors.border,
              }}>
                <Text style={{
                  fontSize: 14,
                  color: theme.colors.text.secondary
                }}>
                  You've reached the end of your orders
                </Text>
              </View>
            )}
          </>
        ) : (
          <View style={{
            alignItems: 'center',
            justifyContent: 'center',
            paddingVertical: 60,
          }}>
            <View style={{
              width: 80,
              height: 80,
              borderRadius: 40,
              backgroundColor: `${theme.colors.primary}20`,
              justifyContent: 'center',
              alignItems: 'center',
              marginBottom: 20,
            }}>
              <Package size={36} color={theme.colors.primary} />
            </View>
            <Text style={{
              fontSize: 18,
              fontWeight: '600',
              color: theme.colors.text.primary,
              marginBottom: 8,
            }}>
              No Orders Yet
            </Text>
            <Text style={{
              fontSize: 14,
              color: theme.colors.text.secondary,
              textAlign: 'center',
              marginBottom: 24,
            }}>
              Schedule your first scrap pickup to see orders here
            </Text>
            <TouchableOpacity
              onPress={() => router.push("/(tabs)/home")}
              style={{
                backgroundColor: theme.colors.primary,
                paddingHorizontal: 24,
                paddingVertical: 14,
                borderRadius: 12,
                flexDirection: 'row',
                alignItems: 'center',
              }}
            >
              <Text style={{
                color: 'white',
                fontWeight: '600',
                fontSize: 15,
                marginRight: 8,
              }}>
                Schedule Pickup
              </Text>
              <ChevronRight size={18} color="white" />
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      {/* ---------------- ORDER DETAILS MODAL ---------------- */}

      <Modal visible={!!selectedOrder} transparent animationType="none">
        <Animated.View
          style={{
            flex: 1,
            backgroundColor: "rgba(0,0,0,0.7)",
            justifyContent: "center",
            alignItems: "center",
            padding: 20,
            opacity: modalOpacity,
          }}
        >
          <Animated.View
            style={{
              backgroundColor: theme.colors.surface,
              borderRadius: 24,
              padding: 0,
              width: "100%",
              maxWidth: 500,
              maxHeight: "90%",
              transform: [{ scale: modalScale }],
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 10 },
              shadowOpacity: 0.3,
              shadowRadius: 20,
              elevation: 20,
              overflow: 'hidden',
            }}
          >
            {/* Modal Header */}
            <View style={{
              backgroundColor: theme.colors.primary,
              padding: 24,
              paddingTop: 24,
            }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <View style={{ flex: 1 }}>
                  <Text style={{
                    fontSize: 22,
                    fontWeight: "700",
                    color: "white",
                    marginBottom: 4,
                  }}>
                    {selectedOrder?.request_number}
                  </Text>
                  <Text style={{
                    fontSize: 13,
                    color: "rgba(255,255,255,0.9)",
                  }}>
                    Created on {selectedOrder && formatDate(selectedOrder.createdAt)}
                  </Text>
                </View>
                <TouchableOpacity
                  onPress={animateModalOut}
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 20,
                    backgroundColor: 'rgba(255,255,255,0.2)',
                    justifyContent: 'center',
                    alignItems: 'center',
                    marginLeft: 12,
                  }}
                >
                  <X size={20} color="white" />
                </TouchableOpacity>
              </View>

              {/* Status Badge */}
              {selectedOrder && (
                <View style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  backgroundColor: 'rgba(255,255,255,0.2)',
                  alignSelf: 'flex-start',
                  paddingHorizontal: 16,
                  paddingVertical: 8,
                  borderRadius: 20,
                  marginTop: 16,
                }}>
                  {(() => {
                    const status = statusConfig[selectedOrder.status] || statusConfig.pending;
                    const StatusIcon = status.icon;
                    return (
                      <>
                        <StatusIcon size={16} color="white" />
                        <Text style={{
                          color: "white",
                          marginLeft: 8,
                          fontSize: 14,
                          fontWeight: '600',
                        }}>
                          {status.label}
                        </Text>
                      </>
                    );
                  })()}
                </View>
              )}
            </View>

            <ScrollView
              style={{ maxHeight: 500 }}
              showsVerticalScrollIndicator={false}
            >
              <View style={{ padding: 24 }}>
                {/* Pickup Details */}
                <View style={{ marginBottom: 32 }}>
                  <Text style={{
                    fontSize: 18,
                    fontWeight: "600",
                    color: theme.colors.text.primary,
                    marginBottom: 16,
                  }}>
                    Pickup Details
                  </Text>

                  <View style={{ flexDirection: 'row', gap: 16 }}>
                    <View style={{
                      flex: 1,
                      backgroundColor: `${theme.colors.primary}10`,
                      borderRadius: 12,
                      padding: 16,
                      borderWidth: 1,
                      borderColor: `${theme.colors.primary}20`,
                    }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                        <Calendar size={16} color={theme.colors.primary} />
                        <Text style={{
                          fontSize: 13,
                          fontWeight: '600',
                          color: theme.colors.text.primary,
                          marginLeft: 8,
                        }}>
                          Pickup Date
                        </Text>
                      </View>
                      <Text style={{
                        fontSize: 15,
                        color: theme.colors.text.primary,
                        fontWeight: '500',
                      }}>
                        {selectedOrder?.pickup_date || 'Not scheduled yet'}
                      </Text>
                    </View>

                    <View style={{
                      flex: 1,
                      backgroundColor: `${theme.colors.primary}10`,
                      borderRadius: 12,
                      padding: 16,
                      borderWidth: 1,
                      borderColor: `${theme.colors.primary}20`,
                    }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                        <TimeIcon size={16} color={theme.colors.primary} />
                        <Text style={{
                          fontSize: 13,
                          fontWeight: '600',
                          color: theme.colors.text.primary,
                          marginLeft: 8,
                        }}>
                          Time Slot
                        </Text>
                      </View>
                      <Text style={{
                        fontSize: 15,
                        color: theme.colors.text.primary,
                        fontWeight: '500',
                      }}>
                        {selectedOrder?.pickup_time_slot || 'Not assigned'}
                      </Text>
                    </View>
                  </View>
                </View>

                {/* Address Section */}
                <View style={{ marginBottom: 32 }}>
                  <Text style={{
                    fontSize: 18,
                    fontWeight: "600",
                    color: theme.colors.text.primary,
                    marginBottom: 16,
                  }}>
                    Pickup Address
                  </Text>

                  <View style={{
                    backgroundColor: `${theme.colors.primary}08`,
                    borderRadius: 16,
                    padding: 20,
                    borderWidth: 1,
                    borderColor: `${theme.colors.primary}15`,
                  }}>
                    <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
                      <MapPin size={20} color={theme.colors.primary} style={{ marginRight: 12, marginTop: 2 }} />
                      <View style={{ flex: 1 }}>
                        <Text style={{
                          fontSize: 15,
                          fontWeight: "600",
                          color: theme.colors.text.primary,
                          marginBottom: 4,
                          lineHeight: 22,
                        }}>
                          {selectedOrder?.UserAddress?.address_line1}
                        </Text>

                        {selectedOrder?.UserAddress?.address_line2 && (
                          <Text style={{
                            fontSize: 14,
                            color: theme.colors.text.secondary,
                            marginBottom: 4,
                            lineHeight: 20,
                          }}>
                            {selectedOrder.UserAddress.address_line2}
                          </Text>
                        )}

                        <Text style={{
                          fontSize: 14,
                          color: theme.colors.text.secondary,
                          marginBottom: 4,
                          lineHeight: 20,
                        }}>
                          {selectedOrder?.UserAddress?.city} - {selectedOrder?.UserAddress?.pincode}
                        </Text>

                        {selectedOrder?.UserAddress?.landmark && (
                          <Text style={{
                            fontSize: 14,
                            color: theme.colors.text.secondary,
                            marginBottom: 4,
                            lineHeight: 20,
                          }}>
                            <Text style={{ fontWeight: '500' }}>Landmark:</Text> {selectedOrder.UserAddress.landmark}
                          </Text>
                        )}

                        <Text style={{
                          fontSize: 14,
                          color: theme.colors.text.secondary,
                          lineHeight: 20,
                        }}>
                          {selectedOrder?.UserAddress?.state}, India
                        </Text>
                      </View>
                    </View>
                  </View>
                </View>

                {/* Items Section */}
                <View style={{ marginBottom: 32 }}>
                  <Text style={{
                    fontSize: 18,
                    fontWeight: "600",
                    color: theme.colors.text.primary,
                    marginBottom: 16,
                  }}>
                    Scrap Items ({selectedOrder?.RequestItems?.length || 0})
                  </Text>

                  {selectedOrder?.RequestItems?.map((item) => {
                    const categoryColor =
                      item.Category?.name === 'paper' ? '#FF6B6B' :
                      item.Category?.name === 'plastic' ? '#4ECDC4' :
                      item.Category?.name === 'metal' ? '#95A5A6' :
                      item.Category?.name === 'electronics' ? '#3498DB' :
                      item.Category?.name === 'appliances' ? '#9B59B6' :
                      '#E67E22';

                    return (
                      <View
                        key={item.id}
                        style={{
                          backgroundColor: theme.colors.surface,
                          borderRadius: 16,
                          padding: 20,
                          marginBottom: 16,
                          borderWidth: 1,
                          borderColor: theme.colors.border,
                        }}
                      >
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                          <View style={{ flex: 1 }}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
                              <View style={{
                                width: 12,
                                height: 12,
                                borderRadius: 6,
                                backgroundColor: categoryColor,
                                marginRight: 8
                              }} />
                              <Text style={{
                                fontSize: 16,
                                fontWeight: "600",
                                color: theme.colors.text.primary,
                              }}>
                                {item.Category?.name?.charAt(0).toUpperCase() + item.Category?.name?.slice(1) || 'Item'}
                              </Text>
                            </View>

                            <View style={{ flexDirection: 'row', gap: 16, flexWrap: 'wrap' }}>
                              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                <Scale size={14} color={theme.colors.text.secondary} />
                                <Text style={{
                                  fontSize: 14,
                                  color: theme.colors.text.secondary,
                                  marginLeft: 6,
                                }}>
                                  {item.weight} kg
                                </Text>
                              </View>

                              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                <DollarSign size={14} color={theme.colors.text.secondary} />
                                <Text style={{
                                  fontSize: 14,
                                  color: theme.colors.text.secondary,
                                  marginLeft: 6,
                                }}>
                                  ₹{item.estimated_value}
                                </Text>
                              </View>

                              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                <Package size={14} color={theme.colors.text.secondary} />
                                <Text style={{
                                  fontSize: 14,
                                  color: theme.colors.text.secondary,
                                  marginLeft: 6,
                                }}>
                                  Qty: {item.quantity}
                                </Text>
                              </View>
                            </View>

                            {item.description && (
                              <Text style={{
                                fontSize: 13,
                                color: theme.colors.text.secondary,
                                marginTop: 12,
                                lineHeight: 18,
                              }}>
                                {item.description}
                              </Text>
                            )}
                          </View>
                        </View>

                        {/* Images */}
                        {item.RequestImages?.length > 0 && (
                          <View style={{ marginTop: 16 }}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
                              <ImageIcon size={14} color={theme.colors.text.secondary} />
                              <Text style={{
                                fontSize: 13,
                                fontWeight: '500',
                                color: theme.colors.text.secondary,
                                marginLeft: 8,
                              }}>
                                {item.RequestImages.length} photo{item.RequestImages.length !== 1 ? 's' : ''}
                              </Text>
                            </View>

                            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                              <View style={{ flexDirection: "row", gap: 12 }}>
                                {item.RequestImages.map((img) => (
                                  <Image
                                    key={img.id}
                                    source={{ uri: `https://scrapservice.vmrdaplots.in${img.image_url}` }}
                                    style={{
                                      width: 100,
                                      height: 100,
                                      borderRadius: 8,
                                      borderWidth: 2,
                                      borderColor: `${categoryColor}30`,
                                    }}
                                  />
                                ))}
                              </View>
                            </ScrollView>
                          </View>
                        )}
                      </View>
                    );
                  })}
                </View>

                {/* Action Buttons */}
                {selectedOrder?.status === "pending" && (
                  <View style={{ marginTop: 24 }}>
                    <View style={{
                      flexDirection: 'row',
                      backgroundColor: '#EF444410',
                      borderRadius: 16,
                      padding: 16,
                      marginBottom: 16,
                      borderWidth: 1,
                      borderColor: '#EF444420',
                    }}>
                      <AlertTriangle size={18} color="#EF4444" style={{ marginRight: 12 }} />
                      <View style={{ flex: 1 }}>
                        <Text style={{
                          fontSize: 14,
                          fontWeight: '600',
                          color: theme.colors.text.primary,
                          marginBottom: 4,
                        }}>
                          Cancel Request
                        </Text>
                        <Text style={{
                          fontSize: 13,
                          color: theme.colors.text.secondary,
                          lineHeight: 18,
                        }}>
                          You can cancel this request before it's accepted by our team
                        </Text>
                      </View>
                    </View>

                    <View style={{ flexDirection: 'row', gap: 12 }}>
                      <TouchableOpacity
                        onPress={() => cancelOrder(selectedOrder.id)}
                        style={{
                          flex: 1,
                          backgroundColor: '#EF4444',
                          padding: 18,
                          borderRadius: 14,
                          alignItems: "center",
                          justifyContent: 'center',
                          flexDirection: 'row',
                          shadowColor: '#EF4444',
                          shadowOffset: { width: 0, height: 4 },
                          shadowOpacity: 0.3,
                          shadowRadius: 8,
                          elevation: 4,
                        }}
                      >
                        <XCircle size={20} color="white" style={{ marginRight: 8 }} />
                        <Text style={{
                          fontSize: 16,
                          fontWeight: "600",
                          color: "white",
                        }}>
                          Cancel Order
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                )}
              </View>
            </ScrollView>
          </Animated.View>
        </Animated.View>
      </Modal>
    </View>
  );
}