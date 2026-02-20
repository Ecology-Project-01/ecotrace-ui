import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, ScrollView, FlatList, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useSelector } from 'react-redux';
import { useNavigation } from '@react-navigation/native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import colors from '../colors/colors';
import { CATEGORIES } from '../constants/categories';
import { ICONS, getCategoryIcon } from '../constants/icons';

const LOCAL_IP = "192.168.1.10";
const API_URL = `http://${LOCAL_IP}:4000`;

export default function Results() {
    const isDark = useSelector((state) => state.theme.isDark);
    const { auth_email, auth_username } = useSelector((state) => state.user);
    const theme = isDark ? colors.dark : colors.light;
    const navigation = useNavigation();

    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({});
    const [allData, setAllData] = useState([]);

    useEffect(() => {
        fetchObservations();
    }, []);

    const fetchObservations = async () => {
        try {
            // Fetch ALL observations for this user
            const identifier = auth_email || auth_username;
            const response = await fetch(`${API_URL}/observations?contributor=${identifier}`);
            const data = await response.json();

            setAllData(data);
            processCategories(data);
        } catch (error) {
            console.error("Error fetching results:", error);
        } finally {
            setLoading(false);
        }
    };

    const processCategories = (data) => {
        const counts = {};
        // Initialize counts
        CATEGORIES.forEach(cat => counts[cat] = []);
        counts['Other'] = [];

        data.forEach(obs => {
            const catName = obs.taxon?.category;
            if (counts[catName]) {
                counts[catName].push(obs);
            } else {
                counts['Other'].push(obs);
            }
        });
        setStats(counts);
    };

    const CategoryCard = ({ category, items }) => (
        <TouchableOpacity
            style={[styles.card, { backgroundColor: theme.surface }]}
            activeOpacity={0.7}
            onPress={() => navigation.navigate('CategoryDetails', { category, items })}
        >
            <View style={styles.iconContainer}>
                {/* Dynamic Icon */}
                <MaterialCommunityIcons
                    name={getCategoryIcon(category)}
                    size={24}
                    color={theme.primary}
                />
            </View>
            <View style={styles.cardContent}>
                <Text style={[styles.cardTitle, { color: theme.text }]}>{category}</Text>
                <Text style={[styles.cardSubtitle, { color: theme.textSecondary }]}>{items.length} Records</Text>
            </View>
            <MaterialCommunityIcons name={ICONS.CHEVRON_RIGHT} size={24} color={theme.textLight} />
        </TouchableOpacity>
    );

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerLeft}>
                    <MaterialCommunityIcons name={ICONS.BACK} size={24} color={theme.text} />
                </TouchableOpacity>
                <View style={styles.headerCenter}>
                    <Text style={[styles.headerTitle, { color: theme.text }]}>My Results</Text>
                </View>
                <View style={styles.headerRight} />
            </View>

            {loading ? (
                <View style={styles.center}>
                    <ActivityIndicator size="large" color={theme.primary} />
                </View>
            ) : (
                <ScrollView contentContainerStyle={styles.content}>
                    {CATEGORIES.map(cat => (
                        <CategoryCard
                            key={cat}
                            category={cat}
                            items={stats[cat] || []}
                        />
                    ))}
                    {/* Show Other if it has items */}
                    {(stats['Other'] && stats['Other'].length > 0) && (
                        <CategoryCard category="Other" items={stats['Other']} />
                    )}
                </ScrollView>
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
    center: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
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
