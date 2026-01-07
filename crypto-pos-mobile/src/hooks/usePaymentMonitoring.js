import { useEffect, useState, useRef, useCallback } from 'react';
import { checkPaymentStatus } from '../api/endpoints';
import { PAYMENT_CHECK_INTERVAL, MAX_RETRIES } from '../utils/config';
import { Payment } from '../models/Payment';

/**
 * Custom hook for monitoring payment status
 * Polls the server every 2 seconds until payment is confirmed or timeout
 */
export const usePaymentMonitoring = (paymentId) => {
  const [payment, setPayment] = useState(null);
  const [confirmed, setConfirmed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const intervalRef = useRef(null);
  const retryCountRef = useRef(0);
  const isActiveRef = useRef(true);

  const checkPayment = useCallback(async () => {
    if (!paymentId || !isActiveRef.current) return;

    try {
      setLoading(true);
      setError(null);

      const paymentData = await checkPaymentStatus(paymentId);
      const paymentInstance = new Payment(paymentData);

      setPayment(paymentInstance);

      if (paymentInstance.isConfirmed()) {
        setConfirmed(true);
        // Stop monitoring on confirmation
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
      } else {
        retryCountRef.current += 1;

        // Check for timeout
        if (retryCountRef.current >= MAX_RETRIES) {
          paymentInstance.status = 'timeout';
          setPayment(paymentInstance);
          if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
          }
        }
      }
    } catch (err) {
      console.error('Payment monitoring error:', err);
      setError(err.message);
      // Don't stop monitoring on network errors, just log them
    } finally {
      setLoading(false);
    }
  }, [paymentId]);

  useEffect(() => {
    if (!paymentId) {
      return;
    }

    isActiveRef.current = true;
    retryCountRef.current = 0;
    setConfirmed(false);
    setError(null);

    // Initial check
    checkPayment();

    // Set up polling interval
    intervalRef.current = setInterval(() => {
      if (isActiveRef.current && !confirmed && retryCountRef.current < MAX_RETRIES) {
        checkPayment();
      }
    }, PAYMENT_CHECK_INTERVAL);

    // Cleanup function
    return () => {
      isActiveRef.current = false;
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [paymentId, checkPayment, confirmed]);

  // Calculate remaining time
  const getRemainingTime = () => {
    if (!paymentId || confirmed) return null;
    
    const totalSeconds = MAX_RETRIES * (PAYMENT_CHECK_INTERVAL / 1000);
    const elapsedSeconds = retryCountRef.current * (PAYMENT_CHECK_INTERVAL / 1000);
    const remainingSeconds = Math.max(0, totalSeconds - elapsedSeconds);
    
    const minutes = Math.floor(remainingSeconds / 60);
    const seconds = Math.floor(remainingSeconds % 60);
    
    return { minutes, seconds, total: remainingSeconds };
  };

  return {
    payment,
    confirmed,
    loading,
    error,
    retryCount: retryCountRef.current,
    remainingTime: getRemainingTime(),
  };
};

