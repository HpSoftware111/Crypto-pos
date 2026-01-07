import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Clipboard from '@react-native-clipboard/clipboard';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONT_SIZES } from '../utils/config';

/**
 * AddressCopy Component
 * Displays address with copy functionality
 */
const AddressCopy = ({ address, label = 'Payment Address' }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await Clipboard.setString(address);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy address:', error);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.addressRow}>
        <Text style={styles.address} numberOfLines={1} ellipsizeMode="middle">
          {address}
        </Text>
        <TouchableOpacity
          onPress={handleCopy}
          style={[styles.copyButton, copied && styles.copyButtonActive]}
          activeOpacity={0.7}
        >
          <Ionicons
            name={copied ? 'checkmark' : 'copy-outline'}
            size={18}
            color={COLORS.surface}
            style={styles.copyIcon}
          />
          <Text style={styles.copyButtonText}>{copied ? 'Copied!' : 'Copy'}</Text>
        </TouchableOpacity>
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
  },
  label: {
    fontSize: FONT_SIZES.medium,
    color: COLORS.textSecondary,
    marginBottom: 8,
    fontWeight: '500',
  },
  addressRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  address: {
    flex: 1,
    fontSize: FONT_SIZES.small,
    fontFamily: 'monospace',
    color: COLORS.text,
    marginRight: 12,
    paddingVertical: 8,
  },
  copyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
  },
  copyButtonActive: {
    backgroundColor: COLORS.success,
  },
  copyIcon: {
    marginRight: 6,
  },
  copyButtonText: {
    color: COLORS.surface,
    fontSize: FONT_SIZES.medium,
    fontWeight: '600',
  },
});

export default AddressCopy;

