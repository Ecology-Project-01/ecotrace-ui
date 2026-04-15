import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, ScrollView, TextInput, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useSelector } from 'react-redux';
import { useNavigation, useRoute } from '@react-navigation/native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as SecureStore from 'expo-secure-store';
import { ICONS, getCategoryIcon } from '../constants/icons';
import colors from '../colors/colors';
import { API_URL } from '../constants/config';

const iucnColor = (status) => {
    if (!status) return null;
    const s = status.toLowerCase();
    if (s.includes('critically')) return '#C0392B';
    if (s.includes('endangered')) return '#E67E22';
    if (s.includes('vulnerable')) return '#F1C40F';
    if (s.includes('least concern')) return '#27AE60';
    if (s.includes('near threatened')) return '#F39C12';
    return '#999';
};

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

export default function RecordDetails() {
    const isDark = useSelector((state) => state.theme.isDark);
    const theme = isDark ? colors.dark : colors.light;
    const navigation = useNavigation();
    const route = useRoute();
    
    const [item, setItem] = useState(route.params?.item || null);
    const [isEditing, setIsEditing] = useState(false);
    const [saving, setSaving] = useState(false);
    
    const [editData, setEditData] = useState({
        common_name: '',
        scientific_name: '',
        family: '',
        order: '',
        count: '1',
        notes: '',
        iucn_status: ''
    });

    useEffect(() => {
        if (item && item.taxon) {
            setEditData({
                common_name: item.taxon.common_name || '',
                scientific_name: item.taxon.scientific_name || '',
                family: item.taxon.family || '',
                order: item.taxon.order || '',
                count: String(item.count || 1),
                notes: item.notes || '',
                iucn_status: item.taxon.iucn_status || ''
            });
        }
    }, [item]);

    const handleSave = async () => {
        try {
            setSaving(true);
            const token = await SecureStore.getItemAsync('userToken');
            
            const payload = {
                count: parseInt(editData.count, 10) || 1,
                notes: editData.notes,
                taxon: {
                    common_name: editData.common_name,
                    scientific_name: editData.scientific_name,
                    family: editData.family,
                    order: editData.order,
                    iucn_status: editData.iucn_status
                }
            };

            const response = await fetch(`${API_URL}/observations/${item._id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(payload)
            });

            const data = await response.json();
            if (response.ok && data.success) {
                setItem(data.data);
                setIsEditing(false);
            } else {
                Alert.alert('Error', data.message || 'Failed to update observation');
            }
        } catch (error) {
            Alert.alert('Error', error.message);
        } finally {
            setSaving(false);
        }
    };

    if (!item) {
        return null;
    }

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
            <View style={[styles.header, { borderBottomColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)' }]}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerLeft}>
                    <MaterialCommunityIcons name={ICONS.BACK} size={24} color={theme.text} />
                </TouchableOpacity>
                <View style={styles.headerCenter}>
                    <Text style={[styles.headerTitle, { color: theme.text }]} numberOfLines={1}>
                        {isEditing ? 'Editing Record' : (item.taxon?.common_name || 'Record')}
                    </Text>
                </View>
                <View style={[styles.headerRight, { width: 80, alignItems: 'flex-end', paddingRight: 10 }]}>
                    {isEditing ? (
                        saving ? (
                            <ActivityIndicator size="small" color={theme.primary} />
                        ) : (
                            <View style={{ flexDirection: 'row', gap: 12 }}>
                                <TouchableOpacity onPress={() => setIsEditing(false)}>
                                    <Text style={{ color: theme.textSecondary, fontWeight: '600' }}>Cancel</Text>
                                </TouchableOpacity>
                                <TouchableOpacity onPress={handleSave}>
                                    <Text style={{ color: theme.primary, fontWeight: '700' }}>Save</Text>
                                </TouchableOpacity>
                            </View>
                        )
                    ) : (
                        <TouchableOpacity onPress={() => setIsEditing(true)}>
                            <MaterialCommunityIcons name="pencil" size={22} color={theme.primary} />
                        </TouchableOpacity>
                    )}
                </View>
            </View>

            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={true}
            >
                {/* Header Section */}
                <View style={[styles.heroSection, { backgroundColor: theme.surface }]}>
                    <View style={[styles.iconContainer, { backgroundColor: isDark ? 'rgba(255,64,129,0.15)' : 'rgba(255,64,129,0.08)' }]}>
                        <MaterialCommunityIcons name={getCategoryIcon(item.taxon?.category)} size={36} color={theme.primary} />
                    </View>
                    
                    {isEditing ? (
                        <TextInput
                            style={[styles.pageTitle, { color: theme.text, borderBottomWidth: 1, borderColor: theme.border, padding: 5, minWidth: '60%', marginTop: 10 }]}
                            value={editData.common_name}
                            onChangeText={(val) => setEditData({...editData, common_name: val})}
                            placeholder="Common Name"
                            placeholderTextColor={theme.textSecondary}
                        />
                    ) : (
                        <Text style={[styles.pageTitle, { color: theme.text }]}>
                            {item.taxon?.common_name}
                        </Text>
                    )}

                    {isEditing ? (
                        <TextInput
                            style={[styles.scientificName, { color: theme.textSecondary, borderBottomWidth: 1, borderColor: theme.border, padding: 5, minWidth: '50%', marginTop: 10, textAlign: 'center' }]}
                            value={editData.scientific_name}
                            onChangeText={(val) => setEditData({...editData, scientific_name: val})}
                            placeholder="Scientific Name"
                            placeholderTextColor={theme.textSecondary}
                        />
                    ) : (
                        item.taxon?.scientific_name && (
                            <Text style={[styles.scientificName, { color: theme.textSecondary }]}>
                                {item.taxon.scientific_name}
                            </Text>
                        )
                    )}

                    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 16, justifyContent: 'center', alignItems: 'center' }}>
                        <View style={[styles.badge, { backgroundColor: theme.border }]}>
                            <Text style={{ fontSize: 11, fontWeight: '700', color: theme.textSecondary }}>
                                {item.taxon?.category || 'Field'}
                            </Text>
                        </View>
                        
                        {isEditing ? (
                            <View style={[styles.badge, { backgroundColor: theme.border, flexDirection: 'row', alignItems: 'center' }]}>
                                <Text style={{ fontSize: 11, fontWeight: '700', color: theme.primary, marginRight: 4 }}>×</Text>
                                <TextInput
                                    style={{ fontSize: 11, fontWeight: '700', color: theme.primary, minWidth: 20, textAlign: 'center' }}
                                    value={editData.count}
                                    onChangeText={(val) => setEditData({...editData, count: val})}
                                    keyboardType="numeric"
                                />
                            </View>
                        ) : (
                            <View style={[styles.badge, { backgroundColor: theme.border }]}>
                                <Text style={{ fontSize: 11, fontWeight: '700', color: theme.primary }}>
                                    × {item.count}
                                </Text>
                            </View>
                        )}
                        
                        {isEditing ? (
                            <View style={[styles.badge, { backgroundColor: `${iucnColor('vulnerable')}20`, flexDirection: 'row', alignItems: 'center' }]}>
                                <MaterialCommunityIcons name="shield-check" size={12} color={iucnColor('vulnerable')} />
                                <TextInput
                                    style={{ fontSize: 11, fontWeight: '700', color: iucnColor('vulnerable'), marginLeft: 4, minWidth: 60 }}
                                    value={editData.iucn_status}
                                    placeholder="IUCN Status"
                                    placeholderTextColor={iucnColor('vulnerable')}
                                    onChangeText={(val) => setEditData({...editData, iucn_status: val})}
                                />
                            </View>
                        ) : (
                            item.taxon?.iucn_status ? (
                                <View style={[styles.badge, { backgroundColor: `${iucnColor(item.taxon.iucn_status)}20` }]}>
                                    <MaterialCommunityIcons name="shield-check" size={12} color={iucnColor(item.taxon.iucn_status)} />
                                    <Text style={{ fontSize: 11, fontWeight: '700', color: iucnColor(item.taxon.iucn_status), marginLeft: 4 }}>
                                        {item.taxon.iucn_status}
                                    </Text>
                                </View>
                            ) : null
                        )}
                    </View>
                </View>

                {/* Taxonomy Section */}
                {(isEditing || item.taxon?.family || item.taxon?.order || item.taxon?.scientific_name) && (
                    <View style={styles.section}>
                        <Text style={[styles.sectionLabel, { color: theme.textSecondary }]}>TAXONOMY</Text>
                        <View style={[styles.infoSection, { backgroundColor: theme.surface }]}>
                            {isEditing ? (
                                <>
                                    <View style={{ marginBottom: 12 }}>
                                        <Text style={[styles.infoLabel, { color: theme.textSecondary }]}>Family</Text>
                                        <TextInput
                                            style={[styles.infoValue, { color: theme.text, borderBottomWidth: 1, borderColor: theme.border, paddingBottom: 4 }]}
                                            value={editData.family}
                                            onChangeText={(val) => setEditData({...editData, family: val})}
                                            placeholder="Enter Family..."
                                            placeholderTextColor={theme.textSecondary}
                                        />
                                    </View>
                                    <View style={{ marginBottom: 12 }}>
                                        <Text style={[styles.infoLabel, { color: theme.textSecondary }]}>Order</Text>
                                        <TextInput
                                            style={[styles.infoValue, { color: theme.text, borderBottomWidth: 1, borderColor: theme.border, paddingBottom: 4 }]}
                                            value={editData.order}
                                            onChangeText={(val) => setEditData({...editData, order: val})}
                                            placeholder="Enter Order..."
                                            placeholderTextColor={theme.textSecondary}
                                        />
                                    </View>
                                </>
                            ) : (
                                <>
                                    {item.taxon?.scientific_name ? (
                                        <InfoRow icon="bird" label="Scientific Name" value={item.taxon.scientific_name} theme={theme} iconColor={theme.primary} />
                                    ) : null}
                                    {item.taxon?.family ? (
                                        <InfoRow icon="family-tree" label="Family" value={item.taxon.family} theme={theme} iconColor="#8E44AD" />
                                    ) : null}
                                    {item.taxon?.order ? (
                                        <InfoRow icon="sitemap-outline" label="Order" value={item.taxon.order} theme={theme} iconColor="#2980B9" />
                                    ) : null}
                                </>
                            )}
                        </View>
                    </View>
                )}

                {/* Notes Section - Placed before sighting details for edit visibility */}
                {(isEditing || item.notes) && (
                    <View style={styles.section}>
                        <Text style={[styles.sectionLabel, { color: theme.textSecondary }]}>NOTES</Text>
                        <View style={[styles.notesContainer, { backgroundColor: theme.surface }]}>
                            {isEditing ? (
                                <TextInput
                                    style={[styles.noteText, { color: theme.text, minHeight: 60, textAlignVertical: 'top' }]}
                                    value={editData.notes}
                                    onChangeText={(val) => setEditData({...editData, notes: val})}
                                    placeholder="Add interesting notes about this observation..."
                                    placeholderTextColor={theme.textSecondary}
                                    multiline
                                />
                            ) : (
                                <Text style={[styles.noteText, { color: theme.text }]}>{item.notes}</Text>
                            )}
                        </View>
                    </View>
                )}

                {/* Sighting Details Section (Read-only) */}
                <View style={styles.section}>
                    <Text style={[styles.sectionLabel, { color: theme.textSecondary }]}>SIGHTING DETAILS</Text>
                    <View style={[styles.infoSection, { backgroundColor: theme.surface }]}>
                        <InfoRow
                            icon="calendar-clock"
                            label="Observed On"
                            value={new Date(item.observedDate || item.observedAt || item.createdAt).toLocaleString()}
                            theme={theme}
                            iconColor={colors.vividPink}
                        />
                        <InfoRow
                            icon="calendar-plus"
                            label="Record Created"
                            value={new Date(item.createdDate || item.createdAt).toLocaleString()}
                            theme={theme}
                            iconColor={colors.electricCyan}
                        />
                        {item.contributor && (
                            <InfoRow
                                icon="account"
                                label="Added By"
                                value={item.contributor}
                                theme={theme}
                                iconColor={colors.neonPurple}
                            />
                        )}
                        <InfoRow
                            icon="map-marker"
                            label="Location"
                            value={Array.isArray(item.location_name) ? item.location_name.join(', ') : (item.location_name || 'Unknown Area')}
                            theme={theme}
                            iconColor={colors.electricLime}
                        />
                        <InfoRow
                            icon="crosshairs-gps"
                            label="Coordinates"
                            value={
                                Array.isArray(item.location)
                                    ? `${item.location[0]}, ${item.location[1]}`
                                    : (item.location?.coordinates
                                        ? `${item.location.coordinates[1]?.toFixed(5)}, ${item.location.coordinates[0]?.toFixed(5)}`
                                        : 'N/A')
                            }
                            theme={theme}
                            iconColor={colors.warmPeach}
                        />
                    </View>
                </View>

            </ScrollView>
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
        borderBottomWidth: StyleSheet.hairlineWidth,
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
        fontSize: 16,
        fontWeight: 'bold',
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        padding: 20,
        paddingBottom: 40,
    },
    heroSection: {
        alignItems: 'center',
        padding: 24,
        borderRadius: 16,
        marginBottom: 24,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
        elevation: 3,
    },
    iconContainer: {
        width: 80,
        height: 80,
        borderRadius: 40,
        alignItems: 'center',
        justifyContent: 'center',
    },
    pageTitle: {
        fontSize: 22,
        fontWeight: '700',
        marginTop: 16,
        textAlign: 'center',
        letterSpacing: 0.3,
    },
    scientificName: {
        fontSize: 16,
        fontStyle: 'italic',
        marginTop: 6,
    },
    badge: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 10,
    },
    section: {
        marginBottom: 24,
    },
    sectionLabel: {
        fontSize: 11,
        fontWeight: '700',
        marginBottom: 10,
        letterSpacing: 1.5,
        textTransform: 'uppercase',
        opacity: 0.8,
    },
    infoSection: {
        padding: 18,
        borderRadius: 14,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    infoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 14,
    },
    miniIconCircle: {
        width: 36,
        height: 36,
        borderRadius: 18,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 14,
    },
    infoLabel: {
        fontSize: 10,
        fontWeight: '700',
        marginBottom: 2,
        textTransform: 'uppercase',
        letterSpacing: 1.2,
        opacity: 0.85,
    },
    infoValue: {
        fontSize: 14,
        fontWeight: '500',
        flexWrap: 'wrap',
    },
    notesContainer: {
        padding: 18,
        borderRadius: 14,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    noteText: {
        fontSize: 15,
        lineHeight: 24,
        fontStyle: 'italic',
    },
});
