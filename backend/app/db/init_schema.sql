CREATE TABLE IF NOT EXISTS usuarios (
    id SERIAL PRIMARY KEY,
    name VARCHAR(120) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL
);

CREATE TABLE IF NOT EXISTS cuentas_bancarias (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    bank_name VARCHAR(100) NOT NULL,
    account_type VARCHAR(50) NOT NULL,
    last_four VARCHAR(4) NOT NULL,
    access_token VARCHAR(512) NOT NULL
);

CREATE TABLE IF NOT EXISTS transacciones (
    id SERIAL PRIMARY KEY,
    account_id INTEGER NOT NULL REFERENCES cuentas_bancarias(id) ON DELETE CASCADE,
    amount DOUBLE PRECISION NOT NULL,
    date DATE NOT NULL,
    description VARCHAR(255) NOT NULL,
    category VARCHAR(80) NOT NULL,
    type VARCHAR(20) NOT NULL CHECK (type IN ('income', 'expense')),
    is_automated BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE TABLE IF NOT EXISTS presupuestos (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    category VARCHAR(80) NOT NULL,
    limit_amount DOUBLE PRECISION NOT NULL,
    current_spent DOUBLE PRECISION NOT NULL DEFAULT 0,
    month_year VARCHAR(7) NOT NULL
);
