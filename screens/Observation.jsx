import React, { useState, useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View, TouchableOpacity, ScrollView, TextInput, Alert, ActivityIndicator, Modal, FlatList, TouchableWithoutFeedback, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useSelector } from 'react-redux';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { useNavigation } from '@react-navigation/native';

import colors from '../colors/colors';
import CustomAlert from '../components/CustomAlert';
import { CATEGORIES } from '../constants/categories';
import { ICONS, getCategoryIcon } from '../constants/icons';
import { Asset } from 'expo-asset';
import * as FileSystem from 'expo-file-system/legacy';
import * as XLSX from 'xlsx';

const LOCAL_IP = "192.168.1.8";
const API_URL = `http://${LOCAL_IP}:4000`;

// Helper Components Defined OUTSIDE
const InputField = ({ label, value, onChangeText, placeholder, keyboardType = 'default', multiline = false, theme }) => (
    <View style={styles.inputGroup}>
        <Text style={[styles.label, { color: theme.textSecondary }]}>{label}</Text>
        <TextInput
            style={[
                styles.input,
                {
                    color: theme.text,
                    borderBottomColor: theme.border,
                    height: multiline ? 80 : 40,
                    textAlignVertical: multiline ? 'top' : 'center'
                }
            ]}
            value={value}
            onChangeText={onChangeText}
            placeholder={placeholder}
            placeholderTextColor={theme.textLight}
            keyboardType={keyboardType}
            multiline={multiline}
        />
    </View>
);

const CategorySelect = ({ category, onPress, theme }) => (
    <View style={styles.inputGroup}>
        <Text style={[styles.label, { color: theme.textSecondary }]}>Category *</Text>
        <TouchableOpacity
            onPress={onPress}
            style={[styles.input, { borderBottomColor: theme.border, justifyContent: 'center' }]}
        >
            <Text style={{ color: theme.text, fontSize: 16 }}>{category}</Text>
            <MaterialCommunityIcons
                name={ICONS.CHEVRON_DOWN}
                size={20}
                color={theme.textSecondary}
                style={{ position: 'absolute', right: 0, bottom: 8 }}
            />
        </TouchableOpacity>
    </View>
);



export default function Observation({ onLogout }) {
    const isDark = useSelector((state) => state?.theme?.isDark || false);
    const userState = useSelector((state) => state?.user || {});
    const { auth_email, auth_username } = userState;
    const theme = isDark ? (colors.dark || {}) : (colors.light || {});
    const navigation = useNavigation();

    const [form, setForm] = useState({
        commonName: '',
        scientificName: '',
        category: 'Plant',
        count: '1',
        latitude: '',
        longitude: '',
        areaName: ''
    });

    const [showNotes, setShowNotes] = useState(false);

    const [loading, setLoading] = useState(false);
    const [fetchingLocation, setFetchingLocation] = useState(true);
    const [showCategoryModal, setShowCategoryModal] = useState(false);

    // Scientific Name Logic (Excel Integration)
    const [showScientificModal, setShowScientificModal] = useState(false);
    const [allScientificData, setAllScientificData] = useState([]);
    const [availableScientificNames, setAvailableScientificNames] = useState([]);
    const [isExcelLoaded, setIsExcelLoaded] = useState(false);

    // Custom Alert State
    const [alertVisible, setAlertVisible] = useState(false);
    const [alertConfig, setAlertConfig] = useState({ title: '', message: '', buttons: [] });

    const showAlert = (title, message, buttons = []) => {
        setAlertConfig({ title, message, buttons });
        setAlertVisible(true);
    };

    // 1. Load Excel File with Smart Caching
    useEffect(() => {
        const loadExcelData = async () => {
            try {
                // Load asset module
                const asset = Asset.fromModule(require('../constants/scientific_names.xlsx'));
                await asset.downloadAsync(); // Expo handles ensuring file exists locally

                // Define cache paths
                const cacheDir = FileSystem.cacheDirectory + 'scientific_names_cache/';
                const cacheFileUri = cacheDir + 'data.json';
                const metaFileUri = cacheDir + 'meta.json';

                // Ensure cache directory exists
                const dirInfo = await FileSystem.getInfoAsync(cacheDir);
                if (!dirInfo.exists) {
                    await FileSystem.makeDirectoryAsync(cacheDir, { intermediates: true });
                }

                // Check if we can use cached JSON (compare hash)
                let useCache = false;
                const metaInfo = await FileSystem.getInfoAsync(metaFileUri);
                if (metaInfo.exists) {
                    const metaContent = await FileSystem.readAsStringAsync(metaFileUri);
                    const meta = JSON.parse(metaContent);
                    if (meta.hash === asset.hash) useCache = true;
                }

                // Fast Path: Load from Cache
                if (useCache) {
                    // console.log("Loading from cache");
                    const jsonContent = await FileSystem.readAsStringAsync(cacheFileUri);
                    setAllScientificData(JSON.parse(jsonContent));
                    setIsExcelLoaded(true);
                    return;
                }

                // Slow Path: Parse Excel & Cache It
                // console.log("Parsing Excel...");
                const b64 = await FileSystem.readAsStringAsync(asset.localUri, { encoding: 'base64' });
                const workbook = XLSX.read(b64, { type: 'base64' });
                const sheetName = workbook.SheetNames[0];
                const jsonData = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]);

                // Write to cache for next time
                await FileSystem.writeAsStringAsync(cacheFileUri, JSON.stringify(jsonData));
                await FileSystem.writeAsStringAsync(metaFileUri, JSON.stringify({ hash: asset.hash }));

                setAllScientificData(jsonData);
                setIsExcelLoaded(true);
            } catch (error) {
                console.error("Error loading Excel:", error);
                showAlert("Error", "Failed to load database.");
            }
        };

        loadExcelData();
    }, []);

    // 2. Filter Names based on selected Category
    useEffect(() => {
        if (form.category && isExcelLoaded) {
            const filtered = allScientificData
                .filter(item => item.Category === form.category)
                .map(item => item["Scientific Name"])
                .filter((v, i, a) => v && a.indexOf(v) === i) // Unique check
                .sort();
            setAvailableScientificNames(filtered);
        } else {
            setAvailableScientificNames([]);
        }
    }, [form.category, isExcelLoaded, allScientificData]);

    // Initial Location & Area Name Fetching
    useEffect(() => {
        (async () => {
            let { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== 'granted') {
                showAlert('Permission Denied', 'Permission to access location was denied');
                setFetchingLocation(false);
                return;
            }

            try {
                let location = await Location.getCurrentPositionAsync({});
                const { latitude, longitude } = location.coords;

                // Fetch Area Name (Reverse Geocode)
                let area = "Unknown Area";
                try {
                    const reverseDetails = await Location.reverseGeocodeAsync({ latitude, longitude });
                    if (reverseDetails && reverseDetails.length > 0) {
                        const place = reverseDetails[0];
                        // Get detailed parts
                        const parts = [];

                        // Helper to detect Plus Codes (e.g. "GQH+H7V" or "8Q7X+GL")
                        const isPlusCode = (text) => text && text.includes('+') && text.length >= 4 && text.length <= 13;

                        // 1. Street Name (Prioritize usage)
                        if (place.street && place.street !== place.city && place.street !== place.district) {
                            parts.push(place.street);
                        }

                        // 2. Specific Name (Building/POI) - Only if NOT a Plus Code and not duplicate
                        if (place.name && !isPlusCode(place.name) && place.name !== place.city && place.name !== place.street) {
                            parts.push(place.name);
                        }

                        // 3. District / Neighborhood
                        if (place.district && place.district !== place.city) parts.push(place.district);

                        // 4. City
                        if (place.city) parts.push(place.city);

                        // 5. Region (State/Province) - Only if city is missing or different
                        if (place.region && (!place.city || place.region !== place.city)) parts.push(place.region);

                        // 6. Country
                        if (place.country) parts.push(place.country);

                        // Join valid parts
                        area = parts.length > 0 ? parts.join(', ') : "Unknown Area";
                    }
                } catch (geoError) {
                    console.error("Reverse geocode error:", geoError);
                }

                setForm(prev => ({
                    ...prev,
                    latitude: latitude.toString(),
                    longitude: longitude.toString(),
                    areaName: area
                }));
            } catch (error) {
                console.error("Initial location fetch error:", error);
            } finally {
                setFetchingLocation(false);
            }
        })();
    }, []);

    const [observationsList, setObservationsList] = useState([]);

    // Load persisted list on mount
    useEffect(() => {
        const loadList = async () => {
            try {
                const stored = await AsyncStorage.getItem('observationsList');
                if (stored) {
                    setObservationsList(JSON.parse(stored));
                }
            } catch (e) {
                console.error("Failed to load list", e);
            }
        };
        loadList();
    }, []);

    // Save list whenever it changes
    useEffect(() => {
        const saveList = async () => {
            try {
                await AsyncStorage.setItem('observationsList', JSON.stringify(observationsList));
            } catch (e) {
                console.error("Failed to save list", e);
            }
        };
        saveList();
    }, [observationsList]);

    const updateForm = (key, value) => {
        setForm(prev => ({ ...prev, [key]: value }));
    };

    const handleAddToList = () => {
        if (!form.commonName || !form.category) {
            showAlert("Missing Fields", "Please enter at least a Common Name and Category.");
            return;
        }

        if (!form.latitude || !form.longitude) {
            showAlert("Location Missing", "We are still fetching your location or permission was denied.");
            return;
        }

        const newItem = {
            id: Date.now().toString(),
            commonName: form.commonName,
            scientificName: form.scientificName,
            category: form.category,
            count: 1, // Default count
            notes: form.notes, // Even though input hidden, we keep structure
            latitude: form.latitude,
            longitude: form.longitude,
            areaName: form.areaName, // Save area name
            observedAt: new Date()
        };

        setObservationsList(prev => [...prev, newItem]);

        // Reset Form
        setForm(prev => ({
            ...prev, // Keep latitude, longitude, areaName
            commonName: '',
            scientificName: '',
            category: 'Plant', // Default
            count: '1',
            notes: ''
        }));
    };

    const updateItemCount = (id, delta) => {
        setObservationsList(prev => prev.map(item => {
            if (item.id === id) {
                const newCount = item.count + delta;
                return { ...item, count: newCount };
            }
            return item;
        }).filter(item => item.count > 0)); // Remove if count goes to 0
    };

    const handleSubmitAll = async () => {
        if (observationsList.length === 0) return;

        const token = await SecureStore.getItemAsync('userToken');

        setLoading(true);
        let successCount = 0;
        let failedCount = 0;

        for (const item of observationsList) {
            const payload = {
                contributor: auth_email || auth_username || "Anonymous",
                taxon: {
                    common_name: item.commonName,
                    scientific_name: item.scientificName,
                    category: item.category,
                },
                count: item.count,
                notes: item.notes || "",
                location: [item.latitude.toString(), item.longitude.toString()],
                location_name: item.areaName ? item.areaName.split(',').map(s => s.trim()) : [],
                observedAt: item.observedAt,
            };

            try {
                const response = await fetch(`${API_URL}/observations`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify(payload),
                });

                if (response.ok) {
                    successCount++;
                } else {
                    const data = await response.json();
                    console.error("Upload Error:", data);
                    failedCount++;
                }
            } catch (error) {
                console.error("Fetch Error:", error);
                failedCount++;
            }
        }

        setLoading(false);

        if (failedCount === 0) {
            showAlert("Success", `All ${successCount} observations uploaded successfully!`);
            setObservationsList([]);
            AsyncStorage.removeItem('observationsList');
        } else {
            showAlert("Partial Success", `Uploaded ${successCount} items. ${failedCount} failed. Please try again.`);
        }
    };

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>


            {/* Fixed Header */}
            <View style={[styles.header, { borderBottomColor: theme.border }]}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerLeft}>
                    <MaterialCommunityIcons name={ICONS.BACK} size={24} color={theme.text} />
                </TouchableOpacity>
                <View style={styles.headerCenter}>
                    <Text style={[styles.title, { color: theme.primary, marginBottom: 0, textAlign: 'center' }]}>New Observation</Text>
                    <Text style={[styles.subtitle, { color: theme.textSecondary, marginTop: 4, textAlign: 'center' }]}>
                        {auth_username || auth_email || "Guest"}
                    </Text>
                </View>
                <View style={styles.headerRight}>
                    {fetchingLocation ? (
                        <ActivityIndicator size="small" color={theme.primary} />
                    ) : (
                        <TouchableOpacity
                            onPress={() => {
                                showAlert(
                                    "Location Status",
                                    form.latitude
                                        ? `GPS Active\nArea: ${form.areaName}\nLat: ${parseFloat(form.latitude).toFixed(4)}\nLng: ${parseFloat(form.longitude).toFixed(4)}`
                                        : "No Location Found"
                                );
                            }}
                        >
                            <MaterialCommunityIcons
                                name={form.latitude && form.longitude ? ICONS.LOCATION : ICONS.LOCATION_OUTLINE}
                                size={24}
                                color={form.latitude && form.longitude ? "#4CAF50" : colors.error}
                            />
                        </TouchableOpacity>
                    )}
                </View>
            </View>
            <KeyboardAvoidingView
                behavior={Platform.OS === "ios" ? "padding" : "height"}
                style={{ flex: 1 }}
            >
                <ScrollView contentContainerStyle={styles.content}>

                    {/* Top Controls Row: Location */}
                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: 15 }}>

                        {/* 1. Location Pill (Fuller width since tracking is gone) */}
                        <TouchableOpacity
                            onPress={() => {
                                if (!fetchingLocation) {
                                    setFetchingLocation(true);
                                    // Simple feedback, actual refetch is auto-handled by effect but we can trigger loading state
                                    setTimeout(() => setFetchingLocation(false), 1000);
                                }
                            }}
                            style={{
                                flexDirection: 'row', alignItems: 'center',
                                backgroundColor: theme.surface, paddingHorizontal: 15, paddingVertical: 8,
                                borderRadius: 20, width: '100%', elevation: 2, justifyContent: 'center'
                            }}
                        >
                            <MaterialCommunityIcons name="crosshairs-gps" size={18} color={theme.primary} style={{ marginRight: 8 }} />
                            <Text numberOfLines={1} style={{ fontSize: 13, fontWeight: '600', color: theme.text }}>
                                {form.areaName || "Locating..."}
                            </Text>
                        </TouchableOpacity>
                    </View>

                    {/* Taxon Section */}
                    <View style={[styles.card, { backgroundColor: theme.surface }]}>
                        <Text style={[styles.sectionTitle, { color: theme.secondary }]}>Taxonomy</Text>

                        <CategorySelect
                            category={form.category}
                            onPress={() => setShowCategoryModal(true)}
                            theme={theme}
                        />

                        <InputField
                            label="Common Name *"
                            value={form.commonName}
                            onChangeText={(t) => updateForm('commonName', t)}
                            placeholder="e.g. Red Rose"
                            theme={theme}
                        />

                        {/* Scientific Name - Dropdown */}
                        <View style={styles.inputGroup}>
                            <Text style={[styles.label, { color: theme.textSecondary }]}>Scientific Name (Searchable)</Text>
                            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                <TextInput
                                    style={[
                                        styles.input,
                                        {
                                            flex: 1,
                                            color: theme.text,
                                            borderBottomColor: theme.border,
                                            height: 40
                                        }
                                    ]}
                                    value={form.scientificName}
                                    onChangeText={(t) => updateForm('scientificName', t)}
                                    placeholder="Search or Enter Name"
                                    placeholderTextColor={theme.textLight}
                                />
                                {availableScientificNames.length > 0 && (
                                    <TouchableOpacity
                                        onPress={() => setShowScientificModal(true)}
                                        style={{ padding: 8, marginLeft: 8 }}
                                    >
                                        <MaterialCommunityIcons name="menu-down" size={24} color={theme.primary} />
                                    </TouchableOpacity>
                                )}
                            </View>
                        </View>

                        {/* Toggle Notes Button */}
                        <TouchableOpacity
                            onPress={() => setShowNotes(!showNotes)}
                            style={{ flexDirection: 'row', alignItems: 'center', marginTop: 5, marginBottom: showNotes ? 10 : 0 }}
                        >
                            <MaterialCommunityIcons
                                name={showNotes ? "minus-circle-outline" : "plus-circle-outline"}
                                size={18}
                                color={theme.primary}
                            />
                            <Text style={{ marginLeft: 6, color: theme.primary, fontSize: 13, fontWeight: '600' }}>
                                {showNotes ? "Hide Notes" : "Add Notes"}
                            </Text>
                        </TouchableOpacity>

                        {showNotes && (
                            <InputField
                                label="Notes"
                                value={form.notes}
                                onChangeText={(t) => updateForm('notes', t)}
                                placeholder="Optional observations..."
                                multiline={true}
                                theme={theme}
                            />
                        )}
                    </View>

                    {/* View Results Link - Underneath the taxonomy card */}
                    <TouchableOpacity
                        onPress={() => navigation.navigate('Results')}
                        style={{ alignSelf: 'center', marginTop: 15, marginBottom: 5 }}
                    >
                        <Text style={{ color: theme.primary, fontSize: 13, fontWeight: '600', textDecorationLine: 'underline' }}>
                            View all submitted observations
                        </Text>
                    </TouchableOpacity>

                    {fetchingLocation && (
                        <View style={{ marginTop: 10, alignItems: 'center' }}>
                            <ActivityIndicator size="small" color={theme.primary} />
                        </View>
                    )}

                    {/* Add to List Action - Floating FAB */}
                    <TouchableOpacity
                        onPress={handleAddToList}
                        disabled={fetchingLocation}
                        activeOpacity={0.8}
                        style={styles.addButtonWrapper}
                    >
                        <LinearGradient
                            colors={[colors.vividPink, colors.warmPeach]}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                            style={styles.mainActionButton}
                        >
                            <Text style={styles.actionButtonText}>
                                {fetchingLocation ? "WAITING FOR GPS..." : "ADD OBSERVATION"}
                            </Text>
                            <MaterialCommunityIcons name="plus" size={24} color="#FFF" />
                        </LinearGradient>
                    </TouchableOpacity>

                    {/* List Staged for Upload - Minimal List */}
                    {observationsList.length > 0 && (
                        <View style={styles.listContainer}>
                            <Text style={[styles.sectionLabel, { color: theme.textSecondary, marginBottom: 10, paddingLeft: 4 }]}>PENDING UPLOADS</Text>

                            {observationsList.map((item) => (
                                <View key={item.id} style={[styles.pendingItem, { backgroundColor: isDark ? '#252525' : '#FFF', borderLeftColor: colors.vividPink }]}>
                                    <View style={[styles.miniIcon, { backgroundColor: isDark ? '#333' : '#F5F5F5' }]}>
                                        <MaterialCommunityIcons name={getCategoryIcon(item.category)} size={20} color={theme.primary} />
                                    </View>

                                    <View style={styles.itemMeta}>
                                        <Text style={[styles.itemTitle, { color: theme.text }]}>{item.commonName}</Text>
                                        <View style={{ flexDirection: 'row' }}>
                                            <Text style={[styles.itemSub, { color: theme.textSecondary }]}>{item.count} • {item.areaName}</Text>
                                        </View>
                                    </View>

                                    <View style={styles.countControls}>
                                        <TouchableOpacity onPress={() => updateItemCount(item.id, -1)} style={styles.iconBtn}>
                                            <MaterialCommunityIcons name="minus" size={16} color={theme.text} />
                                        </TouchableOpacity>

                                        <TouchableOpacity onPress={() => updateItemCount(item.id, 1)} style={styles.iconBtn}>
                                            <MaterialCommunityIcons name="plus" size={16} color={theme.text} />
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            ))}

                            <TouchableOpacity
                                onPress={handleSubmitAll}
                                disabled={loading}
                                style={{ marginTop: 15, marginBottom: 50 }}
                            >
                                <LinearGradient
                                    colors={[colors.neonPurple, colors.softPurple]}
                                    style={styles.uploadButton}
                                >
                                    {loading ? <ActivityIndicator color="#FFF" /> : <Text style={styles.uploadText}>UPLOAD ALL ({observationsList.length})</Text>}
                                </LinearGradient>
                            </TouchableOpacity>
                        </View>
                    )}

                </ScrollView>
            </KeyboardAvoidingView>

            {/* Category Modal (Classic) */}
            <Modal
                visible={showCategoryModal}
                transparent={true}
                animationType="slide"
                onRequestClose={() => setShowCategoryModal(false)}
            >
                <TouchableOpacity
                    style={styles.modalOverlay}
                    activeOpacity={1}
                    onPress={() => setShowCategoryModal(false)}
                >
                    <TouchableWithoutFeedback>
                        <View style={[styles.modalContent, { backgroundColor: theme.surface }]}>
                            <Text style={[styles.modalTitle, { color: theme.text }]}>Select Category</Text>
                            <FlatList
                                data={CATEGORIES}
                                keyExtractor={(item) => item}
                                renderItem={({ item }) => (
                                    <TouchableOpacity
                                        style={[
                                            styles.categoryItem,
                                            { borderBottomColor: theme.border },
                                            form.category === item && { backgroundColor: isDark ? '#333' : '#f0f0f0' }
                                        ]}
                                        onPress={() => {
                                            updateForm('category', item);
                                            setShowCategoryModal(false);
                                        }}
                                    >
                                        <Text style={[
                                            styles.categoryText,
                                            { color: form.category === item ? theme.primary : theme.text }
                                        ]}>{item}</Text>
                                        {form.category === item && (
                                            <MaterialCommunityIcons name={ICONS.CHECK} size={20} color={theme.primary} />
                                        )}
                                    </TouchableOpacity>
                                )}
                            />
                        </View>
                    </TouchableWithoutFeedback>
                </TouchableOpacity>
            </Modal>

            {/* Scientific Name Modal */}
            <Modal
                visible={showScientificModal}
                transparent={true}
                animationType="slide"
                onRequestClose={() => setShowScientificModal(false)}
            >
                <TouchableOpacity
                    style={styles.modalOverlay}
                    activeOpacity={1}
                    onPress={() => setShowScientificModal(false)}
                >
                    <TouchableWithoutFeedback>
                        <View style={[styles.modalContent, { backgroundColor: theme.surface }]}>
                            <Text style={[styles.modalTitle, { color: theme.text }]}>
                                Select Scientific Name
                            </Text>
                            <Text style={{ textAlign: 'center', marginBottom: 10, color: theme.textSecondary, fontSize: 12 }}>
                                {availableScientificNames.length} names found for {form.category}
                            </Text>

                            <FlatList
                                data={availableScientificNames}
                                keyExtractor={(item, index) => index.toString()}
                                renderItem={({ item }) => (
                                    <TouchableOpacity
                                        style={[
                                            styles.categoryItem,
                                            { borderBottomColor: theme.border },
                                            form.scientificName === item && { backgroundColor: isDark ? '#333' : '#f0f0f0' }
                                        ]}
                                        onPress={() => {
                                            updateForm('scientificName', item);
                                            setShowScientificModal(false);
                                        }}
                                    >
                                        <Text style={[
                                            styles.categoryText,
                                            { color: form.scientificName === item ? theme.primary : theme.text }
                                        ]}>{item}</Text>
                                        {form.scientificName === item && (
                                            <MaterialCommunityIcons name={ICONS.CHECK} size={20} color={theme.primary} />
                                        )}
                                    </TouchableOpacity>
                                )}
                            />
                        </View>
                    </TouchableWithoutFeedback>
                </TouchableOpacity>
            </Modal>

            <StatusBar style={isDark ? "light" : "dark"} />
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
    content: {
        padding: 20,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: 1,
        marginBottom: 0,
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
    title: {
        fontSize: 20,
        fontWeight: 'bold',
    },
    subtitle: {
        fontSize: 12,
    },
    card: {
        padding: 16,
        borderRadius: 12,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '600',
        marginBottom: 16,
    },
    inputGroup: {
        marginBottom: 16,
    },
    label: {
        fontSize: 12,
        fontWeight: '700',
        marginBottom: 6,
        textTransform: 'uppercase',
    },
    input: {
        borderBottomWidth: 1,
        paddingVertical: 8,
        fontSize: 16,
    },
    buttonText: {
        color: '#FFF',
        fontSize: 16,
        fontWeight: 'bold',
        letterSpacing: 1,
        textTransform: 'uppercase',
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        padding: 20,
        maxHeight: '50%',
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 16,
        textAlign: 'center',
    },
    smallBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 5,
    },
    smallBtnText: {
        fontSize: 12,
        fontWeight: '700',
        marginLeft: 5,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    categoryItem: {
        paddingVertical: 16,
        borderBottomWidth: 1,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 8,
    },
    categoryText: {
        fontSize: 16,
    },
    closeButton: {
        marginTop: 16,
        alignItems: 'center',
        padding: 12,
    },
    closeButtonText: {
        color: colors.error,
        fontWeight: 'bold',
        fontSize: 16,
    },

    // NEW MINIMALIST STYLES BELOW
    locationPill: {
        alignSelf: 'center',
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
        marginVertical: 15,
        elevation: 2,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    locationText: {
        fontSize: 12,
        fontWeight: '600',
        marginLeft: 6,
    },
    trackingSection: {
        marginTop: 10,
    },
    trackCard: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 20,
        borderRadius: 16,
        elevation: 4,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
    },
    trackInfo: {
        flex: 1,
    },
    distanceValue: {
        fontSize: 32,
        fontWeight: '800',
        letterSpacing: -1,
    },
    distanceUnit: {
        fontSize: 12,
        textTransform: 'uppercase',
        fontWeight: 'bold',
        marginTop: 4,
        opacity: 0.7,
    },
    trackButton: {
        width: 56,
        height: 56,
        borderRadius: 28,
        alignItems: 'center',
        justifyContent: 'center',
        elevation: 5,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
    },
    addButtonWrapper: {
        marginTop: 40,
        marginBottom: 20,
        alignItems: 'center',
    },
    mainActionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 16,
        paddingHorizontal: 32,
        borderRadius: 30,
        elevation: 8,
        shadowColor: "#FF4081",
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.4,
        shadowRadius: 16,
    },
    actionButtonText: {
        color: '#FFF',
        fontWeight: 'bold',
        fontSize: 14,
        letterSpacing: 1,
        marginRight: 8,
    },
    listContainer: {
        marginTop: 20,
    },
    sectionLabel: {
        fontSize: 10,
        fontWeight: 'bold',
        letterSpacing: 1.5,
        marginBottom: 10,
        opacity: 0.7,
    },
    pendingItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderRadius: 12,
        marginBottom: 10,
        borderLeftWidth: 4,
    },
    miniIcon: {
        width: 40,
        height: 40,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
    },
    itemMeta: {
        flex: 1,
    },
    itemTitle: {
        fontSize: 15,
        fontWeight: '700',
    },
    itemSub: {
        fontSize: 11,
        marginTop: 2,
        opacity: 0.7,
    },
    countControls: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    iconBtn: {
        padding: 4,
    },
    uploadButton: {
        paddingVertical: 14,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
    uploadText: {
        color: '#FFF',
        fontWeight: 'bold',
        fontSize: 12,
        letterSpacing: 2,
    },
    historyLink: {
        alignItems: 'center',
        marginTop: 10,
        marginBottom: 5,
    },
});
