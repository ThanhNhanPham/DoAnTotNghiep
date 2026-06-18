CREATE TABLE IF NOT EXISTS chat_rooms (
    id BIGSERIAL PRIMARY KEY,
    booking_id BIGINT NOT NULL UNIQUE,
    customer_id BIGINT NOT NULL,
    branch_id BIGINT NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    last_message_at TIMESTAMP NULL,
    CONSTRAINT fk_chat_rooms_booking FOREIGN KEY (booking_id) REFERENCES bookings(id),
    CONSTRAINT fk_chat_rooms_customer FOREIGN KEY (customer_id) REFERENCES users(id),
    CONSTRAINT fk_chat_rooms_branch FOREIGN KEY (branch_id) REFERENCES branches(id)
);

CREATE TABLE IF NOT EXISTS chat_messages (
    id BIGSERIAL PRIMARY KEY,
    room_id BIGINT NOT NULL,
    sender_id BIGINT NOT NULL,
    sender_role VARCHAR(30) NOT NULL,
    content TEXT NOT NULL,
    is_read BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_chat_messages_room FOREIGN KEY (room_id) REFERENCES chat_rooms(id),
    CONSTRAINT fk_chat_messages_sender FOREIGN KEY (sender_id) REFERENCES users(id)
);

CREATE INDEX IF NOT EXISTS idx_chat_messages_room_created_at
    ON chat_messages(room_id, created_at);
