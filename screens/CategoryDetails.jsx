import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, FlatList, Modal, ScrollView, TouchableWithoutFeedback } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useSelector } from 'react-redux';
import { useNavigation, useRoute } from '@react-navigation/native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { ICONS, getCategoryIcon } from '../constants/icons';
import colors from '../colors/colors';

export default function CategoryDetails() {
    const isDark = useSelector((state) => state.theme.isDark);
    const theme = isDark ? colors.dark : colors.light;
    const navigation = useNavigation();
    const route = useRoute();
    const { category, items } = route.params;

    const [selectedItem, setSelectedItem] = useState(null);

    const renderItem = ({ item }) => (
        <TouchableOpacity onPress={() => setSelectedItem(item)} activeOpacity={0.8}>
            <View style={[styles.card, { backgroundColor: theme.surface }]}>
                <View style={styles.cardHeader}>
                    <Text style={[styles.commonName, { color: theme.text }]}>{item.taxon?.common_name}</Text>
                    <Text style={[styles.date, { color: theme.textSecondary }]}>
                        {new Date(item.observedAt || item.createdAt).toLocaleDateString()}
                    </Text>
                </View>
                <Text style={[styles.scientificName, { color: theme.primary }]}>
                    {item.taxon?.scientific_name ? `${item.taxon.scientific_name} • ` : ''}{item.location_name || "Unknown Location"}
                </Text>
                <Text style={[styles.details, { color: theme.textSecondary }]}>
                    Count: {item.count} • {item.distance ? (item.distance < 1 ? `${(item.distance * 1000).toFixed(0)} m` : `${item.distance.toFixed(2)} km`) : "0 m"}
                </Text>
                {item.notes ? <Text numberOfLines={2} style={[styles.notes, { color: theme.textSecondary }]}>"{item.notes}"</Text> : null}
            </View>
        </TouchableOpacity>
    );

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerLeft}>
                    <MaterialCommunityIcons name={ICONS.BACK} size={24} color={theme.text} />
                </TouchableOpacity>
                <View style={styles.headerCenter}>
                    <Text style={[styles.headerTitle, { color: theme.text }]}>{category} ({items.length})</Text>
                </View>
                <View style={styles.headerRight} />
            </View>

            {items.length === 0 ? (
                <View style={styles.empty}>
                    <Text style={{ color: theme.textSecondary }}>No records found.</Text>
                </View>
            ) : (
                <FlatList
                    data={items}
                    keyExtractor={(item) => item._id}
                    renderItem={renderItem}
                    contentContainerStyle={styles.content}
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
                                    <View style={styles.infoSection}>
                                        <InfoRow
                                            icon="calendar"
                                            label="Observed"
                                            value={new Date(selectedItem.observedAt || selectedItem.createdAt).toLocaleString()}
                                            theme={theme}
                                        />
                                        <InfoRow
                                            icon="account"
                                            label="Contributor"
                                            value={selectedItem.contributor}
                                            theme={theme}
                                        />
                                        <InfoRow
                                            icon="map-marker"
                                            label="Location"
                                            value={selectedItem.location_name || "Unknown Area"}
                                            theme={theme}
                                        />
                                        <InfoRow
                                            icon="crosshairs-gps"
                                            label="Coordinates"
                                            value={`${selectedItem.location?.coordinates[1]?.toFixed(5)}, ${selectedItem.location?.coordinates[0]?.toFixed(5)}`}
                                            theme={theme}
                                        />
                                        {selectedItem.distance > 0 && (
                                            <InfoRow
                                                icon="walk"
                                                label="Distance"
                                                value={selectedItem.distance < 1 ? `${(selectedItem.distance * 1000).toFixed(0)} meters` : `${selectedItem.distance.toFixed(2)} km`}
                                                theme={theme}
                                            />
                                        )}
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

const InfoRow = ({ icon, label, value, theme }) => (
    <View style={styles.infoRow}>
        <MaterialCommunityIcons name={icon} size={20} color={theme.textSecondary} style={{ width: 30 }} />
        <View>
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
        alignItems: 'center',
        marginBottom: 4,
    },
    commonName: {
        fontSize: 18,
        fontWeight: 'bold',
    },
    scientificName: {
        fontSize: 14,
        fontStyle: 'italic',
        marginBottom: 8,
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
        alignItems: 'flex-start',
        marginBottom: 16
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
    }
});
