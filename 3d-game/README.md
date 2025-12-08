# 3D Block Game

A simple 3D browser game inspired by Minecraft, built with Three.js.

## Features

- **Player Character**: 20-sided (icosahedron) head with blocky body
- **Block-Based World**: Ground made of cubes with multiple platforms at different heights
- **Physics**: Gravity and collision detection - no falling through blocks!
- **Movement Controls**: Arrow keys for walking and directional movement
- **Directional Jumps**: Shift + Arrow keys for jumping in specific directions

## How to Run

### Option 1: Python HTTP Server (Recommended)
```bash
cd 3d-game
python3 -m http.server 8000
```
Then open: http://localhost:8000/index.html

### Option 2: Node.js HTTP Server
```bash
cd 3d-game
npx http-server -p 8000
```
Then open: http://localhost:8000/index.html

### Option 3: Direct Open
Just double-click `index.html` (may have CORS limitations)

## Controls

- **Arrow Keys**: Move around
  - ↑ Up Arrow: Move forward
  - ↓ Down Arrow: Move backward
  - ← Left Arrow: Strafe left
  - → Right Arrow: Strafe right

- **Shift + Arrow Keys**: Directional jump
  - Shift + ↑: Jump forward
  - Shift + ↓: Jump backward
  - Shift + ←: Jump left
  - Shift + →: Jump right

- **Mouse**: Look around (click and drag to rotate camera)

## Game Mechanics

- **Gravity**: Player falls when not on a surface
- **Collision**: Player can't walk through blocks
- **Platforms**: Multiple platforms at different heights to explore
- **Third-Person View**: Camera follows the player

## File Structure

```
3d-game/
├── index.html    # Main HTML file with canvas and Three.js CDN
├── style.css     # Full-window styling
├── main.js       # All game logic and mechanics
└── README.md     # This file
```

## Technical Details

- **Engine**: Three.js (loaded from CDN)
- **Player Head**: IcosahedronGeometry (20 faces)
- **World**: BoxGeometry blocks for ground and platforms
- **Physics**: Custom gravity and collision detection
- **Camera**: Third-person perspective following player

Enjoy the game! 🎮
