-- Change user_id column type to UUID
ALTER TABLE survey_responses
ALTER COLUMN user_id TYPE UUID USING user_id::uuid;

-- Add constraints
ALTER TABLE survey_responses
ADD CONSTRAINT fk_user_id
FOREIGN KEY (user_id)
REFERENCES auth.users(id);
