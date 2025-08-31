import { io } from 'socket.io-client';

export class NetworkManager {
    constructor() {
        this.socket = null;
        this.isConnected = false;
        // Use the actual Railway domain for production
        this.serverUrl = window.location.hostname === 'localhost' 
            ? 'http://localhost:3001' 
            : 'https://egypt-mmo-production.up.railway.app';
        this.playerId = null;
        this.players = new Map();
        
        // Event callbacks
        this.onPlayerJoin = null;
        this.onPlayerLeave = null;
        this.onPlayerMove = null;
        this.onChatMessage = null;
        this.onWorldUpdate = null;
        
        // Reconnection settings
        this.reconnectAttempts = 0;
        this.maxReconnectAttempts = 5;
        this.reconnectDelay = 1000;

        this.isInitialized = false;
    }

    async init() {
        // Prevent double initialization
        if (this.isInitialized) {
            console.warn('⚠️ NetworkManager already initialized, skipping...');
            return;
        }
        
        console.log('🌐 Initializing Network Manager...');
        
        this.socket = null;
        this.isConnected = false;
        this.playerId = null;
        this.reconnectAttempts = 0;
        this.maxReconnectAttempts = 3;
        
        this.isInitialized = true; // Mark as initialized
        console.log('✅ Network Manager initialized');
    }

    simulateNetworkConnection() {
        // Simulate connection delay
        setTimeout(() => {
            this.isConnected = true;
            
            // If player ID is already set (by GameEngine), use it; otherwise generate one
            if (!this.playerId) {
                this.playerId = this.generatePlayerId();
            }
            
            console.log(`🌐 Connected to server (simulated) - Player ID: ${this.playerId}`);
            
            // Simulate other players joining
            this.simulateOtherPlayers();
        }, 1000);
    }

    generatePlayerId() {
        return 'player_' + Math.random().toString(36).substr(2, 9);
    }

    simulateOtherPlayers() {
        // Simulate a few other players in the world (excluding the local player)
        const playerNames = ['Anubis', 'Cleopatra', 'Ramses', 'Nefertiti'];
        
        playerNames.forEach((name, index) => {
            // Skip if this is the local player's name
            if (name === this.playerId) {
                console.log(`🔄 Skipping local player ${name} from simulated players`);
                return;
            }
            
            setTimeout(() => {
                const playerData = {
                    id: `player_${index}`,
                    name: name,
                    position: { x: (Math.random() - 0.5) * 100, y: 0, z: (Math.random() - 0.5) * 100 },
                    level: Math.floor(Math.random() * 20) + 1
                };
                
                if (this.onPlayerJoin) {
                    this.onPlayerJoin(playerData);
                }
            }, (index + 1) * 2000);
        });
    }

    // Real network methods (for future implementation)
    async connect() {
        try {
            console.log(`🌐 Attempting to connect to: ${this.serverUrl}`);
            
            this.socket = io(this.serverUrl, {
                transports: ['websocket'],
                timeout: 10000, // Increased timeout for Railway
                reconnection: true, // Enable reconnection for multiplayer
                reconnectionAttempts: 5,
                reconnectionDelay: 1000,
                pingTimeout: 60000, // 60 second ping timeout
                pingInterval: 25000  // 25 second ping interval
            });

            this.setupSocketEvents();
            
            return new Promise((resolve, reject) => {
                // Add timeout to prevent hanging
                const timeout = setTimeout(() => {
                    reject(new Error('Connection timeout - running in single-player mode'));
                }, 10000);

                this.socket.on('connect', () => {
                    clearTimeout(timeout);
                    this.isConnected = true;
                    this.playerId = this.socket.id;
                    console.log(`🌐 Connected to Railway server - Player ID: ${this.playerId}`);
                    
                    // Start connection heartbeat
                    this.startHeartbeat();
                    
                    // Join the world immediately after connection
                    this.joinWorld();
                    resolve();
                });

                this.socket.on('connect_error', (error) => {
                    clearTimeout(timeout);
                    console.log('🌐 Connection failed, running in single-player mode:', error.message);
                    reject(new Error('No server available - running in single-player mode'));
                });
            });
        } catch (error) {
            console.error('Failed to connect to server:', error);
            throw error;
        }
    }
    
    // Start connection heartbeat
    startHeartbeat() {
        if (this.heartbeatInterval) {
            clearInterval(this.heartbeatInterval);
        }
        
        this.heartbeatInterval = setInterval(() => {
            if (this.socket && this.isConnected) {
                this.socket.emit('heartbeat', { timestamp: Date.now() });
            }
        }, 30000); // Send heartbeat every 30 seconds
    }
    
    // Stop connection heartbeat
    stopHeartbeat() {
        if (this.heartbeatInterval) {
            clearInterval(this.heartbeatInterval);
            this.heartbeatInterval = null;
        }
    }

    setupSocketEvents() {
        if (!this.socket) return;

        console.log('🔧 Setting up Socket.IO event handlers...');

        this.socket.on('disconnect', (reason) => {
            this.isConnected = false;
            console.log('🌐 Disconnected from server. Reason:', reason);
            
            // Attempt to reconnect if it wasn't intentional
            if (reason !== 'io client disconnect') {
                console.log('🔄 Attempting to reconnect...');
                setTimeout(() => {
                    if (!this.isConnected) {
                        this.connect().catch(err => {
                            console.log('🔄 Reconnection failed:', err.message);
                        });
                    }
                }, 2000);
            }
        });

        this.socket.on('connect_error', (error) => {
            console.log('🌐 Connection error:', error.message);
        });

        this.socket.on('error', (error) => {
            console.log('🌐 Socket error:', error);
        });

        this.socket.on('player_join', (playerData) => {
            console.log('👥 Received player_join event:', playerData);
            if (this.onPlayerJoin) {
                this.onPlayerJoin(playerData);
            } else {
                console.log('❌ No onPlayerJoin callback set');
            }
        });

        this.socket.on('player_leave', (playerId) => {
            console.log('👥 Received player_leave event:', playerId);
            if (this.onPlayerLeave) {
                this.onPlayerLeave(playerId);
            } else {
                console.log('❌ No onPlayerLeave callback set');
            }
        });

        // Handle player movement
        this.socket.on('player_move', (data) => {
            // Filter out our own movement updates to prevent duplicates
            if (data.playerId === this.playerId) {
                console.log(`🔄 Ignoring own movement update for player ${data.playerId}`);
                return;
            }
            
            console.log(`👥 Received movement update for player ${data.playerId}:`, data);
            
            if (this.onPlayerMove) {
                this.onPlayerMove(data);
            } else {
                console.log('❌ No onPlayerMove callback set');
            }
        });

        this.socket.on('world_state', (worldData) => {
            console.log('🌍 Received world_state event:', worldData);
            if (this.onWorldUpdate) {
                this.onWorldUpdate(worldData);
            } else {
                console.log('❌ No onWorldUpdate callback set');
            }
        });

        this.socket.on('world_time_update', (timeData) => {
            console.log('🕐 Received world_time_update event:', timeData);
            if (this.onTimeUpdate) {
                this.onTimeUpdate(timeData);
            } else {
                console.log('❌ No onTimeUpdate callback set');
            }
        });

        this.socket.on('chat_message', (message) => {
            console.log('💬 Received chat_message event:', message);
            if (this.onChatMessage) {
                this.onChatMessage(message);
            } else {
                console.log('❌ No onChatMessage callback set');
            }
        });

        this.socket.on('player_joined', (data) => {
            console.log('✅ Received player_joined confirmation:', data);
        });

        console.log('✅ Socket.IO event handlers set up successfully');
    }

    disconnect() {
        if (this.socket) {
            this.socket.disconnect();
            this.socket = null;
        }
        this.isConnected = false;
        this.playerId = null;
        
        // Stop heartbeat
        this.stopHeartbeat();
        
        console.log('🌐 Disconnected from server');
    }

    // Join the game world
    joinWorld() {
        if (!this.socket || !this.isConnected) return;
        
        const playerData = {
            name: `Player_${Math.floor(Math.random() * 1000)}`,
            position: { x: 0, y: 0, z: 0 },
            rotation: { x: 0, y: 0, z: 0 },
            level: 1,
            skills: {},
            inventory: [],
            equipment: {}
        };
        
        console.log('🌍 Joining the Egypt MMO world...');
        this.socket.emit('player_join', playerData);
    }

    // Send player position to server
    sendPlayerPosition(position) {
        if (!this.socket || !this.isConnected) {
            console.warn('⚠️ Cannot send position - not connected to server');
            return;
        }
        
        // Include player ID to prevent receiving own updates
        const positionData = {
            playerId: this.playerId,
            position: position,
            timestamp: Date.now()
        };
        
        this.socket.emit('player_move', positionData);
        console.log(`📡 Sent position update for player ${this.playerId}:`, position);
    }

    sendPlayerAction(action, data) {
        if (this.socket && this.isConnected) {
            this.socket.emit('player_action', {
                action: action,
                data: data,
                timestamp: Date.now()
            });
        }
    }

    // Chat system
    sendChatMessage(message, channel = 'global') {
        if (this.socket && this.isConnected) {
            this.socket.emit('chat_message', {
                message: message,
                channel: channel,
                timestamp: Date.now()
            });
        }
    }

    // Crafting and trading
    sendCraftRequest(itemId, materials) {
        if (this.socket && this.isConnected) {
            this.socket.emit('craft_request', {
                itemId: itemId,
                materials: materials,
                timestamp: Date.now()
            });
        }
    }

    sendTradeRequest(targetPlayerId, items, gold) {
        if (this.socket && this.isConnected) {
            this.socket.emit('trade_request', {
                targetPlayerId: targetPlayerId,
                items: items,
                gold: gold,
                timestamp: Date.now()
            });
        }
    }

    // World interaction
    sendResourceGather(resourceId, position) {
        if (this.socket && this.isConnected) {
            this.socket.emit('resource_gather', {
                resourceId: resourceId,
                position: position,
                timestamp: Date.now()
            });
        }
    }

    sendBuildingPlace(buildingType, position, rotation) {
        if (this.socket && this.isConnected) {
            this.socket.emit('building_place', {
                buildingType: buildingType,
                position: position,
                rotation: rotation,
                timestamp: Date.now()
            });
        }
    }

    // Event callback setters
    onPlayerJoin(callback) {
        this.onPlayerJoin = callback;
    }

    onPlayerLeave(callback) {
        this.onPlayerLeave = callback;
    }

    onPlayerMove(callback) {
        this.onPlayerMove = callback;
    }

    onChatMessage(callback) {
        this.onChatMessage = callback;
    }

    onWorldUpdate(callback) {
        this.onWorldUpdate = callback;
    }

    // Utility methods
    isConnected() {
        return this.isConnected;
    }

    getPlayerId() {
        return this.playerId;
    }

    // Set player ID (called by GameEngine to prevent duplicates)
    setPlayerId(id) {
        this.playerId = id;
        console.log(`🆔 Network player ID set to: ${id}`);
    }

    // Get connected players
    getConnectedPlayers() {
        return Array.from(this.players.values());
    }

    // Performance monitoring
    getNetworkStats() {
        if (!this.socket) return null;
        
        return {
            connected: this.isConnected,
            latency: this.socket.connected ? this.socket.io.engine.ping : null,
            transport: this.socket.io.engine.transport.name,
            reconnectionAttempts: this.reconnectAttempts
        };
    }

    // Test network connection
    testConnection() {
        if (this.socket && this.isConnected) {
            console.log('🌐 Testing network connection...');
            this.socket.emit('heartbeat', { timestamp: Date.now() });
            return true;
        } else {
            console.warn('⚠️ Network not connected for testing');
            return false;
        }
    }

    // Get connection status
    getConnectionStatus() {
        return {
            connected: this.isConnected,
            socketId: this.socket?.id,
            playerId: this.playerId,
            serverUrl: this.serverUrl
        };
    }

    // Cleanup
    destroy() {
        this.disconnect();
        this.players.clear();
        console.log('🌐 Network Manager destroyed');
    }
}
