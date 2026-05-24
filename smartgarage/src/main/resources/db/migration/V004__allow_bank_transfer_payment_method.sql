ALTER TABLE payment_invoices
    DROP CONSTRAINT IF EXISTS payment_invoices_payment_method_check;

ALTER TABLE payment_invoices
    ADD CONSTRAINT payment_invoices_payment_method_check
    CHECK (payment_method IN ('CASH', 'BANK_TRANSFER'));

