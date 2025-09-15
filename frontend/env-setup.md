# Environment Setup

## Quick Start

### 1. Local Development (.env.local):
```bash
# Create this file in the frontend root directory
cat > .env.local << EOF
NEXT_PUBLIC_API_URL=http://127.0.0.1:8000/api
NEXT_PUBLIC_FRONTEND_URL=http://localhost:3000
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_test_key_here
EOF
```

### 2. Production (.env.production):
```bash
# Create this file for production
cat > .env.production << EOF
NEXT_PUBLIC_API_URL=https://your-production-domain.com/api
NEXT_PUBLIC_FRONTEND_URL=https://your-frontend-domain.com
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_your_stripe_live_key_here
EOF
```

## Environment Variables

| Variable | Description | Development | Production |
|----------|-------------|-------------|------------|
| `NEXT_PUBLIC_API_URL` | Django API base URL | `http://127.0.0.1:8000/api` | `https://your-domain.com/api` |
| `NEXT_PUBLIC_FRONTEND_URL` | Frontend URL for redirects | `http://localhost:3000` | `https://your-frontend-domain.com` |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Stripe publishable key | `pk_test_...` | `pk_live_...` |

## Deployment Platforms

### Vercel
1. Go to Project Settings → Environment Variables
2. Add variables for Production environment
3. Redeploy your project

### Netlify
1. Go to Site Settings → Environment Variables
2. Add variables for Production
3. Redeploy your site

### Other Platforms
- Add environment variables in your platform's dashboard
- Use the same variable names and production values

## Usage

The app automatically uses the correct URLs based on the environment:
- **Development**: Uses local Django server and test Stripe keys
- **Production**: Uses production API and live Stripe keys

## Security Notes

- Never commit `.env.local` or `.env.production.local` to version control
- Add these files to your `.gitignore`
- Use your hosting platform's secure environment variable storage
- Use different keys for development and production

## Troubleshooting

**Common Issues:**
- CORS errors: Check Django CORS settings
- API not found: Verify URL includes `/api`
- Stripe errors: Ensure correct keys for environment

For detailed production setup, see `PRODUCTION_SETUP.md`
