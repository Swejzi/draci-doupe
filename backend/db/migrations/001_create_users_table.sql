-- Migrace pro vytvoření tabulky users

CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,                     -- Unikátní identifikátor uživatele
    username VARCHAR(50) UNIQUE NOT NULL,      -- Uživatelské jméno (unikátní)
    email VARCHAR(100) UNIQUE NOT NULL,        -- Email (unikátní)
    password_hash VARCHAR(255) NOT NULL,       -- Hash hesla (nikdy neukládat heslo v plain textu!)
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP, -- Čas vytvoření účtu
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP  -- Čas poslední aktualizace účtu
);

-- Indexy pro rychlejší vyhledávání
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- Trigger pro automatickou aktualizaci updated_at (volitelné, ale doporučené)
-- Nejprve vytvoříme funkci
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = NOW(); 
   RETURN NEW;
END;
$$ language 'plpgsql';

-- Poté vytvoříme trigger, který funkci zavolá při UPDATE operaci
DROP TRIGGER IF EXISTS update_users_updated_at ON users; -- Odstraníme starý trigger, pokud existuje
CREATE TRIGGER update_users_updated_at
BEFORE UPDATE ON users
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Komentář k tabulce a sloupcům (pro lepší dokumentaci)
COMMENT ON TABLE users IS 'Tabulka pro ukládání informací o uživatelích aplikace.';
COMMENT ON COLUMN users.id IS 'Primární klíč, unikátní ID uživatele.';
COMMENT ON COLUMN users.username IS 'Unikátní uživatelské jméno pro přihlášení.';
COMMENT ON COLUMN users.email IS 'Unikátní emailová adresa uživatele.';
COMMENT ON COLUMN users.password_hash IS 'Bezpečně uložený hash hesla uživatele.';
COMMENT ON COLUMN users.created_at IS 'Datum a čas vytvoření uživatelského účtu.';
COMMENT ON COLUMN users.updated_at IS 'Datum a čas poslední aktualizace údajů uživatele.';
