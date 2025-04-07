# Zvukové soubory pro házení kostkou

Pro plnou funkčnost vylepšené mechaniky házení kostkou je potřeba přidat následující zvukové soubory do adresáře `public/sounds/`:

1. `dice-roll.mp3` - Základní zvuk pro hod kostkou
2. `critical-success.mp3` - Zvuk pro kritický úspěch (hod 20 na k20)
3. `critical-fail.mp3` - Zvuk pro kritický neúspěch (hod 1 na k20)

## Doporučené parametry zvukových souborů

### dice-roll.mp3
- **Délka**: 1-2 sekundy
- **Obsah**: Zvuk kutálení kostky a dopadu
- **Velikost**: Do 100 KB

### critical-success.mp3
- **Délka**: 1-3 sekundy
- **Obsah**: Triumfální fanfára nebo zvuk úspěchu
- **Velikost**: Do 150 KB

### critical-fail.mp3
- **Délka**: 1-2 sekundy
- **Obsah**: Zvuk selhání nebo smutný tón
- **Velikost**: Do 150 KB

## Kde najít zvukové soubory

Zvukové soubory můžete stáhnout z následujících zdrojů:

1. **Pixabay**: https://pixabay.com/sound-effects/
2. **FreeSound**: https://freesound.org/
3. **ZapSplat**: https://www.zapsplat.com/

## Alternativní řešení

Pokud nemáte přístup ke zvukovým souborům, můžete dočasně vypnout přehrávání zvuku nastavením parametru `soundVolume` na `0` v nastavení animací.
