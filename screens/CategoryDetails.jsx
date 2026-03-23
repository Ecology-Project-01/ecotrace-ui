import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useSelector } from 'react-redux';
import { useNavigation, useRoute } from '@react-navigation/native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { ICONS } from '../constants/icons';
import colors from '../colors/colors';

import { API_URL } from '../constants/config';
import * as SecureStore from 'expo-secure-store';
import { ActivityIndicator } from 'react-native';

export default function CategoryDetails() {
    const isDark = useSelector((state) => state.theme.isDark);
    const theme = isDark ? colors.dark : colors.light;
    const navigation = useNavigation();
    const route = useRoute();
    const { category } = route.params;

    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalRecords, setTotalRecords] = useState(0);
    useEffect(() => {
        fetchCategoryData(page);
    }, [page]);

    const fetchCategoryData = async (pageNum = 1) => {
        setLoading(true);
        try {
            const token = await SecureStore.getItemAsync('userToken');
            // Fetch ONLY the records for this category with pagination
            const response = await fetch(`${API_URL}/observations?category=${category}&page=${pageNum}&limit=10`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (!response.ok) throw new Error("Failed to fetch");

            const result = await response.json();
            setItems(result.data || []);
            setTotalPages(result.pages || 1);
            setTotalRecords(result.total || 0);
        } catch (error) {
            console.error("Error fetching category details:", error);
        } finally {
            setLoading(false);
        }
    };

    const renderItem = ({ item }) => {
        const categoryColor = theme.primary; // Or map specific colors to categories

        return (
            <TouchableOpacity onPress={() => navigation.navigate('RecordDetails', { item })} activeOpacity={0.8}>
                <View style={[
                    styles.card,
                    {
                        backgroundColor: theme.surface,
                        borderLeftWidth: 4,
                        borderLeftColor: categoryColor
                    }
                ]}>
                    <View style={styles.cardHeader}>
                        <View style={{ flex: 1 }}>
                            <Text style={[styles.commonName, { color: theme.text }]}>{item.taxon?.common_name}</Text>
                            <Text style={[styles.scientificName, { color: theme.textSecondary, fontSize: 13 }]}>
                                {item.taxon?.scientific_name || "Unknown Species"}
                            </Text>
                        </View>
                        <View style={[styles.countBadge, { backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)' }]}>
                            <Text style={[styles.countText, { color: theme.primary }]}>{item.count}x</Text>
                        </View>
                    </View>

                    <View style={styles.cardFooter}>
                        <View style={styles.footerItem}>
                            <MaterialCommunityIcons name="map-marker" size={14} color={theme.textLight} />
                            <Text numberOfLines={1} style={[styles.footerText, { color: theme.textSecondary }]}>
                                {Array.isArray(item.location_name) ? item.location_name[0] : (item.location_name || "Unknown")}
                            </Text>
                        </View>
                        {item.taxon?.family ? (
                            <View style={styles.footerItem}>
                                <MaterialCommunityIcons name="family-tree" size={14} color={theme.textLight} />
                                <Text style={[styles.footerText, { color: theme.textSecondary }]}>
                                    {item.taxon.family}
                                </Text>
                            </View>
                        ) : null}
                        <View style={styles.footerItem}>
                            <MaterialCommunityIcons name="calendar" size={14} color={theme.textLight} />
                            <Text style={[styles.footerText, { color: theme.textSecondary }]}>
                                {new Date(item.observedDate || item.createdAt).toLocaleDateString()}
                            </Text>
                        </View>
                    </View>
                </View>
            </TouchableOpacity>
        );
    };

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerLeft}>
                    <MaterialCommunityIcons name={ICONS.BACK} size={24} color={theme.text} />
                </TouchableOpacity>
                <View style={styles.headerCenter}>
                    <Text style={[styles.headerTitle, { color: theme.text }]}>{category} ({totalRecords})</Text>
                </View>
                <View style={styles.headerRight} />
            </View>

            {loading ? (
                <View style={styles.empty}>
                    <ActivityIndicator size="large" color={theme.primary} />
                </View>
            ) : items.length === 0 ? (
                <View style={styles.empty}>
                    <Text style={{ color: theme.textSecondary }}>No records found.</Text>
                </View>
            ) : (
                <FlatList
                    data={items}
                    keyExtractor={(item) => item._id}
                    renderItem={renderItem}
                    contentContainerStyle={styles.content}
                    ListFooterComponent={
                        totalPages > 1 && (
                            <View style={styles.pagination}>
                                <TouchableOpacity
                                    onPress={() => setPage(p => Math.max(1, p - 1))}
                                    disabled={page === 1}
                                    style={[styles.pageBtn, page === 1 && { opacity: 0.3 }]}
                                >
                                    <MaterialCommunityIcons name="chevron-left" size={24} color={theme.primary} />
                                    <Text style={{ color: theme.primary, fontWeight: 'bold' }}>PREV</Text>
                                </TouchableOpacity>

                                <Text style={[styles.pageIndicator, { color: theme.textSecondary }]}>
                                    {page} / {totalPages}
                                </Text>

                                <TouchableOpacity
                                    onPress={() => setPage(p => Math.min(totalPages, p + 1))}
                                    disabled={page === totalPages}
                                    style={[styles.pageBtn, page === totalPages && { opacity: 0.3 }]}
                                >
                                    <Text style={{ color: theme.primary, fontWeight: 'bold' }}>NEXT</Text>
                                    <MaterialCommunityIcons name="chevron-right" size={24} color={theme.primary} />
                                </TouchableOpacity>
                            </View>
                        )
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
        paddingHorizontal: 16,
        paddingVertical: 12,
        marginBottom: 8,
    },
    headerLeft: {
        width: 40,
        alignItems: 'flex-start',
    },
    headerCenter: {
        flex: 1,
        alignItems: 'center',
    },
    headerRight: {
        width: 40,
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: 'bold',
    },
    content: {
        padding: 16,
    },
    card: {
        padding: 16,
        borderRadius: 12,
        marginBottom: 12,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 12,
    },
    commonName: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 2,
    },
    scientificName: {
        fontSize: 14,
        fontStyle: 'italic',
    },
    countBadge: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
        marginLeft: 8,
    },
    countText: {
        fontSize: 12,
        fontWeight: 'bold',
    },
    cardFooter: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: 'rgba(0,0,0,0.05)',
    },
    footerItem: {
        flexDirection: 'row',
        alignItems: 'center',
        marginRight: 16,
    },
    footerText: {
        fontSize: 12,
        marginLeft: 4,
    },
    date: {
        fontSize: 12,
    },
    details: {
        fontSize: 14,
        marginBottom: 4,
    },
    notes: {
        fontSize: 14,
        fontStyle: 'italic',
        marginTop: 4,
    },
    empty: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center'
    },
    pagination: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingVertical: 12,
        borderTopWidth: 1,
        borderTopColor: 'rgba(0,0,0,0.05)',
        marginTop: 10,
    },
    pageBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 8,
    },
    pageIndicator: {
        fontSize: 12,
        fontWeight: 'bold',
        letterSpacing: 1,
    },
});
