import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, ScrollView, FlatList, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useSelector } from 'react-redux';
import { useNavigation } from '@react-navigation/native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import colors from '../colors/colors';
import { CATEGORIES } from '../constants/categories';
import { ICONS, getCategoryIcon } from '../constants/icons';

import * as SecureStore from 'expo-secure-store';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import CustomAlert from '../components/CustomAlert';

const LOCAL_IP = "192.168.1.8";
const API_URL = `http://${LOCAL_IP}:4000`;

// Defined outside to prevent re-creation and potential context issues
const CategoryCard = ({ category, items = [], theme, navigation }) => (
    <TouchableOpacity
        style={[styles.card, { backgroundColor: theme?.surface || '#fff' }]}
        activeOpacity={0.7}
        onPress={() => navigation.navigate('CategoryDetails', { category, items })}
    >
        <View style={styles.iconContainer}>
            <MaterialCommunityIcons
                name={getCategoryIcon(category)}
                size={24}
                color={theme?.primary || '#000'}
            />
        </View>
        <View style={styles.cardContent}>
            <Text style={[styles.cardTitle, { color: theme?.text || '#000' }]}>{category}</Text>
            <Text style={[styles.cardSubtitle, { color: theme?.textSecondary || '#666' }]}>
                {items?.length || 0} Records
            </Text>
        </View>
        <MaterialCommunityIcons name={ICONS.CHEVRON_RIGHT} size={24} color={theme?.textLight || '#ccc'} />
    </TouchableOpacity>
);

export default function Results() {
    // Redux selectors with default values/fallbacks to prevent crashes
    const isDark = useSelector((state) => state?.theme?.isDark || false);
    const userState = useSelector((state) => state?.user || {});
    const { auth_email, auth_username } = userState;

    // Safely determine theme
    const theme = isDark ? (colors.dark || {}) : (colors.light || {});
    const navigation = useNavigation();

    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({});
    const [allData, setAllData] = useState([]);

    // Custom Alert State
    const [alertVisible, setAlertVisible] = useState(false);
    const [alertConfig, setAlertConfig] = useState({ title: '', message: '', buttons: [] });

    const showAlert = (title, message, buttons = []) => {
        setAlertConfig({ title, message, buttons });
        setAlertVisible(true);
    };

    useEffect(() => {
        fetchObservations();
    }, []);

    const fetchObservations = async () => {
        try {
            const token = await SecureStore.getItemAsync('userToken');

            const response = await fetch(`${API_URL}/observations`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                console.warn("Server returned error status:", response.status);
                setAllData([]);
                setStats({});
                setLoading(false);
                return;
            }

            const data = await response.json();

            if (Array.isArray(data)) {
                setAllData(data);
                processCategories(data);
            } else {
                console.warn("Received non-array response:", data);
                setAllData([]);
                setStats({});
            }
        } catch (error) {
            console.error("Error fetching results:", error);
            setAllData([]);
            setStats({});
        } finally {
            setLoading(false);
        }
    };

    const processCategories = (data = []) => {
        if (!Array.isArray(data)) return;

        const counts = {};
        // Initialize counts for each category
        (CATEGORIES || []).forEach(cat => {
            if (cat) counts[cat] = [];
        });

        // Ensure 'Other' exists
        if (!counts['Other']) counts['Other'] = [];

        data.forEach(obs => {
            if (!obs) return; // Skip if null/undefined

            const catName = obs.taxon?.category;
            if (catName && counts[catName]) {
                counts[catName].push(obs);
            } else {
                counts['Other'].push(obs);
            }
        });
        setStats(counts);
    };

    const exportToCSV = async () => {
        if (allData.length === 0) {
            showAlert("No Data", "There are no observations to export.");
            return;
        }

        try {
            // Find max number of location segments across all records
            let maxLocFields = 0;
            allData.forEach(item => {
                const count = Array.isArray(item.location_name) ? item.location_name.length : (item.location_name ? 1 : 0);
                if (count > maxLocFields) maxLocFields = count;
            });

            // If no location names at all, at least have 1 col
            if (maxLocFields === 0) maxLocFields = 1;

            // Generate dynamic headers for location
            const locHeaders = [];
            for (let i = 1; i <= maxLocFields; i++) {
                locHeaders.push(`loc ${i}`);
            }

            const headers = [
                'Common Name', 'Scientific Name', 'Category', 'Count',
                'Latitude', 'Longitude', ...locHeaders, 'Observed Date', 'Created Date',
                'Contributor', 'Org', 'Notes'
            ].join(',');

            // Map data to CSV rows
            const rows = allData.map(item => {
                const commonName = `"${item.taxon?.common_name || ''}"`;
                const scientificName = `"${item.taxon?.scientific_name || ''}"`;
                const category = `"${item.taxon?.category || ''}"`;
                const count = item.count || '';

                // Location coords
                const lat = Array.isArray(item.location) ? item.location[0] : (item.location?.coordinates ? item.location.coordinates[1] : '');
                const lng = Array.isArray(item.location) ? item.location[1] : (item.location?.coordinates ? item.location.coordinates[0] : '');

                // Dynamic Location Segments
                const locArray = Array.isArray(item.location_name) ? item.location_name : (item.location_name ? [item.location_name] : []);
                const locCols = [];
                for (let i = 0; i < maxLocFields; i++) {
                    locCols.push(`"${locArray[i] || ''}"`);
                }

                // Simplified 24-hour format helper
                const simpleFormat = (dateInput) => {
                    if (!dateInput) return '';
                    const d = new Date(dateInput);
                    if (isNaN(d.getTime())) return '';

                    const pad = (num) => String(num).padStart(2, '0');
                    const y = d.getFullYear();
                    const m = pad(d.getMonth() + 1);
                    const day = pad(d.getDate());
                    const h = pad(d.getHours());
                    const min = pad(d.getMinutes());
                    const s = pad(d.getSeconds());

                    return `${y}-${m}-${day} ${h}:${min}:${s}`;
                };

                const observed = `"${simpleFormat(item.observedDate || item.observedAt)}"`;
                const created = `"${simpleFormat(item.createdDate || item.createdAt)}"`;

                const contributor = `"${item.contributor || ''}"`;
                const org = `"${item.org || ''}"`;
                const notes = `"${(item.notes || '').replace(/"/g, '""')}"`; // Escape quotes

                return [
                    commonName, scientificName, category, count,
                    lat, lng, ...locCols, observed, created,
                    contributor, org, notes
                ].join(',');
            });

            const csvContent = `${headers}\n${rows.join('\n')}`;
            const fileUri = FileSystem.documentDirectory + 'EcoTrace_Observations.csv';

            // Fixed: use 'utf8' string or omit as it's default
            await FileSystem.writeAsStringAsync(fileUri, csvContent);

            if (await Sharing.isAvailableAsync()) {
                await Sharing.shareAsync(fileUri);
            } else {
                showAlert("Error", "Sharing is not available on this device");
            }

        } catch (error) {
            console.error("Export Error:", error);
            showAlert("Error", "Failed to export CSV file.");
        }
    };

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: theme?.background || '#f0f2f5' }]}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerLeft}>
                    <MaterialCommunityIcons name={ICONS.BACK} size={24} color={theme?.text || '#000'} />
                </TouchableOpacity>
                <View style={styles.headerCenter}>
                    <Text style={[styles.headerTitle, { color: theme?.text || '#000' }]}>Observations</Text>
                </View>
                <View style={styles.headerRight} />
            </View>

            {loading ? (
                <View style={styles.center}>
                    <ActivityIndicator size="large" color={theme?.primary || '#f4081'} />
                </View>
            ) : (
                <ScrollView contentContainerStyle={styles.content}>

                    {/* NEW: Prominent Export Section */}
                    <TouchableOpacity
                        onPress={exportToCSV}
                        activeOpacity={0.8}
                        style={[styles.exportCard, { backgroundColor: isDark ? '#1F2937' : '#FFFFFF' }]}
                    >
                        <View style={[styles.exportIconCircle, { backgroundColor: `${colors.electricCyan}20` }]}>
                            <MaterialCommunityIcons name="file-export" size={24} color={colors.electricCyan} />
                        </View>
                        <View style={{ flex: 1 }}>
                            <Text style={[styles.exportTitle, { color: theme.text }]}>Export Dataset</Text>
                            <Text style={[styles.exportSubtitle, { color: theme.textSecondary }]}>
                                Download all {allData.length} records as CSV
                            </Text>
                        </View>
                        <MaterialCommunityIcons name="chevron-right" size={20} color={theme.textLight} />
                    </TouchableOpacity>

                    <Text style={[styles.listLabel, { color: theme.textSecondary }]}>CATEGORIES</Text>
                    {(CATEGORIES || []).map(cat => (
                        <CategoryCard
                            key={cat}
                            category={cat}
                            items={stats[cat] || []}
                            theme={theme}
                            navigation={navigation}
                        />
                    ))}
                    {/* Show 'Other' if it's not in the main categories list or just show it anyway */}
                    {!CATEGORIES.includes('Other') && (stats['Other'] && stats['Other'].length > 0) && (
                        <CategoryCard
                            category="Other"
                            items={stats['Other']}
                            theme={theme}
                            navigation={navigation}
                        />
                    )}
                </ScrollView>
            )}
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
        alignItems: 'flex-end',
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: 'bold',
    },
    content: {
        padding: 16,
    },
    center: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    exportCard: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 20,
        borderRadius: 20,
        marginBottom: 24,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
        elevation: 4,
    },
    exportIconCircle: {
        width: 52,
        height: 52,
        borderRadius: 26,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 16,
    },
    exportTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 2,
    },
    exportSubtitle: {
        fontSize: 13,
    },
    listLabel: {
        fontSize: 12,
        fontWeight: '800',
        letterSpacing: 1.5,
        marginBottom: 16,
        marginLeft: 4,
    },
    card: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderRadius: 12,
        marginBottom: 12,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
    },
    iconContainer: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: 'rgba(0,0,0,0.05)',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 16,
    },
    cardContent: {
        flex: 1,
    },
    cardTitle: {
        fontSize: 16,
        fontWeight: 'bold',
    },
    cardSubtitle: {
        fontSize: 14,
        marginTop: 2,
    },
});
