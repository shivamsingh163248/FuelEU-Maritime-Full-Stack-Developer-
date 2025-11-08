# FuelEU Maritime Compliance Platform

A full-stack application implementing FuelEU Maritime compliance management with dashboard, APIs, and regulatory calculation engine.

## 🏗️ Architecture

This project follows **Hexagonal Architecture (Ports & Adapters)** for both frontend and backend:

### Backend (Node.js + TypeScript + PostgreSQL)
```
src/
  core/
    domain/         # Business entities and value objects
    application/    # Use cases and business logic
    ports/          # Interfaces (contracts)
  adapters/
    inbound/http/   # REST API controllers
    outbound/postgres/ # Database repositories
  infrastructure/
    db/            # Database configuration
    server/        # Express server setup
  shared/          # Utilities and constants
```

### Frontend (React + TypeScript + TailwindCSS)
```
src/
  core/
    domain/        # Business entities (mirrored from backend)
    application/   # Frontend use cases
    ports/         # Service interfaces
  adapters/
    ui/            # React components and pages
    infrastructure/ # API clients
  shared/          # Utilities and types
```

## 🚀 Quick Start

### Prerequisites
- Node.js 20.19+ (or 22.12+)
- PostgreSQL 14+
- npm or yarn

### Backend Setup
```bash
cd backend
npm install
npm run build
npm run dev
```

### Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

### Database Setup
1. Create PostgreSQL database `fueleu_maritime`
2. Update `.env` file with your database credentials
3. The application will auto-initialize schema and seed data on first run

## 📋 Features Implemented

### ✅ Core Backend API
- **Routes Management** (`/api/routes`)
  - GET `/routes` - List all routes with filters
  - POST `/routes/:id/baseline` - Set baseline route
  - GET `/routes/comparison` - Compare routes vs target
  
- **Compliance Balance** (`/api/compliance`)
  - GET `/compliance/cb` - Get compliance balance
  - GET `/compliance/adjusted-cb` - Get CB after banking adjustments
  
- **Banking (Article 20)** (`/api/banking`)
  - POST `/banking/bank` - Bank positive CB surplus
  - POST `/banking/apply` - Apply banked surplus to deficit
  - GET `/banking/records` - Get banking transaction history
  
- **Pooling (Article 21)** (`/api/pools`)
  - POST `/pools` - Create pool with greedy allocation algorithm

### ✅ Frontend Dashboard
- **Navigation** - 4 tabs: Routes, Compare, Banking, Pooling
- **Responsive Design** - TailwindCSS with mobile-first approach
- **Hexagonal Architecture** - Clean separation of concerns

### 🔄 In Progress
- Routes table with filtering and baseline management
- Comparison charts and compliance indicators  
- Banking interface with KPI displays
- Pooling configuration and validation

## 🧮 FuelEU Maritime Calculations

### Compliance Balance Formula
```
CB = (Target Intensity - Actual Intensity) × Energy in Scope
```

### Key Constants
- **Target Intensity (2025)**: 89.3368 gCO₂e/MJ (2% below 91.16)
- **Energy Conversion**: 41,000 MJ per tonne of fuel
- **Banking Limit**: Max 20% of positive CB can be banked
- **Pool Rules**: Sum ≥ 0, deficit ships can't exit worse, surplus ships can't exit negative

## 🧪 Testing

### Backend Tests
```bash
cd backend
npm run test           # Run all tests
npm run test:watch     # Watch mode
npm run test:coverage  # Coverage report
```

### Frontend Tests
```bash
cd frontend
npm run test
```

## 🔧 Development Commands

### Backend
```bash
npm run dev      # Development server with hot reload
npm run build    # Build TypeScript
npm run start    # Production server
npm run lint     # ESLint check
npm run format   # Prettier format
```

### Frontend
```bash
npm run dev      # Vite dev server
npm run build    # Production build
npm run preview  # Preview production build
```

## 🌐 API Endpoints

### Routes
- `GET /api/routes?vesselType=Container&year=2024`
- `POST /api/routes/R001/baseline`
- `GET /api/routes/comparison`

### Compliance  
- `GET /api/compliance/cb?shipId=SHIP001&year=2024`
- `GET /api/compliance/adjusted-cb?shipId=SHIP001&year=2024`

### Banking
- `POST /api/banking/bank` `{"shipId": "SHIP001", "year": 2024, "amount": 5000000}`
- `POST /api/banking/apply` `{"shipId": "SHIP001", "year": 2024, "amount": 2000000}`

### Pooling
- `POST /api/pools` `{"year": 2024, "members": [{"shipId": "SHIP001", "cbBefore": -5000000}, {"shipId": "SHIP002", "cbBefore": 8000000}]}`

## 📊 Sample Data

The application includes sample routes:

| Route | Vessel Type | Fuel | Year | GHG Intensity | Compliant |
|-------|-------------|------|------|---------------|-----------|
| R001  | Container   | HFO  | 2024 | 91.0          | ❌        |
| R002  | BulkCarrier | LNG  | 2024 | 88.0          | ✅        |
| R003  | Tanker      | MGO  | 2024 | 93.5          | ❌        |
| R004  | RoRo        | HFO  | 2025 | 89.2          | ✅        |
| R005  | Container   | LNG  | 2025 | 90.5          | ❌        |

## 🔒 Environment Variables

### Backend `.env`
```env
PORT=3001
NODE_ENV=development
DB_HOST=localhost
DB_PORT=5432
DB_NAME=fueleu_maritime
DB_USER=postgres
DB_PASSWORD=password
```

### Frontend `.env`
```env
VITE_API_BASE_URL=http://localhost:3001/api
```

## 📚 References

- **FuelEU Maritime Regulation (EU) 2023/1805**
- **Annex IV** - GHG intensity calculation methodology
- **Articles 20-21** - Banking and pooling provisions

## 🤝 Contributing

This project demonstrates:
- Clean Architecture implementation
- TypeScript strict mode
- Comprehensive error handling
- RESTful API design
- Modern React patterns
- Responsive UI components

## 📄 License

ISC License - see LICENSE file for details.
