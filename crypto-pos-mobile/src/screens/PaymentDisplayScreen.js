import React, { useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { usePaymentMonitoring } from '../hooks/usePaymentMonitoring';
import QRCodeDisplay from '../components/QRCodeDisplay';
import AddressCopy from '../components/AddressCopy';
import PaymentStatus from '../components/PaymentStatus';
import { COLORS, FONT_SIZES } from '../utils/config';

/**
 * PaymentDisplayScreen
 * Displays payment QR code, address, and monitors payment status
 */
const PaymentDisplayScreen = ({ route, navigation }) => {
  const { paymentData, coin, amount } = route.params;
  const { payment, confirmed, remainingTime } = usePaymentMonitoring(
    paymentData.paymentId
  );

  useEffect(() => {
    if (confirmed && payment) {
      Alert.alert(
        '✅ Payment Confirmed!',
        `Payment of ${amount} ${coin.symbol} has been confirmed.${payment.txHash ? `\n\nTransaction: ${payment.txHash.substring(0, 16)}...` : ''}`,
        [
          {
            text: 'New Payment',
            onPress: () => navigation.navigate('PaymentMethod'),
            style: 'default',
          },
          {
            text: 'Stay Here',
            style: 'cancel',
          },
        ]
      );
    }
  }, [confirmed, payment, amount, coin, navigation]);

  const handleNewPayment = () => {
    navigation.navigate('PaymentMethod');
  };

  const handleCancel = () => {
    Alert.alert(
      'Cancel Payment',
      'Are you sure you want to cancel this payment request?',
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Yes',
          style: 'destructive',
          onPress: () => navigation.navigate('PaymentMethod'),
        },
      ]
    );
  };

  const status = payment?.status || 'pending';

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.header}>
        <Text style={styles.title}>Payment Request</Text>
        <Text style={styles.subtitle}>Scan QR code or copy address to pay</Text>
      </View>

      {/* Payment Info Cards */}
      <View style={styles.infoCard}>
        <Text style={styles.infoLabel}>Amount</Text>
        <Text style={styles.infoValue}>
          {amount} {coin.symbol}
        </Text>
      </View>

      <View style={styles.infoCard}>
        <Text style={styles.infoLabel}>Payment Method</Text>
        <Text style={styles.infoValue}>{coin.getDisplayName()}</Text>
      </View>

      {/* QR Code */}
      <QRCodeDisplay value={paymentData.qrData || paymentData.address} />

      {/* Address Copy */}
      <AddressCopy address={paymentData.address} />

      {/* Payment Status */}
      <PaymentStatus status={status} remainingTime={remainingTime} />

      {/* Transaction Hash if confirmed */}
      {payment?.txHash && (
        <View style={styles.txCard}>
          <Text style={styles.txLabel}>Transaction Hash</Text>
          <Text style={styles.txHash} numberOfLines={1} ellipsizeMode="middle">
            {payment.txHash}
          </Text>
        </View>
      )}

      {/* Action Buttons */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[styles.button, styles.buttonSecondary]}
          onPress={handleCancel}
        >
          <Text style={styles.buttonSecondaryText}>Cancel</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.buttonPrimary]}
          onPress={handleNewPayment}
        >
          <Text style={styles.buttonPrimaryText}>New Payment</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  contentContainer: {
    padding: 20,
    paddingBottom: 32,
  },
  header: {
    marginBottom: 20,
  },
  title: {
    fontSize: FONT_SIZES.title,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: FONT_SIZES.medium,
    color: COLORS.textSecondary,
  },
  infoCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  infoLabel: {
    fontSize: FONT_SIZES.medium,
    color: COLORS.textSecondary,
    marginBottom: 4,
    fontWeight: '500',
  },
  infoValue: {
    fontSize: FONT_SIZES.xlarge,
    fontWeight: '600',
    color: COLORS.text,
  },
  txCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 16,
    marginVertical: 12,
  },
  txLabel: {
    fontSize: FONT_SIZES.medium,
    color: COLORS.textSecondary,
    marginBottom: 8,
    fontWeight: '500',
  },
  txHash: {
    fontSize: FONT_SIZES.small,
    fontFamily: 'monospace',
    color: COLORS.text,
    backgroundColor: COLORS.background,
    padding: 12,
    borderRadius: 8,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
  },
  button: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 56,
  },
  buttonPrimary: {
    backgroundColor: COLORS.primary,
  },
  buttonSecondary: {
    backgroundColor: COLORS.surface,
    borderWidth: 2,
    borderColor: COLORS.border,
  },
  buttonPrimaryText: {
    color: COLORS.surface,
    fontSize: FONT_SIZES.large,
    fontWeight: '600',
  },
  buttonSecondaryText: {
    color: COLORS.text,
    fontSize: FONT_SIZES.large,
    fontWeight: '600',
  },
});

export default PaymentDisplayScreen;

