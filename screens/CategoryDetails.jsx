import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, FlatList, Modal, ScrollView, TouchableWithoutFeedback } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useSelector } from 'react-redux';
import { useNavigation, useRoute } from '@react-navigation/native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { ICONS, getCategoryIcon } from '../constants/icons';
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
    const [selectedItem, setSelectedItem] = useState(null);

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
            <TouchableOpacity onPress={() => setSelectedItem(item)} activeOpacity={0.8}>
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

            {/* Detail Modal */}
            {selectedItem && (
                <Modal
                    visible={!!selectedItem}
                    transparent={true}
                    animationType="fade"
                    onRequestClose={() => setSelectedItem(null)}
                >
                    <TouchableOpacity
                        style={styles.modalOverlay}
                        activeOpacity={1}
                        onPress={() => setSelectedItem(null)}
                    >
                        <TouchableWithoutFeedback>
                            <View style={[styles.modalContent, { backgroundColor: theme.surface }]}>
                                <ScrollView showsVerticalScrollIndicator={false}>

                                    {/* Header Section */}
                                    <View style={{ alignItems: 'center', marginBottom: 20 }}>
                                        <View style={[styles.iconContainer, { backgroundColor: isDark ? 'rgba(59, 130, 246, 0.1)' : '#eff6ff' }]}>
                                            <MaterialCommunityIcons name={getCategoryIcon(selectedItem.taxon?.category)} size={32} color={theme.primary} />
                                        </View>
                                        <Text style={[styles.modalTitle, { color: theme.text, marginTop: 12, textAlign: 'center' }]}>
                                            {selectedItem.taxon?.common_name}
                                        </Text>
                                        {selectedItem.taxon?.scientific_name && (
                                            <Text style={[styles.modalSubtitle, { color: theme.textSecondary }]}>
                                                {selectedItem.taxon.scientific_name}
                                            </Text>
                                        )}
                                        <View style={[styles.badge, { backgroundColor: theme.border, marginTop: 8 }]}>
                                            <Text style={{ fontSize: 12, fontWeight: '600', color: theme.textSecondary }}>
                                                {selectedItem.taxon?.category} • Qty: {selectedItem.count}
                                            </Text>
                                        </View>
                                    </View>

                                    {/* Info Grid */}
                                    <View style={[styles.infoSection, { backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)', padding: 15, borderRadius: 16 }]}>
                                        <InfoRow
                                            icon="calendar-clock"
                                            label="Observed On"
                                            value={new Date(selectedItem.observedDate).toLocaleString()}
                                            theme={theme}
                                            iconColor={colors.vividPink}
                                        />
                                        <InfoRow
                                            icon="calendar-plus"
                                            label="Record Created"
                                            value={new Date(selectedItem.createdDate || selectedItem.createdAt).toLocaleString()}
                                            theme={theme}
                                            iconColor={colors.electricCyan}
                                        />
                                        <InfoRow
                                            icon="account"
                                            label="Contributor"
                                            value={selectedItem.contributor}
                                            theme={theme}
                                            iconColor={colors.neonPurple}
                                        />
                                        <InfoRow
                                            icon="map-marker"
                                            label="Location"
                                            value={Array.isArray(selectedItem.location_name) ? selectedItem.location_name.join(', ') : (selectedItem.location_name || "Unknown Area")}
                                            theme={theme}
                                            iconColor={colors.electricLime}
                                        />
                                        <InfoRow
                                            icon="crosshairs-gps"
                                            label="Coordinates"
                                            value={
                                                Array.isArray(selectedItem.location)
                                                    ? `${selectedItem.location[0]}, ${selectedItem.location[1]}`
                                                    : (selectedItem.location?.coordinates
                                                        ? `${selectedItem.location.coordinates[1]?.toFixed(5)}, ${selectedItem.location.coordinates[0]?.toFixed(5)}`
                                                        : "N/A")
                                            }
                                            theme={theme}
                                            iconColor={colors.warmPeach}
                                        />
                                    </View>

                                    {/* Notes */}
                                    {selectedItem.notes && (
                                        <View style={[styles.notesContainer, { backgroundColor: theme.background }]}>
                                            <Text style={[styles.sectionLabel, { color: theme.textSecondary }]}>NOTES</Text>
                                            <Text style={[styles.noteText, { color: theme.text }]}>{selectedItem.notes}</Text>
                                        </View>
                                    )}

                                </ScrollView>
                            </View>
                        </TouchableWithoutFeedback>
                    </TouchableOpacity>
                </Modal>
            )}
        </SafeAreaView>
    );
}

const InfoRow = ({ icon, label, value, theme, iconColor }) => (
    <View style={styles.infoRow}>
        <View style={[styles.miniIconCircle, { backgroundColor: iconColor ? `${iconColor}20` : 'rgba(0,0,0,0.05)' }]}>
            <MaterialCommunityIcons name={icon} size={18} color={iconColor || theme.textSecondary} />
        </View>
        <View style={{ flex: 1 }}>
            <Text style={[styles.infoLabel, { color: theme.textSecondary }]}>{label}</Text>
            <Text style={[styles.infoValue, { color: theme.text }]}>{value}</Text>
        </View>
    </View>
);

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
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center', // Center vertically
        alignItems: 'center', // Center horizontally
        padding: 24, // Add padding so card doesn't touch screen edges
    },
    modalContent: {
        width: '100%',
        borderRadius: 24, // Rounded corners for card look
        padding: 24,
        maxHeight: '80%', // Allow card to be taller but not full screen
        elevation: 10,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 5 },
        shadowOpacity: 0.15,
        shadowRadius: 10,
    },
    iconContainer: {
        width: 64,
        height: 64,
        borderRadius: 32,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 8
    },
    modalTitle: {
        fontSize: 22,
        fontWeight: '800',
    },
    modalSubtitle: {
        fontSize: 16,
        fontStyle: 'italic',
        marginTop: 4
    },
    badge: {
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 12,
    },
    infoSection: {
        marginTop: 10,
        marginBottom: 20
    },
    infoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16
    },
    miniIconCircle: {
        width: 36,
        height: 36,
        borderRadius: 18,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12
    },
    infoLabel: {
        fontSize: 11,
        fontWeight: '700',
        marginBottom: 2,
        textTransform: 'uppercase'
    },
    infoValue: {
        fontSize: 15,
        fontWeight: '500',
        flexWrap: 'wrap',
        maxWidth: 280
    },
    notesContainer: {
        padding: 16,
        borderRadius: 12,
        marginTop: 10
    },
    sectionLabel: {
        fontSize: 12,
        fontWeight: '700',
        marginBottom: 8,
        letterSpacing: 1
    },
    noteText: {
        fontSize: 15,
        lineHeight: 22,
        fontStyle: 'italic'
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
