# 🎨 $WISH Wishing Well - Pixel Art Assets Requirements

## Overview
All artwork should be in **pixel art style**, similar to classic 16-bit RPGs (think Stardew Valley, old Final Fantasy, or Pokemon). Assets should be provided in PNG format with transparent backgrounds where applicable.

## Color Palette Recommendations
- Use a cohesive color palette (recommend 32-64 colors max)
- Magical/mystical theme with purples, blues, and gold accents
- Night-time or twilight atmosphere preferred

---

## 📁 Required Art Assets

### 1. BACKGROUNDS (Location: `/public/assets/backgrounds/`)

#### hub_world.png
- **Size**: 1024x768 pixels (will be scaled up 2x in game)
- **Description**: Top-down view of a magical town square
- **Must Include**:
  - Cobblestone ground pattern
  - Clear central area for fountain placement
  - Building facades around edges (shops, inn, houses)
  - Entry/exit paths on at least 2 sides
  - Magical ambient elements (glowing windows, mystical particles)

---

### 2. FOUNTAIN SPRITES (Location: `/public/assets/sprites/`)

#### fountain_base.png
- **Size**: 96x96 pixels
- **Description**: Static fountain base structure
- **Details**:
  - Stone or marble texture
  - Circular basin design
  - Ornate decorative elements
  - Rim where coins can land

#### fountain_water.png
- **Size**: 96x96 pixels per frame
- **Frames**: 4 frames
- **Description**: Animated water spritesheet
- **Animation**: Flowing water effect from center spout
- **Format**: Horizontal spritesheet (384x96 total)

---

### 3. PLAYER SPRITES (Location: `/public/assets/sprites/`)

#### player_idle.png
- **Size**: 32x32 pixels per frame
- **Frames**: 4 frames
- **Description**: Idle breathing animation
- **Format**: Horizontal spritesheet (128x32 total)

#### player_walk_down.png
- **Size**: 32x32 pixels per frame
- **Frames**: 4 frames
- **Description**: Walking animation facing camera
- **Format**: Horizontal spritesheet (128x32 total)

#### player_walk_up.png
- **Size**: 32x32 pixels per frame
- **Frames**: 4 frames
- **Description**: Walking animation facing away
- **Format**: Horizontal spritesheet (128x32 total)

#### player_walk_left.png
- **Size**: 32x32 pixels per frame
- **Frames**: 4 frames
- **Description**: Walking animation facing left
- **Format**: Horizontal spritesheet (128x32 total)

#### player_walk_right.png
- **Size**: 32x32 pixels per frame
- **Frames**: 4 frames
- **Description**: Walking animation facing right
- **Format**: Horizontal spritesheet (128x32 total)

**Player Design Notes**:
- Generic hooded figure or adventurer
- Should work for any player (not gender-specific)
- Mystical/magical clothing style
- Consider adding a subtle glow effect

---

### 4. ANIMATIONS (Location: `/public/assets/animations/`)

#### coin_throw.png
- **Size**: 16x16 pixels per frame
- **Frames**: 8 frames
- **Description**: Coin spinning through air
- **Details**: Golden $WISH coin with 'W' emblem
- **Format**: Horizontal spritesheet (128x16 total)

#### splash_effect.png
- **Size**: 64x64 pixels per frame
- **Frames**: 8 frames
- **Description**: Water splash when coin hits fountain
- **Details**: Ripples and water droplets
- **Format**: Horizontal spritesheet (512x64 total)

#### win_effect.png
- **Size**: 128x128 pixels per frame
- **Frames**: 16 frames
- **Description**: Magical celebration effect for wins
- **Details**: 
  - Sparkles, stars, magical particles
  - Different colors based on win tier:
    - Gold/Yellow for jackpot
    - Purple for major wins
    - Blue for medium wins
    - Silver for small wins
- **Format**: Horizontal spritesheet (2048x128 total)

---

### 5. UI ELEMENTS (Location: `/public/assets/ui/`)

#### panel.png
- **Size**: Variable (9-slice scalable)
- **Description**: UI panel background
- **Details**: Medieval/fantasy wooden or stone frame
- **Note**: Should be 9-slice compatible for scaling

#### button.png
- **Size**: 128x48 pixels
- **Description**: Default button state
- **Details**: Fantasy-styled button with border

#### button_hover.png
- **Size**: 128x48 pixels
- **Description**: Hover/active button state
- **Details**: Glowing or highlighted version

#### coin_icon.png
- **Size**: 24x24 pixels
- **Description**: Small $WISH coin icon for UI
- **Details**: Simplified version with 'W' visible

#### result_popup_bg.png
- **Size**: 400x300 pixels
- **Description**: Background for gambling result popup
- **Details**: Ornate frame with space for text

#### leaderboard_frame.png
- **Size**: 320x480 pixels
- **Description**: Decorative frame for leaderboard
- **Details**: Scroll or tablet design

---

### 6. DECORATIVE SPRITES (Location: `/public/assets/sprites/`)

#### tree_1.png & tree_2.png
- **Size**: 64x96 pixels each
- **Description**: Magical/fantasy trees
- **Details**: Glowing leaves or mystical elements

#### bench.png
- **Size**: 48x32 pixels
- **Description**: Park bench
- **Details**: Stone or wooden, weathered look

#### lamp_post.png
- **Size**: 32x64 pixels
- **Description**: Street lamp
- **Details**: Magical floating orb or flame

#### cobblestone_tile.png
- **Size**: 32x32 pixels
- **Description**: Repeatable ground tile
- **Details**: Seamless tiling pattern

---

### 7. ADDITIONAL DECORATIONS (Optional but recommended)

- **flower_pot.png**: 24x24 pixels
- **barrel.png**: 32x32 pixels
- **crate.png**: 32x32 pixels
- **sign_post.png**: 32x48 pixels
- **magic_crystal.png**: 24x32 pixels (animated glow)
- **bird.png**: 16x16 pixels (simple ambient creature)

---

## 📊 Win Tier Visual Indicators

Create distinct visual feedback for each win tier:

1. **Jackpot** (0.00001%): Rainbow effects, maximum particles
2. **Major Win** (0.14999%): Purple/gold effects, crown icon
3. **Large Win** (0.35%): Blue/silver effects, star burst
4. **Medium Win** (0.5%): Green effects, modest sparkles
5. **Small Win** (39%): White/yellow simple sparkle
6. **Loss** (60%): Subtle ripple, no effects

---

## 🎯 Technical Specifications

### File Formats
- **PNG** with transparency (PNG-24 or PNG-32)
- **No compression** artifacts
- **Indexed color** mode acceptable for smaller files

### Sprite Sheets
- Frames should be evenly spaced
- No padding between frames
- Consistent anchor points for animations

### Scaling
- All sprites designed at 1x scale
- Game engine will handle 2x or 3x scaling
- Keep pixel-perfect alignment (no anti-aliasing)

---

## 🚀 Future Expansion Assets (Phase 2)

For future rooms/areas, we'll need:

### Inn Interior
- **inn_interior_bg.png**: 1024x768 pixels
- **bar_counter.png**: 128x64 pixels
- **tables_chairs.png**: Various sizes
- **fireplace.png**: 64x96 pixels (animated flames)

### Marketplace
- **market_stalls.png**: 96x64 pixels each
- **merchant_npc.png**: 32x32 pixels (multiple variants)
- **goods_items.png**: 16x16 pixels each

### Mini-Games
- **fishing_pond.png**: 256x256 pixels
- **fish_sprites.png**: 24x16 pixels each
- **fishing_rod.png**: 48x8 pixels

---

## 📝 Delivery Format

Please organize assets in folders as specified and provide:
1. Individual PNG files
2. Source files (if using Aseprite, Photoshop, etc.)
3. Color palette file (.ase, .pal, or .txt)
4. Any animation timing notes

---

## 🎨 Art Style References

Similar games for inspiration:
- Stardew Valley (character style)
- Graveyard Keeper (environment style)
- Moonlighter (UI style)
- Forager (effects and particles)

The overall aesthetic should feel magical, inviting, and slightly mysterious - like a fairy tale town at twilight where wishes might actually come true!