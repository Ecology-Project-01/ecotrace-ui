import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, FlatList, ActivityIndicator, Alert, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useSelector } from 'react-redux';
import { Ionicons } from '@expo/vector-icons';
import * as SecureStore from 'expo-secure-store';
import colors from '../colors/colors';
import { LinearGradient } from 'expo-linear-gradient';

const LOCAL_IP = "192.168.1.8";
const API_URL = `http://${LOCAL_IP}:4000`;

export default function AdminRights({ navigation }) {
    const isDark = useSelector((state) => state.theme.isDark);
    const { auth_role } = useSelector((state) => state.user);
    const theme = isDark ? colors.dark : colors.light;

    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        try {
            const token = await SecureStore.getItemAsync('userToken');
            if (!token) {
                console.warn("[AdminRights] No token found in SecureStore");
                Alert.alert("Session Error", "Please logout and login again.");
                setLoading(false);
                return;
            }

            console.log(`[AdminRights] Fetching users from: ${API_URL}/system-init/getAllUsers`);

            const response = await fetch(`${API_URL}/system-init/getAllUsers`, {
                method: 'GET', // Explicitly GET
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'application/json'
                }
            });
            const data = await response.json();
            if (response.ok) {
                setUsers(data);
            } else {
                Alert.alert("Error", data.err || "Failed to fetch users");
            }
        } catch (error) {
            console.error("[AdminRights] Fetch error:", error);
            Alert.alert("Network Error", "Could not connect to server");
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const handlePromote = (email) => {
        Alert.alert(
            "Promote to Admin",
            `Are you sure you want to promote ${email} to Admin?`,
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Promote",
                    onPress: () => processPromotion(email),
                    style: "default"
                }
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
                Alert.alert("Success", "User promoted to Admin successfully");
                fetchUsers();
            } else {
                const data = await response.json();
                Alert.alert("Error", data.err || "Failed to promote user");
            }
        } catch (error) {
            Alert.alert("Error", "Something went wrong");
        }
    };

    const handleDelete = (email) => {
        Alert.alert(
            "Delete User",
            `Are you sure you want to permanently delete ${email}?`,
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Delete",
                    onPress: () => processDelete(email),
                    style: "destructive"
                }
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
                Alert.alert("Success", "User deleted successfully");
                fetchUsers();
            } else {
                const data = await response.json();
                Alert.alert("Error", data.err || "Failed to delete user");
            }
        } catch (error) {
            Alert.alert("Error", "Something went wrong");
        }
    };

    const renderUser = ({ item }) => (
        <View style={[styles.userCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <View style={styles.userInfo}>
                <View style={[styles.avatar, { backgroundColor: item.role === 'admin' ? colors.purple : colors.primary }]}>
                    <Text style={styles.avatarText}>{item.username?.charAt(0).toUpperCase()}</Text>
                </View>
                <View style={styles.userDetails}>
                    <Text style={[styles.username, { color: theme.text }]}>{item.username}</Text>
                    <Text style={[styles.email, { color: theme.textSecondary }]}>{item.email}</Text>
                    <View style={[styles.roleBadge, { backgroundColor: item.role === 'admin' || item.role === 'superadmin' ? colors.softPurple : colors.softGreen }]}>
                        <Text style={[styles.roleText, { color: item.role === 'admin' || item.role === 'superadmin' ? colors.purple : colors.primary }]}>
                            {item.role.toUpperCase()}
                        </Text>
                    </View>
                </View>
            </View>

            <View style={styles.actions}>
                {item.role === 'user' && (
                    <TouchableOpacity
                        style={[styles.actionBtn, { backgroundColor: theme.isDark ? '#333' : '#f0f0f0' }]}
                        onPress={() => handlePromote(item.email)}
                    >
                        <Ionicons name="shield-outline" size={20} color={colors.purple} />
                        <Text style={[styles.actionText, { color: colors.purple }]}>Promote</Text>
                    </TouchableOpacity>
                )}

                <TouchableOpacity
                    style={[styles.actionBtn, { backgroundColor: theme.isDark ? '#333' : '#f0f0f0' }]}
                    onPress={() => handleDelete(item.email)}
                >
                    <Ionicons name="trash-outline" size={20} color={colors.red} />
                    <Text style={[styles.actionText, { color: colors.red }]}>Delete</Text>
                </TouchableOpacity>
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
                    <Text style={[styles.headerTitle, { color: theme.text }]}>User Management</Text>
                    <Text style={[styles.headerSubtitle, { color: theme.textSecondary }]}>
                        Manage access and permissions
                    </Text>
                </View>
            </View>

            {loading ? (
                <View style={styles.center}>
                    <ActivityIndicator size="large" color={colors.primary} />
                </View>
            ) : (
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
                    ListEmptyComponent={
                        <View style={styles.emptyContainer}>
                            <Ionicons name="people-outline" size={60} color={theme.textLight} />
                            <Text style={[styles.emptyText, { color: theme.textSecondary }]}>No users found</Text>
                        </View>
                    }
                />
            )}
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
        fontSize: 14,
        marginBottom: 5,
    },
    roleBadge: {
        alignSelf: 'flex-start',
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 8,
    },
    roleText: {
        fontSize: 10,
        fontWeight: 'bold',
    },
    actions: {
        flexDirection: 'row',
        borderTopWidth: 1,
        borderTopColor: '#eee',
        paddingTop: 12,
        justifyContent: 'flex-end',
        gap: 10,
    },
    actionBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 15,
        paddingVertical: 8,
        borderRadius: 10,
    },
    actionText: {
        marginLeft: 6,
        fontSize: 14,
        fontWeight: '600',
    },
    center: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    emptyContainer: {
        marginTop: 100,
        alignItems: 'center',
    },
    emptyText: {
        marginTop: 10,
        fontSize: 16,
    },
});
