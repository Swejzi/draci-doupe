# Makefile pro projekt Dračí doupě

# Proměnné
BACKEND_DIR = backend
FRONTEND_DIR = frontend

# Barvy pro výstup
GREEN = \033[0;32m
YELLOW = \033[0;33m
RED = \033[0;31m
NC = \033[0m # No Color

.PHONY: help install start stop dev test lint clean db-start db-stop build

# Výchozí cíl - zobrazí nápovědu
help:
	@echo "${YELLOW}Dračí doupě - Makefile příkazy:${NC}"
	@echo ""
	@echo "${GREEN}make install${NC}      - Nainstaluje všechny závislosti (backend i frontend)"
	@echo "${GREEN}make start${NC}        - Spustí backend i frontend v produkčním režimu"
	@echo "${GREEN}make dev${NC}          - Spustí backend i frontend ve vývojovém režimu"
	@echo "${GREEN}make stop${NC}         - Zastaví běžící procesy"
	@echo "${GREEN}make test${NC}         - Spustí testy pro backend i frontend"
	@echo "${GREEN}make test-backend${NC} - Spustí testy pouze pro backend"
	@echo "${GREEN}make test-frontend${NC}- Spustí testy pouze pro frontend"
	@echo "${GREEN}make lint${NC}         - Spustí kontrolu kódu pro backend i frontend"
	@echo "${GREEN}make lint-fix${NC}     - Opraví problémy s kódem pro backend i frontend"
	@echo "${GREEN}make clean${NC}        - Vyčistí node_modules a build adresáře"
	@echo "${GREEN}make db-start${NC}     - Spustí PostgreSQL databázi v Docker kontejneru"
	@echo "${GREEN}make db-stop${NC}      - Zastaví PostgreSQL databázi v Docker kontejneru"
	@echo "${GREEN}make build${NC}        - Sestaví frontend pro produkci"

# Instalace závislostí
install:
	@echo "${YELLOW}Instalace závislostí pro backend...${NC}"
	cd $(BACKEND_DIR) && npm install
	@echo "${YELLOW}Instalace závislostí pro frontend...${NC}"
	cd $(FRONTEND_DIR) && npm install
	@echo "${GREEN}Instalace dokončena!${NC}"

# Spuštění v produkčním režimu
start:
	@echo "${YELLOW}Spouštění backendu...${NC}"
	cd $(BACKEND_DIR) && npm start &
	@echo "${YELLOW}Spouštění frontendu...${NC}"
	cd $(FRONTEND_DIR) && npm run preview

# Spuštění ve vývojovém režimu
dev:
	@echo "${YELLOW}Spouštění backendu v dev režimu...${NC}"
	cd $(BACKEND_DIR) && npm run dev &
	@echo "${YELLOW}Spouštění frontendu v dev režimu...${NC}"
	cd $(FRONTEND_DIR) && npm run dev

# Zastavení běžících procesů
stop:
	@echo "${YELLOW}Zastavování běžících procesů...${NC}"
	-pkill -f "node $(BACKEND_DIR)/index.js" 2>/dev/null || true
	-pkill -f "vite" 2>/dev/null || true
	@echo "${GREEN}Procesy zastaveny!${NC}"

# Spuštění testů
test: test-backend test-frontend

# Spuštění testů pro backend
test-backend:
	@echo "${YELLOW}Spouštění testů pro backend...${NC}"
	cd $(BACKEND_DIR) && npm test

# Spuštění testů pro frontend
test-frontend:
	@echo "${YELLOW}Spouštění testů pro frontend...${NC}"
	cd $(FRONTEND_DIR) && npm test

# Kontrola kódu
lint:
	@echo "${YELLOW}Kontrola kódu pro backend...${NC}"
	cd $(BACKEND_DIR) && npm run lint
	@echo "${YELLOW}Kontrola kódu pro frontend...${NC}"
	cd $(FRONTEND_DIR) && npm run lint

# Oprava problémů s kódem
lint-fix:
	@echo "${YELLOW}Oprava kódu pro backend...${NC}"
	cd $(BACKEND_DIR) && npm run lint:fix
	@echo "${YELLOW}Oprava kódu pro frontend...${NC}"
	cd $(FRONTEND_DIR) && npm run lint:fix

# Vyčištění projektu
clean:
	@echo "${YELLOW}Čištění node_modules a build adresářů...${NC}"
	rm -rf $(BACKEND_DIR)/node_modules
	rm -rf $(FRONTEND_DIR)/node_modules
	rm -rf $(FRONTEND_DIR)/dist
	@echo "${GREEN}Projekt vyčištěn!${NC}"

# Spuštění databáze
db-start:
	@echo "${YELLOW}Spouštění PostgreSQL databáze...${NC}"
	docker-compose up -d postgres_db
	@echo "${GREEN}Databáze spuštěna!${NC}"

# Zastavení databáze
db-stop:
	@echo "${YELLOW}Zastavování PostgreSQL databáze...${NC}"
	docker-compose stop postgres_db
	@echo "${GREEN}Databáze zastavena!${NC}"

# Sestavení frontendu pro produkci
build:
	@echo "${YELLOW}Sestavování frontendu pro produkci...${NC}"
	cd $(FRONTEND_DIR) && npm run build
	@echo "${GREEN}Frontend sestaven!${NC}"
