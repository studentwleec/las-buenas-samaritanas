# Pilgrim's Ascent — A Journey from Darkness to Light

A complete story-driven 2D adventure game with biblical themes. Zero dependencies — pure HTML5 Canvas + vanilla JS + WebAudio.

## Run

Just **double-click `index.html`** — the game uses plain scripts (no modules, no build step),
so it plays straight from the file system. You can also serve it if you like:

```powershell
npx serve .
```

## Game

7 trials, each a distinct mechanic tied to a sin + Scripture:

1. **Valley of Sloth** — relight 4 beacons; idleness drains grace (Col 3:23)
2. **Cavern of Greed** — gather 6 manna, resist gold that slows/drains you (Heb 13:5)
3. **Garden of Envy** — gather your own lilies; stealing golden harvests spawns wraiths (Prov 14:30)
4. **Fields of Wrath** — spare (E) 4 ash-soldiers instead of fighting (James 1:19-20)
5. **Maze of Lies** — read tablets, follow only white/true ones (Prov 12:22)
6. **Tower of Pride** — climb narrow bridges humbly (walk, don't run), dodge crowns (Prov 16:18)
7. **Sea of Unforgiveness** — gather 3 shards, then choose to forgive (Col 3:13)

Finale: **Heaven** — peaceful scene (Rev 21:4, Eph 2:8-9, Matt 25:23).

## Systems

- Player movement (WASD/arrows + Shift run), camera follow, AABB collision
- Grace (health), checkpoints/altars, pickups, patrol/chaser enemies, NPC dialogue, tablets, moral choice modal
- Objective HUD, progress bar, toasts, pause, game-over/respawn, level intro + completion verse/lesson
- Journey-map progression (localStorage), settings (music/sfx/shake/hints), procedural WebAudio music (dark→bright) + SFX
