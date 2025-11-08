# FuelEU Maritime — Full-Stack Developer Assignment

This project implements a **Fuel EU Maritime compliance platform** with frontend dashboard and backend APIs handling route data, compliance balance (CB), banking, and pooling.

## 🏗️ Architecture

**Hexagonal Architecture (Ports & Adapters / Clean Architecture)**

```
📁 Project Structure
├── 📂 backend/              # Node.js + TypeScript + PostgreSQL
│   ├── 📂 src/
│   │   ├── 📂 core/         # Domain logic (hexagonal core)
│   │   │   ├── 📂 domain/    # Entities, value objects
│   │   │   ├── 📂 application/ # Use cases, services  
│   │   │   └── 📂 ports/     # Interfaces (inbound/outbound)
│   │   ├── 📂 adapters/     # Infrastructure adapters
│   │   │   ├── 📂 inbound/   # HTTP controllers, routes
│   │   │   └── 📂 outbound/  # Database repositories
│   │   ├── 📂 infrastructure/ # Server, database config
│   │   └── 📂 shared/       # Shared utilities, constants
│   ├── 📂 tests/           # Unit & integration tests
│   └── 📂 database/        # SQL migrations, seeds
├── 📂 frontend/            # React + TypeScript + TailwindCSS
│   ├── 📂 src/
│   │   ├── 📂 core/        # Domain logic (hexagonal core)
│   │   │   ├── 📂 domain/   # Entities, value objects
│   │   │   ├── 📂 application/ # Use cases
│   │   │   └── 📂 ports/    # Interfaces
│   │   ├── 📂 adapters/    # UI & Infrastructure adapters
│   │   │   ├── 📂 ui/       # React components, pages
│   │   │   └── 📂 infrastructure/ # API clients
│   │   └── 📂 shared/      # Shared utilities
│   └── 📂 tests/          # Component & integration tests
├── 📂 database/           # PostgreSQL Docker setup
└── 📂 Refrence/          # FuelEU documentation
```

## 🚀 Quick Start

### Prerequisites
- Node.js v20+
- Docker & Docker Compose
- Git

### 1. Setup Database
```bash
cd database
docker-compose up -d
```

### 2. Start Backend
```bash
cd backend
npm install
npm run dev        # Development server on :3001
npm test          # Run test suite
```

### 3. Start Frontend  
```bash
cd frontend
npm install
npm run dev       # Development server on :5173
npm test         # Run test suite
```

## 🧮 FuelEU Maritime Implementation

### Core Calculations
- **Target Intensity (2025)**: 89.3368 gCO₂e/MJ
- **Energy in scope**: fuelConsumption × 41,000 MJ/t  
- **Compliance Balance**: (Target - Actual) × Energy in scope
- **Positive CB** = Surplus, **Negative CB** = Deficit

### Features Implemented
1. **Routes Management**: Vessel routes with fuel consumption tracking
2. **Compliance Comparison**: Baseline vs target analysis with charts
3. **Banking (Article 20)**: Bank positive CB for future use (max 20%)
4. **Pooling (Article 21)**: Group vessels for collective compliance

### API Endpoints
```
GET    /routes                    # List all routes with filters
POST   /routes/:id/baseline       # Set baseline route
GET    /routes/comparison         # Baseline vs comparison data
GET    /compliance/cb             # Get compliance balance
GET    /compliance/adjusted-cb    # Get adjusted CB after banking
POST   /banking/bank              # Bank positive CB
POST   /banking/apply             # Apply banked surplus
POST   /pools                     # Create compliance pool
```

### Frontend Tabs
1. **Routes**: Route management with filtering and baseline setting
2. **Compare**: Baseline vs target analysis with visualization  
3. **Banking**: CB banking interface (Article 20)
4. **Pooling**: Pool creation and management (Article 21)

## 🧪 Testing Strategy

- **Backend**: Unit tests for domain logic, integration tests for APIs
- **Frontend**: Component tests, E2E user flows
- **Database**: Migration and seed data validation
- **AI Documentation**: Comprehensive workflow logging

## 📚 Documentation

- **AGENT_WORKFLOW.md**: AI agent usage and prompts
- **REFLECTION.md**: Learning outcomes and improvements
- **API Documentation**: Available at `/api/docs`

## 🔧 Technology Stack

### Backend
- **Runtime**: Node.js v20+
- **Language**: TypeScript (strict mode)
- **Framework**: Express.js
- **Database**: PostgreSQL 15+
- **Testing**: Jest + Supertest
- **Architecture**: Hexagonal (Ports & Adapters)

### Frontend  
- **Framework**: React 18+
- **Language**: TypeScript (strict mode)
- **Bundler**: Vite
- **Styling**: TailwindCSS
- **Routing**: React Router
- **HTTP Client**: Axios
- **Testing**: Vitest + React Testing Library

### Database
- **Primary**: PostgreSQL 15+ (Docker)
- **Admin**: pgAdmin (Docker)
- **Migrations**: Custom SQL scripts

Ready to implement FuelEU Maritime compliance! 🚀
