import { GameEngine } from './core/GameEngine.js';
import { UIManager } from './ui/UIManager.js';
import { OptionsManager } from './ui/OptionsManager.js';
import { NetworkManager } from './network/NetworkManager.js';
import { AudioManager } from './audio/AudioManager.js';
import { LoadingManager } from './core/LoadingManager.js';

class EgyptMMO {
    constructor() {
        this.gameEngine = null;
        this.uiManager = null;
        this.optionsManager = null;
        this.networkManager = null;
        this.audioManager = null;
        this.loadingManager = null;
        this.isInitialized = false;
    }

    async init() {
        // Prevent double initialization
        if (this.isInitialized) {
            console.warn('⚠️ Egypt MMO already initialized, skipping...');
            return;
        }
        
        try {
            // Handle Redux DevTools errors gracefully
            window.addEventListener('error', (event) => {
                if (event.error && event.error.message && event.error.message.includes('detectStore')) {
                    // Ignore Redux DevTools errors
                    event.preventDefault();
                    console.log('ℹ️ Redux DevTools error ignored (safe to ignore)');
                    return;
                }
            });
            
            console.log('🚀 Initializing Egypt MMO...');
            console.log('🔍 Init called at:', new Date().toISOString());
            console.log('🔍 Stack trace:', new Error().stack);
            
            // Initialize loading manager first
            this.loadingManager = new LoadingManager();
            await this.loadingManager.init();
            
            // Initialize core systems
            console.log('🔍 Creating AudioManager...');
            this.audioManager = new AudioManager();
            console.log('🔍 Creating NetworkManager...');
            this.networkManager = new NetworkManager();
            console.log('🔍 Creating GameEngine...');
            this.gameEngine = new GameEngine();
            console.log('🔍 Creating UIManager...');
            this.uiManager = new UIManager();
            console.log('🔍 Creating OptionsManager...');
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
            this.uiManager.setGameEngine(this.gameEngine);
            
            // Start the game
            await this.start();
            
        } catch (error) {
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
        
        // Connect to server
        await this.networkManager.connect();
        
        this.isInitialized = true;
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
    // Check if already initialized (Vite hot reload protection)
    if (window.egyptMMO) {
        console.log('🔄 Vite hot reload detected, skipping re-initialization');
        return;
    }
    
    // Add global initialization guard
    if (window.gameInitializing) {
        console.log('🔄 Game initialization already in progress, skipping...');
        return;
    }
    
    window.gameInitializing = true;
    
    const game = new EgyptMMO();
    window.egyptMMO = game; // Make accessible globally for debugging
    
    // Start the game
    game.init().finally(() => {
        window.gameInitializing = false;
    });
});

// Export for module usage
export { EgyptMMO };
