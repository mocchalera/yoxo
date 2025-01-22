-- Drop existing tables if they exist
DROP TABLE IF EXISTS messages CASCADE;
DROP TABLE IF EXISTS survey_responses CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- Create users table
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    supabase_id TEXT NOT NULL UNIQUE,
    line_id TEXT UNIQUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create survey_responses table
CREATE TABLE survey_responses (
    id SERIAL PRIMARY KEY,
    yoxo_id TEXT NOT NULL UNIQUE,
    user_id TEXT NOT NULL,  -- Changed from UUID to TEXT
    section1_responses JSONB NOT NULL,
    section2_responses JSONB NOT NULL,
    section3_responses JSONB NOT NULL,
    calculated_scores JSONB NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create messages table
CREATE TABLE messages (
    id SERIAL PRIMARY KEY,
    user_id TEXT NOT NULL,  -- Changed from UUID to TEXT
    dify_message TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_users_supabase_id ON users(supabase_id);
CREATE INDEX idx_users_line_id ON users(line_id);
CREATE INDEX idx_survey_responses_user_id ON survey_responses(user_id);
CREATE INDEX idx_survey_responses_yoxo_id ON survey_responses(yoxo_id);
CREATE INDEX idx_messages_user_id ON messages(user_id);

-- Grant necessary permissions
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO PUBLIC;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO PUBLIC;

-- Temporarily disable RLS
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE survey_responses DISABLE ROW LEVEL SECURITY;
ALTER TABLE messages DISABLE ROW LEVEL SECURITY;