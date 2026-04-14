import React, { useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Video } from "expo-av";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useSelector } from "react-redux";
import colors from "../colors/colors";

export default function TutorialVideo({ navigation, route }) {
  const from = route?.params?.from;
  const isDark = useSelector((state) => state.theme.isDark);
  const theme = isDark ? colors.dark : colors.light;
  const [selectedVideo, setSelectedVideo] = useState(null);

  const videos = [
    {
      title: "User Guide - Create Account",
      source: require("../assets/videos/create-account.mp4"),
    },
    {
      title: "User Guide - Login Process",
      source: require("../assets/videos/login.mp4"),
    },
    {
      title: "User Guide - Dashboard Overview",
      source: require("../assets/videos/dashboard.mp4"),
    },
    {
      title: "User Guide - Add Observation",
      source: require("../assets/videos/add-observation.mp4"),
    },
    {
      title: "User Guide - Setting & Logout",
      source: require("../assets/videos/setting-logout.mp4"),
    },
  ];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      {/* HEADER */}
<View style={styles.header}>

  <TouchableOpacity
    style={[styles.backButton, { backgroundColor: theme.surface }]}
    onPress={() => navigation.goBack()}
    activeOpacity={0.7}
  >
    <Ionicons name="arrow-back" size={24} color={theme.text} />
  </TouchableOpacity>

  <Text style={[styles.headerTitle, { color: theme.text }]}>
    User Guide
  </Text>
  {from !== 'Auth' ? (
    <TouchableOpacity
      style={[styles.rightButton, { backgroundColor: theme.surface }]}
      onPress={() => navigation.navigate('Main', { screen: 'Home' })}
      activeOpacity={0.7}
    >
    <Ionicons name="home" size={24} color={theme.primary} />
  </TouchableOpacity>
  ) : (
    <View style={{ width: 44 }} />
  )}

</View>
<View style={{ padding: 20 }}>
      {videos.map((video, index) => (
        <TouchableOpacity
          key={index}
          style={styles.button}
          onPress={() => setSelectedVideo(video.source)}
        >
          <Text style={styles.buttonText}>{video.title}</Text>
        </TouchableOpacity>
      ))}

      {selectedVideo && (
        <Video
          source={selectedVideo}
          useNativeControls
          resizeMode="contain"
          style={styles.video}
        />
      )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  title: {
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 20,
    textAlign: "center",
  },
  header: {
  flexDirection: "row",
  alignItems: "center",
  justifyContent: "space-between",
  paddingLeft: 20,
  paddingRight: 10,
  paddingVertical: 16,
},

backButton: {
  width: 44,
  height: 44,
  borderRadius: 14,
  alignItems: "center",
  justifyContent: "center",
},

rightButton: {
  width: 44,
  height: 44,
  borderRadius: 14,
  alignItems: "center",
  justifyContent: "center",
},

headerTitle: {
  fontSize: 18,
  fontWeight: "700",
},
  button: {
    backgroundColor: "#ff6b81",
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
  },
  buttonText: {
    color: "#fff",
    textAlign: "center",
    fontSize: 16,
  },
  video: {
    width: "100%",
    height: 250,
    marginTop: 20,
  },
});