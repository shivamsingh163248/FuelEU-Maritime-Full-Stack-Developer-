-- Insert sample routes data
INSERT INTO routes (route_id, vessel_type, fuel_type, year, ghg_intensity, fuel_consumption, distance, total_emissions, is_baseline) VALUES
('R001', 'Container', 'HFO', 2024, 91.0, 5000, 12000, 4500, TRUE),
('R002', 'BulkCarrier', 'LNG', 2024, 88.0, 4800, 11500, 4200, FALSE),
('R003', 'Tanker', 'MGO', 2024, 93.5, 5100, 12500, 4700, FALSE),
('R004', 'RoRo', 'HFO', 2025, 89.2, 4900, 11800, 4300, FALSE),
('R005', 'Container', 'LNG', 2025, 90.5, 4950, 11900, 4400, FALSE);

-- Insert sample compliance balance data
INSERT INTO ship_compliance (ship_id, year, cb_gco2eq, energy_in_scope, actual_intensity, target_intensity) VALUES
('SHIP001', 2024, -82000000, 205000000, 91.0, 89.3368),
('SHIP002', 2024, 27404160, 196800000, 88.0, 89.3368),
('SHIP003', 2024, -212673600, 209100000, 93.5, 89.3368),
('SHIP004', 2025, 6877680, 200900000, 89.2, 89.3368),
('SHIP005', 2025, -57938400, 202950000, 90.5, 89.3368);

-- Insert sample bank entries
INSERT INTO bank_entries (ship_id, year, amount_gco2eq, transaction_type, description) VALUES
('SHIP002', 2024, 5000000, 'BANK', 'Banked surplus from positive compliance balance'),
('SHIP004', 2025, 1000000, 'BANK', 'Banked surplus from positive compliance balance');
