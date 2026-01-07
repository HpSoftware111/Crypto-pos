import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Keyboard,
  ActivityIndicator,
} from 'react-native';
import { createPayment } from '../api/endpoints';
import { COLORS, FONT_SIZES } from '../utils/config';

/**
 * AmountInputScreen
 * Allows user to enter payment amount and generate payment request
 */
const AmountInputScreen = ({ route, navigation }) => {
  const { coin } = route.params;
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => {
    // Focus input on mount
    const timer = setTimeout(() => {
      inputRef.current?.focus();
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  const validateAmount = (value) => {
    const numValue = parseFloat(value);
    if (isNaN(numValue) || numValue <= 0) {
      return { valid: false, error: 'Please enter a valid amount greater than 0' };
    }
    return { valid: true, value: numValue };
  };

  const handleGenerate = async () => {
    Keyboard.dismiss();

    const validation = validateAmount(amount);
    if (!validation.valid) {
      Alert.alert('Invalid Amount', validation.error);
      return;
    }

    try {
      setLoading(true);

      const paymentData = await createPayment(coin.methodCode, validation.value);

      // Navigate to payment display screen
      navigation.navigate('PaymentDisplay', {
        paymentData,
        coin,
        amount: validation.value,
      });
    } catch (error) {
      Alert.alert(
        'Payment Creation Failed',
        error.message || 'Failed to create payment request. Please try again.',
        [{ text: 'OK' }]
      );
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    navigation.goBack();
  };

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>Enter Amount</Text>
          <Text style={styles.subtitle}>
            Amount in {coin.symbol} ({coin.name})
          </Text>
        </View>

        <View style={styles.inputContainer}>
          <View style={styles.inputWrapper}>
            <TextInput
              ref={inputRef}
              style={styles.input}
              placeholder="0.00"
              placeholderTextColor={COLORS.textSecondary}
              value={amount}
              onChangeText={setAmount}
              keyboardType="decimal-pad"
              autoFocus={true}
              editable={!loading}
            />
            <Text style={styles.currencyLabel}>{coin.symbol}</Text>
          </View>
          <Text style={styles.hint}>
            Enter the amount you want to receive
          </Text>
        </View>

        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[styles.button, styles.buttonSecondary]}
            onPress={handleBack}
            disabled={loading}
          >
            <Text style={styles.buttonSecondaryText}>Back</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, styles.buttonPrimary, loading && styles.buttonDisabled]}
            onPress={handleGenerate}
            disabled={loading || !amount}
          >
            {loading ? (
              <ActivityIndicator size="small" color={COLORS.surface} />
            ) : (
              <Text style={styles.buttonPrimaryText}>Generate Payment</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  header: {
    marginBottom: 32,
  },
  title: {
    fontSize: FONT_SIZES.title,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: FONT_SIZES.medium,
    color: COLORS.textSecondary,
  },
  inputContainer: {
    marginBottom: 32,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    paddingHorizontal: 20,
    paddingVertical: 4,
    borderWidth: 2,
    borderColor: COLORS.border,
    marginBottom: 8,
  },
  input: {
    flex: 1,
    fontSize: 36,
    fontWeight: '600',
    color: COLORS.text,
    paddingVertical: 16,
    minHeight: 70,
  },
  currencyLabel: {
    fontSize: FONT_SIZES.xlarge,
    fontWeight: '600',
    color: COLORS.textSecondary,
    marginLeft: 12,
  },
  hint: {
    fontSize: FONT_SIZES.small,
    color: COLORS.textSecondary,
    marginLeft: 4,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
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
  buttonDisabled: {
    opacity: 0.6,
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

export default AmountInputScreen;

