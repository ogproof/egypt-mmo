import * as THREE from 'three';

export class Player {
    constructor(scene, physicsWorld) {
        this.scene = scene;
        this.physicsWorld = physicsWorld;
        
        // Player state
        this.position = new THREE.Vector3(0, 0, 0);
        this.rotation = 0;
        this.isMoving = false;
        this.targetPosition = null;
        this.moveSpeed = 15;
        
        // Movement
        this.movementQuat = new THREE.Quaternion();
        this.targetQuat = new THREE.Quaternion();
        this.movementPath = null; // Path to follow
        this.currentPathIndex = 0; // Current waypoint index
        this.camera = null; // Camera reference for following
        
        // 3D objects
        this.mesh = null;
        this.nameTag = null;
        this.targetIndicator = null;
        
        // Equipment
        this.equipment = {
            head: null,
            chest: null,
            legs: null,
            feet: null,
            weapon: null,
            offhand: null,
            accessory: null
        };
        
        // Equipment meshes
        this.equipmentMeshes = {
            weapon: null,
            offhand: null
        };
        
        // Light source (for torch)
        this.equippedLight = null;
        
        // Animation system
        this.mixer = null;
        this.animations = {};
        this.currentAnimation = 'idle';
        
        // Camera rotation
        this.cameraRotation = new THREE.Quaternion();
        this.cameraRotationDirection = 0;
        this.rotationSpeed = 0.01;
        
        // Movement direction for rotation
        this.movementDirection = null;
        
        // Player stats
        this.stats = {
            health: 100,
            maxHealth: 100,
            level: 1,
            experience: 0,
            energy: 100,
            maxEnergy: 100,
            gold: 0
        };
        
        // Initialization flag
        this.isInitialized = false;
    }

    async init() {
        // Prevent double initialization
        if (this.isInitialized) {
            console.warn('⚠️ Player already initialized, skipping...');
            return;
        }
        
        console.log('👤 Initializing Player...');
        
        this.createMesh();
        this.createNameTag();
        this.setupAnimations();
        
        // Set initial position
        this.position.set(0, 0, 0);
        this.mesh.position.copy(this.position);
        
        this.isInitialized = true; // Mark as initialized
        console.log('✅ Player initialized');
    }

    // Set player name
    setName(name) {
        this.name = name;
        if (this.nameTag) {
            // Update name tag text
            this.updateNameTag();
        }
        console.log(`👤 Player name set to: ${name}`);
    }

    // Getter methods for stats
    get health() { return this.stats.health; }
    get maxHealth() { return this.stats.maxHealth; }
    get level() { return this.stats.level; }
    get experience() { return this.stats.experience; }
    get energy() { return this.stats.energy || 100; }
    get maxEnergy() { return this.stats.maxEnergy || 100; }
    get gold() { return this.stats.gold || 0; }

    // Update name tag with current name
    updateNameTag() {
        if (!this.nameTag || !this.name) return;
        
        // Create new canvas with updated name
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        canvas.width = 256;
        canvas.height = 64;
        
        // Background
        context.fillStyle = 'rgba(0, 0, 0, 0.7)';
        context.fillRect(0, 0, canvas.width, canvas.height);
        
        // Text
        context.fillStyle = '#FFD700';
        context.font = 'bold 24px Arial';
        context.textAlign = 'center';
        context.fillText(this.name, canvas.width / 2, canvas.height / 2 + 8);
        
        // Update texture
        if (this.nameTag.material && this.nameTag.material.map) {
            this.nameTag.material.map.image = canvas;
            this.nameTag.material.map.needsUpdate = true;
        }
    }

    createMesh() {
        // Create a polygon-based human model instead of capsule
        this.createHumanMesh();
        
        // Set initial position
        this.mesh.position.copy(this.position);
        
        // Add to scene
        this.scene.add(this.mesh);
    }

    createHumanMesh() {
        // Create a simple capsule character
        const capsuleGeometry = new THREE.CapsuleGeometry(0.5, 1.5, 8, 8);
        const capsuleMaterial = new THREE.MeshLambertMaterial({ 
            color: 0x6b8e23, // Olive green
            transparent: true,
            opacity: 0.9
        });
        
        this.mesh = new THREE.Mesh(capsuleGeometry, capsuleMaterial);
        this.mesh.position.y = 1.5; // Position so bottom of capsule is at ground level
        this.mesh.castShadow = true;
        this.mesh.receiveShadow = true;
        
        console.log('👤 Simple capsule character created');
        
        // Create player name tag
        this.createNameTag();
    }
    
    // Walking animation - Simple capsule
    animateWalk(time) {
        // Simple capsule bounce during walking
        if (this.mesh) {
            const bounceHeight = 0.1;
            const bounceSpeed = 8;
            this.mesh.position.y = 1.5 + Math.sin(time * bounceSpeed) * bounceHeight;
        }
    }

    // Idle animation - Simple capsule
    animateIdle(time) {
        // Simple capsule breathing motion
        if (this.mesh) {
            const breathingScale = 0.02;
            const breathingSpeed = 2;
            const scale = 1 + Math.sin(time * breathingSpeed) * breathingScale;
            this.mesh.scale.set(scale, scale, scale);
        }
    }

    // Reset animation
    resetAnimation() {
        if (this.mesh) {
            this.mesh.position.y = 1.5;
            this.mesh.scale.set(1, 1, 1);
        }
    }

    createNameTag() {
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        canvas.width = 256;
        canvas.height = 64;
        
        context.fillStyle = 'rgba(0, 0, 0, 0.5)';
        context.fillRect(0, 0, canvas.width, canvas.height);
        
        context.fillStyle = '#ffffff';
        context.font = '24px Arial';
        context.textAlign = 'center';
        context.fillText('Player', canvas.width / 2, 40);
        
        const texture = new THREE.CanvasTexture(canvas);
        const material = new THREE.SpriteMaterial({ map: texture });
        const sprite = new THREE.Sprite(material);
        
        sprite.position.y = 2.5; // Position above the capsule
        sprite.scale.set(2, 0.5, 1);
        
        this.mesh.add(sprite);
    }

    // Physics body removed - using direct mesh positioning instead

    setupAnimations() {
        // Create animation mixer
        this.mixer = new THREE.AnimationMixer(this.mesh);
        
        // Create basic animations (placeholder)
        this.createIdleAnimation();
        this.createWalkAnimation();
        
        // Start idle animation
        this.playAnimation('idle');
    }

    createIdleAnimation() {
        // Simple idle animation - slight rotation instead of position
        const times = [0, 1, 2];
        const rotations = [
            [0, 0, 0, 1],
            [0, 0.02, 0, 1],
            [0, 0, 0, 1]
        ];
        
        const rotationKF = new THREE.QuaternionKeyframeTrack('.quaternion', times, rotations.flat());
        const clip = new THREE.AnimationClip('idle', 2, [rotationKF]);
        
        this.animations.idle = this.mixer.clipAction(clip);
    }

    createWalkAnimation() {
        // Simple walk animation - slight rotation instead of position
        const times = [0, 0.5, 1];
        const rotations = [
            [0, 0, 0, 1],
            [0, 0.05, 0, 1],
            [0, 0, 0, 1]
        ];
        
        const rotationKF = new THREE.QuaternionKeyframeTrack('.quaternion', times, rotations.flat());
        const clip = new THREE.AnimationClip('walk', 1, [rotationKF]);
        
        this.animations.walk = this.mixer.clipAction(clip);
    }

    playAnimation(animationName) {
        if (this.currentAnimation === animationName) return;
        
        // Stop current animation
        if (this.animations[this.currentAnimation]) {
            this.animations[this.currentAnimation].stop();
        }
        
        // Play new animation
        if (this.animations[animationName]) {
            this.animations[animationName].play();
            this.currentAnimation = animationName;
        }
    }

    // Input handling
    handleKeyDown(key) {
        switch (key) {
            case 'ArrowLeft':
                // Start rotating camera left
                this.cameraRotationDirection = -1;
                break;
            case 'ArrowRight':
                // Start rotating camera right
                this.cameraRotationDirection = 1;
                break;
        }
    }

    handleKeyUp(key) {
        switch (key) {
            case 'ArrowLeft':
            case 'ArrowRight':
                // Stop camera rotation
                this.cameraRotationDirection = 0;
                break;
        }
    }
    
    rotateCamera(deltaTime) {
        // Continuous camera rotation while keys are held
        if (this.cameraRotationDirection !== 0) {
            const rotationY = new THREE.Quaternion().setFromAxisAngle(
                new THREE.Vector3(0, 1, 0),
                this.cameraRotationDirection * this.rotationSpeed * deltaTime * 60 // Smooth rotation
            );
            this.cameraRotation.multiply(rotationY);
        }
    }

    handleMouseMove(deltaX, deltaY) {
        // Mouse movement is now handled by arrow keys for camera rotation
        // This method is kept for compatibility but no longer used
    }

    // Movement
    update(deltaTime) {
        if (!this.isInitialized) return;
        
        // Update movement
        this.updateMovement(deltaTime);
        
        // Update animations based on movement state
        const time = performance.now() * 0.001; // Convert to seconds
        
        if (this.isMoving) {
            // Walking animation
            this.animateWalk(time);
        } else {
            // Idle animation
            this.animateIdle(time);
        }
    }

    updateMovement(deltaTime) {
        if (!this.isMoving || !this.targetPosition) return;
        
        // Calculate distance to target
        const distanceToTarget = this.position.distanceTo(this.targetPosition);
        
        if (distanceToTarget < 0.2) { // Reduced threshold for more precise stopping
            // Reached destination
            this.isMoving = false;
            this.targetPosition = null;
            this.movementPath = null;
            this.currentPathIndex = 0;
            
            // 🔧 NETWORK SYNC: Send final position when stopping
            if (window.egyptMMO?.networkManager?.isConnected) {
                try {
                    window.egyptMMO.networkManager.sendPlayerPosition(this.position);
                } catch (error) {
                    console.warn('⚠️ Failed to sync final position:', error);
                }
            }
            
            // Clear grid highlight
            const gridManager = this.scene.userData.gridManager;
            if (gridManager) {
                gridManager.clearHighlight();
            }
            
            console.log('✅ Reached destination');
            return;
        }
        
        // Calculate movement direction
        const direction = this.targetPosition.clone().sub(this.position).normalize();
        
        // Move towards target
        const moveDistance = this.moveSpeed * deltaTime;
        const newPosition = this.position.clone().add(direction.multiplyScalar(moveDistance));
        
        // Update position
        this.position.copy(newPosition);
        this.mesh.position.copy(this.position);
        
        // 🔧 NETWORK SYNC: Send position update to other players (throttled)
        if (window.egyptMMO?.networkManager?.isConnected) {
            // Only send updates every 100ms to reduce network traffic
            if (!this.lastNetworkUpdate || Date.now() - this.lastNetworkUpdate > 100) {
                try {
                    window.egyptMMO.networkManager.sendPlayerPosition(this.position);
                    this.lastNetworkUpdate = Date.now();
                    console.log(`🌐 Sent position update: (${this.position.x.toFixed(1)}, ${this.position.y.toFixed(1)}, ${this.position.z.toFixed(1)})`);
                } catch (error) {
                    console.warn('⚠️ Failed to sync position:', error);
                }
            }
        }
        
        // Update camera position to follow player
        if (this.camera) {
            this.camera.position.x = this.position.x;
            this.camera.position.z = this.position.z + 10;
            this.camera.lookAt(this.position);
        }
        
        // Rotate player to face movement direction
        if (direction.length() > 0.1) {
            const targetRotation = Math.atan2(direction.x, direction.z);
            this.mesh.rotation.y = targetRotation;
        }
        
        // Update name tag position
        if (this.nameTag) {
            this.nameTag.position.copy(this.position);
            this.nameTag.position.y += 3;
        }
        
        // Update equipment meshes
        this.updateEquipmentPositions();
    }

    updateTorchAnimation(deltaTime) {
        if (!this.equipmentMeshes.offhand) return;
        
        const time = Date.now() * 0.003;
        
        // Flickering flame effect
        const flicker = Math.sin(time * 8) * 0.1 + Math.sin(time * 15) * 0.05 + 0.95;
        const flame = this.equipmentMeshes.offhand.children[1]; // Flame is second child
        if (flame) {
            flame.scale.setScalar(flicker);
        }
        
        // Dynamic light intensity (flickering)
        if (this.equippedLight) {
            const lightFlicker = Math.sin(time * 6) * 0.2 + Math.sin(time * 12) * 0.1 + 0.9;
            this.equippedLight.intensity = 1.5 * lightFlicker;
        }
    }

    updatePhysics(deltaTime) {
        // Check if mesh still exists and is in scene
        if (!this.mesh || !this.mesh.parent) {
            console.error('❌ Mesh is missing or not in scene!');
            return;
        }
        
        // Sync mesh position with our position - use direct assignment
        this.mesh.position.x = this.position.x;
        this.mesh.position.y = this.position.y;
        this.mesh.position.z = this.position.z;
        
        // Force the mesh to update its matrix
        this.mesh.updateMatrix();
        
        // Debug mesh sync - log very occasionally when moving
        if (this.isMoving && Math.random() < 0.02) { // Only log 2% of the time to avoid spam
            console.log('🔗 Mesh Sync - Internal:', this.position.x.toFixed(2), this.position.z.toFixed(2));
            console.log('🔗 Mesh Sync - Mesh:', this.mesh.position.x.toFixed(2), this.mesh.position.z.toFixed(2));
        }
        
        // Handle mesh rotation - only update if we have a movement direction
        if (this.movementDirection) {
            const targetRotation = Math.atan2(this.movementDirection.x, this.movementDirection.z);
            const movementQuat = new THREE.Quaternion().setFromAxisAngle(
                new THREE.Vector3(0, 1, 0),
                targetRotation
            );
            this.mesh.quaternion.copy(movementQuat);
        }
        // If not moving, keep the last rotation (don't reset to identity)
    }

    updateAnimations(deltaTime) {
        if (this.mixer) {
            this.mixer.update(deltaTime);
        }
    }

    updateStats(deltaTime) {
        // Stats are updated elsewhere (health regeneration, etc.)
    }

    // Ground contact check removed - not needed with direct positioning

    // Interaction methods
    startGathering(resourceNode) {
        console.log(`Started gathering from ${resourceNode.name || 'resource'}`);
        
        // This would start a gathering animation and timer
        // For now, just log the action
    }
    
    // Click-to-move method with improved precision
    moveToPosition(worldPosition) {
        console.log('👤 Player.moveToPosition called with:', worldPosition);
        
        // Get the grid manager from the scene (we'll need to pass it)
        const gridManager = this.scene.userData.gridManager;
        if (!gridManager) {
            console.warn('❌ Grid manager not found, using direct movement');
            this.moveToPositionDirect(worldPosition);
            return;
        }
        
        // Check if the clicked position is walkable
        if (gridManager.isWalkable(worldPosition)) {
            // If clicked position is walkable, go there directly (more precise)
            this.targetPosition = worldPosition.clone();
            this.targetPosition.y = 0; // Keep player at ground level
            
            // Highlight the grid cell for visual feedback
            gridManager.highlightCell(worldPosition);
            
            console.log(`👤 Moving to clicked position: ${this.targetPosition.x.toFixed(1)}, ${this.targetPosition.z.toFixed(1)}`);
        } else {
            // If clicked position is not walkable, find nearest walkable
            const walkablePosition = gridManager.findNearestWalkable(worldPosition);
            const gridCell = gridManager.getCellAtWorld(walkablePosition);
            
            if (!gridCell || gridCell.state !== 'walkable') {
                console.warn('❌ No walkable cell found at target position');
                return;
            }
            
            // Highlight the target cell
            gridManager.highlightCell(walkablePosition);
            
            // Go to the walkable position (not necessarily cell center)
            this.targetPosition = walkablePosition.clone();
            this.targetPosition.y = 0; // Keep player at ground level
            
            console.log(`👤 Moving to nearest walkable: ${this.targetPosition.x.toFixed(1)}, ${this.targetPosition.z.toFixed(1)}`);
        }
        
        this.isMoving = true;
        
        // Create visual indicator for target position
        this.showTargetIndicator(this.targetPosition);
        
        // Simplified path - just go directly to target
        this.movementPath = [this.targetPosition.clone()];
        this.currentPathIndex = 0;
        
        console.log(`🗺️ Direct path to target`);
    }

    // Direct movement (fallback)
    moveToPositionDirect(worldPosition) {
        this.targetPosition = new THREE.Vector3(worldPosition.x, 0, worldPosition.z);
        this.isMoving = true;
        console.log(`👤 Moving to position: ${this.targetPosition.x}, ${this.targetPosition.z}`);
        
        // Create visual indicator for target position
        this.showTargetIndicator(this.targetPosition);
    }
    
    showTargetIndicator(position) {
        // Remove previous indicator if it exists
        if (this.targetIndicator) {
            this.scene.remove(this.targetIndicator);
        }
        
        // Create a simple target indicator (ring on the ground)
        const ringGeometry = new THREE.RingGeometry(0.3, 0.5, 16);
        const ringMaterial = new THREE.MeshBasicMaterial({ 
            color: 0x00ff00, 
            transparent: true, 
            opacity: 0.7,
            side: THREE.DoubleSide
        });
        
        this.targetIndicator = new THREE.Mesh(ringGeometry, ringMaterial);
        this.targetIndicator.rotation.x = -Math.PI / 2;
        this.targetIndicator.position.copy(position);
        this.targetIndicator.position.y = 0.1;
        
        this.scene.add(this.targetIndicator);
        
        // Remove indicator after 3 seconds
        setTimeout(() => {
            if (this.targetIndicator) {
                this.scene.remove(this.targetIndicator);
                this.targetIndicator = null;
            }
        }, 3000);
    }

    // Getters
    getPosition() {
        return this.position.clone();
    }

    getRotation() {
        return this.mesh.quaternion.clone();
    }
    
        getCameraRotation() {
        return this.cameraRotation.clone();
    }
    
    // Camera speed control
    setCameraSpeed(speed) {
        this.rotationSpeed = 0.01 * speed;
    }
    
    getStats() {
        return { ...this.stats };
    }

    getEquipment() {
        return { ...this.equipment };
    }

    // Utility methods
    takeDamage(amount) {
        this.stats.health = Math.max(0, this.stats.health - amount);
        
        if (this.stats.health <= 0) {
            this.die();
        }
        
        return this.stats.health;
    }

    heal(amount) {
        this.stats.health = Math.min(this.stats.maxHealth, this.stats.health + amount);
        return this.stats.health;
    }

    addExperience(amount) {
        this.stats.experience += amount;
        
        // Check for level up
        const expForNextLevel = this.getExperienceForLevel(this.stats.level + 1);
        if (this.stats.experience >= expForNextLevel) {
            this.levelUp();
        }
        
        return this.stats.experience;
    }

    getExperienceForLevel(level) {
        return Math.floor(100 * Math.pow(1.5, level - 1));
    }

    levelUp() {
        this.stats.level++;
        this.stats.maxHealth += 10;
        this.stats.health = this.stats.maxHealth;
        
        console.log(`🎉 Level up! You are now level ${this.stats.level}`);
    }

    die() {
        console.log('💀 Player died!');
        // This would trigger respawn logic
        this.respawn();
    }

    respawn() {
        // Reset position and health
        this.position.set(0, 0, 0);
        this.stats.health = this.stats.maxHealth;
        
        console.log('🔄 Player respawned');
    }

    // Equipment methods
    equipItem(itemId, slot) {
        // Remove current item in slot
        if (this.equipment[slot]) {
            this.unequipItem(slot);
        }

        // Set equipment
        this.equipment[slot] = itemId;

        // Handle specific equipment types
        if (slot === 'offhand' && itemId === 'torch') {
            this.equipTorch();
        }

        console.log(`🔧 Equipped ${itemId} in ${slot} slot`);
    }

    unequipItem(slot) {
        const itemId = this.equipment[slot];
        if (!itemId) return;

        // Handle specific equipment types
        if (slot === 'offhand' && itemId === 'torch') {
            this.unequipTorch();
        }

        this.equipment[slot] = null;
        console.log(`🔧 Unequipped ${itemId} from ${slot} slot`);
    }

    equipTorch() {
        // Create torch mesh
        const torchGroup = new THREE.Group();
        
        // Torch handle
        const handleGeometry = new THREE.CylinderGeometry(0.05, 0.05, 1.5, 8);
        const handleMaterial = new THREE.MeshLambertMaterial({ color: 0x8B4513 });
        const handle = new THREE.Mesh(handleGeometry, handleMaterial);
        handle.position.y = 0.75;
        torchGroup.add(handle);
        
        // Torch flame
        const flameGeometry = new THREE.ConeGeometry(0.08, 0.4, 8);
        const flameMaterial = new THREE.MeshBasicMaterial({ 
            color: 0xFF4500,
            transparent: true,
            opacity: 0.8
        });
        const flame = new THREE.Mesh(flameGeometry, flameMaterial);
        flame.position.y = 1.6;
        torchGroup.add(flame);
        
        // Position torch vertically in front of the capsule
        torchGroup.position.set(0, 0, 0.6); // Slightly in front
        torchGroup.rotation.z = 0; // Vertical orientation
        
        this.mesh.add(torchGroup);
        this.equipmentMeshes.offhand = torchGroup;
        
        // Create bright light source
        this.equippedLight = new THREE.PointLight(0xFF6B35, 8.0, 40, 1.0);
        this.equippedLight.position.set(0, 1.5, 0.6); // Same position as torch
        this.equippedLight.isPlayerTorchLight = true; // Mark as player torch light
        this.mesh.add(this.equippedLight);
        
        console.log('🔥 Bright torch equipped and lit!');
    }

    unequipTorch() {
        // Remove torch mesh
        if (this.equipmentMeshes.offhand) {
            this.mesh.remove(this.equipmentMeshes.offhand);
            this.equipmentMeshes.offhand = null;
        }
        
        // Remove light source
        if (this.equippedLight) {
            this.mesh.remove(this.equippedLight);
            this.equippedLight = null;
        }
        
        console.log('🔥 Torch unequipped and extinguished');
    }

    // Set camera reference for following
    setCamera(camera) {
        this.camera = camera;
        console.log('📷 Camera reference set for player');
    }

    // Update equipment positions
    updateEquipmentPositions() {
        // Equipment meshes are now children of the player mesh, so they move automatically
        // Just update the light position if it exists
        if (this.equippedLight) {
            // Light position is relative to player mesh, so it moves automatically
            // No need to manually update position
        }
    }

    // Cleanup
    destroy() {
        if (this.mesh) {
            this.scene.remove(this.mesh);
        }
        
        if (this.mixer) {
            this.mixer.stopAllAction();
        }
        
        console.log('👤 Player destroyed');
    }
}
