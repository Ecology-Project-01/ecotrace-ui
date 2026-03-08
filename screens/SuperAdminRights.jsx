import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, FlatList, ActivityIndicator, Alert, RefreshControl, TextInput, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useSelector } from 'react-redux';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import * as SecureStore from 'expo-secure-store';
import colors from '../colors/colors';
import CustomAlert from '../components/CustomAlert';

import { API_URL } from '../constants/config';

export default function SuperAdminRights({ navigation }) {
    const isDark = useSelector((state) => state.theme.isDark);
    const { auth_role, auth_org } = useSelector((state) => state.user);
    const theme = isDark ? colors.dark : colors.light;

    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    // Invite User Form
    const [inviteEmail, setInviteEmail] = useState('');
    const [isInviting, setIsInviting] = useState(false);

    // Custom Alert State
    const [alertVisible, setAlertVisible] = useState(false);
    const [alertConfig, setAlertConfig] = useState({ title: '', message: '', buttons: [] });

    const showAlert = (title, message, buttons = []) => {
        setAlertConfig({ title, message, buttons });
        setAlertVisible(true);
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        try {
            const token = await SecureStore.getItemAsync('userToken');
            if (!token) {
                showAlert("Session Error", "Please logout and login again.");
                setLoading(false);
                return;
            }

            const response = await fetch(`${API_URL}/system-init/getAllUsers`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'application/json'
                }
            });
            const data = await response.json();
            if (response.ok) {
                setUsers(data);
            } else {
                showAlert("Error", data.err || "Failed to fetch users");
            }
        } catch (error) {
            console.error("[SuperAdminRights] Fetch error:", error);
            showAlert("Network Error", "Could not connect to server");
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const handlePromote = (email) => {
        showAlert(
            "Promote to Admin",
            `Are you sure you want to promote ${email} to Admin?`,
            [
                { text: "Cancel", style: "cancel" },
                { text: "Promote", onPress: () => processPromotion(email) }
            ]
        );
    };

    const processPromotion = async (email) => {
        try {
            const token = await SecureStore.getItemAsync('userToken');
            const response = await fetch(`${API_URL}/auth/promoteToAdmin`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ email })
            });

            if (response.ok) {
                showAlert("Success", "User promoted to Admin successfully");
                fetchUsers();
            } else {
                const data = await response.json();
                showAlert("Error", data.err || "Failed to promote user");
            }
        } catch (error) {
            showAlert("Error", "Something went wrong");
        }
    };

    const handleDemote = (email) => {
        showAlert(
            "Demote to User",
            `Are you sure you want to demote ${email} to a regular User?`,
            [
                { text: "Cancel", style: "cancel" },
                { text: "Demote", onPress: () => processDemotion(email), style: "destructive" }
            ]
        );
    };

    const processDemotion = async (email) => {
        try {
            const token = await SecureStore.getItemAsync('userToken');
            const response = await fetch(`${API_URL}/auth/demoteToUser`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ email })
            });

            if (response.ok) {
                showAlert("Success", "User demoted to regular User successfully");
                fetchUsers();
            } else {
                const data = await response.json();
                showAlert("Error", data.err || "Failed to demote user");
            }
        } catch (error) {
            showAlert("Error", "Something went wrong");
        }
    };

    const handleDelete = (email) => {
        showAlert(
            "Delete User",
            `Are you sure you want to permanently delete ${email}?`,
            [
                { text: "Cancel", style: "cancel" },
                { text: "Delete", onPress: () => processDelete(email), style: "destructive" }
            ]
        );
    };

    const processDelete = async (email) => {
        try {
            const token = await SecureStore.getItemAsync('userToken');
            const response = await fetch(`${API_URL}/auth/deleteUser`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ email })
            });

            if (response.ok) {
                showAlert("Success", "User deleted successfully");
                fetchUsers();
            } else {
                const data = await response.json();
                showAlert("Error", data.err || "Failed to delete user");
            }
        } catch (error) {
            showAlert("Error", "Something went wrong");
        }
    };

    const handleRemoveFromOrg = (email) => {
        showAlert(
            "Remove from Organization",
            `Are you sure you want to remove ${email} from their organization?`,
            [
                { text: "Cancel", style: "cancel" },
                { text: "Remove", onPress: () => processRemoveFromOrg(email), style: "destructive" }
            ]
        );
    };

    const processRemoveFromOrg = async (email) => {
        try {
            const token = await SecureStore.getItemAsync('userToken');
            const response = await fetch(`${API_URL}/auth/removeFromOrg`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ email })
            });

            if (response.ok) {
                showAlert("Success", "User removed from organization");
                fetchUsers();
            } else {
                const data = await response.json();
                showAlert("Error", data.err || "Failed to remove user");
            }
        } catch (error) {
            showAlert("Error", "Network error");
        }
    };

    const handleInviteUser = async () => {
        if (!inviteEmail) {
            showAlert("Input Error", "Please provide a user email.");
            return;
        }

        setIsInviting(true);
        try {
            const token = await SecureStore.getItemAsync('userToken');
            const response = await fetch(`${API_URL}/auth/addToOrg`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ email: inviteEmail, orgName: auth_org })
            });

            const data = await response.json();
            if (response.ok) {
                showAlert("Success", `User ${inviteEmail} invited to ${auth_org}!`);
                setInviteEmail('');
                fetchUsers();
            } else {
                showAlert("Failed", data.err || "Could not invite user");
            }
        } catch (error) {
            showAlert("Error", "Network connection failed");
        } finally {
            setIsInviting(false);
        }
    };

    const renderUser = ({ item }) => (
        <View style={[styles.userCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <View style={styles.userInfo}>
                <View style={[styles.avatar, { backgroundColor: item.role === 'admin' ? colors.purple : item.role === 'superadmin' ? '#333' : colors.primary }]}>
                    <Text style={styles.avatarText}>{item.username?.charAt(0).toUpperCase()}</Text>
                </View>
                <View style={styles.userDetails}>
                    <Text style={[styles.username, { color: theme.text }]}>{item.username}</Text>
                    <Text style={[styles.email, { color: theme.textSecondary }]}>{item.email}</Text>
                    <View style={styles.badgeRow}>
                        <View style={[styles.roleBadge, { backgroundColor: item.role === 'superadmin' ? '#fde68a' : item.role === 'admin' ? '#ede9fe' : '#ecfdf5' }]}>
                            <Text style={[styles.roleText, { color: item.role === 'superadmin' ? '#92400e' : item.role === 'admin' ? '#5b21b6' : '#047857' }]}>
                                {item.role.toUpperCase()}
                            </Text>
                        </View>
                        <View style={[styles.orgBadge, { backgroundColor: theme.background }]}>
                            <Text style={[styles.orgText, { color: theme.textSecondary }]}>{item.org || 'Solo'}</Text>
                        </View>
                    </View>
                </View>
            </View>

            <View style={styles.actions}>
                {item.role !== 'admin' && item.role !== 'superadmin' && (
                    <TouchableOpacity
                        style={[styles.actionBtn, { backgroundColor: isDark ? '#333' : '#f0f0f0' }]}
                        onPress={() => handlePromote(item.email)}
                    >
                        <Ionicons name="shield-outline" size={18} color={colors.purple} />
                        <Text style={[styles.actionText, { color: colors.purple }]}>Admin</Text>
                    </TouchableOpacity>
                )}

                {item.role === 'admin' && (
                    <TouchableOpacity
                        style={[styles.actionBtn, { backgroundColor: isDark ? '#333' : '#f0f0f0' }]}
                        onPress={() => handleDemote(item.email)}
                    >
                        <Ionicons name="arrow-down-outline" size={18} color={colors.red} />
                        <Text style={[styles.actionText, { color: colors.red }]}>Demote</Text>
                    </TouchableOpacity>
                )}

                {item.org !== 'solo' && item.role !== 'superadmin' && (
                    <TouchableOpacity
                        style={[styles.actionBtn, { backgroundColor: isDark ? '#333' : '#f0f0f0' }]}
                        onPress={() => handleRemoveFromOrg(item.email)}
                    >
                        <Ionicons name="person-remove-outline" size={18} color={colors.secondary} />
                        <Text style={[styles.actionText, { color: colors.secondary }]}>Remove</Text>
                    </TouchableOpacity>
                )}

                {item.role !== 'superadmin' && (
                    <TouchableOpacity
                        style={[styles.actionBtn, { backgroundColor: isDark ? '#333' : '#f0f0f0' }]}
                        onPress={() => handleDelete(item.email)}
                    >
                        <Ionicons name="trash-outline" size={18} color={colors.red} />
                        <Text style={[styles.actionText, { color: colors.red }]}>Delete</Text>
                    </TouchableOpacity>
                )}
            </View>
        </View>
    );

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color={theme.text} />
                </TouchableOpacity>
                <View>
                    <Text style={[styles.headerTitle, { color: theme.text }]}>Master User Control</Text>
                    <Text style={[styles.headerSubtitle, { color: theme.textSecondary }]}>System-wide administrator rights</Text>
                </View>
            </View>

            <KeyboardAvoidingView
                behavior={Platform.OS === "ios" ? "padding" : "height"}
                style={{ flex: 1 }}
            >
                <FlatList
                    data={users}
                    keyExtractor={(item) => item._id}
                    renderItem={renderUser}
                    contentContainerStyle={styles.listContent}
                    refreshControl={
                        <RefreshControl refreshing={refreshing} onRefresh={() => {
                            setRefreshing(true);
                            fetchUsers();
                        }} />
                    }
                    ListHeaderComponent={
                        <View style={[styles.inviteCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                            <Text style={[styles.inviteTitle, { color: theme.text }]}>Add System Member</Text>
                            <View style={styles.inviteRow}>
                                <TextInput
                                    style={[styles.inviteInput, { backgroundColor: theme.background, color: theme.text, flex: 1 }]}
                                    placeholder="User Email"
                                    placeholderTextColor={theme.textLight}
                                    value={inviteEmail}
                                    onChangeText={setInviteEmail}
                                    autoCapitalize="none"
                                />
                                <TouchableOpacity
                                    style={[styles.inviteBtn, { backgroundColor: colors.primary, height: 48 }]}
                                    onPress={handleInviteUser}
                                    disabled={isInviting}
                                >
                                    {isInviting ? (
                                        <ActivityIndicator size="small" color="#FFF" />
                                    ) : (
                                        <Ionicons name="person-add" size={24} color="#FFF" />
                                    )}
                                </TouchableOpacity>
                            </View>
                        </View>
                    }
                    ListEmptyComponent={
                        <View style={styles.emptyContainer}>
                            <Ionicons name="people-outline" size={60} color={theme.textLight} />
                            <Text style={[styles.emptyText, { color: theme.textSecondary }]}>No members fetched</Text>
                        </View>
                    }
                />
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
        padding: 20,
        paddingTop: 10,
    },
    backButton: {
        marginRight: 15,
        padding: 5,
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: 'bold',
    },
    headerSubtitle: {
        fontSize: 14,
        marginTop: 2,
    },
    listContent: {
        padding: 20,
        paddingBottom: 40,
    },
    inviteCard: {
        padding: 20,
        borderRadius: 20,
        marginBottom: 24,
        borderWidth: 1,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 3,
    },
    inviteTitle: {
        fontSize: 18,
        fontWeight: '700',
        marginBottom: 15,
    },
    inviteRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    inviteInputs: {
        flex: 1,
        gap: 8,
    },
    inviteInput: {
        height: 48,
        borderRadius: 12,
        paddingHorizontal: 16,
        fontSize: 14,
    },
    inviteBtn: {
        width: 56,
        height: 104, // Height of two inputs + gap
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
    userCard: {
        borderRadius: 16,
        padding: 16,
        marginBottom: 16,
        borderWidth: 1,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    userInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
    },
    avatar: {
        width: 50,
        height: 50,
        borderRadius: 25,
        alignItems: 'center',
        justifyContent: 'center',
    },
    avatarText: {
        color: '#FFF',
        fontSize: 20,
        fontWeight: 'bold',
    },
    userDetails: {
        marginLeft: 15,
        flex: 1,
    },
    username: {
        fontSize: 18,
        fontWeight: 'bold',
    },
    email: {
        fontSize: 13,
        marginBottom: 6,
    },
    badgeRow: {
        flexDirection: 'row',
        gap: 8,
    },
    roleBadge: {
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 6,
    },
    roleText: {
        fontSize: 10,
        fontWeight: 'bold',
    },
    orgBadge: {
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 6,
        borderWidth: 1,
        borderColor: 'rgba(0,0,0,0.05)',
    },
    orgText: {
        fontSize: 10,
        fontWeight: '600',
    },
    actions: {
        flexDirection: 'row',
        borderTopWidth: 1,
        borderTopColor: 'rgba(0,0,0,0.05)',
        paddingTop: 12,
        justifyContent: 'flex-end',
        gap: 10,
    },
    actionBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 8,
    },
    actionText: {
        marginLeft: 4,
        fontSize: 12,
        fontWeight: '600',
    },
    emptyContainer: {
        marginTop: 60,
        alignItems: 'center',
    },
    emptyText: {
        marginTop: 10,
        fontSize: 16,
    },
});
