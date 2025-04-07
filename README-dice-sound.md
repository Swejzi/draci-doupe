# Zvukový soubor pro hod kostkou

Pro plnou funkčnost házení kostkou je potřeba přidat zvukový soubor pro hod kostkou. Soubor by měl být umístěn v:

```
public/sounds/dice-roll.mp3
```

Zvukový soubor můžete stáhnout z některé z následujících stránek:

1. Pixabay: https://pixabay.com/sound-effects/search/dice/
2. FreeSound: https://freesound.org/search/?q=dice+roll
3. ZapSplat: https://www.zapsplat.com/sound-effect-category/dice/

Stáhněte zvukový soubor ve formátu MP3 a uložte ho do adresáře `public/sounds/` s názvem `dice-roll.mp3`.

## Alternativní řešení

Pokud nemáte přístup ke zvukovým souborům, můžete dočasně vypnout přehrávání zvuku nastavením parametru `playSound` na `false` v komponentě `PlayerDiceRoller.jsx`:

```jsx
<AnimatedDiceRoll 
  diceString={diceString}
  finalResult={rollResult}
  onAnimationComplete={handleAnimationComplete}
  playSound={false}
/>
```

Nebo v utilite `gameMechanics.js` při volání funkce `rollDice`:

```javascript
const result = rollDice(diceString, { addToHistory: true, playSound: false });
```
