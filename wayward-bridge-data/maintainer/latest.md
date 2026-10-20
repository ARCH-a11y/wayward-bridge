# Wayward Bridge maintainer report

- Game version: 2026-10-04 (index.html c6f38cd4b6)
- Bridge: 2.0
- Made: 2026-10-20T17:02:42.393Z
- Result: everything the mod depends on was found

## Hooks

- ✓ **Prompt parts hook** — the picture function's return {key, prompt, negativePrompt, parts}
- ✓ **Game store hook (renames, custom heroine picker test helpers)** — const X=create()(persist((e,t)=>({state:
- ✓ **Custom heroines in the picker** — heroine picker with onOpenBuilder and the ",!1,!1]" placeholders

## Prompt tables

- ✓ **scenes**
- ✓ **tasks**
- ✓ **looks**
- ✓ **reactions**
- ✓ **expressions**
- ✓ **moodScene**
- ✓ **moodWork**
- ✓ **roomDetail**
- ✓ **roomShort**
- ✓ **heroines**
- ✓ **outfits**
- ✓ **patrons**
- ✓ **quality**
- ✓ **sexScenes**
- ✓ **bedScenes**
- ✓ **patronMoods**
- ✓ **roomCode**
- ✓ **baseNegative**
- ✓ **negativeExtras**
- ✓ **heroine list** — elena, mara, pippa
- ✓ **patron portrait quality text**
- ✓ **patron portrait negative**
- ✓ **patron looks** — 12 looks

## Negatives

- ✓ **base negative** — worst quality, low quality, blurry, bad anatomy, extra limbs, deformed, text, watermark, signature, ugly, duplicate, mor
- ✓ **situational extras all labelled** — 29 pieces

## Prompt parts

- ✓ **all part labels known** — Quality, Base, Gender, Scene, Group, Gaze, Focus, Narration, Outfit, Reaction, FlashAnatomy, Pose, Task, Intoxication, Arousal, Mood, Room, Aftermath, Exposure

## Game API

- ✓ **every path the game calls is answered** — /api/image/health, /api/pack, /api/video/check, /api/image-hit, /api/image/generate, /api/image/status/, /api/image/cancel, /api/video/generate, /api/video/status/, /api/review/mark, /api/batch/enqueue, /api/batch/status, /api/batch/, /api/wife-image-counts

## Page anchors

- ✓ **View image fullscreen** — button title: finds the game's picture box (picture buttons, progress, hover)
- ✓ **Mark this image as good** — thumbs up → "save current scene"
- ✓ **Mark as bad and regenerate** — thumbs down → "delete current scene" (title prefix)
- ✓ **Add another variant of this state** — + → "cycle scene variants" (title prefix)
- ✓ **Turn this image into a video** — video button → GIF
- ✓ **Video already exists for this image** — video button (second title) → GIF
- ✓ **Copy prompt** — picture details panel: replaced with the prompt the bridge used
- ✓ **What's wrong with this image?** — regenerate dialog the bridge answers silently
- ✓ **Just regenerate** — button in that dialog
- ✓ **The picture from this moment** — full-screen moment picture (alt text)
- ✓ **There is no picture for this moment.** — empty moment picture
- ✓ **bg-black/85** — class of the picture details panel
- ✓ **bg-black/70** — class of the regenerate dialog backdrop
- ✓ **bg-black/90** — class of the full-screen overlay
- ✓ **absolute top-2 right-2** — class of the game's picture buttons (hidden until hover)
- ✓ **absolute bottom-2 left-2** — class of the game's variant arrows (hidden until hover)
- ✓ **Previous image variant** — variant arrows (aria-label)
- ✓ **elena-image-variants-v1** — localStorage key: scene variants ("cycle scene variants")
- ✓ **wayward-custom-wives** — localStorage key: heroines from the builder
- ✓ **name:"tavern-game"** — localStorage key of the game save: the menu reads the patrons in the tavern from it
- ✓ **namedPatronNames** — game save field: named patrons (Scenes & NPCs > Named patrons)
- ✓ **primaryCharacterId** — game save field: which character is the heroine in play (menu follows her)
- ✓ **archetypeId:** — game save field: the heroine's base character (which heroine's settings are used)
- ✓ **generatedArchetype** — game save field: builder / random heroine data (her id in picture keys)
- ✓ **traitsAtGeneration** — game save field: rolled when a game starts; tells two playthroughs of the same heroine apart
- ✓ **growthRates** — game save field: rolled when a game starts; tells two playthroughs of the same heroine apart
- ✓ **startGameWithWifeArchetype:** — game function: starting a new game (the mod gives it a playthrough id)
- ✓ **startGameWithPicks:** — game function: starting a new game with picks (the mod gives it a playthrough id)
- ✓ **newGame:** — game function: quick new game (the mod gives it a playthrough id)
- ✓ **Build Your Wife** — builder title (renamed to "Build Your Own Heroine")
- ✓ **imageKey** — React prop the picture buttons read the picture key from
- ✓ **joinedPatronIds** — patron scene state used in the negative prompt

## Game changelog (latest entry)

```
## [2026-10-04]

### Changed

- Errands, the brewing bench and the night pass by waiting (1 / 5 / 15 minutes, Enter until done). Anything that needs you stops the wait.
- Dancing pays by how much she shows, at most half his purse, and tires her.
- A dirty taproom lowers how well men feel served, sends some back out the door, and wears on her mood.
- Her wit no longer grows from catching tricks.
- At night in the lodger's room, the pictures show his bed.
- When she is half bare or naked in the room, men now stare and remark on it, not only try more with her.

### New

- A wife on the "strays with your blessing" side asks you before she does anything, one step at a time. Yes lets her; no holds.
- Encyclopedia: the "?" button explains every number in the game.
- "Don't leave me alone": once men bother her while you are out, leaving during service asks her first.
- She cleans up fast after another man when she is hiding it.
- Her breasts have their own soreness.
- Enter, or 1 / 2 / 3, presses a lone "Continue".
- Patreon link on the title screen and in the Support panel.

### Fixed

- Browser translation (Chrome, Edge) works again.
- What you expect of her no longer wears off on its own after a couple of weeks.
- Resentment no longer rises from things you could not see.
- She no longer starts what she would refuse if asked.
- She no longer gets stuck in the kitchen, bathhouse, guest room or lodger's room.
- Passing out no longer ends the night; you carry her up.
- Proximity mode shows your own finds and results.
- Patrons outside the taproom no longer ask for drinks.
- "You watched and did nothing" no longer fires when you walked in on her.
- Lodger fixes: the back room and bookings. Sent up to look in, she now rarely ends up in his bed.
- A relative and a patron no longer share a name.
- Hides are a trade good, not a pot ingredient.
- Custom wives keep their look in scene pictures.
- Small wording fixes.
```
