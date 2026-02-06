# Glowing Sphere - Star Collector Game

A modular, production-grade 3D star collector game built with Three.js and modern JavaScript (ES6 modules).

## Features

- **Object-Oriented Architecture**: Clean, maintainable codebase with class-based design
- **Modular Structure**: Separated concerns with dedicated modules for entities, systems, UI, and utilities
- **Multiple Input Methods**: 
  - Keyboard (WASD/Arrow keys)
  - Gamepad (Xbox and generic controllers)
  - Touch controls (mobile devices)
- **Progression System**:
  - Persistent save data via localStorage
  - Power-up shop with upgrades
  - Multiple power-ups with unique effects
  - Coin-based economy
- **Seeded Level Generation**: Reproducible levels with shareable seeds
- **Responsive Design**: Works on desktop, tablet, and mobile devices
- **Accessibility**: Keyboard navigation, screen reader support, focus indicators

## Project Structure

```
glowing-sphere/
├── index.html             # Main HTML entry point
├── src/
│   ├── main.js            # Application entry point
│   ├── core/              # Core game classes
│   │   └── Game.js        # Main game orchestrator
│   ├── entities/          # Game entities
│   │   ├── Player.js      # Player entity
│   │   ├── Enemy.js       # Enemy entity
│   │   ├── Star.js        # Collectible star
│   │   └── Obstacle.js    # Obstacles and moving walls
│   ├── systems/           # Game systems
│   │   ├── InputSystem.js      # Input handling (keyboard/gamepad/touch)
│   │   ├── PowerUpSystem.js    # Power-up management
│   │   └── CollisionSystem.js  # Collision detection
│   ├── ui/                # User interface
│   │   └── UIManager.js   # UI management and modals
│   ├── config/            # Configuration
│   │   └── PowerUpConfig.js     # Power-up definitions
│   ├── utils/             # Utility classes
│   │   ├── Constants.js         # Game constants
│   │   ├── SeededRandom.js      # RNG for seeded levels
│   │   └── Storage.js           # LocalStorage wrapper
│   └── styles/            # Stylesheets
│       └── main.css       # Main CSS
├── package.json           # Dependencies and scripts
├── vite.config.js         # Vite configuration
└── README.md              # This file
```

## Installation

**Prerequisites:**
- Node.js 16+ and npm

1. **Install dependencies**:
   ```bash
   npm install
   ```

## Running the Application

### Development Mode

Start the Vite development server:
```bash
npm run dev
```

The application will be available at `http://localhost:8000`

### Production Build

Build for production:
```bash
npm run build
```

This creates an optimized build in the `dist/` directory.

### Preview Production Build

Preview the production build:
```bash
npm run preview
```

## Game Controls

### Keyboard
- **Movement**: WASD or Arrow keys
- **Dash**: Right Ctrl (temporary speed boost)
- **Handbrake**: Left Ctrl (drift/slow down)
- **Zoom In**: Right Shift
- **Zoom Out**: Left Shift
- **Open Shop**: B key
- **Navigate Menus**: Arrow keys, Tab, Enter, Escape

### Gamepad (Xbox-style)
- **Movement**: Left stick or D-pad
- **Dash**: R1 button
- **Handbrake**: L1 button
- **Zoom In**: R2 trigger (analog)
- **Zoom Out**: L2 trigger (analog)
- **Open Shop**: B or Start button
- **Navigate Menus**: D-pad/stick to navigate, A to select, B to close

### Touch (Mobile)
- **Movement**: Virtual joystick (bottom-left)
- **Shop**: Shop button (bottom-right)

## Architecture

### Entity-Component-System (ECS) Pattern

The game follows a modified ECS pattern:

- **Entities**: Player, Enemy, Star, Obstacle classes that encapsulate mesh and state
- **Systems**: InputSystem, PowerUpSystem, CollisionSystem handle specific concerns
- **Core**: Game class orchestrates everything and manages the game loop

### Key Classes

#### Game (`src/core/Game.js`)
Main orchestrator that:
- Manages game state and lifecycle
- Coordinates all systems and entities
- Handles level generation
- Runs the main game loop

#### UIManager (`src/ui/UIManager.js`)
Handles all UI operations:
- Updates HUD elements
- Manages modals (game over, level complete, shop)
- Handles keyboard/controller navigation
- Dynamic device-specific hints

#### PowerUpSystem (`src/systems/PowerUpSystem.js`)
Manages progression:
- Handles coin economy
- Power-up purchases and upgrades
- Active power-up effects
- Save/load progress

### Design Patterns Used

- **Singleton Pattern**: Core systems have single instances
- **Observer Pattern**: Event-driven UI updates via callbacks
- **Factory Pattern**: Entity creation methods
- **Strategy Pattern**: Different input strategies (keyboard/gamepad/touch)

## Power-Ups

The game features 8 unique power-ups:

| Power-Up | Effect | Max Level |
|----------|--------|-----------|
| ⚡ Speed Boost | +15% speed per level | 5 |
| 🛡️ Energy Shield | Temporary invincibility | 3 |
| 🧲 Star Magnet | Auto-collect from distance | 5 |
| ✨ Score Multiplier | +25% score per level | 5 |
| ❤️ Extra Life | +1 starting life | 3 |
| ⏰ Time Dilation | Slows enemies | 4 |
| 👁️ Star Vision | See stars through walls | 1 |
| 💰 Coin Magnet | +10% coins per level | 3 |

## Technologies

- **Three.js** (v0.160.0): 3D rendering engine
- **Vite** (v5.0.0): Build tool and dev server
- **ES6 Modules**: Modern JavaScript module system
- **CSS3**: Responsive styling with accessibility features

## Browser Support

- Chrome/Edge 90+
- Firefox 88+
- Safari 14+
- Opera 76+

## Development Notes

### Adding New Power-Ups

1. Add definition to `src/config/PowerUpConfig.js`
2. Implement effect logic in the `effect` function
3. Update power-up system to handle the new type

### Modifying Game Constants

Edit `src/utils/Constants.js` to adjust:
- Arena dimensions
- Player physics
- Enemy behavior
- Collision parameters
- Camera settings

### Customizing Shaders

Each entity has custom GLSL shaders. Modify the `vertexShader` and `fragmentShader` properties in entity constructors.

## License

ISC

## Credits

Built with ❤️ using Three.js and modern web technologies.
