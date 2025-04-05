-- Migrace pro vytvoření tabulky game_sessions

CREATE TABLE IF NOT EXISTS game_sessions (
    id SERIAL PRIMARY KEY,                      -- Unikátní identifikátor herního sezení
    story_id VARCHAR(100) NOT NULL,             -- ID načteného příběhu (odpovídá názvu souboru)
    -- Pro multiplayer můžeme mít více uživatelů/postav v jednom sezení, 
    -- prozatím zjednodušíme na jednoho hráče/postavu na sezení
    character_id INTEGER UNIQUE NOT NULL REFERENCES characters(id) ON DELETE CASCADE, -- Odkaz na postavu hráče v tomto sezení (UNIQUE zajišťuje, že postava je jen v jednom sezení)
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE, -- Odkaz na uživatele (pro snadnější dotazy)
    
    -- Aktuální stav hry (může být rozsáhlý, použijeme JSONB)
    game_state JSONB NOT NULL,                  -- Uložený stav hry (aktuální lokace, stav NPC, aktivní questy, historie akcí atd.)
    
    -- Informace o AI konverzaci (volitelné, ale může být užitečné)
    ai_history JSONB DEFAULT '[]',              -- Historie konverzace s AI pro toto sezení
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP, -- Čas vytvoření sezení
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP  -- Čas poslední aktualizace sezení (např. po akci hráče)
);

-- Indexy
CREATE INDEX IF NOT EXISTS idx_game_sessions_character_id ON game_sessions(character_id);
CREATE INDEX IF NOT EXISTS idx_game_sessions_user_id ON game_sessions(user_id);

-- Trigger pro automatickou aktualizaci updated_at
DROP TRIGGER IF EXISTS update_game_sessions_updated_at ON game_sessions; 
CREATE TRIGGER update_game_sessions_updated_at
BEFORE UPDATE ON game_sessions
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column(); 

-- Komentáře
COMMENT ON TABLE game_sessions IS 'Tabulka pro ukládání stavu aktivních herních sezení.';
COMMENT ON COLUMN game_sessions.story_id IS 'Identifikátor příběhu, který se v tomto sezení hraje.';
COMMENT ON COLUMN game_sessions.character_id IS 'Odkaz na postavu, která hraje v tomto sezení.';
COMMENT ON COLUMN game_sessions.user_id IS 'Odkaz na uživatele, kterému postava patří.';
COMMENT ON COLUMN game_sessions.game_state IS 'Kompletní stav hry uložený jako JSONB (lokace, NPC, questy, inventář atd.).';
COMMENT ON COLUMN game_sessions.ai_history IS 'Historie promptů a odpovědí AI pro toto sezení (pro kontext a ladění).';
