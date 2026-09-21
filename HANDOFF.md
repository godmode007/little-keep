# Handoff — Little Keep Studio (Sprint 1)

Paste this to **Grok Build** (or any new chat) and continue. Do not reopen the hiring debate.

```
You are Gameplay Coder + remaining Producer for Little Keep.

Read HANDOFF.md, GAME_DESIGN.md, and
~/.cursor/plugins/local/little-keep-studio/memory/sprint-brief.md
then implement Home as a playing field.

Expo 57 only: https://docs.expo.dev/versions/v57.0.0/
Tone: D&D for mixed ages 6–14 (not toddlers). Party = human knight, wood elf ranger, fairy wizard, high elf cleric. Baddies = trolls/ogres you SHOO, never slay.
```

## What already shipped (do not redo)

| Seat | Status |
|------|--------|
| **1 Producer** | Brief locked. You (this chat) were chief of staff. |
| **2 Game Designer** | Field loop + tap map written in `GAME_DESIGN.md` (Playing field section). |
| **3 Systems** | **No economy.ts changes.** Start bags already let a player collect → upgrade Farm/Hut in ~15s. Shared `collect()` + 4s cooldown — both Farm and Hut sparkle together this sprint. |
| **4 Art** | First Imagine pass exists (see assets). **Mira/Blink/Nana still look human** — regen as elf/fairy before wiring if you have image budget. Canva style-board candidates exist (not committed). |
| **5 Tech Architect** | Done — see `## Tech constraints` in `GAME_DESIGN.md`. RN `Image` (not `expo-image`), static field + % Pressables, one Modal sheet, ≤12 PNGs, `little-keep-save-v1` unchanged, shared `collect()`. |
| **6 Gameplay Coder** | **Not started.** This is your job. |
| **7 QA** | Do not start until Home is a field. |
| **8 Live Ops** | Not hired. |

Hired plugin (agents/skills/rules): `~/.cursor/plugins/local/little-keep-studio/`

## Tone lock (user, last messages)

- Dungeons & Dragons fantasy, **multi-age**, **not toddlers**
- Fairies and elves in the party
- Baddies: trolls, ogres, lumpy mischief
- Kingshot Play Store is **spatial/visual reference only**:
  https://play.google.com/store/apps/details?id=com.run.tower.defense&hl=en_ZA

## Party + quests (catalog already updated)

- Pip the Knight (human) · Mira the Ranger (wood elf) · Blink the Fairy · Nana the Cleric (high elf)
- Garden Trolls · Sleepy Ogre (was goblins / sunny woods)
- IDs unchanged: `pip` `mira` `blink` `nana` · `garden` `woods` — **do not rename IDs** (save key `little-keep-save-v1`)

## Next implementation (Coder)

1. Copy Imagine PNGs into `assets/game/` if they are still only under
   `/Users/user/.cursor/projects/Users-user-Projects-little-keep/assets/`
   (`field.png`, `pip.png`, `mira.png`, `blink.png`, `nana.png`).
2. Replace `app/(tabs)/home.tsx` card dashboard with the field (follow **Tech constraints** in `GAME_DESIGN.md`):
   - `field.png` with `resizeMode: 'contain'` (letterbox meadow — never `cover`)
   - Nodes at the % positions in the Playing field section; buildings ≥56pt, heroes/flag ≥48pt
   - Farm/Hut sparkle → `collect()` (shared cooldown — both sparkles sync; show both floats)
   - Castle / Workshop → upgrade/build/locked sheet (one Modal / absolute panel only)
   - Recruited heroes on the courtyard; Pip always
   - Gate flag → next quest sheet → `doQuest(id)`
3. Keep Build / Friends / Quests tabs working. Wire existing `useKidsStore` only.
4. `npm run typecheck`
5. Verify on web (`npx expo start` → `w`) if you cannot use a phone.

## Must not do

- New engine, IAP, energy, PvP, chat, grim combat, toddler baby-talk
- Tower-defense wave manager, tile/Skia world, `expo-image`, second sheet
- Changing save key or hero/quest IDs
- Splitting `collect()` per-building this sprint (Systems + Tech both said no)

## Canva (optional)

Job `a3e242f6-2573-4e1f-ba02-750386e7dd88` produced style-board candidates. Pick one with `create-design-from-candidate` only if you need a brand poster. Not required for the playable field.
