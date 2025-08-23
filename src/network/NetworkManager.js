import { io } from 'socket.io-client';

export class NetworkManager {
    constructor() {
        this.socket = null;
        this.isConnected = false;
        this.serverUrl = 'http://localhost:3001';
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

        this.isInitialized = false; // Add this line
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
            this.playerId = this.generatePlayerId();
            console.log(`🌐 Connected to server (simulated) - Player ID: ${this.playerId}`);
            
            // Simulate other players joining
            this.simulateOtherPlayers();
        }, 1000);
    }

    generatePlayerId() {
        return 'player_' + Math.random().toString(36).substr(2, 9);
    }

    simulateOtherPlayers() {
        // Simulate a few other players in the world
        const playerNames = ['Anubis', 'Cleopatra', 'Ramses', 'Nefertiti'];
        
        playerNames.forEach((name, index) => {
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
                    this.socket = io(this.serverUrl, {
            transports: ['websocket'],
            timeout: 5000, // Reduced timeout
            reconnection: false, // Disable reconnection for single-player
            reconnectionAttempts: 0, // No retry attempts
            reconnectionDelay: 0
        });

            this.setupSocketEvents();
            
                        return new Promise((resolve, reject) => {
                // Add timeout to prevent hanging
                const timeout = setTimeout(() => {
                    reject(new Error('Connection timeout - running in single-player mode'));
                }, 3000);

                this.socket.on('connect', () => {
                    clearTimeout(timeout);
                    this.isConnected = true;
                    this.playerId = this.socket.id;
                    console.log(`🌐 Connected to server - Player ID: ${this.playerId}`);
                    resolve();
                });

                this.socket.on('connect_error', (error) => {
                    clearTimeout(timeout);
                    console.log('🌐 Single-player mode: No server available');
                    reject(new Error('No server available - running in single-player mode'));
                });
            });
        } catch (error) {
            console.error('Failed to connect to server:', error);
            throw error;
        }
    }

    setupSocketEvents() {
        if (!this.socket) return;

        this.socket.on('disconnect', () => {
            this.isConnected = false;
            console.log('🌐 Disconnected from server');
        });

        this.socket.on('player_join', (playerData) => {
            if (this.onPlayerJoin) {
                this.onPlayerJoin(playerData);
            }
        });

        this.socket.on('player_leave', (playerId) => {
            if (this.onPlayerLeave) {
                this.onPlayerLeave(playerId);
            }
        });

        this.socket.on('player_move', (data) => {
            if (this.onPlayerMove) {
                this.onPlayerMove(data);
            }
        });

        this.socket.on('chat_message', (message) => {
            if (this.onChatMessage) {
                this.onChatMessage(message);
            }
        });

        this.socket.on('world_update', (update) => {
            if (this.onWorldUpdate) {
                this.onWorldUpdate(update);
            }
        });
    }

    disconnect() {
        if (this.socket) {
            this.socket.disconnect();
            this.socket = null;
        }
        this.isConnected = false;
        this.playerId = null;
        console.log('🌐 Disconnected from server');
    }

    // Player movement
    sendPlayerPosition(position) {
        if (this.socket && this.isConnected) {
            this.socket.emit('player_move', {
                position: position,
                timestamp: Date.now()
            });
        }
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

    // Cleanup
    destroy() {
        this.disconnect();
        this.players.clear();
        console.log('🌐 Network Manager destroyed');
    }
}
