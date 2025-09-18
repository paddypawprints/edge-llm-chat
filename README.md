# Independent Research Edge AI Platform

A comprehensive edge AI platform that enables deployment of large language models (LLMs) and vision-language models (VLMs) directly on edge devices like Raspberry Pi and NVIDIA Jetson.

## Features

- **Edge AI Processing**: Run AI models locally without cloud dependencies
- **Zero Incremental Cost**: Fixed hardware cost with unlimited AI processing
- **Natural Language Configuration**: Configure VLMs with simple English instructions
- **Multi-device Support**: Raspberry Pi, NVIDIA Jetson, Intel NUC, and more
- **Web-based Management**: Device management and chat interface
- **Real-time Chat**: Chat with AI models running on your edge devices

## Quick Start

### Prerequisites

- Python 3.11 or higher
- Node.js 18 or higher
- PostgreSQL database

### Installation

1. Download and extract the distribution package
2. Run the installation script:
   ```bash
   ./install.sh
   ```
3. Configure your database in `.env`
4. Start the platform:
   ```bash
   ./start.sh
   ```

## Architecture

- **Frontend**: React + TypeScript with Vite
- **Backend**: FastAPI with async PostgreSQL support
- **Server**: Node.js Express with reverse proxy
- **Database**: PostgreSQL with Drizzle ORM

## Cost Benefits

Traditional cloud AI services charge per request, leading to costs that scale linearly with usage. Edge AI provides:

- **Fixed Costs**: Pay only for hardware, not per API call
- **Unlimited Usage**: Make as many AI calls as needed
- **No Cloud Dependencies**: Works offline and with poor connectivity
- **Data Privacy**: All processing stays on your devices

## Documentation

- **Technical Whitepaper**: See `whitepaper.html` for comprehensive analysis
- **API Documentation**: Available at `/docs` when running
- **Installation Guide**: See `install.sh` for detailed setup instructions

## Support

For support and questions, contact: contact@independent-research.com

## License

MIT License - see LICENSE file for details.