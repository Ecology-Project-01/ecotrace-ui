import React, { useState, useEffect } from "react";
import { useSelector } from 'react-redux';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  // Alert, // Removed native Alert
  Platform,
  ActivityIndicator,
  KeyboardAvoidingView,
  ScrollView,
  StatusBar
} from "react-native";
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import * as LocalAuthentication from 'expo-local-authentication';
import * as SecureStore from 'expo-secure-store';
import * as Device from 'expo-device';
import { Ionicons } from '@expo/vector-icons';
import { Video } from 'expo-av';


import colors from "../colors/colors";
import CustomAlert from "../components/CustomAlert";
import { API_URL } from '../constants/config';

export default function Auth({ onLogin, navigation }) {
  const isDark = useSelector((state) => (state.theme ? state.theme.isDark : false)); // Safe access
  // Fallback if provider not ready, though RootNavigator should wrap it.
  // Actually Auth is in RootNavigator under Provider.

  const theme = isDark ? colors.dark : colors.light;

  const [isLogin, setIsLogin] = useState(true);
  const [isReset, setIsReset] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isPwdShown, setIsPwdShown] = useState(false);
  const [showVideo, setShowVideo] = useState(false);

  const [loading, setLoading] = useState(false);
  const [isBiometricSupported, setIsBiometricSupported] = useState(false);
  const [hasStoredCreds, setHasStoredCreds] = useState(false);

  // Custom Alert State
  const [alertConfig, setAlertConfig] = useState({
    visible: false,
    title: "",
    message: "",
    buttons: []
  });

  useEffect(() => {
    checkBiometrics();
    checkStoredCreds();
  }, []);

  // Check if device supports biometrics (FaceID/TouchID)
  const checkBiometrics = async () => {
    try {
      const compatible = await LocalAuthentication.hasHardwareAsync();
      const enrolled = await LocalAuthentication.isEnrolledAsync();
      setIsBiometricSupported(compatible && enrolled);
    } catch (error) {
      console.log("Biometric check error:", error);
    }
  };

  // Check if we have securely stored credentials
  const checkStoredCreds = async () => {
    try {
      const creds = await SecureStore.getItemAsync('user_creds');
      if (creds) setHasStoredCreds(true);
    } catch (error) {
      console.log("SecureStore check error:", error);
    }
  };

  // Helper for custom alerts
  const showAlert = (title, message, buttons = []) => {
    const wrappedButtons = buttons.length > 0 ? buttons.map(btn => ({
      ...btn,
      onPress: () => {
        setAlertConfig(prev => ({ ...prev, visible: false }));
        if (btn.onPress) btn.onPress();
      }
    })) : [
      {
        text: "OK",
        onPress: () => setAlertConfig(prev => ({ ...prev, visible: false }))
      }
    ];

    setAlertConfig({ visible: true, title, message, buttons: wrappedButtons });
  };

  const hideAlert = () => {
    setAlertConfig(prev => ({ ...prev, visible: false }));
  };

  const getDeviceInfo = () => {
    return {
      brand: Device.brand || "Unknown",
      model: Device.modelName || "Unknown",
      osVersion: Device.osVersion || "Unknown",
    };
  };



  // Handle Biometric Login Flow
  const handleBiometricLogin = async () => {
    setLoading(true);
    try {
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Authenticate to login',
        fallbackLabel: 'Use Passcode',
      });

      if (result.success) {
        const credsString = await SecureStore.getItemAsync('user_creds');
        if (credsString) {
          const creds = JSON.parse(credsString);

          // Auto-login with stored credentials
          const response = await fetch(`${API_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              email: creds.email,
              password: creds.password,
              deviceInfo: getDeviceInfo()
            }),
          });


          const data = await response.json();
          if (response.ok) {
            if (onLogin) {
              console.log(`[Auth] Biometric Login Success for: ${creds.email}`);
              onLogin({
                email: creds.email,
                name: data.user?.name || "User",
                role: data.user?.role,
                org: data.user?.org
              }, data.token);
            }
          } else {
            showAlert("Login Failed", data.err || "Could not login with stored credentials.");
          }
        }
      }
    } catch (error) {
      showAlert("Error", "Biometric login failed");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  // Handle Standard Login/Signup
  const handleAuth = async () => {
    setLoading(true);
    try {
      let endpoint = isLogin ? '/auth/login' : '/auth/signup';
      let payload = isLogin ? { email, password } : { email, password, name };

      if (isReset) {
        endpoint = '/auth/reset-password';
        payload = { email, newPassword: password };
      }

      const body = { ...payload, deviceInfo: getDeviceInfo() };

      const response = await fetch(`${API_URL}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });



      const contentType = response.headers.get("content-type");
      if (contentType && contentType.indexOf("application/json") !== -1) {
        const data = await response.json();

        if (!response.ok) {
          let errorMsg = data.message || data.err || data.msg || "Authentication failed";

          // If it's a validation error with a list of fields
          if (data.errors && Array.isArray(data.errors)) {
            errorMsg = data.errors.map(e => `${e.path}: ${e.message}`).join("\n");
          }

          console.warn(`[Auth] ${isReset ? 'Reset' : (isLogin ? 'Login' : 'Signup')} Failed:`, errorMsg);
          throw new Error(errorMsg);
        }

        if (isReset) {
          console.log(`[Auth] Password Reset Success for: ${email}`);
          showAlert("Success", "Password updated successfully. Please login.", [
            { text: "OK", onPress: () => { setIsReset(false); setIsLogin(true); } }
          ]);
          setLoading(false);
          return;
        }


        const finishLogin = () => {
          console.log(`[Auth] ${isLogin ? 'Login' : 'Signup'} Success for: ${email}`);
          if (onLogin) {
            onLogin({
              email,
              name: data.user?.name || name || "User",
              role: data.user?.role,
              org: data.user?.org
            }, data.token);
          }
        };

        // Ask to save credentials if biometrics supported
        if (isBiometricSupported) {
          showAlert(
            "Enable Biometric Login?",
            "Would you like to save your credentials for faster login next time?",
            [
              { text: "No", onPress: finishLogin, style: "cancel" },
              {
                text: "Yes",
                onPress: async () => {
                  const authResult = await LocalAuthentication.authenticateAsync({
                    promptMessage: 'Verify identity to save credentials',
                  });

                  if (authResult.success) {
                    await SecureStore.setItemAsync('user_creds', JSON.stringify({ email, password }));
                    setTimeout(() => {
                      showAlert("Success", "Credentials saved securely.", [{ text: "OK", onPress: finishLogin }]);
                    }, 300);
                  } else {
                    setTimeout(() => {
                      showAlert("Cancelled", "Credentials were not saved.", [{ text: "OK", onPress: finishLogin }]);
                    }, 300);
                  }
                }
              }
            ]
          );
        } else {
          finishLogin();
        }

      } else {
        const text = await response.text();
        throw new Error(`Server returned status ${response.status}.`);
      }
    } catch (error) {
      console.error("Authentication error:", error);
      showAlert("Error", error.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />
      <CustomAlert
        visible={alertConfig.visible}
        title={alertConfig.title}
        message={alertConfig.message}
        buttons={alertConfig.buttons}
        onClose={hideAlert}
      />
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.container}
      >
        <LinearGradient
          colors={theme.gradientSurface}
          style={styles.gradientContainer}
        >
          <ScrollView contentContainerStyle={styles.scrollContent}>
            <View style={styles.header}>
              <Text style={[styles.brand, { color: theme.primary }]}>ECOTRACE</Text>
              <Text style={[styles.tagline, { color: theme.secondary }]}>Track your surroundings!</Text>
            </View>

            <View style={[styles.card, { backgroundColor: theme.surface, shadowColor: isDark ? "#000" : "#ccc" }]}>
              <Text style={[styles.title, { color: theme.text }]}>
                {isReset ? "Reset Password" : (isLogin ? "Login" : "Create Account")}
              </Text>


              {!isLogin && !isReset && (
                <View style={styles.inputContainer}>
                  <Text style={[styles.label, { color: theme.textSecondary }]}>Full Name</Text>
                  <TextInput
                    style={[styles.input, { color: theme.text, borderBottomColor: theme.border }]}
                    placeholder="John Doe"
                    placeholderTextColor={theme.textLight}
                    value={name}
                    onChangeText={setName}
                    autoCapitalize="words"
                  />
                </View>
              )}

              <View style={styles.inputContainer}>
                <Text style={[styles.label, { color: theme.textSecondary }]}>Email Address</Text>
                <TextInput
                  style={[styles.input, { color: theme.text, borderBottomColor: theme.border }]}
                  placeholder="name@example.com"
                  placeholderTextColor={theme.textLight}
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>

              <View style={styles.inputContainer}>
                <Text style={[styles.label, { color: theme.textSecondary }]}>
                  {isReset ? "New Password" : "Password"}
                </Text>
                <View style={[styles.passwordInputWrapper, { borderBottomColor: theme.border }]}>
                  <TextInput
                    style={[styles.input, { color: theme.text, borderBottomWidth: 0, flex: 1 }]}
                    placeholder="••••••••"
                    placeholderTextColor={theme.textLight}
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry={!isPwdShown}
                  />
                  <TouchableOpacity
                    onPress={() => setIsPwdShown(!isPwdShown)}
                    style={styles.eyeIcon}
                  >
                    <Ionicons
                      name={isPwdShown ? "eye-outline" : "eye-off-outline"}
                      size={20}
                      color={theme.textSecondary}
                    />
                  </TouchableOpacity>
                </View>

              </View>




              <TouchableOpacity onPress={handleAuth} disabled={loading} activeOpacity={0.8}>
                <LinearGradient
                  colors={isDark ? colors.gradientPurple : colors.gradientPrimary}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.button}
                >
                  {loading ? (
                    <ActivityIndicator color="#FFF" />
                  ) : (
                    <Text style={styles.buttonText}>
                      {isReset ? "Update Password" : (isLogin ? "Login" : "Get Started")}
                    </Text>
                  )}
                </LinearGradient>

              </TouchableOpacity>

              {isLogin && !isReset && (
                <TouchableOpacity
                  onPress={() => { setIsReset(true); setIsLogin(false); }}
                  style={{ alignSelf: 'flex-end', marginTop: 12 }}
                >
                  <Text style={{ color: theme.textSecondary, fontSize: 12, fontWeight: '500' }}>Forgot Password?</Text>
                </TouchableOpacity>
              )}


              {isLogin && hasStoredCreds && isBiometricSupported && (
                <TouchableOpacity onPress={handleBiometricLogin} style={styles.biometricButton} activeOpacity={0.7}>
                  <Text style={[styles.biometricText, { color: theme.primary }]}>Login with Biometrics</Text>
                </TouchableOpacity>
              )}

              <TouchableOpacity
                onPress={() => {
                  if (isReset) {
                    setIsReset(false);
                    setIsLogin(true);
                  } else {
                    setIsLogin(!isLogin);
                  }
                }}
                style={styles.toggleContainer}
                activeOpacity={0.7}
              >
                <Text style={styles.toggleText}>
                  {isReset ? "Back to " : (isLogin ? "New here? " : "Returning user? ")}
                  <Text style={styles.toggleBold}>
                    {isReset ? "Login" : (isLogin ? "Create an account" : "Login")}
                  </Text>
                </Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => navigation.navigate('UserGuide', {from:'Auth'})}>
                <Text style={{ 
                  color: '#007AFF',
                  marginTop: 10,
                  textAlign: 'center'
                }}>
                  ▶ User Guide
                </Text>
              </TouchableOpacity>
            </View>

            {/* <Text style={{ textAlign: 'center', marginTop: 20, color: theme.textSecondary, fontSize: 10 }}>
              Debug API: {API_URL}
            </Text> */}
          {showVideo && (
              <Video
                source={require('../assets/videos/login.mp4')}
                style={{ width: '100%', height: 200, marginTop: 20 }}
                useNativeControls
                resizeMode="contain"
                shouldPlay
              />
            )}
          </ScrollView>
        </LinearGradient>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradientContainer: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    padding: 24,
    justifyContent: 'center',
    paddingBottom: 40, // Add bottom padding to ensure content isn't cut off
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
    marginTop: 20,
  },
  brand: {
    fontSize: 28,
    fontWeight: "800",
    color: colors.primary,
    letterSpacing: 4,
    textTransform: 'uppercase',
  },
  tagline: {
    fontSize: 16,
    color: colors.textSecondary,
    marginTop: 8,
    fontWeight: '600',
    textAlign: 'center',
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 8, // Sharper corners for a classier look
    padding: 32,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 15 },
    shadowOpacity: 0.05,
    shadowRadius: 30,
    elevation: 8,
  },
  title: {
    fontSize: 22,
    fontWeight: "400", // Lighter font weight is often classier
    color: colors.text,
    marginBottom: 32,
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  inputContainer: {
    marginBottom: 24,
  },
  label: {
    fontSize: 11,
    color: colors.textSecondary,
    marginBottom: 8,
    fontWeight: "700",
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  input: {
    height: 48,
    borderBottomWidth: 1,
    borderBottomColor: "#E0E0E0",
    fontSize: 16,
    color: colors.text,
    paddingVertical: 8,
  },
  button: {
    paddingVertical: 18,
    borderRadius: 8, // Matching card border radius
    alignItems: "center",
    marginTop: 24,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2, // Subtle shadow
    shadowRadius: 16,
    elevation: 6,
  },
  buttonText: {
    color: "#FFF",
    fontSize: 14,
    fontWeight: "700",
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  biometricButton: {
    marginTop: 16,
    alignItems: 'center',
  },
  biometricText: {
    color: colors.primary,
    fontWeight: '600',
    fontSize: 14,
  },
  buttonTextDark: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: "700",
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  toggleContainer: {
    marginTop: 32,
    alignItems: 'center',
  },
  toggleText: {
    color: colors.textSecondary,
    fontSize: 14,
  },
  toggleBold: {
    color: colors.secondary,
    fontWeight: "700",
  },
  subtitle: {
    fontSize: 16,
    color: colors.textSecondary,
    marginBottom: 32,
    textAlign: 'center',
  },
  passwordInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
  },
  eyeIcon: {
    padding: 8,
  }
});

