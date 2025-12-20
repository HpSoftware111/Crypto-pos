# Crypto POS - Production-Ready Point of Sale System

A production-ready Point of Sale system for accepting cryptocurrency payments. Supports **USDT on Avalanche** and **Bitcoin (BTC)** with real blockchain monitoring.

## Features

- 🟢 **USDT (Avalanche)** payment support with real-time monitoring
- 🟠 **Bitcoin (BTC)** payment support with real-time monitoring
- 💰 Amount input with validation
- 📱 QR code generation for easy payment
- ✅ Real-time blockchain payment confirmation
- 🔒 Secure backend API for wallet management
- 🎨 Modern, responsive UI
- ⚡ Fast payment detection (checks every 2 seconds)
- 🔄 Automatic retry logic with timeout handling
- 📊 Payment status tracking

## Architecture

- **Backend**: Node.js + Express server
- **Frontend**: Vanilla JavaScript (no framework dependencies)
- **Blockchain APIs**:
  - Bitcoin: Blockstream API
  - USDT (Avalanche): Snowtrace API

## Prerequisites

- Node.js 14.0.0 or higher
- npm or yarn
- Bitcoin wallet address
- Avalanche wallet address (for USDT)

## Installation

1. **Clone or download the project**

2. **Install dependencies**:
```bash
npm install
```

3. **Configure environment variables**:
```bash
cp .env.example .env
```

4. **Edit `.env` file** with your wallet addresses:
```env
PORT=3000
BTC_WALLET_ADDRESS=your_bitcoin_wallet_address_here
AVALANCHE_WALLET_ADDRESS=your_avalanche_wallet_address_here
SNOWTRACE_API_KEY=your_snowtrace_api_key_here  # Optional but recommended
```

### Getting a Snowtrace API Key (Optional)

1. Visit [Snowtrace.io](https://snowtrace.io/)
2. Create a free account
3. Navigate to API section
4. Generate an API key
5. Add it to your `.env` file

**Note**: The API key is optional but recommended as it increases rate limits for USDT payment checking.

## Running the Application

### Development/Production

```bash
npm start
```

The server will start on `http://localhost:3000` (or the port specified in `.env`).

Open your browser and navigate to the URL shown in the console.

## How It Works

1. **Select Payment Method**: Merchant chooses USDT (Avalanche) or Bitcoin
2. **Enter Amount**: Merchant enters the payment amount
3. **Generate Payment**: System creates a payment request and displays:
   - QR code for customer to scan
   - Payment address
   - Payment status
4. **Monitor Payment**: System automatically checks blockchain every 2 seconds
5. **Confirm Payment**: Once payment is detected on blockchain, status updates to confirmed

## API Endpoints

### `POST /api/payment/create`
Create a new payment request.

**Request Body**:
```json
{
  "method": "btc" | "usdt-avax",
  "amount": 0.001
}
```

**Response**:
```json
{
  "paymentId": "payment_1234567890_abc123",
  "address": "bc1...",
  "amount": 0.001,
  "method": "btc",
  "qrData": "bitcoin:bc1...?amount=0.001"
}
```

### `GET /api/payment/status/:paymentId`
Check payment status.

**Response**:
```json
{
  "paymentId": "payment_1234567890_abc123",
  "status": "pending" | "confirmed",
  "confirmed": true,
  "amount": 0.001,
  "method": "btc",
  "address": "bc1...",
  "txHash": "abc123...",
  "createdAt": "2024-01-01T00:00:00.000Z",
  "confirmedAt": "2024-01-01T00:00:05.000Z"
}
```

### `GET /api/health`
Health check endpoint.

**Response**:
```json
{
  "status": "ok",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "activePayments": 5
}
```

## Payment Verification

### Bitcoin (BTC)
- Uses Blockstream API to check transactions
- Verifies amount matches (with 0.0001 BTC tolerance)
- Checks transactions after payment request creation time
- Confirms payment when matching transaction is found

### USDT (Avalanche)
- Uses Snowtrace API to check token transfers
- Verifies USDT amount (with 0.01 USDT tolerance)
- Checks for USDT token transfers to merchant address
- Confirms payment when matching transfer is found

## Security Considerations

1. **Wallet Addresses**: Store wallet addresses securely in `.env` file
2. **HTTPS**: Always use HTTPS in production
3. **Rate Limiting**: Consider adding rate limiting for production
4. **Database**: For production, replace in-memory storage with a database (Redis/PostgreSQL)
5. **API Keys**: Keep API keys secure and never commit them to version control
6. **Validation**: All inputs are validated server-side
7. **Error Handling**: Comprehensive error handling prevents information leakage

## Production Deployment

### Recommended Setup

1. **Use a Process Manager**:
   - PM2: `npm install -g pm2 && pm2 start server.js`
   - Forever: `npm install -g forever && forever start server.js`

2. **Use a Reverse Proxy**:
   - Nginx or Apache in front of the Node.js server
   - Configure SSL/TLS certificates

3. **Database Storage**:
   - Replace in-memory `activePayments` Map with Redis or PostgreSQL
   - Store payment history for audit trails

4. **Monitoring**:
   - Set up logging (Winston, Pino)
   - Monitor server health
   - Set up alerts for failed payments

5. **Environment Variables**:
   - Use secure secret management (AWS Secrets Manager, HashiCorp Vault)
   - Never commit `.env` files

### Example PM2 Configuration

Create `ecosystem.config.js`:
```javascript
module.exports = {
  apps: [{
    name: 'crypto-pos',
    script: 'server.js',
    instances: 1,
    exec_mode: 'fork',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    }
  }]
};
```

Run with: `pm2 start ecosystem.config.js`

## Troubleshooting

### Payment Not Detected

1. **Check wallet addresses**: Ensure addresses in `.env` are correct
2. **Check API connectivity**: Verify internet connection and API availability
3. **Check transaction**: Verify transaction on blockchain explorer
4. **Check timing**: Payment must occur after payment request creation
5. **Check amount**: Payment amount must match (within tolerance)

### Server Errors

1. **Port already in use**: Change `PORT` in `.env`
2. **Missing dependencies**: Run `npm install`
3. **API rate limits**: Add API keys to increase limits
4. **Check logs**: Review console output for error messages

## File Structure

```
crypto-pos/
├── server.js           # Backend Express server
├── public/             # Frontend files
│   ├── index.html     # Main HTML
│   ├── styles.css     # Styling
│   └── app.js         # Frontend JavaScript
├── package.json        # Dependencies
├── .env.example        # Environment template
├── .gitignore          # Git ignore rules
└── README.md           # This file
```

## License

MIT

## Support

For issues or questions, please check:
- Blockchain API documentation
- Server logs for error messages
- Network connectivity

## Contributing

This is a production-ready system. For enhancements:
1. Test thoroughly with real blockchain transactions
2. Ensure security best practices
3. Add comprehensive error handling
4. Update documentation
