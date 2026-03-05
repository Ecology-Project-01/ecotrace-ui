import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TextInput, ScrollView, TouchableOpacity, Platform, KeyboardAvoidingView, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useDispatch, useSelector } from 'react-redux';
import colors from '../colors/colors';
import { setUser } from '../store/slices/userSlice';
import * as SecureStore from 'expo-secure-store';
import CustomAlert from '../components/CustomAlert';

const LOCAL_IP = "192.168.1.7";
const API_URL = `http://${LOCAL_IP}:4000`;

export default function EditProfile({ navigation }) {
    const isDark = useSelector((state) => state.theme.isDark);
    const { auth_username, auth_email, auth_role, auth_org } = useSelector((state) => state.user);

    const [name, setName] = useState(auth_username || '');
    const [email, setEmail] = useState(auth_email || '');

    useEffect(() => {
        setName(auth_username || '');
        setEmail(auth_email || '');
    }, [auth_username, auth_email]);

    const dispatch = useDispatch();
    const theme = isDark ? colors.dark : colors.light;

    // Custom Alert State
    const [alertVisible, setAlertVisible] = useState(false);
    const [alertConfig, setAlertConfig] = useState({ title: '', message: '', buttons: [] });

    const showAlert = (title, message, buttons = []) => {
        setAlertConfig({ title, message, buttons });
        setAlertVisible(true);
    };
    const capitalize = (s) => s ? s.charAt(0).toUpperCase() + s.slice(1) : '';

    const [isUpdating, setIsUpdating] = useState(false);
    const isChanged = name !== (auth_username || '');

    const updateUsername = async () => {
        if (!isChanged || isUpdating) return;

        setIsUpdating(true);
        try {
            const token = await SecureStore.getItemAsync('userToken');
            const response = await fetch(`${API_URL}/auth/changeUsername`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    email: auth_email,
                    newUsername: name
                })
            });

            const data = await response.json();

            if (response.ok) {
                // Update Redux
                dispatch(setUser({
                    username: name,
                    email: auth_email,
                    role: auth_role,
                    org: auth_org
                }));
                showAlert("Success", "Username updated successfully!");
            } else {
                showAlert("Error", data.err || "Failed to update username");
            }
        } catch (error) {
            console.error(error);
            showAlert("Error", "Network error. Please try again.");
        } finally {
            setIsUpdating(false);
        }
    };

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>

            {/* Header with Back Button */}
            <View style={styles.header}>
                <TouchableOpacity
                    style={[styles.backButton, { backgroundColor: theme.surface }]}
                    onPress={() => navigation.goBack()}
                    activeOpacity={0.7}
                >
                    <Ionicons name="arrow-back" size={24} color={theme.text} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: theme.text }]}>Edit Profile</Text>
                <View style={{ width: 44 }} />
            </View>

            <KeyboardAvoidingView
                behavior={Platform.OS === "ios" ? "padding" : "height"}
                style={{ flex: 1 }}
            >
                <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

                    {/* Profile Card */}
                    <View style={[styles.card, { backgroundColor: theme.surface, shadowColor: isDark ? "#000" : colors.primary }]}>

                        {/* Avatar & Basic Info */}
                        <View style={styles.cardHeader}>
                            <View style={[styles.avatarContainer, { borderColor: theme.background }]}>
                                <View style={[styles.avatarPlaceholder, { backgroundColor: isDark ? colors.gray800 : colors.gray100 }]}>
                                    <Text style={[styles.avatarText, { color: theme.primary }]}>
                                        {name ? name.charAt(0).toUpperCase() : 'U'}
                                    </Text>
                                </View>
                                <TouchableOpacity style={[styles.cameraButton, { backgroundColor: theme.primary, borderColor: theme.surface }]}>
                                    <Ionicons name="camera" size={14} color="#FFF" />
                                </TouchableOpacity>
                            </View>
                            <Text style={[styles.userName, { color: theme.text }]}>{name || "User"}</Text>
                            <Text style={[styles.userEmail, { color: theme.textSecondary }]}>{email}</Text>
                        </View>

                        <View style={[styles.divider, { backgroundColor: theme.border }]} />

                        {/* Editable Fields */}
                        <View style={styles.formSection}>
                            <View style={styles.inputGroup}>
                                <Text style={[styles.label, { color: theme.textSecondary }]}>Full Name</Text>
                                <View style={[styles.inputWrapper, { backgroundColor: theme.background, borderColor: theme.border }]}>
                                    <Ionicons name="person-outline" size={18} color={theme.textLight} style={styles.inputIcon} />
                                    <TextInput
                                        style={[styles.input, { color: theme.text }]}
                                        value={name}
                                        onChangeText={setName}
                                        placeholder="Enter full name"
                                        placeholderTextColor={theme.textLight}
                                    />
                                </View>
                                {isChanged && (
                                    <TouchableOpacity
                                        onPress={updateUsername}
                                        style={styles.updateTextButton}
                                        disabled={isUpdating}
                                    >
                                        <Text style={[styles.updateText, { color: colors.primary }]}>
                                            {isUpdating ? "Updating..." : "Update Username"}
                                        </Text>
                                    </TouchableOpacity>
                                )}
                            </View>

                            <View style={styles.inputGroup}>
                                <Text style={[styles.label, { color: theme.textSecondary }]}>Email Address</Text>
                                <View style={[styles.inputWrapper, { backgroundColor: theme.background, borderColor: theme.border }]}>
                                    <Ionicons name="mail-outline" size={18} color={theme.textLight} style={styles.inputIcon} />
                                    <Text style={[styles.input, { color: theme.text }]}>
                                        {email || 'null'}
                                    </Text>
                                </View>
                            </View>
                        </View>

                        {/* Read-Only Stats (Role/Org) */}
                        <View style={styles.statsRow}>
                            <View style={[styles.statBadge, { backgroundColor: isDark ? 'rgba(59, 130, 246, 0.15)' : '#eff6ff' }]}>
                                <MaterialCommunityIcons name="shield-account-outline" size={16} color={colors.primary} />
                                <Text style={[styles.statText, { color: colors.primary }]}>{capitalize(auth_role) || 'User'}</Text>
                            </View>
                            <View style={[styles.statBadge, { backgroundColor: isDark ? 'rgba(16, 185, 129, 0.15)' : '#ecfdf5' }]}>
                                <MaterialCommunityIcons name="office-building-outline" size={16} color={colors.secondary} />
                                <Text style={[styles.statText, { color: colors.secondary }]}>{capitalize(auth_org) || 'Solo'}</Text>
                            </View>
                        </View>

                    </View>

                    <Text style={[styles.footerText, { color: theme.textLight }]}>
                        Contact your admin to update restricted fields.
                    </Text>

                </ScrollView>
            </KeyboardAvoidingView>

            <CustomAlert
                visible={alertVisible}
                title={alertConfig.title}
                message={alertConfig.message}
                buttons={alertConfig.buttons}
                onClose={() => setAlertVisible(false)}
            />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
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
        borderRadius: 14, // Squircle
        alignItems: 'center',
        justifyContent: 'center',
        // Subtle shadow for button
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
    content: {
        padding: 24,
    },
    card: {
        borderRadius: 32,
        padding: 24,
        paddingTop: 32,
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.08,
        shadowRadius: 20,
        elevation: 8,
    },
    cardHeader: {
        alignItems: 'center',
        marginBottom: 24,
    },
    avatarContainer: {
        marginBottom: 16,
        position: 'relative',
    },
    avatarPlaceholder: {
        width: 100,
        height: 100,
        borderRadius: 50,
        alignItems: 'center',
        justifyContent: 'center',
    },
    avatarText: {
        fontSize: 40,
        fontWeight: 'bold',
    },
    cameraButton: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        width: 32,
        height: 32,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 3,
    },
    nameActionRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        width: '100%',
    },
    userName: {
        fontSize: 22,
        fontWeight: 'bold',
        marginBottom: 4,
        textAlign: 'center',
    },
    updateTextButton: {
        paddingVertical: 8,
        paddingHorizontal: 4,
        alignSelf: 'flex-start',
    },
    updateText: {
        fontSize: 13,
        fontWeight: '700',
        textDecorationLine: 'underline',
        left: 140,
    },
    userEmail: {
        fontSize: 14,
        textAlign: 'center',
    },
    divider: {
        height: 1,
        width: '100%',
        marginBottom: 24,
        opacity: 0.5,
    },
    formSection: {
        marginBottom: 24,
    },
    inputGroup: {
        marginBottom: 20,
    },
    label: {
        fontSize: 12,
        fontWeight: '600',
        marginBottom: 8,
        marginLeft: 4,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    inputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderRadius: 16,
        paddingHorizontal: 16,
        height: 52,
    },
    inputIcon: {
        marginRight: 12,
    },
    input: {
        flex: 1,
        fontSize: 15,
        fontWeight: '500',
    },
    statsRow: {
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 12, // React Native 0.71+ supports gap
    },
    statBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 10,
        paddingHorizontal: 16,
        borderRadius: 20,
    },
    statText: {
        fontSize: 13,
        fontWeight: '700',
        marginLeft: 8,
    },
    footerText: {
        textAlign: 'center',
        fontSize: 12,
        marginTop: 24,
        opacity: 0.6,
    },
});
