import { useColorScheme } from "react-native";

export const useTheme = () => {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  const theme = {
    colors: {
      // Background Colors
      background: isDark ? "#121212" : "#F5F6F8",
      surface: isDark ? "#1E1E1E" : "#FFFFFF",
      elevated: isDark ? "#262626" : "#FFFFFF",

      // Text Colors
      text: {
        primary: isDark ? "rgba(255, 255, 255, 0.87)" : "#111111",
        secondary: isDark ? "rgba(255, 255, 255, 0.6)" : "#6A6B6D",
        tertiary: isDark ? "rgba(255, 255, 255, 0.38)" : "#929497",
        disabled: isDark ? "rgba(255, 255, 255, 0.38)" : "#9DA4B0",
      },

      // Brand Colors - Using #017B83
      primary: "#017B83",
      primaryDark: "#015D63",
      primaryLight: "#02A0AA",

      // Status Colors
      success: isDark ? "#22C75A" : "#1AB85F",
      warning: isDark ? "#FFB020" : "#F59E0B",
      error: isDark ? "#FF453A" : "#EF4444",
      info: isDark ? "#32D0FA" : "#1485FF",

      // Border & Divider Colors
      border: isDark ? "rgba(255, 255, 255, 0.12)" : "#E7E9EC",
      divider: isDark ? "rgba(255, 255, 255, 0.08)" : "#F0F1F3",

      // Tab Bar Colors
      tabBar: {
        background: isDark ? "#1E1E1E" : "#FFFFFF",
        border: isDark ? "rgba(255, 255, 255, 0.12)" : "#E7E9EC",
        active: "#017B83",
        inactive: isDark ? "rgba(255, 255, 255, 0.6)" : "#9DA4B0",
      },

      // Special Colors
      overlay: isDark ? "rgba(0, 0, 0, 0.6)" : "rgba(0, 0, 0, 0.4)",
      shadow: isDark ? "rgba(0, 0, 0, 0.8)" : "rgba(0, 0, 0, 0.1)",

      // Card specific colors
      card: {
        background: isDark ? "#1E1E1E" : "#FFFFFF",
        shadow: isDark ? "rgba(255, 255, 255, 0.05)" : "rgba(0, 0, 0, 0.1)",
      },

      // Input colors
      input: {
        background: isDark ? "rgba(255, 255, 255, 0.05)" : "#F5F6F8",
        border: isDark ? "rgba(255, 255, 255, 0.12)" : "#E6E7E9",
        placeholder: isDark ? "rgba(255, 255, 255, 0.6)" : "#9DA4B0",
      },
    },
    isDark,
  };

  return theme;
};

export default useTheme;
