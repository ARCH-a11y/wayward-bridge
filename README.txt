SETTINGS UI MOD 2.0 (Wayward Bridge)
======================================
Draws the game's pictures with your own ComfyUI and adds a settings menu inside the
game ("Pippa" button, bottom right) for every prompt it uses.

INSTALL
  1. Put wayward-bridge.js and Start-Wayward-Bridge.bat in the game folder, next to
     the game's index.html. (Needs Node.js 18 or newer.)
  2. Double-click Start-Wayward-Bridge.bat.
  3. Open http://127.0.0.1:8788/ in your browser and play.

  No HTML is shipped with the mod. The bridge reads the game's own index.html and adds
  the menu while sending the page to your browser; the file on disk is never changed.
  It also finds the folder if the bridge sits one folder above the game, or asks you
  for the game folder the first time (and remembers it).

YOUR OWN HEROINES ("Build your own heroine")
  The game contains a full heroine builder (name, age, background, backstory, face,
  looks, tendencies, portrait) but its heroine picker does not show it. The mod adds
  "+ Build your own heroine" and your own heroines to the game's picker (New game),
  with Edit and Delete, as if the option were part of the game. What she is to you
  (wife now; sweetheart, step-sister, friend, employee once the game opens them) is the
  game's "Who is she to you?" choice above the list, so your heroines work with every
  one of them. They are kept by the game in this browser. The settings menu lists them
  like the other heroines: her game default description is what the game sends for her
  (it shows once the game has drawn her), and every per-heroine setting, saved picture
  folder and add-on works for her.

GAME UPDATES
  Replace the game's files (index.html included) as usual and reload the page — no
  restart needed. The bridge reads the new index.html, including its new default
  prompts. The mod itself only needs an update if the game changes how it builds its
  prompts; if that happens the game still runs, and Config > Diagnostics shows what
  the bridge could not find.

  Compatibility report (for whoever updates the mod; not shown in the game): each time
  a new index.html is loaded, the bridge checks everything the mod relies on (its
  hooks, the prompt tables, the prompt part names, the game's image API, the button
  texts and storage keys the menu looks for) and writes
  wayward-bridge-data\maintainer\latest.md (plus one file per game version and the
  extracted prompt tables as JSON). Each item is ✓ or ✗; for every ✗ it shows the
  game code around where the thing used to be, and it lists every default prompt the
  update changed. The console prints one line if something is missing. To check a
  game version without starting the bridge (exit code 1 if anything is missing):
    node wayward-bridge.js --check-game "C:\new\Wayward" --against "C:\old\Wayward" --out report.md
  While the bridge runs, the same report is at
  http://127.0.0.1:8788/bridge/api/maintainer/report (add ?format=json for JSON).

UPDATING THE BRIDGE
  Replace wayward-bridge.js. Your settings (wayward-bridge-data\) are kept.

EDITING THE BRIDGE
  wayward-bridge.js is plain, readable JavaScript, like the old mod's server.js. The
  in-game menu is the function "wbMenu" near the end of the file (search for
  "MENU: function"). Save, restart the .bat and reload the page.

USING THE MENU
  * Edits are drafts (orange border) until you press "Save & Apply to game".
    After saving, the picture the game is showing is drawn again with the new settings
    and replaces it in the game; it is also listed in the Prompt inspector (untick
    "redraw current picture (in game & Prompt inspector)" to skip that). Closing with
    unsaved changes asks.
  * "Restore default" / "Restore all" buttons on every section.
  * The green bar under the tabs shows what the game shows right now (scene, outfit,
    exposure, mood, room). Click one to jump to its prompt. "in game" marks it in lists.
  * Prompt boxes suggest Danbooru tags while you type: Up/Down to choose,
    Enter or Tab to insert, Esc to close — like an IME candidate list. Only the
    letters you typed are replaced; the rest of the prompt is left alone.
    About 81,000 Danbooru tags (general, copyright, character; no artists or meta
    tags). Other spellings work too: typing an alias shows "alias -> tag" and inserts
    the real tag.
  * Config > Prompt boxes: "Backspace / Delete remove whole tags" (off by default).
    The tag you are typing right now (suggestions open or not) is deleted letter by
    letter as usual.
  * Ctrl+Up / Ctrl+Down on a tag raises / lowers its weight: blush -> (blush:1.1)
    -> (blush:1.2); back at 1.0 the brackets go away.
  * Long dropdowns (samplers, LoRAs, ...) scroll and are searchable.
  * Search prompts (top of the menu): type a few letters to find every prompt that
    contains them; Enter or a click jumps there.
  * Undo / redo: "undo" next to the change count (or Ctrl+Z outside a text box) takes
    back your edits one step at a time, as far back as your last save; "redo" (Ctrl+Y
    or Ctrl+Shift+Z) puts them back in order. Typing in one box without a pause of
    1.5 seconds counts as one step.
    Config > Undo last save undoes a whole save.
  * Saved for the heroine selected at the top only: her prompts, the model family,
    models, sampler, LoRAs, turbo and caches, and patron portraits
    (named patrons and their faces too). Your settings from before a heroine had her own
    are her starting point. Shared by all heroines: picture sizes, quality tags, the
    hi-res fix, face fix, GIF settings, Config, tag rules set to "All heroines" and
    (when ticked) game negatives.
  * Renaming a heroine (Character prompts) renames her in the running game too.

PROMPT INSPECTOR
  * Drawing queue (top of the inspector; "⏳ drawing 1 · 2 waiting" in the green bar
    opens it): what ComfyUI is drawing and what is waiting, with Cancel buttons. The
    game's picture shows a thin progress bar and "step 12 / 24" while it is drawn
    (an estimate from recent drawings when ComfyUI does not report steps).
  * "Compare models…" draws the picture again with the same seed but another
    checkpoint / UNET or LoRA strength (or no LoRA) and shows both side by side.
    Your settings are not changed.
  * "Compare with…" shows two pictures side by side with the tags that differ
    (or "Compare with the previous one of this scene", e.g. before / after Same seed).
  * Click any picture in the gallery to see it and how its prompt was built,
    category by category. "Use this scene" puts that picture in the game's picture
    box and keeps it for its scene. "Preview with current settings" shows the prompt
    the picture would get now, unsaved changes included, with the changes marked.
  * "Changed by" names who changed a part: "Your settings — <heroine> only",
    "Your settings — all heroines", "Add-on: <name>", or nothing (game prompt).
  * The negative prompt is split by where each word comes from: the game's base
    negative (used for every picture), the character and outfit negatives, the extras
    the game adds in some situations (patron scenes, exposure, rooms, bath...), and
    the negative prompt of Pipeline & models (the model family's default unless you
    typed your own).

  * Every row has an Edit button: change the words right there at their source, or
    add a tag rule for that category.

NEGATIVES & TAG RULES (tab)
  * The game's negative prompt: its base list (every picture) and every extra it adds
    in some situations (patron scenes, clothes & exposure, rooms & bath, her mood) can
    be edited or emptied. Your words only go in where the game would put its own.
  * "Same game negatives for all heroines" makes one shared set instead of one per
    heroine.
  * Tag rules: each rule is for all heroines (the default for new rules) or for the
    selected heroine only ("For" column). Find tags anywhere in the finished prompt or negative prompt and
    replace or remove them, or always add tags (leave "Find" empty). A prompt rule
    can be limited to one part (Mood, Gender, Pose ...). "(2girls:1.3)", "2girls"
    and "2_girls" count as the same tag. Rules run last.

  * Suggestions from your ratings: the prompts of pictures you saved (thumbs up)
    and deleted (thumbs down) are remembered. Once there are 3 of each, tags that
    go with the deleted ones are listed, each with a button that adds a tag rule.
    Nothing changes unless you press it.

GAME UPDATE CHECK (Config)
  After you update the game, the menu shows a bar: Config > Game update check lists
  the prompts the game changed, added or removed, and which of your edits were made
  for the old text (and edits that now do nothing). "Got it" makes the new version
  the one the next update is compared with.

TEST PIPELINE (Pipeline & models)
  Draws one small test picture with your saved models, sampler and LoRAs and says in
  plain words what is wrong if it fails (ComfyUI not running, a model it does not
  have, a missing custom node, out of graphics memory ...).

LORAS FOR SOME SCENES / OUTFITS (Pipeline & models)
  "+ only for..." under a LoRA limits it to chosen scenes, looks, tasks or outfits.
  Its trigger words then leave the character prompt and are added only to those
  pictures (the inspector shows them as "LoRA trigger words").

PATRON FACES (Scenes & NPCs > Named patrons)
  Every man keeps the same face each time he is drawn (worked out from his name).
  "Try a new face" draws him with another face; "Keep this face" makes that the one
  he always has ("Keep this face" is also in the Prompt inspector for portraits).
  Save & Apply, then reload the page so the game draws his portrait again.

PICTURE SIZE
  Picture size (Pipeline & models) is the size ComfyUI draws at. A scene picture
  always fills the width of the game's picture box, so width and height only set its
  shape and detail, not its size on screen. The game's box is made for 1216 x 832
  (now also the default). Patron portraits are shown as a small circle cut from the
  middle; a square size fits it. Only pictures drawn after saving use a new size.
  * Recommended for your screen (green box): measures the game's picture box in
    your window and suggests a draw size near 1 megapixel with the same shape, plus
    the hi-res fix to finish it sharp (at least 1216 wide). "Fit picture to my
    screen" fills them in; "measure again" after
    resizing the window. "Restore defaults" puts the scene size back to 1216 x 832
    and turns the hi-res fix off.
  * The size notes and the recommendation follow the selected pipeline: SDXL-type
    models (Illustrious, Pony, NoobAI) draw best near 1 MP and up to about 1:2;
    Anima / Z-Image models handle about 0.5-2.4 MP and shapes up to about 21:9, so
    they often need no hi-res fix. The Prompt inspector warns when a picture was
    drawn bigger (or a more extreme shape) than the pipeline handles well.
  * Picture size for single scenes: give a scene (or look / task) its own size.
  * Hi-res fix: draw at the picture size, scale up (with an upscale model if you pick
    one), then add detail with a low denoise. Sharper, about twice as slow.

ADD-ONS (Config > Add-ons)
  * Use several at once: tick add-ons and they supply every prompt they contain.
  * Every prompt has a "Prompt from" dropdown: your settings, or any add-on — a
    different add-on per prompt if you like. Clothing and exposure go together.
  * The same dropdown saves that one prompt into a new or existing add-on, and
    "Create add-on" makes one from just the parts you tick.
  * Import add-ons: new ones, or the old mod's pack files (add-on packs\<type>\*.json).
    Each file is previewed first (what it contains, how many of your prompts it
    would change) and only imported when you press Import.
  * Share: "Create add-on" can include game negatives and tag rules, so a whole
    set-up travels as one file.
    On first run the old mod's add-on packs and presets are imported automatically;
    Config also has "Import old presets" (from this browser or presets.json).

PICTURES ARE ALWAYS NEW
  Until "Use Saved Images/GIFs" is on, every picture is drawn new (new seed): no
  earlier picture and none of the game's bundled art is reused.

SAVED SCENE IMAGES / GIFS (Config, like the old mod)
  <ComfyUI output>\saved-scenes\<heroine>\<scene>\<outfit>\<room>\<mood>\
  (without an output folder: the same tree in wayward-bridge-data)
  * Use Saved Images/GIFs: the game shows a random saved picture instead of drawing
    one. Generate new and Same seed on the game's picture still draw a new picture.
  * Save current image/GIF for active scene, Generate all scenes (count, vary and
    exclude outfits / rooms / moods / scenes; "Only fill gaps" tops each combination
    up to the count instead of adding that many), Clear saved images.
  Saved pictures are kept per heroine. Saving and Generate all scenes use the heroine
  selected at the top.
  * Browse saved pictures (its own section in Config): pick any heroine and scene,
    then star (starred ones are shown four times as often), move to another outfit /
    room / mood, or delete.

FACE & HAND FIX (Pipeline & models)
  After a picture is drawn, faces (and hands) are found and redrawn at a higher
  resolution. Needs the ComfyUI Impact Pack and Impact Subpack and detector models in
  ComfyUI/models/ultralytics/bbox (e.g. face_yolov8m.pt, hand_yolov8s.pt). Without
  them it is skipped and the inspector says why. Off by default.

OUTPUT GIF (Pipeline & models)
  Convert to GIF turns every new scene picture into a looping GIF (WAN 2.2
  image-to-video in ComfyUI, then ffmpeg) with your FPS and seconds. Set the ffmpeg
  path in Config. Your own image-to-video workflow (API format) can go in
  wayward-bridge-data\workflows\gif.json. GIF copies go to <ComfyUI output>\GIFs.

ON THE GAME'S PICTURE (like the old mod)
  The mod's buttons and the game's own picture buttons (fullscreen, video, thumbs,
  + and the variant arrows) appear while the mouse is over the picture (a tap shows
  them for a few seconds on touch screens), so the picture stays clear while you play.
  * Generate new   draw this picture again with a new seed (the old one is kept)
  * Same seed      draw it again with the same seed, so only your changes show
                   (both always draw a new picture, even with Use Saved Images/GIFs on)
  * Show prompt    how the prompt was built (its tooltip shows the seed)
  * Edit           open its prompts in the menu
  * < Saved >      bottom right, like the game's own arrows at the bottom left: the
                   scene's saved images/GIFs one after another (same outfit, room and
                   mood first), with a counter such as "Saved 3/9". It wraps around at
                   the ends, works with the toggle on or off, and stays visible while
                   a saved picture is shown.
  Messages ("drawing…", "saved") pop up briefly above the saved arrows.
  * Thumbs up   = save current scene (into saved-scenes; auto-delete keeps it).
                  The "saved" message fades after 10 seconds.
  * Thumbs down = delete current scene and draw a new one (asks to confirm). On a
                  saved picture this deletes that file from saved-scenes.
  * Video button = Turn this image into a GIF (now makes a looping GIF)
  * + button     = cycle scene variants (variant 1, 2, 3… of the scene's prompt;
                   the arrows still step through what you have seen)
  * Clicking the picture shows the prompt the mod really used, by category.
  The same buttons appear on the full-screen picture from the camera icon in the log;
  if a moment has no picture yet, Generate new draws it.

FIRST RUN
  If an old mod's config.json (or server\config.json) is found, its settings are
  imported automatically (the old file is not changed). You can also import one later:
  Config > Import an old config.json.

WHERE THINGS ARE KEPT
  wayward-bridge-data\ (created next to the program)
    settings.json   your changes (only what differs from the game)
    presets.json    your saved presets
    saved-scenes\    saved scenes (when no ComfyUI output folder is set)
    addons\         add-on files (import/export them in Config > Add-ons)
    library\        every picture drawn, with its prompt and seed
    backups\        the last 50 versions of settings.json (Config > Undo last save)
    ratings.jsonl   prompts of pictures you saved / deleted (for the suggestions)
    game-snapshot.json  the game's prompts last time (for the game update check)
    workflows\      optional: put a ComfyUI workflow here (API format) to replace the
                    built-in one. Name it anima.json, illustrious.json, pony.json or
                    noobai.json (or <family>-scene.json / <family>-portrait.json) and use
                    {{positive}} {{negative}} {{seed}} {{width}} {{height}} {{steps}}
                    {{cfg}} {{sampler}} {{scheduler}} {{checkpoint}} {{unet}} {{clip}}
                    {{vae}} {{lora}} {{lora_strength}} {{prefix}} where values go.

OPTIONS (add them to the node line in the .bat)
  --port 8790        play on another port (default 8788)
  --api-port 0       don't also answer on 8189 (the port the game looks for first;
                     without it the game redraws pictures after every reload)
  --game "C:\path"   game folder, if the program isn't inside it
  --host 0.0.0.0     allow other devices on your network (e.g. a phone)

Open `Start-Wayward-Bridge.bat` in Notepad (right-click → Edit, or "Show more options" → Edit on Windows 11). Near the bottom is this line:

```
node wayward-bridge.js %*
```

Put the options you want after `wayward-bridge.js` on that line, save, and start the .bat as usual. For example it should look like:

```
node wayward-bridge.js --port 8790
node wayward-bridge.js --game "D:\Games\Wayward"
node wayward-bridge.js --host 0.0.0.0
node wayward-bridge.js --host 0.0.0.0 --port 8790
```

Leave `%*` at the end of the line. It does no harm, and it lets a shortcut add more options.

**What each one does:**
- `--port 8790` plays at `http://127.0.0.1:8790/` instead of 8788. You only need this if something else already uses 8788; the console tells you when that happens.
- `--game "folder"` tells the mod where the game is if the .bat isn't in the game folder. Keep the quotes if the path has spaces. You usually don't need it: if the game isn't found, the page asks for the folder once and remembers it.
- `--host 0.0.0.0` lets other devices on your home network connect, such as a phone or tablet.

**Playing from your phone:**
1. Add `--host 0.0.0.0` as above and start the .bat.
2. If Windows Firewall asks whether to allow Node.js, allow it on **Private networks**.
3. Find your PC's address: press Win+R, type `cmd`, press Enter, then type `ipconfig`. Look for **IPv4 Address** under your Wi-Fi or Ethernet adapter, for example `192.168.1.23`.
4. On the phone, connected to the same Wi-Fi, open `http://192.168.1.23:8788/` with your address in place of that one.

**Things to know:**
- **Your PC does the work.** Pictures are drawn by ComfyUI on your PC, so it has to stay on with the .bat running.
- **Separate saves.** The phone's browser keeps its own game save and its own builder heroines, separate from the PC browser. Mod settings and saved pictures are shared, because they live on the PC.
- **Who can connect.** With `--host 0.0.0.0`, anyone on the same network can open the game and the mod's menu. Use it only on your own home network, not on public Wi-Fi.
- **The console still shows `127.0.0.1`.** That address only works on the PC itself; the phone needs the IPv4 address from step 3.

A connection timeout almost always means Windows Firewall is blocking the phone. If you missed or cancelled the "allow Node.js" prompt, Windows blocks it silently and doesn't ask again. Work through these in order; the first test tells you which part is wrong.

**1. Test the address on the PC itself.** With the .bat running, open `http://YOUR-IPv4:8788/` in the PC's browser, for example `http://192.168.1.23:8788/`.
- **It doesn't load on the PC either:** the option isn't in effect. Check that the line reads `node wayward-bridge.js --host 0.0.0.0 %*`, that you saved the file, and that you closed the old console window before starting the .bat again.
- **It loads on the PC but not on the phone:** it's the firewall or the network. Go on to step 2.

**2. Set your network to Private.** Settings → Network & internet → Wi-Fi (or Ethernet) → click your network → set **Network profile type** to **Private network**. A "Public" network blocks this kind of connection even when Node.js is allowed.

**3. Allow the mod through the firewall.** Either of these works:
- **Easiest:** click Start, type `cmd`, right-click **Command Prompt** → **Run as administrator**, and paste:
  ```
  netsh advfirewall firewall add rule name="Wayward Bridge" dir=in action=allow protocol=TCP localport=8788,8189 profile=private
  ```
  This opens only the two ports the mod uses (8789 is the game page, 8189 is the second port it answers on), and only on Private networks. If you play on another port with `--port`, put that number in place of 8788.
- **Or through the settings:** Windows Security → Firewall & network protection → **Allow an app through firewall** → **Change settings**. Find every **Node.js JavaScript Runtime** entry, tick **Private** on each, and click OK. There are often two or more entries, and one may be unticked.

**4. Check the phone's connection.**
- The phone must be on the **same Wi-Fi** as the PC: not mobile data, and not a "Guest" network. Guest networks usually stop devices from reaching each other.
- Some routers also have a setting called "AP isolation" or "client isolation" that blocks this. It's normally off on home networks.

**5. Other firewall software.** If you use Norton, Bitdefender, Kaspersky or similar, it has its own firewall that can block this too. Allow Node.js, or ports 8788 and 8189, in that program.

SPEED & SHORTCUTS (Config)
  * Draw ahead while idle (off by default): while nothing is being drawn, scenes the
    game showed recently are drawn again in the background, so a fresh picture is
    shown at once the next time the game asks for it. Thrown away when you change
    settings; only while Use Saved Images/GIFs is off; "Keep up to N pictures ready".
  * Keyboard shortcuts on the game's picture (on by default): Alt+G Generate new,
    Alt+S Same seed, Alt+Left / Alt+Right (or Alt+A / Alt+D) saved pictures,
    Alt+K save (thumbs up), Alt+Delete or Alt+X delete (thumbs down), Alt+P Show
    prompt, Alt+E Edit. Not while typing or while the menu is open.

BACKUP & MOVE TO ANOTHER PC (Config)
  "Export everything" saves one file with all settings (every heroine), models &
  LoRAs, tag rules, presets and add-ons (not the pictures). "Import a backup" shows
  what is in it first; "Keep this computer's folders and ComfyUI address" keeps the
  paths that differ per PC. Config > Undo last save brings the old settings back.

SAFETY
  The game's picture API only answers pages on your own computer (or the bridge's own
  address with --host); other websites you visit cannot start drawings or read your
  pictures.

PROBLEMS
  Config > Diagnostics shows whether the game hook, the game's prompt tables and
  ComfyUI were found. ComfyUI is only ever contacted over HTTP; it is never started or
  stopped.
