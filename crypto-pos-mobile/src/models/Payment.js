/**
 * Payment Model
 * Represents a payment request and its status
 */

export class Payment {
  constructor(data) {
    this.paymentId = data.paymentId;
    this.address = data.address;
    this.amount = data.amount;
    this.method = data.method;
    this.qrData = data.qrData || data.address;
    this.status = data.status || 'pending';
    this.confirmed = data.confirmed || false;
    this.txHash = data.txHash || null;
    this.createdAt = data.createdAt || new Date().toISOString();
    this.confirmedAt = data.confirmedAt || null;
  }

  isPending() {
    return this.status === 'pending' && !this.confirmed;
  }

  isConfirmed() {
    return this.confirmed && this.status === 'confirmed';
  }

  hasTimeout() {
    return this.status === 'timeout';
  }

  getStatusDisplay() {
    if (this.isConfirmed()) {
      return { text: 'Payment Confirmed!', color: '#4CAF50', icon: 'check-circle' };
    }
    if (this.hasTimeout()) {
      return { text: 'Payment Timeout', color: '#F44336', icon: 'error' };
    }
    return { text: 'Waiting for payment...', color: '#FF9800', icon: 'hourglass-empty' };
  }
}

