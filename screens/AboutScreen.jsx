import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

export default function AboutScreen({ navigation }) {
  return (
    <SafeAreaView style={styles.container}>

      {/* Header */}
      <View style={styles.header}>
        {/* Back Button */}
        <TouchableOpacity
          style={styles.iconButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>

        {/* Title */}
        <Text style={styles.headerTitle}>About EcoTrace</Text>

        {/* Home Button */}
        <TouchableOpacity
          style={styles.iconButton}
          onPress={() => navigation.navigate('Main', { screen: 'Home' })}
        >
          <Ionicons name="home" size={24} color="#ff4d8d" />
        </TouchableOpacity>
      </View>

      {/* Content */}

      <Text style={styles.description}>
        EcoTrace helps users track plants, biodiversity, and environmental
        observations around them. Record field observations, explore nature,
        and support environmental awareness through organized digital monitoring.
      </Text>

      <View style={styles.versionCard}>
        <Text style={styles.version}>Version 1.0.0</Text>
      </View>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f2f2f2',
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 25,
  },

  iconButton: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },

  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
  },

//   title: {
//     fontSize: 30,
//     fontWeight: 'bold',
//     textAlign: 'center',
//     marginVertical: 20,
//   },

  description: {
    fontSize: 16,
    color: '#555',
    lineHeight: 30,
    marginBottom: 30,
    marginHorizontal: 10,
  },

  versionCard: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 15,
    marginHorizontal: 5,
  },

  version: {
    fontSize: 16,
    fontWeight: '600',
  },
});