INSERT INTO free_items (
    title,
    description,
    category,
    available_from,
    source
) VALUES 
('Test Museum Event', 'A test museum event', 'Events', CURRENT_DATE, 'test'),
('Test Free Item', 'A test free item', 'Items', CURRENT_DATE, 'test'); 

-- Add some test items with different dates
INSERT INTO free_items (
  title,
  description,
  location_lat,
  location_lng,
  category,
  available_from,
  available_until,
  source
) VALUES 
(
  'Past Museum Event',
  'Testing past event',
  37.7749,
  -122.4194,
  'Events',
  CURRENT_DATE - INTERVAL '1 day',
  CURRENT_DATE - INTERVAL '1 day',
  'test'
),
(
  'Current Museum Event',
  'Testing current event',
  37.7749,
  -122.4194,
  'Events',
  CURRENT_DATE,
  CURRENT_DATE + INTERVAL '1 day',
  'test'
),
(
  'Future Museum Event',
  'Testing future event',
  37.7749,
  -122.4194,
  'Events',
  CURRENT_DATE + INTERVAL '1 day',
  CURRENT_DATE + INTERVAL '2 days',
  'test'
); 