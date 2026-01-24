import { Platform, ToastAndroid, Alert } from "react-native";

const showToast = (message) => {
  if (Platform.OS === "android") {
    ToastAndroid.show(message, ToastAndroid.BOTTOM);
  } else {
    Alert.alert("", message);
  }
};

export default showToast;
