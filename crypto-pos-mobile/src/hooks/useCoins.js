import { useState, useEffect, useCallback } from 'react';
import { getCoins } from '../api/endpoints';
import { Coin } from '../models/Coin';

/**
 * Custom hook for fetching and managing coins
 */
export const useCoins = () => {
  const [coins, setCoins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchCoins = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const coinsData = await getCoins();
      const coinInstances = coinsData.map((coinData) => new Coin(coinData));
      
      setCoins(coinInstances);
    } catch (err) {
      console.error('Error fetching coins:', err);
      setError(err.message || 'Failed to load payment methods');
      setCoins([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCoins();
  }, [fetchCoins]);

  return {
    coins,
    loading,
    error,
    refetch: fetchCoins,
  };
};

