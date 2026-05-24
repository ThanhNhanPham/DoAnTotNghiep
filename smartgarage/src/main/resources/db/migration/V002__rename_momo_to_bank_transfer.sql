UPDATE bookings
SET payment_method = 'BANK_TRANSFER'
WHERE payment_method = 'MOMO';

UPDATE payment_transactions
SET provider = 'BANK_TRANSFER'
WHERE provider = 'MOMO';

UPDATE payment_invoices
SET payment_method = 'BANK_TRANSFER'
WHERE payment_method = 'MOMO';

UPDATE payment_invoices
SET payment_provider = 'BANK_TRANSFER'
WHERE payment_provider = 'MOMO';
