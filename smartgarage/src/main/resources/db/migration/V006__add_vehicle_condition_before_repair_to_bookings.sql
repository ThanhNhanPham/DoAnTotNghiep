-- Store vehicle condition captured by admin before repair starts
-- PostgreSQL

ALTER TABLE bookings
    ADD COLUMN IF NOT EXISTS vehicle_condition_before_repair TEXT;
