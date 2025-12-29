# Vercel Deployment Guide

This guide explains how to deploy the Crypto POS application to Vercel and configure sessions properly.

## Session Configuration for Vercel

The application has been configured to work properly on Vercel with the following settings:

### Environment Variables

Set these in your Vercel project settings:

1. **SESSION_SECRET** (Required)
   - A strong, random secret key for session encryption
   - Generate with: `openssl rand -base64 32`
   - Example: `your-super-secret-session-key-here`

2. **NODE_ENV** (Optional)
   - Set to `production` for production deployments
   - Vercel sets this automatically, but you can override it

3. **COOKIE_SAMESITE** (Optional)
   - Default: `lax` (recommended for same-domain)
   - Use `none` only if frontend and backend are on different domains
   - Note: `none` requires `secure: true` (automatically set in production)

4. **COOKIE_DOMAIN** (Optional)
   - Only set if using a custom domain
   - Example: `.yourdomain.com` (with leading dot for subdomains)

5. **ALLOWED_ORIGIN** (Optional)
   - Default: `true` (allows all origins)
   - Set to specific origin(s) for better security
   - Example: `https://your-app.vercel.app`

## Key Changes for Vercel Compatibility

### 1. Session Cookie Configuration
- `secure: true` in production (HTTPS required)
- `sameSite: 'lax'` for same-domain (configurable)
- `httpOnly: true` for security
- Custom session name: `crypto-pos.sid`

### 2. Trust Proxy
- Added `app.set('trust proxy', 1)` to handle Vercel's reverse proxy
- Ensures `req.protocol` and `req.secure` are set correctly

### 3. Session Save
- Explicit `req.session.save()` in login route
- Important for serverless environments where async operations need completion

### 4. CORS Configuration
- Configured to work with credentials
- Supports custom origins via environment variable

## Deployment Steps

1. **Install Vercel CLI** (if not already installed):
   ```bash
   npm i -g vercel
   ```

2. **Login to Vercel**:
   ```bash
   vercel login
   ```

3. **Deploy**:
   ```bash
   vercel
   ```

4. **Set Environment Variables**:
   - Go to your Vercel project dashboard
   - Navigate to Settings → Environment Variables
   - Add the required variables listed above

5. **Configure Node.js Version** (Optional but recommended):
   - Go to Project Settings → General
   - Under "Build & Development Settings", ensure Node.js version is set to `20.x` (matches package.json)
   - This ensures consistency between local and Vercel environments

6. **Redeploy** after setting environment variables:
   ```bash
   vercel --prod
   ```

## Build Configuration

The project uses modern Vercel configuration:
- **Auto-detection**: Vercel automatically detects Node.js projects
- **No builds field**: Using the modern configuration format (no deprecated `builds` field)
- **Node.js 20.x**: Specified in `package.json` for consistency

## Troubleshooting Session Issues

### Session Logs Out on Navigation

If sessions are still logging out between pages:

1. **Check Cookie Settings**:
   - Open browser DevTools → Application → Cookies
   - Verify the session cookie is being set
   - Check that `Secure` and `HttpOnly` flags are set
   - Verify `SameSite` is set correctly

2. **Verify Environment Variables**:
   - Ensure `SESSION_SECRET` is set
   - Check that `NODE_ENV` is `production` (or `VERCEL=1`)

3. **Check CORS**:
   - Verify `credentials: 'include'` is in all fetch requests
   - Check that CORS is configured correctly

4. **Browser Console**:
   - Look for cookie-related errors
   - Check network tab for session cookie in requests

### Session Not Persisting

If sessions don't persist at all:

1. **Memory Store Limitation**:
   - The default memory store doesn't work well in serverless
   - Consider using a session store (Redis, MongoDB, etc.) for production
   - For now, sessions work but may be lost on cold starts

2. **Cookie Size**:
   - Ensure session data is minimal
   - Large sessions may not fit in cookies

3. **Domain Mismatch**:
   - Ensure frontend and backend are on the same domain
   - Check `COOKIE_DOMAIN` setting if using custom domain

## Production Recommendations

1. **Use a Session Store**:
   - For production, consider using Redis or a database-backed session store
   - Install: `npm install connect-redis` or `npm install connect-mongo`
   - Configure in `server.js`

2. **Rate Limiting**:
   - Add rate limiting to prevent abuse
   - Consider using `express-rate-limit`

3. **Monitoring**:
   - Set up error tracking (Sentry, etc.)
   - Monitor session creation/destruction

4. **Security**:
   - Use strong `SESSION_SECRET`
   - Enable HTTPS (automatic on Vercel)
   - Consider adding CSRF protection

## Testing Session Persistence

After deployment, test:

1. Login to admin panel
2. Navigate between pages (Dashboard → Coins → Payments)
3. Verify you remain logged in
4. Check browser cookies to ensure session cookie persists
5. Refresh the page - should remain logged in

## Support

If issues persist:
1. Check Vercel function logs
2. Enable debug logging in `server.js`
3. Verify all environment variables are set
4. Check browser console for errors

