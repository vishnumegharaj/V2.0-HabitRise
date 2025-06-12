-- Sessions table for authentication
CREATE TABLE sessions (
  sid VARCHAR PRIMARY KEY,
  sess JSONB NOT NULL,
  expire TIMESTAMP NOT NULL
);

CREATE INDEX ON sessions (expire);

-- Users table
CREATE TABLE users (
  id VARCHAR PRIMARY KEY,
  email VARCHAR UNIQUE,
  first_name VARCHAR,
  last_name VARCHAR,
  profile_image_url VARCHAR,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Habits table
CREATE TABLE habits (
  id SERIAL PRIMARY KEY,
  user_id VARCHAR NOT NULL REFERENCES users(id),
  name VARCHAR NOT NULL,
  display_name VARCHAR NOT NULL,
  emoji VARCHAR NOT NULL,
  initial_target VARCHAR NOT NULL,
  current_target VARCHAR NOT NULL,
  unit VARCHAR NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Habit completions
CREATE TABLE habit_completions (
  id SERIAL PRIMARY KEY,
  user_id VARCHAR NOT NULL REFERENCES users(id),
  habit_id INTEGER NOT NULL REFERENCES habits(id),
  date DATE NOT NULL,
  completed BOOLEAN NOT NULL DEFAULT FALSE,
  actual_value VARCHAR,
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Journal entries
CREATE TABLE journal_entries (
  id SERIAL PRIMARY KEY,
  user_id VARCHAR NOT NULL REFERENCES users(id),
  date DATE NOT NULL,
  mood VARCHAR NOT NULL,
  content TEXT,
  ai_affirmation TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- User progress
CREATE TABLE user_progress (
  id SERIAL PRIMARY KEY,
  user_id VARCHAR NOT NULL REFERENCES users(id),
  current_day INTEGER NOT NULL DEFAULT 1,
  start_date DATE NOT NULL,
  total_days_completed INTEGER NOT NULL DEFAULT 0,
  current_streak INTEGER NOT NULL DEFAULT 0,
  best_streak INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Habit streaks
CREATE TABLE habit_streaks (
  id SERIAL PRIMARY KEY,
  user_id VARCHAR NOT NULL REFERENCES users(id),
  habit_id INTEGER NOT NULL REFERENCES habits(id),
  current_streak INTEGER NOT NULL DEFAULT 0,
  best_streak INTEGER NOT NULL DEFAULT 0,
  last_completed_date DATE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);