-- Add country of residence to wise_users
-- Populated during the new multi-step registration flow

ALTER TABLE wise_users ADD COLUMN IF NOT EXISTS country TEXT;

CREATE INDEX IF NOT EXISTS wise_users_country_idx ON wise_users(country);

COMMENT ON COLUMN wise_users.country IS 'Country of residence entered during registration';
