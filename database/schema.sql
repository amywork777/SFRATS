-- Create the items table
CREATE TABLE items (
  id SERIAL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  category VARCHAR(50),
  location_address TEXT,
  location_lat DECIMAL(10, 8),
  location_lng DECIMAL(11, 8),
  available_from TIMESTAMP WITH TIME ZONE,
  available_until TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  interest_count INTEGER DEFAULT 0,
  status VARCHAR(20) DEFAULT 'available',
  url TEXT,
  posted_by VARCHAR(255),
  contact_info TEXT,
  edit_code VARCHAR(255) NOT NULL
);

-- Create an index for faster queries
CREATE INDEX idx_status ON items(status);
CREATE INDEX idx_created_at ON items(created_at); 