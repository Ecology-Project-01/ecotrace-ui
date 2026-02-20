import React from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import colors from '../colors/colors';

const { width } = Dimensions.get('window');

const CustomAlert = ({ visible, title, message, buttons = [], onClose }) => {
    if (!visible) return null;

    // Defaults if no buttons provided
    const actionButtons = buttons.length > 0 ? buttons : [
        { text: 'OK', onPress: onClose, style: 'default' }
    ];

    return (
        <Modal
            transparent
            visible={visible}
            animationType="fade"
            onRequestClose={onClose}
        >
            <View style={styles.overlay}>
                <View style={styles.alertContainer}>
                    <LinearGradient
                        colors={colors.gradientSurface}
                        style={styles.gradientBackground}
                    >
                        {title && <Text style={styles.title}>{title}</Text>}
                        {message && <Text style={styles.message}>{message}</Text>}

                        <View style={styles.buttonContainer}>
                            {actionButtons.map((btn, index) => {
                                const isCancel = btn.style === 'cancel';

                                return (
                                    <TouchableOpacity
                                        key={index}
                                        activeOpacity={0.8}
                                        onPress={() => {
                                            if (btn.onPress) btn.onPress();
                                            else if (onClose) onClose();
                                        }}
                                        style={[
                                            styles.buttonWrapper,
                                            isCancel ? styles.cancelButtonWrapper : {}
                                        ]}
                                    >
                                        {isCancel ? (
                                            <View style={styles.textBtn}>
                                                <Text style={styles.cancelText}>{btn.text}</Text>
                                            </View>
                                        ) : (
                                            <LinearGradient
                                                colors={colors.gradientPrimary}
                                                start={{ x: 0, y: 0 }}
                                                end={{ x: 1, y: 0 }}
                                                style={styles.primaryButton}
                                            >
                                                <Text style={styles.primaryButtonText}>{btn.text}</Text>
                                            </LinearGradient>
                                        )}
                                    </TouchableOpacity>
                                );
                            })}
                        </View>
                    </LinearGradient>
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.4)', // Dimmed background
        justifyContent: 'center',
        alignItems: 'center',
    },
    alertContainer: {
        width: width * 0.85,
        borderRadius: 20,
        overflow: 'hidden',
        elevation: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.25,
        shadowRadius: 10,
    },
    gradientBackground: {
        padding: 24,
        alignItems: 'center',
    },
    title: {
        fontSize: 20,
        fontWeight: '700',
        color: colors.primary, // Using primary color for title/brand feel
        marginBottom: 12,
        textAlign: 'center',
        letterSpacing: 0.5,
    },
    message: {
        fontSize: 15,
        color: colors.textSecondary,
        textAlign: 'center',
        marginBottom: 24,
        lineHeight: 22,
    },
    buttonContainer: {
        flexDirection: 'row',
        justifyContent: 'center', // Center buttons if few, or stretch?
        flexWrap: 'wrap',
        gap: 12,
        width: '100%',
    },
    buttonWrapper: {
        flex: 1,
        minWidth: '40%',
    },
    cancelButtonWrapper: {
        backgroundColor: 'transparent',
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 12,
    },
    primaryButton: {
        paddingVertical: 12,
        paddingHorizontal: 20,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
    textBtn: {
        paddingVertical: 12,
        alignItems: 'center',
    },
    primaryButtonText: {
        color: '#FFF',
        fontWeight: '600',
        fontSize: 15,
    },
    cancelText: {
        color: colors.textLight,
        fontWeight: '600',
        fontSize: 15,
    },
});

export default CustomAlert;
