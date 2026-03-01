import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useSelector } from 'react-redux';
import { LinearGradient } from 'expo-linear-gradient';

import colors from '../colors/colors';

import { useNavigation } from '@react-navigation/native';

export default function Home({ onLogout }) {
  const isDark = useSelector((state) => state.theme.isDark);
  const username = useSelector((state) => state.user.auth_username);
  const email = useSelector((state) => state.user.auth_email);
  const theme = isDark ? colors.dark : colors.light;
  const navigation = useNavigation();

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <ScrollView contentContainerStyle={styles.content}>
        {/* Custom Header */}
        <View style={styles.header}>
          <Text style={[styles.headerTitle, { color: theme.text, textAlign: 'center' }]}>Dashboard</Text>
        </View>

        <Text style={[styles.greeting, { color: theme.primary }]}>Happy Eco-Tracing!</Text>
        <Text style={[styles.subtitle, { color: theme.textSecondary }]}>Welcome back, {username || "Friend"}</Text>

        {/* Example Action Button */}
        <TouchableOpacity
          style={styles.actionButtonContainer}
          activeOpacity={0.8}
          onPress={() => navigation.navigate('Observation')}
        >
          <LinearGradient
            colors={isDark ? colors.gradientPurple : colors.gradientPrimary}
            style={styles.gradientButton}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            <Text style={styles.buttonText}>Start Tracking</Text>
          </LinearGradient>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionButtonContainer, { marginTop: 16 }]}
          activeOpacity={0.8}
          onPress={() => navigation.navigate('Results')}
        >
          <LinearGradient
            colors={isDark ? ['#333', '#111'] : ['#e0e0e0', '#d0d0d0']}
            style={styles.gradientButton}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            <Text style={[styles.buttonText, { color: isDark ? '#fff' : '#333' }]}>View Results</Text>
          </LinearGradient>
        </TouchableOpacity>

      </ScrollView>

      <StatusBar style={isDark ? "light" : "dark"} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 24,
  },
  header: {
    marginBottom: 24,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  greeting: {
    fontSize: 24,
    fontWeight: '600',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    marginBottom: 30,
  },
  actionButtonContainer: {
    width: '100%',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  gradientButton: {
    paddingVertical: 40,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    color: '#FFF',
    fontSize: 22,
    fontWeight: 'bold',
    letterSpacing: 1.2,
  }
});
