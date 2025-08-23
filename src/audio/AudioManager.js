import { Howl, Howler } from 'howler';

export class AudioManager {
    constructor() {
        this.settings = {
            masterVolume: 0.7,
            musicVolume: 0.5,
            sfxVolume: 0.8
        };
        
        this.musicTracks = new Map();
        this.soundEffects = new Map();
        this.currentMusic = null;
        this.isInitialized = false; // Add initialization guard
        
        // Audio settings
        this.soundEnabled = true;
        this.musicEnabled = true;
        this.ambientEnabled = true;
        
        // Audio categories
        this.categories = {
            ui: 'ui',
            combat: 'combat',
            crafting: 'crafting',
            environment: 'environment',
            music: 'music',
            ambient: 'ambient'
        };
        
        this.init();
    }

    async init() {
        // Prevent double initialization
        if (this.isInitialized) {
            console.warn('⚠️ AudioManager already initialized, skipping...');
            return;
        }
        
        console.log('🎵 Initializing Audio Manager...');
        
        try {
            // Initialize Howler.js
            Howler.volume(this.settings.masterVolume);
            
            // Load music tracks
            this.loadMusic();
            
            // Load sound effects
            this.loadSounds();
            
            this.isInitialized = true; // Mark as initialized
            console.log('✅ Audio Manager initialized');
        } catch (error) {
            console.error('❌ Failed to initialize Audio Manager:', error);
            throw error;
        }
    }

    setupAudioContext() {
        // Initialize Howler.js
        Howler.volume(this.masterVolume);
        
        // Handle audio context suspension (mobile browsers)
        document.addEventListener('click', () => {
            if (Howler.ctx.state === 'suspended') {
                Howler.ctx.resume();
            }
        }, { once: true });
    }

    loadSounds() {
        // UI Sounds
        this.loadSound('button_click', 'ui', {
            src: ['/sounds/ui/button_click.mp3'],
            volume: 0.6,
            rate: 1.0
        });

        this.loadSound('panel_open', 'ui', {
            src: ['/sounds/ui/panel_open.mp3'],
            volume: 0.5,
            rate: 1.0
        });

        this.loadSound('panel_close', 'ui', {
            src: ['/sounds/ui/panel_close.mp3'],
            volume: 0.5,
            rate: 1.0
        });

        this.loadSound('notification', 'ui', {
            src: ['/sounds/ui/notification.mp3'],
            volume: 0.7,
            rate: 1.0
        });

        // Crafting Sounds
        this.loadSound('hammer_strike', 'crafting', {
            src: ['/sounds/crafting/hammer_strike.mp3'],
            volume: 0.8,
            rate: 1.0
        });

        this.loadSound('metal_clang', 'crafting', {
            src: ['/sounds/crafting/metal_clang.mp3'],
            volume: 0.7,
            rate: 1.0
        });

        this.loadSound('wood_cut', 'crafting', {
            src: ['/sounds/crafting/wood_cut.mp3'],
            volume: 0.6,
            rate: 1.0
        });

        this.loadSound('potion_bubble', 'crafting', {
            src: ['/sounds/crafting/potion_bubble.mp3'],
            volume: 0.5,
            rate: 1.0
        });

        // Environment Sounds
        this.loadSound('wind_ambient', 'environment', {
            src: ['/sounds/environment/wind_ambient.mp3'],
            volume: 0.4,
            rate: 1.0,
            loop: true
        });

        this.loadSound('sand_footstep', 'environment', {
            src: ['/sounds/environment/sand_footstep.mp3'],
            volume: 0.6,
            rate: 1.0
        });

        this.loadSound('water_splash', 'environment', {
            src: ['/sounds/environment/water_splash.mp3'],
            volume: 0.7,
            rate: 1.0
        });

        this.loadSound('fire_crackle', 'environment', {
            src: ['/sounds/environment/fire_crackle.mp3'],
            volume: 0.5,
            rate: 1.0,
            loop: true
        });

        // Combat Sounds
        this.loadSound('sword_swing', 'combat', {
            src: ['/sounds/combat/sword_swing.mp3'],
            volume: 0.8,
            rate: 1.0
        });

        this.loadSound('armor_clank', 'combat', {
            src: ['/sounds/combat/armor_clank.mp3'],
            volume: 0.6,
            rate: 1.0
        });

        this.loadSound('magic_cast', 'combat', {
            src: ['/sounds/combat/magic_cast.mp3'],
            volume: 0.7,
            rate: 1.0
        });

        // For now, create placeholder sounds since we don't have actual audio files
        this.createPlaceholderSounds();
    }

    createPlaceholderSounds() {
        // Create simple placeholder sounds using Web Audio API
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        
        // Button click sound
        this.createPlaceholderSound('button_click', () => {
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);
            
            oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
            oscillator.frequency.exponentialRampToValueAtTime(400, audioContext.currentTime + 0.1);
            
            gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);
            
            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + 0.1);
        });

        // Hammer strike sound
        this.createPlaceholderSound('hammer_strike', () => {
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);
            
            oscillator.frequency.setValueAtTime(200, audioContext.currentTime);
            oscillator.frequency.exponentialRampToValueAtTime(100, audioContext.currentTime + 0.3);
            
            gainNode.gain.setValueAtTime(0.4, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
            
            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + 0.3);
        });

        // Wind ambient sound
        this.createPlaceholderSound('wind_ambient', () => {
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();
            const filter = audioContext.createBiquadFilter();
            
            oscillator.connect(filter);
            filter.connect(gainNode);
            gainNode.connect(audioContext.destination);
            
            oscillator.type = 'noise';
            filter.type = 'lowpass';
            filter.frequency.setValueAtTime(200, audioContext.currentTime);
            
            gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
            
            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + 2.0);
        });
    }

    createPlaceholderSound(name, soundFunction) {
        this.soundEffects.set(name, {
            play: soundFunction,
            volume: 1.0,
            category: 'ui'
        });
    }

    loadMusic() {
        // Egyptian-themed music tracks
        const musicTracks = [
            { id: 'main_theme', name: 'Ancient Egypt Theme', category: 'music' },
            { id: 'desert_wind', name: 'Desert Wind', category: 'ambient' },
            { id: 'pyramid_mystery', name: 'Pyramid Mystery', category: 'music' },
            { id: 'crafting_peace', name: 'Crafting Peace', category: 'music' },
            { id: 'battle_theme', name: 'Battle Theme', category: 'music' }
        ];

        musicTracks.forEach(track => {
            this.musicTracks.set(track.id, {
                name: track.name,
                category: track.category,
                loaded: false,
                howl: null
            });
        });

        // For now, we'll simulate music loading
        this.simulateMusicLoading();
    }

    simulateMusicLoading() {
        // Simulate music loading delay
        setTimeout(() => {
            this.musicTracks.forEach((track, id) => {
                track.loaded = true;
                console.log(`🎵 Music track loaded: ${track.name}`);
            });
        }, 2000);
    }

    setupEventListeners() {
        // Listen for game events to play appropriate sounds
        document.addEventListener('crafting_start', () => {
            this.playSound('hammer_strike');
        });

        document.addEventListener('item_crafted', () => {
            this.playSound('notification');
        });

        document.addEventListener('panel_open', () => {
            this.playSound('panel_open');
        });

        document.addEventListener('panel_close', () => {
            this.playSound('panel_close');
        });
    }

    // Sound playback methods
    playSound(soundName, options = {}) {
        if (!this.soundEnabled) return;

        const sound = this.soundEffects.get(soundName);
        if (!sound) {
            console.warn(`Sound not found: ${soundName}`);
            return;
        }

        try {
            if (sound.play) {
                sound.play();
            } else if (sound.howl) {
                const volume = options.volume || sound.volume || this.soundVolume;
                sound.howl.volume(volume * this.masterVolume);
                sound.howl.play();
            }
        } catch (error) {
            console.error(`Error playing sound ${soundName}:`, error);
        }
    }

    playMusic(musicId, options = {}) {
        if (!this.musicEnabled) return;

        const music = this.musicTracks.get(musicId);
        if (!music || !music.loaded) {
            console.warn(`Music not found or not loaded: ${musicId}`);
            return;
        }

        try {
            // Stop current music if playing
            if (this.currentMusic && this.currentMusic.howl) {
                this.currentMusic.howl.stop();
            }

            if (music.howl) {
                const volume = options.volume || this.musicVolume;
                music.howl.volume(volume * this.masterVolume);
                music.howl.loop(true);
                music.howl.play();
                this.currentMusic = music;
            }
        } catch (error) {
            console.error(`Error playing music ${musicId}:`, error);
        }
    }

    stopMusic() {
        if (this.currentMusic && this.currentMusic.howl) {
            this.currentMusic.howl.stop();
            this.currentMusic = null;
        }
    }

    // Volume control
    setMasterVolume(volume) {
        this.masterVolume = Math.max(0, Math.min(1, volume));
        Howler.volume(this.masterVolume);
    }

    setSoundVolume(volume) {
        this.soundVolume = Math.max(0, Math.min(1, volume));
    }
    
    setSFXVolume(volume) {
        this.soundVolume = Math.max(0, Math.min(1, volume));
        // Update volume for all SFX sounds
        this.soundEffects.forEach(sound => {
            if (sound.category === 'sfx' && sound.howl) {
                sound.howl.volume(volume * this.masterVolume);
            }
        });
    }

    setMusicVolume(volume) {
        this.musicVolume = Math.max(0, Math.min(1, volume));
        
        if (this.currentMusic && this.currentMusic.howl) {
            this.currentMusic.howl.volume(volume * this.masterVolume);
        }
    }

    // Audio settings
    toggleSound() {
        this.soundEnabled = !this.soundEnabled;
        return this.soundEnabled;
    }

    toggleMusic() {
        this.musicEnabled = !this.musicEnabled;
        
        if (!this.musicEnabled) {
            this.stopMusic();
        }
        
        return this.musicEnabled;
    }

    toggleAmbient() {
        this.ambientEnabled = !this.ambientEnabled;
        
        if (!this.ambientEnabled) {
            // Stop ambient sounds
            this.stopAmbientSounds();
        }
        
        return this.ambientEnabled;
    }

    stopAmbientSounds() {
        // Stop all looping ambient sounds
        this.soundEffects.forEach(sound => {
            if (sound.category === 'ambient' && sound.howl) {
                sound.howl.stop();
            }
        });
    }

    // Audio loading and management
    loadSound(soundName, category, options) {
        try {
            const howl = new Howl({
                src: options.src,
                volume: options.volume || 1.0,
                rate: options.rate || 1.0,
                loop: options.loop || false,
                preload: true,
                onload: () => {
                    console.log(`🎵 Sound loaded: ${soundName}`);
                },
                onloaderror: (id, error) => {
                    console.error(`Failed to load sound ${soundName}:`, error);
                }
            });

            this.soundEffects.set(soundName, {
                howl: howl,
                volume: options.volume || 1.0,
                category: category
            });
        } catch (error) {
            console.error(`Error loading sound ${soundName}:`, error);
        }
    }

    // Utility methods
    getSound(soundName) {
        return this.soundEffects.get(soundName);
    }

    getMusic(musicId) {
        return this.musicTracks.get(musicId);
    }

    getAllSounds() {
        return Array.from(this.soundEffects.keys());
    }

    getAllMusic() {
        return Array.from(this.musicTracks.keys());
    }

    getAudioStats() {
        return {
            soundsLoaded: this.soundEffects.size,
            musicLoaded: Array.from(this.musicTracks.values()).filter(m => m.loaded).length,
            masterVolume: this.masterVolume,
            soundVolume: this.soundVolume,
            musicVolume: this.musicVolume,
            soundEnabled: this.soundEnabled,
            musicEnabled: this.musicEnabled,
            ambientEnabled: this.ambientEnabled
        };
    }

    // Cleanup
    destroy() {
        // Stop all sounds and music
        this.stopMusic();
        this.stopAmbientSounds();
        
        // Clear all audio resources
        this.soundEffects.clear();
        this.musicTracks.clear();
        
        // Unload Howler
        Howler.unload();
        
        console.log('🎵 Audio Manager destroyed');
    }
}
