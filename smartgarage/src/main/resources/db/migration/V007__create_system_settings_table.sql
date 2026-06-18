CREATE TABLE IF NOT EXISTS system_settings (
    id BIGINT PRIMARY KEY CHECK (id = 1),
    version BIGINT NOT NULL DEFAULT 0,
    theme_color VARCHAR(20) NOT NULL,
    dark_mode BOOLEAN NOT NULL DEFAULT FALSE,
    font_size INTEGER NOT NULL DEFAULT 14,
    language VARCHAR(10) NOT NULL DEFAULT 'vi',
    date_format VARCHAR(30) NOT NULL DEFAULT 'DD/MM/YYYY',
    time_zone VARCHAR(50) NOT NULL DEFAULT 'Asia/Ho_Chi_Minh',
    email_notifications BOOLEAN NOT NULL DEFAULT TRUE,
    push_notifications BOOLEAN NOT NULL DEFAULT TRUE,
    sound_enabled BOOLEAN NOT NULL DEFAULT FALSE,
    company_name VARCHAR(255) NOT NULL DEFAULT 'Smart Garage',
    company_phone VARCHAR(30) NOT NULL DEFAULT '0901234567',
    company_email VARCHAR(255) NOT NULL DEFAULT '6351071051@st.utc2.edu.vn',
    company_address TEXT,
    updated_by VARCHAR(255) NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NULL
);

INSERT INTO system_settings (
    id,
    version,
    theme_color,
    dark_mode,
    font_size,
    language,
    date_format,
    time_zone,
    email_notifications,
    push_notifications,
    sound_enabled,
    company_name,
    company_phone,
    company_email,
    company_address,
    updated_by
)
VALUES (
    1,
    0,
    '#1890ff',
    FALSE,
    14,
    'vi',
    'DD/MM/YYYY',
    'Asia/Ho_Chi_Minh',
    TRUE,
    TRUE,
    FALSE,
    'Smart Garage',
    '0901234567',
    '6351071051@st.utc2.edu.vn',
    '25 đường số 18, Hiệp Bình, TPHCM',
    'system'
)
ON CONFLICT (id) DO NOTHING;
