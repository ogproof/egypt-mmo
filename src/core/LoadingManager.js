export class LoadingManager {
    constructor() {
        this.totalAssets = 0;
        this.loadedAssets = 0;
        this.loadingProgress = 0;
        this.isLoading = true;
        
        this.loadingScreen = null;
        this.progressBar = null;
        this.loadingText = null;
        
        // Asset loading promises
        this.assetPromises = [];
        this.isInitialized = false; // Add initialization guard
    }

    async init() {
        // Prevent double initialization
        if (this.isInitialized) {
            console.warn('⚠️ LoadingManager already initialized, skipping...');
            return;
        }
        
        console.log('📦 Initializing Loading Manager...');
        
        // Try to find loading screen elements
        this.loadingScreen = document.getElementById('loading-screen');
        this.progressBar = document.querySelector('.loading-progress');
        this.loadingText = document.querySelector('.loading-text');
        
        // If loading screen elements are not found, create a minimal loading experience
        if (!this.loadingScreen || !this.progressBar || !this.loadingText) {
            console.log('⚠️ Loading screen elements not found, using minimal loading...');
            this.createMinimalLoading();
        }
        
        // Start loading assets with timeout protection
        await this.loadAssetsWithTimeout();
        
        this.isInitialized = true; // Mark as initialized
        console.log('✅ Loading Manager initialized');
    }

    async loadAssetsWithTimeout() {
        // Add timeout protection to prevent infinite loading
        const loadingPromise = this.loadAssets();
        const timeoutPromise = new Promise((_, reject) => {
            setTimeout(() => reject(new Error('Loading timeout - forcing completion')), 15000); // 15 second timeout
        });
        
        try {
            await Promise.race([loadingPromise, timeoutPromise]);
        } catch (error) {
            if (error.message.includes('timeout')) {
                console.warn('⚠️ Loading timeout reached, forcing completion...');
                this.isLoading = false;
                this.updateLoadingText('Loading complete (timeout reached)');
                
                // Hide loading screen after timeout
                setTimeout(() => {
                    this.hide();
                    console.log('✅ Loading screen hidden after timeout');
                }, 1000);
            } else {
                throw error;
            }
        }
    }

    createMinimalLoading() {
        // Create a minimal loading display in the game container
        let gameContainer = document.getElementById('game-container');
        
        // If game container doesn't exist, create it
        if (!gameContainer) {
            gameContainer = document.createElement('div');
            gameContainer.id = 'game-container';
            gameContainer.style.cssText = `
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                z-index: 999;
            `;
            document.body.appendChild(gameContainer);
            console.log('✅ Created game container for minimal loading');
        }
        
        if (gameContainer) {
            // Create loading elements
            this.loadingScreen = document.createElement('div');
            this.loadingScreen.id = 'minimal-loading-screen';
            this.loadingScreen.style.cssText = `
                position: absolute;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: linear-gradient(135deg, #1e3c72 0%, #2a5298 100%);
                display: flex;
                flex-direction: column;
                justify-content: center;
                align-items: center;
                z-index: 1000;
                color: white;
                font-family: Arial, sans-serif;
            `;
            
            this.loadingText = document.createElement('div');
            this.loadingText.className = 'loading-text';
            this.loadingText.style.cssText = `
                font-size: 1.5rem;
                margin-bottom: 2rem;
                text-align: center;
            `;
            
            this.progressBar = document.createElement('div');
            this.progressBar.className = 'loading-progress';
            this.progressBar.style.cssText = `
                width: 300px;
                height: 20px;
                background: rgba(255,255,255,0.3);
                border-radius: 10px;
                overflow: hidden;
            `;
            
            const progressFill = document.createElement('div');
            progressFill.style.cssText = `
                width: 0%;
                height: 100%;
                background: linear-gradient(45deg, #FFD700, #FFA500);
                transition: width 0.3s ease;
            `;
            
            this.progressBar.appendChild(progressFill);
            this.progressBarFill = progressFill;
            
            this.loadingScreen.appendChild(this.loadingText);
            this.loadingScreen.appendChild(this.progressBar);
            gameContainer.appendChild(this.loadingScreen);
            
            console.log('✅ Created minimal loading screen');
        }
    }

    async loadAssets() {
        const loadingSteps = [
            { name: 'Loading game data...', weight: 0.2 },
            { name: 'Loading 3D models...', weight: 0.3 },
            { name: 'Loading textures...', weight: 0.2 },
            { name: 'Loading audio...', weight: 0.1 },
            { name: 'Initializing systems...', weight: 0.2 }
        ];

        let currentProgress = 0;
        
        for (const step of loadingSteps) {
            this.updateLoadingText(step.name);
            
            // Simulate loading time for each step
            await this.simulateLoading(step.weight * 1000);
            
            currentProgress += step.weight;
            this.updateProgress(currentProgress);
        }
        
        // Final loading step
        this.updateLoadingText('Ready to enter ancient Egypt...');
        await this.simulateLoading(500);
        
        this.isLoading = false;
        
        // Automatically hide loading screen after a short delay
        setTimeout(() => {
            this.hide();
            console.log('✅ Loading screen hidden automatically');
        }, 1000);
    }

    simulateLoading(duration) {
        return new Promise(resolve => {
            setTimeout(resolve, duration);
        });
    }

    updateProgress(progress) {
        this.loadingProgress = Math.min(progress, 1);
        
        if (this.progressBar) {
            // Check if we have the new progress bar structure
            if (this.progressBarFill) {
                this.progressBarFill.style.width = `${this.loadingProgress * 100}%`;
            } else {
                // Fallback to old method
                this.progressBar.style.width = `${this.loadingProgress * 100}%`;
            }
        }
    }

    updateLoadingText(text) {
        if (this.loadingText) {
            this.loadingText.textContent = text;
        }
    }

    hide() {
        if (this.loadingScreen) {
            if (this.loadingScreen.id === 'minimal-loading-screen') {
                // For minimal loading screen, just remove it
                this.loadingScreen.remove();
                console.log('✅ Minimal loading screen removed');
            } else {
                // For original loading screen, fade out
                this.loadingScreen.style.opacity = '0';
                setTimeout(() => {
                    this.loadingScreen.style.display = 'none';
                }, 500);
            }
        }
    }

    show() {
        if (this.loadingScreen) {
            if (this.loadingScreen.id === 'minimal-loading-screen') {
                // For minimal loading screen, ensure it's visible
                this.loadingScreen.style.display = 'flex';
            } else {
                // For original loading screen, show with opacity
                this.loadingScreen.style.display = 'flex';
                this.loadingScreen.style.opacity = '1';
            }
        }
    }

    // Asset loading methods
    addAsset(assetPromise, assetName) {
        this.totalAssets++;
        this.assetPromises.push(assetPromise);
        
        assetPromise.then(() => {
            this.loadedAssets++;
            this.updateAssetProgress();
        }).catch(error => {
            console.error(`Failed to load asset: ${assetName}`, error);
            this.loadedAssets++;
            this.updateAssetProgress();
        });
    }

    updateAssetProgress() {
        if (this.totalAssets > 0) {
            const progress = this.loadedAssets / this.totalAssets;
            this.updateProgress(progress);
        }
    }

    // Get loading status
    isLoading() {
        return this.isLoading;
    }

    getProgress() {
        return this.loadingProgress;
    }

    getLoadedAssets() {
        return this.loadedAssets;
    }

    getTotalAssets() {
        return this.totalAssets;
    }
}
