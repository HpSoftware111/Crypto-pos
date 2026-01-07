/**
 * Coin Model
 * Represents a cryptocurrency payment method
 */

export class Coin {
  constructor(data) {
    this.id = data.id;
    this.name = data.name;
    this.symbol = data.symbol;
    this.enabled = data.enabled === 1 || data.enabled === true;
    this.network = data.network || 'mainnet';
    this.walletAddress = data.wallet_address;
    this.apiUrl = data.api_url;
    this.apiKey = data.api_key;
    this.contractAddress = data.contract_address;
    this.confirmationsRequired = data.confirmations_required || 1;
    this.icon = data.icon;
    this.decimals = data.decimals || 18;
    this.methodCode = data.method_code;
    this.createdAt = data.created_at;
    this.updatedAt = data.updated_at;
  }

  getIconUrl(baseUrl) {
    if (!this.icon) return null;
    // If icon is already a full URL, return it
    if (this.icon.startsWith('http://') || this.icon.startsWith('https://')) {
      return this.icon;
    }
    // Otherwise, construct the full URL
    return `${baseUrl}/${this.icon}`;
  }

  getDisplayName() {
    return this.network === 'mainnet' ? this.name : `${this.name} (${this.network})`;
  }

  getDisplaySymbol() {
    return this.network === 'mainnet' ? this.symbol : this.network;
  }
}

