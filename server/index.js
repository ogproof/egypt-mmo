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

// Add request logging middleware
app.use((req, res, next) => {
    console.log(`📥 Incoming request: ${req.method} ${req.url} from ${req.ip}`);
    console.log(`📥 Headers:`, req.headers);
    console.log(`📥 User-Agent: ${req.headers['user-agent']}`);
    
    // Log response completion
    res.on('finish', () => {
        console.log(`📤 Response sent: ${req.method} ${req.url} - Status: ${res.statusCode}`);
    });
    
    next();
});

// HTTPS redirects and security headers
app.use((req, res, next) => {
    // Skip HTTPS redirect for health checks and internal Railway endpoints
    if (req.path === '/health' || req.path.startsWith('/api/') || req.headers.host === 'healthcheck.railway.app') {
        return next();
    }
    
    if (process.env.PORT && req.headers['x-forwarded-proto'] !== 'https') {
        return res.redirect(`https://${req.headers.host}${req.url}`);
    }
    
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    if (req.headers['x-forwarded-proto'] === 'https' && req.headers.host) {
        res.setHeader('Strict-Transport-Security', 'max-age=300; includeSubDomains');
    }
    next();
});

// Serve static files (both development and production)
app.use(express.static(path.join(__dirname, '../dist')));

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
        // Generate a random starting position for the player
        const startX = (Math.random() - 0.5) * 50; // Random position within 50 units
        const startZ = (Math.random() - 0.5) * 50;
        
        const player = {
            id: socket.id,
            name: playerData.name || `Player_${socket.id.slice(-4)}`,
            position: { 
                x: startX, 
                y: 0, 
                z: startZ 
            },
            rotation: playerData.rotation || { x: 0, y: 0, z: 0 },
            level: playerData.level || 1,
            skills: playerData.skills || {},
            inventory: playerData.inventory || [],
            equipment: playerData.equipment || {},
            connectedAt: Date.now()
        };
        
        gameState.players.set(socket.id, player);
        
        console.log(`🌍 Player ${player.name} joined at position (${startX.toFixed(1)}, 0, ${startZ.toFixed(1)})`);
        
        // Notify other players about the new player
        socket.broadcast.emit('player_join', player);
        
        // Send current world state to new player
        socket.emit('world_state', {
            players: Array.from(gameState.players.values()),
            resources: Array.from(gameState.resources.values()),
            buildings: Array.from(gameState.buildings.values())
        });
        
        // Send confirmation to the player
        socket.emit('player_joined', {
            success: true,
            player: player,
            message: `Welcome to Egypt MMO, ${player.name}!`
        });
        
        console.log(`✅ Player ${player.name} successfully joined the world`);
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

// Domain validation endpoint
app.get('/api/domain-check', (req, res) => {
    const domainInfo = {
        currentHost: req.headers.host,
        expectedHost: process.env.RAILWAY_PUBLIC_DOMAIN || 'railway.app',
        sslWorking: req.headers['x-forwarded-proto'] === 'https',
        recommendations: []
    };
    
    // Check if using correct domain
    if (req.headers.host && !req.headers.host.includes('railway.app')) {
        domainInfo.recommendations.push('Using custom domain - check SSL certificate');
    }
    
    if (req.headers['x-forwarded-proto'] !== 'https') {
        domainInfo.recommendations.push('Not using HTTPS - SSL certificate not needed');
    }
    
    console.log('Domain Check:', domainInfo);
    res.json(domainInfo);
});

// SSL status endpoint
app.get('/api/ssl-status', (req, res) => {
    const sslInfo = {
        ssl: req.headers['x-forwarded-proto'] === 'https',
        host: req.headers.host,
        userAgent: req.headers['user-agent'],
        forwardedProto: req.headers['x-forwarded-proto'],
        railway: !!process.env.PORT,
        url: req.url,
        headers: {
            'x-forwarded-host': req.headers['x-forwarded-host'],
            'x-forwarded-proto': req.headers['x-forwarded-proto'],
            'x-forwarded-for': req.headers['x-forwarded-for']
        }
    };
    
    console.log('SSL Status Request:', sslInfo);
    res.json(sslInfo);
});

// Test endpoint
app.get('/test', (req, res) => {
    res.json({
        message: 'Egypt MMO Server is running!',
        timestamp: new Date().toISOString(),
        connectedPlayers: gameState.players.size,
        players: Array.from(gameState.players.values()).map(p => ({
            name: p.name,
            position: p.position
        }))
    });
});

// Health check
app.get('/health', (req, res) => {
    console.log(`🏥 Health check requested from: ${req.ip}`);
    console.log(`🏥 Starting health check response...`);
    
    try {
        // Simple, reliable health check
        const healthData = { 
            status: 'healthy', 
            timestamp: new Date().toISOString(),
            port: PORT,
            uptime: process.uptime()
        };
        
        console.log(`🏥 Health check data prepared:`, healthData);
        console.log(`🏥 Sending response...`);
        
        res.status(200).json(healthData);
        
        console.log(`🏥 Health check response sent successfully`);
    } catch (error) {
        console.log(`🏥 Health check error:`, error);
        res.status(500).json({ error: 'Health check failed', message: error.message });
    }
});

// Serve the game (both development and production)
app.get('*', (req, res) => {
    console.log(`🌐 Request to: ${req.url} from ${req.ip}`);
    console.log(`🌐 Headers:`, req.headers);
    
    const indexPath = path.join(__dirname, '../dist/index.html');
    console.log(`🌐 Serving index.html from: ${indexPath}`);
    
    if (require('fs').existsSync(indexPath)) {
        console.log(`✅ index.html found, serving...`);
        res.sendFile(indexPath);
    } else {
        console.log(`❌ index.html NOT found at: ${indexPath}`);
        res.status(404).json({ 
            error: 'Game files not found',
            path: indexPath,
            currentDir: __dirname,
            files: require('fs').readdirSync(__dirname)
        });
    }
});

// Start server
const PORT = process.env.PORT || 3000; // Use Railway's PORT or fallback to 3000
server.listen(PORT, '0.0.0.0', () => {
    const railwayDomain = process.env.RAILWAY_PUBLIC_DOMAIN || 'railway.app';
    console.log(`🏺 Egypt MMO Server running on port ${PORT}`);
    console.log(`🌐 Server URL: ${process.env.PORT ? `https://${railwayDomain}` : `http://localhost:${PORT}`}`);
    console.log(`📊 Health check: ${process.env.PORT ? `https://${railwayDomain}/health` : `http://localhost:${PORT}/health`}`);
    console.log(`🚀 Server ready for multiplayer connections!`);
    console.log(`🔒 SSL: ${process.env.PORT ? 'Enabled (Railway)' : 'Local development'}`);
    console.log(`📡 Listening on: 0.0.0.0:${PORT}`);
    console.log(`📁 Current directory: ${__dirname}`);
    console.log(`📁 Dist path: ${path.join(__dirname, '../dist')}`);
    console.log(`🔍 Checking if dist folder exists...`);
    
    // Check if dist folder exists
    const fs = require('fs');
    const distPath = path.join(__dirname, '../dist');
    if (fs.existsSync(distPath)) {
        console.log(`✅ Dist folder exists at: ${distPath}`);
        const files = fs.readdirSync(distPath);
        console.log(`📁 Dist folder contains: ${files.join(', ')}`);
    } else {
        console.log(`❌ Dist folder NOT found at: ${distPath}`);
    }
    
    console.log(`🎯 Server is now ready to accept requests on port ${PORT}`);
    console.log(`🎯 Health check endpoint: http://0.0.0.0:${PORT}/health`);
    console.log(`🎯 Root endpoint: http://0.0.0.0:${PORT}/`);
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
