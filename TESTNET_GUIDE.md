# Testnet Testing Guide for Crypto POS

This guide will help you test the Crypto POS system on Avalanche Testnet (Fuji) before using it on Mainnet.

## Prerequisites

1. **Avalanche Wallet** (Core Wallet or MetaMask)
2. **Testnet AVAX** from faucet
3. **Testnet wallet address**

---

## Step 1: Switch to Testnet

### Update Server Configuration

Set the AVAX network to testnet using the API:

```bash
curl -X POST http://localhost:3000/api/status/avax \
  -H "Content-Type: application/json" \
  -d '{
    "walletAddress": "YOUR_TESTNET_WALLET_ADDRESS",
    "network": "testnet"
  }'
```

**Or** directly edit `server.js`:

```javascript
AVAX: {
    walletAddress: 'YOUR_TESTNET_WALLET_ADDRESS',
    network: 'testnet' // Change from 'mainnet' to 'testnet'
}
```

### Verify Configuration

```bash
curl http://localhost:3000/api/status
```

Check that `avax.network` shows `"testnet"`.

---

## Step 2: Get Testnet AVAX (Fuji Faucet)

### Option 1: Official Avalanche Faucet

1. Visit: https://faucet.avax.network/
2. Enter your testnet wallet address
3. Complete CAPTCHA
4. Request testnet AVAX
5. Wait for confirmation (usually instant)

### Option 2: Alternative Faucets

- **Chainlink Faucet**: https://faucets.chain.link/avalanche-fuji
- **QuickNode Faucet**: https://faucet.quicknode.com/avalanche/fuji

### Verify Testnet AVAX

1. Open your wallet
2. Switch to **Avalanche Fuji Testnet**
3. Check balance (should show testnet AVAX)

---

## Step 3: Test Payment Flow

### 3.1 Start the Server

```bash
npm start
```

Expected output:
```
🚀 Crypto POS Server running on port 3000
📱 Access the POS at http://localhost:3000
✅ All wallet addresses configured
   AVAX Network: testnet
```

### 3.2 Create Test Payment via API

```bash
curl -X POST http://localhost:3000/api/payment/create \
  -H "Content-Type: application/json" \
  -d '{
    "method": "avax",
    "amount": 0.1
  }'
```

**Response:**
```json
{
  "paymentId": "payment_1234567890_abc123",
  "address": "YOUR_TESTNET_WALLET_ADDRESS",
  "amount": 0.1,
  "method": "avax",
  "qrData": "YOUR_TESTNET_WALLET_ADDRESS"
}
```

**Save the `paymentId` for monitoring.**

### 3.3 Test via UI

1. Open browser: `http://localhost:3000`
2. Click **AVAX** button
3. Enter amount: `0.1`
4. Click **Generate Payment**
5. Verify:
   - QR code appears
   - Payment address shows your testnet address
   - Status shows "Waiting for payment..."

---

## Step 4: Send Test Payment

### Using MetaMask

1. Open MetaMask
2. Switch to **Avalanche Fuji Testnet**
3. Click **Send**
4. Paste the payment address from POS
5. Enter amount: `0.1 AVAX`
6. Confirm transaction
7. Wait for confirmation (usually 1-2 seconds on testnet)

### Using Core Wallet

1. Open Avalanche Core Wallet
2. Ensure you're on **Fuji Testnet**
3. Go to **Send** tab
4. Enter payment address
5. Enter amount: `0.1 AVAX`
6. Confirm and send

---

## Step 5: Monitor Payment

### Via API

```bash
# Replace PAYMENT_ID with actual ID from step 3.2
curl http://localhost:3000/api/payment/status/PAYMENT_ID
```

**Check every 2-3 seconds until payment is confirmed.**

Expected response when confirmed:
```json
{
  "paymentId": "payment_...",
  "status": "confirmed",
  "confirmed": true,
  "amount": 0.1,
  "method": "avax",
  "address": "...",
  "txHash": "0x...",
  "createdAt": "2024-...",
  "confirmedAt": "2024-..."
}
```

### Via UI

- Watch the status update every 2 seconds
- Timer should count up
- When payment detected: Status changes to "Payment confirmed!"
- Transaction hash appears in success message

---

## Step 6: Verify on Testnet Explorer

1. Visit: https://testnet.snowtrace.io/
2. Enter transaction hash from confirmed payment
3. Verify transaction details:
   - Amount matches
   - To address matches your wallet
   - Status: Success

---

## Step 7: Test Edge Cases

### Test 1: Partial Payment

1. Create payment for `1 AVAX`
2. Send only `0.5 AVAX`
3. System should NOT confirm (amount mismatch)

### Test 2: Overpayment

1. Create payment for `0.1 AVAX`
2. Send `0.2 AVAX`
3. System SHOULD confirm (overpayment accepted)

### Test 3: Multiple Payments

1. Create multiple payments
2. Send payments in different order
3. Verify each payment is tracked independently

### Test 4: Payment Timeout

1. Create payment
2. Don't send payment
3. Wait 1 minute (30 checks × 2 seconds)
4. System should show timeout message

---

## Step 8: Switch Back to Mainnet

When ready for production:

```bash
curl -X POST http://localhost:3000/api/status/avax \
  -H "Content-Type: application/json" \
  -d '{
    "walletAddress": "0x91870B9c25C06E10Bcb88bdd0F7b43A13C2d7c41",
    "network": "mainnet"
  }'
```

**Or** edit `server.js`:

```javascript
AVAX: {
    walletAddress: '0x91870B9c25C06E10Bcb88bdd0F7b43A13C2d7c41',
    network: 'mainnet'
}
```

Restart server and verify:
```bash
curl http://localhost:3000/api/status
```

---

## Troubleshooting

### Payment Not Detected

1. **Check network**: Verify you're on Fuji Testnet
2. **Check address**: Ensure payment sent to correct address
3. **Check timing**: Payment must be sent AFTER payment request creation
4. **Check amount**: Must match (within 0.01 AVAX tolerance)
5. **Check explorer**: Verify transaction on testnet.snowtrace.io

### API Errors

1. **404 errors**: Check payment ID is correct
2. **500 errors**: Check server logs for details
3. **Network errors**: Verify testnet API is accessible

### Server Logs

Watch server console for:
- Payment creation logs
- Blockchain API calls
- Payment confirmation logs
- Error messages

---

## Test Checklist

- [ ] Server starts with testnet configuration
- [ ] Status endpoint shows `network: "testnet"`
- [ ] Can create AVAX payment request
- [ ] QR code generates correctly
- [ ] Payment address is testnet address
- [ ] Can send testnet AVAX from wallet
- [ ] Payment is detected within 2-10 seconds
- [ ] Transaction hash is captured
- [ ] Success message displays correctly
- [ ] Transaction visible on testnet explorer
- [ ] Partial payments are rejected
- [ ] Overpayments are accepted
- [ ] Multiple payments work independently
- [ ] Timeout works after 1 minute
- [ ] Can switch back to mainnet

---

## Testnet Resources

- **Testnet Explorer**: https://testnet.snowtrace.io/
- **Faucet**: https://faucet.avax.network/
- **Testnet Docs**: https://docs.avax.network/quickstart/fuji-workflow
- **RPC Endpoint**: https://api.avax-test.network/ext/bc/C/rpc

---

## Quick Test Script

Save as `test-testnet.js`:

```javascript
const axios = require('axios');
const BASE_URL = 'http://localhost:3000';

async function testTestnet() {
    console.log('🧪 Testing AVAX on Testnet...\n');
    
    try {
        // 1. Check status
        console.log('1. Checking configuration...');
        const status = await axios.get(`${BASE_URL}/api/status`);
        console.log('   Network:', status.data.config.avax.network);
        console.log('   Address:', status.data.config.avax.walletAddress);
        
        // 2. Create payment
        console.log('\n2. Creating test payment...');
        const payment = await axios.post(`${BASE_URL}/api/payment/create`, {
            method: 'avax',
            amount: 0.1
        });
        console.log('   Payment ID:', payment.data.paymentId);
        console.log('   Address:', payment.data.address);
        console.log('   Amount:', payment.data.amount, 'AVAX');
        
        // 3. Monitor payment
        console.log('\n3. Monitoring payment (checking every 3 seconds)...');
        console.log('   Send 0.1 AVAX to the address above from your testnet wallet');
        console.log('   Press Ctrl+C to stop monitoring\n');
        
        let checkCount = 0;
        const interval = setInterval(async () => {
            checkCount++;
            try {
                const status = await axios.get(`${BASE_URL}/api/payment/status/${payment.data.paymentId}`);
                console.log(`[${checkCount}] Status: ${status.data.status} | Confirmed: ${status.data.confirmed}`);
                
                if (status.data.confirmed) {
                    console.log('\n✅ Payment confirmed!');
                    console.log('   Transaction Hash:', status.data.txHash);
                    console.log('   Amount:', status.data.amount, 'AVAX');
                    clearInterval(interval);
                    process.exit(0);
                }
            } catch (error) {
                console.error('Error checking status:', error.message);
            }
        }, 3000);
        
    } catch (error) {
        console.error('❌ Test failed:', error.response?.data || error.message);
        process.exit(1);
    }
}

testTestnet();
```

Run:
```bash
node test-testnet.js
```

---

## Notes

- Testnet transactions are free (no real value)
- Testnet blocks are faster than mainnet
- Testnet AVAX has no real value
- Always test thoroughly on testnet before mainnet
- Keep testnet and mainnet addresses separate

---

## Support

If you encounter issues:
1. Check server logs
2. Verify network configuration
3. Check testnet explorer for transaction
4. Ensure wallet is on correct network
5. Verify API endpoints are accessible

