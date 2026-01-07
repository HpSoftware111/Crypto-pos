import React from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from 'react-native';
import { useCoins } from '../hooks/useCoins';
import CoinCard from '../components/CoinCard';
import { COLORS, FONT_SIZES, API_BASE_URL } from '../utils/config';

/**
 * PaymentMethodScreen
 * Displays list of available payment methods (coins)
 */
const PaymentMethodScreen = ({ navigation }) => {
  const { coins, loading, error, refetch } = useCoins();

  const handleCoinSelect = (coin) => {
    navigation.navigate('AmountInput', { coin });
  };

  const handleRetry = () => {
    refetch();
  };

  React.useEffect(() => {
    if (error) {
      Alert.alert(
        'Error',
        error || 'Failed to load payment methods. Please check your server connection.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Retry', onPress: handleRetry },
        ]
      );
    }
  }, [error]);

  if (loading && coins.length === 0) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Loading payment methods...</Text>
      </View>
    );
  }

  if (error && coins.length === 0) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorIcon}>⚠️</Text>
        <Text style={styles.errorTitle}>Connection Error</Text>
        <Text style={styles.errorText}>
          {error || 'Unable to connect to server. Please check your configuration.'}
        </Text>
        <Text style={styles.configHint}>
          Make sure your server is running and API_BASE_URL is correct in src/utils/config.js
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Select Payment Method</Text>
        <Text style={styles.subtitle}>Choose a cryptocurrency to accept payment</Text>
      </View>

      <FlatList
        data={coins}
        renderItem={({ item }) => (
          <CoinCard
            coin={item}
            onPress={() => handleCoinSelect(item)}
            baseUrl={API_BASE_URL}
          />
        )}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        refreshControl={
          <RefreshControl
            refreshing={loading}
            onRefresh={refetch}
            tintColor={COLORS.primary}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No payment methods available</Text>
            <Text style={styles.emptySubtext}>
              Please configure coins in the admin panel
            </Text>
          </View>
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    padding: 20,
    paddingTop: 16,
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
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
  listContainer: {
    padding: 16,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
    backgroundColor: COLORS.background,
  },
  loadingText: {
    marginTop: 16,
    fontSize: FONT_SIZES.medium,
    color: COLORS.textSecondary,
  },
  errorIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  errorTitle: {
    fontSize: FONT_SIZES.xxlarge,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 8,
  },
  errorText: {
    fontSize: FONT_SIZES.medium,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: 16,
  },
  configHint: {
    fontSize: FONT_SIZES.small,
    color: COLORS.textSecondary,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  emptyContainer: {
    padding: 32,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: FONT_SIZES.large,
    color: COLORS.textSecondary,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: FONT_SIZES.medium,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
});

export default PaymentMethodScreen;

