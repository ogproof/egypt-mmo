const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

// Logging system
class Logger {
    constructor() {
        this.logDir = path.join(__dirname, 'logs');
        this.ensureLogDirectory();
        this.logFile = path.join(this.logDir, `server-${new Date().toISOString().split('T')[0]}.log`);
    }

    ensureLogDirectory() {
        if (!fs.existsSync(this.logDir)) {
            fs.mkdirSync(this.logDir, { recursive: true });
        }
    }

    formatMessage(level, message, data = null) {
        const timestamp = new Date().toISOString();
        let logMessage = `[${timestamp}] [${level.toUpperCase()}] ${message}`;
        
        if (data) {
            if (typeof data === 'object') {
                logMessage += `\n${JSON.stringify(data, null, 2)}`;
            } else {
                logMessage += ` ${data}`;
            }
        }
        
        return logMessage;
    }

    log(level, message, data = null) {
        const logMessage = this.formatMessage(level, message, data);
        
        // Console output
        console.log(logMessage);
        
        // File output
        try {
            fs.appendFileSync(this.logFile, logMessage + '\n');
        } catch (error) {
            console.error('Failed to write to log file:', error);
        }
    }

    info(message, data = null) { this.log('info', message, data); }
    warn(message, data = null) { this.log('warn', message, data); }
    error(message, data = null) { this.log('error', message, data); }
    debug(message, data = null) { this.log('debug', message, data); }
}

const logger = new Logger();
logger.info('🚀 Server starting up...');

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
    // Only log game-related requests, not static assets
    if (req.path.startsWith('/sounds/') || req.path.startsWith('/assets/')) {
        return next(); // Skip logging for static assets
    }
    
    logger.info(`📥 Incoming request: ${req.method} ${req.url} from ${req.ip}`);
    
    // Log response completion
    res.on('finish', () => {
        logger.info(`📤 Response sent: ${req.method} ${req.url} - Status: ${res.statusCode}`);
    });
    
    next();
});

// Log viewing endpoint
app.get('/api/logs', (req, res) => {
    try {
        const logFiles = fs.readdirSync(logger.logDir)
            .filter(file => file.endsWith('.log'))
            .sort((a, b) => {
                const aTime = fs.statSync(path.join(logger.logDir, a)).mtime;
                const bTime = fs.statSync(path.join(logger.logDir, b)).mtime;
                return bTime - aTime; // Most recent first
            });

        if (logFiles.length === 0) {
            return res.json({ logs: [], message: 'No log files found' });
        }

        // Get the most recent log file
        const latestLogFile = logFiles[0];
        const logPath = path.join(logger.logDir, latestLogFile);
        const logContent = fs.readFileSync(logPath, 'utf8');
        
        // Get last 100 lines
        const lines = logContent.split('\n').filter(line => line.trim());
        const lastLines = lines.slice(-100);
        
        res.json({
            logFile: latestLogFile,
            totalLines: lines.length,
            lastLines: lastLines,
            message: `Retrieved last ${lastLines.length} lines from ${latestLogFile}`
        });
    } catch (error) {
        logger.error('Failed to read logs:', error);
        res.status(500).json({ error: 'Failed to read logs', details: error.message });
    }
});

// Download specific log file
app.get('/api/logs/:filename', (req, res) => {
    try {
        const filename = req.params.filename;
        const logPath = path.join(logger.logDir, filename);
        
        if (!fs.existsSync(logPath)) {
            return res.status(404).json({ error: 'Log file not found' });
        }
        
        res.download(logPath);
    } catch (error) {
        logger.error('Failed to download log:', error);
        res.status(500).json({ error: 'Failed to download log', details: error.message });
    }
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
    playerSessions: new Map(), // Track multiple sessions per player
    world: {
        size: 1000,
        chunks: new Map()
    },
    resources: new Map(),
    buildings: new Map(),
    // Add synchronized world time
    worldTime: {
        time: 0.35, // Start at 8:24 AM (same as client)
        cycleSpeed: 0.001, // Same speed as client
        lastUpdate: Date.now()
    }
};

// Update world time every second
setInterval(() => {
    const now = Date.now();
    const deltaTime = (now - gameState.worldTime.lastUpdate) / 1000;
    
    // Update time (same calculation as client)
    gameState.worldTime.time += gameState.worldTime.cycleSpeed * deltaTime * 60;
    
    // Wrap around at 24 hours
    if (gameState.worldTime.time >= 1.0) {
        gameState.worldTime.time = 0.0;
    }
    
    gameState.worldTime.lastUpdate = now;
    
    // Broadcast time update to all connected players
    if (gameState.players.size > 0) {
        io.emit('world_time_update', {
            time: gameState.worldTime.time,
            timestamp: now
        });
    }
}, 1000); // Update every second

// Socket.io connection handling
io.on('connection', (socket) => {
    logger.info(`🔌 New socket connection: ${socket.id}`);
    logger.info(`📊 Current players in world: ${gameState.players.size}`);
    
    // Track connection time
    const connectionTime = Date.now();
    
    // Player joins
    socket.on('player_join', (playerData) => {
        logger.info(`🌍 Player join request from ${socket.id}:`, playerData);
        
        // Check if this is a new session for an existing player
        let playerId = playerData.sessionId; // Use session ID if provided
        let isNewPlayer = false;
        
        if (!playerId) {
            // Generate a new player ID for first-time players
            playerId = `player_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            isNewPlayer = true;
        }
        
        // Check if we already have this player
        let player = gameState.players.get(playerId);
        
        if (!player) {
            // Generate a random starting position for the player
            const startX = (Math.random() - 0.5) * 50; // Random position within 50 units
            const startZ = (Math.random() - 0.5) * 50;
            
            player = {
                id: playerId,
                name: playerData.name || `Player_${playerId.slice(-4)}`,
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
                connectedAt: connectionTime,
                sessions: new Set() // Track all active sessions
            };
            
            gameState.players.set(playerId, player);
            logger.info(`🌍 New player ${player.name} created with ID: ${playerId}`);
        } else {
            logger.info(`🌍 Existing player ${player.name} (ID: ${playerId}) joining with new session`);
        }
        
        // Add this socket to the player's sessions
        player.sessions.add(socket.id);
        gameState.playerSessions.set(socket.id, playerId);
        
        logger.info(`🌍 Player ${player.name} joined at position (${player.position.x.toFixed(1)}, 0, ${player.position.z.toFixed(1)})`);
        logger.info(`📊 Total players in world: ${gameState.players.size}`);
        logger.info(`📊 Total active sessions: ${gameState.playerSessions.size}`);
        
        // Notify other players about the new player (only if it's a new player)
        if (isNewPlayer) {
            socket.broadcast.emit('player_join', player);
            logger.info(`📢 Broadcasted player_join to ${gameState.players.size - 1} other players`);
        }
        
        // Send current world state to new player
        const worldState = {
            players: Array.from(gameState.players.values()).map(p => ({
                ...p,
                sessions: undefined // Don't send session info to client
            })),
            resources: Array.from(gameState.resources.values()),
            buildings: Array.from(gameState.buildings.values()),
            // Include synchronized world time
            worldTime: {
                time: gameState.worldTime.time,
                timestamp: gameState.worldTime.lastUpdate
            }
        };
        
        socket.emit('world_state', worldState);
        logger.info(`🌍 Sent world state to ${player.name} with ${worldState.players.length} players and time ${(gameState.worldTime.time * 24).toFixed(1)}h`);
        
        // Send confirmation to the player with their session info
        socket.emit('player_joined', {
            success: true,
            player: {
                ...player,
                sessions: undefined // Don't send session info to client
            },
            sessionId: playerId, // Send back the session ID for future connections
            message: `Welcome to Egypt MMO, ${player.name}!`
        });
        
        logger.info(`✅ Player ${player.name} successfully joined the world`);
    });
    
    // Player movement
    socket.on('player_move', (data) => {
        const playerId = gameState.playerSessions.get(socket.id);
        if (!playerId) {
            logger.warn(`⚠️ Movement update from unknown session: ${socket.id}`);
            return;
        }
        
        const player = gameState.players.get(playerId);
        if (player) {
            player.position = data.position;
            player.rotation = data.rotation;
            player.lastMove = Date.now();
            
            // Broadcast to other players
            socket.broadcast.emit('player_move', {
                playerId: playerId, // Use the actual player ID, not socket ID
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
    
    // Heartbeat to keep connection alive
    socket.on('heartbeat', (data) => {
        // Just acknowledge the heartbeat to keep connection alive
        socket.emit('heartbeat_ack', { timestamp: data.timestamp });
    });
    
    // Chat messages
    socket.on('chat_message', (data) => {
        const playerId = gameState.playerSessions.get(socket.id);
        if (!playerId) {
            console.log(`⚠️ Chat message from unknown session: ${socket.id}`);
            return;
        }
        
        const player = gameState.players.get(playerId);
        if (player) {
            const message = {
                playerId: playerId, // Use the actual player ID, not socket ID
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
    socket.on('disconnect', (reason) => {
        const playerId = gameState.playerSessions.get(socket.id);
        if (playerId) {
            const player = gameState.players.get(playerId);
            if (player) {
                const connectionDuration = Date.now() - connectionTime;
                logger.info(`🔌 Player ${player.name} (session ${socket.id}) disconnected after ${connectionDuration}ms. Reason: ${reason}`);
                
                // Remove this session from the player's sessions
                player.sessions.delete(socket.id);
                gameState.playerSessions.delete(socket.id);
                
                // If this was the last session for this player, remove the player entirely
                if (player.sessions.size === 0) {
                    gameState.players.delete(playerId);
                    logger.info(`🌍 Player ${player.name} completely removed from world (no more active sessions)`);
                    
                    // Notify other players about the player leaving
                    socket.broadcast.emit('player_leave', playerId);
                } else {
                    logger.info(`🌍 Player ${player.name} still has ${player.sessions.size} active sessions`);
                }
                
                logger.info(`📊 Players remaining in world: ${gameState.players.size}`);
                logger.info(`📊 Total active sessions: ${gameState.playerSessions.size}`);
            }
        } else {
            logger.warn(`🔌 Unknown session disconnected: ${socket.id}`);
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

// Debug endpoint to see current world state
app.get('/debug', (req, res) => {
    const worldInfo = {
        message: 'Egypt MMO World Debug Info',
        timestamp: new Date().toISOString(),
        serverPort: PORT,
        connectedPlayers: gameState.players.size,
        players: Array.from(gameState.players.values()).map(p => ({
            id: p.id,
            name: p.name,
            position: p.position,
            connectedAt: p.connectedAt
        })),
        resources: gameState.resources.size,
        buildings: gameState.buildings.size,
        // Add world time info
        worldTime: {
            time: gameState.worldTime.time,
            timeInHours: (gameState.worldTime.time * 24).toFixed(1),
            lastUpdate: new Date(gameState.worldTime.lastUpdate).toISOString()
        },
        uptime: process.uptime()
    };
    
    console.log('🔍 Debug endpoint called, world state:', worldInfo);
    res.json(worldInfo);
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
