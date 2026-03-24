TRUNCATE TABLE
  activity_events,
  maintenance_requests,
  payments,
  leases,
  units,
  properties,
  listings,
  users
RESTART IDENTITY CASCADE;

INSERT INTO users (id, name, email, phone, unit_id, role, created_at, active, password_hash)
VALUES
  ('11111111-1111-1111-1111-111111111111', 'John Doe', 'john.doe@example.com', '+1-555-0101', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbb001', 'tenant', '2023-01-15T10:00:00Z', TRUE, NULL),
  ('22222222-2222-2222-2222-222222222222', 'Jane Smith', 'jane.smith@example.com', '+1-555-0102', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbb002', 'tenant', '2023-02-20T14:30:00Z', TRUE, NULL),
  ('33333333-3333-3333-3333-333333333333', 'Lorenzo Vredeveld', 'lvredeveld9@gmail.com', '+1-555-0103', NULL, 'manager', '2023-01-01T08:00:00Z', TRUE, NULL),
  ('44444444-4444-4444-4444-444444444444', 'Sarah Williams', 'sarah.williams@example.com', '+1-555-0104', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbb001', 'tenant', '2023-03-10T11:45:00Z', FALSE, NULL);

INSERT INTO listings (id, name, address, price, type, image, bedrooms, bathrooms, square_feet, features)
VALUES
  (1, 'Cozy Apartment', '123 Main St, Springfield, IL', 250000, 'buy', 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/...', 2, 1, 800, ARRAY['balcony', 'parking', 'gym']),
  (2, 'Modern Loft', '456 Elm St, Springfield, IL', 1500, 'rent', 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTmnthZAPviouETBDUGIOPXK5BmAycXPG3uvA&s', 1, 1, 600, ARRAY['open floor plan', 'high ceilings', 'rooftop access']),
  (3, 'Family Home', '789 Oak St, Springfield, IL', 350000, 'buy', 'https://images.squarespace-cdn.com/content/v1/67940258d63fc92688330f1c/1744138330602-75DD732SY59WE2889Q2O/Stone+Glen%281%29.jpg', 3, 2, 1200, ARRAY['backyard', 'garage', 'fireplace']),
  (4, 'Studio Apartment', '321 Pine St, Springfield, IL', 900, 'rent', 'https://res.cloudinary.com/sentral/image/upload/w_1000,h_1000,q_auto:eco,c_fill/f_auto/v1684782440/miro_hero_building_exterior_2000x1125.jpg', 0, 1, 400, ARRAY['furnished', 'close to public transport']);

INSERT INTO properties (id, name, address, city, state, total_units)
VALUES
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1', 'Northview Residences', '100 Northview Ave', 'Springfield', 'IL', 12),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa2', 'Lakeside Commons', '205 Lake St', 'Springfield', 'IL', 10),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa3', 'Oakpoint Towers', '77 Oakpoint Rd', 'Springfield', 'IL', 13);

INSERT INTO units (id, property_id, unit_code, bedrooms, bathrooms, square_feet)
VALUES
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbb001', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1', 'A-101', 2, 1, 820),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbb002', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1', 'A-102', 2, 1, 815),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbb003', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1', 'A-103', 1, 1, 640),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbb004', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1', 'A-104', 1, 1, 650),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbb005', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa2', 'B-201', 2, 2, 990),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbb006', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa2', 'B-202', 3, 2, 1240),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbb007', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa2', 'B-203', 1, 1, 610),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbb008', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa2', 'B-204', 1, 1, 630),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbb009', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa3', 'C-301', 2, 2, 1080),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbb010', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa3', 'C-302', 2, 2, 1075),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbb011', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa3', 'C-303', 1, 1, 600),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbb012', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa3', 'C-304', 1, 1, 600);

INSERT INTO leases (unit_id, user_id, start_date, end_date, status, monthly_rent)
VALUES
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbb001', '11111111-1111-1111-1111-111111111111', CURRENT_DATE - INTERVAL '11 months', CURRENT_DATE + INTERVAL '14 days', 'active', 1850),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbb002', '22222222-2222-2222-2222-222222222222', CURRENT_DATE - INTERVAL '6 months', CURRENT_DATE + INTERVAL '130 days', 'active', 1780),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbb004', '33333333-3333-3333-3333-333333333333', CURRENT_DATE - INTERVAL '5 months', CURRENT_DATE + INTERVAL '210 days', 'active', 1640);

INSERT INTO payments (user_id, unit_id, amount, due_date, paid_at, status)
VALUES
  ('11111111-1111-1111-1111-111111111111', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbb001', 1850, DATE_TRUNC('month', CURRENT_DATE), NOW() - INTERVAL '10 minutes', 'paid'),
  ('22222222-2222-2222-2222-222222222222', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbb002', 1780, DATE_TRUNC('month', CURRENT_DATE), NOW() - INTERVAL '1 day', 'paid'),
  ('33333333-3333-3333-3333-333333333333', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbb004', 1640, DATE_TRUNC('month', CURRENT_DATE), NOW() - INTERVAL '2 days', 'paid'),
  ('11111111-1111-1111-1111-111111111111', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbb001', 1850, CURRENT_DATE - INTERVAL '3 days', NULL, 'overdue'),
  ('22222222-2222-2222-2222-222222222222', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbb002', 1780, CURRENT_DATE - INTERVAL '5 days', NULL, 'overdue');

INSERT INTO maintenance_requests (unit_id, title, detail, status, priority)
VALUES
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbb010', 'HVAC inspection', 'Cooling is inconsistent in afternoon', 'open', 'medium'),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbb011', 'Kitchen sink leak', 'Small leak under sink cabinet', 'open', 'high'),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbb008', 'Hallway light replacement', 'Bulb and fixture check required', 'in_progress', 'low');

INSERT INTO activity_events (message, level, occurred_at)
VALUES
  ('Payment recorded for Unit B-102 ($1,850)', 'low', NOW() - INTERVAL '10 minutes'),
  ('Maintenance request created for Unit C-303', 'medium', NOW() - INTERVAL '1 hour'),
  ('Lease updated for Unit A-101', 'low', NOW() - INTERVAL '3 hours'),
  ('New tenant profile added: Marco Ruiz', 'low', NOW() - INTERVAL '1 day');
