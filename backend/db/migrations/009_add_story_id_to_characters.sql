-- Migrace pro přidání story_id do tabulky characters

-- Přidání sloupce story_id do tabulky characters
ALTER TABLE characters ADD COLUMN story_id VARCHAR(100);

-- Přidání komentáře k novému sloupci
COMMENT ON COLUMN characters.story_id IS 'ID příběhu, pro který byla postava vytvořena.';
