import { GameEngine } from './core/GameEngine.js';
import { UIManager } from './ui/UIManager.js';
import { OptionsManager } from './ui/OptionsManager.js';
import { NetworkManager } from './network/NetworkManager.js';
import { AudioManager } from './audio/AudioManager.js';
import { LoadingManager } from './core/LoadingManager.js';

class EgyptMMO {
    constructor() {
        this.gameEngine = null;
        this.audioManager = null;
        this.networkManager = null;
        this.uiManager = null;
        this.optionsManager = null;
        this.loadingManager = null;
        this.isInitialized = false;
        this.isInitializing = false; // New flag for initialization state
        
        // User and character data
        this.userData = null;
        this.characterData = null;
    }

    async init() {
        // Check if we should show title screen or start game directly
        const userData = localStorage.getItem('egyptMMO_user');
        const characterData = localStorage.getItem('egyptMMO_character');
        
        if (!userData || !characterData) {
            console.log('🔐 No user session found, title screen will handle initialization');
            return; // Let the title screen handle login/character creation
        }
        
        // Prevent double initialization
        if (this.isInitialized || this.isInitializing) {
            console.warn('⚠️ Egypt MMO already initialized or initializing, skipping...');
            return;
        }
        
        // User is logged in and has character, start game
        this.userData = JSON.parse(userData);
        this.characterData = JSON.parse(characterData);
        
        console.log('👤 User session found:', this.userData.name);
        console.log('👤 Character found:', this.characterData.name);
        
        // Start the game
        await this.startGame();
    }

    async startGame() {
        try {
            console.log('🚀 Starting Egypt MMO...');
            
            // Initialize loading manager first
            this.loadingManager = new LoadingManager();
            await this.loadingManager.init();
            
            // Initialize core systems
            console.log('🔍 Creating core systems...');
            this.audioManager = new AudioManager();
            this.networkManager = new NetworkManager();
            this.gameEngine = new GameEngine();
            this.uiManager = new UIManager();
            this.optionsManager = new OptionsManager(this.gameEngine);
            
            // Initialize systems in parallel for better performance
            await Promise.all([
                this.audioManager.init(),
                this.networkManager.init(),
                this.gameEngine.init(),
                this.uiManager.init(),
                this.optionsManager.init()
            ]);
            
            // Connect systems
            this.gameEngine.setUIManager(this.uiManager);
            this.gameEngine.setNetworkManager(this.networkManager);
            this.gameEngine.setAudioManager(this.audioManager);
            this.gameEngine.setOptionsManager(this.optionsManager);
            this.gameEngine.setLoadingManager(this.loadingManager);
            
            // Set player name from character data
            if (this.characterData && this.characterData.name) {
                this.gameEngine.setPlayerName(this.characterData.name);
            }
            
            // Setup event listeners
            this.setupEventListeners();
            
            // Mark as initialized
            this.isInitialized = true;
            this.isInitializing = false;
            console.log('✅ Egypt MMO started successfully!');
            
            // Start the game loop
            await this.start();
            
        } catch (error) {
            this.isInitializing = false;
            console.error('Failed to initialize Egypt MMO:', error);
            
            // Show more specific error messages
            let errorMessage = 'Initialization failed';
            
            if (error.message.includes('protectImportantObjects')) {
                errorMessage = 'World initialization failed - missing required methods';
            } else if (error.message.includes('detectStore')) {
                errorMessage = 'Redux DevTools error (safe to ignore)';
            } else if (error.message.includes('AudioContext')) {
                errorMessage = 'Audio initialization failed - try clicking on the page first';
            } else {
                errorMessage = `Initialization failed: ${error.message}`;
            }
            
            this.showErrorScreen({ message: errorMessage });
        }
    }

    async start() {
        console.log('🎮 Starting Egypt MMO...');
        
        // Hide loading screen
        this.loadingManager.hide();
        
        // Show game UI
        this.uiManager.show();
        
        // Start game loop
        this.gameEngine.start();
        
        // Connect to network
        try {
            console.log('🌐 Connecting to network...');
            await this.networkManager.connect();
            console.log('✅ Network connection established');
            
            // Wait a moment for connection to stabilize
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            // Join the world
            if (this.gameEngine && !this.gameEngine.worldJoined) {
                console.log('🌍 Joining world after network connection...');
                await this.gameEngine.joinWorld();
            }
        } catch (error) {
            console.warn('⚠️ Network connection failed, running in single-player mode:', error.message);
        }
        
        console.log('✅ Egypt MMO started successfully!');
        
        // Add window event listeners
        this.setupEventListeners();
    }

    setupEventListeners() {
        // Handle window resize with debouncing
        let resizeTimeout;
        window.addEventListener('resize', () => {
            if (this.gameEngine) {
                // Clear existing timeout
                if (resizeTimeout) {
                    clearTimeout(resizeTimeout);
                }
                
                // Set new timeout for debounced resize
                resizeTimeout = setTimeout(() => {
                    this.gameEngine.handleResize();
                }, 150);
            }
        });

        // Handle page visibility changes
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                this.gameEngine?.pause();
            } else {
                this.gameEngine?.resume();
                
                // Restore viewport when page becomes visible (dev tools closed)
                setTimeout(() => {
                    if (this.gameEngine) {
                        this.gameEngine.restoreViewport();
                    }
                }, 100);
            }
        });

        // Handle focus events (when dev tools are closed)
        window.addEventListener('focus', () => {
            // Restore viewport when window regains focus
            setTimeout(() => {
                if (this.gameEngine) {
                    this.gameEngine.restoreViewport();
                }
            }, 100);
        });

        // Handle beforeunload
        window.addEventListener('beforeunload', () => {
            this.networkManager?.disconnect();
        });

        // Debug shortcuts
        document.addEventListener('keydown', (event) => {
            if (event.key === 'F1') {
                console.log('🔍 Debug: Multiplayer Status');
                if (window.egyptMMO?.networkManager) {
                    const status = window.egyptMMO.networkManager.getConnectionStatus();
                    console.log('Network Status:', status);
                }
            }
            
            if (event.key === 'F2') {
                console.log('🔍 Debug: Testing Movement Sync');
                if (window.egyptMMO?.gameEngine?.player) {
                    const player = window.egyptMMO.gameEngine.player;
                    const testPosition = player.position.clone();
                    testPosition.x += 5;
                    testPosition.z += 5;
                    window.egyptMMO.networkManager.sendPlayerPosition(testPosition);
                    console.log('📡 Sent test position:', testPosition);
                }
            }
            
            if (event.key === 'F3') {
                console.log('🔍 Debug: Testing Network Connection');
                if (window.egyptMMO?.networkManager) {
                    window.egyptMMO.networkManager.testConnection();
                }
            }
            
            if (event.key === 'F4') {
                console.log('🔍 Debug: Show All Players');
                if (window.egyptMMO?.gameEngine) {
                    window.egyptMMO.gameEngine.debugShowAllPlayers();
                }
            }
        });
    }

    showErrorScreen(error) {
        const loadingScreen = document.getElementById('loading-screen');
        if (loadingScreen) {
            loadingScreen.innerHTML = `
                <div class="loading-content">
                    <div class="egyptian-symbol">⚠️</div>
                    <h1>Initialization Failed</h1>
                    <p>${error.message}</p>
                    <button onclick="location.reload()" class="action-btn">🔄 Retry</button>
                </div>
            `;
        }
    }
}

// Initialize the game when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    console.log('🎮 Initializing Egypt MMO...');
    
    const game = new EgyptMMO();
    window.egyptMMO = game; // Make accessible globally for debugging
    
    // Start the game
    game.init();
});

// Export for module usage
export { EgyptMMO };
