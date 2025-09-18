#!/bin/bash
set -e

# Independent Research - Installation Script
# Installs the Edge AI Platform on macOS and Linux

INSTALL_DIR="${HOME}/.local/independent-research"
SERVICE_NAME="independent-research"

echo "🚀 Installing Independent Research Edge AI Platform..."

# Detect OS
OS=$(uname -s)
case $OS in
    Darwin)
        echo "📱 Detected macOS"
        PLATFORM="macos"
        ;;
    Linux)
        echo "🐧 Detected Linux"
        PLATFORM="linux"
        ;;
    *)
        echo "❌ Unsupported operating system: $OS"
        exit 1
        ;;
esac

# Check dependencies
echo "🔍 Checking dependencies..."

# Check Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is required but not installed."
    echo "📥 Please install Node.js from: https://nodejs.org/"
    exit 1
fi

NODE_VERSION=$(node --version | cut -c2-)
REQUIRED_NODE_VERSION="18.0.0"
if [ "$(printf '%s\n' "$REQUIRED_NODE_VERSION" "$NODE_VERSION" | sort -V | head -n1)" != "$REQUIRED_NODE_VERSION" ]; then
    echo "❌ Node.js version $NODE_VERSION found, but version $REQUIRED_NODE_VERSION or higher is required."
    exit 1
fi
echo "✅ Node.js $NODE_VERSION found"

# Check Python
if ! command -v python3 &> /dev/null; then
    echo "❌ Python 3 is required but not installed."
    echo "📥 Please install Python 3.11+ from: https://python.org/"
    exit 1
fi

PYTHON_VERSION=$(python3 --version | cut -d' ' -f2)
REQUIRED_PYTHON_VERSION="3.11.0"
if [ "$(printf '%s\n' "$REQUIRED_PYTHON_VERSION" "$PYTHON_VERSION" | sort -V | head -n1)" != "$REQUIRED_PYTHON_VERSION" ]; then
    echo "❌ Python version $PYTHON_VERSION found, but version $REQUIRED_PYTHON_VERSION or higher is required."
    exit 1
fi
echo "✅ Python $PYTHON_VERSION found"

# Check pip
if ! command -v pip3 &> /dev/null; then
    echo "❌ pip3 is required but not installed."
    echo "📥 Please install pip3"
    exit 1
fi
echo "✅ pip3 found"

# Check PostgreSQL (optional)
if command -v psql &> /dev/null; then
    echo "✅ PostgreSQL found (optional but recommended)"
else
    echo "⚠️  PostgreSQL not found. You'll need a PostgreSQL database to run the platform."
    echo "📥 Install with: brew install postgresql (macOS) or apt-get install postgresql (Ubuntu)"
fi

# Create installation directory
echo "📁 Creating installation directory: $INSTALL_DIR"
mkdir -p "$INSTALL_DIR"

# Copy application files
echo "📋 Copying application files..."
if [ -d "app" ]; then
    cp -r app/ "$INSTALL_DIR/"
fi
if [ -f "start_fastapi.py" ]; then
    cp start_fastapi.py "$INSTALL_DIR/"
fi
if [ -f "pyproject.toml" ]; then
    cp pyproject.toml "$INSTALL_DIR/"
fi
if [ -d "server" ]; then
    cp -r server/ "$INSTALL_DIR/"
fi
if [ -f "package.json" ]; then
    cp package.json package-lock.json "$INSTALL_DIR/"
fi
# Copy built server if available
if [ -f "index.js" ]; then
    cp index.js "$INSTALL_DIR/"
fi

# Copy frontend files
if [ -f "index.html" ]; then
    mkdir -p "$INSTALL_DIR/public"
    cp index.html "$INSTALL_DIR/public/" 2>/dev/null || echo "index.html not found"
    [ -d "assets" ] && cp -r assets/ "$INSTALL_DIR/public/" 2>/dev/null || echo "assets directory not found"
    [ -f "*.js" ] && cp *.js "$INSTALL_DIR/public/" 2>/dev/null || echo "No JS files found"
    [ -f "*.css" ] && cp *.css "$INSTALL_DIR/public/" 2>/dev/null || echo "No CSS files found"
fi

# Install dependencies
echo "📦 Installing Node.js dependencies..."
cd "$INSTALL_DIR"
npm install --production

echo "🐍 Installing Python dependencies..."
if [ -f "pyproject.toml" ]; then
    pip3 install -e .
else
    echo "⚠️  pyproject.toml not found, manual dependency installation may be required"
fi

# Create environment file
echo "⚙️  Creating environment configuration..."
cat > .env << EOF
# Independent Research Edge AI Platform Configuration
NODE_ENV=production
PORT=5000
FASTAPI_PORT=8000

# Database Configuration (Update with your PostgreSQL details)
DATABASE_URL=postgresql://username:password@localhost:5432/independent_research

# Session Configuration
SESSION_SECRET=$(openssl rand -base64 32)

# Optional: Set custom host binding
HOST=0.0.0.0
EOF

# Create startup script
echo "🎯 Creating startup script..."
cat > start.sh << 'EOF'
#!/bin/bash
# Independent Research Edge AI Platform Startup Script

cd "$(dirname "$0")"

echo "🚀 Starting Independent Research Edge AI Platform..."

# Check if environment file exists
if [ ! -f .env ]; then
    echo "❌ Environment file .env not found!"
    echo "Please configure your database and other settings in .env"
    exit 1
fi

# Load environment variables
set -a
source .env
set +a

# Start the application
if [ -f "package.json" ]; then
    npm run start
else
    echo "❌ package.json not found. Please ensure proper installation."
    exit 1
fi
EOF

chmod +x start.sh

# Create service files for system integration
echo "🔧 Creating service configuration..."

if [ "$PLATFORM" = "macos" ]; then
    # Create LaunchAgent plist for macOS
    PLIST_DIR="$HOME/Library/LaunchAgents"
    mkdir -p "$PLIST_DIR"
    
    cat > "$PLIST_DIR/com.independent-research.edge-ai.plist" << EOF
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>com.independent-research.edge-ai</string>
    <key>ProgramArguments</key>
    <array>
        <string>$INSTALL_DIR/start.sh</string>
    </array>
    <key>WorkingDirectory</key>
    <string>$INSTALL_DIR</string>
    <key>RunAtLoad</key>
    <false/>
    <key>KeepAlive</key>
    <false/>
    <key>StandardOutPath</key>
    <string>$HOME/Library/Logs/independent-research.log</string>
    <key>StandardErrorPath</key>
    <string>$HOME/Library/Logs/independent-research-error.log</string>
</dict>
</plist>
EOF

elif [ "$PLATFORM" = "linux" ]; then
    # Create systemd service for Linux
    mkdir -p "$HOME/.config/systemd/user"
    
    cat > "$HOME/.config/systemd/user/independent-research.service" << EOF
[Unit]
Description=Independent Research Edge AI Platform
After=network.target

[Service]
Type=simple
User=$USER
WorkingDirectory=$INSTALL_DIR
ExecStart=$INSTALL_DIR/start.sh
Restart=always
RestartSec=10
Environment=NODE_ENV=production

[Install]
WantedBy=default.target
EOF

    # Reload systemd
    systemctl --user daemon-reload
fi

echo ""
echo "✅ Installation complete!"
echo ""
echo "📍 Installation directory: $INSTALL_DIR"
echo "⚙️  Configuration file: $INSTALL_DIR/.env"
echo "🚀 Startup script: $INSTALL_DIR/start.sh"
echo ""
echo "🔧 Next steps:"
echo "1. Configure your database in: $INSTALL_DIR/.env"
echo "2. Start the platform: cd $INSTALL_DIR && ./start.sh"
echo ""
if [ "$PLATFORM" = "macos" ]; then
    echo "📱 macOS Service Management:"
    echo "   Start: launchctl load ~/Library/LaunchAgents/com.independent-research.edge-ai.plist"
    echo "   Stop:  launchctl unload ~/Library/LaunchAgents/com.independent-research.edge-ai.plist"
elif [ "$PLATFORM" = "linux" ]; then
    echo "🐧 Linux Service Management:"
    echo "   Enable: systemctl --user enable independent-research"
    echo "   Start:  systemctl --user start independent-research"
    echo "   Status: systemctl --user status independent-research"
fi
echo ""
echo "🌐 Once started, access the platform at: http://localhost:5000"
echo ""
echo "📚 For support and documentation, visit: https://github.com/independent-research/edge-ai"