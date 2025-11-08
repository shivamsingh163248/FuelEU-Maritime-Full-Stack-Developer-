-- FuelEU Maritime Database Schema
-- Create database and tables for compliance management

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Routes table
CREATE TABLE IF NOT EXISTS routes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    vessel_name VARCHAR(255) NOT NULL,
    vessel_type VARCHAR(100) NOT NULL CHECK (vessel_type IN ('Container', 'BulkCarrier', 'Tanker', 'RoRo')),
    imo_number VARCHAR(20) UNIQUE NOT NULL,
    departure_port VARCHAR(255) NOT NULL,
    arrival_port VARCHAR(255) NOT NULL,
    departure_date TIMESTAMP NOT NULL,
    arrival_date TIMESTAMP NOT NULL,
    distance_nm DECIMAL(10,2) NOT NULL CHECK (distance_nm > 0),
    fuel_type VARCHAR(100) NOT NULL CHECK (fuel_type IN ('HFO', 'MGO', 'LNG', 'Methanol', 'Ammonia')),
    fuel_consumed_tons DECIMAL(10,3) NOT NULL CHECK (fuel_consumed_tons > 0),
    ghg_intensity DECIMAL(8,4) NOT NULL CHECK (ghg_intensity > 0),
    is_baseline BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Compliance Balance table
CREATE TABLE IF NOT EXISTS compliance_balances (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ship_id UUID NOT NULL,
    vessel_name VARCHAR(255) NOT NULL,
    year INTEGER NOT NULL CHECK (year >= 2025),
    cb_gco2eq DECIMAL(12,6) NOT NULL,
    adjusted_cb_gco2eq DECIMAL(12,6),
    target_intensity DECIMAL(8,4) NOT NULL DEFAULT 89.3368,
    actual_intensity DECIMAL(8,4) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(ship_id, year)
);

-- Bank entries table
CREATE TABLE IF NOT EXISTS bank_entries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ship_id UUID NOT NULL,
    vessel_name VARCHAR(255) NOT NULL,
    year INTEGER NOT NULL CHECK (year >= 2025),
    amount DECIMAL(12,6) NOT NULL CHECK (amount > 0),
    transaction_type VARCHAR(20) NOT NULL CHECK (transaction_type IN ('deposit', 'withdrawal')),
    transaction_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    remaining_balance DECIMAL(12,6) NOT NULL DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Pools table
CREATE TABLE IF NOT EXISTS pools (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    year INTEGER NOT NULL CHECK (year >= 2025),
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'draft', 'completed')),
    total_cb_before DECIMAL(12,6) NOT NULL,
    total_cb_after DECIMAL(12,6) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Pool members table
CREATE TABLE IF NOT EXISTS pool_members (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    pool_id UUID NOT NULL REFERENCES pools(id) ON DELETE CASCADE,
    ship_id UUID NOT NULL,
    vessel_name VARCHAR(255) NOT NULL,
    cb_before DECIMAL(12,6) NOT NULL,
    cb_after DECIMAL(12,6) NOT NULL,
    allocation DECIMAL(12,6) NOT NULL DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(pool_id, ship_id)
);

-- Indexes for better performance
CREATE INDEX IF NOT EXISTS idx_routes_vessel_type ON routes(vessel_type);
CREATE INDEX IF NOT EXISTS idx_routes_fuel_type ON routes(fuel_type);
CREATE INDEX IF NOT EXISTS idx_routes_departure_date ON routes(departure_date);
CREATE INDEX IF NOT EXISTS idx_routes_is_baseline ON routes(is_baseline);

CREATE INDEX IF NOT EXISTS idx_compliance_ship_year ON compliance_balances(ship_id, year);
CREATE INDEX IF NOT EXISTS idx_compliance_year ON compliance_balances(year);

CREATE INDEX IF NOT EXISTS idx_bank_ship_year ON bank_entries(ship_id, year);
CREATE INDEX IF NOT EXISTS idx_bank_transaction_type ON bank_entries(transaction_type);

CREATE INDEX IF NOT EXISTS idx_pools_year ON pools(year);
CREATE INDEX IF NOT EXISTS idx_pools_status ON pools(status);

CREATE INDEX IF NOT EXISTS idx_pool_members_pool_id ON pool_members(pool_id);
CREATE INDEX IF NOT EXISTS idx_pool_members_ship_id ON pool_members(ship_id);

-- Function to update timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for updated_at
CREATE TRIGGER update_routes_updated_at BEFORE UPDATE ON routes
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_compliance_balances_updated_at BEFORE UPDATE ON compliance_balances
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_pools_updated_at BEFORE UPDATE ON pools
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
