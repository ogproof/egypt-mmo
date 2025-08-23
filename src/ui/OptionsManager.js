import * as THREE from 'three';

export class OptionsManager {
    constructor(gameEngine) {
        this.gameEngine = gameEngine;
        this.optionsMenu = null;
        this.isOpen = false;
        
        // Default settings
        this.settings = {
            graphics: {
                quality: 'medium',
                renderDistance: 'medium',
                shadowQuality: 'medium',
                antiAliasing: 'fxaa',
                particleEffects: 'medium',
                vsync: 'on',
                fpsLimit: '60'
            },
            audio: {
                masterVolume: 50,
                musicVolume: 70,
                sfxVolume: 80
            },
            controls: {
                mouseSensitivity: 1.0,
                cameraSpeed: 1.0
            }
        };
        
        this.isInitialized = false; // Initialize the flag
    }
    
    async init() {
        // Prevent double initialization
        if (this.isInitialized) {
            console.warn('⚠️ OptionsManager already initialized, skipping...');
            return;
        }
        
        console.log('⚙️ Initializing Options Manager...');
        
        // Initialize DOM elements
        this.optionsMenu = document.getElementById('options-menu');
        if (!this.optionsMenu) {
            console.error('❌ Options menu element not found in DOM');
            return;
        }
        
        this.loadSettings();
        this.setupEventListeners();
        this.updateUI();
        
        this.isInitialized = true; // Mark as initialized
        console.log('✅ Options Manager initialized');
    }
    
    setupEventListeners() {
        // Check if options menu exists
        if (!this.optionsMenu) {
            console.error('❌ Options menu not initialized, cannot setup event listeners');
            return;
        }
        
        // Note: Escape key is handled by GameEngine, not here
        
        // Close button
        const closeBtn = document.getElementById('close-options');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => this.closeOptions());
        }
        
        // Tab switching
        const tabBtns = document.querySelectorAll('.tab-btn');
        tabBtns.forEach(btn => {
            btn.addEventListener('click', () => this.switchTab(btn.dataset.tab));
        });
        
        // Apply settings
        const applyBtn = document.getElementById('apply-settings');
        if (applyBtn) {
            applyBtn.addEventListener('click', () => this.applySettings());
        }
        
        // Reset settings
        const resetBtn = document.getElementById('reset-settings');
        if (resetBtn) {
            resetBtn.addEventListener('click', () => this.resetSettings());
        }
        
        // Range input updates
        this.setupRangeInputs();
        
        // Click outside to close
        this.optionsMenu.addEventListener('click', (e) => {
            if (e.target === this.optionsMenu) {
                this.closeOptions();
            }
        });
    }
    
    setupRangeInputs() {
        // Master volume
        const masterVolume = document.getElementById('master-volume');
        const masterVolumeValue = document.getElementById('master-volume-value');
        if (masterVolume && masterVolumeValue) {
            masterVolume.addEventListener('input', (e) => {
                masterVolumeValue.textContent = `${e.target.value}%`;
            });
        }
        
        // Music volume
        const musicVolume = document.getElementById('music-volume');
        const musicVolumeValue = document.getElementById('music-volume-value');
        if (musicVolume && musicVolumeValue) {
            musicVolume.addEventListener('input', (e) => {
                musicVolumeValue.textContent = `${e.target.value}%`;
            });
        }
        
        // SFX volume
        const sfxVolume = document.getElementById('sfx-volume');
        const sfxVolumeValue = document.getElementById('sfx-volume-value');
        if (sfxVolume && sfxVolumeValue) {
            sfxVolume.addEventListener('input', (e) => {
                sfxVolumeValue.textContent = `${e.target.value}%`;
            });
        }
        
        // Mouse sensitivity
        const mouseSensitivity = document.getElementById('mouse-sensitivity');
        const mouseSensitivityValue = document.getElementById('mouse-sensitivity-value');
        if (mouseSensitivity && mouseSensitivityValue) {
            mouseSensitivity.addEventListener('input', (e) => {
                mouseSensitivityValue.textContent = e.target.value;
            });
        }
        
        // Camera speed
        const cameraSpeed = document.getElementById('camera-speed');
        const cameraSpeedValue = document.getElementById('camera-speed-value');
        if (cameraSpeed && cameraSpeedValue) {
            cameraSpeed.addEventListener('input', (e) => {
                cameraSpeedValue.textContent = e.target.value;
            });
        }
    }
    
    toggleOptions() {
        console.log('⚙️ toggleOptions called - current state:', this.isOpen);
        if (this.isOpen) {
            console.log('⚙️ Closing options...');
            this.closeOptions();
        } else {
            console.log('⚙️ Opening options...');
            this.openOptions();
        }
    }
    
    openOptions() {
        console.log('⚙️ openOptions - showing options menu...');
        this.optionsMenu.classList.remove('hidden');
        this.isOpen = true;
        this.updateUI();
        console.log('⚙️ Options menu should now be visible');
    }
    
    closeOptions() {
        console.log('⚙️ closeOptions - hiding options menu...');
        this.optionsMenu.classList.add('hidden');
        this.isOpen = false;
        console.log('⚙️ Options menu should now be hidden');
    }
    
    switchTab(tabName) {
        // Remove active class from all tabs and content
        document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
        document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
        
        // Add active class to selected tab and content
        document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');
        document.getElementById(`${tabName}-tab`).classList.add('active');
    }
    
    updateUI() {
        // Update video settings
        const graphicsQuality = document.getElementById('graphics-quality');
        if (graphicsQuality) graphicsQuality.value = this.settings.graphics.quality;
        
        const renderDistance = document.getElementById('render-distance');
        if (renderDistance) renderDistance.value = this.settings.graphics.renderDistance;
        
        const shadowQuality = document.getElementById('shadow-quality');
        if (shadowQuality) shadowQuality.value = this.settings.graphics.shadowQuality;
        
        const antiAliasing = document.getElementById('anti-aliasing');
        if (antiAliasing) antiAliasing.value = this.settings.graphics.antiAliasing;
        
        const particleEffects = document.getElementById('particle-effects');
        if (particleEffects) particleEffects.value = this.settings.graphics.particleEffects;
        
        const vsync = document.getElementById('vsync');
        if (vsync) vsync.value = this.settings.graphics.vsync;
        
        const fpsLimit = document.getElementById('fps-limit');
        if (fpsLimit) fpsLimit.value = this.settings.graphics.fpsLimit;
        
        // Update audio settings
        const masterVolume = document.getElementById('master-volume');
        const masterVolumeValue = document.getElementById('master-volume-value');
        if (masterVolume && masterVolumeValue) {
            masterVolume.value = this.settings.audio.masterVolume;
            masterVolumeValue.textContent = `${this.settings.audio.masterVolume}%`;
        }
        
        const musicVolume = document.getElementById('music-volume');
        const musicVolumeValue = document.getElementById('music-volume-value');
        if (musicVolume && musicVolumeValue) {
            musicVolume.value = this.settings.audio.musicVolume;
            musicVolumeValue.textContent = `${this.settings.audio.musicVolume}%`;
        }
        
        const sfxVolume = document.getElementById('sfx-volume');
        const sfxVolumeValue = document.getElementById('sfx-volume-value');
        if (sfxVolume && sfxVolumeValue) {
            sfxVolume.value = this.settings.audio.sfxVolume;
            sfxVolumeValue.textContent = `${this.settings.audio.sfxVolume}%`;
        }
        
        // Update control settings
        const mouseSensitivity = document.getElementById('mouse-sensitivity');
        const mouseSensitivityValue = document.getElementById('mouse-sensitivity-value');
        if (mouseSensitivity && mouseSensitivityValue) {
            mouseSensitivity.value = this.settings.controls.mouseSensitivity;
            mouseSensitivityValue.textContent = this.settings.controls.mouseSensitivity;
        }
        
        const cameraSpeed = document.getElementById('camera-speed');
        const cameraSpeedValue = document.getElementById('camera-speed-value');
        if (cameraSpeed && cameraSpeedValue) {
            cameraSpeed.value = this.settings.controls.cameraSpeed;
            cameraSpeedValue.textContent = this.settings.controls.cameraSpeed;
        }
    }
    
    async applySettings() {
        // Get current values from UI
        this.settings.graphics.quality = document.getElementById('graphics-quality').value;
        this.settings.graphics.renderDistance = document.getElementById('render-distance').value;
        this.settings.graphics.shadowQuality = document.getElementById('shadow-quality').value;
        this.settings.graphics.antiAliasing = document.getElementById('anti-aliasing').value;
        this.settings.graphics.particleEffects = document.getElementById('particle-effects').value;
        this.settings.graphics.vsync = document.getElementById('vsync').value;
        this.settings.graphics.fpsLimit = document.getElementById('fps-limit').value;
        
        this.settings.audio.masterVolume = parseInt(document.getElementById('master-volume').value);
        this.settings.audio.musicVolume = parseInt(document.getElementById('music-volume').value);
        this.settings.audio.sfxVolume = parseInt(document.getElementById('sfx-volume').value);
        
        this.settings.controls.mouseSensitivity = parseFloat(document.getElementById('mouse-sensitivity').value);
        this.settings.controls.cameraSpeed = parseFloat(document.getElementById('camera-speed').value);
        
        try {
            // Apply graphics settings to game engine (now async)
            await this.applyGraphicsSettings();
            
            // Apply audio settings
            this.applyAudioSettings();
            
            // Apply control settings
            this.applyControlSettings();
            
            // Save settings
            this.saveSettings();
            
            // Show confirmation
            this.showNotification('Settings applied successfully!');
        } catch (error) {
            console.error('Error applying settings:', error);
            this.showNotification('Failed to apply settings');
        }
    }
    
    async applyGraphicsSettings() {
        // Wait for renderer to be ready
        if (!this.gameEngine.isRendererReady()) {
            console.log('🔧 Waiting for renderer to be ready...');
            await this.gameEngine.waitForRenderer();
        }
        
        try {
            // Graphics quality preset
            this.gameEngine.setGraphicsQuality(this.settings.graphics.quality);
            
            // Shadow quality
            this.gameEngine.setShadowQuality(this.settings.graphics.shadowQuality);
            
            // Anti-aliasing
            const antialiasingEnabled = this.settings.graphics.antiAliasing !== 'off';
            this.gameEngine.setAntiAliasing(antialiasingEnabled);
            
            // V-Sync (note: browser controls this, we just store preference)
            this.gameEngine.setVSync(this.settings.graphics.vsync === 'on');
            
            // FPS limit
            this.gameEngine.setFPSLimit(this.settings.graphics.fpsLimit);
            
            // Render distance
            this.gameEngine.setRenderDistance(this.getRenderDistanceValue());
            
            // Particle effects
            this.gameEngine.setParticleEffects(this.settings.graphics.particleEffects !== 'off');
            
            console.log('✅ Graphics settings applied successfully');
            
        } catch (error) {
            console.error('❌ Error applying graphics settings:', error);
            this.showNotification('Failed to apply graphics settings');
        }
    }
    
    getRenderDistanceValue() {
        switch (this.settings.graphics.renderDistance) {
            case 'low': return 200;
            case 'medium': return 500;
            case 'high': return 1000;
            default: return 500;
        }
    }
    
    applyAudioSettings() {
        // Apply volume settings to audio manager if available
        if (this.gameEngine.audioManager) {
            this.gameEngine.audioManager.setMasterVolume(this.settings.audio.masterVolume / 100);
            this.gameEngine.audioManager.setMusicVolume(this.settings.audio.musicVolume / 100);
            this.gameEngine.audioManager.setSFXVolume(this.settings.audio.sfxVolume / 100);
        }
    }
    
    applyControlSettings() {
        // Apply camera speed to player if available
        if (this.gameEngine.player) {
            this.gameEngine.player.setCameraSpeed(this.settings.controls.cameraSpeed);
        }
    }
    
    updateRenderDistance() {
        if (!this.gameEngine.scene) return;
        
        const camera = this.gameEngine.camera;
        if (!camera) return;
        
        switch (this.settings.graphics.renderDistance) {
            case 'low':
                camera.far = 200;
                break;
            case 'medium':
                camera.far = 500;
                break;
            case 'high':
                camera.far = 1000;
                break;
        }
        
        camera.updateProjectionMatrix();
    }
    
    updateParticleEffects() {
        // Update particle system based on quality setting
        if (this.gameEngine.worldManager && this.gameEngine.worldManager.dayNightCycle) {
            const stars = this.gameEngine.worldManager.dayNightCycle.stars;
            if (stars) {
                const visibleCount = this.settings.graphics.particleEffects === 'off' ? 0 :
                                   this.settings.graphics.particleEffects === 'low' ? 50 :
                                   this.settings.graphics.particleEffects === 'medium' ? 100 : 200;
                
                stars.forEach((star, index) => {
                    star.visible = index < visibleCount;
                });
            }
        }
    }
    
    resetSettings() {
        // Reset to default settings
        this.settings = {
            graphics: {
                quality: 'medium',
                renderDistance: 'medium',
                shadowQuality: 'medium',
                antiAliasing: 'fxaa',
                particleEffects: 'medium',
                vsync: 'on',
                fpsLimit: '60'
            },
            audio: {
                masterVolume: 50,
                musicVolume: 70,
                sfxVolume: 80
            },
            controls: {
                mouseSensitivity: 1.0,
                cameraSpeed: 1.0
            }
        };
        
        this.updateUI();
        this.applySettings();
        this.showNotification('Settings reset to default!');
    }
    
    saveSettings() {
        try {
            localStorage.setItem('egypt-mmo-settings', JSON.stringify(this.settings));
        } catch (e) {
            console.warn('Could not save settings to localStorage:', e);
        }
    }
    
    loadSettings() {
        try {
            const saved = localStorage.getItem('egypt-mmo-settings');
            if (saved) {
                const parsed = JSON.parse(saved);
                this.settings = { ...this.settings, ...parsed };
            }
        } catch (e) {
            console.warn('Could not load settings from localStorage:', e);
        }
    }
    
    showNotification(message) {
        // Create a simple notification
        const notification = document.createElement('div');
        notification.className = 'settings-notification';
        notification.textContent = message;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #4CAF50;
            color: white;
            padding: 15px 20px;
            border-radius: 8px;
            z-index: 3000;
            animation: slideIn 0.3s ease-out;
        `;
        
        document.body.appendChild(notification);
        
        // Remove after 3 seconds
        setTimeout(() => {
            notification.remove();
        }, 3000);
    }
    
    destroy() {
        // Cleanup event listeners
        document.removeEventListener('keydown', this.handleKeydown);
        this.closeOptions();
    }
}
