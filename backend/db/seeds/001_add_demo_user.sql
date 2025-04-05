-- Seed pro vložení demo uživatele

INSERT INTO users (username, email, password_hash) 
VALUES (
    'demo',                                     -- Uživatelské jméno
    'demo@example.com',                         -- Email
    '$2b$10$V1P5tsRzI9aI1iD3SWn58eappDsYMFBu27.8.qiUgBrQdGUkcDIru' -- Hash pro heslo 'password'
) 
ON CONFLICT (username) DO NOTHING; -- Kontrolujeme konflikt pouze pro username, který má UNIQUE constraint

-- Přidáme demo postavu pro tohoto uživatele
-- Nejprve zjistíme ID demo uživatele (pokud byl právě vložen nebo už existoval)
WITH demo_user AS (
    SELECT id FROM users WHERE username = 'demo'
)
INSERT INTO characters (user_id, name, race, class, level, experience, strength, dexterity, constitution, intelligence, wisdom, charisma, max_health, current_health)
SELECT 
    du.id, 
    'Demo Hrdina', -- Jméno postavy
    'Člověk',      -- Rasa
    'Bojovník',    -- Třída
    1,             -- Level
    0,             -- Experience
    12,            -- Strength
    11,            -- Dexterity
    13,            -- Constitution
    9,             -- Intelligence
    10,            -- Wisdom
    10,            -- Charisma
    18,            -- Max Health (13 + 5)
    18             -- Current Health
FROM demo_user du
-- Odebráno ON CONFLICT, protože nemáme zaručený UNIQUE constraint pro (user_id, name)
-- Pokud by seed běžel vícekrát, mohl by vložit duplicitní postavu. Pro demo účely to akceptujeme.
-- V reálné aplikaci bychom měli buď přidat UNIQUE constraint, nebo použít složitější logiku v seedu.
;
