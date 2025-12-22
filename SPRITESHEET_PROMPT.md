# Sprite Sheet Generation Prompt

Use this prompt with Google Imagen 3 (or similar AI image generator) along with one of your existing character images as a reference.

---

## Image Generation Prompt

```
Create a 2D pixel art sprite sheet for a Bomberman-style video game character.
The sprite sheet should contain walking animation frames arranged in a grid.

Layout: 4 rows x 4 columns (16 frames total)
- Row 1: Walking DOWN (4 frames: idle, step-left, idle, step-right)
- Row 2: Walking UP (4 frames: idle, step-left, idle, step-right)
- Row 3: Walking LEFT (4 frames showing side view walking cycle)
- Row 4: Walking RIGHT (4 frames showing side view walking cycle)

Style requirements:
- Chibi/cute cartoon style matching the reference image
- Each frame should be the same size (square)
- Consistent character proportions across all frames
- Slight bobbing motion for walking (character moves up/down slightly)
- Arms and legs should show walking motion
- Maintain the exact same colors, features, and personality as the reference

Technical specs:
- Total image size: 512x512 pixels (128x128 per frame)
- Clean edges, no anti-aliasing blur
- SOLID BRIGHT MAGENTA BACKGROUND (#FF00FF / RGB 255,0,255)
- Do NOT use any magenta, hot pink, or fuchsia colors in the character itself
- Character centered in each frame
- Consistent lighting across all frames

The character should look like they belong in a fun, colorful Bomberman-style arena game.
Keep the same whimsical "brainrot meme" aesthetic as the original.
```

### Removing the Magenta Background

After generating, run this ImageMagick command to make it transparent:

```bash
magick CHARACTER_spritesheet.png -fuzz 10% -transparent "#FF00FF" CHARACTER_spritesheet_transparent.png
```

---

## JSON Specs for Kaboom.js Integration

```json
{
  "spriteSheet": {
    "fileName": "CHARACTER_spritesheet.png",
    "frameWidth": 128,
    "frameHeight": 128,
    "columns": 4,
    "rows": 4,
    "totalFrames": 16
  },
  "animations": {
    "walk_down": {
      "frames": [0, 1, 2, 3],
      "frameRate": 8,
      "loop": true
    },
    "walk_up": {
      "frames": [4, 5, 6, 7],
      "frameRate": 8,
      "loop": true
    },
    "walk_left": {
      "frames": [8, 9, 10, 11],
      "frameRate": 8,
      "loop": true
    },
    "walk_right": {
      "frames": [12, 13, 14, 15],
      "frameRate": 8,
      "loop": true
    },
    "idle_down": {
      "frames": [0],
      "frameRate": 1,
      "loop": false
    },
    "idle_up": {
      "frames": [4],
      "frameRate": 1,
      "loop": false
    }
  },
  "characters": [
    {
      "name": "tungtung",
      "displayName": "Tung Tung Sahur",
      "spriteSheet": "tungtung_spritesheet.png",
      "referenceImages": ["tungtungfront.png", "tungtungback.png"]
    },
    {
      "name": "meowl",
      "displayName": "Meowl",
      "spriteSheet": "meowl_spritesheet.png",
      "referenceImages": ["meowlfront.png", "meowlback.png"]
    },
    {
      "name": "strawberry",
      "displayName": "Strawberry Elephant",
      "spriteSheet": "strawberry_spritesheet.png",
      "referenceImages": ["strawberryfront.png", "strawberryback.png"]
    },
    {
      "name": "cappucino",
      "displayName": "Cappucino Assassino",
      "spriteSheet": "cappucino_spritesheet.png",
      "referenceImages": ["cappucinofront.png", "cappucinoback.png"]
    }
  ]
}
```

---

## Kaboom.js Code to Load Animated Sprites

Once you have the sprite sheets, add this to `main.js`:

```javascript
// Load animated sprite sheets
loadSprite("tungtung", "/sprites/tungtung_spritesheet.png", {
  sliceX: 4,
  sliceY: 4,
  anims: {
    "walk_down": { from: 0, to: 3, loop: true, speed: 8 },
    "walk_up": { from: 4, to: 7, loop: true, speed: 8 },
    "walk_left": { from: 8, to: 11, loop: true, speed: 8 },
    "walk_right": { from: 12, to: 15, loop: true, speed: 8 },
    "idle_down": { from: 0, to: 0 },
    "idle_up": { from: 4, to: 4 },
  }
});

// Then in player movement:
onKeyDown("w", () => {
  player.play("walk_up");
  // ... movement code
});

onKeyRelease("w", () => {
  player.play("idle_up");
});
```

---

## Alternative: Simpler 8-Frame Sheet

If 16 frames is too complex, use this simpler layout:

```
Layout: 2 rows x 4 columns (8 frames)
- Row 1: Walking DOWN (2 frames), Walking UP (2 frames)
- Row 2: Walking LEFT (2 frames), Walking RIGHT (2 frames)

Image size: 512x256 pixels (128x128 per frame)
```

```json
{
  "spriteSheet": {
    "frameWidth": 128,
    "frameHeight": 128,
    "columns": 4,
    "rows": 2,
    "totalFrames": 8
  },
  "animations": {
    "walk_down": { "frames": [0, 1], "frameRate": 6 },
    "walk_up": { "frames": [2, 3], "frameRate": 6 },
    "walk_left": { "frames": [4, 5], "frameRate": 6 },
    "walk_right": { "frames": [6, 7], "frameRate": 6 }
  }
}
```

---

## Your Existing Character Reference Images

Upload one of these as the reference when generating:

| Character | Front Image | Back Image |
|-----------|-------------|------------|
| Tung Tung Sahur | `tungtungfront.png` | `tungtungback.png` |
| Meowl | `meowlfront.png` | `meowlback.png` |
| Strawberry Elephant | `strawberryfront.png` | `strawberryback.png` |
| Cappucino Assassino | `cappucinofront.png` | `cappucinoback.png` |

Location: `/Users/ryemckenzie/projects/bodhisbrainrots/public/sprites/`
