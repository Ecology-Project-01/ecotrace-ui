import React, { useState } from "react";
import { Alert } from "react-native";
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from "react-native";
import { useSelector } from "react-redux";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from '@expo/vector-icons';
import colors from "../colors/colors";

export default function HelpScreen({ navigation }) {
  const [activeIndex, setActiveIndex] = useState(null);
  const isDark = useSelector((state) => state.theme.isDark);
  const theme = isDark ? colors.dark : colors.light;

  const toggleFAQ = (index) => {
    setActiveIndex(activeIndex === index ? null : index);
  };

  const handleContact = () => {
    Alert.alert(
      "Contact Support",
      "This is a demo project. Please contact the EcoTrace development team."
    );
  };

  const handleTroubleshoot = () => {
    Alert.alert(
      "Troubleshooting",
      "Try restarting the app, checking internet, or reinstalling."
    );
  };

  const handleLocationHelp = () => {
    Alert.alert(
      "Location Permission",
      "Enable location access from Settings → Privacy & Security to track biodiversity accurately."
    );
  };

  const faqs = [
    {
      question: "Q: What is EcoTrace?",
      answer: "A: EcoTrace helps users track and record biodiversity like plants and species."
    },
    {
      question: "Q:How do I add an observation?",
      answer: "A:Go to Home → Tap 'Add Observation' → Fill details → Save."
    },
    {
      question: "Q: Do I need internet to use the app?",
      answer: "A: Some features work offline, but syncing requires internet."
    },
    {
      question: "Q: Why is location permission required?",
      answer: "A: To track where the species was observed accurately."
    },
    {
      question: "Q: Can I edit or delete my observations?",
      answer: "A: Yes, go to your observation list and select edit/delete."
    },
    {
      question: "Q: How do notifications work?",
      answer: "A: You’ll receive updates and reminders if enabled in settings."
    },
    {
      question: "Q: Is my data secure?",
      answer: "A: Yes, your data is stored securely and not shared without permission."
    },
    {
      question: "Q:What should I do if the app crashes?",
      answer: "A: Restart the app or reinstall. Contact support if the issue continues."
    }
  ];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.header}>
        {/* Back */}
  <TouchableOpacity
    style={[styles.backButton, { backgroundColor: theme.surface }]}
    onPress={() => navigation.goBack()}
    activeOpacity={0.7}
  >
    <Ionicons name="arrow-back" size={24} color={theme.text} />
  </TouchableOpacity>

  {/* Title */}
  <Text style={[styles.headerTitle, { color: theme.text }]}>
    Help & FAQ
  </Text>

  {/* Home */}
  <TouchableOpacity
    style={[styles.rightButton, { backgroundColor: theme.surface }]}
    onPress={() => navigation.navigate('Main', { screen: 'Home' })}
    activeOpacity={0.7}
  >
    <Ionicons name="home" size={24} color={theme.primary} />
  </TouchableOpacity>

</View>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
  

<View style={[styles.mainCard, { backgroundColor: theme.surface }]}> 
     
      <Text style={[styles.sectionTitle, { color: theme.text }]}>Help</Text>

<TouchableOpacity style={[styles.helpItem, { backgroundColor: theme.background }]} onPress={handleContact}>
  <Text style={[styles.helpText, { color: theme.text }]}>Contact Support</Text>
</TouchableOpacity>

<TouchableOpacity style={[styles.helpItem, { backgroundColor: theme.background }]} onPress={() => navigation.navigate("Report")}>
  <Text style={[styles.helpText, { color: theme.text }]}>Report a Problem</Text>
</TouchableOpacity>

<TouchableOpacity style={[styles.helpItem, { backgroundColor: theme.background }]} onPress={() => navigation.navigate("UserGuide", {from:'app'})}>
  <Text style={[styles.helpText, { color: theme.text }]}>User Guide</Text>
</TouchableOpacity>

<TouchableOpacity style={[styles.helpItem, { backgroundColor: theme.background }]} onPress={handleTroubleshoot}>
  <Text style={[styles.helpText, { color: theme.text }]}>App Troubleshooting</Text>
</TouchableOpacity>

<TouchableOpacity style={[styles.helpItem, { backgroundColor: theme.background }]} onPress={handleLocationHelp}>
  <Text style={[styles.helpText, { color: theme.text }]}>Location Permission Help</Text>
</TouchableOpacity>
      <Text style={[styles.sectionTitle, { color: theme.text }]}>Frequently Asked Questions(FAQ)</Text>


      {faqs.map((item, index) => (
        <View key={index}>
          <TouchableOpacity 
  onPress={() => toggleFAQ(index)} 
  style={[styles.questionBox, { backgroundColor: theme.background }]}
>
  <Text 
    style={[styles.question, { color: theme.text, flex: 1 }]} 
    numberOfLines={2}
  >
    {item.question}
  </Text>

  <Ionicons
    name={activeIndex === index ? "chevron-up" : "chevron-down"}
    size={22}
    color={theme.textSecondary}
  />
</TouchableOpacity>

          {activeIndex === index && (
            <Text style={[styles.answer, { color: theme.textSecondary }]}>{item.answer}</Text>
          )}
        </View>
      ))}
      </View>
    </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    // backgroundColor: "#fff"
  },
  headerRow: {
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'space-between',
  paddingLeft: 20,
paddingRight: 10,
},

backButton: {
  width: 44,
  height: 44,
  borderRadius: 14,
  alignItems: 'center',
  justifyContent: 'center',
},

headerTitle: {
  fontSize: 18,
  fontWeight: '700',
},
  header: {
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'space-between',
  paddingHorizontal: 20,
  paddingVertical: 16,
  },
  rightButton: {
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
  sectionTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginVertical: 15,
    marginLeft: 8,
  },
  helpItem: {
    // backgroundColor: "#f1f1f1",
    padding: 18,
    borderRadius: 16,
    marginBottom: 12,
  },
  helpText: {
    fontSize: 16
  },
  questionBox: {
  padding: 18,
  borderRadius: 16,
  marginBottom: 12,
  flexDirection: "row",          // ✅
  alignItems: "center",          // ✅
  justifyContent: "space-between"// ✅
},
  question: {
    fontSize: 16,
    marginRight: 10,
  },
  answer: {
    fontSize: 16,
    padding: 10,
    // color: "#555",
    marginBottom: 10,
  },
  mainCard: {
  borderRadius: 32,
  padding: 24,          // ✅ SAME AS EDIT PROFILE
  marginHorizontal: 16, // ✅ ADD
  marginTop: 10,        // ✅ ADD
  shadowOffset: { width: 0, height: 10 },
  shadowOpacity: 0.08,
  shadowRadius: 20,
  elevation: 8,
},
});