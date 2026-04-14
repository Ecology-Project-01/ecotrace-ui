import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View, TouchableOpacity, ScrollView, Switch, Platform, Alert } from 'react-native';
import CustomAlert from '../components/CustomAlert';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useSelector, useDispatch } from 'react-redux';
import { toggleTheme } from '../store/slices/themeSlice';
import colors from '../colors/colors';
import { useState } from 'react';

// Helper component for settings items
// Now accepts `theme` prop to style dynamically
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
    const isDark = useSelector((state) => state.theme.isDark);
    const { auth_username, auth_email, auth_role, auth_org } = useSelector((state) => state.user);
    const dispatch = useDispatch();

    // Custom Alert State
    const [alertVisible, setAlertVisible] = useState(false);
    const [alertConfig, setAlertConfig] = useState({ title: '', message: '', buttons: [] });

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

    // Select the active theme object
    const theme = isDark ? colors.dark : colors.light;

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
            <ScrollView contentContainerStyle={styles.scrollContent}>

                {/* Custom Header */}
                <View style={styles.header}>
                    <Text style={[styles.title, { color: theme.text, textAlign: 'center' }]}>Settings</Text>
                </View>

                {/* Header / Profile Section - Minimalist & Colorful */}
                <View style={[styles.headerSection]}>
                    <LinearGradient
                        colors={isDark ? [colors.purple, colors.purpleLight] : colors.gradientPrimary}
                        style={styles.avatarContainer}
                    >
                        <Text style={styles.avatarText}>{auth_username?.charAt(0).toUpperCase() || "U"}</Text>
                    </LinearGradient>
                    <View style={styles.headerTextContainer}>
                        <Text style={[styles.userName, { color: theme.text }]}>{auth_username || "User"}</Text>
                        <Text style={[styles.userEmail, { color: theme.textSecondary }]}>{auth_email || null}</Text>
                    </View>
                </View>

                {/* Appearance Section */}
                <View style={styles.section}>
                    <Text style={[styles.sectionHeader, { color: theme.primary }]}>Appearance</Text>
                    <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                        <View style={styles.row}>
                            <Text style={[styles.rowLabel, { color: theme.text }]}>Dark Mode</Text>
                            <Switch
                                value={isDark}
                                onValueChange={() => dispatch(toggleTheme())}
                                trackColor={{ false: colors.gray100, true: colors.purpleLight }}
                                thumbColor={isDark ? colors.purple : "#f4f3f4"}
                            />
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
                        <SettingItem title="Privacy & Security" theme={theme} onPress={() => navigation.navigate('Privacy')} />
                    </View>
                </View>

                {/* Support Section */}
                <View style={styles.section}>
                    <Text style={[styles.sectionHeader, { color: theme.primary }]}>Support</Text>
                    <View style={styles.cardContainer}>
                        <SettingItem title="Help & FAQ" theme={theme} onPress={() => navigation.navigate('Help')} />
                        <SettingItem title="About App" subtitle="Version 1.0.0" theme={theme} onPress={() => navigation.navigate('About')} />
                    </View>
                </View>

                {/* Administration Section - Conditional */}
                {(auth_role === 'admin' || auth_role === 'superadmin') && (
                    <View style={styles.section}>
                        <Text style={[styles.sectionHeader, { color: colors.purple }]}>Administration</Text>
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


                {/* Logout */}
                <TouchableOpacity onPress={handleLogout} activeOpacity={0.8} style={styles.logoutBtnContainer}>
                    <Text style={[styles.logoutText, { color: colors.red }]}>Log Out</Text>
                </TouchableOpacity>

            </ScrollView>

            <CustomAlert
                visible={alertVisible}
                title={alertConfig.title}
                message={alertConfig.message}
                buttons={alertConfig.buttons}
                onClose={() => setAlertVisible(false)}
            />
            <StatusBar style={theme.statusBarStyle === 'light' ? 'light' : 'dark'} />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    scrollContent: {
        padding: 24,
        paddingBottom: 50,
    },
    header: {
        marginBottom: 20,
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
    },
    headerSection: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 32,
    },
    avatarContainer: {
        width: 64,
        height: 64,
        borderRadius: 32,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: colors.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 5,
    },
    avatarText: {
        fontSize: 28,
        color: '#FFF',
        fontWeight: 'bold',
    },
    headerTextContainer: {
        marginLeft: 16,
        flex: 1,
    },
    userName: {
        fontSize: 22,
        fontWeight: '700',
        marginBottom: 2,
    },
    userEmail: {
        fontSize: 14,
    },
    section: {
        marginBottom: 28,
    },
    sectionHeader: {
        fontSize: 13,
        fontWeight: '800',
        marginBottom: 12,
        textTransform: 'uppercase',
        letterSpacing: 1.2,
        marginLeft: 4,
    },
    cardContainer: {
        borderRadius: 16,
        overflow: 'hidden',
    },
    settingItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 16,
        borderBottomWidth: 1,
        marginBottom: -1, // Collapse borders
    },
    settingContent: {
        flex: 1,
    },
    settingTitle: {
        fontSize: 16,
        fontWeight: '500',
    },
    settingSubtitle: {
        fontSize: 13,
        marginTop: 2,
    },
    arrow: {
        fontSize: 18,
        fontWeight: '600',
    },
    card: {
        borderRadius: 16,
        padding: 16,
        borderWidth: 1,
    },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    rowLabel: {
        fontSize: 16,
        fontWeight: '500',
    },
    logoutBtnContainer: {
        alignItems: 'center',
        padding: 16,
        marginTop: 8,
        borderRadius: 12,
    },
    logoutText: {
        fontSize: 16,
        fontWeight: '700',
    },
});
