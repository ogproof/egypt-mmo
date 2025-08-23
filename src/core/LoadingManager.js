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
        
        this.loadingScreen = document.getElementById('loading-screen');
        this.progressBar = document.querySelector('.loading-progress');
        this.loadingText = document.querySelector('.loading-text');
        
        if (!this.loadingScreen || !this.progressBar || !this.loadingText) {
            throw new Error('Loading screen elements not found');
        }
        
        // Start loading assets
        await this.loadAssets();
        
        this.isInitialized = true; // Mark as initialized
        console.log('✅ Loading Manager initialized');
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
    }

    simulateLoading(duration) {
        return new Promise(resolve => {
            setTimeout(resolve, duration);
        });
    }

    updateProgress(progress) {
        this.loadingProgress = Math.min(progress, 1);
        
        if (this.progressBar) {
            this.progressBar.style.width = `${this.loadingProgress * 100}%`;
        }
    }

    updateLoadingText(text) {
        if (this.loadingText) {
            this.loadingText.textContent = text;
        }
    }

    hide() {
        if (this.loadingScreen) {
            this.loadingScreen.style.opacity = '0';
            setTimeout(() => {
                this.loadingScreen.style.display = 'none';
            }, 500);
        }
    }

    show() {
        if (this.loadingScreen) {
            this.loadingScreen.style.display = 'flex';
            this.loadingScreen.style.opacity = '1';
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
