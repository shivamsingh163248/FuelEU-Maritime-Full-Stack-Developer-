-- Routes table
CREATE TABLE routes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    route_id VARCHAR(50) UNIQUE NOT NULL,
    vessel_type VARCHAR(50) NOT NULL CHECK (vessel_type IN ('Container', 'BulkCarrier', 'Tanker', 'RoRo')),
    fuel_type VARCHAR(10) NOT NULL CHECK (fuel_type IN ('HFO', 'LNG', 'MGO')),
    year INTEGER NOT NULL CHECK (year >= 2020 AND year <= 2050),
    ghg_intensity DECIMAL(10, 4) NOT NULL CHECK (ghg_intensity > 0),
    fuel_consumption DECIMAL(15, 2) NOT NULL CHECK (fuel_consumption > 0),
    distance DECIMAL(15, 2) NOT NULL CHECK (distance > 0),
    total_emissions DECIMAL(15, 2) NOT NULL CHECK (total_emissions > 0),
    is_baseline BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Ship compliance balance table
CREATE TABLE ship_compliance (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ship_id VARCHAR(100) NOT NULL,
    year INTEGER NOT NULL CHECK (year >= 2020 AND year <= 2050),
    cb_gco2eq DECIMAL(20, 2) NOT NULL,
    energy_in_scope DECIMAL(20, 2) NOT NULL,
    actual_intensity DECIMAL(10, 4) NOT NULL,
    target_intensity DECIMAL(10, 4) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(ship_id, year)
);

-- Bank entries table (Article 20)
CREATE TABLE bank_entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ship_id VARCHAR(100) NOT NULL,
    year INTEGER NOT NULL CHECK (year >= 2020 AND year <= 2050),
    amount_gco2eq DECIMAL(20, 2) NOT NULL,
    transaction_type VARCHAR(10) NOT NULL CHECK (transaction_type IN ('BANK', 'APPLY')),
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Pools table (Article 21)
CREATE TABLE pools (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    year INTEGER NOT NULL CHECK (year >= 2020 AND year <= 2050),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Pool members table
CREATE TABLE pool_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pool_id UUID NOT NULL REFERENCES pools(id) ON DELETE CASCADE,
    ship_id VARCHAR(100) NOT NULL,
    cb_before DECIMAL(20, 2) NOT NULL,
    cb_after DECIMAL(20, 2) NOT NULL
);

-- Indexes for better performance
CREATE INDEX idx_routes_year ON routes(year);
CREATE INDEX idx_routes_baseline ON routes(is_baseline);
CREATE INDEX idx_ship_compliance_ship_year ON ship_compliance(ship_id, year);
CREATE INDEX idx_bank_entries_ship_year ON bank_entries(ship_id, year);
CREATE INDEX idx_pool_members_pool ON pool_members(pool_id);

-- Ensure only one baseline route at a time
CREATE UNIQUE INDEX idx_single_baseline ON routes(is_baseline) WHERE is_baseline = TRUE;
