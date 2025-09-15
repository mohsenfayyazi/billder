#!/bin/bash

# Environment Setup Script for Billder Frontend
# This script helps you set up environment variables for different environments

echo "🚀 Billder Frontend Environment Setup"
echo "======================================"

# Function to create environment file
create_env_file() {
    local env_type=$1
    local filename=$2
    
    echo ""
    echo "📝 Setting up $env_type environment..."
    
    if [ "$env_type" = "development" ]; then
        cat > "$filename" << EOF
# Local Development Environment Variables
NEXT_PUBLIC_API_URL=http://127.0.0.1:8000/api
NEXT_PUBLIC_FRONTEND_URL=http://localhost:3000
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_test_key_here
EOF
    else
        cat > "$filename" << EOF
# Production Environment Variables
NEXT_PUBLIC_API_URL=https://your-production-domain.com/api
NEXT_PUBLIC_FRONTEND_URL=https://your-frontend-domain.com
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_your_stripe_live_key_here
EOF
    fi
    
    echo "✅ Created $filename"
    echo "⚠️  Remember to update the values with your actual URLs and keys!"
}

# Check if we're in the frontend directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: Please run this script from the frontend directory"
    exit 1
fi

# Menu
echo ""
echo "Choose an option:"
echo "1) Setup development environment (.env.local)"
echo "2) Setup production environment (.env.production)"
echo "3) Setup both environments"
echo "4) Exit"
echo ""

read -p "Enter your choice (1-4): " choice

case $choice in
    1)
        create_env_file "development" ".env.local"
        ;;
    2)
        create_env_file "production" ".env.production"
        ;;
    3)
        create_env_file "development" ".env.local"
        create_env_file "production" ".env.production"
        ;;
    4)
        echo "👋 Goodbye!"
        exit 0
        ;;
    *)
        echo "❌ Invalid choice. Please run the script again."
        exit 1
        ;;
esac

echo ""
echo "🎉 Environment setup complete!"
echo ""
echo "Next steps:"
echo "1. Update the URLs and keys in your environment files"
echo "2. For production deployment, add these variables to your hosting platform"
echo "3. Run 'npm run dev' to start development server"
echo ""
echo "📚 For more details, see:"
echo "   - env-setup.md (quick reference)"
echo "   - PRODUCTION_SETUP.md (detailed guide)"

