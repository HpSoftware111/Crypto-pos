import React from 'react';
import { View, StyleSheet } from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import { QR_CODE_SIZE, COLORS } from '../utils/config';

/**
 * QRCodeDisplay Component
 * Displays QR code for payment address
 */
const QRCodeDisplay = ({ value, size = QR_CODE_SIZE }) => {
  if (!value) {
    return null;
  }

  return (
    <View style={styles.container}>
      <View style={styles.qrWrapper}>
        <QRCode
          value={value}
          size={size}
          color={COLORS.text}
          backgroundColor={COLORS.surface}
          logo={require('../../assets/icon.png')}
          logoSize={size * 0.15}
          logoBackgroundColor={COLORS.surface}
          logoMargin={4}
          logoBorderRadius={8}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    marginVertical: 16,
  },
  qrWrapper: {
    padding: 16,
    backgroundColor: COLORS.surface,
    borderRadius: 8,
  },
});

export default QRCodeDisplay;

