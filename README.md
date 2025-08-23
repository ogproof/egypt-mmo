# 🏺 Egypt MMO - Ancient Egyptian Crafting Adventure

A browser-based MMO game inspired by OSRS (Old School RuneScape) with an ancient Egyptian theme, featuring crafting, exploration, and multiplayer elements.

## ✨ Features

### 🎮 Core Gameplay
- **3D World Exploration**: Navigate through a vast ancient Egyptian landscape
- **Crafting System**: Create weapons, armor, tools, and potions using materials
- **Skill Progression**: Level up smithing, crafting, alchemy, and woodworking skills
- **Resource Gathering**: Mine, chop, fish, and harvest materials from the world
- **Inventory Management**: 64-slot inventory with equipment system

### 🌍 World & Environment
- **Egyptian Landmarks**: Pyramids, temples, sphinxes, and obelisks
- **Desert Terrain**: Sandy landscapes with palm trees, rocks, and sand dunes
- **Resource Nodes**: Mining sites, palm groves, herb gardens, and oases
- **Dynamic Lighting**: Day/night cycle with atmospheric lighting effects

### 🎨 User Interface
- **Beautiful Egyptian Theme**: Gold accents, hieroglyphic-inspired design
- **Crafting Panel**: Organized by category (weapons, armor, tools, potions)
- **Inventory System**: Visual grid-based inventory with item information
- **Performance Monitoring**: Real-time FPS and system statistics
- **Responsive Design**: Works on desktop and mobile devices

### 🔧 Technical Features
- **WebGL Rendering**: High-performance 3D graphics using Three.js
- **Physics Engine**: Realistic movement and collision using Cannon.js
- **Multiplayer Ready**: Socket.io integration for future multiplayer features
- **Audio System**: Immersive sound effects and Egyptian-themed music
- **Performance Optimized**: Efficient rendering and asset management

## 🚀 Getting Started

### Prerequisites
- Node.js 16+ and npm
- Modern web browser with WebGL support
- Git

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/egypt-mmo.git
   cd egypt-mmo
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start the development server**
   ```bash
   npm run dev
   ```

4. **Open your browser**
   Navigate to `http://localhost:3000`

### Building for Production

```bash
npm run build
npm run preview
```

## 🎯 How to Play

### Controls
- **Arrow Keys**: Hold to pan camera around character (smooth rotation)
- **Click**: Move character to clicked location (click-to-move like RuneScape)
- **Click on objects**: Interact with crafting stations, resource nodes, NPCs
- **E**: Interact with objects
- **I**: Open inventory
- **C**: Open crafting panel
- **M**: Open map
- **K**: Open skills
- **Escape**: Close panels

### Getting Started
1. **Explore the World**: Walk around and discover Egyptian landmarks
2. **Gather Resources**: Visit resource nodes to collect materials
3. **Craft Items**: Use the crafting panel to create tools and equipment
4. **Level Up Skills**: Gain experience by crafting and gathering
5. **Discover Secrets**: Explore pyramids and temples for hidden treasures

### Crafting System
- **Weapons**: Bronze, iron, and steel swords
- **Armor**: Leather and metal armor sets
- **Tools**: Pickaxes, hammers, and crafting tools
- **Potions**: Health, strength, and wisdom potions

## 🏗️ Project Structure

```
egypt-mmo/
├── src/
│   ├── core/           # Core game systems
│   │   ├── GameEngine.js
│   │   ├── LoadingManager.js
│   │   ├── InputManager.js
│   │   └── WorldManager.js
│   ├── entities/       # Game entities
│   │   └── Player.js
│   ├── systems/        # Game mechanics
│   │   ├── CraftingSystem.js
│   │   └── InventorySystem.js
│   ├── ui/            # User interface
│   │   └── UIManager.js
│   ├── network/       # Multiplayer networking
│   │   └── NetworkManager.js
│   ├── audio/         # Audio management
│   │   └── AudioManager.js
│   └── styles/        # CSS stylesheets
│       └── main.css
├── index.html         # Main HTML file
├── package.json       # Dependencies and scripts
├── vite.config.js     # Build configuration
└── README.md          # This file
```

## 🛠️ Technology Stack

- **Frontend**: HTML5, CSS3, JavaScript (ES6+)
- **3D Graphics**: Three.js for WebGL rendering
- **Physics**: Cannon.js for realistic physics simulation
- **Build Tool**: Vite for fast development and building
- **Networking**: Socket.io for real-time multiplayer
- **Audio**: Howler.js for cross-browser audio support
- **Styling**: Modern CSS with Egyptian theme

## 🎨 Customization

### Adding New Items
Edit `src/systems/CraftingSystem.js` to add new crafting recipes:

```javascript
this.addRecipe('new_sword', {
    name: 'New Sword',
    type: 'weapon',
    skill: 'smithing',
    level: 15,
    experience: 150,
    materials: [
        { id: 'new_material', quantity: 3 },
        { id: 'wood', quantity: 2 }
    ],
    tools: ['hammer'],
    time: 15000
});
```

### Adding New Resources
Edit `src/core/WorldManager.js` to add new resource nodes:

```javascript
{ type: 'new_skill', name: 'New Resource', color: 0x123456, position: { x: 75, z: 75 } }
```

### Modifying the World
Edit `src/core/WorldManager.js` to change world generation, add new structures, or modify terrain.

## 🚧 Future Features

- **Multiplayer Servers**: Real-time player interaction
- **Trading System**: Player-to-player item trading
- **Guild System**: Form alliances and work together
- **Quest System**: Story-driven missions and objectives
- **Advanced Crafting**: More complex recipes and materials
- **Combat System**: PvE and PvP combat mechanics
- **Building System**: Construct your own structures
- **Economy System**: Player-driven economy with shops

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines
- Follow existing code style and patterns
- Add comments for complex logic
- Test your changes thoroughly
- Update documentation as needed

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Three.js Community**: For the excellent 3D graphics library
- **Cannon.js Team**: For the physics engine
- **OSRS Community**: For inspiration in crafting mechanics
- **Ancient Egypt History**: For the rich thematic elements

## 📞 Support

- **Issues**: Report bugs and feature requests on GitHub
- **Discussions**: Join community discussions
- **Wiki**: Check the project wiki for detailed guides

## 🔮 Roadmap

### Phase 1: Core Systems ✅
- [x] Basic 3D world
- [x] Player movement and controls
- [x] Crafting system
- [x] Inventory management
- [x] Basic UI

### Phase 2: Enhanced Gameplay 🚧
- [ ] Advanced crafting recipes
- [ ] Skill progression system
- [ ] Resource gathering mechanics
- [ ] Equipment system

### Phase 3: Multiplayer 🌐
- [ ] Player synchronization
- [ ] Chat system
- [ ] Trading mechanics
- [ ] Guild system

### Phase 4: Content & Polish ✨
- [ ] Quest system
- [ ] Advanced combat
- [ ] Building mechanics
- [ ] Performance optimization

---

**Ready to embark on your ancient Egyptian adventure? Start crafting, exploring, and building your legacy in the sands of time! 🏺✨**
