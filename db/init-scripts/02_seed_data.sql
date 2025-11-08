-- Sample data for FuelEU Maritime system

-- Insert sample routes
INSERT INTO routes (id, vessel_name, vessel_type, imo_number, departure_port, arrival_port, departure_date, arrival_date, distance_nm, fuel_type, fuel_consumed_tons, ghg_intensity, is_baseline) VALUES
('550e8400-e29b-41d4-a716-446655440001', 'Atlantic Explorer', 'Container', 'IMO1234567', 'Rotterdam', 'New York', '2024-01-15 08:00:00', '2024-01-22 14:30:00', 3458.5, 'HFO', 245.8, 91.2, false),
('550e8400-e29b-41d4-a716-446655440002', 'Pacific Voyager', 'BulkCarrier', 'IMO2345678', 'Shanghai', 'Los Angeles', '2024-02-10 06:00:00', '2024-02-25 18:45:00', 6435.2, 'MGO', 189.4, 87.8, true),
('550e8400-e29b-41d4-a716-446655440003', 'Mediterranean Star', 'Tanker', 'IMO3456789', 'Piraeus', 'Marseille', '2024-03-05 10:15:00', '2024-03-07 22:30:00', 825.7, 'LNG', 45.6, 82.1, false),
('550e8400-e29b-41d4-a716-446655440004', 'Nordic Wind', 'RoRo', 'IMO4567890', 'Hamburg', 'Helsinki', '2024-04-12 16:00:00', '2024-04-14 09:20:00', 742.3, 'Methanol', 38.2, 79.5, false),
('550e8400-e29b-41d4-a716-446655440005', 'Baltic Pioneer', 'Container', 'IMO5678901', 'Gdansk', 'Stockholm', '2024-05-18 12:30:00', '2024-05-20 08:15:00', 432.1, 'Ammonia', 28.7, 75.3, false),
('550e8400-e29b-41d4-a716-446655440006', 'Arctic Breaker', 'BulkCarrier', 'IMO6789012', 'Murmansk', 'Kirkenes', '2024-06-08 14:45:00', '2024-06-09 11:30:00', 156.8, 'HFO', 95.4, 94.2, false),
('550e8400-e29b-41d4-a716-446655440007', 'Southern Cross', 'Tanker', 'IMO7890123', 'Cape Town', 'Santos', '2024-07-22 20:00:00', '2024-08-05 16:45:00', 3876.9, 'MGO', 278.3, 88.7, false),
('550e8400-e29b-41d4-a716-446655440008', 'Ocean Liberty', 'RoRo', 'IMO8901234', 'Dover', 'Calais', '2024-08-14 07:30:00', '2024-08-14 09:15:00', 26.4, 'LNG', 8.2, 81.9, false);

-- Insert compliance balances
INSERT INTO compliance_balances (ship_id, vessel_name, year, cb_gco2eq, adjusted_cb_gco2eq, actual_intensity) VALUES
('550e8400-e29b-41d4-a716-446655440001', 'Atlantic Explorer', 2024, -1.8632, -1.8632, 91.2),
('550e8400-e29b-41d4-a716-446655440002', 'Pacific Voyager', 2024, 1.5368, 1.5368, 87.8),
('550e8400-e29b-41d4-a716-446655440003', 'Mediterranean Star', 2024, 7.2368, 7.2368, 82.1),
('550e8400-e29b-41d4-a716-446655440004', 'Nordic Wind', 2024, 9.8368, 9.8368, 79.5),
('550e8400-e29b-41d4-a716-446655440005', 'Baltic Pioneer', 2024, 14.0368, 14.0368, 75.3),
('550e8400-e29b-41d4-a716-446655440006', 'Arctic Breaker', 2024, -4.8632, -4.8632, 94.2),
('550e8400-e29b-41d4-a716-446655440007', 'Southern Cross', 2024, 0.6368, 0.6368, 88.7),
('550e8400-e29b-41d4-a716-446655440008', 'Ocean Liberty', 2024, 7.4368, 7.4368, 81.9);

-- Insert sample bank entries
INSERT INTO bank_entries (ship_id, vessel_name, year, amount, transaction_type, remaining_balance) VALUES
('550e8400-e29b-41d4-a716-446655440005', 'Baltic Pioneer', 2024, 2.5, 'deposit', 2.5),
('550e8400-e29b-41d4-a716-446655440004', 'Nordic Wind', 2024, 1.8, 'deposit', 1.8),
('550e8400-e29b-41d4-a716-446655440001', 'Atlantic Explorer', 2024, 1.0, 'withdrawal', 1.5);

-- Insert sample pool
INSERT INTO pools (id, name, year, total_cb_before, total_cb_after, status) VALUES
('660e8400-e29b-41d4-a716-446655440001', 'North Atlantic Compliance Pool', 2024, 3.2, 3.2, 'completed');

-- Insert pool members
INSERT INTO pool_members (pool_id, ship_id, vessel_name, cb_before, cb_after, allocation) VALUES
('660e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440001', 'Atlantic Explorer', -1.8632, 0.1368, 2.0),
('660e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440002', 'Pacific Voyager', 1.5368, -0.4632, -2.0),
('660e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440007', 'Southern Cross', 0.6368, 0.6368, 0.0);

-- Verify data integrity
DO $$
BEGIN
    RAISE NOTICE 'Database initialization completed successfully!';
    RAISE NOTICE 'Routes inserted: %', (SELECT COUNT(*) FROM routes);
    RAISE NOTICE 'Compliance balances inserted: %', (SELECT COUNT(*) FROM compliance_balances);
    RAISE NOTICE 'Bank entries inserted: %', (SELECT COUNT(*) FROM bank_entries);
    RAISE NOTICE 'Pools inserted: %', (SELECT COUNT(*) FROM pools);
    RAISE NOTICE 'Pool members inserted: %', (SELECT COUNT(*) FROM pool_members);
END $$;
