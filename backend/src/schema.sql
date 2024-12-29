-- Create custom types
DROP TYPE IF EXISTS item_category CASCADE;
CREATE TYPE item_category AS ENUM (
  'Events',
  'Food',
  'Items',
  'Services'
);

-- Create custom types
DROP TYPE IF EXISTS item_status CASCADE;
CREATE TYPE item_status AS ENUM (
  'available',
  'gone'
);

-- Create tables
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  username VARCHAR(50) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Drop and recreate free_items table
DROP TABLE IF EXISTS free_items CASCADE;
CREATE TABLE free_items (
  id SERIAL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  location_lat DECIMAL(10,8),
  location_lng DECIMAL(11,8),
  location_address TEXT,
  available_from TIMESTAMP,
  available_until TIMESTAMP,
  time_details TEXT,
  category VARCHAR(50),
  contact_info TEXT,
  url TEXT,
  source VARCHAR(50),
  last_verified TIMESTAMP,
  interest_count INTEGER DEFAULT 0,
  user_id INTEGER REFERENCES users(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  edit_code VARCHAR(10),
  status item_status DEFAULT 'available',
  posted_by VARCHAR(100) DEFAULT 'Anonymous',
  is_anonymous BOOLEAN DEFAULT true
);

-- Drop and recreate messages table
DROP TABLE IF EXISTS messages CASCADE;
CREATE TABLE messages (
  id SERIAL PRIMARY KEY,
  item_id INTEGER REFERENCES free_items(id) ON DELETE CASCADE,
  from_user_id INTEGER REFERENCES users(id),
  to_user_id INTEGER REFERENCES users(id),
  message TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_free_items_category ON free_items(category);
CREATE INDEX IF NOT EXISTS idx_free_items_available_from ON free_items(available_from);
CREATE INDEX IF NOT EXISTS idx_free_items_user_id ON free_items(user_id);
CREATE INDEX IF NOT EXISTS idx_messages_item_id ON messages(item_id);
CREATE INDEX IF NOT EXISTS idx_messages_users ON messages(from_user_id, to_user_id);
CREATE INDEX IF NOT EXISTS idx_free_items_edit_code ON free_items(edit_code);
CREATE INDEX IF NOT EXISTS idx_free_items_status ON free_items(status);

-- Clear existing data
TRUNCATE free_items CASCADE;

-- Insert test data
INSERT INTO free_items (
  title, 
  description, 
  category, 
  location_lat, 
  location_lng, 
  location_address,
  available_from,
  status
) VALUES 
(
  'Free Pizza from Local Event', 
  'Leftover pizza from tech meetup. Still fresh and packaged!', 
  'Food',
  37.7749,
  -122.4194,
  '123 Main St, San Francisco, CA',
  NOW(),
  'available'
),
(
  'Community Garden Workshop', 
  'Learn about urban gardening and take home free seedlings', 
  'Events',
  37.7694,
  -122.4862,
  'Golden Gate Park, San Francisco, CA',
  NOW() + INTERVAL '2 days',
  'available'
),
(
  'Moving Sale - Free Furniture', 
  'Various furniture items including desk, chairs, and bookshelf. Must pick up.', 
  'Items',
  37.7831,
  -122.4159,
  '456 Market St, San Francisco, CA',
  NOW(),
  'available'
),
(
  'Free Coding Workshop', 
  'Introduction to web development. All skill levels welcome!', 
  'Services',
  37.7847,
  -122.4089,
  'SF Public Library - Main Branch',
  NOW() + INTERVAL '5 days',
  'available'
),
(
  'Fresh Produce Giveaway', 
  'Local farm surplus - organic vegetables and fruits', 
  'Food',
  37.7599,
  -122.4148,
  'Mission District Farmers Market',
  NOW() + INTERVAL '1 day',
  'available'
),
(
  'Free Yoga in the Park', 
  'Outdoor yoga session for all levels. Bring your own mat!', 
  'Events',
  37.7695,
  -122.4838,
  'Golden Gate Park - Botanical Garden',
  NOW() + INTERVAL '3 days',
  'available'
),
(
  'Free Books - Library Clearance', 
  E'Various genres including fiction, non-fiction, and children\'s books',
  'Items',
  37.7785,
  -122.4156,
  'SF Public Library - Hayes Valley Branch',
  NOW(),
  'available'
),
(
  'Resume Review Service', 
  'Professional resume review and career advice. 30-minute sessions.', 
  'Services',
  37.7873,
  -122.4024,
  'WeWork - Embarcadero',
  NOW() + INTERVAL '4 days',
  'available'
);