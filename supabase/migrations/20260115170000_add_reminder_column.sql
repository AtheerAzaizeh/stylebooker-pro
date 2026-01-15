-- Add reminder_sent column to bookings table
-- Used by send-reminders function to track which bookings have received 24h reminder

ALTER TABLE bookings 
ADD COLUMN IF NOT EXISTS reminder_sent BOOLEAN DEFAULT FALSE;

-- Index for efficient reminder queries
CREATE INDEX IF NOT EXISTS idx_bookings_reminder_pending 
ON bookings (booking_date, reminder_sent) 
WHERE status = 'confirmed' AND reminder_sent = false;

COMMENT ON COLUMN bookings.reminder_sent IS 'Whether a 24h reminder SMS has been sent for this booking';
