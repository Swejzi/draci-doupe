#!/bin/bash

# Stažení nejnovějších obrazů
docker-compose pull

# Restart kontejnerů
docker-compose down
docker-compose up -d

echo "Aktualizace Dračí doupě aplikace dokončena"
echo "Frontend je dostupný na adrese: https://dracak.swejzi.cz"
echo "Backend API je dostupné na adrese: https://dracak.swejzi.cz/api"
