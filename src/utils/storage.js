import AsyncStorage from "@react-native-async-storage/async-storage";

// User authentication
export const saveUserData = async (userData) => {
  try {
    await AsyncStorage.setItem("userData", JSON.stringify(userData));
  } catch (error) {
    console.error("Error saving user data:", error);
  }
};

export const getUserData = async () => {
  try {
    const data = await AsyncStorage.getItem("userData");
    return data ? JSON.parse(data) : null;
  } catch (error) {
    console.error("Error getting user data:", error);
    return null;
  }
};

export const clearUserData = async () => {
  try {
    await AsyncStorage.removeItem("userData");
  } catch (error) {
    console.error("Error clearing user data:", error);
  }
};

// Draft request data
export const saveDraftRequest = async (draftData) => {
  try {
    await AsyncStorage.setItem("draftRequest", JSON.stringify(draftData));
  } catch (error) {
    console.error("Error saving draft:", error);
  }
};

export const getDraftRequest = async () => {
  try {
    const data = await AsyncStorage.getItem("draftRequest");
    return data ? JSON.parse(data) : null;
  } catch (error) {
    console.error("Error getting draft:", error);
    return null;
  }
};

export const clearDraftRequest = async () => {
  try {
    await AsyncStorage.removeItem("draftRequest");
  } catch (error) {
    console.error("Error clearing draft:", error);
  }
};

// Theme preference
export const saveThemePreference = async (theme) => {
  try {
    await AsyncStorage.setItem("themePreference", theme);
  } catch (error) {
    console.error("Error saving theme:", error);
  }
};

export const getThemePreference = async () => {
  try {
    return await AsyncStorage.getItem("themePreference");
  } catch (error) {
    console.error("Error getting theme:", error);
    return null;
  }
};
