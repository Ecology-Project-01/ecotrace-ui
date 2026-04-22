import { StatusBar } from 'expo-status-bar';
import {
    StyleSheet, Text, View, TouchableOpacity,
    ScrollView, Switch, Platform, Alert
} from 'react-native';
import CustomAlert from '../components/CustomAlert';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useSelector, useDispatch } from 'react-redux';
import { setTheme } from '../store/slices/themeSlice';
import colors from '../colors/colors';
import { useState } from 'react';

const SettingItem = ({ title, subtitle, onPress, showArrow = true, theme, rightElement }) => (
    <TouchableOpacity
        style={[styles.settingItem, { backgroundColor: theme.surface, borderColor: theme.border }]}
        onPress={onPress}
        activeOpacity={0.7}
    >
        <View style={styles.settingContent}>
            <Text style={[styles.settingTitle, { color: theme.text }]}>{title}</Text>
            {subtitle && <Text style={[styles.settingSubtitle, { color: theme.textSecondary }]}>{subtitle}</Text>}
        </View>
        {rightElement ? rightElement : (showArrow && <Text style={[styles.arrow, { color: theme.textLight }]}>{'>'}</Text>)}
    </TouchableOpacity>
);

export default function Settings({ navigation, onLogout }) {
    const themeName = useSelector((state) => state.theme.themeName);
    const { auth_username, auth_email, auth_role } = useSelector((state) => state.user);
    const dispatch = useDispatch();

    const [alertVisible, setAlertVisible] = useState(false);
    const [alertConfig, setAlertConfig] = useState({ title: '', message: '', buttons: [] });

    // ✅ FIX 1: Derive theme object and flags from themeName
    const theme = colors[themeName] || colors.light;
    const isDark = themeName === 'dark';

    // ✅ FIX 2: All color constants derived from theme or a safe fallback palette
    // These must be consistent keys that exist in every theme object.
    // If your colors.js has flat-level constants like colors.purple, keep them;
    // otherwise fall back to theme values.
    const PURPLE      = colors.purple      ?? theme.primary;
    const PURPLE_LIGHT = colors.purpleLight ?? theme.primaryLight ?? theme.primary;
    const GRAY_100    = colors.gray100     ?? '#E5E5E5';
    const RED         = colors.red         ?? '#E53935';

    // ✅ FIX 3: gradientPrimary must be an array for LinearGradient
    const GRADIENT_COLORS = isDark
        ? [PURPLE, PURPLE_LIGHT]
        : (Array.isArray(colors.gradientPrimary)
            ? colors.gradientPrimary
            : [theme.primary, theme.primaryLight ?? theme.primary]);

    const showAlert = (title, message, buttons = []) => {
        setAlertConfig({ title, message, buttons });
        setAlertVisible(true);
    };

    const handleLogout = () => {
        showAlert(
            "Logout",
            "Are you sure you want to log out of EcoTrace?",
            [
                { text: "Cancel", style: "cancel" },
                { text: "Log Out", onPress: onLogout }
            ]
        );
    };

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
            <ScrollView contentContainerStyle={styles.scrollContent}>

                <View style={styles.header}>
                    <Text style={[styles.title, { color: theme.text, textAlign: 'center' }]}>Settings</Text>
                </View>

                <View style={styles.headerSection}>
                    {/* ✅ FIX 4: avatarContainer shadow uses theme.primary, not colors.primary */}
                    <LinearGradient
                        colors={GRADIENT_COLORS}
                        style={[
                            styles.avatarContainer,
                            { shadowColor: theme.primary }  // was: colors.primary (undefined)
                        ]}
                    >
                        <Text style={styles.avatarText}>
                            {auth_username?.charAt(0).toUpperCase() || "U"}
                        </Text>
                    </LinearGradient>
                    <View style={styles.headerTextContainer}>
                        <Text style={[styles.userName, { color: theme.text }]}>
                            {auth_username || "User"}
                        </Text>
                        <Text style={[styles.userEmail, { color: theme.textSecondary }]}>
                            {auth_email || null}
                        </Text>
                    </View>
                </View>

                {/* Appearance Section */}
                <View style={styles.section}>
                    <Text style={[styles.sectionHeader, { color: theme.primary }]}>Appearance</Text>
                    <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>

                        {/* ✅ FIX 5: Switch uses safe color constants, not raw colors.* keys */}
                        <View style={[styles.row, { marginBottom: 16 }]}>
                            <Text style={[styles.rowLabel, { color: theme.text }]}>Dark Mode</Text>
                            <Switch
                                value={isDark}
                                onValueChange={(val) => dispatch(setTheme(val ? 'dark' : 'light'))}
                                trackColor={{ false: GRAY_100, true: PURPLE_LIGHT }}
                                thumbColor={isDark ? PURPLE : '#f4f3f4'}
                            />
                        </View>

                        {/* ✅ FIX 6: Theme button primary color safely resolved per-theme */}
                        <Text style={[styles.rowLabel, { color: theme.text, marginBottom: 10 }]}>Theme</Text>
                        <View style={styles.themeRow}>
                            {['light', 'dark', 'blue', 'grey', 'purple'].map((t) => (
                                <TouchableOpacity
                                    key={t}
                                    onPress={() => dispatch(setTheme(t))}
                                    style={[
                                        styles.themeBtn,
                                        {
                                            backgroundColor:
                                                colors[t]?.primary   // theme object has .primary
                                                ?? colors[t]          // flat string fallback
                                                ?? theme.primary      // last resort: current theme
                                        },
                                        themeName === t && styles.themeBtnActive,
                                    ]}
                                >
                                    <Text style={styles.themeBtnText}>
                                        {t.charAt(0).toUpperCase() + t.slice(1)}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>

                    </View>
                </View>

                {/* Account Section */}
                <View style={styles.section}>
                    <Text style={[styles.sectionHeader, { color: theme.primary }]}>Account</Text>
                    <View style={styles.cardContainer}>
                        <SettingItem
                            title="Edit Profile"
                            subtitle="Name, Email, Bio"
                            theme={theme}
                            onPress={() => navigation.navigate('EditProfile')}
                        />
                        <SettingItem title="Notifications" theme={theme} />
                        <SettingItem
                            title="Privacy & Security"
                            theme={theme}
                            onPress={() => navigation.navigate('Privacy')}
                        />
                    </View>
                </View>

                {/* Support Section */}
                <View style={styles.section}>
                    <Text style={[styles.sectionHeader, { color: theme.primary }]}>Support</Text>
                    <View style={styles.cardContainer}>
                        <SettingItem
                            title="Help & FAQ"
                            theme={theme}
                            onPress={() => navigation.navigate('Help')}
                        />
                        <SettingItem
                            title="About App"
                            subtitle="Version 1.0.0"
                            theme={theme}
                            onPress={() => navigation.navigate('About')}
                        />
                    </View>
                </View>

                {/* ✅ FIX 7: Administration section header uses PURPLE constant, not colors.purple */}
                {(auth_role === 'admin' || auth_role === 'superadmin') && (
                    <View style={styles.section}>
                        <Text style={[styles.sectionHeader, { color: PURPLE }]}>Administration</Text>
                        <View style={styles.cardContainer}>
                            {auth_role === 'superadmin' ? (
                                <SettingItem
                                    title="Superadmin Rights"
                                    subtitle="Full system control"
                                    theme={theme}
                                    onPress={() => navigation.navigate('SuperAdminRights')}
                                />
                            ) : (
                                <SettingItem
                                    title="Admin Rights"
                                    subtitle="Tools for administrators"
                                    theme={theme}
                                    onPress={() => navigation.navigate('AdminRights')}
                                />
                            )}
                        </View>
                    </View>
                )}

                {/* ✅ FIX 8: Logout text uses RED constant, not colors.red */}
                <TouchableOpacity
                    onPress={handleLogout}
                    activeOpacity={0.8}
                    style={styles.logoutBtnContainer}
                >
                    <Text style={[styles.logoutText, { color: RED }]}>Log Out</Text>
                </TouchableOpacity>

            </ScrollView>

            <CustomAlert
                visible={alertVisible}
                title={alertConfig.title}
                message={alertConfig.message}
                buttons={alertConfig.buttons}
                onClose={() => setAlertVisible(false)}
            />

            {/* ✅ FIX 9: StatusBar style correctly reads statusBarStyle from theme */}
            <StatusBar style={theme.statusBarStyle === 'light' ? 'light' : 'dark'} />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    scrollContent: { padding: 24, paddingBottom: 50 },
    header: { marginBottom: 20 },
    title: { fontSize: 28, fontWeight: 'bold' },
    headerSection: { flexDirection: 'row', alignItems: 'center', marginBottom: 32 },
    avatarContainer: {
        width: 64, height: 64, borderRadius: 32,
        alignItems: 'center', justifyContent: 'center',
        // shadowColor is now set inline via theme.primary (see FIX 4)
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3, shadowRadius: 8, elevation: 5,
    },
    avatarText: { fontSize: 28, color: '#FFF', fontWeight: 'bold' },
    headerTextContainer: { marginLeft: 16, flex: 1 },
    userName: { fontSize: 22, fontWeight: '700', marginBottom: 2 },
    userEmail: { fontSize: 14 },
    section: { marginBottom: 28 },
    sectionHeader: {
        fontSize: 13, fontWeight: '800', marginBottom: 12,
        textTransform: 'uppercase', letterSpacing: 1.2, marginLeft: 4,
    },
    cardContainer: { borderRadius: 16, overflow: 'hidden' },
    settingItem: {
        flexDirection: 'row', alignItems: 'center',
        justifyContent: 'space-between', padding: 16,
        borderBottomWidth: 1, marginBottom: -1,
    },
    settingContent: { flex: 1 },
    settingTitle: { fontSize: 16, fontWeight: '500' },
    settingSubtitle: { fontSize: 13, marginTop: 2 },
    arrow: { fontSize: 18, fontWeight: '600' },
    card: { borderRadius: 16, padding: 16, borderWidth: 1 },
    row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    rowLabel: { fontSize: 16, fontWeight: '500' },
    logoutBtnContainer: { alignItems: 'center', padding: 16, marginTop: 8, borderRadius: 12 },
    logoutText: { fontSize: 16, fontWeight: '700' },
    themeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    themeBtn: {
        paddingHorizontal: 14, paddingVertical: 8,
        borderRadius: 20, opacity: 0.85,
    },
    themeBtnActive: { opacity: 1, borderWidth: 2, borderColor: '#fff' },
    themeBtnText: { color: '#fff', fontSize: 13, fontWeight: '600' },
});