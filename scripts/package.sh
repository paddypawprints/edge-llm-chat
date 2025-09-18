#!/bin/bash
set -e

# Independent Research - Package Script
# Creates distributable packages for different platforms

VERSION=$(date +%Y%m%d)
PACKAGE_NAME="independent-research-edge-ai"

echo "📦 Packaging Independent Research Edge AI Platform v${VERSION}..."

# Run build first
./scripts/build.sh

# Create packages directory
mkdir -p packages

echo "🗜️  Creating tarball package..."
cd dist
tar -czf "../packages/${PACKAGE_NAME}-${VERSION}.tar.gz" .
cd ..

echo "🗜️  Creating zip package..."
cd dist  
zip -r "../packages/${PACKAGE_NAME}-${VERSION}.zip" .
cd ..

echo "✅ Packaging complete!"
echo "📦 Created packages:"
echo "   packages/${PACKAGE_NAME}-${VERSION}.tar.gz"
echo "   packages/${PACKAGE_NAME}-${VERSION}.zip"
echo ""
echo "🚀 To install, extract and run: ./install.sh"