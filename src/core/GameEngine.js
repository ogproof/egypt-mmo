import * as THREE from 'three';
import { Player } from '../entities/Player.js';
import { WorldManager } from './WorldManager.js';
import { GridManager } from './GridManager.js';
import { InputManager } from './InputManager.js';
import { CraftingSystem } from '../systems/CraftingSystem.js';
import { InventorySystem } from '../systems/InventorySystem.js';

export class GameEngine {
    constructor() {
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.player = null;
        this.worldManager = null;
        this.gridManager = null;
        this.inputManager = null;
        this.craftingSystem = null;
        this.inventorySystem = null;
        this.networkManager = null;
        this.audioManager = null;
        this.uiManager = null;
        this.optionsManager = null; // Add options manager
        this.clickIndicator = null; // Visual indicator for clicks
        
        // Camera orbital rotation properties
        this.cameraOrbitAngle = 0; // Current orbit angle around player
        this.cameraOrbitSpeed = 0.02; // Speed of orbit rotation
        this.cameraOrbitDistance = 10; // Distance from player
        this.cameraOrbitHeight = 5; // Height above player
        
        // Camera offset properties - these stay fixed until arrow keys change them
        this.cameraOffsetX = 0; // Fixed X offset from player
        this.cameraOffsetZ = 10; // Fixed Z offset from player (behind player)
        this.cameraOffsetY = 5; // Fixed Y offset from player (height)
        
        // Game state
        this.players = new Map(); // Store other players
        this.entities = []; // Store game entities
        this.lastCameraPosition = null; // For camera movement detection
        
        // Performance monitoring
        this.fps = 0;
        this.frameCount = 0;
        this.lastTime = 0;
        this.isRunning = false;
        this.isInitialized = false; // Add initialization guard
        
        // Initialize clock for timing
        this.clock = new THREE.Clock();
        
        // Bind methods
        this.animate = this.animate.bind(this);
        this.handleResize = this.handleResize.bind(this);
    }

    async init() {
        // Prevent double initialization
        if (this.isInitialized) {
            console.warn('⚠️ GameEngine already initialized, skipping...');
            return;
        }
        
        console.log('🎮 Initializing Game Engine...');
        
        // Initialize Three.js scene
        this.initScene();
        
        // Initialize systems (no physics)
        this.worldManager = new WorldManager(this.scene);
        this.gridManager = new GridManager(this.scene, 1000, 2); // 1000x1000 world, 2x2 grid cells (player-sized)
        this.inputManager = new InputManager();
        this.craftingSystem = new CraftingSystem();
        this.inventorySystem = new InventorySystem();
        
        // Initialize InputManager
        this.inputManager.init();
        
        // Initialize inventory system
        await this.inventorySystem.init();
        
        // Initialize grid manager
        this.gridManager.init();
        
        // Initialize world
        await this.worldManager.init();
        
        // Setup camera first
        this.setupCamera();
        
        // Create player
        this.player = new Player(this.scene, this.physicsWorld);
        await this.player.init();
        
        // Set player name if we have one from character creator
        if (this.pendingPlayerName) {
            this.player.setName(this.pendingPlayerName);
            this.pendingPlayerName = null;
        }
        
        // Set camera to follow player
        this.camera = this.player.camera;
        
        // Set camera reference for player movement
        if (this.player) {
            this.player.setCamera(this.camera);
        }
        
        // Check for pending player name
        this.checkPendingPlayerName();
        
        // Setup lighting
        this.setupLighting();
        
        // Setup input handlers
        this.setupInputHandlers();
        
        // Setup debug controls
        this.setupDebugControls();
        
        // Ensure all game objects have safe update methods
        this.ensureSafeUpdateMethods();
        
        // Mark as initialized
        this.isInitialized = true;
        console.log('✅ Game Engine initialized');
        
        // Hide loading screen if it exists
        if (this.loadingManager) {
            this.loadingManager.hide();
        }
    }

    initScene() {
        // Create scene
        this.scene = new THREE.Scene();
        this.scene.fog = new THREE.Fog(0x1a1a2e, 50, 200);
        
        // Ensure game canvas exists
        let gameCanvas = document.getElementById('game-canvas');
        if (!gameCanvas) {
            console.log('🔧 Creating game canvas...');
            gameCanvas = document.createElement('canvas');
            gameCanvas.id = 'game-canvas';
            gameCanvas.style.cssText = `
                position: absolute;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                z-index: 1;
            `;
            
            // Add to game container
            const gameContainer = document.getElementById('game-container');
            if (gameContainer) {
                gameContainer.appendChild(gameCanvas);
                console.log('✅ Game canvas added to container');
            } else {
                // Fallback to body if game container doesn't exist
                document.body.appendChild(gameCanvas);
                console.log('✅ Game canvas added to body');
            }
        }
        
        // Create renderer with performance optimizations
        this.renderer = new THREE.WebGLRenderer({
            canvas: gameCanvas,
            antialias: true,
            alpha: false,
            powerPreference: 'high-performance',
            stencil: false,
            depth: true
        });
        
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5)); // Reduced for performance
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        this.renderer.shadowMap.autoUpdate = true; // Enable auto-update to prevent shadow artifacts
        this.renderer.outputColorSpace = THREE.SRGBColorSpace;
        this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
        this.renderer.toneMappingExposure = 1.2;
        
        // Performance optimizations
        this.renderer.sortObjects = false; // Disable depth sorting for better performance
        this.renderer.info.autoReset = false; // Disable auto-reset for performance monitoring
        
        // Set clear color to match Egyptian theme
        this.renderer.setClearColor(0x1a1a2e);
    }

    // Physics initialization removed - using direct positioning instead

    setupCamera() {
        this.camera = new THREE.PerspectiveCamera(
            75,
            window.innerWidth / window.innerHeight,
            0.1,
            1000
        );
        
        // Position camera behind and above player
        this.camera.position.set(0, 5, 10);
        this.camera.lookAt(0, 0, 0);
        
        // Set camera reference for performance optimizations
        if (this.worldManager) {
            this.worldManager.setCamera(this.camera);
        }
        
        // Set camera reference for player movement
        if (this.player) {
            this.player.setCamera(this.camera);
        }
        
        // Store grid manager in scene for player access
        if (this.scene && this.gridManager) {
            this.scene.userData.gridManager = this.gridManager;
        }
    }

    setupLighting() {
        // Lighting is now handled entirely by WorldManager
        // This prevents duplicate light sources and multiple shadows
        console.log('🔧 Lighting setup skipped - handled by WorldManager');
    }

    setupInputHandlers() {
        // Set up mouse click handler for movement
        this.inputManager.onMouseClick = (event, mouseCoords) => {
            console.log('🎯 Mouse click detected:', mouseCoords);
            this.handleMouseClick(mouseCoords);
        };

        // Set up keyboard handlers
        this.inputManager.onKeyDown = (key) => {
            this.handleKeyDown(key);
        };

        this.inputManager.onKeyUp = (key) => {
            this.handleKeyUp(key);
        };
    }

    handleMouseClick(mouseCoords) {
        console.log('🎯 Processing mouse click:', mouseCoords);
        
        // Convert mouse coordinates to world position
        const worldPosition = this.getWorldPositionFromMouse(mouseCoords);
        
        if (worldPosition) {
            console.log('🎯 World position from mouse:', worldPosition);
            
            // Show visual debug indicator
            this.showClickIndicator(worldPosition);
            
            // Check if position is walkable
            if (this.gridManager && this.gridManager.isWalkable(worldPosition)) {
                console.log('✅ Position is walkable, moving player');
                this.player.moveToPosition(worldPosition);
            } else {
                console.log('❌ Position is not walkable, finding nearest walkable cell');
                // Find nearest walkable position
                const walkablePosition = this.gridManager.findNearestWalkable(worldPosition);
                this.player.moveToPosition(walkablePosition);
            }
        } else {
            console.log('❌ Could not convert mouse to world position');
        }
    }

    showClickIndicator(position) {
        // Remove previous indicator
        if (this.clickIndicator) {
            this.scene.remove(this.clickIndicator);
        }
        
        // Create a red sphere to show where the click was detected
        const geometry = new THREE.SphereGeometry(0.5, 8, 6);
        const material = new THREE.MeshBasicMaterial({ 
            color: 0xff0000, 
            transparent: true, 
            opacity: 0.8 
        });
        
        this.clickIndicator = new THREE.Mesh(geometry, material);
        this.clickIndicator.position.copy(position);
        this.clickIndicator.position.y = 0.5; // Raise it slightly above ground
        
        this.scene.add(this.clickIndicator);
        
        // Remove indicator after 2 seconds
        setTimeout(() => {
            if (this.clickIndicator) {
                this.scene.remove(this.clickIndicator);
                this.clickIndicator = null;
            }
        }, 2000);
    }

    getWorldPositionFromMouse(mouseCoords) {
        // Create a raycaster from the camera
        const raycaster = new THREE.Raycaster();
        raycaster.setFromCamera(mouseCoords, this.camera);
        
        // Create a ground plane at y=0 for intersection
        const groundPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
        const intersectionPoint = new THREE.Vector3();
        
        if (raycaster.ray.intersectPlane(groundPlane, intersectionPoint)) {
            console.log('🎯 Ground intersection found:', intersectionPoint);
            return intersectionPoint;
        }
        
        // Fallback: try to intersect with scene objects
        const intersects = raycaster.intersectObjects(this.scene.children, true);
        if (intersects.length > 0) {
            const firstIntersect = intersects[0];
            console.log('🎯 Object intersection found:', firstIntersect.point);
            return firstIntersect.point;
        }
        
        return null;
    }

    handleObjectInteraction(object) {
        // Check if it's a crafting station
        if (object.userData.type === 'crafting_station') {
            this.uiManager.showCraftingPanel();
        }
        
        // Check if it's a resource node
        if (object.userData.type === 'resource_node') {
            this.player.startGathering(object);
        }
        
        // Check if it's an NPC
        if (object.userData.type === 'npc') {
            this.uiManager.showNPCDialog(object.userData.npcId);
        }
    }

    start() {
        if (this.isRunning) return;
        
        this.isRunning = true;
        this.clock.start();
        this.gameLoop();
        
        console.log('🎮 Game loop started');
    }

    stop() {
        this.isRunning = false;
        this.clock.stop();
    }

    pause() {
        this.isPaused = true;
    }

    resume() {
        this.isPaused = false;
    }

    gameLoop() {
        if (!this.isRunning) return;
        
        requestAnimationFrame(() => this.gameLoop());
        
        if (this.isPaused) return;
        
        const deltaTime = this.clock.getDelta();
        const elapsedTime = this.clock.getElapsedTime();
        
        // Update player (no physics)
        if (this.player) {
            this.player.update(deltaTime);
            this.updateCamera();
        }
        
        // Update other players
        this.players.forEach((player, playerId) => {
            player.update(deltaTime);
        });
        
        // Update entities
        this.entities.forEach(entity => {
            entity.update(deltaTime);
        });
        
        // Update world
        if (this.worldManager) {
            // Ensure camera is set in WorldManager for day/night cycle
            if (!this.worldManager.camera && this.camera) {
                this.worldManager.setCamera(this.camera);
            }
            this.worldManager.update(deltaTime);
        }
        
        // Only render if camera has moved (performance optimization)
        if (this.shouldRender()) {
            // Render scene
            this.renderer.render(this.scene, this.camera);
            
            // Update shadows only when needed
            if (this.renderer.shadowMap.enabled && this.renderer.shadowMap.autoUpdate === false) {
                this.renderer.shadowMap.autoUpdate = true;
                this.renderer.shadowMap.autoUpdate = false;
            }
        }
        
        // Update performance metrics
        this.updatePerformanceMetrics(elapsedTime);
        
        // Increment frame count
        this.frameCount++;
    }
    
    shouldRender() {
        // Only render if camera has moved or significant time has passed
        if (!this.lastCameraPosition) {
            this.lastCameraPosition = this.camera.position.clone();
            return true;
        }
        
        const cameraMoved = this.camera.position.distanceTo(this.lastCameraPosition) > 0.1;
        if (cameraMoved) {
            this.lastCameraPosition.copy(this.camera.position);
            return true;
        }
        
        // Render every few frames even if camera hasn't moved (for animations)
        return this.frameCount % 3 === 0;
    }
    
    // Graphics quality settings
    setGraphicsQuality(quality) {
        if (!this.renderer) {
            console.warn('🔧 Renderer not available, skipping graphics quality change');
            return;
        }
        
        try {
            switch(quality) {
                case 'low':
                    this.renderer.setPixelRatio(1);
                    if (this.renderer.shadowMap) {
                        this.renderer.shadowMap.enabled = false;
                    }
                    this.renderer.antialias = false;
                    break;
                case 'medium':
                    this.renderer.setPixelRatio(1.2);
                    if (this.renderer.shadowMap) {
                        this.renderer.shadowMap.enabled = true;
                    }
                    this.renderer.antialias = false;
                    break;
                case 'high':
                    this.renderer.setPixelRatio(1.5);
                    if (this.renderer.shadowMap) {
                        this.renderer.shadowMap.enabled = true;
                    }
                    this.renderer.antialias = true;
                    break;
                case 'ultra':
                    this.renderer.setPixelRatio(2);
                    if (this.renderer.shadowMap) {
                        this.renderer.shadowMap.enabled = true;
                    }
                    this.renderer.antialias = true;
                    break;
                default:
                    console.warn(`🔧 Unknown graphics quality: ${quality}`);
                    return;
            }
            console.log(`🔧 Graphics quality set to: ${quality}`);
        } catch (error) {
            console.error('🔧 Error setting graphics quality:', error);
        }
    }
    
    setRenderDistance(distance) {
        if (!this.camera) {
            console.warn('🔧 Camera not available, skipping render distance change');
            return;
        }
        
        try {
            const farDistance = parseInt(distance);
            this.camera.far = farDistance;
            this.camera.updateProjectionMatrix();
            
            // Create fog if it doesn't exist
            if (!this.scene.fog) {
                this.scene.fog = new THREE.Fog(0x1a1a2e, 50, farDistance * 0.8);
                console.log('🔧 Created fog for render distance');
            } else {
                this.scene.fog.far = farDistance * 0.8;
            }
            
            console.log(`🔧 Render distance set to: ${distance}`);
        } catch (error) {
            console.error('🔧 Error setting render distance:', error);
        }
    }
    
    setShadowQuality(quality) {
        // Check if shadowMap is available
        if (!this.renderer || !this.renderer.shadowMap) {
            console.warn('🔧 Shadow map not available, skipping shadow quality change');
            return;
        }
        
        try {
            // First ensure shadows are enabled
            this.renderer.shadowMap.enabled = true;
            
            // Check if mapSize exists, if not create it
            if (!this.renderer.shadowMap.mapSize) {
                console.log('🔧 Creating shadow map size property');
                this.renderer.shadowMap.mapSize = { width: 1024, height: 1024 };
            }
            
            switch(quality) {
                case 'off':
                    this.renderer.shadowMap.enabled = false;
                    // Also disable shadow casting on all lights in the scene
                    this.disableAllLightShadows();
                    console.log('🔧 Shadows disabled on renderer and all lights');
                    return;
                case 'low':
                    this.renderer.shadowMap.mapSize.width = 512;
                    this.renderer.shadowMap.mapSize.height = 512;
                    this.enableAllLightShadows();
                    break;
                case 'medium':
                    this.renderer.shadowMap.mapSize.width = 1024;
                    this.renderer.shadowMap.mapSize.height = 1024;
                    this.enableAllLightShadows();
                    break;
                case 'high':
                    this.renderer.shadowMap.mapSize.width = 2048;
                    this.renderer.shadowMap.mapSize.height = 2048;
                    this.enableAllLightShadows();
                    break;
                default:
                    console.warn(`🔧 Unknown shadow quality: ${quality}`);
                    return;
            }
            
            // Force shadow map update
            this.renderer.shadowMap.needsUpdate = true;
            console.log(`🔧 Shadow quality set to: ${quality}`);
            
        } catch (error) {
            console.error('🔧 Error setting shadow quality:', error);
        }
    }
    
    disableAllLightShadows() {
        if (!this.scene) return;
        
        // Traverse all objects in the scene to find lights
        this.scene.traverse((object) => {
            if (object.isLight) {
                object.castShadow = false;
                console.log(`🔧 Disabled shadow casting on light: ${object.type}`);
            }
        });
    }
    
    enableAllLightShadows() {
        if (!this.scene) return;
        
        // Traverse all objects in the scene to find lights
        this.scene.traverse((object) => {
            if (object.isLight && object.type === 'DirectionalLight') {
                // Only enable shadows on directional lights (main sun light)
                object.castShadow = true;
                console.log(`🔧 Enabled shadow casting on light: ${object.type}`);
            }
        });
    }
    
    setAntiAliasing(enabled) {
        if (!this.renderer) {
            console.warn('🔧 Renderer not available, skipping anti-aliasing change');
            return;
        }
        
        try {
            this.renderer.antialias = enabled;
            console.log(`🔧 Anti-aliasing ${enabled ? 'enabled' : 'disabled'}`);
        } catch (error) {
            console.error('🔧 Error setting anti-aliasing:', error);
        }
    }
    
    setParticleEffects(enabled) {
        // Store setting for future particle system implementation
        this.particleEffectsEnabled = enabled;
        console.log(`🔧 Particle effects ${enabled ? 'enabled' : 'disabled'}`);
    }
    
    setVSync(enabled) {
        // Note: V-Sync is typically controlled by the browser/GPU
        // This is more of a preference setting
        this.vsyncEnabled = enabled;
        console.log(`🔧 V-Sync preference set to: ${enabled}`);
    }
    
    // FPS limiting
    setFPSLimit(fpsLimit) {
        if (fpsLimit === 'unlimited') {
            this.fpsLimit = null;
        } else {
            this.fpsLimit = parseInt(fpsLimit);
            this.frameInterval = 1000 / this.fpsLimit;
        }
        console.log(`🔧 FPS limit set to: ${fpsLimit}`);
    }
    
    // Check if renderer is ready for settings changes
    isRendererReady() {
        return this.renderer && 
               this.camera &&
               this.scene;
    }
    
    // Wait for renderer to be ready (useful for options that need to be applied after initialization)
    async waitForRenderer() {
        let attempts = 0;
        const maxAttempts = 50; // Wait up to 5 seconds
        
        while (!this.isRendererReady() && attempts < maxAttempts) {
            await new Promise(resolve => setTimeout(resolve, 100));
            attempts++;
        }
        
        if (this.isRendererReady()) {
            console.log('🔧 Renderer is ready for settings changes');
            return true;
        } else {
            console.warn('🔧 Renderer not ready after waiting, some settings may not apply');
            return false;
        }
    }
    
    // Debug shadow information
    debugShadows() {
        if (!this.renderer) {
            console.log('🔍 No renderer available');
            return;
        }
        
        console.log('🔍 Shadow Debug Info:');
        console.log('  - Shadow Map Enabled:', this.renderer.shadowMap.enabled);
        console.log('  - Shadow Map Size:', this.renderer.shadowMap.mapSize?.width, 'x', this.renderer.shadowMap.mapSize?.height);
        console.log('  - Shadow Map Type:', this.renderer.shadowMap.type);
        console.log('  - Shadow Map Auto Update:', this.renderer.shadowMap.autoUpdate);
        console.log('  - Shadow Map Needs Update:', this.renderer.shadowMap.needsUpdate);
        
        if (this.worldManager && this.worldManager.dayNightCycle) {
            const light = this.worldManager.dayNightCycle.directionalLight;
            if (light) {
                console.log('  - Directional Light Casts Shadows:', light.castShadow);
                console.log('  - Shadow Camera Near:', light.shadow.camera.near);
                console.log('  - Shadow Camera Far:', light.shadow.camera.far);
                console.log('  - Shadow Camera Bounds:', {
                    left: light.shadow.camera.left,
                    right: light.shadow.camera.right,
                    top: light.shadow.camera.top,
                    bottom: light.shadow.camera.bottom
                });
            }
        }
        
        // Count objects that cast shadows
        let shadowCasters = 0;
        this.scene.traverse((object) => {
            if (object.castShadow) shadowCasters++;
        });
        console.log('  - Objects casting shadows:', shadowCasters);
        
        // Count lights
        let lightCount = 0;
        this.scene.traverse((object) => {
            if (object.isLight) lightCount++;
        });
        console.log('  - Total lights in scene:', lightCount);
        
        // List all lights with details
        console.log('  - Light Details:');
        this.scene.traverse((object) => {
            if (object.isLight) {
                console.log(`    ${object.type}: ${object.name || 'unnamed'} at (${object.position.x.toFixed(1)}, ${object.position.y.toFixed(1)}, ${object.position.z.toFixed(1)})`);
                if (object.castShadow) {
                    console.log(`      Casts shadows: ${object.castShadow}`);
                }
            }
        });
    }
    
    // Debug memory and performance
    debugMemory() {
        if (!this.renderer) {
            console.log('🔍 No renderer available');
            return;
        }
        
        const renderInfo = this.renderer.info;
        const memoryInfo = renderInfo.memory;
        const renderStats = renderInfo.render;
        
        console.log('🔍 Memory & Performance Debug:');
        console.log('  - Triangles:', renderStats.triangles.toLocaleString());
        console.log('  - Draw Calls:', renderStats.calls.toLocaleString());
        console.log('  - Geometries:', memoryInfo.geometries);
        console.log('  - Textures:', memoryInfo.textures);
        console.log('  - FPS:', this.fps);
        
        // Count scene objects
        let objectCount = 0;
        let meshCount = 0;
        let groupCount = 0;
        
        this.scene.traverse((object) => {
            objectCount++;
            if (object.isMesh) meshCount++;
            if (object.isGroup) groupCount++;
        });
        
        console.log('  - Total Objects:', objectCount);
        console.log('  - Meshes:', meshCount);
        console.log('  - Groups:', groupCount);
        
        // Check for potential memory leaks
        if (renderStats.triangles > 5000000) {
            console.warn('⚠️ High triangle count detected - possible memory leak');
        }
        if (renderStats.calls > 50000) {
            console.warn('⚠️ High draw call count detected - possible memory leak');
        }
    }
    
    // Clean up memory and reset renderer info
    cleanupMemory() {
        if (!this.renderer) return;
        
        // Reset renderer info to clear accumulated stats
        this.renderer.info.reset();
        
        // Force garbage collection if available
        if (window.gc) {
            window.gc();
            console.log('🔧 Memory cleanup completed');
        } else {
            console.log('🔧 Renderer info reset (manual GC recommended)');
        }
    }

    // Enhanced memory management and object tracking
    cleanupUnusedResources() {
        if (!this.renderer || !this.scene) return;
        
        console.log('🔧 Starting comprehensive resource cleanup...');
        
        // Track objects before cleanup
        const beforeCount = this.scene.children.length;
        const beforeGeometries = this.renderer.info.memory.geometries;
        const beforeMaterials = this.renderer.info.memory.materials;
        
        // Clean up unused geometries and materials
        this.cleanupUnusedGeometries();
        this.cleanupUnusedMaterials();
        
        // Reset renderer info
        this.renderer.info.reset();
        
        // Force garbage collection if available
        if (window.gc) {
            window.gc();
        }
        
        console.log(`🔧 Cleanup completed - Objects: ${beforeCount} → ${this.scene.children.length}`);
        console.log(`🔧 Geometries: ${beforeGeometries} → ${this.renderer.info.memory.geometries}`);
        console.log(`🔧 Materials: ${beforeMaterials} → ${this.renderer.info.memory.materials}`);
    }
    
    cleanupUnusedGeometries() {
        // This is handled automatically by Three.js, but we can help
        // by ensuring we're not holding references to unused geometries
        if (this.worldManager) {
            this.worldManager.cleanupUnusedResources();
        }
    }
    
    cleanupUnusedMaterials() {
        // This is handled automatically by Three.js, but we can help
        // by ensuring we're not holding references to unused materials
        if (this.worldManager) {
            this.worldManager.cleanupUnusedResources();
        }
    }
    
    // Object tracking and validation
    validateSceneIntegrity() {
        if (!this.scene) return;
        
        let validObjects = 0;
        let invalidObjects = 0;
        
        this.scene.traverse((object) => {
            if (object && object.isObject3D) {
                validObjects++;
                
                // Check for common issues that cause objects to disappear
                if (object.position && (isNaN(object.position.x) || isNaN(object.position.y) || isNaN(object.position.z))) {
                    console.warn('⚠️ Object with invalid position detected:', object);
                    invalidObjects++;
                }
                
                if (object.geometry && !object.geometry.attributes) {
                    console.warn('⚠️ Object with invalid geometry detected:', object);
                    invalidObjects++;
                }
                
                if (object.material && !object.material.isMaterial) {
                    console.warn('⚠️ Object with invalid material detected:', object);
                    invalidObjects++;
                }
            } else {
                invalidObjects++;
            }
        });
        
        if (invalidObjects > 0) {
            console.warn(`⚠️ Scene integrity check: ${validObjects} valid, ${invalidObjects} invalid objects`);
        } else {
            console.log(`✅ Scene integrity check: ${validObjects} valid objects`);
        }
        
        return { valid: validObjects, invalid: invalidObjects };
    }
    
    // Manual cleanup triggers for debugging
    forceCleanup() {
        console.log('🔧 Force cleanup triggered manually');
        this.cleanupUnusedResources();
        this.validateSceneIntegrity();
        
        if (this.worldManager) {
            this.worldManager.validateWorldIntegrity();
        }
    }
    
    // Debug object counts and memory usage
    debugMemoryUsage() {
        if (!this.renderer) return;
        
        const info = this.renderer.info;
        const memory = info.memory;
        const render = info.render;
        
        console.log('🔧 Memory Usage Debug:');
        console.log(`  - Geometries: ${memory.geometries}`);
        console.log(`  - Materials: ${memory.materials}`);
        console.log(`  - Textures: ${memory.textures}`);
        console.log(`  - Triangles: ${render.triangles}`);
        console.log(`  - Draw Calls: ${render.calls}`);
        console.log(`  - Scene Objects: ${this.scene ? this.scene.children.length : 'N/A'}`);
        
        if (this.worldManager) {
            console.log('🌍 World Object Counts:');
            console.log(`  - Pyramids: ${this.worldManager.pyramids.length}`);
            console.log(`  - Temples: ${this.worldManager.temples.length}`);
            console.log(`  - Sphinxes: ${this.worldManager.sphinxes.length}`);
            console.log(`  - Obelisks: ${this.worldManager.obelisks.length}`);
            console.log(`  - Resources: ${this.worldManager.resourceNodes.length}`);
            console.log(`  - Decorations: ${this.worldManager.decorations.length}`);
        }
    }
    
    // Add keyboard shortcuts for debugging
    setupDebugControls() {
        document.addEventListener('keydown', (event) => {
            // Ctrl+Shift+C for cleanup
            if (event.ctrlKey && event.shiftKey && event.key === 'C') {
                event.preventDefault();
                console.log('🔧 Debug: Manual cleanup triggered');
                this.forceCleanup();
            }
            
            // Ctrl+Shift+M for memory debug
            if (event.ctrlKey && event.shiftKey && event.key === 'M') {
                event.preventDefault();
                console.log('🔧 Debug: Memory usage debug triggered');
                this.debugMemoryUsage();
            }
            
            // Ctrl+Shift+V for scene validation
            if (event.ctrlKey && event.shiftKey && event.key === 'V') {
                event.preventDefault();
                console.log('🔧 Debug: Scene validation triggered');
                this.validateSceneIntegrity();
            }
            
            // Ctrl+Shift+O for object visibility debug
            if (event.ctrlKey && event.shiftKey && event.key === 'O') {
                event.preventDefault();
                console.log('🔧 Debug: Object visibility debug triggered');
                if (this.worldManager) {
                    this.worldManager.debugObjectVisibility();
                }
            }
            
            // Ctrl+Shift+F for force all objects visible
            if (event.ctrlKey && event.shiftKey && event.key === 'F') {
                event.preventDefault();
                console.log('🔧 Debug: Force all objects visible triggered');
                if (this.worldManager) {
                    this.worldManager.forceAllObjectsVisible();
                }
            }
        });
    }

    updateCamera() {
        if (!this.player) return;
        
        const playerPosition = this.player.getPosition();
        
        // Handle camera orbit rotation from arrow keys ONLY
        this.handleCameraOrbit();
        
        // Camera position uses FIXED offsets that only change with arrow keys
        // Camera follows player but maintains its exact relative position
        const targetCameraPosition = new THREE.Vector3(
            playerPosition.x + this.cameraOffsetX,
            playerPosition.y + this.cameraOffsetY,
            playerPosition.z + this.cameraOffsetZ
        );
        
        // Set camera position directly - no lerp to prevent rotation back
        this.camera.position.copy(targetCameraPosition);
        
        // Camera always looks at the player
        this.camera.lookAt(new THREE.Vector3(
            playerPosition.x,
            playerPosition.y + 1,
            playerPosition.z
        ));
        
        // Debug camera info - log very occasionally to avoid spam
        if (Math.random() < 0.005) { // Log 0.5% of the time (much less frequent)
            console.log('📷 Camera position:', this.camera.position.toArray().map(v => v.toFixed(2)));
            console.log('👤 Player position:', playerPosition.toArray().map(v => v.toFixed(2)));
            console.log('📷 Camera offsets:', this.cameraOffsetX.toFixed(2), this.cameraOffsetY.toFixed(2), this.cameraOffsetZ.toFixed(2));
        }
    }

    handleCameraOrbit() {
        // Get input from InputManager
        if (!this.inputManager) return;
        
        // Left/Right arrows change the X and Z offsets to rotate around player
        if (this.inputManager.isKeyPressed('ArrowLeft')) {
            // Rotate camera left around player
            const angle = Math.atan2(this.cameraOffsetX, this.cameraOffsetZ);
            const newAngle = angle + this.cameraOrbitSpeed;
            this.cameraOffsetX = Math.sin(newAngle) * this.cameraOrbitDistance;
            this.cameraOffsetZ = Math.cos(newAngle) * this.cameraOrbitDistance;
            console.log('📷 Camera rotating left - New offsets:', this.cameraOffsetX.toFixed(2), this.cameraOffsetZ.toFixed(2));
        }
        if (this.inputManager.isKeyPressed('ArrowRight')) {
            // Rotate camera right around player
            const angle = Math.atan2(this.cameraOffsetX, this.cameraOffsetZ);
            const newAngle = angle - this.cameraOrbitSpeed;
            this.cameraOffsetX = Math.sin(newAngle) * this.cameraOrbitDistance;
            this.cameraOffsetZ = Math.cos(newAngle) * this.cameraOrbitDistance;
            console.log('📷 Camera rotating right - New offsets:', this.cameraOffsetX.toFixed(2), this.cameraOffsetZ.toFixed(2));
        }
        
        // Up/Down arrows adjust camera height
        if (this.inputManager.isKeyPressed('ArrowUp')) {
            this.cameraOffsetY += this.cameraOrbitSpeed * 2;
            this.cameraOffsetY = Math.min(15, this.cameraOffsetY); // Max height
            console.log('📷 Camera height increased to:', this.cameraOffsetY.toFixed(2));
        }
        if (this.inputManager.isKeyPressed('ArrowDown')) {
            this.cameraOffsetY -= this.cameraOrbitSpeed * 2;
            this.cameraOffsetY = Math.max(2, this.cameraOffsetY); // Min height
            console.log('📷 Camera height decreased to:', this.cameraOffsetY.toFixed(2));
        }
    }

    updatePerformanceMetrics(elapsedTime) {
        if (elapsedTime - this.lastTime >= 1) {
            // Smooth FPS calculation to reduce fluctuations
            const currentFPS = this.frameCount;
            if (!this._fpsHistory) this._fpsHistory = [];
            
            // Keep last 5 FPS readings for smoothing
            this._fpsHistory.push(currentFPS);
            if (this._fpsHistory.length > 5) {
                this._fpsHistory.shift();
            }
            
            // Calculate smoothed FPS (average of last 5 readings)
            this.fps = Math.round(this._fpsHistory.reduce((a, b) => a + b, 0) / this._fpsHistory.length);
            
            this.frameCount = 0;
            this.lastTime = elapsedTime;
            
            // Performance monitoring
            const renderInfo = this.renderer.info;
            const memoryInfo = renderInfo.memory;
            const renderStats = renderInfo.render;
            
            // Log performance info (only in development)
            if (process.env.NODE_ENV === 'development') {
                console.log(`🎮 FPS: ${this.fps} | Triangles: ${renderStats.triangles} | Draw Calls: ${renderStats.calls} | Memory: ${Math.round(memoryInfo.geometries)} geometries, ${Math.round(memoryInfo.textures)} textures`);
            }
            
            // Update UI with performance info
            if (this.uiManager) {
                this.uiManager.updatePerformanceInfo(this.fps);
            }
            
            // Periodic memory cleanup to prevent leaks (less frequent to reduce FPS spikes)
            if (this.frameCount % 600 === 0) { // Every 600 frames (10 seconds at 60 FPS)
                this.cleanupMemory();
            }
            
            // Comprehensive cleanup every 5 minutes (1800 frames at 60 FPS)
            if (this.frameCount % 1800 === 0) {
                this.cleanupUnusedResources();
            }
            
            // Scene integrity check every 10 minutes (3600 frames at 60 FPS)
            if (this.frameCount % 3600 === 0) {
                this.validateSceneIntegrity();
            }
        }
    }
    
    // Main game loop
    animate() {
        if (!this.isRunning) return;
        
        try {
            const deltaTime = this.clock.getDelta();
            const currentTime = this.clock.getElapsedTime();
            
            // Limit delta time to prevent spiral of death
            const clampedDeltaTime = Math.min(deltaTime, 0.1); // Max 100ms per frame
            
            // Update FPS counter
            this.frameCount++;
            if (currentTime - this.lastTime >= 1.0) {
                this.fps = this.frameCount;
                this.frameCount = 0;
                this.lastTime = currentTime;
                
                // Log performance warnings
                if (this.fps < 30) {
                    console.warn(`⚠️ Low FPS detected: ${this.fps} FPS`);
                }
            }
            
            // Update game systems with error handling
            this.updateGameSystems(clampedDeltaTime, currentTime);
            
            // Render the scene
            if (this.renderer && this.scene && this.camera) {
                this.renderer.render(this.scene, this.camera);
            }
            
            // Continue the loop
            requestAnimationFrame(this.animate);
            
        } catch (error) {
            console.error('🚨 Game loop error:', error);
            console.error('🚨 Error stack:', error.stack);
            
            // Try to recover by continuing the loop
            setTimeout(() => {
                if (this.isRunning) {
                    requestAnimationFrame(this.animate);
                }
            }, 100);
        }
    }
    
    // Update game systems with individual error handling
    updateGameSystems(deltaTime, currentTime) {
        try {
            // Update player
            if (this.player && typeof this.player.update === 'function') {
                this.player.update(deltaTime);
            }
            
            // Update world manager
            if (this.worldManager && typeof this.worldManager.update === 'function') {
                this.worldManager.update(deltaTime);
            }
            
            // Update grid manager
            if (this.gridManager && typeof this.gridManager.update === 'function') {
                this.gridManager.update(deltaTime);
            }
            
            // Update input manager
            if (this.inputManager && typeof this.inputManager.update === 'function') {
                this.inputManager.update(deltaTime);
            }
            
            // Update crafting system
            if (this.craftingSystem && typeof this.craftingSystem.update === 'function') {
                this.craftingSystem.update(deltaTime);
            }
            
            // Update inventory system
            if (this.inventorySystem && typeof this.inventorySystem.update === 'function') {
                this.inventorySystem.update(deltaTime);
            }
            
            // Update other players
            this.updateOtherPlayers(deltaTime);
            
        } catch (error) {
            console.error('🚨 System update error:', error);
            console.error('🚨 Failed system update at time:', currentTime);
        }
    }
    
    // Update other players with error handling
    updateOtherPlayers(deltaTime) {
        try {
            this.players.forEach((playerMesh, playerId) => {
                if (playerMesh && typeof playerMesh.update === 'function') {
                    playerMesh.update(deltaTime);
                }
            });
        } catch (error) {
            console.error('🚨 Other players update error:', error);
        }
    }
    
    // Ensure all game objects have safe update methods
    ensureSafeUpdateMethods() {
        try {
            // Ensure player has update method
            if (this.player && typeof this.player.update !== 'function') {
                this.player.update = function(deltaTime) { return; };
                console.log('🔧 Added safe update method to player');
            }
            
            // Ensure world manager has update method
            if (this.worldManager && typeof this.worldManager.update !== 'function') {
                this.worldManager.update = function(deltaTime) { return; };
                console.log('🔧 Added safe update method to world manager');
            }
            
            // Ensure grid manager has update method
            if (this.gridManager && typeof this.gridManager.update !== 'function') {
                this.gridManager.update = function(deltaTime) { return; };
                console.log('🔧 Added safe update method to grid manager');
            }
            
            // Ensure input manager has update method
            if (this.inputManager && typeof this.inputManager.update !== 'function') {
                this.inputManager.update = function(deltaTime) { return; };
                console.log('🔧 Added safe update method to input manager');
            }
            
            // Ensure crafting system has update method
            if (this.craftingSystem && typeof this.craftingSystem.update !== 'function') {
                this.craftingSystem.update = function(deltaTime) { return; };
                console.log('🔧 Added safe update method to crafting system');
            }
            
            // Ensure inventory system has update method
            if (this.inventorySystem && typeof this.inventorySystem.update !== 'function') {
                this.inventorySystem.update = function(deltaTime) { return; };
                console.log('🔧 Added safe update method to inventory system');
            }
            
        } catch (error) {
            console.error('🚨 Error ensuring safe update methods:', error);
        }
    }

    handleResize() {
        if (!this.camera || !this.renderer) return;
        
        console.log('🔄 Handling resize event...');
        
        // Get the actual viewport dimensions
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;
        
        console.log(`📐 Viewport dimensions: ${viewportWidth}x${viewportHeight}`);
        
        // Update camera aspect ratio
        this.camera.aspect = viewportWidth / viewportHeight;
        this.camera.updateProjectionMatrix();
        
        // Update renderer size
        this.renderer.setSize(viewportWidth, viewportHeight, false);
        
        // Force a render to update the display
        if (this.scene && this.camera) {
            this.renderer.render(this.scene, this.camera);
        }
        
        // Update UI if available
        if (this.uiManager) {
            this.uiManager.handleResize(viewportWidth, viewportHeight);
        }
        
        console.log('✅ Resize handled successfully');
    }

    // Enhanced resize handling with debouncing
    handleResizeDebounced() {
        // Clear any existing timeout
        if (this.resizeTimeout) {
            clearTimeout(this.resizeTimeout);
        }
        
        // Set a new timeout to handle resize after a short delay
        this.resizeTimeout = setTimeout(() => {
            this.handleResize();
        }, 100);
    }

    // Restore viewport to full dimensions
    restoreViewport() {
        console.log('🔄 Restoring viewport to full dimensions...');
        
        // Force viewport to full window size
        const fullWidth = window.innerWidth;
        const fullHeight = window.innerHeight;
        
        // Update renderer
        if (this.renderer) {
            this.renderer.setSize(fullWidth, fullHeight, false);
        }
        
        // Update camera
        if (this.camera) {
            this.camera.aspect = fullWidth / fullHeight;
            this.camera.updateProjectionMatrix();
        }
        
        // Force a render
        if (this.scene && this.camera) {
            this.renderer.render(this.scene, this.camera);
        }
        
        console.log(`✅ Viewport restored to ${fullWidth}x${fullHeight}`);
    }

    // Monitor viewport changes
    monitorViewport() {
        if (this.viewportMonitorInterval) {
            clearInterval(this.viewportMonitorInterval);
        }
        
        this.viewportMonitorInterval = setInterval(() => {
            const currentWidth = window.innerWidth;
            const currentHeight = window.innerHeight;
            
            if (this.lastViewportWidth !== currentWidth || this.lastViewportHeight !== currentHeight) {
                console.log(`📐 Viewport changed: ${this.lastViewportWidth}x${this.lastViewportHeight} → ${currentWidth}x${currentHeight}`);
                
                this.lastViewportWidth = currentWidth;
                this.lastViewportHeight = currentHeight;
                
                // Auto-restore if dimensions seem wrong
                if (currentWidth < 800 || currentHeight < 600) {
                    console.log('⚠️ Viewport dimensions seem too small, attempting auto-restore...');
                    this.restoreViewport();
                }
            }
        }, 1000); // Check every second
    }

    // Stop viewport monitoring
    stopViewportMonitoring() {
        if (this.viewportMonitorInterval) {
            clearInterval(this.viewportMonitorInterval);
            this.viewportMonitorInterval = null;
        }
    }

    addPlayer(playerId, playerData) {
        const newPlayer = new Player(this.scene, null);
        newPlayer.init(playerData);
        this.players.set(playerId, newPlayer);
    }

    removePlayer(playerId) {
        const player = this.players.get(playerId);
        if (player) {
            player.destroy();
            this.players.delete(playerId);
        }
    }

    // Update player position and sync with network
    updatePlayerPosition(newPosition) {
        if (this.player) {
            this.player.setPosition(newPosition);
            
            // Sync position with other players via network
            if (this.networkManager && this.networkManager.isConnected()) {
                this.networkManager.sendPlayerPosition(newPosition);
            }
        }
    }

    // Multiplayer player handling
    setupMultiplayerCallbacks() {
        console.log('🔧 Setting up multiplayer callbacks...');
        
        if (!this.networkManager) {
            console.log('❌ No network manager available for multiplayer callbacks');
            return;
        }
        
        console.log('✅ Network manager found, setting up callbacks...');
        
        // Handle other players joining
        this.networkManager.onPlayerJoin = (playerData) => {
            console.log(`👥 Player joined: ${playerData.name}`, playerData);
            this.addOtherPlayer(playerData);
        };
        
        // Handle other players leaving
        this.networkManager.onPlayerLeave = (playerId) => {
            console.log(`👥 Player left: ${playerId}`);
            this.removeOtherPlayer(playerId);
        };
        
        // Handle other players moving
        this.networkManager.onPlayerMove = (data) => {
            console.log(`👥 Player moved: ${data.playerId}`, data);
            this.updateOtherPlayer(data);
        };
        
        // Handle world state updates
        this.networkManager.onWorldUpdate = (worldData) => {
            console.log(`🌍 World state update received:`, worldData);
            this.handleWorldStateUpdate(worldData);
        };
        
        // Handle time updates
        this.networkManager.onTimeUpdate = (timeData) => {
            console.log(`🕐 Time update received:`, timeData);
            this.handleTimeUpdate(timeData);
        };
        
        console.log('✅ Multiplayer callbacks set up successfully');
    }

    // Logout and cleanup
    logout() {
        console.log('🚪 GameEngine logout initiated...');
        
        try {
            // Pause the game
            this.pause();
            
            // Disconnect from network
            if (this.networkManager) {
                this.networkManager.disconnect();
            }
            
            // Clear any game state
            this.isInitialized = false;
            
            console.log('✅ GameEngine logout completed');
            
        } catch (error) {
            console.error('❌ Error during logout:', error);
        }
    }

    // Get player reference
    getPlayer() {
        return this.player;
    }
    
    // Handle world state update from server
    handleWorldStateUpdate(worldData) {
        console.log(`🌍 Processing world state with ${worldData.players?.length || 0} players`);
        
        // Sync world time first
        if (worldData.worldTime && this.worldManager && this.worldManager.dayNightCycle) {
            this.worldManager.dayNightCycle.time = worldData.worldTime.time;
            console.log(`🕐 Initial time sync: ${(worldData.worldTime.time * 24).toFixed(1)}h`);
        }
        
        if (worldData.players) {
            worldData.players.forEach(playerData => {
                // Don't add our own player
                if (playerData.id !== this.networkManager?.getPlayerId()) {
                    console.log(`🌍 Adding existing player: ${playerData.name}`);
                    this.addOtherPlayer(playerData);
                }
            });
        }
    }
    
    // Handle time update from server
    handleTimeUpdate(timeData) {
        if (this.worldManager && this.worldManager.dayNightCycle) {
            // Sync the world time with the server
            this.worldManager.dayNightCycle.time = timeData.time;
            console.log(`🕐 Synced world time to: ${(timeData.time * 24).toFixed(1)}h`);
        }
    }
    
    // Add other player to the world
    addOtherPlayer(playerData) {
        if (this.players.has(playerData.id)) return;
        
        try {
            console.log(`👥 Creating player mesh for: ${playerData.name}`);
            
            // Create a simple player representation
            const playerMesh = new THREE.Mesh(
                new THREE.CapsuleGeometry(0.5, 1, 4, 8),
                new THREE.MeshLambertMaterial({ color: 0x00ff00 })
            );
            
            playerMesh.position.set(playerData.position.x, playerData.position.y, playerData.position.z);
            playerMesh.userData = { 
                playerId: playerData.id, 
                playerName: playerData.name,
                isOtherPlayer: true
            };
            
            // Add name tag
            const nameTag = this.createNameTag(playerData.name);
            nameTag.position.set(0, 2, 0);
            playerMesh.add(nameTag);
            
            // Add a safe update method that does nothing (prevents crashes)
            playerMesh.update = function(deltaTime) {
                // Other players don't need complex updates, just keep the method safe
                return;
            };
            
            this.scene.add(playerMesh);
            this.players.set(playerData.id, playerMesh);
            
            console.log(`✅ Added player ${playerData.name} to the world`);
            
        } catch (error) {
            console.error(`❌ Failed to add player ${playerData.name}:`, error);
        }
    }
    
    // Remove other player from the world
    removeOtherPlayer(playerId) {
        const playerMesh = this.players.get(playerId);
        if (playerMesh) {
            this.scene.remove(playerMesh);
            this.players.delete(playerId);
            console.log(`✅ Removed player ${playerId} from the world`);
        }
    }
    
    // Update other player position
    updateOtherPlayer(data) {
        const playerMesh = this.players.get(data.playerId);
        if (playerMesh) {
            playerMesh.position.set(data.position.x, data.position.y, data.position.z);
            if (data.rotation) {
                playerMesh.rotation.set(data.rotation.x, data.rotation.y, data.rotation.z);
            }
            console.log(`👥 Updated player ${data.playerId} position: (${data.position.x.toFixed(1)}, ${data.position.y.toFixed(1)}, ${data.position.z.toFixed(1)})`);
        } else {
            console.warn(`⚠️ Received movement update for unknown player: ${data.playerId}`);
        }
    }
    
    // Create name tag for other players
    createNameTag(name) {
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        canvas.width = 256;
        canvas.height = 64;
        
        context.fillStyle = 'rgba(0, 0, 0, 0.7)';
        context.fillRect(0, 0, canvas.width, canvas.height);
        
        context.fillStyle = '#FFD700';
        context.font = 'bold 24px Arial';
        context.textAlign = 'center';
        context.fillText(name, canvas.width / 2, canvas.height / 2 + 8);
        
        const texture = new THREE.CanvasTexture(canvas);
        const material = new THREE.MeshBasicMaterial({ 
            map: texture, 
            transparent: true,
            side: THREE.DoubleSide
        });
        
        const plane = new THREE.Mesh(
            new THREE.PlaneGeometry(4, 1),
            material
        );
        
        return plane;
    }

    // Debug multiplayer status
    debugMultiplayerStatus() {
        console.log('🔍 === Multiplayer Debug Info ===');
        console.log('🔍 Network Manager:', this.networkManager ? '✅ Available' : '❌ Not Available');
        
        if (this.networkManager) {
            console.log('🔍 Connection Status:', this.networkManager.isConnected ? '✅ Connected' : '❌ Disconnected');
            console.log('🔍 Player ID:', this.networkManager.playerId);
            console.log('🔍 Connection Info:', this.networkManager.getConnectionStatus());
        }
        
        console.log('🔍 Local Players Map Size:', this.players.size);
        console.log('🔍 Local Players:', Array.from(this.players.keys()));
        console.log('🔍 ===============================');
    }

    // Test movement sync
    testMovementSync() {
        console.log('🧪 Testing movement sync...');
        
        if (!this.networkManager || !this.networkManager.isConnected) {
            console.warn('⚠️ Network not connected for movement sync test');
            return;
        }
        
        if (!this.player) {
            console.warn('⚠️ No local player for movement sync test');
            return;
        }
        
        // Send a test position
        const testPosition = { x: 10, y: 0, z: 10 };
        console.log('🧪 Sending test position:', testPosition);
        this.networkManager.sendPlayerPosition(testPosition);
        
        console.log('🧪 Movement sync test completed');
    }

    // Set loading manager
    setLoadingManager(loadingManager) {
        this.loadingManager = loadingManager;
        console.log('📦 Loading Manager connected to Game Engine');
    }

    // Set player name from character creator
    setPlayerName(name) {
        if (this.player) {
            this.player.setName(name);
            console.log(`👤 Player name set to: ${name}`);
        } else {
            // Store name for when player is created
            this.pendingPlayerName = name;
            console.log(`👤 Player name stored for later: ${name}`);
        }
    }

    // Check and apply pending player name (called after player creation)
    checkPendingPlayerName() {
        if (this.pendingPlayerName && this.player) {
            this.player.setName(this.pendingPlayerName);
            this.pendingPlayerName = null;
            console.log(`👤 Applied pending player name: ${this.player.name}`);
        }
    }

    // System setters
    setUIManager(uiManager) {
        this.uiManager = uiManager;
        
        // Also set UIManager for WorldManager
        if (this.worldManager) {
            this.worldManager.setUIManager(uiManager);
        }
        
        // Give UIManager access to GameEngine for player reference
        if (uiManager) {
            uiManager.gameEngine = this;
        }
    }

    setNetworkManager(networkManager) {
        this.networkManager = networkManager;
        this.setupMultiplayerCallbacks(); // Setup callbacks for network manager
    }
    
    setAudioManager(audioManager) {
        this.audioManager = audioManager;
    }
    
    setOptionsManager(optionsManager) {
        this.optionsManager = optionsManager;
        console.log('⚙️ Options Manager connected to Game Engine');
    }
    
    // Audio settings
    setMasterVolume(volume) {
        if (this.audioManager) {
            this.audioManager.setMasterVolume(volume);
        }
        console.log(`🔊 Master volume set to: ${volume}`);
    }
    
    setMusicVolume(volume) {
        if (this.audioManager) {
            this.audioManager.setMusicVolume(volume);
        }
        console.log(`🎵 Music volume set to: ${volume}`);
    }
    
    setSFXVolume(volume) {
        if (this.audioManager) {
            this.audioManager.setSFXVolume(volume);
        }
        console.log(`🔊 SFX volume set to: ${volume}`);
    }
    
    // Control settings
    setMouseSensitivity(sensitivity) {
        if (this.inputManager) {
            this.inputManager.setMouseSensitivity(sensitivity);
        }
        console.log(`🖱️ Mouse sensitivity set to: ${sensitivity}`);
    }
    
    setCameraSpeed(speed) {
        if (this.player) {
            this.player.setCameraSpeed(speed);
        }
        console.log(`📷 Camera speed set to: ${speed}`);
    }

    // Getter methods
    getPlayer() {
        return this.player;
    }

    getScene() {
        return this.scene;
    }

    getCamera() {
        return this.camera;
    }

    getGridManager() {
        return this.gridManager;
    }

    getCraftingSystem() {
        return this.craftingSystem;
    }

    getInventorySystem() {
        return this.inventorySystem;
    }

    handleKeyDown(key) {
        console.log('⌨️ Key pressed:', key);
        
        // Handle player movement keys
        if (this.player) {
            // You can add keyboard movement here if desired
            // For now, we're focusing on click-to-move
        }
        
        // Handle other game keys
        switch (key) {
            case 'KeyI':
                if (this.uiManager) {
                    this.uiManager.toggleInventory();
                }
                break;
            case 'KeyC':
                if (this.uiManager) {
                    this.uiManager.toggleCraftingPanel();
                }
                break;
            case 'KeyM':
                // Debug multiplayer status
                this.debugMultiplayerStatus();
                break;
            case 'KeyR':
                // Reset camera to default position
                this.resetCamera();
                break;
            case 'BracketLeft': // [
                // Decrease camera smoothing (more responsive)
                // this.cameraSmoothingFactor = Math.max(0.01, this.cameraSmoothingFactor - 0.01);
                // console.log('📷 Camera smoothing decreased:', this.cameraSmoothingFactor.toFixed(3));
                break;
            case 'BracketRight': // ]
                // Increase camera smoothing (more smooth)
                // this.cameraSmoothingFactor = Math.min(0.1, this.cameraSmoothingFactor + 0.01);
                // console.log('📷 Camera smoothing increased:', this.cameraSmoothingFactor.toFixed(3));
                break;
            case 'Escape':
                // Toggle options panel
                console.log('⌨️ Escape pressed - checking options manager...');
                if (this.optionsManager) {
                    console.log('✅ Options manager found, toggling options...');
                    this.optionsManager.toggleOptions();
                } else {
                    console.log('❌ Options manager not found, falling back to hideAllPanels...');
                    if (this.uiManager) {
                        this.uiManager.hideAllPanels();
                    }
                }
                break;
        }
    }

    // Debug camera state
    debugCameraState() {
        console.log('📷 === Camera Debug Info ===');
        console.log('📷 Current offsets:', {
            X: this.cameraOffsetX.toFixed(2),
            Y: this.cameraOffsetY.toFixed(2),
            Z: this.cameraOffsetZ.toFixed(2)
        });
        console.log('📷 Camera position:', this.camera.position.toArray().map(v => v.toFixed(2)));
        if (this.player) {
            const playerPos = this.player.getPosition();
            console.log('👤 Player position:', playerPos.toArray().map(v => v.toFixed(2)));
            console.log('📷 Expected camera position:', [
                (playerPos.x + this.cameraOffsetX).toFixed(2),
                (playerPos.y + this.cameraOffsetY).toFixed(2),
                (playerPos.z + this.cameraOffsetZ).toFixed(2)
            ]);
        }
        console.log('📷 ========================');
    }

    // Reset camera to default position
    resetCamera() {
        this.cameraOffsetX = 0; // Reset to behind player
        this.cameraOffsetY = 5; // Reset to default height
        this.cameraOffsetZ = 10; // Reset to default distance
        console.log('📷 Camera reset to default orbital position');
    }

    handleKeyUp(key) {
        console.log('⌨️ Key released:', key);
        
        // Handle key release events if needed
    }
}
