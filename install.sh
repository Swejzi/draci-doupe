#!/bin/bash

# Přidání hostu do Nginx Proxy Manager
add-nginx-host -h dracak.swejzi.cz -c draci-doupe-frontend -p 8082

# Vytvoření konfiguračního souboru
if [ ! -f ".env" ]; then
    cp .env.example .env
    echo "Vytvořen konfigurační soubor .env"
    echo "Prosím upravte hodnoty v .env souboru podle potřeby"
fi

# Spuštění Docker kontejnerů
docker-compose up -d

echo "Instalace Dračí doupě aplikace dokončena"
echo "Frontend je dostupný na adrese: https://dracak.swejzi.cz"
echo "Backend API je dostupné na adrese: https://dracak.swejzi.cz/api"
