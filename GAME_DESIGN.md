# Little Keep — Kids Game Design

A **simple single-player** kingdom game: **Dungeons & Dragons for a mixed-age table**. Same party-and-quest fantasy as Dragonhold, but shorter, kinder, and playable by a younger sibling and an older one in the same session.

Inspired by Kingshot’s fun loop (build → gather → recruit → quest) without dark themes, PvP, or complex systems. Dragonhold stays the deeper D&D strategy project.

## Pitch

You are the young ruler of **Little Keep**. Grow the castle, gather food and wood, recruit a party of elves, a fairy, and a knight, then walk out the gate to shoo trolls and ogres — never slay them — and earn stars.

## Who it’s for

- **Multi-age**, roughly **6–14** (not toddlers, not a teen grimdark game)
- A 7-year-old and a 12-year-old should both get the fantasy
- Short sessions (5–15 minutes)
- One device, offline, no chat / no strangers
- Copy: clear and adventurous. No baby-talk (“yummy”), no gore, no slaughter

## Simplified Kingshot loop

| Kingshot idea | Little Keep |
|---------------|-------------|
| Town building | Castle + a few workshops |
| Many resources | Food, Wood, Stars |
| Hero roster | 4 friendly heroes |
| Troop training | Skip — heroes do the quests |
| Research / laws | Skip |
| Hard combat math | Star check + simple power compare |
| Alliances / PvP | None |

## Core loop (map crawler · gather · base · horde)

A **3×3** overworld (9 tiles). Center tile is **camp**. The eight around it are tall **pine forest**. Feel is Command & Conquer / Dune for mixed-age: start tiny, harvest, expand, hold the line.

1. **Camp** — a small hut and four **gold squares** on the grass.  
2. **Gather** — walk into pines to chop. Wood stays **on you**. Outer tiles hide **gold mines** that pour coins faster than hordes.  
3. **Horde** — shoo trolls and they **turn into coins on the grass**. Walk over them. Wood and coins **stack on your back** like a chimney; when the pile is full you must dump before picking more.  
4. **Deposit** — dump wood and coins at the **storehouse**. Then **tap a building → Upgrade** to spend from the store. Unbought pads never take loot. Walking past does not vacuum.  
5. **Keep rank** — find and plant **all four towers**, then the wood wall comes up, then the hut can grow. After the hut grows, the towers can be upgraded again. After hut 2 the workshop pad opens; after hut 3 a mill pad opens **inside the west wall**. Camp buildings sit inside the ring so hordes must break a wall first.  
6. **Towers** — each gold square is a security tower. Rank them one at a time up to the hut’s current level. When all four match, the wall ranks wood → stone → brick → cement.  
7. **Defend** — walls block hordes. Buildings, towers, and each wall side have hit points. Trolls bash until a side gives way. Dump wood to patch. Each campaign chapter sends a set number of hordes.  
8. Swap Pip / Mira / Blink / Nana from the portrait strip.

## Party (MVP)

Classic tabletop roles, kinder faces:

1. **Pip the Knight** — human fighter, brave and sturdy  
2. **Mira the Ranger** — wood elf, quick and clever  
3. **Blink the Fairy** — fairy wizard, sparkly helper  
4. **Nana the Cleric** — high elf healer, kind and prepared  

## Quests (gentle)

Baddies are **trolls, ogres, and other lumpy mischief** — shoo, trick, or send home. No killing.

- Help the baker find flour  
- Shoo garden **trolls** off the veggies  
- Rescue a lost kitten  
- Shoo a sleepy **ogre** from the sunny woods path  
- Celebrate the Star Fair  

## Visual direction

- Soft sky blue → meadow green → warm gold accents  
- Big tap targets, short sentences, cheerful motion  
- Display: Fredoka · Body: Nunito  
- Avoid dark/grim UI, purple-glow defaults, and dense dashboards  

## Playing field (Sprint 1 — Producer lock)

Home is a **keep you look down on**, not a dashboard. Spatial reference is Kingshot’s town screens ([Play Store](https://play.google.com/store/apps/details?id=com.run.tower.defense&hl=en_ZA)) — steal the 3/4 field, dirt paths, chunky buildings, and people standing on the grass. Do **not** steal PvP, IAP, gacha, grim war, or a tower-defense wave manager.

**This Sprint 1 page replaces Home’s current card dashboard** (title, “Collect Supplies” button, Star Goals list). Those lists stay on Build / Friends / Quests tabs as backups. The field is the play.

### Loop (MDA)

**Mechanics** are one-thumb taps on named things on the grass: sparkle-collect on Farm and Forest Hut, a bottom sheet to grow Castle or the Workshop slot, misty woods that spend wood to clear and reveal the next watch tower, a friend sheet on each hero who is standing there, a quest sheet on the gate flag. **Dynamics** are a 30–90 second “see sparkle → poke it → numbers jump → poke the castle, the fog, or the flag” cycle a kid can drop and resume. **Aesthetics** are a small D&D session on the lawn — *my keep, my party, a troll to shoo, woods to clear* — not toddler toys, not grim war, not a menu to clear.

### Portrait field layout

Phone portrait. The keep is a **world larger than the screen** (Kingshot town map, not a poster). One-finger **drag to pan**. Tap a friend to pick them, tap revealed grass to **walk**. Twin-stick and pinch-zoom stay out. The playable field sits **under the resource HUD** and **above the tab bar**. Positions are percent of that world (0,0 = top-left).

| Tap target | Approx. position | What you see |
|------------|------------------|--------------|
| **Resource HUD** | Top chrome (not in the grass) | Food · Wood · Stars. Read-only this sprint. |
| **Castle** | Center-back, **x 50% · y 22%** | Biggest building. Dirt paths leave its doors. |
| **Farm** | Left-mid, **x 22% · y 48%** | Fields + barn. Sparkles when food is ready. |
| **Forest Hut** | Right-mid, **x 78% · y 46%** | Woodpile hut. Sparkles when wood is ready. |
| **Courtyard** | In front of the castle, **y 54–68%** | Recruited heroes stand on the grass here. |
| **Pip** | Courtyard left, **x 38% · y 58%** | Always on the field (starts recruited). |
| **Mira** | Courtyard center, **x 50% · y 62%** | Only after she joins. |
| **Blink** | Courtyard right, **x 62% · y 58%** | Only after they join. |
| **Nana** | Courtyard front, **x 50% · y 68%** | Only after she joins. |
| **Workshop slot** | Lower-right, **x 78% · y 74%** | Dashed outline until Castle 2, then a real shop. |
| **Near woods** | Left-back trees, **x 14% · y 30%** | Fog until cleared. Then Watch Tower 1. |
| **Deeper woods** | Right-back pines, **x 88% · y 26%** | Next fog. Clears only after the near woods. Then Watch Tower 2. |
| **Quest flag** | Gate, bottom path, **x 50% · y 88%** | Flag at the dirt-road exit. |

Dirt paths: castle doors down the middle to the gate; a fork left to Farm; a fork right to Hut (and on to the Workshop slot). Sky band fills roughly the top **18%** behind the castle. Meadow fills the rest. Every target is **≥ 48pt**.

### What a tap does

One tap. If a sheet opens, it is a **bottom sheet** with one kid sentence, one primary button, and a big Close. Tap empty grass does nothing.

| Target | Ready / state | Tap does |
|--------|---------------|----------|
| **Castle** | Always | Opens **upgrade sheet**: name, level, “Make the castle bigger,” cost, Upgrade. Does **not** collect. |
| **Farm** | Sparkling | Collects **food**. Floating `+N` rises off the barn. HUD food ticks up. Sparkle clears until the short wait is over. |
| **Farm** | Not sparkling | Opens **farm sheet**: “Food is growing.” Upgrade if they want; no collect. Soft “wait a bit” if they mash. |
| **Forest Hut** | Sparkling | Collects **wood**. Floating `+N` off the hut. Same wait rules as Farm (each building has its own sparkle). |
| **Forest Hut** | Not sparkling | Opens **hut sheet**: “Wood is stacking.” Upgrade or wait. |
| **Workshop slot** | Dashed (Castle &lt; 2) | Opens a **locked sheet**: “Need a bigger castle first.” No build. |
| **Workshop slot** | Empty, Castle 2+ | Opens **build sheet**: “Build a Workshop.” One Build button. |
| **Workshop slot** | Built | Opens **upgrade sheet** (cheaper builds). Does **not** sparkle or collect. |
| **Pip** | Always on field | Opens **friend sheet**: Pip the Knight (human). Already in the party — no recruit button. |
| **Mira** | On field only if recruited | Friend sheet (wood elf ranger). Recruit still lives on the Friends tab this sprint. |
| **Blink** | On field only if recruited | Friend sheet (fairy wizard). |
| **Nana** | On field only if recruited | Friend sheet (high elf cleric). |
| **Near woods** | Fogged (lookout 0) | Opens **woods sheet**: “These woods hide the next watch tower.” Spend wood → **Clear the woods**. Fog lifts; Watch Tower 1 stands in the clearing. |
| **Deeper woods** | Fogged, near woods not cleared | Locked sheet: “Clear the nearer woods first.” No skip. |
| **Deeper woods** | Fogged, lookout 1 | Woods sheet for the next tower. Clear → Watch Tower 2. |
| **Watch Tower** | After a clear | Flavor sheet: “The watch tower looks over the trees.” No combat, no waves. |
| **Quest flag** | Always | Opens **quest sheet** for the next undone, unlocked quest (name, blurb, power need, Go Adventure). Done quests are not a pile on the grass. |

Collect is **per building**, not one global “Collect Supplies” button. Keep the existing short wait (~4s) so a 30–90s session is a few sparkle-taps, not a slot machine.

### First-run (20 seconds, mixed ages)

No speech dump, no toddler voiceover. After they give a name, they **land on the field**.

1. **0–5s** — Sky, grass, a real keep. This is a place, not a list.  
2. **5–10s** — Pip the Knight is on the lawn. You have a party of one.  
3. **10–20s** — Farm is sparkling. They poke it. `+food` floats. The HUD ticks.

That is the tutorial. Older kids will tap the gate flag or the misty woods next; younger kids can stay on sparkles. If they tap Pip first, the friend sheet is a hello, not a fail. Clearing woods is optional in the first minute — start bags already have enough wood for the first tower. Farm sparkles on landing (`lastCollectAt` starts at 0); the 4s wait begins after the first collect.

### First level (playable slice)

**Name:** Little Keep Wakes. **Length:** about 90 seconds. **Win:** the baker quest is done and a watch tower stands in the near woods.

| Beat | What the player does | Passes if |
|------|----------------------|-----------|
| 1 Title | Type a ruler name, Start Playing | Lands on the field, not a dashboard |
| 2 Keep | Look | Castle, farm, hut, Pip, two mist patches, gate flag |
| 3 Collect | Tap a sparkling Farm or Hut | HUD ticks; `+food` and `+wood` both float |
| 4 Hello | Tap Pip | Friend sheet, no recruit button |
| 5 Fog | Tap deeper woods first | Locked: clear the nearer woods first |
| 6 Tower | Tap near woods → Clear the woods (18 wood) | Fog lifts; Watch Tower 1 on the grass |
| 7 Gate | Tap the flag → Help the Baker → Go Adventure | +2 stars. Pip’s 12 power is enough |

**Level 1 does not include** Mira, Castle 2, Workshop, Garden Trolls (needs 18 power), or the second watch tower. Those are the next-session hook: tap the flag again and the trolls ask for more friends.

Start bags: 40 food · 30 wood · 0 stars. Baker costs 5 food. First tower costs 18 wood. Both fit the opening bag.

### Campaign (levels 1–16) — Producer lock

Same portrait field. A **level** is the next 60–90s named tap until a win is visible on the grass. Current level is **derived** from `questsDone` / `recruited` / `buildingLevels` — not a save field. After 16 the keep stays yours; no season, no second map.

| n | name | win |
|---|------|-----|
| 1 | Little Keep Wakes | Baker + Watch Tower 1 |
| 2 | Ranger at the Gate | Mira recruited (courtyard pad) |
| 3 | Trolls in the Patch | Garden Trolls |
| 4 | Stones Go Higher | Castle 2 |
| 5 | Shop on the Path | Workshop built |
| 6 | Whiskers in the Weeds | Lost Kitten |
| 7 | Fairy on the Lawn | Blink recruited |
| 8 | Watch in the Pines | Watch Tower 2 |
| 9 | Higher Halls | Castle 3 |
| 10 | Ogre on the Path | Sleepy Ogre |
| 11 | Party of Four | Nana recruited (party complete) |
| 12 | Banner Keep | Castle 4 |
| 13 | Misty Brook | Brook mist → wishing well (lookout 3) |
| 14 | Crowned Keep | Castle 5 |
| 15 | Lanterns Out | Lantern Trolls (new quest, shoo not slay) |
| 16 | Star Fair | Star Fair capstone |

Empty courtyard pads (dashed) for unrecruited Mira / Blink / Nana; field sheets can recruit. Fog nodes come from `FOG_NODES` (3 patches, 4 max). Star Fair unlocks at Castle 5.

Data: `src/data/campaign.ts`. Progress: `src/game/progress.ts`.

### Not on the field this sprint

- Home’s current dashboard: hero title, power/goals line, **Collect Supplies** button, **Star Goals** checklist, “Last:” hint.  
- Pinch-zoom, pan, drag-to-walk, twin-stick, minimap.  
- Enemies, walls, waves, a tower-defense manager, grim night, combat VFX.  
- Unrecruited Mira / Blink / Nana wandering the grass (Friends tab until they join).  
- Extra buildings beyond Watch Tower, empty hero pads, a second flag.  
- Twin-stick, pinch-zoom, PvP world map, troop marches. Kid fog is regional mist on **this** keep, lifted by walking to it and clearing.  
- Energy, ads, IAP, speed-ups, hour-long upgrade timers.  
- Chat, other players, alliances.  
- Live Ops badges, ASO popups, cloud accounts.

| Steal | Soften | Refuse |
|-------|--------|--------|
| Isometric keep field | Gentle quests, not slaughter | PvP / alliances / chat |
| Tappable buildings + empty slots | Heroes are friends | IAP / energy / loot boxes |
| Characters on the map | Shoo trolls and ogres | Hours-long timers |
| Top resource HUD | Short kid copy | New engine / cloud accounts |  

## Tech constraints

Stack stays **Expo SDK 57** + React Native 0.86 + Expo Router + Zustand + AsyncStorage. Docs: https://docs.expo.dev/versions/v57.0.0/. Mid-range Android, iOS, and web (`w`) must still start. New Architecture is already on (`newArchEnabled: true`) — do not add native modules this sprint.

### Render approach — `react-native` `Image`, not `expo-image`

Use RN `Image` with bundled `require()` for `assets/game/*.png`.

`expo-image` exists in the [v57 Image docs](https://docs.expo.dev/versions/v57.0.0/sdk/image/) for **remote** load, disk/memory cache, BlurHash, and source transitions. It is **not** in `package.json` today and needs `npx expo install expo-image` plus a native rebuild. A static local map plus a handful of sprites does not need that. Do not add it.

Field recipe:

1. `View` (flex, under `TopBar`, above the tab bar) as the field box.
2. One `Image` (`field.png`) with `StyleSheet.absoluteFill` and **`resizeMode: 'contain'`** so Designer’s percent positions stay on the painted buildings. Letterbox with meadow (`#6FBF73` / `#B8E0A8`). Do **not** `cover`-crop — percents will drift.
3. Absolutely positioned `Pressable` nodes (`left` / `top` as `%` of that same box, `transform: [{ translateX: -half }, { translateY: -half }]` so the `%` is the center).
4. **One** bottom sheet: local `useState` + RN `Modal` or an absolute panel. No `@gorhom/bottom-sheet`, no Expo UI.
5. Floating `+N` is a short-lived `Text`, not particles.

No `ScrollView` on the field. No pan, pinch, or drag.

### Node hit-target sizes

Kids skill and the field spec: **≥ 48pt**. Existing `BigButton` is 52.

| Node | Min hit box | Notes |
|------|-------------|--------|
| Castle, Farm, Hut, Workshop | **56×56** (prefer 64×64) | Larger than the sprite if the art is small |
| Pip, Mira, Blink, Nana | **48×48** | Invisible slop is fine |
| Quest flag | **48×48** | Emoji/`Text` is OK if Art does not ship a PNG |
| Sheet primary + Close | **52** min height | Match `BigButton` |

If hit boxes overlap, the **building** wins over a hero. Tap empty grass: no-op.

### Asset budget

**Cap: 12 local game PNGs** in `assets/game/`. Sprint 1 files: `field`, 4 heroes, `lookout` (shared by both watch towers). Fog is a View overlay, not a PNG. Flag stays emoji. No per-level building variants, no atlas, no Lottie, no remote URLs.

- `field.png`: 3:4, **≤ ~1.5 MB**
- Sprites: **≤ ~200 KB** each
- One resolution per file (no 1x/2x/3x triples)
- HUD stays emoji/`TopBar` text — no extra icon PNGs

### Save compatibility — `little-keep-save-v1`

`kidsStore` persist name stays `'little-keep-save-v1'`. No `version`, no `migrate`, no new persist key. `lookout` is a new key on the existing `buildingLevels` record (0–2). Persist `merge` fills it with `0` on old saves. No other new `KidsState` fields.

Wire the field to the **existing** API only:

- `collect()` — Farm **and** Hut sparkles share **one** `lastCollectAt` (4s). Do not add `collectFarm` / `collectHut`. Both nodes sparkle together; one tap runs the current collect (food **and** wood). Show both `+food` / `+wood` floats. Per-building collect is a later store change, not this sprint.
- `upgrade(id)` — Castle / Farm / Hut / Workshop sheets. Workshop 0→1 **is** “build.” Lookout 0→1 and 1→2 **are** “clear the woods.”
- `recruit` / `doQuest` — Friends and Quests tabs still own those buttons; field hero taps are friend sheets; flag filters `QUESTS` and calls `doQuest(id)`.
- Sheet open + selected node = **React state only**. Never persist them.

Do not rename `BuildingId` / `HeroId` / `QuestId` / `Resources`.

### Gameplay Coder must not add this sprint

- Tile / hex / isometric engine, Skia canvas world, SVG-as-the-map
- Unity, Godot, or any engine rewrite
- `expo-image`, Expo UI, analytics, auth, chat, cloud accounts
- Pinch-zoom, map pan, drag-to-walk, twin-stick
- Particle soup or looping Reanimated field effects
- A second sheet or stacked modals
- New Zustand actions or a save migration
- Per-level art swaps
- Replacing Build / Friends / Quests tabs (they stay list backups)
- Economy / cooldown edits (Systems owns numbers)
- Gesture-handler on the field beyond `Pressable` tap

Home becomes the field. Do not invent a second economy.
