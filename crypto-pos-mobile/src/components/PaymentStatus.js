import React from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONT_SIZES } from '../utils/config';

/**
 * PaymentStatus Component
 * Displays payment status with icon and text
 */
const PaymentStatus = ({ status, remainingTime }) => {
  const getStatusConfig = () => {
    if (status === 'confirmed') {
      return {
        text: 'Payment Confirmed!',
        color: COLORS.success,
        icon: 'checkmark-circle',
        showSpinner: false,
      };
    }
    if (status === 'timeout') {
      return {
        text: 'Payment Timeout',
        color: COLORS.error,
        icon: 'close-circle',
        showSpinner: false,
      };
    }
    // pending
    return {
      text: 'Waiting for payment...',
      color: COLORS.warning,
      icon: 'hourglass',
      showSpinner: true,
    };
  };

  const config = getStatusConfig();
  const timeText = remainingTime
    ? ` (${remainingTime.minutes}:${remainingTime.seconds.toString().padStart(2, '0')} remaining)`
    : '';

  return (
    <View style={[styles.container, { borderColor: config.color }]}>
      <View style={styles.content}>
        {config.showSpinner ? (
          <ActivityIndicator size="small" color={config.color} style={styles.icon} />
        ) : (
          <Ionicons name={config.icon} size={24} color={config.color} style={styles.icon} />
        )}
        <Text style={[styles.text, { color: config.color }]}>
          {config.text}{timeText}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 16,
    marginVertical: 12,
    borderWidth: 2,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  icon: {
    marginRight: 12,
  },
  text: {
    fontSize: FONT_SIZES.large,
    fontWeight: '600',
    flex: 1,
  },
});

export default PaymentStatus;

