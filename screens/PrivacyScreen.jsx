import React, {useState} from "react";
import { View, Text, StyleSheet, TouchableOpacity, Switch, Keyboard, TouchableWithoutFeedback  } from "react-native";
import { TextInput } from "react-native";
import { useSelector } from "react-redux";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from '@expo/vector-icons';
import colors from "../colors/colors";
import axios from "axios";
import * as SecureStore from "expo-secure-store";
import { API_URL } from "../constants/config";

export default function PrivacyScreen({ navigation }) {
  const [showForm, setShowForm] = useState(false);
  const [current, setCurrent] = useState("");
  const [newPass, setNewPass] = useState("");
  const [confirm, setConfirm] = useState("");
  const [locationEnabled, setLocationEnabled] = useState(false);
  const [showLocation, setShowLocation] = useState(false);
  const isDark = useSelector((state) => state.theme.isDark);
  const theme = isDark ? colors.dark : colors.light;

  const handleUpdatePassword = async () => {
  try {
    if (!current || !newPass || !confirm) {
      alert("Please fill all fields");
      return;
    }

    if (newPass !== confirm) {
      alert("Passwords do not match");
      return;
    }

    const token = await SecureStore.getItemAsync("userToken");
    console.log("TOKEN FROM STORAGE:", token);

    const response = await axios.post(
      `${API_URL}/auth/change-password`,
      {
        currentPassword: current,
        newPassword: newPass
      },
      {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    );

    alert(response.data.message);

    setCurrent("");
    setNewPass("");
    setConfirm("");

  } catch (error) {
    console.log("CHANGE PASSWORD ERROR:", error?.response?.data || error);
    alert(
      error?.response?.data?.message ||
      "Password change failed"
    );
  }
};
  return (
     <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
  <View style={styles.header}>
  
  {/* Back Button */}
  <TouchableOpacity
    style={[styles.backButton, { backgroundColor: theme.surface }]}
    onPress={() => navigation.goBack()}
  >
    <Ionicons name="arrow-back" size={24} color={theme.text} />
  </TouchableOpacity>

  {/* Title */}
  <Text style={[styles.headerTitle, { color: theme.text }]}>
    Privacy Policy
  </Text>

  {/* Home Button */}
  <TouchableOpacity
    style={[styles.backButton, { backgroundColor: theme.surface }]}
    onPress={() => navigation.navigate('Main', { screen: 'Home' })}
  >
    <Ionicons name="home" size={24} color="#ff4d8d" />
  </TouchableOpacity>

</View>
  
      {/* 🔐 Change Password */}
      <TouchableOpacity style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border, borderWidth: 1 }]} onPress={() => setShowForm(!showForm)}>
        <Text style={[styles.cardText, { color: theme.text }]}>Change Password</Text>
        <Text style={[styles.arrow, { color: theme.textSecondary }]}>
  {showForm ? '⌄' : '>'}
</Text>
      </TouchableOpacity>

      {showForm && (
  <View style={styles.form}>

    <TextInput
      placeholder="Current Password"
      secureTextEntry
      style={{backgroundColor: theme.background,color: theme.text, borderColor: theme.border, borderWidth: 1, padding: 10, borderRadius: 8, marginBottom: 10 }}
      value={current}
      onChangeText={setCurrent}
    />

    <TextInput
      placeholder="New Password"
      secureTextEntry
      style={{backgroundColor: theme.background,color: theme.text, borderColor: theme.border, borderWidth: 1, padding: 10, borderRadius: 8, marginBottom: 10 }}
      value={newPass}
      onChangeText={setNewPass}
    />

    <TextInput
      placeholder="Confirm Password"
      secureTextEntry
      style={{backgroundColor: theme.background,color: theme.text, borderColor: theme.border, borderWidth: 1, padding: 10, borderRadius: 8, marginBottom: 10}}
      value={confirm}
      onChangeText={setConfirm}
    />
    {/* <Text style={styles.sectionTitle}>Location Permission</Text>

<View style={styles.card}>
  <Text style={styles.text}>
    EcoTrace uses your location to accurately record where biodiversity is observed.
  </Text>

  <Text style={styles.text}>
    You can enable or disable location access anytime from your device settings.
  </Text>
</View> */}

    <TouchableOpacity 
      style={styles.button}
      onPress={handleUpdatePassword}
    >
      <Text style={styles.buttonText}>Update Password</Text>
    </TouchableOpacity>

  </View>
)}
<TouchableOpacity 
  style={[styles.card, { backgroundColor: theme.surface }]} 
  onPress={() => setShowLocation(!showLocation)}
>
  <Text style={[styles.cardText, { color: theme.text }]}>Location Permission</Text>
  <Text style={[styles.arrow, { color: theme.textSecondary }]}>
  {showLocation ? '⌄' : '>'}
</Text>
</TouchableOpacity>

{showLocation && (
  <View style={[styles.form, { backgroundColor: theme.surface, borderColor: theme.border, borderWidth: 1, marginBottom: 20, padding: 15, borderRadius: 10 }]}>

    <View style={styles.row}>
      <Text style={[styles.text, { color: theme.text }]}>Enable Location Access</Text>

      <Switch
        value={locationEnabled}
        onValueChange={setLocationEnabled}
        trackColor={{ false: "#ccc", true: "#ff4d8d" }}
        thumbColor="#fff"
      />
    </View>

    <Text style={[styles.subText, { color: theme.textSecondary }]}>
      EcoTrace uses your location to accurately track biodiversity observations.
    </Text>

  </View>
)}

      <Text style={styles.text}>
        We respect your privacy. Your data is safe and never shared with third parties.
      </Text>
    </SafeAreaView>
    </TouchableWithoutFeedback>
  );
}
const styles = StyleSheet.create({
  container: {
    flex: 1,
    // backgroundColor: "#f8f8f8"
  },
  
   card: {
    // backgroundColor: "#fff",
    padding: 15,
    borderRadius: 12,
    marginBottom: 20,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    elevation: 2
  },

  cardText: {
    fontSize: 16,
    fontWeight: "500"
  },

  arrow: {
    fontSize: 18,
    color: "#999"
  },
  
  title: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 10,
      textAlign: "center", 
  },
  text: {
    fontSize: 16,
    color: "#555",
    marginBottom: 10
  },

  form: {
    // backgroundColor: "#fff",
    padding: 15,
    borderRadius: 10,
    marginBottom: 20
  },

  // input: {
  //   backgroundColor: "#f1f1f1",
  //   padding: 10,
  //   borderRadius: 8,
  //   marginBottom: 10
  // },

  button: {
    backgroundColor: "#ff4d8d",
    padding: 12,
    borderRadius: 8,
    alignItems: "center"
  },

  buttonText: {
    color: "#fff",
    fontWeight: "bold"
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginTop: 15
  },

  infoCard: {
    backgroundColor: "#f1f1f1",
    padding: 15,
    borderRadius: 10,
    marginBottom: 20
  },

  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center"
  },

  subText: {
    fontSize: 13,
    color: "#777",
    marginTop: 8
  }, 
header: {
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'space-between',
  paddingHorizontal: 20,
  paddingVertical: 16,
},

backButton: {
  width: 44,
  height: 44,
  borderRadius: 14,
  alignItems: 'center',
  justifyContent: 'center',

  shadowColor: "#000",
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.05,
  shadowRadius: 4,
  elevation: 2,
},

headerTitle: {
  fontSize: 18,
  fontWeight: '700',
},
  
});