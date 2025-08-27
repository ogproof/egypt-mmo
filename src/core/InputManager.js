export class InputManager {
    constructor() {
        this.keys = new Set();
        this.mousePosition = { x: 0, y: 0 };
        this.mouseButtons = new Set();
        this.touchEvents = [];
        this.isInitialized = false; // Add initialization guard
        
        // Mouse and touch state
        this.isMouseDown = false;
        this.isTouchActive = false;
        this.touchStartPosition = { x: 0, y: 0 };
        this.mouseSensitivity = 1.0;
        this.mouseDelta = { x: 0, y: 0 };
        
        // Event callbacks
        this.onKeyDown = null;
        this.onKeyUp = null;
        this.onMouseClick = null;
        this.onMouseMove = null;
        this.onTouchStart = null;
        this.onTouchMove = null;
        this.onTouchEnd = null;
        
        // Don't auto-init, wait for explicit init() call

        // Character creator mode
        this.characterCreatorMode = false;
    }

    init() {
        // Prevent double initialization
        if (this.isInitialized) {
            console.warn('⚠️ InputManager already initialized, skipping...');
            return;
        }
        
        this.setupKeyboardEvents();
        this.setupMouseEvents();
        this.setupTouchEvents();
        
        console.log('🎮 Input Manager initialized');
        
        this.isInitialized = true; // Mark as initialized
    }

    setupKeyboardEvents() {
        document.addEventListener('keydown', (event) => {
            if (event.repeat) return; // Prevent key repeat
            
            const key = event.code || event.key;
            this.keys.add(key);
            
            if (this.onKeyDown) {
                this.onKeyDown(key);
            }
            
            // Don't prevent default if user is typing in an input field or character creator mode is active
            if (this.isGameKey(key) && !this.isUserTyping(event)) {
                event.preventDefault();
            }
        });

        document.addEventListener('keyup', (event) => {
            const key = event.code || event.key;
            this.keys.delete(key);
            
            if (this.onKeyUp) {
                this.onKeyUp(key);
            }
        });
    }

    setupMouseEvents() {
        const canvas = document.getElementById('game-canvas');
        if (!canvas) return;

        // Mouse clicks with coordinate tracking
        canvas.addEventListener('click', (event) => {
            // Get mouse position relative to canvas
            const rect = canvas.getBoundingClientRect();
            const mouseX = ((event.clientX - rect.left) / rect.width) * 2 - 1;
            const mouseY = -((event.clientY - rect.top) / rect.height) * 2 + 1;
            
            this.mousePosition = { x: mouseX, y: mouseY };
            
            if (this.onMouseClick) {
                this.onMouseClick(event, { x: mouseX, y: mouseY });
            }
        });

        // Mouse movement tracking for coordinate conversion
        canvas.addEventListener('mousemove', (event) => {
            const rect = canvas.getBoundingClientRect();
            const mouseX = ((event.clientX - rect.left) / rect.width) * 2 - 1;
            const mouseY = -((event.clientY - rect.top) / rect.height) * 2 + 1;
            
            this.mousePosition = { x: mouseX, y: mouseY };
            
            if (this.onMouseMove) {
                this.onMouseMove(event, { x: mouseX, y: mouseY });
            }
        });

        // Mouse down/up for UI interactions
        canvas.addEventListener('mousedown', (event) => {
            this.isMouseDown = true;
        });

        canvas.addEventListener('mouseup', () => {
            this.isMouseDown = false;
        });

        // Context menu prevention
        canvas.addEventListener('contextmenu', (event) => {
            event.preventDefault();
        });
    }

    setupTouchEvents() {
        const canvas = document.getElementById('game-canvas');
        if (!canvas) return;

        // Touch start
        canvas.addEventListener('touchstart', (event) => {
            event.preventDefault();
            this.isTouchActive = true;
            
            if (event.touches.length === 1) {
                const touch = event.touches[0];
                this.touchStartPosition.x = touch.clientX;
                this.touchStartPosition.y = touch.clientY;
            }
        });

        // Touch move (simplified - no camera movement)
        canvas.addEventListener('touchmove', (event) => {
            event.preventDefault();
            // Touch movement handled separately if needed
        });

        // Touch end
        canvas.addEventListener('touchend', (event) => {
            event.preventDefault();
            this.isTouchActive = false;
        });
    }

    // Pointer lock removed - using arrow key camera rotation instead

    // Input checking methods
    isKeyPressed(key) {
        return this.keys.has(key);
    }

    isAnyKeyPressed() {
        return this.keys.size > 0;
    }

    getMousePosition() {
        return { ...this.mousePosition };
    }

    // Mouse delta removed - using arrow key camera rotation instead

    // Movement input helpers
    getMovementInput() {
        const movement = { x: 0, z: 0 };
        
        if (this.isKeyPressed('KeyW') || this.isKeyPressed('ArrowUp')) {
            movement.z = -1;
        }
        if (this.isKeyPressed('KeyS') || this.isKeyPressed('ArrowDown')) {
            movement.z = 1;
        }
        if (this.isKeyPressed('KeyA') || this.isKeyPressed('ArrowLeft')) {
            movement.x = -1;
        }
        if (this.isKeyPressed('KeyD') || this.isKeyPressed('ArrowRight')) {
            movement.x = 1;
        }
        
        // Normalize diagonal movement
        if (movement.x !== 0 && movement.z !== 0) {
            const length = Math.sqrt(movement.x * movement.x + movement.z * movement.z);
            movement.x /= length;
            movement.z /= length;
        }
        
        return movement;
    }

    getActionInput() {
        return {
            jump: this.isKeyPressed('Space'),
            sprint: this.isKeyPressed('ShiftLeft'),
            interact: this.isKeyPressed('KeyE'),
            inventory: this.isKeyPressed('KeyI'),
            crafting: this.isKeyPressed('KeyC'),
            map: this.isKeyPressed('KeyM'),
            skills: this.isKeyPressed('KeyK')
        };
    }

    // Callback setters
    setOnKeyDown(callback) {
        this.onKeyDown = callback;
    }

    setOnKeyUp(callback) {
        this.onKeyUp = callback;
    }

    setOnMouseMove(callback) {
        this.onMouseMove = callback;
    }

    setOnMouseClick(callback) {
        this.onMouseClick = callback;
    }

    // Utility methods
    isGameKey(key) {
        const gameKeys = [
            'KeyW', 'KeyA', 'KeyS', 'KeyD',
            'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight',
            'Space', 'ShiftLeft', 'KeyE', 'KeyI', 'KeyC', 'KeyM', 'KeyK'
        ];
        return gameKeys.includes(key);
    }

    // Update method for game loop
    update() {
        // Input manager doesn't need per-frame updates
        // All input handling is done via event listeners
    }
    
    // Mouse sensitivity control

    // Reset input state
    reset() {
        this.keys.clear();
        this.mouseDelta.x = 0;
        this.mouseDelta.y = 0;
        this.isMouseDown = false;
    }

    // Control settings
    setMouseSensitivity(sensitivity) {
        this.mouseSensitivity = sensitivity;
        console.log(`🖱️ Mouse sensitivity updated to: ${sensitivity}`);
    }
    
    // Exit pointer lock (compatibility method)
    exitPointerLock() {
        // Pointer lock not used anymore, but keep for compatibility
    }
    
    // Cleanup
    destroy() {
        this.exitPointerLock();
        this.reset();
        
        // Remove event listeners (in a real implementation, you'd store references)
        console.log('🎮 Input Manager destroyed');
    }

    // Check if user is typing in an input field
    isUserTyping(event) {
        // If character creator mode is active, allow all keys
        if (this.characterCreatorMode) {
            return true;
        }
        
        const target = event.target;
        
        // Check if target is an input field
        const isInputField = target && (
            target.tagName === 'INPUT' ||
            target.tagName === 'TEXTAREA' ||
            target.contentEditable === 'true' ||
            target.classList.contains('character-name-input') ||
            target.id === 'character-name'
        );
        
        // Check if character creator or title screen is active
        const isCharacterCreatorActive = document.getElementById('character-creator')?.style.display === 'flex';
        const isTitleScreenActive = document.getElementById('title-screen')?.style.display === 'flex';
        
        return isInputField || isCharacterCreatorActive || isTitleScreenActive;
    }

    // Enable character creator mode (allows all keys to work)
    enableCharacterCreatorMode() {
        this.characterCreatorMode = true;
        console.log('🎮 Character creator mode enabled - all keys work normally');
    }

    // Disable character creator mode (restores game key blocking)
    disableCharacterCreatorMode() {
        this.characterCreatorMode = false;
        console.log('🎮 Character creator mode disabled - game keys blocked again');
    }
}
