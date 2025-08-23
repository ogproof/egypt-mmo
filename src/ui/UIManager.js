import * as THREE from 'three';

export class UIManager {
    constructor() {
        this.gameEngine = null;
        this.isInitialized = false; // Add initialization guard
        this.isVisible = false;
        
        // Don't auto-init, wait for explicit init() call
        
        // UI elements
        this.gameUI = null;
        this.craftingPanel = null;
        this.inventory = null;
        this.topHUD = null;
        this.actionButtons = null;
        
        // UI state
        this.activePanel = null;
        this.craftingCategory = 'weapons';
        
        // Performance info
        this.performanceInfo = null;
        
        // Time display
        this.timeDisplay = null;
        
    }

    async init() {
        // Prevent double initialization
        if (this.isInitialized) {
            console.warn('⚠️ UIManager already initialized, skipping...');
            return;
        }
        
        console.log('🎨 Initializing UI Manager...');
        
        // Get UI element references
        this.gameUI = document.getElementById('game-ui');
        this.craftingPanel = document.getElementById('crafting-panel');
        this.inventory = document.getElementById('inventory');
        this.topHUD = document.querySelector('.top-hud');
        this.actionButtons = document.querySelector('.action-buttons');
        this.timeDisplay = document.getElementById('time-display');
        
        if (!this.gameUI || !this.craftingPanel || !this.inventory) {
            throw new Error('UI elements not found');
        }
        
        this.setupEventListeners();
        this.initializeCraftingItems();
        this.initializeInventory();
        this.initializeEquipmentSlots();
        this.initializeTimeDisplay();
        
        this.isInitialized = true; // Mark as initialized
        console.log('✅ UI Manager initialized');
    }

    setupEventListeners() {
        // Action button listeners
        const craftingBtn = document.getElementById('crafting-btn');
        const inventoryBtn = document.getElementById('inventory-btn');
        const mapBtn = document.getElementById('map-btn');
        const skillsBtn = document.getElementById('skills-btn');
        
        if (craftingBtn) {
            craftingBtn.addEventListener('click', () => this.showCraftingPanel());
        }
        
        if (inventoryBtn) {
            inventoryBtn.addEventListener('click', () => this.showInventory());
        }
        
        if (mapBtn) {
            mapBtn.addEventListener('click', () => this.showMap());
        }
        
        if (skillsBtn) {
            skillsBtn.addEventListener('click', () => this.showSkills());
        }
        
        // Panel close buttons
        const closeCraftingBtn = document.getElementById('close-crafting');
        const closeInventoryBtn = document.getElementById('close-inventory');
        
        if (closeCraftingBtn) {
            closeCraftingBtn.addEventListener('click', () => this.hideCraftingPanel());
        }
        
        if (closeInventoryBtn) {
            closeInventoryBtn.addEventListener('click', () => this.hideInventory());
        }
        
        // Crafting category buttons
        const categoryBtns = document.querySelectorAll('.category-btn');
        categoryBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                this.setCraftingCategory(btn.dataset.category);
            });
        });
        
        // Add help text for controls
        this.addHelpText();
        
        // Keyboard shortcuts for testing
        document.addEventListener('keydown', (e) => {
            if (e.key === 't' || e.key === 'T') {
                console.log('🔥 T key pressed - testing torch equipping...');
                this.testTorchEquipping();
            } else if (e.key === 'i' || e.key === 'I') {
                console.log('🎒 I key pressed - testing inventory...');
                this.testInventory();
            } else if (e.key === 'r' || e.key === 'R') {
                console.log('🔄 R key pressed - resetting camera...');
                this.resetCamera();
            } else if (e.key === 'g' || e.key === 'G') {
                console.log('🗺️ G key pressed - toggling grid...');
                this.toggleGrid();
            } else if (e.key === 'c' || e.key === 'C') {
                console.log('🎯 C key pressed - testing click detection...');
                this.testClickDetection();
            } else if (e.key === 'a' || e.key === 'A') {
                console.log('🎭 A key pressed - testing player animations...');
                this.testPlayerAnimations();
            } else if (e.key === 'e' || e.key === 'E') {
                console.log('📋 E key pressed - exporting model specifications...');
                this.exportModelSpecs();
            }
        });
    }
    
    initializeTimeDisplay() {
        // Time display is handled by the day/night cycle system
        // No additional initialization needed
    }
    
    initializeCraftingItems() {
        const craftingItems = document.getElementById('crafting-items');
        if (!craftingItems) return;
        
        // Define crafting items for each category
        const items = {
            weapons: [
                { id: 'bronze_sword', name: 'Bronze Sword', description: 'Basic weapon', level: 1, materials: ['bronze_ingot', 'wood'] },
                { id: 'iron_sword', name: 'Iron Sword', description: 'Improved weapon', level: 5, materials: ['iron_ingot', 'wood'] },
                { id: 'steel_sword', name: 'Steel Sword', description: 'Advanced weapon', level: 10, materials: ['steel_ingot', 'wood'] }
            ],
            armor: [
                { id: 'leather_armor', name: 'Leather Armor', description: 'Basic protection', level: 1, materials: ['leather', 'thread'] },
                { id: 'bronze_armor', name: 'Bronze Armor', description: 'Metal protection', level: 5, materials: ['bronze_ingot', 'leather'] },
                { id: 'iron_armor', name: 'Iron Armor', description: 'Strong protection', level: 10, materials: ['iron_ingot', 'leather'] }
            ],
            tools: [
                { id: 'bronze_pickaxe', name: 'Bronze Pickaxe', description: 'Mining tool', level: 1, materials: ['bronze_ingot', 'wood'] },
                { id: 'iron_pickaxe', name: 'Iron Pickaxe', description: 'Better mining', level: 5, materials: ['iron_ingot', 'wood'] },
                { id: 'steel_pickaxe', name: 'Steel Pickaxe', description: 'Best mining', level: 10, materials: ['steel_ingot', 'wood'] }
            ],
            potions: [
                { id: 'health_potion', name: 'Health Potion', description: 'Restores health', level: 1, materials: ['herbs', 'water'] },
                { id: 'strength_potion', name: 'Strength Potion', description: 'Increases strength', level: 5, materials: ['herbs', 'water', 'crystal'] },
                { id: 'wisdom_potion', name: 'Wisdom Potion', description: 'Increases wisdom', level: 10, materials: ['herbs', 'water', 'crystal', 'essence'] }
            ]
        };
        
        this.craftingItems = items;
    }

    initializeInventory() {
        const inventoryGrid = document.getElementById('inventory-grid');
        if (!inventoryGrid) return;
        
        // Create inventory slots
        for (let i = 0; i < 64; i++) {
            const slot = document.createElement('div');
            slot.className = 'inventory-slot';
            slot.dataset.slot = i;
            
            slot.addEventListener('click', () => {
                this.handleInventorySlotClick(i);
            });
            
            slot.addEventListener('contextmenu', (e) => {
                e.preventDefault();
                this.handleInventorySlotRightClick(i);
            });
            
            inventoryGrid.appendChild(slot);
        }

        // Initialize equipment slots
        this.initializeEquipmentSlots();
        
        // Add sample items directly to UI (will be synced with inventory system later)
        this.addItemToInventory(0, { id: 'bronze_ingot', name: 'Bronze Ingot', type: 'material' });
        this.addItemToInventory(1, { id: 'wood', name: 'Wood', type: 'material' });
        this.addItemToInventory(2, { id: 'leather', name: 'Leather', type: 'material' });
        this.addItemToInventory(3, { id: 'torch', name: 'Torch', type: 'light' });
        
        console.log('🎒 Inventory initialized with sample items');
        
        // If game engine is already connected, sync with it
        if (this.gameEngine) {
            this.syncWithInventorySystem();
        }
    }

    initializeEquipmentSlots() {
        const equipmentSlots = document.querySelectorAll('.equipment-slot');
        equipmentSlots.forEach(slot => {
            slot.addEventListener('click', () => {
                this.handleEquipmentSlotClick(slot.dataset.slot);
            });
            
            slot.addEventListener('contextmenu', (e) => {
                e.preventDefault();
                this.handleEquipmentSlotRightClick(slot.dataset.slot);
            });
        });
    }

    addItemToInventory(slotIndex, item) {
        const slot = document.querySelector(`[data-slot="${slotIndex}"]`);
        if (!slot) return;
        
        slot.classList.add('filled');
        slot.dataset.itemId = item.id;
        slot.dataset.itemName = item.name;
        slot.dataset.itemType = item.type;
        
        // Add item icon/text
        slot.innerHTML = `<span title="${item.name}">${this.getItemIcon(item)}</span>`;
    }

    getItemIcon(item) {
        const icons = {
            material: '📦',
            weapon: '⚔️',
            armor: '🛡️',
            tool: '🔨',
            potion: '🧪',
            food: '🍖',
            gem: '💎',
            light: '🔥'
        };
        
        return icons[item.type] || '📦';
    }

    handleInventorySlotClick(slotIndex) {
        const slot = document.querySelector(`[data-slot="${slotIndex}"]`);
        if (!slot || !slot.classList.contains('filled')) {
            console.log(`❌ Slot ${slotIndex} is empty or not found`);
            return;
        }
        
        const itemId = slot.dataset.itemId;
        const itemName = slot.dataset.itemName;
        
        console.log(`🎯 Clicked on ${itemName} (${itemId}) in slot ${slotIndex}`);
        
        // Show item info tooltip
        this.showItemInfo(itemId, itemName);
    }

    handleInventorySlotRightClick(slotIndex) {
        const slot = document.querySelector(`[data-slot="${slotIndex}"]`);
        if (!slot || !slot.classList.contains('filled')) return;
        
        const itemId = slot.dataset.itemId;
        const itemName = slot.dataset.itemName;
        const itemType = slot.dataset.itemType;
        
        console.log(`Right-clicked on ${itemName} in slot ${slotIndex}`);
        
        // Show context menu or equip item
        if (itemType === 'light' && itemId === 'torch') {
            this.equipTorch(slotIndex);
        } else if (itemType === 'weapon' || itemType === 'armor') {
            this.equipItem(itemId, itemName, slotIndex);
        } else {
            this.showItemInfo(itemId, itemName);
        }
    }

    equipTorch(slotIndex) {
        console.log(`🔥 Equipping torch from slot ${slotIndex}`);
        
        if (!this.gameEngine) {
            console.warn('Game engine not connected');
            return;
        }
        
        const inventorySystem = this.gameEngine.getInventorySystem();
        if (inventorySystem) {
            const success = inventorySystem.equipTorch(slotIndex);
            if (success) {
                console.log('🔥 Torch equipped successfully!');
                this.showNotification('🔥 Torch equipped!', 'success');
                
                // Update the player's visual equipment
                const player = this.gameEngine.getPlayer();
                if (player) {
                    player.equipItem('torch', 'offhand');
                }
                
                // Update inventory display
                this.updateInventoryDisplay();
            } else {
                console.warn('Failed to equip torch');
                this.showNotification('Failed to equip torch', 'error');
            }
        } else {
            console.warn('Inventory system not found');
        }
    }

    handleEquipmentSlotClick(slotName) {
        const slot = document.querySelector(`[data-slot="${slotName}"]`);
        if (!slot) return;
        
        console.log(`🎯 Clicked on equipment slot: ${slotName}`);
        
        // Show unequip option if slot is filled
        if (slot.classList.contains('equipped')) {
            const itemId = slot.dataset.itemId;
            const itemName = slot.dataset.itemName;
            
            console.log(`🔧 Unequipping ${itemName} from ${slotName}`);
            this.unequipItem(itemId, slotName);
            
            // Show notification
            this.showNotification(`🔧 Unequipped ${itemName}`, 'info');
        } else {
            console.log(`📭 Equipment slot ${slotName} is empty`);
            this.showNotification(`📭 ${slotName} slot is empty`, 'info');
        }
    }

    handleEquipmentSlotRightClick(slotName) {
        const slot = document.querySelector(`[data-slot="${slotName}"]`);
        if (!slot) return;
        
        console.log(`🎯 Right-clicked on equipment slot: ${slotName}`);
        
        // Show unequip option if slot is filled
        if (slot.classList.contains('equipped')) {
            const itemId = slot.dataset.itemId;
            const itemName = slot.dataset.itemName;
            
            // Show confirmation dialog
            if (confirm(`Unequip ${itemName} from ${slotName} slot?`)) {
                console.log(`🔧 Unequipping ${itemName} from ${slotName}`);
            this.unequipItem(itemId, slotName);
                this.showNotification(`🔧 Unequipped ${itemName}`, 'info');
            }
        } else {
            console.log(`📭 Equipment slot ${slotName} is empty`);
            this.showNotification(`📭 ${slotName} slot is empty`, 'info');
        }
    }

    showItemContextMenu(itemId, itemName, slotIndex) {
        // Create context menu
        const contextMenu = document.createElement('div');
        contextMenu.className = 'item-context-menu';
        contextMenu.innerHTML = `
            <div class="context-menu-item" data-action="use">Use</div>
            <div class="context-menu-item" data-action="equip">Equip</div>
            <div class="context-menu-item" data-action="drop">Drop</div>
        `;
        
        contextMenu.style.cssText = `
            position: absolute;
            background: rgba(0, 0, 0, 0.95);
            border: 2px solid #ffd700;
            border-radius: 8px;
            padding: 5px 0;
            color: white;
            z-index: 1000;
            min-width: 120px;
        `;
        
        // Position near the slot
        const slot = document.querySelector(`[data-slot="${slotIndex}"]`);
        const rect = slot.getBoundingClientRect();
        contextMenu.style.left = rect.right + 'px';
        contextMenu.style.top = rect.top + 'px';
        
        document.body.appendChild(contextMenu);
        
        // Handle context menu actions
        contextMenu.addEventListener('click', (e) => {
            const action = e.target.dataset.action;
            if (action) {
                this.handleItemAction(action, itemId, itemName, slotIndex);
                contextMenu.remove();
            }
        });
        
        // Remove context menu when clicking elsewhere
        document.addEventListener('click', () => contextMenu.remove(), { once: true });
    }

    handleItemAction(action, itemId, itemName, slotIndex) {
        switch (action) {
            case 'use':
                this.useItem(itemId, itemName);
                break;
            case 'equip':
                this.equipItem(itemId, itemName, slotIndex);
                break;
            case 'drop':
                this.dropItem(itemId, itemName, slotIndex);
                break;
        }
    }

    useItem(itemId, itemName) {
        console.log(`Using ${itemName}`);
        // TODO: Implement item usage logic
    }

    equipItem(itemId, itemName, slotIndex) {
        console.log(`🔧 Equipping ${itemName} from slot ${slotIndex}`);
        
        if (!this.gameEngine) {
            console.warn('❌ Game engine not connected');
            this.showNotification('❌ Cannot equip item - game not ready', 'error');
            return;
        }
        
        const inventorySystem = this.gameEngine.getInventorySystem();
        if (!inventorySystem) {
            console.warn('❌ Inventory system not found');
            this.showNotification('❌ Cannot equip item - inventory system not found', 'error');
            return;
        }
        
        // Get item data to check if it can be equipped
        const itemData = inventorySystem.itemDatabase.get(itemId);
        if (!itemData) {
            console.warn(`❌ Item data not found for ${itemId}`);
            this.showNotification(`❌ Cannot equip ${itemName} - item data not found`, 'error');
            return;
        }
        
        console.log(`📋 Item data:`, itemData);
        
        // Check if item can be equipped
        let equipmentSlot = null;
        if (itemId === 'torch' || itemData.type === 'light') {
            equipmentSlot = 'offhand';
        } else if (itemData.type === 'weapon') {
            equipmentSlot = 'weapon';
        } else if (itemData.type === 'armor') {
            // Determine armor slot based on item name or type
            if (itemId.includes('head') || itemId.includes('helmet')) {
                equipmentSlot = 'head';
            } else if (itemId.includes('chest') || itemId.includes('armor')) {
                equipmentSlot = 'chest';
            } else if (itemId.includes('legs') || itemId.includes('pants')) {
                equipmentSlot = 'legs';
            } else if (itemId.includes('feet') || itemId.includes('boots')) {
                equipmentSlot = 'feet';
            } else {
                equipmentSlot = 'chest'; // Default to chest
            }
        } else {
            console.log(`❌ ${itemName} cannot be equipped (type: ${itemData.type})`);
            this.showNotification(`❌ ${itemName} cannot be equipped`, 'error');
            return;
        }
        
        console.log(`🎯 Equipping ${itemName} in ${equipmentSlot} slot`);
        
        // Try to equip through inventory system first
        let success = false;
        if (itemId === 'torch') {
            success = inventorySystem.equipTorch(slotIndex);
        } else {
            success = inventorySystem.equipItem(slotIndex);
        }
        
        if (success) {
            console.log(`✅ Successfully equipped ${itemName} through inventory system`);
            
            // Update the player's visual equipment
            const player = this.gameEngine.getPlayer();
            if (player) {
                player.equipItem(itemId, equipmentSlot);
                console.log(`🎮 Player visual equipment updated`);
            }
            
            // Update equipment display
            this.updateEquipmentDisplay();
            
            // Show success notification
            this.showNotification(`✅ ${itemName} equipped in ${equipmentSlot} slot!`, 'success');
            
        } else {
            console.warn(`❌ Failed to equip ${itemName} through inventory system`);
            
            // Fallback: equip directly in UI
            this.equipItemInSlot(itemId, itemName, equipmentSlot);
            this.removeItemFromInventory(slotIndex);
            
            // Update the player's visual equipment
            const player = this.gameEngine.getPlayer();
            if (player) {
                player.equipItem(itemId, equipmentSlot);
            }
            
            this.showNotification(`✅ ${itemName} equipped in ${equipmentSlot} slot!`, 'success');
        }
    }

    equipItemInSlot(itemId, itemName, slotName) {
        const slot = document.querySelector(`[data-slot="${slotName}"]`);
        if (!slot) {
            console.warn(`❌ Equipment slot ${slotName} not found`);
            return;
        }
        
        console.log(`🎯 Equipping ${itemName} in ${slotName} slot`);
        
        // Get item type for proper icon display
        let itemType = 'unknown';
        if (this.gameEngine && this.gameEngine.getInventorySystem()) {
            const itemData = this.gameEngine.getInventorySystem().itemDatabase.get(itemId);
            if (itemData) {
                itemType = itemData.type;
            }
        }
        
        // Update equipment slot
        slot.classList.add('equipped');
        slot.dataset.itemId = itemId;
        slot.dataset.itemName = itemName;
        slot.dataset.itemType = itemType;
        
        // Create equipment slot content with item icon and name
        const itemIcon = this.getItemIcon({ type: itemType });
        slot.innerHTML = `
            <div class="slot-label">${slotName.charAt(0).toUpperCase() + slotName.slice(1)}</div>
            <div class="item-icon">${itemIcon}</div>
            <div class="item-name">${itemName}</div>
        `;
        
        // Notify game engine to equip item on player
        if (this.gameEngine && this.gameEngine.getPlayer()) {
            this.gameEngine.getPlayer().equipItem(itemId, slotName);
            console.log(`🎮 Player equipment updated for ${slotName}`);
        }
        
        console.log(`✅ Successfully equipped ${itemName} in ${slotName} slot`);
    }

    unequipItem(itemId, slotName) {
        const slot = document.querySelector(`[data-slot="${slotName}"]`);
        if (!slot) {
            console.warn(`❌ Equipment slot ${slotName} not found`);
            return;
        }
        
        console.log(`🔧 Unequipping ${itemId} from ${slotName} slot`);
        
        // Clear equipment slot
        slot.classList.remove('equipped');
        slot.dataset.itemId = '';
        slot.dataset.itemName = '';
        slot.dataset.itemType = '';
        slot.innerHTML = `<div class="slot-label">${slotName.charAt(0).toUpperCase() + slotName.slice(1)}</div>`;
        
        // Notify game engine to unequip item from player
        if (this.gameEngine && this.gameEngine.getPlayer()) {
            this.gameEngine.getPlayer().unequipItem(slotName);
            console.log(`🎮 Player equipment updated for ${slotName}`);
        }
        
        // Add item back to inventory
        const emptySlot = this.findEmptyInventorySlot();
        if (emptySlot !== -1) {
            // Get item data for proper display
            let itemType = 'unknown';
            if (this.gameEngine && this.gameEngine.getInventorySystem()) {
                const itemData = this.gameEngine.getInventorySystem().itemDatabase.get(itemId);
                if (itemData) {
                    itemType = itemData.type;
                }
            }
            
            this.addItemToInventory(emptySlot, { 
                id: itemId, 
                name: itemId, 
                type: itemType 
            });
            console.log(`📦 ${itemId} returned to inventory slot ${emptySlot}`);
        } else {
            console.warn(`❌ No empty inventory slots available for ${itemId}`);
            this.showNotification(`❌ Inventory full - cannot unequip ${itemId}`, 'error');
        }
        
        console.log(`✅ Successfully unequipped ${itemId} from ${slotName} slot`);
    }

    removeItemFromInventory(slotIndex) {
        const slot = document.querySelector(`[data-slot="${slotIndex}"]`);
        if (!slot) return;
        
        slot.classList.remove('filled');
        slot.dataset.itemId = '';
        slot.dataset.itemName = '';
        slot.dataset.itemType = '';
        slot.innerHTML = '';
    }

    findEmptyInventorySlot() {
        for (let i = 0; i < 64; i++) {
            const slot = document.querySelector(`[data-slot="${i}"]`);
            if (slot && !slot.classList.contains('filled')) {
                return i;
            }
        }
        return -1; // No empty slots
    }

    findItemSlotIndex(itemId) {
        for (let i = 0; i < 64; i++) {
            const slot = document.querySelector(`[data-slot="${i}"]`);
            if (slot && slot.classList.contains('filled') && slot.dataset.itemId === itemId) {
                return i;
            }
        }
        return -1;
    }

    dropItem(itemId, itemName, slotIndex) {
        console.log(`Dropping ${itemName}`);
        this.removeItemFromInventory(slotIndex);
        // TODO: Implement item dropping logic
    }

    showItemInfo(itemId, itemName) {
        console.log(`Showing info for ${itemName} (${itemId})`);
        
        // Get item data to show proper information
        const itemData = this.gameEngine?.getInventorySystem()?.itemDatabase?.get(itemId);
        
        // Create and show item info tooltip
        this.showItemTooltip(itemId, itemName, itemData);
    }

    showItemTooltip(itemId, itemName, itemData) {
        // Remove any existing tooltips
        this.removeExistingTooltips();
        
        // Create tooltip container
        const tooltip = document.createElement('div');
        tooltip.className = 'item-tooltip';
        tooltip.id = 'item-tooltip';
        
        // Get item type and icon
        const itemType = itemData?.type || 'unknown';
        const itemIcon = this.getItemIcon({ type: itemType });
        
        // Create tooltip content
        let tooltipContent = `
            <div class="tooltip-header">
                <span class="item-icon">${itemIcon}</span>
                <h4 class="item-name">${itemName}</h4>
            </div>
            <div class="tooltip-content">
                <p class="item-type">Type: ${itemType}</p>
        `;
        
        // Add description if available
        if (itemData?.description) {
            tooltipContent += `<p class="item-description">${itemData.description}</p>`;
        }
        
        // Add stats if available
        if (itemData?.stats) {
            tooltipContent += `<div class="item-stats">`;
            Object.entries(itemData.stats).forEach(([stat, value]) => {
                tooltipContent += `<span class="stat">${stat}: ${value}</span>`;
            });
            tooltipContent += `</div>`;
        }
        
        // Add action buttons
        tooltipContent += `
            <div class="tooltip-actions">
        `;
        
        // Add equip button for equippable items
        if (itemData?.equipmentSlot || itemType === 'light' || itemType === 'weapon' || itemType === 'armor') {
            tooltipContent += `<button class="action-btn equip-btn" data-action="equip">⚔️ Equip</button>`;
        }
        
        // Add use button for usable items
        if (itemType === 'potion' || itemType === 'food' || itemType === 'tool') {
            tooltipContent += `<button class="action-btn use-btn" data-action="use">🔄 Use</button>`;
        }
        
        // Add drop button for all items
        tooltipContent += `<button class="action-btn drop-btn" data-action="drop">🗑️ Drop</button>`;
        
        tooltipContent += `
                <button class="action-btn close-btn" data-action="close">✕ Close</button>
            </div>
        </div>
        `;
        
        tooltip.innerHTML = tooltipContent;
        
        // Position tooltip near the clicked item
        const clickedSlot = document.querySelector(`[data-item-id="${itemId}"]`);
        if (clickedSlot) {
            const rect = clickedSlot.getBoundingClientRect();
            tooltip.style.position = 'fixed';
            tooltip.style.left = `${rect.right + 10}px`;
            tooltip.style.top = `${rect.top}px`;
        } else {
            // Fallback positioning
            tooltip.style.position = 'fixed';
            tooltip.style.left = '50%';
            tooltip.style.top = '50%';
            tooltip.style.transform = 'translate(-50%, -50%)';
        }
        
        // Add event listeners to buttons
        tooltip.addEventListener('click', (e) => {
            if (e.target.classList.contains('action-btn')) {
                const action = e.target.dataset.action;
                this.handleTooltipAction(action, itemId, itemName, itemData);
            }
        });
        
        // Add click outside to close
        document.addEventListener('click', (e) => {
            if (!tooltip.contains(e.target) && !e.target.closest('.inventory-slot')) {
                this.removeExistingTooltips();
            }
        });
        
        // Add to page
        document.body.appendChild(tooltip);
        
        // Auto-close after 10 seconds
        setTimeout(() => {
            this.removeExistingTooltips();
        }, 10000);
    }

    handleTooltipAction(action, itemId, itemName, itemData) {
        console.log(`Handling tooltip action: ${action} for ${itemName}`);
        
        switch (action) {
            case 'equip':
                this.equipItemFromTooltip(itemId, itemName, itemData);
                break;
            case 'use':
                this.useItem(itemId, itemName);
                break;
            case 'drop':
                this.dropItem(itemId, itemName);
                break;
            case 'close':
                this.removeExistingTooltips();
                break;
        }
    }

    equipItemFromTooltip(itemId, itemName, itemData) {
                // Find the slot index for this item
                const slotIndex = this.findItemSlotIndex(itemId);
        if (slotIndex === -1) {
            this.showNotification('❌ Item not found in inventory', 'error');
            return;
        }
        
        if (itemId === 'torch') {
            this.equipTorch(slotIndex);
        } else if (itemData.type === 'weapon' || itemData.type === 'armor') {
                    this.equipItem(itemId, itemName, slotIndex);
        } else {
            this.showNotification(`❌ Cannot equip ${itemName}`, 'error');
        }
        
        this.removeExistingTooltips();
    }

    useItem(itemId, itemName) {
        console.log(`Using item: ${itemName}`);
        this.showNotification(`🔄 Using ${itemName}`, 'info');
        // TODO: Implement item usage logic
        this.removeExistingTooltips();
    }

    dropItem(itemId, itemName) {
        console.log(`Dropping item: ${itemName}`);
        this.showNotification(`🗑️ Dropped ${itemName}`, 'warning');
        // TODO: Implement item dropping logic
        this.removeExistingTooltips();
    }

    findItemSlotIndex(itemId) {
        const slots = document.querySelectorAll('.inventory-slot');
        for (let i = 0; i < slots.length; i++) {
            if (slots[i].dataset.itemId === itemId) {
                return i;
            }
        }
        return -1;
    }

    removeExistingTooltips() {
        const existingTooltips = document.querySelectorAll('.item-tooltip');
        existingTooltips.forEach(tooltip => tooltip.remove());
    }

    updateInventoryDisplay() {
        if (!this.gameEngine) return;
        
        const inventorySystem = this.gameEngine.getInventorySystem();
        if (!inventorySystem) return;
        
        // Clear existing items
        const inventoryGrid = document.getElementById('inventory-grid');
        if (!inventoryGrid) return;
        
        // Clear all slots
        const slots = inventoryGrid.querySelectorAll('.inventory-slot');
        slots.forEach(slot => {
            slot.classList.remove('filled');
            slot.dataset.itemId = '';
            slot.dataset.itemName = '';
            slot.dataset.itemType = '';
            slot.innerHTML = '';
        });
        
        // Populate with current inventory
        const inventory = inventorySystem.getInventory();
        inventory.forEach((item, index) => {
            if (item) {
                this.addItemToInventory(index, {
                    id: item.id,
                    name: this.getItemDisplayName(item.id),
                    type: this.getItemType(item.id)
                });
            }
        });
        
        // Update equipment slots
        this.updateEquipmentDisplay();
    }

    syncWithInventorySystem() {
        if (!this.gameEngine) return;
        
        const inventorySystem = this.gameEngine.getInventorySystem();
        if (!inventorySystem) return;
        
        console.log('🔄 Syncing UI with inventory system...');
        
        // Ensure the inventory system has the starting items
        const startingItems = [
            { id: 'bronze_ingot', quantity: 5 },
            { id: 'wood', quantity: 10 },
            { id: 'leather', quantity: 3 },
            { id: 'torch', quantity: 1 }
        ];
        
        startingItems.forEach(item => {
            if (!inventorySystem.hasItem(item.id)) {
                console.log(`📦 Adding ${item.id} to inventory system`);
                inventorySystem.addItem(item.id, item.quantity);
            }
        });
        
        // Update the display to show actual inventory system items
        this.updateInventoryDisplayFromSystem();
        
        console.log('✅ Inventory sync complete');
    }

    updateInventoryDisplayFromSystem() {
        if (!this.gameEngine) {
            console.log('⚠️ Game engine not connected, showing sample items');
            this.showSampleItems();
            return;
        }
        
        const inventorySystem = this.gameEngine.getInventorySystem();
        if (!inventorySystem) {
            console.log('⚠️ Inventory system not found, showing sample items');
            this.showSampleItems();
            return;
        }
        
        console.log('🔄 Updating inventory display from system...');
        
        // Get actual inventory from system
        const inventory = inventorySystem.getInventory();
        console.log('🎒 Inventory from system:', inventory);
        
        // Clear existing display
        const inventoryGrid = document.getElementById('inventory-grid');
        if (!inventoryGrid) return;
        
        const slots = inventoryGrid.querySelectorAll('.inventory-slot');
        slots.forEach(slot => {
            slot.classList.remove('filled');
            slot.dataset.itemId = '';
            slot.dataset.itemName = '';
            slot.dataset.itemType = '';
            slot.innerHTML = '';
        });
        
        // Populate with actual inventory system items
        let hasItems = false;
        inventory.forEach((item, index) => {
            if (item) {
                hasItems = true;
                const itemData = inventorySystem.itemDatabase.get(item.id);
                if (itemData) {
                    this.addItemToInventory(index, {
                        id: item.id,
                        name: itemData.name,
                        type: itemData.type
                    });
                }
            }
        });
        
        // If no items in system, show sample items
        if (!hasItems) {
            console.log('⚠️ No items in inventory system, showing sample items');
            this.showSampleItems();
        }
        
        // Update equipment display
        this.updateEquipmentDisplay();
    }

    showSampleItems() {
        console.log('🎒 Showing sample items as fallback');
        
        // Add sample items directly to UI
        this.addItemToInventory(0, { id: 'bronze_ingot', name: 'Bronze Ingot', type: 'material' });
        this.addItemToInventory(1, { id: 'wood', name: 'Wood', type: 'material' });
        this.addItemToInventory(2, { id: 'leather', name: 'Leather', type: 'material' });
        this.addItemToInventory(3, { id: 'torch', name: 'Torch', type: 'light' });
        
        console.log('✅ Sample items displayed');
    }

    getItemDisplayName(itemId) {
        const itemData = this.gameEngine?.getInventorySystem()?.itemDatabase?.get(itemId);
        return itemData ? itemData.name : itemId;
    }

    getItemType(itemId) {
        const itemData = this.gameEngine?.getInventorySystem()?.itemDatabase?.get(itemId);
        return itemData ? itemData.type : 'unknown';
    }

    updateEquipmentDisplay() {
        if (!this.gameEngine) return;
        
        const inventorySystem = this.gameEngine.getInventorySystem();
        if (!inventorySystem) return;
        
        const equipment = inventorySystem.getEquipment();
        
        // Update each equipment slot
        Object.entries(equipment).forEach(([slotName, item]) => {
            const slotElement = document.querySelector(`[data-slot="${slotName}"]`);
            if (slotElement) {
                if (item) {
                    slotElement.classList.add('equipped');
                    slotElement.dataset.itemId = item.id;
                    slotElement.dataset.itemName = item.name || item.id;
                    slotElement.innerHTML = `<div class="slot-label">${slotName}</div><div class="item-icon">${this.getItemIcon({ type: this.getItemType(item.id) })}</div>`;
                } else {
                    slotElement.classList.remove('equipped');
                    slotElement.dataset.itemId = '';
                    slotElement.dataset.itemName = '';
                    slotElement.innerHTML = `<div class="slot-label">${slotName}</div>`;
                }
            }
        });
    }

    // Panel management
    showCraftingPanel() {
        this.hideAllPanels();
        this.craftingPanel.classList.remove('hidden');
        this.activePanel = 'crafting';
        this.updateCraftingItems();
    }

    hideCraftingPanel() {
        this.craftingPanel.classList.add('hidden');
        this.activePanel = null;
    }

    showInventory() {
        console.log('🎒 Showing inventory...');
        this.hideAllPanels();
        this.inventory.classList.remove('hidden');
        this.activePanel = 'inventory';
        
        // Update inventory display when showing
        if (this.gameEngine) {
            this.updateInventoryDisplayFromSystem();
        }
        
        console.log('🎒 Inventory panel shown');
    }

    hideInventory() {
        this.inventory.classList.add('hidden');
        this.activePanel = null;
    }

    showMap() {
        console.log('🗺️ Map feature coming soon!');
        // TODO: Implement map system
    }

    showSkills() {
        console.log('📚 Skills feature coming soon!');
        // TODO: Implement skills system
    }

    hideAllPanels() {
        this.craftingPanel.classList.add('hidden');
        this.inventory.classList.add('hidden');
        this.activePanel = null;
    }

    // Crafting system
    setCraftingCategory(category) {
        this.craftingCategory = category;
        
        // Update active category button
        document.querySelectorAll('.category-btn').forEach(btn => {
            btn.classList.remove('active');
            if (btn.dataset.category === category) {
                btn.classList.add('active');
            }
        });
        
        this.updateCraftingItems();
    }

    updateCraftingItems() {
        const craftingItems = document.getElementById('crafting-items');
        if (!craftingItems || !this.craftingItems) return;
        
        const items = this.craftingItems[this.craftingCategory] || [];
        
        craftingItems.innerHTML = items.map(item => `
            <div class="crafting-item" data-item-id="${item.id}">
                <div class="item-icon">${this.getItemIcon({ type: this.craftingCategory.slice(0, -1) })}</div>
                <h4>${item.name}</h4>
                <p>${item.description}</p>
                <p class="item-level">Level ${item.level}</p>
                <p class="item-materials">Materials: ${item.materials.join(', ')}</p>
                <button class="craft-btn" onclick="this.craftItem('${item.id}')">Craft</button>
            </div>
        `).join('');
        
        // Add click handlers for craft buttons
        craftingItems.querySelectorAll('.craft-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const itemId = e.target.parentElement.dataset.itemId;
                this.craftItem(itemId);
            });
        });
    }

    craftItem(itemId) {
        if (!this.gameEngine) return;
        
        const craftingSystem = this.gameEngine.getCraftingSystem();
        if (craftingSystem) {
            const success = craftingSystem.craftItem(itemId);
            if (success) {
                console.log(`Successfully crafted ${itemId}`);
                this.showNotification(`Crafted ${itemId}!`, 'success');
            } else {
                console.log(`Failed to craft ${itemId}`);
                this.showNotification(`Failed to craft ${itemId}`, 'error');
            }
        }
    }

    // Notifications
    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.textContent = message;
        
        // Add emoji based on type
        const emojis = {
            success: '✅',
            error: '❌',
            info: 'ℹ️',
            warning: '⚠️'
        };
        
        notification.innerHTML = `${emojis[type] || 'ℹ️'} ${message}`;
        
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${type === 'success' ? '#4CAF50' : type === 'error' ? '#f44336' : type === 'warning' ? '#ff9800' : '#2196F3'};
            color: white;
            padding: 15px 20px;
            border-radius: 5px;
            z-index: 10000;
            animation: slideIn 0.3s ease;
            font-weight: 600;
            box-shadow: 0 4px 8px rgba(0,0,0,0.3);
        `;
        
        document.body.appendChild(notification);
        
        // Auto-remove after 3 seconds
        setTimeout(() => {
            notification.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => {
                if (notification.parentElement) {
                    notification.remove();
                }
            }, 300);
        }, 3000);
    }

    // Performance updates
    updatePerformanceInfo(fps) {
        if (this.performanceInfo) {
            this.performanceInfo.textContent = `FPS: ${fps}`;
        }
    }
    
    updateTimeDisplay(timeOfDay) {
        if (this.timeDisplay) {
            let timeText = '';
            let emoji = '🌅';
            
            if (timeOfDay > 0.25 && timeOfDay < 0.75) {
                // Day time
                if (timeOfDay < 0.4) {
                    timeText = 'Morning';
                    emoji = '🌅';
                } else if (timeOfDay < 0.6) {
                    timeText = 'Noon';
                    emoji = '☀️';
                } else {
                    timeText = 'Afternoon';
                    emoji = '🌇';
                }
            } else {
                // Night time
                if (timeOfDay < 0.25) {
                    timeText = 'Night';
                    emoji = '🌙';
                } else {
                    timeText = 'Evening';
                    emoji = '🌆';
                }
            }
            
            this.timeDisplay.textContent = `${emoji} ${timeText}`;
        }
    }

    // System setters
    setGameEngine(gameEngine) {
        this.gameEngine = gameEngine;
        
        // Sync inventory display once game engine is connected
        if (this.gameEngine) {
            setTimeout(() => {
                this.syncWithInventorySystem();
            }, 200); // Increased delay to ensure systems are fully initialized
        }
    }

    // Visibility management
    show() {
        this.gameUI.classList.remove('hidden');
        this.isVisible = true;
    }

    hide() {
        this.gameUI.classList.add('hidden');
        this.isVisible = false;
    }

    // Cleanup
    destroy() {
        this.hideAllPanels();
        console.log('🎨 UI Manager destroyed');
    }

    testTorchEquipping() {
        console.log('🧪 Testing torch equipping system...');
        
        if (!this.gameEngine) {
            console.warn('❌ Game engine not connected');
            return;
        }
        
        const inventorySystem = this.gameEngine.getInventorySystem();
        if (!inventorySystem) {
            console.warn('❌ Inventory system not found');
            return;
        }
        
        const player = this.gameEngine.getPlayer();
        if (!player) {
            console.warn('❌ Player not found');
            return;
        }
        
        console.log('✅ All systems found, testing torch equipping...');
        
        // Check if torch exists in inventory
        const inventory = inventorySystem.getInventory();
        const torchSlot = inventory.findIndex(item => item && item.id === 'torch');
        
        if (torchSlot === -1) {
            console.warn('❌ Torch not found in inventory, adding one...');
            inventorySystem.addItem('torch');
            this.updateInventoryDisplay();
        }
        
        // Try to equip torch
        this.equipTorch(3); // Slot 3 should have torch
    }

    testInventory() {
        console.log('🎒 Testing inventory system...');
        if (!this.gameEngine) {
            console.warn('❌ Game engine not connected');
            return;
        }

        const inventorySystem = this.gameEngine.getInventorySystem();
        if (!inventorySystem) {
            console.warn('❌ Inventory system not found');
            return;
        }

        const player = this.gameEngine.getPlayer();
        if (!player) {
            console.warn('❌ Player not found');
            return;
        }

        console.log('✅ All systems found, testing inventory...');
        
        // Check inventory system status
        console.log('📊 Inventory System Status:');
        console.log('  - Initialized:', inventorySystem.isInitialized);
        console.log('  - Item Database Size:', inventorySystem.itemDatabase.size);
        console.log('  - Max Slots:', inventorySystem.maxSlots);
        console.log('  - Current Slots:', inventorySystem.slots.filter(slot => slot !== null).length);
        
        // Check item database contents
        console.log('📚 Item Database Contents:');
        for (const [itemId, itemData] of inventorySystem.itemDatabase) {
            console.log(`  - ${itemId}: ${itemData.name} (${itemData.type})`);
        }
        
        // Check current inventory
        console.log('📦 Current Inventory:');
        const inventory = inventorySystem.getInventory();
        inventory.forEach((item, index) => {
            if (item) {
                console.log(`  - Slot ${index}: ${item.id} x${item.quantity}`);
            }
        });
        
        // Check equipment
        console.log('⚔️ Current Equipment:');
        const equipment = inventorySystem.getEquipment();
        Object.entries(equipment).forEach(([slot, item]) => {
            if (item) {
                console.log(`  - ${slot}: ${item.id}`);
            } else {
                console.log(`  - ${slot}: empty`);
            }
        });
        
        // Try to add items if database is empty
        if (inventorySystem.itemDatabase.size === 0) {
            console.log('⚠️ Item database is empty, attempting to initialize...');
            inventorySystem.init().then(() => {
                console.log('✅ Inventory system initialized');
                this.testInventory(); // Test again
            }).catch(error => {
                console.error('❌ Failed to initialize inventory system:', error);
            });
        } else {
            // Add some items to test
            const itemsToAdd = [
                { id: 'bronze_ingot', quantity: 5 },
                { id: 'wood', quantity: 10 },
                { id: 'leather', quantity: 3 },
                { id: 'torch', quantity: 1 }
            ];

            itemsToAdd.forEach(item => {
                if (!inventorySystem.hasItem(item.id)) {
                    console.log(`📦 Adding ${item.id} to inventory system`);
                    inventorySystem.addItem(item.id, item.quantity);
                } else {
                    console.log(`📦 ${item.id} already exists, increasing quantity`);
                    inventorySystem.addItem(item.id, item.quantity);
                }
            });

            this.updateInventoryDisplayFromSystem();
            console.log('🎒 Inventory system tested successfully.');
        }
    }

    testPlayerAnimations() {
        console.log('🎭 Testing player animations...');
        if (!this.gameEngine) {
            console.warn('❌ Game engine not available');
            return;
        }

        const player = this.gameEngine.getPlayer();
        if (!player) {
            console.warn('❌ Player not found');
            return;
        }

        console.log('✅ Player found, testing animations...');
        
        // Test different animation states
        if (player.bodyParts) {
            console.log('🎭 Player has', Object.keys(player.bodyParts).length, 'body parts');
            console.log('🎭 Body parts:', Object.keys(player.bodyParts));
            
            // Test reset animation
            player.resetAnimation();
            console.log('🎭 Animation reset');
            
            this.showNotification('🎭 Player animations tested!', 'info');
        } else {
            console.warn('❌ Player body parts not found');
            this.showNotification('❌ Player animations not available', 'error');
        }
    }

    // Handle resize events
    handleResize(viewportWidth, viewportHeight) {
        console.log(`🎨 UI Manager handling resize: ${viewportWidth}x${viewportHeight}`);
        
        // Update any UI elements that need viewport-specific positioning
        this.updateUIPositions(viewportWidth, viewportHeight);
        
        // Ensure panels are properly centered
        this.centerPanels();
        
        console.log('✅ UI resize handled');
    }

    updateUIPositions(viewportWidth, viewportHeight) {
        // Update panel positions to be centered in the new viewport
        const panels = [this.craftingPanel, this.inventory];
        
        panels.forEach(panel => {
            if (panel && !panel.classList.contains('hidden')) {
                // Ensure panel is centered
                panel.style.left = '50%';
                panel.style.top = '50%';
                panel.style.transform = 'translate(-50%, -50%)';
            }
        });
    }

    centerPanels() {
        // Center all visible panels
        const panels = [this.craftingPanel, this.inventory];
        
        panels.forEach(panel => {
            if (panel && !panel.classList.contains('hidden')) {
                panel.style.left = '50%';
                panel.style.top = '50%';
                panel.style.transform = 'translate(-50%, -50%)';
            }
        });
    }

    restoreViewport() {
        console.log('🔄 Restoring viewport...');
        
        if (this.gameEngine) {
            this.gameEngine.restoreViewport();
        } else {
            console.warn('❌ Game engine not available for viewport restoration');
        }
        
        // Also center UI panels
        this.centerPanels();
    }

    toggleGrid() {
        if (!this.gameEngine) {
            console.warn('❌ Game engine not available');
            return;
        }
        
        const gridManager = this.gameEngine.getGridManager();
        if (!gridManager) {
            console.warn('❌ Grid manager not found');
            return;
        }
        
        // Use the grid manager's toggle method
        gridManager.toggleGrid();
    }

    testClickDetection() {
        console.log('🎯 Testing click detection system...');
        if (!this.gameEngine) {
            console.warn('❌ Game engine not connected');
            return;
        }

        const gridManager = this.gameEngine.getGridManager();
        if (!gridManager) {
            console.warn('❌ Grid manager not found');
            return;
        }

        console.log('✅ Grid manager found, testing grid system...');
        
        // Test grid cell lookup
        const testPosition = new THREE.Vector3(0, 0, 0);
        const cell = gridManager.getCellAtWorld(testPosition);
        
        if (cell) {
            console.log('✅ Grid cell lookup working:', cell);
            console.log(`Cell ${cell.x}, ${cell.z} is ${cell.state}`);
        } else {
            console.warn('❌ Grid cell lookup failed');
        }
        
        // Test walkable check
        const isWalkable = gridManager.isWalkable(testPosition);
        console.log('✅ Walkable check:', isWalkable);
        
        // Test nearest walkable
        const walkablePos = gridManager.findNearestWalkable(testPosition);
        console.log('✅ Nearest walkable position:', walkablePos);
    }

    resetCamera() {
        console.log('🔄 Resetting camera...');
        if (this.gameEngine) {
            // Call the resetCamera method on GameEngine
            this.gameEngine.resetCamera();
            this.showNotification('📷 Camera reset to default position!', 'info');
        } else {
            console.warn('❌ Game engine not available for camera reset.');
            this.showNotification('📷 Camera reset failed - game not ready.', 'error');
        }
    }

    addHelpText() {
        const helpTextContainer = document.createElement('div');
        helpTextContainer.className = 'help-text';
        helpTextContainer.innerHTML = `
            <h3>Controls</h3>
            <p><strong>Camera Controls:</strong></p>
            <p>← →: Rotate camera around player</p>
            <p>↑ ↓: Adjust camera height</p>
            <p>R: Reset camera to default</p>
            <p>D: Debug camera state</p>
            <p><strong>Movement:</strong></p>
            <p>Click: Move to clicked location</p>
            <p><strong>UI Controls:</strong></p>
            <p>I: Toggle Inventory</p>
            <p>C: Toggle Crafting</p>
            <p>G: Toggle Grid</p>
            <p>Escape: Close panels</p>
            <p><strong>Debug:</strong></p>
            <p>T: Test torch equipping</p>
            <p>C: Test click detection</p>
            <p>A: Test player animations</p>
            <p>E: Export model specifications</p>
        `;
        helpTextContainer.style.cssText = `
            position: fixed;
            bottom: 20px;
            left: 20px;
            background: rgba(0, 0, 0, 0.8);
            color: white;
            padding: 15px;
            border-radius: 8px;
            z-index: 999;
            font-size: 0.9em;
            max-width: 300px;
            line-height: 1.5;
        `;
        document.body.appendChild(helpTextContainer);
    }

    exportModelSpecs() {
        console.log('📋 Exporting model specifications...');
        if (!this.gameEngine) {
            console.warn('❌ Game engine not available');
            this.showNotification('❌ Cannot export model specs - game engine not available', 'error');
            return;
        }

        const player = this.gameEngine.getPlayer();
        if (!player) {
            console.warn('❌ Player not found');
            this.showNotification('❌ Cannot export model specs - player not found', 'error');
            return;
        }

        const modelSpecs = player.exportModelSpecs();
        if (modelSpecs) {
            console.log('✅ Model specs exported successfully:', modelSpecs);
            this.showNotification('✅ Model specs exported! Check console for details.', 'success');

            // Save the modelSpecs to a JSON file
            const blob = new Blob([JSON.stringify(modelSpecs, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'low_poly_mmorpg_character_specs.json';
            document.body.appendChild(a);
            a.click();
            URL.revokeObjectURL(url);
            document.body.removeChild(a);

        } else {
            console.warn('❌ Failed to export model specs');
            this.showNotification('❌ Failed to export model specs', 'error');
        }
    }
}

// Add CSS animations for notifications
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
    
    @keyframes slideOut {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(100%); opacity: 0; }
    }
`;
document.head.appendChild(style);
