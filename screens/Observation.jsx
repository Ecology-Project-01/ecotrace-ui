import React, { useState, useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import {
    StyleSheet, Text, View, TouchableOpacity, ScrollView,
    TextInput, ActivityIndicator, KeyboardAvoidingView, Platform
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useSelector, useDispatch } from 'react-redux';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { useNavigation } from '@react-navigation/native';

import colors from '../colors/colors';
import CustomAlert from '../components/CustomAlert';
import { addObservationToTrip } from '../store/slices/tripSlice';
import { ICONS } from '../constants/icons';
import { Asset } from 'expo-asset';
import * as FileSystem from 'expo-file-system/legacy';
import * as XLSX from 'xlsx';

import { API_URL } from '../constants/config';

export default function Observation({ onLogout }) {
    const dispatch = useDispatch();
    const isDark = useSelector((state) => state?.theme?.isDark || false);
    const userState = useSelector((state) => state?.user || {});
    const { auth_email, auth_username } = userState;
    const theme = isDark ? (colors.dark || {}) : (colors.light || {});
    const navigation = useNavigation();

    const [form, setForm] = useState({
        // User-editable
        commonName: '',
        count: '1',
        notes: '',
        // GPS (auto-filled)
        latitude: '',
        longitude: '',
        areaName: '',
        // Checklist-matched (read-only display, from Excel)
        scientificName: '',
        family: '',
        order: '',
        category: 'Bird',
        iucn: '',
        altNames: '',
    });

    const [showMoreInfo, setShowMoreInfo] = useState(false);
    const [loading, setLoading] = useState(false);
    const [fetchingLocation, setFetchingLocation] = useState(true);

    const [allChecklistData, setAllChecklistData] = useState([]);
    const [suggestions, setSuggestions] = useState([]);
    const [isExcelLoaded, setIsExcelLoaded] = useState(false);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [matchedEntry, setMatchedEntry] = useState(null); // the full selected row
    const [showBreedingStatus, setShowBreedingStatus] = useState(false);
    // Breeding Status
    const [breedingStatus, setBreedingStatus] = useState(null);
    const [observationsList, setObservationsList] = useState([]);

    const [alertVisible, setAlertVisible] = useState(false);
    const [alertConfig, setAlertConfig] = useState({ title: '', message: '', buttons: [] });
    const showAlert = (title, message, buttons = []) => {
        setAlertConfig({ title, message, buttons });
        setAlertVisible(true);
    };

    // 1. Load India Checklist with Smart Cache
    useEffect(() => {
        const loadExcelData = async () => {
            try {
                const asset = Asset.fromModule(require('../constants/India-Checklist_v10_0.xlsx'));
                await asset.downloadAsync();

                const cacheDir = FileSystem.cacheDirectory + 'india_checklist_cache/';
                const cacheFileUri = cacheDir + 'data.json';
                const metaFileUri = cacheDir + 'meta.json';

                const dirInfo = await FileSystem.getInfoAsync(cacheDir);
                if (!dirInfo.exists) {
                    await FileSystem.makeDirectoryAsync(cacheDir, { intermediates: true });
                }

                let useCache = false;
                const metaInfo = await FileSystem.getInfoAsync(metaFileUri);
                if (metaInfo.exists) {
                    const metaContent = await FileSystem.readAsStringAsync(metaFileUri);
                    const meta = JSON.parse(metaContent);
                    if (meta.hash === asset.hash) useCache = true;
                }

                if (useCache) {
                    const jsonContent = await FileSystem.readAsStringAsync(cacheFileUri);
                    setAllChecklistData(JSON.parse(jsonContent));
                    setIsExcelLoaded(true);
                    return;
                }

                const b64 = await FileSystem.readAsStringAsync(asset.localUri, { encoding: 'base64' });
                const workbook = XLSX.read(b64, { type: 'base64' });
                const jsonData = XLSX.utils.sheet_to_json(workbook.Sheets['India_Checklist_10_0']);

                await FileSystem.writeAsStringAsync(cacheFileUri, JSON.stringify(jsonData));
                await FileSystem.writeAsStringAsync(metaFileUri, JSON.stringify({ hash: asset.hash }));

                setAllChecklistData(jsonData);
                setIsExcelLoaded(true);
            } catch (error) {
                console.error('Error loading India Checklist:', error);
                showAlert('Error', 'Failed to load bird database.');
            }
        };
        loadExcelData();
    }, []);

    // 2. Autocomplete: search English Name as user types
    const handleCommonNameChange = (text) => {
        // Reset matched entry & checklist fields when user edits
        setMatchedEntry(null);
        setForm(prev => ({
            ...prev,
            commonName: text,
            scientificName: '',
            family: '',
            order: '',
            category: 'Bird',
            iucn: '',
            altNames: '',
        }));

        if (!isExcelLoaded || text.trim().length < 2) {
            setSuggestions([]);
            setShowSuggestions(false);
            return;
        }

        const query = text.trim().toLowerCase();
        const matches = allChecklistData
            .filter(item => item['English Name'] && item['English Name'].toLowerCase().includes(query))
            .slice(0, 8);
        setSuggestions(matches);
        setShowSuggestions(matches.length > 0);
    };

    // 3. User picks a suggestion → auto-fill all checklist fields
    const handleSelectSuggestion = (item) => {
        setMatchedEntry(item);
        setForm(prev => ({
            ...prev,
            commonName: item['English Name'] || '',
            scientificName: item['Scientific Name'] || '',
            family: item['Family'] || '',
            order: item['Order'] || '',
            category: item['Category'] || 'Bird',
            iucn: item['IUCN RedList'] || '',
            altNames: item['Alternative Names'] || '',
        }));
        setSuggestions([]);
        setShowSuggestions(false);
    };

    // 4. GPS: fetch location on mount
    useEffect(() => {
        (async () => {
            let { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== 'granted') {
                showAlert('Permission Denied', 'Location permission was denied.');
                setFetchingLocation(false);
                return;
            }
            try {
                let location = await Location.getCurrentPositionAsync({});
                const { latitude, longitude } = location.coords;

                let area = 'Unknown Area';
                try {
                    const reverseDetails = await Location.reverseGeocodeAsync({ latitude, longitude });
                    if (reverseDetails && reverseDetails.length > 0) {
                        const place = reverseDetails[0];
                        const isPlusCode = (t) => t && t.includes('+') && t.length >= 4 && t.length <= 13;
                        const parts = [];
                        if (place.street && place.street !== place.city && place.street !== place.district) parts.push(place.street);
                        if (place.name && !isPlusCode(place.name) && place.name !== place.city && place.name !== place.street) parts.push(place.name);
                        if (place.district && place.district !== place.city) parts.push(place.district);
                        if (place.city) parts.push(place.city);
                        if (place.region && (!place.city || place.region !== place.city)) parts.push(place.region);
                        if (place.country) parts.push(place.country);
                        area = parts.length > 0 ? parts.join(', ') : 'Unknown Area';
                    }
                } catch (geoError) {
                    console.error('Reverse geocode error:', geoError);
                }

                setForm(prev => ({ ...prev, latitude: latitude.toString(), longitude: longitude.toString(), areaName: area }));
            } catch (error) {
                console.error('Location fetch error:', error);
            } finally {
                setFetchingLocation(false);
            }
        })();
    }, []);

    // 5. Persist pending list
    useEffect(() => {
        AsyncStorage.getItem('observationsList').then(stored => {
            if (stored) setObservationsList(JSON.parse(stored));
        }).catch(e => console.error('Failed to load list', e));
    }, []);

    useEffect(() => {
        AsyncStorage.setItem('observationsList', JSON.stringify(observationsList))
            .catch(e => console.error('Failed to save list', e));
    }, [observationsList]);

    // 6. Add to pending list
    const handleAddToList = () => {
        if (!form.commonName.trim()) {
            showAlert('Missing Field', 'Please enter a bird name.');
            return;
        }
        if (!form.latitude || !form.longitude) {
            showAlert('Location Missing', 'Still fetching your GPS location. Please wait.');
            return;
        }

        const newItem = {
            id: Date.now().toString(),
            // User data
            commonName: form.commonName,
            count: 1,
            notes: form.notes,
            // GPS
            latitude: form.latitude,
            longitude: form.longitude,
            areaName: form.areaName,
            observedAt: new Date().toISOString(),
            // Checklist data
            scientificName: form.scientificName,
            family: form.family,
            order: form.order,
            category: form.category,
            iucn: form.iucn,
            altNames: form.altNames,
            breedingStatus: breedingStatus || undefined,
        };

        dispatch(addObservationToTrip(newItem));
        setObservationsList(prev => [...prev, newItem]);
        setSuggestions([]);
        setShowSuggestions(false);
        setMatchedEntry(null);
        setBreedingStatus(null);
        setShowBreedingStatus(false);

        // Reset only the input fields, keep GPS
        setForm(prev => ({
            ...prev,
            commonName: '',
            count: '1',
            notes: '',
            scientificName: '',
            family: '',
            order: '',
            category: 'Bird',
            iucn: '',
            altNames: '',
        }));
    };

    // 7. Count controls on pending list
    const updateItemCount = (id, delta) => {
        setObservationsList(prev =>
            prev.map(item => item.id === id ? { ...item, count: item.count + delta } : item)
                .filter(item => item.count > 0)
        );
    };

    // 8. Submit all to backend
    const handleSubmitAll = async () => {
        if (observationsList.length === 0) return;
        const token = await SecureStore.getItemAsync('userToken');
        setLoading(true);
        let successCount = 0;
        let failedCount = 0;

        for (const item of observationsList) {
            const payload = {
                contributor: auth_email || auth_username || 'Anonymous',
                taxon: {
                    common_name: item.commonName,
                    scientific_name: item.scientificName || '',
                    category: item.category || 'Bird',
                    family: item.family || '',
                    order: item.order || '',
                    iucn_status: item.iucn || '',
                },
                count: item.count,
                notes: item.notes || '',
                breeding_status: item.breedingStatus || undefined,
                location: [item.latitude.toString(), item.longitude.toString()],
                location_name: item.areaName ? item.areaName.split(',').map(s => s.trim()) : [],
                observedAt: item.observedAt,
            };

            try {
                const response = await fetch(`${API_URL}/observations`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                    body: JSON.stringify(payload),
                });
                const result = await response.json();
                if (response.ok) {
                    successCount++;
                } else {
                    let errorMsg = result.message || result.err || 'Upload failed';
                    if (result.errors && Array.isArray(result.errors)) {
                        errorMsg = result.errors.map(e => `${e.path}: ${e.message}`).join('\n');
                    }
                    console.error('Upload Error:', errorMsg);
                    failedCount++;
                }
            } catch (error) {
                console.error('Fetch Error:', error);
                failedCount++;
            }
        }

        setLoading(false);
        if (failedCount === 0) {
            showAlert('Success', `All ${successCount} observations uploaded!`);
            setObservationsList([]);
            AsyncStorage.removeItem('observationsList');
        } else {
            showAlert('Partial Success', `Uploaded ${successCount}. ${failedCount} failed.`);
        }
    };

    // IUCN status colour helper
    const iucnColor = (status) => {
        if (!status) return theme.textSecondary;
        const s = status.toLowerCase();
        if (s.includes('critically')) return '#C0392B';
        if (s.includes('endangered')) return '#E67E22';
        if (s.includes('vulnerable')) return '#F1C40F';
        if (s.includes('least concern')) return '#27AE60';
        return theme.textSecondary;
    };

    // breeding status
    const breedingStatusList = [
        "Agitated Behavior",
        "Nest Building",
        "Courtship Display",
        "Carrying Food",
        "Feeding Young",
        "Recently Fledged Young",
        "Singing Bird"
    ];

    const getCode = (name) => {
        const words = name.split(' ');

        if (words.length === 1) return words[0].charAt(0).toUpperCase();
        
        return (words[0][0] + words[1][0]).toUpperCase();

    }

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>

            {/* ── Header ── */}
            <View style={[styles.header, { borderBottomColor: theme.border }]}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerLeft}>
                    <MaterialCommunityIcons name={ICONS.BACK} size={24} color={theme.text} />
                </TouchableOpacity>
                <View style={styles.headerCenter}>
                    <Text style={[styles.title, { color: theme.primary }]}>New Observation</Text>
                    <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
                        {auth_username || auth_email || 'Guest'}
                    </Text>
                </View>
                <View style={styles.headerRight}>
                    {fetchingLocation ? (
                        <ActivityIndicator size="small" color={theme.primary} />
                    ) : (
                        <TouchableOpacity onPress={() => showAlert(
                            'Location',
                            form.latitude
                                ? `GPS Active\nArea: ${form.areaName}\nLat: ${parseFloat(form.latitude).toFixed(4)}\nLng: ${parseFloat(form.longitude).toFixed(4)}`
                                : 'No Location Found'
                        )}>
                            <MaterialCommunityIcons
                                name={form.latitude && form.longitude ? ICONS.LOCATION : ICONS.LOCATION_OUTLINE}
                                size={24}
                                color={form.latitude && form.longitude ? '#4CAF50' : colors.error}
                            />
                        </TouchableOpacity>
                    )}
                </View>
            </View>

            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
                <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">

                    {/* ── GPS Location Pill ── */}
                    <View style={[styles.locationPill, { backgroundColor: theme.surface }]}>
                        <MaterialCommunityIcons name="crosshairs-gps" size={16} color={theme.primary} />
                        <Text numberOfLines={1} style={[styles.locationText, { color: theme.text }]}>
                            {fetchingLocation ? 'Locating...' : (form.areaName || 'Location unavailable')}
                        </Text>
                    </View>

                    {/* ── Bird Search Card ── */}
                    <View style={[styles.card, { backgroundColor: theme.surface }]}>
                        <Text style={[styles.sectionTitle, { color: theme.secondary }]}>
                            Bird Identification
                        </Text>

                        {/* Common Name / Search */}
                        <View style={styles.inputGroup}>
                            <Text style={[styles.label, { color: theme.textSecondary }]}>Common Name (English) *</Text>
                            <TextInput
                                style={[styles.input, { color: theme.text, borderBottomColor: theme.border }]}
                                value={form.commonName}
                                onChangeText={handleCommonNameChange}
                                placeholder="e.g. Indian Peafowl, Sparrow..."
                                placeholderTextColor={theme.textLight}
                                autoCorrect={false}
                                autoCapitalize="words"
                            />
                            {/* ── Suggestion Dropdown ── */}
                            {showSuggestions && (
                                <View style={[styles.suggestionBox, { backgroundColor: isDark ? '#1e2535' : '#fff', borderColor: theme.border }]}>
                                    {suggestions.map((item, idx) => (
                                        <TouchableOpacity
                                            key={idx}
                                            style={[styles.suggestionItem, { borderBottomColor: theme.border }]}
                                            onPress={() => handleSelectSuggestion(item)}
                                        >
                                            <Text style={{ color: theme.text, fontSize: 14, fontWeight: '700' }}>
                                                {item['English Name']}
                                            </Text>
                                            <Text style={{ color: theme.textSecondary, fontSize: 11, marginTop: 2, fontStyle: 'italic' }}>
                                                {item['Scientific Name']}
                                            </Text>
                                            <Text style={{ color: theme.textSecondary, fontSize: 10, marginTop: 1 }}>
                                                {item['Family']}  ·  {item['Order']}
                                            </Text>
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            )}
                        </View>

                        {/* ── Show More Info toggle (only when a bird is matched) ── */}
                        {matchedEntry && (
                            <TouchableOpacity
                                onPress={() => setShowMoreInfo(!showMoreInfo)}
                                style={{ flexDirection: 'row', alignItems: 'center', marginTop: 8, marginBottom: showMoreInfo ? 12 : 0 }}
                            >
                                <MaterialCommunityIcons
                                    name={showMoreInfo ? 'chevron-up-circle-outline' : 'information-outline'}
                                    size={18}
                                    color={theme.primary}
                                />
                                <Text style={{ marginLeft: 6, color: theme.primary, fontSize: 13, fontWeight: '600' }}>
                                    {showMoreInfo ? 'Hide Details' : 'Show More Info'}
                                </Text>
                            </TouchableOpacity>
                        )}

                        {/* ── Expanded Info + Notes (hidden by default) ── */}
                        {matchedEntry && showMoreInfo && (
                            <>
                                <View style={[styles.matchCard, { backgroundColor: isDark ? '#1a2235' : '#F0F7FF', borderColor: isDark ? '#2d4070' : '#BDD7F3' }]}>
                                    <View style={styles.matchRow}>
                                        <MaterialCommunityIcons name="bird" size={15} color={theme.primary} />
                                        <Text style={[styles.matchLabel, { color: theme.textSecondary }]}>Scientific Name</Text>
                                        <Text style={[styles.matchValue, { color: theme.text, fontStyle: 'italic' }]} numberOfLines={1}>
                                            {form.scientificName || '—'}
                                        </Text>
                                    </View>
                                    <View style={styles.matchDivider} />
                                    <View style={styles.matchRow}>
                                        <MaterialCommunityIcons name="account-group-outline" size={15} color={theme.primary} />
                                        <Text style={[styles.matchLabel, { color: theme.textSecondary }]}>Family</Text>
                                        <Text style={[styles.matchValue, { color: theme.text }]}>
                                            {form.family || '—'}
                                        </Text>
                                    </View>
                                    <View style={styles.matchDivider} />
                                    <View style={styles.matchRow}>
                                        <MaterialCommunityIcons name="sitemap-outline" size={15} color={theme.primary} />
                                        <Text style={[styles.matchLabel, { color: theme.textSecondary }]}>Order</Text>
                                        <Text style={[styles.matchValue, { color: theme.text }]}>
                                            {form.order || '—'}
                                        </Text>
                                    </View>
                                    {form.iucn ? (
                                        <>
                                            <View style={styles.matchDivider} />
                                            <View style={styles.matchRow}>
                                                <MaterialCommunityIcons name="shield-outline" size={15} color={iucnColor(form.iucn)} />
                                                <Text style={[styles.matchLabel, { color: theme.textSecondary }]}>IUCN Status</Text>
                                                <Text style={[styles.matchValue, { color: iucnColor(form.iucn), fontWeight: '700' }]}>
                                                    {form.iucn}
                                                </Text>
                                            </View>
                                        </>
                                    ) : null}
                                    {form.altNames ? (
                                        <>
                                            <View style={styles.matchDivider} />
                                            <View style={styles.matchRow}>
                                                <MaterialCommunityIcons name="tag-multiple-outline" size={15} color={theme.textSecondary} />
                                                <Text style={[styles.matchLabel, { color: theme.textSecondary }]}>Also Known As</Text>
                                                <Text style={[styles.matchValue, { color: theme.textSecondary }]} numberOfLines={2}>
                                                    {form.altNames}
                                                </Text>
                                            </View>
                                        </>
                                    ) : null}
                                </View>

                                <View style={styles.breedingSection}>
                                    <TouchableOpacity
                                        onPress={() => setShowBreedingStatus(!showBreedingStatus)}
                                        activeOpacity={0.7}
                                        style={[styles.breedingToggle, { borderColor: theme.border, backgroundColor: isDark ? '#1a2235' : '#F5F5F5' }]}
                                    >
                                        {/* <MaterialCommunityIcons name="nest" size={18} color={theme.primary} /> */}
                                        <Text style={[styles.breedingToggleText, { color: theme.text }]}>
                                            {showBreedingStatus ? 'Hide breeding status' : 'Add breeding status'}
                                        </Text>
                                        <MaterialCommunityIcons
                                            name={showBreedingStatus ? 'chevron-up' : 'chevron-down'}
                                            size={20}
                                            color={theme.textSecondary}
                                        />
                                    </TouchableOpacity>

                                    {showBreedingStatus && (
                                        <>
                                            <View style={[styles.breedingOptionsRow, { marginTop: 10 }]}>
                                                {breedingStatusList.map((status) => {
                                                    const code = getCode(status);
                                                    const selected = breedingStatus === status;
                                                    return (
                                                        <TouchableOpacity
                                                            key={status}
                                                            onPress={() =>
                                                                setBreedingStatus((prev) => (prev === status ? null : status))
                                                            }
                                                            activeOpacity={0.7}
                                                            style={[
                                                                styles.breedingChip,
                                                                {
                                                                    borderColor: selected ? colors.vividPink : theme.border,
                                                                    backgroundColor: selected
                                                                        ? isDark
                                                                            ? 'rgba(255, 64, 129, 0.2)'
                                                                            : 'rgba(255, 64, 129, 0.12)'
                                                                        : isDark
                                                                          ? '#252525'
                                                                          : '#FFF',
                                                                },
                                                            ]}
                                                        >
                                                            <Text
                                                                style={[
                                                                    styles.breedingChipText,
                                                                    { color: selected ? colors.vividPink : theme.text },
                                                                ]}
                                                            >
                                                                {code}
                                                            </Text>
                                                        </TouchableOpacity>
                                                    );
                                                })}
                                            </View>
                                            <Text style={{ color: theme.textSecondary, marginTop: 8, fontSize: 13 }}>
                                                Selected:{' '}
                                                <Text style={{ color: theme.text, fontWeight: '600' }}>
                                                    {breedingStatus ?? '—'}
                                                </Text>
                                            </Text>
                                        </>
                                    )}
                                </View>

                                {/* Notes input inside the expanded section */}
                                <TextInput
                                    style={[styles.notesInput, { color: theme.text, borderColor: theme.border, backgroundColor: isDark ? '#1a2235' : '#F9F9F9' }]}
                                    value={form.notes}
                                    onChangeText={(t) => setForm(prev => ({ ...prev, notes: t }))}
                                    placeholder="Optional notes about this sighting..."
                                    placeholderTextColor={theme.textLight}
                                    multiline
                                    textAlignVertical="top"
                                />
                            </>
                        )}
                    </View>

                    {/* ── View results link ── */}
                    <TouchableOpacity onPress={() => navigation.navigate('Results')} style={{ alignSelf: 'center', marginTop: 14, marginBottom: 4 }}>
                        <Text style={{ color: theme.primary, fontSize: 13, fontWeight: '600', textDecorationLine: 'underline' }}>
                            View all submitted observations
                        </Text>
                    </TouchableOpacity>

                    {/* ── Add Observation Button ── */}
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
                                {fetchingLocation ? 'WAITING FOR GPS...' : 'ADD OBSERVATION'}
                            </Text>
                            <MaterialCommunityIcons name="plus" size={24} color="#FFF" />
                        </LinearGradient>
                    </TouchableOpacity>

                    {/* ── Pending Uploads List ── */}
                    {observationsList.length > 0 && (
                        <View style={styles.listContainer}>
                            <Text style={[styles.sectionLabel, { color: theme.textSecondary }]}>PENDING UPLOADS</Text>

                            {observationsList.map((item) => (
                                <View key={item.id} style={[styles.pendingItem, { backgroundColor: isDark ? '#252525' : '#FFF', borderLeftColor: colors.vividPink }]}>
                                    <View style={[styles.miniIcon, { backgroundColor: isDark ? '#333' : '#F5F5F5' }]}>
                                        <MaterialCommunityIcons name="bird" size={20} color={theme.primary} />
                                    </View>
                                    <View style={styles.itemMeta}>
                                        <Text style={[styles.itemTitle, { color: theme.text }]}>{item.commonName}</Text>
                                        <Text style={[styles.itemSub, { color: theme.textSecondary }]} numberOfLines={1}>
                                            {item.scientificName ? `${item.scientificName}  ·  ` : ''}{item.count} sighting{item.count > 1 ? 's' : ''}
                                        </Text>
                                        <Text style={[styles.itemSub, { color: theme.textSecondary }]} numberOfLines={1}>
                                            📍 {item.areaName}
                                        </Text>
                                    </View>
                                    <View style={styles.countControls}>
                                        <TouchableOpacity onPress={() => updateItemCount(item.id, -1)} style={styles.iconBtn}>
                                            <MaterialCommunityIcons name="minus" size={16} color={theme.text} />
                                        </TouchableOpacity>
                                        <Text style={{ color: theme.text, fontWeight: '700', minWidth: 20, textAlign: 'center' }}>{item.count}</Text>
                                        <TouchableOpacity onPress={() => updateItemCount(item.id, 1)} style={styles.iconBtn}>
                                            <MaterialCommunityIcons name="plus" size={16} color={theme.text} />
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            ))}

                            <TouchableOpacity onPress={handleSubmitAll} disabled={loading} style={{ marginTop: 15, marginBottom: 50 }}>
                                <LinearGradient colors={[colors.neonPurple, colors.softPurple]} style={styles.uploadButton}>
                                    {loading
                                        ? <ActivityIndicator color="#FFF" />
                                        : <Text style={styles.uploadText}>UPLOAD ALL ({observationsList.length})</Text>}
                                </LinearGradient>
                            </TouchableOpacity>
                        </View>
                    )}

                </ScrollView>
            </KeyboardAvoidingView>

            <StatusBar style={isDark ? 'light' : 'dark'} />
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
    container: { flex: 1 },
    content: { padding: 20, paddingBottom: 40 },

    // Header
    header: {
        flexDirection: 'row', alignItems: 'center',
        paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1,
    },
    headerLeft: { width: 40, alignItems: 'flex-start' },
    headerCenter: { flex: 1, alignItems: 'center' },
    headerRight: { width: 40, alignItems: 'flex-end' },
    title: { fontSize: 20, fontWeight: 'bold', textAlign: 'center' },
    subtitle: { fontSize: 12, marginTop: 2, textAlign: 'center' },

    // GPS Pill
    locationPill: {
        flexDirection: 'row', alignItems: 'center',
        paddingHorizontal: 14, paddingVertical: 9,
        borderRadius: 20, marginBottom: 16, elevation: 2,
        gap: 8,
    },
    locationText: { fontSize: 13, fontWeight: '600', flex: 1 },

    // Cards
    card: {
        padding: 16, borderRadius: 14,
        shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08, shadowRadius: 6, elevation: 3,
        marginBottom: 4,
    },
    sectionTitle: { fontSize: 17, fontWeight: '700', marginBottom: 16 },

    // Input
    inputGroup: { marginBottom: 16 },
    label: { fontSize: 11, fontWeight: '700', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 },
    input: { borderBottomWidth: 1, paddingVertical: 8, fontSize: 16, height: 44 },

    // Notes
    notesInput: {
        borderWidth: 1, borderRadius: 10, padding: 12,
        fontSize: 14, minHeight: 80, marginTop: 8,
    },

    breedingSection: { marginTop: 8, marginBottom: 4 },
    breedingToggle: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        paddingVertical: 10,
        paddingHorizontal: 12,
        borderRadius: 10,
        borderWidth: 1,
    },
    breedingToggleText: { flex: 1, fontSize: 14, fontWeight: '600' },
    breedingOptionsRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 10,
    },
    breedingChip: {
        minWidth: 52,
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderRadius: 10,
        borderWidth: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    breedingChipText: { fontSize: 16, fontWeight: '700' },

    // Autocomplete Dropdown
    suggestionBox: {
        borderWidth: 1, borderRadius: 12, marginTop: 4,
        overflow: 'hidden', elevation: 8,
        shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15, shadowRadius: 8, zIndex: 999,
    },
    suggestionItem: {
        paddingVertical: 12, paddingHorizontal: 14, borderBottomWidth: 1,
    },

    // Matched entry info card
    matchCard: {
        borderWidth: 1, borderRadius: 12,
        paddingHorizontal: 14, paddingVertical: 6,
        marginTop: 4, marginBottom: 12,
    },
    matchRow: {
        flexDirection: 'row', alignItems: 'flex-start',
        paddingVertical: 8, gap: 8,
    },
    matchLabel: { fontSize: 12, fontWeight: '600', width: 100, flexShrink: 0 },
    matchValue: { fontSize: 13, flex: 1 },
    matchDivider: { height: 1, backgroundColor: 'rgba(128,128,128,0.15)' },

    // Action Buttons
    addButtonWrapper: { marginTop: 24, marginBottom: 8, alignItems: 'center' },
    mainActionButton: {
        flexDirection: 'row', alignItems: 'center',
        paddingVertical: 16, paddingHorizontal: 32,
        borderRadius: 30, elevation: 8,
        shadowColor: '#FF4081', shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.4, shadowRadius: 16,
    },
    actionButtonText: { color: '#FFF', fontWeight: 'bold', fontSize: 14, letterSpacing: 1, marginRight: 8 },

    // Pending List
    listContainer: { marginTop: 20 },
    sectionLabel: { fontSize: 10, fontWeight: 'bold', letterSpacing: 1.5, marginBottom: 10, opacity: 0.7 },
    pendingItem: {
        flexDirection: 'row', alignItems: 'center',
        padding: 14, borderRadius: 12, marginBottom: 10, borderLeftWidth: 4,
    },
    miniIcon: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
    itemMeta: { flex: 1 },
    itemTitle: { fontSize: 15, fontWeight: '700' },
    itemSub: { fontSize: 11, marginTop: 2, opacity: 0.75 },
    countControls: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    iconBtn: { padding: 5, borderRadius: 6 },

    uploadButton: { paddingVertical: 14, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
    uploadText: { color: '#FFF', fontWeight: 'bold', fontSize: 12, letterSpacing: 2 },
});
