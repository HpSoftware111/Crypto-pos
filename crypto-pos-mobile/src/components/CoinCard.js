import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { COLORS, FONT_SIZES } from '../utils/config';

/**
 * CoinCard Component
 * Displays a coin/payment method card
 */
const CoinCard = ({ coin, onPress, baseUrl }) => {
  const [imageError, setImageError] = React.useState(false);
  const iconUrl = coin.getIconUrl(baseUrl);

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.iconContainer}>
        {iconUrl && !imageError ? (
          <Image
            source={{ uri: iconUrl }}
            style={styles.icon}
            resizeMode="contain"
            onError={() => setImageError(true)}
          />
        ) : (
          <View style={styles.iconPlaceholder}>
            <Text style={styles.iconText}>{coin.symbol.charAt(0)}</Text>
          </View>
        )}
      </View>
      <View style={styles.infoContainer}>
        <Text style={styles.name}>{coin.getDisplayName()}</Text>
        <Text style={styles.symbol}>{coin.getDisplaySymbol()}</Text>
      </View>
      <View style={styles.arrowContainer}>
        <Text style={styles.arrow}>›</Text>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  iconContainer: {
    width: 56,
    height: 56,
    marginRight: 16,
  },
  icon: {
    width: '100%',
    height: '100%',
    borderRadius: 28,
  },
  iconPlaceholder: {
    width: '100%',
    height: '100%',
    borderRadius: 28,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconText: {
    color: COLORS.surface,
    fontSize: 24,
    fontWeight: 'bold',
  },
  infoContainer: {
    flex: 1,
  },
  name: {
    fontSize: FONT_SIZES.large,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 4,
  },
  symbol: {
    fontSize: FONT_SIZES.medium,
    color: COLORS.textSecondary,
  },
  arrowContainer: {
    marginLeft: 8,
  },
  arrow: {
    fontSize: 24,
    color: COLORS.textSecondary,
    fontWeight: '300',
  },
});

export default CoinCard;

