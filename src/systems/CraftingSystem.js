export class CraftingSystem {
    constructor() {
        this.recipes = new Map();
        this.isInitialized = false; // Add initialization guard
        this.playerSkills = {
            smithing: 1,
            crafting: 1,
            cooking: 1,
            alchemy: 1
        };
        this.playerExperience = {
            smithing: 0,
            crafting: 0,
            alchemy: 0,
            woodworking: 0
        };
        
        // Don't auto-init, wait for explicit init() call
    }

    async init() {
        // Prevent double initialization
        if (this.isInitialized) {
            console.warn('⚠️ CraftingSystem already initialized, skipping...');
            return;
        }
        
        console.log('⚒️ Initializing Crafting System...');
        
        this.loadRecipes();
        
        this.isInitialized = true; // Mark as initialized
        console.log('✅ Crafting System initialized');
    }

    loadRecipes() {
        // Weapons
        this.addRecipe('bronze_sword', {
            name: 'Bronze Sword',
            type: 'weapon',
            skill: 'smithing',
            level: 1,
            experience: 25,
            materials: [
                { id: 'bronze_ingot', quantity: 2 },
                { id: 'wood', quantity: 1 }
            ],
            tools: ['hammer'],
            time: 5000 // 5 seconds
        });

        this.addRecipe('iron_sword', {
            name: 'Iron Sword',
            type: 'weapon',
            skill: 'smithing',
            level: 5,
            experience: 50,
            materials: [
                { id: 'iron_ingot', quantity: 2 },
                { id: 'wood', quantity: 1 }
            ],
            tools: ['hammer'],
            time: 8000
        });

        this.addRecipe('steel_sword', {
            name: 'Steel Sword',
            type: 'weapon',
            skill: 'smithing',
            level: 10,
            experience: 100,
            materials: [
                { id: 'steel_ingot', quantity: 2 },
                { id: 'wood', quantity: 1 }
            ],
            tools: ['hammer'],
            time: 12000
        });

        // Armor
        this.addRecipe('leather_armor', {
            name: 'Leather Armor',
            type: 'armor',
            skill: 'crafting',
            level: 1,
            experience: 20,
            materials: [
                { id: 'leather', quantity: 3 },
                { id: 'thread', quantity: 2 }
            ],
            tools: ['needle'],
            time: 4000
        });

        this.addRecipe('bronze_armor', {
            name: 'Bronze Armor',
            type: 'armor',
            skill: 'smithing',
            level: 5,
            experience: 45,
            materials: [
                { id: 'bronze_ingot', quantity: 4 },
                { id: 'leather', quantity: 2 }
            ],
            tools: ['hammer'],
            time: 10000
        });

        // Tools
        this.addRecipe('bronze_pickaxe', {
            name: 'Bronze Pickaxe',
            type: 'tool',
            skill: 'smithing',
            level: 1,
            experience: 30,
            materials: [
                { id: 'bronze_ingot', quantity: 1 },
                { id: 'wood', quantity: 2 }
            ],
            tools: ['hammer'],
            time: 6000
        });

        this.addRecipe('iron_pickaxe', {
            name: 'Iron Pickaxe',
            type: 'tool',
            skill: 'smithing',
            level: 5,
            experience: 60,
            materials: [
                { id: 'iron_ingot', quantity: 1 },
                { id: 'wood', quantity: 2 }
            ],
            tools: ['hammer'],
            time: 9000
        });

        // Potions
        this.addRecipe('health_potion', {
            name: 'Health Potion',
            type: 'potion',
            skill: 'alchemy',
            level: 1,
            experience: 15,
            materials: [
                { id: 'herbs', quantity: 2 },
                { id: 'water', quantity: 1 }
            ],
            tools: ['mortar'],
            time: 3000
        });

        this.addRecipe('strength_potion', {
            name: 'Strength Potion',
            type: 'potion',
            skill: 'alchemy',
            level: 5,
            experience: 35,
            materials: [
                { id: 'herbs', quantity: 3 },
                { id: 'water', quantity: 1 },
                { id: 'crystal', quantity: 1 }
            ],
            tools: ['mortar'],
            time: 6000
        });

        // Woodworking items
        this.addRecipe('wooden_shield', {
            name: 'Wooden Shield',
            type: 'armor',
            skill: 'woodworking',
            level: 1,
            experience: 25,
            materials: [
                { id: 'wood', quantity: 4 },
                { id: 'leather', quantity: 1 }
            ],
            tools: ['chisel'],
            time: 5000
        });
    }

    addRecipe(itemId, recipe) {
        this.recipes.set(itemId, recipe);
    }

    getRecipe(itemId) {
        return this.recipes.get(itemId);
    }

    getAllRecipes() {
        return Array.from(this.recipes.values());
    }

    getRecipesBySkill(skill) {
        return Array.from(this.recipes.values()).filter(recipe => recipe.skill === skill);
    }

    getRecipesByLevel(skill, level) {
        return this.getRecipesBySkill(skill).filter(recipe => recipe.level <= level);
    }

    canCraftItem(itemId, inventory, tools) {
        const recipe = this.getRecipe(itemId);
        if (!recipe) return false;

        // Check skill level
        if (this.playerSkills[recipe.skill] < recipe.level) {
            return { canCraft: false, reason: `Requires ${recipe.skill} level ${recipe.level}` };
        }

        // Check materials
        for (const material of recipe.materials) {
            const available = this.getMaterialQuantity(inventory, material.id);
            if (available < material.quantity) {
                return { canCraft: false, reason: `Need ${material.quantity} ${material.id}, have ${available}` };
            }
        }

        // Check tools
        for (const tool of recipe.tools) {
            if (!this.hasTool(tools, tool)) {
                return { canCraft: false, reason: `Need ${tool} tool` };
            }
        }

        return { canCraft: true };
    }

    craftItem(itemId, inventory, tools) {
        const canCraft = this.canCraftItem(itemId, inventory, tools);
        if (!canCraft.canCraft) {
            console.log(`Cannot craft ${itemId}: ${canCraft.reason}`);
            return false;
        }

        const recipe = this.getRecipe(itemId);
        
        // Consume materials
        for (const material of recipe.materials) {
            this.consumeMaterial(inventory, material.id, material.quantity);
        }

        // Add experience
        this.addExperience(recipe.skill, recipe.experience);

        // Create the item
        const craftedItem = this.createItem(itemId, recipe);
        
        console.log(`Successfully crafted ${craftedItem.name}!`);
        console.log(`Gained ${recipe.experience} ${recipe.skill} experience`);
        
        return craftedItem;
    }

    createItem(itemId, recipe) {
        const item = {
            id: itemId,
            name: recipe.name,
            type: recipe.type,
            skill: recipe.skill,
            level: recipe.level,
            quality: this.calculateQuality(recipe.skill),
            durability: this.calculateDurability(recipe.skill),
            stats: this.calculateStats(recipe)
        };

        return item;
    }

    calculateQuality(skill) {
        const skillLevel = this.playerSkills[skill];
        const baseQuality = 1.0;
        const qualityBonus = (skillLevel - 1) * 0.1;
        return Math.min(baseQuality + qualityBonus, 2.0); // Max 2.0 quality
    }

    calculateDurability(skill) {
        const skillLevel = this.playerSkills[skill];
        const baseDurability = 100;
        const durabilityBonus = (skillLevel - 1) * 10;
        return baseDurability + durabilityBonus;
    }

    calculateStats(recipe) {
        const stats = {};
        const quality = this.calculateQuality(recipe.skill);
        
        switch (recipe.type) {
            case 'weapon':
                stats.damage = Math.floor(recipe.level * 5 * quality);
                stats.speed = Math.max(1.0 - (recipe.level * 0.05), 0.5);
                break;
            case 'armor':
                stats.defense = Math.floor(recipe.level * 3 * quality);
                stats.weight = recipe.level * 0.5;
                break;
            case 'tool':
                stats.efficiency = Math.floor(recipe.level * 2 * quality);
                stats.durability = this.calculateDurability(recipe.skill);
                break;
            case 'potion':
                stats.power = Math.floor(recipe.level * 2 * quality);
                stats.duration = recipe.level * 30; // seconds
                break;
        }
        
        return stats;
    }

    addExperience(skill, amount) {
        this.playerExperience[skill] += amount;
        
        // Check for level up
        const currentLevel = this.playerSkills[skill];
        const experienceNeeded = this.getExperienceForLevel(currentLevel + 1);
        
        if (this.playerExperience[skill] >= experienceNeeded) {
            this.levelUpSkill(skill);
        }
    }

    getExperienceForLevel(level) {
        // Exponential experience curve
        return Math.floor(100 * Math.pow(1.5, level - 1));
    }

    levelUpSkill(skill) {
        this.playerSkills[skill]++;
        console.log(`🎉 ${skill} leveled up to ${this.playerSkills[skill]}!`);
        
        // You could add level up rewards here
        return this.playerSkills[skill];
    }

    // Helper methods
    getMaterialQuantity(inventory, materialId) {
        // This would check the actual inventory
        // For now, return a mock value
        const mockInventory = {
            'bronze_ingot': 5,
            'iron_ingot': 3,
            'steel_ingot': 1,
            'wood': 10,
            'leather': 8,
            'thread': 15,
            'herbs': 20,
            'water': 50,
            'crystal': 2
        };
        
        return mockInventory[materialId] || 0;
    }

    consumeMaterial(inventory, materialId, quantity) {
        // This would actually consume from inventory
        console.log(`Consumed ${quantity} ${materialId}`);
    }

    hasTool(tools, toolId) {
        // This would check if player has the required tool
        const mockTools = ['hammer', 'needle', 'mortar', 'chisel'];
        return mockTools.includes(toolId);
    }

    // Getters
    getPlayerSkills() {
        return { ...this.playerSkills };
    }

    getPlayerExperience() {
        return { ...this.playerExperience };
    }

    getSkillLevel(skill) {
        return this.playerSkills[skill] || 0;
    }

    getSkillExperience(skill) {
        return this.playerExperience[skill] || 0;
    }

    // Utility methods
    getNextLevelProgress(skill) {
        const currentLevel = this.playerSkills[skill];
        const currentExp = this.playerExperience[skill];
        const expForCurrent = this.getExperienceForLevel(currentLevel);
        const expForNext = this.getExperienceForLevel(currentLevel + 1);
        
        const progress = (currentExp - expForCurrent) / (expForNext - expForCurrent);
        return Math.max(0, Math.min(1, progress));
    }

    getSkillInfo(skill) {
        return {
            level: this.playerSkills[skill],
            experience: this.playerExperience[skill],
            nextLevelExp: this.getExperienceForLevel(this.playerSkills[skill] + 1),
            progress: this.getNextLevelProgress(skill)
        };
    }
}
