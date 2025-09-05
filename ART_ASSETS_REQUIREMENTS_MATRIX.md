# 🎨 $WISH Wishing Well - Matrix-Style Pixel Art Requirements

## Overview
All artwork should be in **pixel art style** with a **Matrix/cyberpunk aesthetic** - think neon greens, digital/futuristic elements, but arranged in a classic RPG hub world layout. The environment combines digital cyberspace with fantasy elements.

## Color Palette
- **Primary**: Matrix green (#00FF00) and black (#000000)
- **Accent**: Neon cyan (#00FFFF), electric blue (#0080FF)  
- **Secondary**: Dark grays (#333333), digital purple (#8000FF)
- **Warning**: Red (#FF0000), yellow (#FFFF00)
- **Special**: Gold (#FFD700) for coins and jackpot effects

---

## 📁 Required Art Assets - Priority Order

### 🏆 **PRIORITY 1 - Minimum Playable Game (Essential 7 Assets)**

#### 1. CHARACTER SPRITES (Most Important)

**Location**: `/public/assets/sprites/`

You need **7 different character variants**. Each character needs 6 sprite files:

##### Character 1 - "Cyber Wanderer"
- **character_1_idle.png** - 32x32px, 4 frames (128x32 total)
- **character_1_walk_down.png** - 32x32px, 4 frames (128x32 total)
- **character_1_walk_up.png** - 32x32px, 4 frames (128x32 total)  
- **character_1_walk_left.png** - 32x32px, 4 frames (128x32 total)
- **character_1_walk_right.png** - 32x32px, 4 frames (128x32 total)
- **character_1_throw.png** - 32x32px, 4 frames (128x32 total)

**Design Notes**:
- Hooded figure with digital/neon accents
- Slight glow effects on clothing
- Matrix-style details (circuit patterns, etc.)
- Generic enough for any player

*Repeat this pattern for characters 2-7 with different designs:*
- Character 2: "Digital Mage" (staff, robes with circuit patterns)  
- Character 3: "Matrix Knight" (armor with neon lines)
- Character 4: "Pixel Rogue" (sleek, minimal design)
- Character 5: "Code Wizard" (tech-enhanced robes)  
- Character 6: "Neon Samurai" (cyber-enhanced traditional look)
- Character 7: "Grid Walker" (full digital aesthetic)

#### 2. fountain_base.png
- **Size**: 96x96 pixels
- **Description**: Central fountain with Matrix/digital styling
- **Style**: Stone base with neon green glowing accents/lines

#### 3. coin_throw.png  
- **Size**: 16x16px, 8 frames (128x16 total)
- **Description**: $WISH coin spinning animation
- **Style**: Golden coin with glowing 'W' symbol

### 🏗️ **PRIORITY 2 - Environment & Effects**

#### Backgrounds
**matrix_grid.png** (Optional - can be generated)
- **Size**: 1280x960px
- **Description**: Matrix-style grid background (we generate this programmatically, but you can override)

#### Fountain Animation  
**fountain_water.png**
- **Size**: 96x96px, 4 frames (384x96 total)
- **Description**: Digital water/energy flow animation
- **Style**: Neon green particle streams

#### Effects
**splash_effect.png**
- **Size**: 64x64px, 8 frames (512x64 total)  
- **Description**: Digital splash when coin hits fountain
- **Style**: Green particle explosion

**Win Effect Tiers** (5 different animations):
- **win_jackpot.png** - 128x128px, 16 frames - Gold/rainbow digital explosion
- **win_major.png** - 128x128px, 16 frames - Purple/magenta particles  
- **win_large.png** - 128x128px, 16 frames - Cyan digital burst
- **win_medium.png** - 128x128px, 16 frames - Green particle cascade
- **win_small.png** - 128x128px, 16 frames - White/silver sparkles

### 🏘️ **PRIORITY 3 - Hub World Environment**

#### Houses (Fixed Positions)
- **house_1.png** - 128x96px - Cyber cafe/tech shop
- **house_2.png** - 128x96px - Digital bank/exchange  
- **house_3.png** - 128x96px - Neon bar/tavern
- **house_4.png** - 128x96px - Matrix terminal building

#### Environment Objects
- **lamp_post.png** - 32x64px - Glowing neon street light
- **bench.png** - 48x32px - Futuristic seating with neon trim
- **tree_1.png** - 64x96px - Digital tree with glowing leaves/circuits
- **tree_2.png** - 64x96px - Different digital tree variant
- **shrub.png** - 32x32px - Small glowing bush/plant

### 🎨 **PRIORITY 4 - UI Elements**

**Location**: `/public/assets/ui/`

- **panel.png** - 320x240px - Matrix-style panel background  
- **button.png** - 128x48px - Default button with neon border
- **button_hover.png** - 128x48px - Glowing hover state
- **coin_icon.png** - 24x24px - Small $WISH coin icon
- **matrix_frame.png** - 400x300px - Digital frame for popups

---

## 🎯 Hub World Layout (Fixed Positions)

Your sprites will be placed at these exact coordinates (defined in hub-config.json):

- **Fountain**: Center (640, 480) - Main interaction point
- **Houses**: 4 corners of the hub area  
- **Lamps**: 4 positions around fountain for lighting
- **Benches**: Seating areas facing fountain
- **Trees/Shrubs**: Decorative elements at edges

## 🎮 Character Selection Flow

1. **Loading Screen**: Matrix-style with green progress bar
2. **Character Select**: Carousel of 7 character options
3. **Hub World**: Enter with selected character

## 💫 Animation Requirements

### Character Animations (Per Character):
- **Idle**: 4 frames, gentle breathing/glow pulse
- **Walk**: 4 frames each direction (up/down/left/right)
- **Throw**: 4 frames, coin tossing motion

### Effects:
- **Coin**: 8 frames spinning with glow trail
- **Fountain Water**: 4 frames flowing energy
- **Splash**: 8 frames particle burst  
- **Win Effects**: 16 frames each, tier-specific colors

## 🔧 Technical Specifications

### File Formats
- **PNG** with transparency
- **No compression** artifacts
- Pixel-perfect alignment

### Sprite Sheets  
- Horizontal layout (frames side by side)
- No padding between frames
- Consistent frame timing

### Matrix Aesthetic Elements
- Neon green primary color (#00FF00)
- Glow effects on key elements
- Digital/circuit pattern details
- Contrast with black backgrounds
- Subtle scan line effects acceptable

## 📋 Art Asset Checklist

### 🎯 **START HERE - Essential for Testing**
- [ ] character_1_idle.png
- [ ] character_1_walk_down.png  
- [ ] fountain_base.png
- [ ] coin_throw.png

### 🚀 **Full Character Set (7 characters × 6 animations each = 42 files)**
- [ ] All character sprites (characters 1-7)
- [ ] All character animations (idle, walk×4, throw)

### 🌟 **Environment**
- [ ] fountain_water.png
- [ ] 4 house variants
- [ ] Lamp posts, benches, trees, shrubs
- [ ] All effect animations

### 💎 **Polish**
- [ ] UI elements  
- [ ] Win effect variants
- [ ] Additional decorative elements

---

## 🎨 Matrix Style Guide

### Colors for Different Elements:
- **Characters**: Dark base with neon green accents
- **Environment**: Black/dark gray with selective neon highlights  
- **Interactive Objects**: Bright green glow to indicate interactivity
- **Effects**: Tier-based colors (gold=jackpot, purple=major, etc.)

### Visual Effects:
- Subtle glow/bloom on neon elements
- Digital noise/static acceptable
- Circuit board patterns for detail
- Scan lines for retro computer feel

### Fonts (For Reference):
- Matrix-style: Courier, Monaco, or custom bitmap fonts
- All UI text will use green-on-black terminal style

---

## 🚀 Development Priority

**Phase 1**: Get 1 character working (character_1 + fountain + coin)
**Phase 2**: Add all 7 characters 
**Phase 3**: Environment objects and effects
**Phase 4**: UI polish and additional effects

Start with character_1 and fountain_base.png to see the game working immediately!