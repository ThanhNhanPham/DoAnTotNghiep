ALTER TABLE payment_invoices
    DROP COLUMN IF EXISTS payment_transaction_id;

DROP TABLE IF EXISTS payment_transactions;
