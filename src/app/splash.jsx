import React, { useEffect, useRef } from "react";
import { View, Text, Image, Animated } from "react-native";
import { StatusBar } from "expo-status-bar";
import { router } from "expo-router";
import { Recycle } from "lucide-react-native";
import { getUserData } from "../utils/storage";
import rrr from "../../assets/images/scraplogo.jpg";

export default function Splash() {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;

  useEffect(() => {
    // Animate logo
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 4,
        useNativeDriver: true,
      }),
    ]).start();

    // Check authentication and navigate
    setTimeout(async () => {
      const userData = await getUserData();
      console.log("rrr:::",userData)
      // if (userData && userData.isLoggedIn && userData.name) {
      //   router.replace("/(tabs)/home");
      // } else if (userData && userData.isLoggedIn) {
      //   router.replace("/profile-setup");
      // } else {
      //   router.replace("/login");
      // }
    }, 2000);
  }, []);

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: "#017B83",
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <StatusBar style="light" />

      <Animated.View
        style={{
          opacity: fadeAnim,
          transform: [{ scale: scaleAnim }],
          alignItems: "center",
        }}
      >
       
          <Image
            source={require("../../assets/images/scraplogo.jpg")}
            style={{
              width: 100,
              height: 100,
              justifyContent: "center",
              alignItems: "center",
              marginBottom: 24,  
              borderRadius: 30,
              backgroundColor: "rgba(255,255,255,0.3)",
            }}
          />


        <Text
          style={{
            fontSize: 32,
            fontWeight: "bold",
            color: "white",
            marginBottom: 8,
          }}
        >
          ScrapExpress
        </Text>

        <Text
          style={{
            fontSize: 16,
            color: "rgba(255, 255, 255, 0.8)",
          }}
        >
          Turn waste into worth
        </Text>
      </Animated.View>
    </View>
  );
}
