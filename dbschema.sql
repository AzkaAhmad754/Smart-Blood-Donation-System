-- BloodConnect PostgreSQL Schema

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table (base for all roles)
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(20) NOT NULL CHECK (role IN ('donor', 'hospital', 'blood_bank')),
  city VARCHAR(100) NOT NULL,
  phone VARCHAR(20),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Donors
CREATE TABLE donors (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  blood_type VARCHAR(5) NOT NULL CHECK (blood_type IN ('A+','A-','B+','B-','O+','O-','AB+','AB-')),
  availability BOOLEAN DEFAULT true,
  lat DECIMAL(10, 8),
  lng DECIMAL(11, 8)
);

-- Hospitals
CREATE TABLE hospitals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  license_number VARCHAR(100) NOT NULL
);

-- Blood Banks
CREATE TABLE blood_banks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  license_number VARCHAR(100) NOT NULL
);

-- Blood Inventory (per blood bank, per type)
CREATE TABLE blood_inventory (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  blood_bank_id UUID REFERENCES blood_banks(id) ON DELETE CASCADE,
  blood_type VARCHAR(5) NOT NULL CHECK (blood_type IN ('A+','A-','B+','B-','O+','O-','AB+','AB-')),
  units INTEGER DEFAULT 0 CHECK (units >= 0),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(blood_bank_id, blood_type)
);

-- Blood Requests (posted by hospitals)
CREATE TABLE blood_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  hospital_id UUID REFERENCES hospitals(id) ON DELETE CASCADE,
  blood_type VARCHAR(5) NOT NULL CHECK (blood_type IN ('A+','A-','B+','B-','O+','O-','AB+','AB-')),
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  urgency VARCHAR(10) NOT NULL CHECK (urgency IN ('CRITICAL','HIGH','NORMAL')),
  notes TEXT,
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active','fulfilled','cancelled')),
  city VARCHAR(100) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  fulfilled_at TIMESTAMP
);

-- Donor Responses
CREATE TABLE donor_responses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  request_id UUID REFERENCES blood_requests(id) ON DELETE CASCADE,
  donor_id UUID REFERENCES donors(id) ON DELETE CASCADE,
  status VARCHAR(10) DEFAULT 'pending' CHECK (status IN ('accepted','declined','pending')),
  responded_at TIMESTAMP,
  UNIQUE(request_id, donor_id)
);

-- Bank Responses
CREATE TABLE bank_responses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  request_id UUID REFERENCES blood_requests(id) ON DELETE CASCADE,
  bank_id UUID REFERENCES blood_banks(id) ON DELETE CASCADE,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('confirmed','pending','declined')),
  units_committed INTEGER DEFAULT 0,
  responded_at TIMESTAMP,
  UNIQUE(request_id, bank_id)
);

-- Indexes for performance
CREATE INDEX idx_donors_blood_type ON donors(blood_type);
CREATE INDEX idx_donors_city ON donors(user_id);
CREATE INDEX idx_blood_requests_status ON blood_requests(status);
CREATE INDEX idx_blood_requests_city ON blood_requests(city);
CREATE INDEX idx_blood_requests_blood_type ON blood_requests(blood_type);
CREATE INDEX idx_donor_responses_request ON donor_responses(request_id);
CREATE INDEX idx_bank_responses_request ON bank_responses(request_id);

-- Seed data for testing
INSERT INTO users (id, name, email, password_hash, role, city, phone) VALUES
  ('11111111-1111-1111-1111-111111111111', 'Ali Hassan', 'donor@test.com', '$2b$10$rQZ9uAVn8x1K2mN3oP4qRuS5tV6wX7yZ8aB9cD0eF1gH2iJ3kL4m', 'donor', 'Lahore', '03001234567'),
  ('22222222-2222-2222-2222-222222222222', 'Shaukat Khanum Hospital', 'hospital@test.com', '$2b$10$rQZ9uAVn8x1K2mN3oP4qRuS5tV6wX7yZ8aB9cD0eF1gH2iJ3kL4m', 'hospital', 'Lahore', '04235404040'),
  ('33333333-3333-3333-3333-333333333333', 'Lahore Blood Bank', 'bank@test.com', '$2b$10$rQZ9uAVn8x1K2mN3oP4qRuS5tV6wX7yZ8aB9cD0eF1gH2iJ3kL4m', 'blood_bank', 'Lahore', '04235678901');

INSERT INTO donors (user_id, blood_type, availability) VALUES
  ('11111111-1111-1111-1111-111111111111', 'O+', true);

INSERT INTO hospitals (user_id, license_number) VALUES
  ('22222222-2222-2222-2222-222222222222', 'HOSP-LHR-001');

INSERT INTO blood_banks (id, user_id, license_number) VALUES
  ('44444444-4444-4444-4444-444444444444', '33333333-3333-3333-3333-333333333333', 'BB-LHR-001');

INSERT INTO blood_inventory (blood_bank_id, blood_type, units) VALUES
  ('44444444-4444-4444-4444-444444444444', 'A+', 20),
  ('44444444-4444-4444-4444-444444444444', 'A-', 8),
  ('44444444-4444-4444-4444-444444444444', 'B+', 15),
  ('44444444-4444-4444-4444-444444444444', 'B-', 3),
  ('44444444-4444-4444-4444-444444444444', 'O+', 25),
  ('44444444-4444-4444-4444-444444444444', 'O-', 6),
  ('44444444-4444-4444-4444-444444444444', 'AB+', 12),
  ('44444444-4444-4444-4444-444444444444', 'AB-', 4);
