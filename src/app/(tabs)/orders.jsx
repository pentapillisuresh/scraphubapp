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
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { router, useFocusEffect } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  Package,
  Clock,
  CheckCircle,
  XCircle,
  Plus,
} from "lucide-react-native";
import { useTheme } from "@/utils/theme";
import ApiService from "../../utils/ApiService";
import AsyncStorage from "@react-native-async-storage/async-storage";

/* ---------------- STATUS CONFIG ---------------- */

const statusConfig = {
  pending: { label: "Pending", color: "#FFB020", icon: Clock },
  accepted: { label: "Accepted", color: "#1485FF", icon: Package },
  scheduled: { label: "Scheduled", color: "#1485FF", icon: Package },
  collected: { label: "Collected", color: "#1AB85F", icon: CheckCircle },
  cancelled: { label: "Cancelled", color: "#EF4444", icon: XCircle },
};

/* ---------------- SKELETON ---------------- */

const SkeletonCard = ({ theme }) => (
  <View
    style={{
      height: 90,
      backgroundColor: theme.colors.border,
      borderRadius: 12,
      marginBottom: 16,
      opacity: 0.35,
    }}
  />
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
  /* ---------------- STATUS ANIMATION ---------------- */

  const pulse = useRef(new Animated.Value(1)).current;

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

  /* ---------------- CANCEL ORDER ---------------- */

  const cancelOrder = async (id) => {
    const token = await AsyncStorage.getItem("Token");
  
    try {
  
      const res = await ApiService.put(
        `scrap/requests/${id}/cancel`,
        {}, // ✅ body (empty)
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
  
      setSelectedOrder(null);
      fetchOrders(1);
    } catch (err) {
      console.error("Cancel error:", err);
    }
  };
  
  /* ---------------- UI ---------------- */

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <StatusBar style={theme.isDark ? "light" : "dark"} />

      {/* HEADER */}
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
        <Text style={{ fontSize: 28, fontWeight: "bold", color: "white" }}>
          My Orders
        </Text>
        <Text style={{ color: "rgba(255,255,255,0.9)", marginTop: 6 }}>
          {orders.length} pickup request{orders.length !== 1 ? "s" : ""}
        </Text>
      </View>

      {/* LIST */}
      <ScrollView
        contentContainerStyle={{
          padding: 24,
          paddingBottom: insets.bottom + 24,
        }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        onScroll={({ nativeEvent }) => {
          const { layoutMeasurement, contentOffset, contentSize } =
            nativeEvent;
          if (
            layoutMeasurement.height + contentOffset.y >=
            contentSize.height - 20
          ) {
            loadMore();
          }
        }}
        scrollEventThrottle={16}
      >
        {loading
          ? Array.from({ length: 5 }).map((_, i) => (
            <SkeletonCard key={i} theme={theme} />
          ))
          : orders.map((order) => {
            const status =
              statusConfig[order.status] || statusConfig.pending;
            const StatusIcon = status.icon;

            return (
              <TouchableOpacity
                key={order.id}
                onPress={() => setSelectedOrder(order)}
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
                  }}
                >
                  <View>
                    <Text style={{ fontWeight: "600", fontSize: 16 }}>
                      {order.request_number}
                    </Text>
                    <Text style={{ fontSize: 12 }}>
                      {formatDate(order.createdAt)}
                    </Text>
                  </View>

                  <Animated.View
                    style={{
                      transform:
                        order.status === "pending"
                          ? [{ scale: pulse }]
                          : [],
                      flexDirection: "row",
                      alignItems: "center",
                      backgroundColor: status.color + "20",
                      padding: 6,
                      borderRadius: 12,
                    }}
                  >
                    <StatusIcon size={14} color={status.color} />
                    <Text
                      style={{
                        color: status.color,
                        marginLeft: 4,
                        fontSize: 12,
                      }}
                    >
                      {status.label}
                    </Text>
                  </Animated.View>
                </View>

                <Text style={{ marginTop: 8, fontSize: 13 }}>
                  {order.UserAddress?.address_line1},{" "}
                  {order.UserAddress?.city}
                </Text>
              </TouchableOpacity>
            );
          })}
      </ScrollView>

      {/* ---------------- DETAILS MODAL ---------------- */}

      <Modal visible={!!selectedOrder} transparent animationType="slide">
        <View
          style={{
            flex: 1,
            backgroundColor: "rgba(0,0,0,0.5)",
            justifyContent: "center",
            padding: 20,
          }}
        >
          <View
            style={{
              backgroundColor: theme.colors.card.background,
              borderRadius: 16,
              padding: 16,
              maxHeight: "90%",
            }}
          >
            <ScrollView>
              <Text style={{ fontSize: 18, fontWeight: "700" }}>
                {selectedOrder?.request_number}
              </Text>

              <Text>Status: {selectedOrder?.status}</Text>
              <Text>
                Pickup: {selectedOrder?.pickup_date} (
                {selectedOrder?.pickup_time_slot})
              </Text>

              <Text style={{ marginTop: 12, fontWeight: "600" }}>
                Items
              </Text>

              {selectedOrder?.RequestItems.map((item) => (
                <View key={item.id} style={{ marginVertical: 8 }}>
                  <Text style={{ fontWeight: "600" }}>
                    {item.Category?.name}
                  </Text>
                  <Text>Weight: {item.weight} kg</Text>
                  <Text>Value: ₹{item.estimated_value}</Text>

                  <ScrollView horizontal>
                    {item.RequestImages.map((img) => (
                      <Image
                        key={img.id}
                        source={{
                          uri: `http://192.168.0.13:5001/${img.image_url}`,
                        }}
                        style={{
                          width: 80,
                          height: 80,
                          borderRadius: 8,
                          marginRight: 8,
                          marginTop: 8,
                        }}
                      />
                    ))}
                  </ScrollView>
                </View>
              ))}
            </ScrollView>

            {selectedOrder?.status === "pending" && (
              <View style={{ flexDirection: "row", gap: 10 }}>
                <TouchableOpacity
                  onPress={() => cancelOrder(selectedOrder.id)}
                  style={{
                    flex: 1,
                    backgroundColor: "#EF4444",
                    padding: 12,
                    borderRadius: 8,
                    alignItems: "center",
                  }}
                >
                  <Text style={{ color: "white" }}>Cancel</Text>
                </TouchableOpacity>

                {/* <TouchableOpacity
                  onPress={() =>
                    router.push(`/reschedule/${selectedOrder.id}`)
                  }
                  style={{
                    flex: 1,
                    backgroundColor: theme.colors.primary,
                    padding: 12,
                    borderRadius: 8,
                    alignItems: "center",
                  }}
                >
                  <Text style={{ color: "white" }}>Reschedule</Text>
                </TouchableOpacity> */}
              </View>
            )}

            <TouchableOpacity
              onPress={() => setSelectedOrder(null)}
              style={{
                marginTop: 12,
                padding: 10,
                alignItems: "center",
              }}
            >
              <Text style={{ color: theme.colors.primary }}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}
