import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { router, useFocusEffect } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  Package,
  Clock,
  CheckCircle,
  XCircle,
  Plus,
} from "lucide-react-native";
import { useTheme } from "@/utils/theme";

const categoryNames = {
  paper: "Paper",
  plastic: "Plastic",
  metal: "Metal",
  electronics: "Electronics",
  appliances: "Appliances",
  other: "Other",
};

const statusConfig = {
  pending: { label: "Pending", color: "#FFB020", icon: Clock },
  processing: { label: "Processing", color: "#1485FF", icon: Package },
  completed: { label: "Completed", color: "#1AB85F", icon: CheckCircle },
  cancelled: { label: "Cancelled", color: "#EF4444", icon: XCircle },
};

export default function Orders() {
  const insets = useSafeAreaInsets();
  const theme = useTheme();
  const [orders, setOrders] = useState([]);
  const [refreshing, setRefreshing] = useState(false);

  useFocusEffect(
    React.useCallback(() => {
      loadOrders();
    }, []),
  );

  const loadOrders = async () => {
    try {
      const ordersData = await AsyncStorage.getItem("orders");
      if (ordersData) {
        setOrders(JSON.parse(ordersData));
      }
    } catch (error) {
      console.error("Error loading orders:", error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadOrders();
    setRefreshing(false);
  };

  const formatDate = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString("en-US", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
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
          paddingBottom: 24,
          borderBottomLeftRadius: 24,
          borderBottomRightRadius: 24,
        }}
      >
        <Text
          style={{
            fontSize: 28,
            fontWeight: "bold",
            color: "white",
          }}
        >
          My Orders
        </Text>
        <Text
          style={{
            fontSize: 16,
            color: "rgba(255, 255, 255, 0.9)",
            marginTop: 8,
          }}
        >
          {orders.length} pickup request{orders.length !== 1 ? "s" : ""}
        </Text>
      </View>

      {orders.length === 0 ? (
        <View
          style={{
            flex: 1,
            justifyContent: "center",
            alignItems: "center",
            paddingHorizontal: 32,
          }}
        >
          <View
            style={{
              width: 80,
              height: 80,
              borderRadius: 40,
              backgroundColor: theme.colors.primary + "20",
              justifyContent: "center",
              alignItems: "center",
              marginBottom: 24,
            }}
          >
            <Package size={36} color={theme.colors.primary} />
          </View>
          <Text
            style={{
              fontSize: 20,
              fontWeight: "bold",
              color: theme.colors.text.primary,
              marginBottom: 8,
            }}
          >
            No Orders Yet
          </Text>
          <Text
            style={{
              fontSize: 14,
              color: theme.colors.text.secondary,
              textAlign: "center",
              marginBottom: 32,
            }}
          >
            Create your first scrap pickup request to get started
          </Text>
          <TouchableOpacity
            onPress={() => router.push("/(tabs)/home")}
            style={{
              backgroundColor: theme.colors.primary,
              height: 48,
              paddingHorizontal: 24,
              borderRadius: 24,
              flexDirection: "row",
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <Plus size={20} color="white" style={{ marginRight: 8 }} />
            <Text
              style={{
                fontSize: 16,
                fontWeight: "600",
                color: "white",
              }}
            >
              New Request
            </Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{
            paddingTop: 24,
            paddingHorizontal: 24,
            paddingBottom: insets.bottom + 24,
          }}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        >
          {orders.map((order) => {
            const status = statusConfig[order.status] || statusConfig.pending;
            const StatusIcon = status.icon;

            return (
              <View
                key={order.id}
                style={{
                  backgroundColor: theme.colors.card.background,
                  borderRadius: 12,
                  padding: 16,
                  marginBottom: 16,
                  borderWidth: 1,
                  borderColor: theme.colors.border,
                }}
              >
                {/* Header */}
                <View
                  style={{
                    flexDirection: "row",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                    marginBottom: 12,
                  }}
                >
                  <View style={{ flex: 1 }}>
                    <Text
                      style={{
                        fontSize: 16,
                        fontWeight: "600",
                        color: theme.colors.text.primary,
                        marginBottom: 4,
                      }}
                    >
                      {order.id}
                    </Text>
                    <Text
                      style={{
                        fontSize: 12,
                        color: theme.colors.text.secondary,
                      }}
                    >
                      {formatDate(order.timestamp)}
                    </Text>
                  </View>
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      backgroundColor: status.color + "20",
                      paddingHorizontal: 10,
                      paddingVertical: 6,
                      borderRadius: 12,
                    }}
                  >
                    <StatusIcon
                      size={14}
                      color={status.color}
                      style={{ marginRight: 4 }}
                    />
                    <Text
                      style={{
                        fontSize: 12,
                        fontWeight: "600",
                        color: status.color,
                      }}
                    >
                      {status.label}
                    </Text>
                  </View>
                </View>

                {/* Categories */}
                <View
                  style={{
                    flexDirection: "row",
                    flexWrap: "wrap",
                    gap: 6,
                    marginBottom: 12,
                  }}
                >
                  {order.categories.map((cat) => (
                    <View
                      key={cat}
                      style={{
                        backgroundColor: theme.colors.input.background,
                        paddingHorizontal: 10,
                        paddingVertical: 4,
                        borderRadius: 12,
                      }}
                    >
                      <Text
                        style={{
                          fontSize: 12,
                          color: theme.colors.text.secondary,
                        }}
                      >
                        {categoryNames[cat]}
                      </Text>
                    </View>
                  ))}
                </View>

                {/* Address */}
                <Text
                  style={{
                    fontSize: 13,
                    color: theme.colors.text.tertiary,
                    lineHeight: 18,
                  }}
                >
                  {order.address?.address}, {order.address?.city}
                </Text>
              </View>
            );
          })}
        </ScrollView>
      )}
    </View>
  );
}
