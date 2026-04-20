import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useSelector } from 'react-redux';
import { LinearGradient } from 'expo-linear-gradient';

import colors from '../colors/colors';
import { useNavigation } from '@react-navigation/native';

export default function Home({ onLogout }) {
  // ✅ changed from isDark to themeName
  const themeName = useSelector((state) => state.theme.themeName);
  const username = useSelector((state) => state.user.auth_username);
  const email = useSelector((state) => state.user.auth_email);

  // ✅ get theme object from colors
  const theme = colors[themeName] || colors.light;
  const isDark = themeName === 'dark'; // ✅ only used for gradients

  const navigation = useNavigation();

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <ScrollView contentContainerStyle={styles.content}>

        <View style={styles.header}>
          <Text style={[styles.headerTitle, { color: theme.text, textAlign: 'center' }]}>Dashboard</Text>
        </View>

        <Text style={[styles.greeting, { color: theme.primary }]}>Happy Eco-Tracing!</Text>
        <Text style={[styles.subtitle, { color: theme.textSecondary }]}>Welcome back, {username || "Friend"}</Text>

        {/* Start Trip Button */}
        <TouchableOpacity
          style={styles.actionButtonContainer}
          activeOpacity={0.8}
          onPress={() => navigation.navigate('TrackMap')}
        >
          <LinearGradient
            colors={theme.gradientSurface ?? colors.gradientPrimary}
            style={styles.gradientButton}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            <View style={{ alignItems: 'center' }}>
              <Text style={[styles.buttonText, { color: theme.text }]}>Start Trip</Text>
              <Text style={{ color: theme.textSecondary, fontSize: 13, fontWeight: '500', marginTop: 4 }}>
                Track path & record findings
              </Text>
            </View>
          </LinearGradient>
        </TouchableOpacity>

        {/* Secondary Buttons */}
        <View style={styles.secondaryActions}>
          <TouchableOpacity
            style={[styles.smallActionButton, { backgroundColor: theme.surface }]}
            activeOpacity={0.8}
            onPress={() => navigation.navigate('TripsHistory')}
          >
            <LinearGradient
              colors={theme.gradientSurface ?? ['#f0f0f0', '#e0e0e0']}
              style={styles.smallGradient}
            >
              <Text style={[styles.smallButtonText, { color: theme.text }]}>My Trips</Text>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.smallActionButton, { backgroundColor: theme.surface }]}
            activeOpacity={0.8}
            onPress={() => navigation.navigate('Results')}
          >
            <LinearGradient
              colors={theme.gradientSurface ?? ['#f0f0f0', '#e0e0e0']}
              style={styles.smallGradient}
            >
              <Text style={[styles.smallButtonText, { color: theme.text }]}>Record Logs</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>

      </ScrollView>

      <StatusBar style={theme.statusBarStyle === 'light' ? 'light' : 'dark'} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 24 },
  header: { marginBottom: 24 },
  headerTitle: { fontSize: 28, fontWeight: 'bold' },
  greeting: { fontSize: 24, fontWeight: '600', marginBottom: 8 },
  subtitle: { fontSize: 16, marginBottom: 30 },
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
  buttonText: { fontSize: 22, fontWeight: 'bold', letterSpacing: 1.2 },
  secondaryActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
    gap: 15,
  },
  smallActionButton: {
    flex: 1,
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  smallGradient: {
    paddingVertical: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  smallButtonText: { fontSize: 15, fontWeight: 'bold' },
});