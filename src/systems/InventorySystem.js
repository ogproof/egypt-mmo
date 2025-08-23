export class InventorySystem {
    constructor() {
        this.inventory = {
            slots: [],
            gold: 100,
            level: 1,
            experience: 0
        };
        
        this.equipment = {
            head: null,
            chest: null,
            legs: null,
            feet: null,
            weapon: null,
            offhand: null,
            accessory: null
        };
        
        this.itemDatabase = new Map();
        this.maxSlots = 64; // Add missing maxSlots property
        this.slots = new Array(this.maxSlots).fill(null); // Initialize slots array
        this.isInitialized = false; // Add initialization guard
    }

    async init() {
        // Prevent double initialization
        if (this.isInitialized) {
            console.warn('⚠️ InventorySystem already initialized, skipping...');
            return;
        }
        
        console.log('🎒 Initializing Inventory System...');
        
        console.log('📚 Loading item database...');
        this.loadItemDatabase();
        console.log(`📚 Item database loaded with ${this.itemDatabase.size} items`);
        
        console.log('📦 Adding starting items...');
        this.addStartingItems();
        
        this.isInitialized = true; // Mark as initialized
        console.log('✅ Inventory System initialized');
    }

    loadItemDatabase() {
        console.log('📚 Starting to load item database...');
        
        // Materials
        this.addItemToDatabase('bronze_ingot', {
            name: 'Bronze Ingot',
            type: 'material',
            description: 'A refined bronze ingot for crafting',
            stackable: true,
            maxStack: 100,
            value: 5,
            rarity: 'common'
        });
        console.log('📚 Added bronze_ingot to database');

        this.addItemToDatabase('iron_ingot', {
            name: 'Iron Ingot',
            type: 'material',
            description: 'A refined iron ingot for crafting',
            stackable: true,
            maxStack: 100,
            value: 10,
            rarity: 'common'
        });
        console.log('📚 Added iron_ingot to database');

        this.addItemToDatabase('steel_ingot', {
            name: 'Steel Ingot',
            type: 'material',
            description: 'A refined steel ingot for crafting',
            stackable: true,
            maxStack: 100,
            value: 25,
            rarity: 'uncommon'
        });
        console.log('📚 Added steel_ingot to database');

        this.addItemToDatabase('wood', {
            name: 'Wood',
            type: 'material',
            description: 'Basic wood for crafting',
            stackable: true,
            maxStack: 100,
            value: 1,
            rarity: 'common'
        });
        console.log('📚 Added wood to database');

        this.addItemToDatabase('leather', {
            name: 'Leather',
            type: 'material',
            description: 'Tanned leather for crafting',
            stackable: true,
            maxStack: 100,
            value: 3,
            rarity: 'common'
        });
        console.log('📚 Added leather to database');

        this.addItemToDatabase('thread', {
            name: 'Thread',
            type: 'material',
            description: 'Strong thread for sewing',
            stackable: true,
            maxStack: 100,
            value: 1,
            rarity: 'common'
        });
        console.log('📚 Added thread to database');

        this.addItemToDatabase('herbs', {
            name: 'Herbs',
            type: 'material',
            description: 'Medicinal herbs for alchemy',
            stackable: true,
            maxStack: 100,
            value: 2,
            rarity: 'common'
        });
        console.log('📚 Added herbs to database');

        this.addItemToDatabase('water', {
            name: 'Water',
            type: 'material',
            description: 'Pure water for alchemy',
            stackable: true,
            maxStack: 100,
            value: 1,
            rarity: 'common'
        });
        console.log('📚 Added water to database');

        this.addItemToDatabase('crystal', {
            name: 'Crystal',
            type: 'material',
            description: 'Magical crystal for alchemy',
            stackable: true,
            maxStack: 50,
            value: 15,
            rarity: 'uncommon'
        });
        console.log('📚 Added crystal to database');

        // Weapons
        this.addItemToDatabase('bronze_sword', {
            name: 'Bronze Sword',
            type: 'weapon',
            description: 'A basic bronze sword',
            stackable: false,
            value: 50,
            rarity: 'common',
            stats: { damage: 5, speed: 1.0 },
            requirements: { level: 1, strength: 5 }
        });

        this.addItemToDatabase('iron_sword', {
            name: 'Iron Sword',
            type: 'weapon',
            description: 'A sturdy iron sword',
            stackable: false,
            value: 120,
            rarity: 'uncommon',
            stats: { damage: 8, speed: 0.9 },
            requirements: { level: 5, strength: 8 }
        });

        // Armor
        this.addItemToDatabase('leather_armor', {
            name: 'Leather Armor',
            type: 'armor',
            description: 'Basic leather protection',
            stackable: false,
            value: 80,
            rarity: 'common',
            stats: { defense: 3, weight: 0.5 },
            requirements: { level: 1, agility: 3 }
        });

        // Tools
        this.addItemToDatabase('hammer', {
            name: 'Hammer',
            type: 'tool',
            description: 'Basic crafting hammer',
            stackable: false,
            value: 20,
            rarity: 'common',
            stats: { efficiency: 1, durability: 100 }
        });

        this.addItemToDatabase('needle', {
            name: 'Needle',
            type: 'tool',
            description: 'Sewing needle for crafting',
            stackable: false,
            value: 5,
            rarity: 'common',
            stats: { efficiency: 1, durability: 50 }
        });

        this.addItemToDatabase('mortar', {
            name: 'Mortar',
            type: 'tool',
            description: 'Mortar for alchemy',
            stackable: false,
            value: 15,
            rarity: 'common',
            stats: { efficiency: 1, durability: 100 }
        });

        this.addItemToDatabase('chisel', {
            name: 'Chisel',
            type: 'tool',
            description: 'Woodworking chisel',
            stackable: false,
            value: 12,
            rarity: 'common',
            stats: { efficiency: 1, durability: 80 }
        });

        // Light sources
        this.addItemToDatabase('torch', {
            name: 'Torch',
            type: 'light',
            description: 'A wooden torch that provides light in darkness',
            stackable: false,
            value: 15,
            rarity: 'common',
            stats: { lightRadius: 15, lightIntensity: 1.5, durability: 100 },
            requirements: { level: 1 },
            equipmentSlot: 'offhand'
        });
    }

    addItemToDatabase(itemId, itemData) {
        console.log(`📚 Adding item to database: ${itemId}`);
        this.itemDatabase.set(itemId, {
            id: itemId,
            ...itemData
        });
        console.log(`📚 Item ${itemId} added to database. Current size: ${this.itemDatabase.size}`);
    }

    addStartingItems() {
        console.log('🎒 Adding starting items to inventory...');
        
        // Add some basic materials to get started
        console.log('📦 Adding bronze_ingot x5...');
        this.addItem('bronze_ingot', 5);
        
        console.log('📦 Adding wood x10...');
        this.addItem('wood', 10);
        
        console.log('📦 Adding leather x3...');
        this.addItem('leather', 3);
        
        console.log('📦 Adding thread x5...');
        this.addItem('thread', 5);
        
        console.log('📦 Adding herbs x8...');
        this.addItem('herbs', 8);
        
        console.log('📦 Adding water x20...');
        this.addItem('water', 20);
        
        // Add basic tools
        console.log('📦 Adding hammer...');
        this.addItem('hammer');
        
        console.log('📦 Adding needle...');
        this.addItem('needle');
        
        console.log('📦 Adding mortar...');
        this.addItem('mortar');
        
        console.log('📦 Adding chisel...');
        this.addItem('chisel');
        
        // Add torch for lighting
        console.log('📦 Adding torch...');
        this.addItem('torch');
        
        console.log('🎒 Starting items added. Current inventory:', this.getInventory());
    }

    // Core inventory methods
    addItem(itemId, quantity = 1) {
        console.log(`🎒 Adding item: ${itemId} x${quantity}`);
        
        const itemData = this.itemDatabase.get(itemId);
        if (!itemData) {
            console.warn(`❌ Item ${itemId} not found in database`);
            return false;
        }

        let success = false;
        if (itemData.stackable) {
            success = this.addStackableItem(itemId, quantity);
        } else {
            success = this.addNonStackableItem(itemId);
        }
        
        if (success) {
            console.log(`✅ Successfully added ${itemId} x${quantity}`);
            console.log('🎒 Current inventory state:', this.getInventory());
        } else {
            console.warn(`❌ Failed to add ${itemId} x${quantity}`);
        }
        
        return success;
    }

    addStackableItem(itemId, quantity) {
        // Find existing stack
        for (let i = 0; i < this.maxSlots; i++) {
            if (this.slots[i] && this.slots[i].id === itemId) {
                const itemData = this.itemDatabase.get(itemId);
                const spaceInStack = itemData.maxStack - this.slots[i].quantity;
                
                if (spaceInStack > 0) {
                    const toAdd = Math.min(quantity, spaceInStack);
                    this.slots[i].quantity += toAdd;
                    quantity -= toAdd;
                    
                    if (quantity <= 0) {
                        this.updateInventoryUI();
                        return true;
                    }
                }
            }
        }

        // Find empty slots for remaining quantity
        while (quantity > 0) {
            const emptySlot = this.findEmptySlot();
            if (emptySlot === -1) {
                console.warn('Inventory full!');
                return false;
            }

            const itemData = this.itemDatabase.get(itemId);
            const toAdd = Math.min(quantity, itemData.maxStack);
            
            this.slots[emptySlot] = {
                id: itemId,
                quantity: toAdd,
                quality: 1.0,
                durability: itemData.stats?.durability || 100
            };
            
            quantity -= toAdd;
        }

        this.updateInventoryUI();
        return true;
    }

    addNonStackableItem(itemId) {
        const emptySlot = this.findEmptySlot();
        if (emptySlot === -1) {
            console.warn('Inventory full!');
            return false;
        }

        const itemData = this.itemDatabase.get(itemId);
        this.slots[emptySlot] = {
            id: itemId,
            quantity: 1,
            quality: 1.0,
            durability: itemData.stats?.durability || 100
        };

        this.updateInventoryUI();
        return true;
    }

    findEmptySlot() {
        for (let i = 0; i < this.maxSlots; i++) {
            if (!this.slots[i]) {
                return i;
            }
        }
        return -1; // No empty slots
    }

    removeItem(slotIndex, quantity = 1) {
        if (slotIndex < 0 || slotIndex >= this.maxSlots) return false;
        
        const slot = this.slots[slotIndex];
        if (!slot) return false;

        if (slot.quantity <= quantity) {
            // Remove entire stack
            this.slots[slotIndex] = null;
        } else {
            // Reduce stack size
            slot.quantity -= quantity;
        }

        this.updateInventoryUI();
        return true;
    }

    findItemSlot(itemId) {
        return this.slots.findIndex(slot => slot && slot.id === itemId);
    }

    getItemQuantity(itemId) {
        let total = 0;
        for (const slot of this.slots) {
            if (slot && slot.id === itemId) {
                total += slot.quantity;
            }
        }
        return total;
    }

    hasItem(itemId, quantity = 1) {
        return this.getItemQuantity(itemId) >= quantity;
    }

    // Equipment methods
    equipItem(slotIndex) {
        const slot = this.slots[slotIndex];
        if (!slot) return false;

        const itemData = this.itemDatabase.get(slot.id);
        if (!itemData) return false;

        // Check if item can be equipped
        if (itemData.type === 'light' && itemData.id === 'torch') {
            // Special handling for torch
            return this.equipTorch(slotIndex);
        } else if (itemData.type !== 'weapon' && itemData.type !== 'armor') {
            console.warn('Cannot equip non-equipment item');
            return false;
        }

        // Check requirements
        if (!this.meetsRequirements(itemData.requirements)) {
            console.warn('Requirements not met for equipping item');
            return false;
        }

        // Determine equipment slot
        let equipmentSlot = null;
        if (itemData.type === 'weapon') {
            equipmentSlot = 'weapon';
        } else if (itemData.type === 'armor') {
            // This is simplified - you'd want more specific armor types
            equipmentSlot = 'chest';
        }

        if (!equipmentSlot) return false;

        // Unequip current item if any
        if (this.equipment[equipmentSlot]) {
            this.unequipItem(equipmentSlot);
        }

        // Equip new item
        this.equipment[equipmentSlot] = {
            ...slot,
            slotIndex: slotIndex
        };

        // Remove from inventory
        this.removeItem(slotIndex);

        console.log(`Equipped ${itemData.name}`);
        this.updateInventoryUI();
        return true;
    }

    equipTorch(slotIndex) {
        const slot = this.slots[slotIndex];
        if (!slot || slot.id !== 'torch') return false;

        // Unequip current offhand item if any
        if (this.equipment.offhand) {
            this.unequipItem('offhand');
        }

        // Equip torch in offhand slot
        this.equipment.offhand = {
            ...slot,
            slotIndex: slotIndex
        };

        // Remove from inventory
        this.removeItem(slotIndex);

        console.log('🔥 Torch equipped!');
        this.updateInventoryUI();
        return true;
    }

    unequipItem(equipmentSlot) {
        const equippedItem = this.equipment[equipmentSlot];
        if (!equippedItem) return false;

        // Add back to inventory
        this.addItem(equippedItem.id, equippedItem.quantity);
        
        // Clear equipment slot
        this.equipment[equipmentSlot] = null;

        console.log(`Unequipped ${equippedItem.id}`);
        this.updateInventoryUI();
        return true;
    }

    meetsRequirements(requirements) {
        if (!requirements) return true;

        if (requirements.level && this.level < requirements.level) {
            return false;
        }

        // Add other requirement checks here (strength, agility, etc.)
        return true;
    }

    // Currency and experience
    addGold(amount) {
        this.gold += amount;
        this.updateInventoryUI();
        return this.gold;
    }

    removeGold(amount) {
        if (this.gold >= amount) {
            this.gold -= amount;
            this.updateInventoryUI();
            return true;
        }
        return false;
    }

    addExperience(amount) {
        this.experience += amount;
        
        // Check for level up
        const expForNextLevel = this.getExperienceForLevel(this.level + 1);
        if (this.experience >= expForNextLevel) {
            this.levelUp();
        }
        
        this.updateInventoryUI();
        return this.experience;
    }

    getExperienceForLevel(level) {
        return Math.floor(100 * Math.pow(1.5, level - 1));
    }

    levelUp() {
        this.level++;
        console.log(`🎉 Level up! You are now level ${this.level}`);
        
        // Add level up rewards
        this.addGold(this.level * 10);
        
        // You could add skill points, attribute points, etc.
    }

    // UI updates
    updateInventoryUI() {
        // This would update the actual UI elements
        // For now, just log the current state
        console.log('Inventory updated:', {
            slots: this.slots.filter(slot => slot !== null).length,
            gold: this.gold,
            level: this.level,
            experience: this.experience
        });
    }

    // Getters
    getInventory() {
        return [...this.slots];
    }

    getEquipment() {
        return { ...this.equipment };
    }

    getGold() {
        return this.gold;
    }

    getLevel() {
        return this.level;
    }

    getExperience() {
        return this.experience;
    }

    getItemData(itemId) {
        return this.itemDatabase.get(itemId);
    }

    // Equipment methods
    equipItem(itemId, slot) {
        const itemData = this.itemDatabase.get(itemId);
        if (!itemData) {
            console.warn(`Item ${itemId} not found in database`);
            return false;
        }

        // Check if item can be equipped in this slot
        if (itemData.equipmentSlot && itemData.equipmentSlot !== slot) {
            console.warn(`Item ${itemId} cannot be equipped in ${slot} slot`);
            return false;
        }

        // Unequip current item in slot
        if (this.equipment[slot]) {
            this.unequipItem(slot);
        }

        // Equip the new item
        this.equipment[slot] = {
            id: itemId,
            ...itemData
        };

        console.log(`🔧 Equipped ${itemData.name} in ${slot} slot`);
        this.updateInventoryUI();
        return true;
    }

    unequipItem(slot) {
        if (!this.equipment[slot]) {
            return false;
        }

        const item = this.equipment[slot];
        console.log(`🔧 Unequipped ${item.name} from ${slot} slot`);

        // Add item back to inventory
        this.addItem(item.id);

        // Remove from equipment
        this.equipment[slot] = null;

        this.updateInventoryUI();
        return true;
    }

    isEquipped(itemId) {
        for (const [slot, item] of Object.entries(this.equipment)) {
            if (item && item.id === itemId) {
                return slot;
            }
        }
        return false;
    }

    // Utility methods
    getInventoryValue() {
        let totalValue = 0;
        for (const slot of this.slots) {
            if (slot) {
                const itemData = this.itemDatabase.get(slot.id);
                if (itemData) {
                    totalValue += itemData.value * slot.quantity;
                }
            }
        }
        return totalValue;
    }

    getInventoryWeight() {
        let totalWeight = 0;
        for (const slot of this.slots) {
            if (slot) {
                const itemData = this.itemDatabase.get(slot.id);
                if (itemData && itemData.stats && itemData.stats.weight) {
                    totalWeight += itemData.stats.weight * slot.quantity;
                }
            }
        }
        return totalWeight;
    }

    // Cleanup
    destroy() {
        this.slots = null;
        this.equipment = null;
        this.itemDatabase = null;
        console.log('🎒 Inventory System destroyed');
    }
}
