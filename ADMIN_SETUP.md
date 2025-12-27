# Admin Management System - Setup Guide

## ✅ Implementation Complete!

A comprehensive admin management system has been implemented with JSON database storage, authentication, and full admin UI.

## 🚀 Quick Start

### 1. Install Dependencies

```bash
npm install
```

Required packages:
- `bcrypt` - Password hashing
- `express-session` - Session management

Note: Database is now stored in JSON format (`data.json`) for compatibility with serverless platforms like Vercel.

### 2. Start the Server

```bash
npm start
```

### 3. Access Admin Panel

- **Admin Login**: http://localhost:3000/admin/login
- **Default Credentials**:
  - Username: `admin`
  - Password: `admin123`
  
  ⚠️ **IMPORTANT**: Change the default password immediately after first login!

### 4. Access POS

- **POS Interface**: http://localhost:3000

## 📋 Features Implemented

### ✅ Database (JSON)
- Persistent storage for all configuration in JSON format
- Automatic migration of existing coins
- Payment history tracking
- Admin user management
- Activity logging
- Compatible with serverless platforms (Vercel, etc.)

### ✅ Authentication
- Secure session-based authentication
- Password hashing with bcrypt
- Protected admin routes
- Auto-logout on session expiry

### ✅ Admin Dashboard
- Real-time statistics
- Payment overview
- Coin status monitoring
- Recent transactions

### ✅ Coin Management
- Add/Edit/Delete coins
- Enable/Disable coins
- Configure wallet addresses
- Set API keys and network settings
- Dynamic coin configuration

### ✅ Payment History
- View all payments
- Filter by status and coin
- Transaction details
- Export capabilities

### ✅ Dynamic POS Frontend
- Coins loaded from database
- Only enabled coins shown
- No hardcoded coin list
- Automatic UI updates

## 📁 File Structure

```
crypto-pos/
├── database.js              # Database manager & schema
├── server.js               # Main server (updated)
├── routes/
│   └── admin.js            # Admin API routes
├── middleware/
│   └── auth.js             # Authentication middleware
├── public/
│   ├── admin/
│   │   ├── login.html      # Admin login page
│   │   ├── dashboard.html  # Admin dashboard
│   │   ├── coins.html      # Coin management
│   │   ├── payments.html   # Payment history
│   │   └── admin.css      # Admin styles
│   ├── index.html          # POS frontend (updated)
│   └── app.js              # POS logic (updated)
└── data.json                # JSON database (auto-created)
```

## 🔐 Security Features

1. **Password Security**
   - Bcrypt hashing (10 rounds)
   - Password strength requirements
   - Secure session storage

2. **Session Management**
   - HTTP-only cookies
   - 24-hour session timeout
   - CSRF protection ready

3. **Access Control**
   - Protected admin routes
   - Authentication middleware
   - Activity logging

## 📊 Database Schema

### Tables Created:
- `coins` - Coin configurations
- `admin_users` - Admin accounts
- `payments` - Payment history
- `admin_logs` - Activity logs

## 🎯 Admin Panel Features

### Dashboard
- Total payments count
- Confirmed vs pending
- Total amount received
- Coin statistics
- Recent payments list

### Coin Management
- Full CRUD operations
- Enable/disable toggle
- Wallet address configuration
- API key management
- Network settings (mainnet/testnet)
- Contract address for tokens

### Payment History
- Complete payment list
- Status filtering
- Coin filtering
- Transaction hash display
- Timestamp tracking

## 🔄 Migration Notes

- Existing coins automatically migrated to database on first run
- All wallet addresses preserved
- No data loss during migration
- Backward compatible with existing API

## ⚙️ Configuration

All configuration is now managed through the admin panel:
- No need to edit code for wallet addresses
- Add/remove coins without code changes
- Enable/disable coins instantly
- Update API keys through UI

## 🚨 Important Notes

1. **Change Default Password**: The default admin password must be changed immediately
2. **Database File**: `crypto_pos.db` is created automatically - backup regularly
3. **Session Secret**: Change the session secret in production (server.js line ~20)
4. **HTTPS**: Enable HTTPS in production and set `secure: true` in session config

## 📝 API Endpoints

### Public Endpoints
- `GET /api/coins` - Get enabled coins (for POS)
- `POST /api/payment/create` - Create payment
- `GET /api/payment/status/:id` - Check payment status

### Admin Endpoints (Protected)
- `POST /api/admin/login` - Admin login
- `POST /api/admin/logout` - Logout
- `GET /api/admin/coins` - List all coins
- `POST /api/admin/coins` - Create coin
- `PUT /api/admin/coins/:id` - Update coin
- `DELETE /api/admin/coins/:id` - Delete coin
- `GET /api/admin/payments` - Get payments
- `GET /api/admin/stats` - Get statistics

## 🎉 Ready to Use!

The admin management system is fully functional and ready for production use. All features requested by the client have been implemented professionally.

