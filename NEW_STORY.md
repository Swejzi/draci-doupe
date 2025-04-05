# Vytvoření nového příběhu pro Dračí doupě

Tento dokument obsahuje instrukce a dokumentaci pro vytvoření nového příběhu ve formátu JSON pro hru Dračí doupě s AI Dungeon Masterem.

## Struktura souboru příběhu

Soubor příběhu je ve formátu JSON a obsahuje všechny informace potřebné pro vytvoření kompletního herního světa, včetně lokací, postav, úkolů, předmětů a událostí. Níže je popsána struktura souboru a jednotlivé herní mechaniky.

### Základní struktura

```json
{
  "metadata": {
    "title": "Název příběhu",
    "author": "Jméno autora",
    "version": "1.0",
    "description": "Krátký popis příběhu",
    "difficulty": "Začátečník/Pokročilý/Expert",
    "world": "Název světa",
    "era": "Období",
    "theme": "Téma příběhu"
  },
  "initialSetup": {
    "introduction": "Úvodní text příběhu, který se zobrazí hráčům na začátku hry",
    "startingLocation": "ID počáteční lokace",
    "availableRaces": ["Člověk", "Elf", "Trpaslík", "Půlčík", "Půlelf", "Gnóm"],
    "availableClasses": ["Bojovník", "Hraničář", "Klerik", "Zloděj", "Kouzelník", "Bard", "Paladin", "Druid"],
    "recommendedLevel": 1,
    "startingTime": "08:00",
    "startingWeather": "clear",
    "startingGold": 50,
    "startingItems": ["basic_backpack", "torch", "waterskin", "rations_3days"]
  },
  "locations": [...],
  "npcs": [...],
  "quests": [...],
  "items": [...],
  "events": [...],
  "aiGuidelines": {...}
}
```

## Herní mechaniky

### 1. Systém lokací a cestování

Každá lokace má následující vlastnosti:

```json
{
  "id": "unique_location_id",
  "name": "Název lokace",
  "description": "Popis lokace",
  "connectedLocations": ["id_lokace_1", "id_lokace_2"],
  "npcs": ["id_npc_1", "id_npc_2"],
  "events": ["id_události_1"],
  "items": ["id_předmětu_1"],
  "travelTime": {
    "id_lokace_1": 5,
    "id_lokace_2": 10
  },
  "reputation": {
    "default": 50,
    "modifiers": {
      "quest_completed_id": 20,
      "helped_npc_id": 5
    }
  },
  "shopkeeper": "id_obchodníka",
  "shop": {
    "type": "general_store",
    "inventory": [
      {"id": "item_id", "price": 10, "quantity": 5}
    ],
    "buyRate": 0.5,
    "sellRate": 1.2
  },
  "restArea": true,
  "restCost": 10,
  "restHealAmount": 5,
  "dangerLevel": 0,
  "weatherEffects": {
    "rain": "Popis lokace za deště",
    "fog": "Popis lokace v mlze",
    "snow": "Popis lokace ve sněhu"
  }
}
```

### 2. Systém NPC a dialogů

Každá NPC postava má následující vlastnosti:

```json
{
  "id": "unique_npc_id",
  "name": "Jméno NPC",
  "description": "Popis NPC",
  "personality": "Popis osobnosti NPC",
  "stats": {
    "level": 5,
    "health": 50,
    "ac": 15,
    "strength": 14,
    "dexterity": 12,
    "constitution": 13,
    "intelligence": 10,
    "wisdom": 8,
    "charisma": 15,
    "attackBonus": 3,
    "damageDice": "1d8+2"
  },
  "faction": "název_frakce",
  "occupation": "povolání",
  "loot": ["id_předmětu_1", "id_předmětu_2"],
  "dialogue": {
    "greeting": "Text pozdravu",
    "topics": {
      "téma_1": "Text odpovědi na téma 1",
      "téma_2": "Text odpovědi na téma 2"
    },
    "questDialogue": {
      "quest_id": {
        "notStarted": "Dialog před začátkem úkolu",
        "inProgress": "Dialog během plnění úkolu",
        "completed": "Dialog po dokončení úkolu"
      }
    }
  },
  "schedule": [
    {"time": "08:00", "location": "id_lokace_1", "activity": "Popis aktivity"},
    {"time": "12:00", "location": "id_lokace_2", "activity": "Popis aktivity"}
  ],
  "relationships": {
    "npc_id_1": "friend",
    "npc_id_2": "enemy"
  },
  "skills": ["skill_id_1", "skill_id_2"],
  "spells": ["spell_id_1", "spell_id_2"]
}
```

### 3. Systém úkolů (quests)

Hra podporuje dva typy úkolů:
- **Hlavní úkoly (Main Quests)**: Tvoří páteř příběhu a jsou nezbytné pro postup ve hře.
- **Vedlejší úkoly (Side Quests)**: Nepovinné úkoly, které rozšiřují herní svět, poskytují dodatečné odměny a mohou hráči pomoci s hlavním příběhem.

Každý úkol má následující vlastnosti:

```json
{
  "id": "unique_quest_id",
  "title": "Název úkolu",
  "description": "Popis úkolu",
  "type": "main", // 'main' pro hlavní úkoly, 'side' pro vedlejší úkoly
  "giver": "id_npc_zadavatele",
  "startLocation": "id_lokace_začátku",
  "prerequisites": {
    "level": 2,
    "quests": ["id_předchozího_úkolu"],
    "reputation": {
      "faction_id": 20
    },
    "items": ["id_požadovaného_předmětu"]
  },
  "objectives": [
    {
      "id": "objective_id_1",
      "description": "Popis cíle",
      "location": "id_lokace",
      "completionCondition": "Podmínka splnění cíle",
      "optional": false
    }
  ],
  "timeLimit": {
    "days": 3,
    "hours": 0
  },
  "rewards": {
    "experience": 100,
    "gold": 50,
    "items": ["id_předmětu_1"],
    "reputation": {
      "faction_id": 10
    },
    "skills": ["id_dovednosti"]
  },
  "consequences": {
    "success": "Popis důsledků úspěchu",
    "failure": "Popis důsledků selhání"
  },
  "followUpQuest": "id_následujícího_úkolu"
}
```

### 4. Systém předmětů a inventáře

Každý předmět má následující vlastnosti:

```json
{
  "id": "unique_item_id",
  "name": "Název předmětu",
  "description": "Popis předmětu",
  "type": "weapon/armor/potion/scroll/key/misc",
  "rarity": "common/uncommon/rare/epic/legendary",
  "value": 100,
  "weight": 2,
  "effects": {
    "damage": "1d8+2",
    "heal": 20,
    "buff": {
      "stat": "strength",
      "amount": 2,
      "duration": 3600
    }
  },
  "requirements": {
    "level": 5,
    "class": ["Bojovník", "Paladin"],
    "strength": 14
  },
  "durability": {
    "current": 100,
    "max": 100
  },
  "equippable": true,
  "slot": "weapon/head/chest/legs/feet/hands/neck/finger",
  "consumable": false,
  "charges": 3,
  "questItem": false,
  "lore": "Příběh předmětu"
}
```

### 5. Systém událostí

Každá událost má následující vlastnosti:

```json
{
  "id": "unique_event_id",
  "name": "Název události",
  "description": "Popis události",
  "trigger": "Podmínka spuštění události",
  "outcomes": [
    {
      "condition": "Podmínka výsledku",
      "result": "Popis výsledku",
      "consequences": {
        "modifyLocation": {
          "location": "id_lokace",
          "changes": "Popis změn"
        },
        "spawnNPC": "id_npc",
        "removeNPC": "id_npc",
        "giveItem": "id_předmětu",
        "removeItem": "id_předmětu",
        "startQuest": "id_úkolu",
        "completeObjective": {
          "quest": "id_úkolu",
          "objective": "id_cíle"
        },
        "modifyReputation": {
          "faction": "id_frakce",
          "amount": 10
        },
        "modifyWeather": "rain",
        "modifyTime": {
          "hours": 2,
          "minutes": 30
        }
      }
    }
  ],
  "repeatable": false,
  "cooldown": {
    "hours": 24
  },
  "priority": 5
}
```

### 6. Systém soubojů

Soubojový systém využívá statistiky NPC a hráčů:

```json
"combatStats": {
  "initiative": 3,
  "attackBonus": 5,
  "damageBonus": 3,
  "criticalHitChance": 5,
  "criticalHitMultiplier": 2,
  "dodgeChance": 10,
  "resistances": {
    "fire": 50,
    "cold": 25,
    "poison": 100
  },
  "vulnerabilities": {
    "lightning": 50
  },
  "specialAttacks": [
    {
      "name": "Mocný úder",
      "description": "Silný útok, který ignoruje část zbroje cíle",
      "damage": "2d8+5",
      "armorPenetration": 5,
      "cooldown": 3
    }
  ],
  "tactics": "aggressive/defensive/ranged/support",
  "retreatThreshold": 25
}
```

### 7. Systém magie a kouzel

Každé kouzlo má následující vlastnosti:

```json
{
  "id": "unique_spell_id",
  "name": "Název kouzla",
  "description": "Popis kouzla",
  "level": 3,
  "school": "evocation/abjuration/conjuration/divination/enchantment/illusion/necromancy/transmutation",
  "castingTime": "1 action/1 bonus action/1 reaction/1 minute/10 minutes/1 hour",
  "range": "self/touch/30 feet/60 feet/120 feet",
  "duration": "instantaneous/1 round/1 minute/10 minutes/1 hour/8 hours/24 hours",
  "components": {
    "verbal": true,
    "somatic": true,
    "material": "Popis materiálních komponent"
  },
  "effects": {
    "damage": {
      "amount": "3d6",
      "type": "fire/cold/lightning/acid/poison/necrotic/radiant/force/psychic"
    },
    "healing": "2d8+4",
    "buff": {
      "stat": "strength/dexterity/constitution/intelligence/wisdom/charisma",
      "amount": 2,
      "duration": 3600
    },
    "condition": "charmed/frightened/paralyzed/poisoned/stunned",
    "areaOfEffect": {
      "type": "sphere/cone/line/cube",
      "size": "10 feet/20 feet/30 feet"
    }
  },
  "savingThrow": {
    "attribute": "strength/dexterity/constitution/intelligence/wisdom/charisma",
    "dc": 15
  },
  "requirements": {
    "class": ["Kouzelník", "Klerik", "Bard"],
    "level": 5
  },
  "ritual": false,
  "concentration": true
}
```

### 8. Systém počasí a času

Systém počasí a času ovlivňuje herní svět:

```json
"timeSystem": {
  "dayLength": 24,
  "startTime": "08:00",
  "timeScale": 1,
  "dayNightCycle": true,
  "calendar": {
    "daysInWeek": 7,
    "daysInMonth": 30,
    "monthsInYear": 12,
    "currentDay": 1,
    "currentMonth": 1,
    "currentYear": 1200,
    "weekdayNames": ["Pondělí", "Úterý", "Středa", "Čtvrtek", "Pátek", "Sobota", "Neděle"],
    "monthNames": ["Leden", "Únor", "Březen", "Duben", "Květen", "Červen", "Červenec", "Srpen", "Září", "Říjen", "Listopad", "Prosinec"]
  }
},
"weatherSystem": {
  "currentWeather": "clear",
  "weatherTypes": ["clear", "cloudy", "rain", "storm", "fog", "snow", "blizzard"],
  "weatherProbabilities": {
    "clear": {
      "clear": 70,
      "cloudy": 20,
      "rain": 5,
      "fog": 5
    },
    "cloudy": {
      "clear": 30,
      "cloudy": 40,
      "rain": 20,
      "fog": 10
    }
  },
  "weatherEffects": {
    "rain": {
      "visibility": -2,
      "movement": -1,
      "rangedAttacks": -2
    },
    "fog": {
      "visibility": -5,
      "stealth": 2
    }
  },
  "seasonalWeather": {
    "spring": {
      "rain": 30,
      "clear": 40,
      "cloudy": 25,
      "fog": 5
    },
    "summer": {
      "clear": 60,
      "cloudy": 20,
      "rain": 15,
      "storm": 5
    }
  }
}
```

### 9. Systém reputace a frakcí

Systém reputace a frakcí ovlivňuje vztahy s NPC:

```json
"factions": [
  {
    "id": "village_folk",
    "name": "Vesničané",
    "description": "Obyčejní lidé žijící ve vesnici",
    "baseAttitude": "neutral",
    "members": ["mayor_gregor", "barkeep_borin", "villager_1"],
    "enemies": ["goblins", "bandits"],
    "allies": ["town_guard"],
    "reputationLevels": {
      "hated": {
        "threshold": -100,
        "effects": {
          "prices": 2.0,
          "dialogue": "hostile",
          "quests": false
        }
      },
      "disliked": {
        "threshold": -50,
        "effects": {
          "prices": 1.5,
          "dialogue": "unfriendly",
          "quests": false
        }
      },
      "neutral": {
        "threshold": 0,
        "effects": {
          "prices": 1.0,
          "dialogue": "neutral",
          "quests": true
        }
      },
      "liked": {
        "threshold": 50,
        "effects": {
          "prices": 0.9,
          "dialogue": "friendly",
          "quests": true
        }
      },
      "revered": {
        "threshold": 100,
        "effects": {
          "prices": 0.75,
          "dialogue": "very_friendly",
          "quests": true
        }
      }
    }
  }
]
```

### 10. Systém dovedností a schopností

Systém dovedností a schopností rozšiřuje možnosti hráčů:

```json
"skills": [
  {
    "id": "lockpicking",
    "name": "Zámečnictví",
    "description": "Schopnost otevírat zámky bez klíče",
    "attribute": "dexterity",
    "difficulty": {
      "easy": 10,
      "medium": 15,
      "hard": 20,
      "very_hard": 25
    },
    "trainable": true,
    "prerequisites": {
      "class": ["Zloděj", "Bard"],
      "level": 1
    }
  }
],
"abilities": [
  {
    "id": "sneak_attack",
    "name": "Zákeřný útok",
    "description": "Způsobuje dodatečné zranění při útoku ze zálohy",
    "effects": {
      "damage": "1d6",
      "conditions": ["surprise", "advantage"]
    },
    "cooldown": 0,
    "usesPerDay": -1,
    "prerequisites": {
      "class": ["Zloděj"],
      "level": 1
    }
  }
]
```

## Pokyny pro vytvoření nového příběhu

1. **Začněte s metadaty a základním nastavením**
   - Definujte název, autora, verzi a popis příběhu
   - Nastavte úvodní text, počáteční lokaci a dostupné rasy a třídy

2. **Vytvořte síť lokací**
   - Začněte s hlavními lokacemi (vesnice, les, jeskyně)
   - Propojte lokace pomocí `connectedLocations`
   - Přidejte detaily jako cestovní čas, nebezpečnost a efekty počasí

3. **Vytvořte NPC postavy**
   - Začněte s klíčovými NPC (zadavatelé úkolů, obchodníci, nepřátelé)
   - Definujte jejich osobnost, statistiky a dialogy
   - Přidejte rozvrhy a vztahy s jinými NPC

4. **Navrhněte úkoly**
   - Vytvořte hlavní úkoly (type: "main"), které tvoří páteř příběhu
   - Přidejte vedlejší úkoly (type: "side") pro rozšíření herního světa a poskytnutí alternativních cest
   - Definujte cíle, odměny a důsledky úkolů
   - Propojte vedlejší úkoly s hlavním příběhem, aby poskytovaly užitečné informace nebo odměny

5. **Přidejte předměty**
   - Vytvořte základní předměty (zbraně, zbroje, lektvary)
   - Přidejte speciální předměty spojené s úkoly
   - Definujte obchody a poklady

6. **Vytvořte události**
   - Navrhněte události, které se spouští při určitých podmínkách
   - Definujte různé výsledky a důsledky událostí
   - Přidejte náhodné události pro zvýšení rozmanitosti

7. **Přidejte pokyny pro AI**
   - Definujte téma příběhu a tón vyprávění
   - Popište hlasy a osobnosti NPC
   - Nastavte pravidla světa a styl soubojů

## Příklad minimálního příběhu

```json
{
  "metadata": {
    "title": "Záhada ztraceného artefaktu",
    "author": "Jan Novák",
    "version": "1.0",
    "description": "Krátké dobrodružství pro začínající dobrodruhy",
    "difficulty": "Začátečník",
    "world": "Zapomenuté říše",
    "era": "Třetí věk",
    "theme": "Pátrání, tajemství"
  },
  "initialSetup": {
    "introduction": "Nacházíte se ve městě Silverfall, kde se proslýchá, že z místního muzea byl ukraden vzácný artefakt. Muzejní kurátor nabízí odměnu za jeho nalezení.",
    "startingLocation": "silverfall_square",
    "availableRaces": ["Člověk", "Elf", "Trpaslík", "Půlčík"],
    "availableClasses": ["Bojovník", "Hraničář", "Klerik", "Zloděj"],
    "recommendedLevel": 1,
    "startingTime": "10:00",
    "startingWeather": "clear",
    "startingGold": 50,
    "startingItems": ["basic_backpack", "torch", "waterskin", "rations_3days"]
  },
  "locations": [
    {
      "id": "silverfall_square",
      "name": "Náměstí Silverfall",
      "description": "Rušné náměstí s kašnou uprostřed. Okolo stojí různé obchody, muzeum a hostinec.",
      "connectedLocations": ["silverfall_museum", "silverfall_inn"],
      "npcs": ["curator_morris"],
      "events": ["notice_poster_event"],
      "items": []
    }
  ],
  "npcs": [
    {
      "id": "curator_morris",
      "name": "Kurátor Morris",
      "description": "Starší muž s brýlemi a upraveným šedým plnovousem.",
      "personality": "Nervózní, pečlivý, vzdělaný.",
      "stats": { "level": 3, "health": 20 },
      "dialogue": {
        "greeting": "Ah, dobrodruh! Možná byste mi mohl pomoci s mým problémem?",
        "topics": {
          "artefakt": "Ano, byl ukraden velmi vzácný artefakt - Amulet Azury. Je to malý stříbrný medailon s modrým kamenem uprostřed."
        }
      }
    }
  ],
  "quests": [
    {
      "id": "find_artifact",
      "title": "Pátrání po amuletu",
      "description": "Najděte ukradený Amulet Azury a vraťte ho kurátorovi.",
      "type": "main", // Hlavní úkol
      "giver": "curator_morris",
      "startLocation": "silverfall_square",
      "objectives": [
        {
          "id": "investigate_museum",
          "description": "Prozkoumejte muzeum pro stopy.",
          "location": "silverfall_museum",
          "completionCondition": "Hráč najde stopy po zloději."
        }
      ],
      "rewards": {
        "experience": 100,
        "gold": 50
      }
    }
  ],
  "items": [
    {
      "id": "azura_amulet",
      "name": "Amulet Azury",
      "description": "Malý stříbrný medailon s zářícím modrým kamenem uprostřed.",
      "type": "jewelry",
      "effects": {
        "buff": {
          "stat": "wisdom",
          "amount": 1
        }
      }
    }
  ],
  "events": [
    {
      "id": "notice_poster_event",
      "name": "Všimnutí si plakátu",
      "description": "Na nástěnce si všimnete plakátu nabízejícího odměnu za nalezení ukradeného artefaktu.",
      "trigger": "Hráč vstoupí na náměstí poprvé.",
      "outcomes": [
        {
          "condition": "true",
          "result": "Plakát informuje o krádeži Amuletu Azury z muzea a nabízí odměnu 50 zlatých za jeho nalezení.",
          "consequences": {}
        }
      ]
    }
  ],
  "aiGuidelines": {
    "storyTheme": "Zaměřte se na tajemství a pátrání. Vytvořte atmosféru napětí a záhady.",
    "characterVoices": "Kurátor Morris mluví formálně a používá odborné výrazy.",
    "pacing": "Začněte pomalu s vyšetřováním, postupně zvyšujte napětí.",
    "worldRules": "Magie je vzácná, ale existuje. Základní pravidla Dračího doupěte platí."
  }
}
```

## Tipy pro vytváření příběhů

1. **Začněte s jednoduchým příběhem** - Nejprve vytvořte menší příběh s několika lokacemi, NPC a úkoly, abyste se seznámili se strukturou.

2. **Vytvořte zajímavé postavy** - NPC by měly mít výrazné osobnosti, motivace a vztahy s ostatními postavami.

3. **Propojte úkoly** - Vytvořte síť hlavních a vedlejších úkolů, které na sebe navazují nebo se vzájemně ovlivňují. Vedlejší úkoly by měly poskytovat užitečné informace nebo odměny, které mohou pomoci s hlavními úkoly.

4. **Nabídněte různé cesty** - Umožněte hráčům řešit problémy různými způsoby (boj, plížení, vyjednávání).

5. **Přidejte tajemství a překvapení** - Skryté lokace, tajné informace a nečekané zvraty udělají příběh zajímavějším.

6. **Testujte svůj příběh** - Projděte si příběh z pohledu hráče a ujistěte se, že všechny mechaniky fungují správně.

7. **Využijte AI pokyny** - Poskytněte AI Dungeon Masterovi jasné pokyny pro tón, styl a pravidla vašeho světa.

## Validace JSON souboru

Před použitím vašeho příběhu ve hře je důležité ověřit, že je JSON soubor validní. Můžete použít online nástroje jako [JSONLint](https://jsonlint.com/) nebo integrované validátory v textových editorech.

Nejčastější chyby v JSON souborech:
- Chybějící nebo přebývající čárky
- Neuzavřené závorky nebo uvozovky
- Použití jednoduchých uvozovek místo dvojitých
- Duplicitní klíče

## Závěr

Vytvoření vlastního příběhu pro Dračí doupě s AI Dungeon Masterem vám umožní vytvořit jedinečný herní zážitek přizpůsobený vašim preferencím. Pomocí výše uvedených pokynů a struktury můžete vytvořit bohatý a interaktivní svět plný dobrodružství, tajemství a výzev pro vaše hráče.

Hodně štěstí při tvorbě vašeho příběhu!
