# Production Environment Setup Guide

## Environment Variables for Production

### 1. Create Production Environment File

Create a `.env.production` file in the frontend root directory:

```bash
# Production Environment Variables
NEXT_PUBLIC_API_URL=https://your-production-domain.com/api
NEXT_PUBLIC_FRONTEND_URL=https://your-frontend-domain.com
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_your_stripe_live_key_here
```

### 2. Create Local Development Environment File

Create a `.env.local` file for local development:

```bash
# Local Development Environment Variables
NEXT_PUBLIC_API_URL=http://127.0.0.1:8000/api
NEXT_PUBLIC_FRONTEND_URL=http://localhost:3000
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_test_key_here
```

### 3. Environment-Specific Configuration

#### For Vercel Deployment:
1. Go to your Vercel dashboard
2. Select your project
3. Go to Settings → Environment Variables
4. Add the following variables:

| Variable | Value | Environment |
|----------|-------|-------------|
| `NEXT_PUBLIC_API_URL` | `https://your-api-domain.com/api` | Production |
| `NEXT_PUBLIC_FRONTEND_URL` | `https://your-frontend-domain.com` | Production |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | `pk_live_your_stripe_live_key` | Production |

#### For Other Hosting Platforms:

**Netlify:**
- Go to Site settings → Environment variables
- Add the same variables as above

**Railway/Render/DigitalOcean:**
- Add environment variables in your platform's dashboard
- Use the same variable names and production values

### 4. Backend Configuration

Make sure your Django backend is configured to accept requests from your production frontend domain:

```python
# In your Django settings.py
CORS_ALLOWED_ORIGINS = [
    "https://your-frontend-domain.com",
    "https://www.your-frontend-domain.com",
]

# Or for development
CORS_ALLOWED_ORIGINS = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
]
```

### 5. Stripe Configuration

#### Development (Test Mode):
- Use test publishable keys starting with `pk_test_`
- Use test secret keys starting with `sk_test_`

#### Production (Live Mode):
- Use live publishable keys starting with `pk_live_`
- Use live secret keys starting with `sk_live_`

### 6. Build and Deploy

#### Local Build Test:
```bash
# Test production build locally
npm run build
npm start
```

#### Deploy to Production:
```bash
# Build for production
npm run build

# Deploy to your hosting platform
# (Vercel, Netlify, etc.)
```

### 7. Environment Variable Priority

Next.js loads environment variables in this order (highest priority first):
1. `.env.production.local`
2. `.env.local`
3. `.env.production`
4. `.env`

### 8. Security Notes

- Never commit `.env.local` or `.env.production.local` to version control
- Add these files to your `.gitignore`
- Use your hosting platform's secure environment variable storage
- Rotate API keys regularly
- Use different keys for development and production

### 9. Verification

After deployment, verify your environment variables are working:

1. Check browser developer tools → Network tab
2. Look for API calls to the correct production URL
3. Test Stripe integration with live keys
4. Verify all redirects work correctly

### 10. Troubleshooting

**Common Issues:**
- **CORS errors**: Check your Django CORS settings
- **API not found**: Verify the API URL includes `/api` at the end
- **Stripe errors**: Ensure you're using the correct keys for your environment
- **Environment variables not loading**: Check your hosting platform's environment variable configuration

**Debug Environment Variables:**
```javascript
// Add this temporarily to debug
console.log('API URL:', process.env.NEXT_PUBLIC_API_URL);
console.log('Frontend URL:', process.env.NEXT_PUBLIC_FRONTEND_URL);
```

