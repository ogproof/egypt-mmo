const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

// Middleware
app.use(cors());
app.use(express.json());
// Only serve static files if they exist (for local development)
if (process.env.NODE_ENV !== 'production') {
    app.use(express.static(path.join(__dirname, '../dist')));
}

// Game state
const gameState = {
    players: new Map(),
    world: {
        size: 1000,
        chunks: new Map()
    },
    resources: new Map(),
    buildings: new Map()
};

// Socket.io connection handling
io.on('connection', (socket) => {
    console.log(`Player connected: ${socket.id}`);
    
    // Player joins
    socket.on('player_join', (playerData) => {
        const player = {
            id: socket.id,
            name: playerData.name || 'Player',
            position: playerData.position || { x: 0, y: 0, z: 0 },
            rotation: playerData.rotation || { x: 0, y: 0, z: 0 },
            level: playerData.level || 1,
            skills: playerData.skills || {},
            inventory: playerData.inventory || [],
            equipment: playerData.equipment || {},
            connectedAt: Date.now()
        };
        
        gameState.players.set(socket.id, player);
        
        // Notify other players
        socket.broadcast.emit('player_join', player);
        
        // Send current world state to new player
        socket.emit('world_state', {
            players: Array.from(gameState.players.values()),
            resources: Array.from(gameState.resources.values()),
            buildings: Array.from(gameState.buildings.values())
        });
        
        console.log(`Player ${player.name} joined the world`);
    });
    
    // Player movement
    socket.on('player_move', (data) => {
        const player = gameState.players.get(socket.id);
        if (player) {
            player.position = data.position;
            player.rotation = data.rotation;
            player.lastMove = Date.now();
            
            // Broadcast to other players
            socket.broadcast.emit('player_move', {
                playerId: socket.id,
                position: data.position,
                rotation: data.rotation,
                timestamp: data.timestamp
            });
        }
    });
    
    // Player actions
    socket.on('player_action', (data) => {
        const player = gameState.players.get(socket.id);
        if (player) {
            console.log(`Player ${player.name} performed action: ${data.action}`);
            
            // Handle different action types
            switch (data.action) {
                case 'craft_item':
                    handleCrafting(socket, data);
                    break;
                case 'gather_resource':
                    handleResourceGathering(socket, data);
                    break;
                case 'place_building':
                    handleBuildingPlacement(socket, data);
                    break;
                default:
                    console.log(`Unknown action: ${data.action}`);
            }
        }
    });
    
    // Chat messages
    socket.on('chat_message', (data) => {
        const player = gameState.players.get(socket.id);
        if (player) {
            const message = {
                playerId: socket.id,
                playerName: player.name,
                message: data.message,
                channel: data.channel || 'global',
                timestamp: data.timestamp
            };
            
            // Broadcast to all players
            io.emit('chat_message', message);
        }
    });
    
    // Crafting requests
    socket.on('craft_request', (data) => {
        handleCrafting(socket, data);
    });
    
    // Resource gathering
    socket.on('resource_gather', (data) => {
        handleResourceGathering(socket, data);
    });
    
    // Building placement
    socket.on('building_place', (data) => {
        handleBuildingPlacement(socket, data);
    });
    
    // Disconnect handling
    socket.on('disconnect', () => {
        const player = gameState.players.get(socket.id);
        if (player) {
            console.log(`Player ${player.name} disconnected`);
            
            // Remove from game state
            gameState.players.delete(socket.id);
            
            // Notify other players
            socket.broadcast.emit('player_leave', socket.id);
        }
    });
});

// Game action handlers
function handleCrafting(socket, data) {
    const player = gameState.players.get(socket.id);
    if (!player) return;
    
    // Validate crafting request
    const recipe = getCraftingRecipe(data.itemId);
    if (!recipe) {
        socket.emit('craft_result', { success: false, error: 'Recipe not found' });
        return;
    }
    
    // Check if player has required materials
    if (hasRequiredMaterials(player, recipe.materials)) {
        // Consume materials and create item
        consumeMaterials(player, recipe.materials);
        addItemToInventory(player, data.itemId);
        
        // Add experience
        addExperience(player, recipe.skill, recipe.experience);
        
        socket.emit('craft_result', { 
            success: true, 
            itemId: data.itemId,
            experience: recipe.experience
        });
        
        // Notify other players
        socket.broadcast.emit('player_crafted', {
            playerId: socket.id,
            playerName: player.name,
            itemId: data.itemId
        });
    } else {
        socket.emit('craft_result', { success: false, error: 'Insufficient materials' });
    }
}

function handleResourceGathering(socket, data) {
    const player = gameState.players.get(socket.id);
    if (!player) return;
    
    // Check if resource exists and is available
    const resource = gameState.resources.get(data.resourceId);
    if (resource && isResourceAvailable(resource)) {
        // Calculate gathering time and success chance
        const gatheringResult = calculateGatheringResult(player, resource);
        
        if (gatheringResult.success) {
            // Add resources to player inventory
            addResourcesToInventory(player, gatheringResult.resources);
            
            // Update resource state
            updateResourceState(resource);
            
            socket.emit('gathering_result', {
                success: true,
                resources: gatheringResult.resources,
                experience: gatheringResult.experience
            });
        } else {
            socket.emit('gathering_result', {
                success: false,
                error: gatheringResult.error
            });
        }
    } else {
        socket.emit('gathering_result', {
            success: false,
            error: 'Resource not available'
        });
    }
}

function handleBuildingPlacement(socket, data) {
    const player = gameState.players.get(socket.id);
    if (!player) return;
    
    // Validate building placement
    if (canPlaceBuilding(player, data.buildingType, data.position)) {
        const building = createBuilding(data.buildingType, data.position, data.rotation);
        gameState.buildings.set(building.id, building);
        
        // Notify all players
        io.emit('building_placed', building);
        
        socket.emit('building_result', { success: true, building: building });
    } else {
        socket.emit('building_result', { success: false, error: 'Cannot place building here' });
    }
}

// Helper functions (simplified implementations)
function getCraftingRecipe(itemId) {
    // This would load from a recipe database
    const recipes = {
        'bronze_sword': {
            skill: 'smithing',
            experience: 25,
            materials: [{ id: 'bronze_ingot', quantity: 2 }, { id: 'wood', quantity: 1 }]
        }
    };
    return recipes[itemId];
}

function hasRequiredMaterials(player, materials) {
    // Check if player has all required materials
    return materials.every(material => {
        const playerMaterial = player.inventory.find(item => item.id === material.id);
        return playerMaterial && playerMaterial.quantity >= material.quantity;
    });
}

function consumeMaterials(player, materials) {
    materials.forEach(material => {
        const playerMaterial = player.inventory.find(item => item.id === material.id);
        if (playerMaterial) {
            playerMaterial.quantity -= material.quantity;
            if (playerMaterial.quantity <= 0) {
                player.inventory = player.inventory.filter(item => item.id !== material.id);
            }
        }
    });
}

function addItemToInventory(player, itemId) {
    player.inventory.push({ id: itemId, quantity: 1 });
}

function addExperience(player, skill, amount) {
    if (!player.skills[skill]) {
        player.skills[skill] = { level: 1, experience: 0 };
    }
    
    player.skills[skill].experience += amount;
    
    // Check for level up
    const currentLevel = player.skills[skill].level;
    const expForNextLevel = getExperienceForLevel(currentLevel + 1);
    
    if (player.skills[skill].experience >= expForNextLevel) {
        player.skills[skill].level++;
        socket.emit('skill_levelup', { skill: skill, newLevel: player.skills[skill].level });
    }
}

function getExperienceForLevel(level) {
    return Math.floor(100 * Math.pow(1.5, level - 1));
}

// API endpoints
app.get('/api/players', (req, res) => {
    res.json(Array.from(gameState.players.values()));
});

app.get('/api/world', (req, res) => {
    res.json({
        size: gameState.world.size,
        resources: Array.from(gameState.resources.values()),
        buildings: Array.from(gameState.buildings.values())
    });
});

app.get('/api/player/:id', (req, res) => {
    const player = gameState.players.get(req.params.id);
    if (player) {
        res.json(player);
    } else {
        res.status(404).json({ error: 'Player not found' });
    }
});

// Health check
app.get('/health', (req, res) => {
    res.json({ 
        status: 'healthy', 
        players: gameState.players.size,
        uptime: process.uptime()
    });
});

// Serve the game (only in development)
if (process.env.NODE_ENV !== 'production') {
    app.get('*', (req, res) => {
        res.sendFile(path.join(__dirname, '../dist/index.html'));
    });
}

// Start server
const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
    console.log(`🏺 Egypt MMO Server running on port ${PORT}`);
    console.log(`🌐 Server URL: http://localhost:${PORT}`);
    console.log(`📊 Health check: http://localhost:${PORT}/health`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('🔄 Shutting down server gracefully...');
    server.close(() => {
        console.log('✅ Server closed');
        process.exit(0);
    });
});

process.on('SIGINT', () => {
    console.log('🔄 Shutting down server...');
    server.close(() => {
        console.log('✅ Server closed');
        process.exit(0);
    });
});
