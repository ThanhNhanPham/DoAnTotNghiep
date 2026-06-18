-- Membership, loyalty points, invoice snapshot migration
-- PostgreSQL

ALTER TABLE users
    ADD COLUMN IF NOT EXISTS loyalty_points integer NOT NULL DEFAULT 0;

ALTER TABLE users
    ADD COLUMN IF NOT EXISTS membership_tier varchar(20) NOT NULL DEFAULT 'REGULAR';


ALTER TABLE bookings
    ADD COLUMN IF NOT EXISTS service_amount numeric(15,2);

ALTER TABLE bookings
    ADD COLUMN IF NOT EXISTS part_amount numeric(15,2);

ALTER TABLE bookings
    ADD COLUMN IF NOT EXISTS membership_tier_applied varchar(20);

ALTER TABLE bookings
    ADD COLUMN IF NOT EXISTS membership_discount_rate numeric(5,2);

ALTER TABLE bookings
    ADD COLUMN IF NOT EXISTS membership_discount_amount numeric(15,2);

ALTER TABLE bookings
    ADD COLUMN IF NOT EXISTS points_earned integer NOT NULL DEFAULT 0;

ALTER TABLE bookings
    ADD COLUMN IF NOT EXISTS final_amount numeric(15,2);

ALTER TABLE bookings
    ADD COLUMN IF NOT EXISTS points_rewarded boolean NOT NULL DEFAULT false;


ALTER TABLE payment_invoices
    ADD COLUMN IF NOT EXISTS service_amount numeric(15,2);

ALTER TABLE payment_invoices
    ADD COLUMN IF NOT EXISTS part_amount numeric(15,2);

ALTER TABLE payment_invoices
    ADD COLUMN IF NOT EXISTS membership_tier varchar(20);

ALTER TABLE payment_invoices
    ADD COLUMN IF NOT EXISTS membership_discount_rate numeric(5,2);

ALTER TABLE payment_invoices
    ADD COLUMN IF NOT EXISTS membership_discount_amount numeric(15,2);

ALTER TABLE payment_invoices
    ADD COLUMN IF NOT EXISTS points_earned integer;

ALTER TABLE payment_invoices
    ADD COLUMN IF NOT EXISTS final_amount numeric(15,2);


-- Backfill snapshot values for existing bookings where possible
UPDATE bookings
SET service_amount = COALESCE(service_amount, total_amount, 0),
    part_amount = COALESCE(part_amount, 0),
    membership_tier_applied = COALESCE(membership_tier_applied, 'REGULAR'),
    membership_discount_rate = COALESCE(membership_discount_rate, 0),
    membership_discount_amount = COALESCE(membership_discount_amount, 0),
    points_earned = COALESCE(points_earned, 0),
    final_amount = COALESCE(final_amount, total_amount),
    points_rewarded = COALESCE(points_rewarded, false);

UPDATE payment_invoices pi
SET service_amount = COALESCE(pi.service_amount, b.service_amount, b.total_amount, 0),
    part_amount = COALESCE(pi.part_amount, b.part_amount, 0),
    membership_tier = COALESCE(pi.membership_tier, b.membership_tier_applied, 'REGULAR'),
    membership_discount_rate = COALESCE(pi.membership_discount_rate, b.membership_discount_rate, 0),
    membership_discount_amount = COALESCE(pi.membership_discount_amount, b.membership_discount_amount, 0),
    points_earned = COALESCE(pi.points_earned, b.points_earned, 0),
    final_amount = COALESCE(pi.final_amount, b.final_amount, pi.amount)
FROM bookings b
WHERE pi.booking_id = b.id;
