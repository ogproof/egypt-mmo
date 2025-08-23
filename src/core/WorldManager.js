import * as THREE from 'three';
import * as CANNON from 'cannon-es';

export class WorldManager {
    constructor(scene) {
        this.scene = scene;
        this.worldSize = 1000;
        this.terrain = null;
        this.pyramids = [];
        this.temples = [];
        this.sphinxes = [];
        this.obelisks = [];
        this.resourceNodes = [];
        this.decorations = [];
        this.camera = null;
        this.frameCount = 0;
        
        // Performance optimizations
        this.frustum = new THREE.Frustum();
        this.visibleObjects = new Set();
        this.lodLevels = new Map();
        
        // UI reference
        this.uiManager = null;
        
        this.isInitialized = false; // Add initialization guard
    }

    async init() {
        // Prevent double initialization
        if (this.isInitialized) {
            console.warn('⚠️ WorldManager already initialized, skipping...');
            return;
        }
        
        console.log('🌍 Initializing World Manager...');
        
        this.createTerrain();
        this.createEgyptianStructures();
        this.createResourceNodes();
        this.createDecorations();
        this.createLighting();
        
        // Protect important objects from accidental removal
        this.protectImportantObjects();
        
        this.isInitialized = true; // Mark as initialized
        console.log('✅ World Manager initialized');
    }

    createTerrain() {
        // Create ground plane with minimal detail for maximum performance
        const groundGeometry = new THREE.PlaneGeometry(this.worldSize, this.worldSize, 8, 8);
        const groundMaterial = new THREE.MeshLambertMaterial({ 
            color: 0x8B4513, // Sandy brown for desert
            side: THREE.DoubleSide
        });
        
        this.terrain = new THREE.Mesh(groundGeometry, groundMaterial);
        this.terrain.rotation.x = -Math.PI / 2;
        this.terrain.receiveShadow = true;
        this.terrain.castShadow = false; // Ground doesn't cast shadows
        this.terrain.userData.type = 'terrain';
        
        this.scene.add(this.terrain);
        
        // Add minimal terrain variation
        this.addTerrainVariation();
    }

    addTerrainVariation() {
        // Add minimal hills and valleys for performance
        const hillsGeometry = new THREE.PlaneGeometry(this.worldSize, this.worldSize, 6, 6);
        const hillsMaterial = new THREE.MeshLambertMaterial({ 
            color: 0xA0522D, // Sienna for hills
            side: THREE.DoubleSide,
            transparent: true,
            opacity: 0.7
        });
        
        const hills = new THREE.Mesh(hillsGeometry, hillsMaterial);
        hills.rotation.x = -Math.PI / 2;
        hills.position.y = 0.1;
        hills.receiveShadow = true;
        hills.castShadow = false; // Hills don't cast shadows
        
        // Add realistic height variation for natural shadow casting
        const vertices = hills.geometry.attributes.position.array;
        for (let i = 0; i < vertices.length; i += 3) {
            // More natural terrain variation - not perfectly smooth
            const x = vertices[i];
            const z = vertices[i + 2];
            const height = Math.sin(x * 0.02) * Math.cos(z * 0.02) * 3 + 
                          Math.sin(x * 0.05) * Math.cos(z * 0.05) * 1.5 + // Secondary variation
                          Math.sin(x * 0.1) * Math.cos(z * 0.1) * 0.5;   // Fine detail
            vertices[i + 1] = height;
        }
        hills.geometry.attributes.position.needsUpdate = true;
        
        this.scene.add(hills);
    }

    createEgyptianStructures() {
        // Create pyramids
        this.createPyramids();
        
        // Create temples
        this.createTemples();
        
        // Create sphinxes
        this.createSphinxes();
        
        // Create obelisks
        this.createObelisks();
    }

    createPyramids() {
        const pyramidPositions = [
            { x: -100, z: -100, size: 20 },
            { x: 100, z: -150, size: 15 },
            { x: -150, z: 100, size: 25 }
        ];
        
        pyramidPositions.forEach((pos, index) => {
            const pyramid = this.createPyramid(pos.size);
            pyramid.position.set(pos.x, 0, pos.z);
            pyramid.userData.type = 'landmark';
            pyramid.userData.name = `Pyramid ${index + 1}`;
            
            this.scene.add(pyramid);
            this.pyramids.push(pyramid);
        });
    }

    createPyramid(size) {
        const geometry = new THREE.ConeGeometry(size, size * 1.5, 4);
        const material = new THREE.MeshLambertMaterial({ 
            color: 0xF4A460, // Sandy color
            transparent: true,
            opacity: 0.9
        });
        
        const pyramid = new THREE.Mesh(geometry, material);
        pyramid.castShadow = true;
        pyramid.receiveShadow = true;
        
        // Add some weathering effect
        const weatheringMaterial = new THREE.MeshLambertMaterial({ 
            color: 0x8B7355, // Darker brown
            transparent: true,
            opacity: 0.3
        });
        
        const weathering = new THREE.Mesh(geometry, weatheringMaterial);
        weathering.scale.setScalar(0.8);
        weathering.position.y = size * 0.1;
        
        pyramid.add(weathering);
        
        return pyramid;
    }

    createTemples() {
        const templePositions = [
            { x: 50, z: 50 },
            { x: -80, z: 80 },
            { x: 120, z: -80 }
        ];
        
        templePositions.forEach((pos, index) => {
            const temple = this.createTemple();
            temple.position.set(pos.x, 0, pos.z);
            temple.userData.type = 'landmark';
            temple.userData.name = `Temple ${index + 1}`;
            
            this.scene.add(temple);
            this.temples.push(temple);
        });
    }

    createTemple() {
        const group = new THREE.Group();
        
        // Base
        const baseGeometry = new THREE.BoxGeometry(15, 2, 15);
        const baseMaterial = new THREE.MeshLambertMaterial({ color: 0xD2B48C });
        const base = new THREE.Mesh(baseGeometry, baseMaterial);
        base.position.y = 1;
        base.castShadow = true;
        base.receiveShadow = true;
        group.add(base);
        
        // Main structure
        const mainGeometry = new THREE.BoxGeometry(10, 8, 10);
        const mainMaterial = new THREE.MeshLambertMaterial({ color: 0xF4A460 });
        const main = new THREE.Mesh(mainGeometry, mainMaterial);
        main.position.y = 6;
        main.castShadow = true;
        main.receiveShadow = true;
        group.add(main);
        
        // Roof
        const roofGeometry = new THREE.ConeGeometry(8, 4, 4);
        const roofMaterial = new THREE.MeshLambertMaterial({ color: 0x8B7355 });
        const roof = new THREE.Mesh(roofGeometry, roofMaterial);
        roof.position.y = 12;
        roof.castShadow = true;
        roof.receiveShadow = true;
        group.add(roof);
        
        // Columns
        for (let i = 0; i < 4; i++) {
            const columnGeometry = new THREE.CylinderGeometry(0.5, 0.5, 6);
            const columnMaterial = new THREE.MeshLambertMaterial({ color: 0xD2B48C });
            const column = new THREE.Mesh(columnGeometry, columnMaterial);
            
            const angle = (i / 4) * Math.PI * 2;
            column.position.set(
                Math.cos(angle) * 8,
                4,
                Math.sin(angle) * 8
            );
            
            column.castShadow = true;
            column.receiveShadow = true;
            group.add(column);
        }
        
        return group;
    }

    createSphinxes() {
        const sphinxPositions = [
            { x: 0, z: -200 },
            { x: 200, z: 0 },
            { x: -200, z: 0 }
        ];
        
        sphinxPositions.forEach((pos, index) => {
            const sphinx = this.createSphinx();
            sphinx.position.set(pos.x, 0, pos.z);
            sphinx.userData.type = 'landmark';
            sphinx.userData.name = `Sphinx ${index + 1}`;
            
            this.scene.add(sphinx);
            this.sphinxes.push(sphinx);
        });
    }

    createSphinx() {
        const group = new THREE.Group();
        
        // Body
        const bodyGeometry = new THREE.BoxGeometry(8, 4, 12);
        const bodyMaterial = new THREE.MeshLambertMaterial({ color: 0xD2B48C });
        const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
        body.position.y = 2;
        body.castShadow = true;
        body.receiveShadow = true;
        group.add(body);
        
        // Head
        const headGeometry = new THREE.BoxGeometry(4, 3, 4);
        const headMaterial = new THREE.MeshLambertMaterial({ color: 0xD2B48C });
        const head = new THREE.Mesh(headGeometry, headMaterial);
        head.position.set(0, 5, -4);
        head.castShadow = true;
        head.receiveShadow = true;
        group.add(head);
        
        // Face features (simplified)
        const eyeGeometry = new THREE.SphereGeometry(0.3, 8, 8);
        const eyeMaterial = new THREE.MeshLambertMaterial({ color: 0x000000 });
        
        const leftEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
        leftEye.position.set(-0.8, 5.5, -1.5);
        group.add(leftEye);
        
        const rightEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
        rightEye.position.set(0.8, 5.5, -1.5);
        group.add(rightEye);
        
        return group;
    }

    createObelisks() {
        const obeliskPositions = [
            { x: 30, z: 30 },
            { x: -30, z: -30 },
            { x: 30, z: -30 },
            { x: -30, z: 30 }
        ];
        
        obeliskPositions.forEach((pos, index) => {
            const obelisk = this.createObelisk();
            obelisk.position.set(pos.x, 0, pos.z);
            obelisk.userData.type = 'landmark';
            obelisk.userData.name = `Obelisk ${index + 1}`;
            
            this.scene.add(obelisk);
            this.obelisks.push(obelisk);
        });
    }

    createObelisk() {
        const group = new THREE.Group();
        
        // Base
        const baseGeometry = new THREE.BoxGeometry(2, 1, 2);
        const baseMaterial = new THREE.MeshLambertMaterial({ color: 0x8B7355 });
        const base = new THREE.Mesh(baseGeometry, baseMaterial);
        base.position.y = 0.5;
        base.castShadow = true;
        base.receiveShadow = true;
        group.add(base);
        
        // Main shaft
        const shaftGeometry = new THREE.BoxGeometry(1, 15, 1);
        const shaftMaterial = new THREE.MeshLambertMaterial({ color: 0xD2B48C });
        const shaft = new THREE.Mesh(shaftGeometry, shaftMaterial);
        shaft.position.y = 8.5;
        shaft.castShadow = true;
        shaft.receiveShadow = true;
        group.add(shaft);
        
        // Top
        const topGeometry = new THREE.ConeGeometry(0.8, 2, 4);
        const topMaterial = new THREE.MeshLambertMaterial({ color: 0xFFD700 }); // Gold
        const top = new THREE.Mesh(topGeometry, topMaterial);
        top.position.y = 16;
        top.castShadow = true;
        top.receiveShadow = true;
        group.add(top);
        
        return group;
    }

    createResourceNodes() {
        // Create various resource nodes around the world
        const resourceTypes = [
            { type: 'mining', name: 'Copper Mine', color: 0xCD7F32, position: { x: -50, z: -50 } },
            { type: 'mining', name: 'Iron Mine', color: 0x696969, position: { x: 50, z: -50 } },
            { type: 'woodcutting', name: 'Palm Grove', color: 0x228B22, position: { x: -50, z: 50 } },
            { type: 'herbalism', name: 'Herb Garden', color: 0x32CD32, position: { x: 50, z: 50 } },
            { type: 'fishing', name: 'Oasis', color: 0x00CED1, position: { x: 0, z: -100 } }
        ];
        
        resourceTypes.forEach((resource, index) => {
            const node = this.createResourceNode(resource);
            node.position.set(resource.position.x, 0, resource.position.z);
            node.userData.type = 'resource_node';
            node.userData.resourceType = resource.type;
            node.userData.name = resource.name;
            
            this.scene.add(node);
            this.resourceNodes[index] = node;
        });
    }

    createResourceNode(resourceData) {
        let geometry, material;
        
        switch (resourceData.type) {
            case 'mining':
                geometry = new THREE.ConeGeometry(3, 6, 8);
                material = new THREE.MeshLambertMaterial({ color: resourceData.color });
                break;
            case 'woodcutting':
                geometry = new THREE.CylinderGeometry(2, 3, 8);
                material = new THREE.MeshLambertMaterial({ color: resourceData.color });
                break;
            case 'herbalism':
                geometry = new THREE.SphereGeometry(2, 8, 8);
                material = new THREE.MeshLambertMaterial({ color: resourceData.color });
                break;
            case 'fishing':
                geometry = new THREE.CylinderGeometry(5, 5, 1);
                material = new THREE.MeshLambertMaterial({ 
                    color: resourceData.color,
                    transparent: true,
                    opacity: 0.6
                });
                break;
            default:
                geometry = new THREE.BoxGeometry(3, 3, 3);
                material = new THREE.MeshLambertMaterial({ color: resourceData.color });
        }
        
        const node = new THREE.Mesh(geometry, material);
        node.position.y = geometry.parameters.height / 2;
        node.castShadow = true;
        node.receiveShadow = true;
        
        return node;
    }

    createDecorations() {
        console.log('🏠 Creating world decorations...');
        
        // Create palm trees
        this.createPalmTrees();
        
        // Create rocks
        this.createRocks();
        
        // Create sand dunes
        this.createSandDunes();
        
        // Create medieval house
        this.createMedievalHouse();
        
        console.log('✅ World decorations created');
    }
    
    createMedievalHouse() {
        console.log('🏠 Creating detailed medieval house...');
        
        const houseGroup = new THREE.Group();
        const housePosition = new THREE.Vector3(15, 0, 15); // Position away from center
        houseGroup.position.copy(housePosition);
        
        // Create house structure
        this.createHouseStructure(houseGroup);
        
        // Create interior
        this.createHouseInterior(houseGroup);
        
        // Create furniture
        this.createHouseFurniture(houseGroup);
        
        // Create decorative elements
        this.createHouseDecorations(houseGroup);
        
        // Add to scene
        this.scene.add(houseGroup);
        this.decorations.push(houseGroup);
        
        console.log('✅ Medieval house created at position:', housePosition);
    }
    
    createHouseStructure(houseGroup) {
        // Main house structure - stone foundation and wooden walls (MUCH BIGGER)
        const foundationGeometry = new THREE.BoxGeometry(16, 2, 12);
        const foundationMaterial = new THREE.MeshLambertMaterial({ color: 0x696969 }); // Stone gray
        const foundation = new THREE.Mesh(foundationGeometry, foundationMaterial);
        foundation.position.y = 1;
        foundation.castShadow = true;
        foundation.receiveShadow = true;
        houseGroup.add(foundation);
        
        // Wooden walls (much taller and wider)
        const wallGeometry = new THREE.BoxGeometry(15, 6, 11);
        const wallMaterial = new THREE.MeshLambertMaterial({ color: 0x8B4513 }); // Saddle brown
        const walls = new THREE.Mesh(wallGeometry, wallMaterial);
        walls.position.y = 5;
        walls.castShadow = true;
        walls.receiveShadow = true;
        houseGroup.add(walls);
        
        // Roof - thatched style (bigger)
        const roofGeometry = new THREE.ConeGeometry(10, 4, 8);
        const roofMaterial = new THREE.MeshLambertMaterial({ color: 0x654321 }); // Dark brown
        const roof = new THREE.Mesh(roofGeometry, roofMaterial);
        roof.position.y = 11;
        roof.castShadow = true;
        roof.receiveShadow = true;
        houseGroup.add(roof);
        
        // Door frame (bigger)
        const doorFrameGeometry = new THREE.BoxGeometry(3, 5, 0.5);
        const doorFrameMaterial = new THREE.MeshLambertMaterial({ color: 0x654321 });
        const doorFrame = new THREE.Mesh(doorFrameGeometry, doorFrameMaterial);
        doorFrame.position.set(0, 2.5, 5.8);
        houseGroup.add(doorFrame);
        
        // Door (bigger)
        const doorGeometry = new THREE.BoxGeometry(2.6, 4.6, 0.2);
        const doorMaterial = new THREE.MeshLambertMaterial({ color: 0x8B4513 });
        const door = new THREE.Mesh(doorGeometry, doorMaterial);
        door.position.set(0, 2.3, 6.2);
        houseGroup.add(door);
        
        // Windows (bigger and more)
        const windowGeometry = new THREE.BoxGeometry(2, 2, 0.2);
        const windowMaterial = new THREE.MeshLambertMaterial({ 
            color: 0x87CEEB, 
            transparent: true, 
            opacity: 0.7 
        });
        
        // Left window
        const leftWindow = new THREE.Mesh(windowGeometry, windowMaterial);
        leftWindow.position.set(-4, 4, 5.8);
        houseGroup.add(leftWindow);
        
        // Right window
        const rightWindow = new THREE.Mesh(windowGeometry, windowMaterial);
        rightWindow.position.set(4, 4, 5.8);
        houseGroup.add(rightWindow);
        
        // Back windows
        const backWindow1 = new THREE.Mesh(windowGeometry, windowMaterial);
        backWindow1.position.set(-3, 4, -5.8);
        backWindow1.rotation.y = Math.PI;
        houseGroup.add(backWindow1);
        
        const backWindow2 = new THREE.Mesh(windowGeometry, windowMaterial);
        backWindow2.position.set(3, 4, -5.8);
        backWindow2.rotation.y = Math.PI;
        houseGroup.add(backWindow2);
        
        // Chimney (bigger)
        const chimneyGeometry = new THREE.BoxGeometry(1.5, 4, 1.5);
        const chimneyMaterial = new THREE.MeshLambertMaterial({ color: 0x696969 });
        const chimney = new THREE.Mesh(chimneyGeometry, chimneyMaterial);
        chimney.position.set(5, 12, 0);
        chimney.castShadow = true;
        chimney.receiveShadow = true;
        houseGroup.add(chimney);
    }
    
    createHouseInterior(houseGroup) {
        // Interior floor (bigger)
        const floorGeometry = new THREE.BoxGeometry(14, 0.4, 10);
        const floorMaterial = new THREE.MeshLambertMaterial({ color: 0x8B4513 });
        const floor = new THREE.Mesh(floorGeometry, floorMaterial);
        floor.position.set(0, 0.2, 0);
        floor.receiveShadow = true;
        houseGroup.add(floor);
        
        // Interior walls (creating multiple rooms)
        const interiorWallMaterial = new THREE.MeshLambertMaterial({ color: 0xD2B48C });
        
        // Main room divider wall
        const dividerWallGeometry = new THREE.BoxGeometry(0.4, 5.6, 10);
        const dividerWall = new THREE.Mesh(dividerWallGeometry, interiorWallMaterial);
        dividerWall.position.set(0, 2.8, 0);
        dividerWall.receiveShadow = true;
        houseGroup.add(dividerWall);
        
        // Left room wall
        const leftWallGeometry = new THREE.BoxGeometry(0.4, 5.6, 10);
        const leftWall = new THREE.Mesh(leftWallGeometry, interiorWallMaterial);
        leftWall.position.set(-4, 2.8, 0);
        leftWall.receiveShadow = true;
        houseGroup.add(leftWall);
        
        // Right room wall
        const rightWallGeometry = new THREE.BoxGeometry(0.4, 5.6, 10);
        const rightWall = new THREE.Mesh(rightWallGeometry, interiorWallMaterial);
        rightWall.position.set(4, 2.8, 0);
        rightWall.receiveShadow = true;
        houseGroup.add(rightWall);
        
        // Back walls
        const backWallGeometry = new THREE.BoxGeometry(14, 5.6, 0.4);
        const backWall = new THREE.Mesh(backWallGeometry, interiorWallMaterial);
        backWall.position.set(0, 2.8, -5);
        backWall.receiveShadow = true;
        houseGroup.add(backWall);
        
        // Front wall (with door opening)
        const frontWallGeometry = new THREE.BoxGeometry(14, 5.6, 0.4);
        const frontWall = new THREE.Mesh(frontWallGeometry, interiorWallMaterial);
        frontWall.position.set(0, 2.8, 5);
        frontWall.receiveShadow = true;
        houseGroup.add(frontWall);
    }
    
    createHouseFurniture(houseGroup) {
        // Master Bed (bigger)
        const bedFrameGeometry = new THREE.BoxGeometry(5, 0.6, 3.6);
        const bedFrameMaterial = new THREE.MeshLambertMaterial({ color: 0x8B4513 });
        const bedFrame = new THREE.Mesh(bedFrameGeometry, bedFrameMaterial);
        bedFrame.position.set(-5, 0.3, -3);
        bedFrame.castShadow = true;
        bedFrame.receiveShadow = true;
        houseGroup.add(bedFrame);
        
        // Bed mattress (bigger)
        const mattressGeometry = new THREE.BoxGeometry(4.6, 0.4, 3.2);
        const mattressMaterial = new THREE.MeshLambertMaterial({ color: 0xDEB887 });
        const mattress = new THREE.Mesh(mattressGeometry, mattressMaterial);
        mattress.position.set(-5, 0.7, -3);
        houseGroup.add(mattress);
        
        // Bed pillows (bigger)
        const pillowGeometry = new THREE.BoxGeometry(1.6, 0.2, 1.2);
        const pillowMaterial = new THREE.MeshLambertMaterial({ color: 0xF5F5DC });
        
        const pillow1 = new THREE.Mesh(pillowGeometry, pillowMaterial);
        pillow1.position.set(-5, 1.1, -4.4);
        houseGroup.add(pillow1);
        
        const pillow2 = new THREE.Mesh(pillowGeometry, pillowMaterial);
        pillow2.position.set(-5, 1.1, -3.2);
        houseGroup.add(pillow2);
        
        // Large Dining Table (bigger)
        const tableGeometry = new THREE.BoxGeometry(4, 0.2, 2.4);
        const tableMaterial = new THREE.MeshLambertMaterial({ color: 0x8B4513 });
        const table = new THREE.Mesh(tableGeometry, tableMaterial);
        table.position.set(5, 1.6, 0);
        table.castShadow = true;
        table.receiveShadow = true;
        houseGroup.add(table);
        
        // Table legs (bigger)
        const legGeometry = new THREE.BoxGeometry(0.2, 1.6, 0.2);
        const legMaterial = new THREE.MeshLambertMaterial({ color: 0x654321 });
        
        for (let i = 0; i < 4; i++) {
            const leg = new THREE.Mesh(legGeometry, legMaterial);
            const x = 5 + (i % 2 === 0 ? -1.8 : 1.8);
            const z = (i < 2 ? -1 : 1);
            leg.position.set(x, 0.8, z);
            houseGroup.add(leg);
        }
        
        // Chairs around table (bigger)
        const chairSeatGeometry = new THREE.BoxGeometry(1.2, 0.2, 1.2);
        const chairBackGeometry = new THREE.BoxGeometry(1.2, 1.6, 0.2);
        
        // Chair positions around table
        const chairPositions = [
            { x: 5, z: 2.5, rotation: 0 },    // Front
            { x: 5, z: -2.5, rotation: Math.PI }, // Back
            { x: 7.5, z: 0, rotation: Math.PI/2 }, // Right
            { x: 2.5, z: 0, rotation: -Math.PI/2 } // Left
        ];
        
        chairPositions.forEach(pos => {
            const chairSeat = new THREE.Mesh(chairSeatGeometry, tableMaterial);
            chairSeat.position.set(pos.x, 0.8, pos.z);
            houseGroup.add(chairSeat);
            
            const chairBack = new THREE.Mesh(chairBackGeometry, tableMaterial);
            chairBack.position.set(pos.x, 1.6, pos.z + (pos.rotation === 0 ? 0.6 : -0.6));
            chairBack.rotation.y = pos.rotation;
            houseGroup.add(chairBack);
        });
        
        // Large Fireplace (bigger)
        const fireplaceGeometry = new THREE.BoxGeometry(3, 2.4, 1.6);
        const fireplaceMaterial = new THREE.MeshLambertMaterial({ color: 0x696969 });
        const fireplace = new THREE.Mesh(fireplaceGeometry, fireplaceMaterial);
        fireplace.position.set(0, 1.2, -4.4);
        fireplace.castShadow = true;
        fireplace.receiveShadow = true;
        houseGroup.add(fireplace);
        
        // Fire (bigger glowing effect)
        const fireGeometry = new THREE.BoxGeometry(2, 1.6, 0.6);
        const fireMaterial = new THREE.MeshLambertMaterial({ 
            color: 0xFF4500,
            emissive: 0xFF4500,
            emissiveIntensity: 0.3
        });
        const fire = new THREE.Mesh(fireGeometry, fireMaterial);
        fire.position.set(0, 0.8, -5.2);
        houseGroup.add(fire);
        
        // Add fire light (stronger)
        const fireLight = new THREE.PointLight(0xFF6B35, 1.0, 6);
        fireLight.position.set(0, 0.8, -5.2);
        houseGroup.add(fireLight);
        
        // Second bed in right room
        const bed2Frame = new THREE.Mesh(bedFrameGeometry, bedFrameMaterial);
        bed2Frame.position.set(5, 0.3, -3);
        bed2Frame.castShadow = true;
        bed2Frame.receiveShadow = true;
        houseGroup.add(bed2Frame);
        
        const bed2Mattress = new THREE.Mesh(mattressGeometry, mattressMaterial);
        bed2Mattress.position.set(5, 0.7, -3);
        houseGroup.add(bed2Mattress);
        
        const bed2Pillow1 = new THREE.Mesh(pillowGeometry, pillowMaterial);
        bed2Pillow1.position.set(5, 1.1, -4.4);
        houseGroup.add(bed2Pillow1);
        
        const bed2Pillow2 = new THREE.Mesh(pillowGeometry, pillowMaterial);
        bed2Pillow2.position.set(5, 1.1, -3.2);
        houseGroup.add(bed2Pillow2);
    }
    
    createHouseDecorations(houseGroup) {
        // Large wall tapestry (bigger)
        const tapestryGeometry = new THREE.PlaneGeometry(3, 2);
        const tapestryMaterial = new THREE.MeshLambertMaterial({ color: 0x8B0000 });
        const tapestry = new THREE.Mesh(tapestryGeometry, tapestryMaterial);
        tapestry.position.set(0, 4, -4.8);
        tapestry.rotation.y = Math.PI;
        houseGroup.add(tapestry);
        
        // Large candle on table (bigger)
        const candleGeometry = new THREE.CylinderGeometry(0.1, 0.1, 0.6);
        const candleMaterial = new THREE.MeshLambertMaterial({ color: 0xF5F5DC });
        const candle = new THREE.Mesh(candleGeometry, candleMaterial);
        candle.position.set(5, 1.9, 0);
        houseGroup.add(candle);
        
        // Candle flame (bigger)
        const flameGeometry = new THREE.SphereGeometry(0.16);
        const flameMaterial = new THREE.MeshLambertMaterial({ 
            color: 0xFFD700,
            emissive: 0xFFD700,
            emissiveIntensity: 0.5
        });
        const flame = new THREE.Mesh(flameGeometry, flameMaterial);
        flame.position.set(5, 2.3, 0);
        houseGroup.add(flame);
        
        // Add candle light (stronger)
        const candleLight = new THREE.PointLight(0xFFD700, 0.6, 4);
        candleLight.position.set(5, 2.3, 0);
        houseGroup.add(candleLight);
        
        // More books on table (bigger)
        const bookGeometry = new THREE.BoxGeometry(0.6, 0.1, 0.4);
        const bookMaterial = new THREE.MeshLambertMaterial({ color: 0x8B4513 });
        
        for (let i = 0; i < 5; i++) {
            const book = new THREE.Mesh(bookGeometry, bookMaterial);
            book.position.set(5 + (i - 2) * 0.3, 1.95, 0.4);
            book.rotation.z = Math.random() * 0.2 - 0.1;
            houseGroup.add(book);
        }
        
        // Large rug on floor (bigger)
        const rugGeometry = new THREE.PlaneGeometry(6, 4);
        const rugMaterial = new THREE.MeshLambertMaterial({ color: 0x8B0000 });
        const rug = new THREE.Mesh(rugGeometry, rugMaterial);
        rug.position.set(0, 0.22, 0);
        rug.rotation.x = -Math.PI / 2;
        houseGroup.add(rug);
        
        // Additional decorations
        // Chest in left room
        const chestGeometry = new THREE.BoxGeometry(1.5, 1, 1);
        const chestMaterial = new THREE.MeshLambertMaterial({ color: 0x8B4513 });
        const chest = new THREE.Mesh(chestGeometry, chestMaterial);
        chest.position.set(-5, 0.5, 3);
        chest.castShadow = true;
        chest.receiveShadow = true;
        houseGroup.add(chest);
        
        // Armor stand in right room
        const armorStandGeometry = new THREE.CylinderGeometry(0.2, 0.2, 2);
        const armorStandMaterial = new THREE.MeshLambertMaterial({ color: 0x696969 });
        const armorStand = new THREE.Mesh(armorStandGeometry, armorStandMaterial);
        armorStand.position.set(5, 1, 3);
        houseGroup.add(armorStand);
        
        // Armor helmet
        const helmetGeometry = new THREE.SphereGeometry(0.3);
        const helmetMaterial = new THREE.MeshLambertMaterial({ color: 0x696969 });
        const helmet = new THREE.Mesh(helmetGeometry, helmetMaterial);
        helmet.position.set(5, 2.2, 3);
        houseGroup.add(helmet);
    }

    createPalmTrees() {
        const palmPositions = [
            { x: -20, z: -20 },
            { x: 20, z: -20 },
            { x: -20, z: 20 },
            { x: 20, z: 20 }
        ];
        
        palmPositions.forEach(pos => {
            const palm = this.createPalmTree();
            palm.position.set(pos.x, 0, pos.z);
            this.scene.add(palm);
            this.decorations.push(palm);
        });
    }

    createPalmTree() {
        const group = new THREE.Group();
        
        // Egyptian Date Palm Trunk - more textured and realistic
        const trunkGeometry = new THREE.CylinderGeometry(0.4, 0.6, 8, 8);
        const trunkMaterial = new THREE.MeshLambertMaterial({ 
            color: 0x8B4513, // Saddle brown for desert palm
            roughness: 0.8
        });
        const trunk = new THREE.Mesh(trunkGeometry, trunkMaterial);
        trunk.position.y = 4;
        trunk.castShadow = true;
        trunk.receiveShadow = true;
        
        // Add trunk texture variation
        trunk.scale.set(1, 1, 1);
        group.add(trunk);
        
        // Create simplified palm fronds for better performance
        const frondCount = 8; // Reduced from 12
        const frondColors = [0x228B22, 0x32CD32, 0x006400]; // Different shades of green
        
        // Create multiple layers of fronds at different heights
        const frondLayers = [
            { height: 7.5, radius: 1.5, count: 8 },  // Top layer
            { height: 6.8, radius: 1.2, count: 6 },  // Middle layer
            { height: 6.1, radius: 0.9, count: 4 }   // Bottom layer
        ];
        
        frondLayers.forEach(layer => {
            for (let i = 0; i < layer.count; i++) {
                const frond = this.createSimplePalmFrond();
                const angle = (i / layer.count) * Math.PI * 2;
                
                frond.position.set(
                    Math.cos(angle) * layer.radius,
                    layer.height,
                    Math.sin(angle) * layer.radius
                );
                
                // More outward splay - adjust rotation to point fronds outward
                frond.rotation.y = angle;
                frond.rotation.x = Math.PI * 0.15; // Tilt fronds outward
                frond.rotation.z = (Math.random() - 0.5) * 0.4; // Slight random twist
                
                // Random color variation - apply to all meshes in the frond group
                const colorIndex = Math.floor(Math.random() * frondColors.length);
                frond.children.forEach(child => {
                    if (child.material) {
                        child.material.color.setHex(frondColors[colorIndex]);
                    }
                });
                
                group.add(frond);
            }
        });
        
        // Add date clusters (small brown spheres)
        const dateGeometry = new THREE.SphereGeometry(0.1, 6, 6);
        const dateMaterial = new THREE.MeshLambertMaterial({ color: 0x8B4513 });
        
        for (let i = 0; i < 6; i++) { // Reduced from 8
            const date = new THREE.Mesh(dateGeometry, dateMaterial);
            const angle = (i / 6) * Math.PI * 2;
            const radius = 0.6;
            
            date.position.set(
                Math.cos(angle) * radius,
                6.8,
                Math.sin(angle) * radius
            );
            
            group.add(date);
        }
        
        return group;
    }
    
    createSimplePalmFrond() {
        const group = new THREE.Group();
        
        // Main frond stem
        const stemGeometry = new THREE.CylinderGeometry(0.02, 0.05, 3, 6);
        const stemMaterial = new THREE.MeshLambertMaterial({ color: 0x228B22 });
        const stem = new THREE.Mesh(stemGeometry, stemMaterial);
        stem.position.y = 1.5;
        group.add(stem);
        
        // Create simplified leaf segments for better performance
        const leafSegments = 4; // Reduced from 8
        for (let i = 0; i < leafSegments; i++) {
            const segmentGeometry = new THREE.PlaneGeometry(0.8, 0.3, 1, 1);
            const segmentMaterial = new THREE.MeshLambertMaterial({ 
                color: 0x228B22,
                side: THREE.DoubleSide
            });
            const segment = new THREE.Mesh(segmentGeometry, segmentMaterial);
            
            segment.position.y = (i / leafSegments) * 2.5;
            segment.position.x = (i / leafSegments) * 0.2;
            segment.rotation.z = (i / leafSegments) * 0.3;
            
            group.add(segment);
        }
        
        return group;
    }

    createRocks() {
        // Use instanced meshes for better performance
        const rockGeometry = new THREE.DodecahedronGeometry(1.5);
        const rockMaterial = new THREE.MeshLambertMaterial({ color: 0x696969 });
        
        // Create instanced mesh for rocks
        const rockInstances = new THREE.InstancedMesh(rockGeometry, rockMaterial, 20);
        rockInstances.castShadow = true;
        rockInstances.receiveShadow = true;
        
        // Position instances
        for (let i = 0; i < 20; i++) {
            const matrix = new THREE.Matrix4();
            const x = (Math.random() - 0.5) * this.worldSize;
            const z = (Math.random() - 0.5) * this.worldSize;
            const y = 1.5;
            
            matrix.setPosition(x, y, z);
            matrix.scale(new THREE.Vector3(
                Math.random() * 0.5 + 0.75,
                Math.random() * 0.5 + 0.75,
                Math.random() * 0.5 + 0.75
            ));
            
            rockInstances.setMatrixAt(i, matrix);
        }
        
        this.scene.add(rockInstances);
        this.decorations.push(rockInstances);
    }

    createRock() {
        const geometry = new THREE.DodecahedronGeometry(Math.random() * 2 + 1);
        const material = new THREE.MeshLambertMaterial({ color: 0x696969 });
        const rock = new THREE.Mesh(geometry, material);
        rock.position.y = geometry.parameters.radius;
        rock.castShadow = true;
        rock.receiveShadow = true;
        
        // Random rotation
        rock.rotation.set(
            Math.random() * Math.PI,
            Math.random() * Math.PI,
            Math.random() * Math.PI
        );
        
        return rock;
    }

    createSandDunes() {
        for (let i = 0; i < 10; i++) {
            const dune = this.createSandDune();
            const x = (Math.random() - 0.5) * this.worldSize;
            const z = (Math.random() - 0.5) * this.worldSize;
            dune.position.set(x, 0, z);
            this.scene.add(dune);
            this.decorations.push(dune);
        }
    }

    createSandDune() {
        const geometry = new THREE.ConeGeometry(8, 4, 8);
        const material = new THREE.MeshLambertMaterial({ 
            color: 0xF4A460,
            transparent: true,
            opacity: 0.8
        });
        const dune = new THREE.Mesh(geometry, material);
        dune.position.y = 2;
        dune.castShadow = true;
        dune.receiveShadow = true;
        
        // Random rotation
        dune.rotation.y = Math.random() * Math.PI * 2;
        
        return dune;
    }

    createLighting() {
        // Day/Night cycle system
        this.dayNightCycle = {
            time: 0, // 0 = midnight, 0.5 = noon, 1 = midnight again
            cycleSpeed: 0.0001, // Much slower cycle for truly immersive day/night experience
            sun: null,
            moon: null,
            ambientLight: null,
            directionalLight: null,
            stars: []
        };
        
        // Create ambient light that changes with time of day
        this.dayNightCycle.ambientLight = new THREE.AmbientLight(0x404040, 0.4);
        this.scene.add(this.dayNightCycle.ambientLight);
        
        // Create directional light (sun)
        this.dayNightCycle.directionalLight = new THREE.DirectionalLight(0xFFFFFF, 1);
        this.dayNightCycle.directionalLight.position.set(50, 100, 50);
        this.dayNightCycle.directionalLight.castShadow = true;
        
        // REALISTIC: Shadow camera frustum with proper soft shadows
        this.dayNightCycle.directionalLight.shadow.mapSize.width = 2048; // Higher resolution for softer shadows
        this.dayNightCycle.directionalLight.shadow.mapSize.height = 2048;
        this.dayNightCycle.directionalLight.shadow.camera.near = 0.1;
        this.dayNightCycle.directionalLight.shadow.camera.far = 300;
        this.dayNightCycle.directionalLight.shadow.camera.left = -100;
        this.dayNightCycle.directionalLight.shadow.camera.right = 100;
        this.dayNightCycle.directionalLight.shadow.camera.top = 100;
        this.dayNightCycle.directionalLight.shadow.camera.bottom = -100;
        
        // REALISTIC shadow settings for natural softness
        this.dayNightCycle.directionalLight.shadow.bias = -0.0001; // Very small bias to prevent shadow acne
        this.dayNightCycle.directionalLight.shadow.normalBias = 0.02; // Normal bias for better contact shadows
        this.dayNightCycle.directionalLight.shadow.radius = 2.0; // Soft shadow radius (makes shadows blurry/soft)
        
        // Enable shadow camera auto-update
        this.dayNightCycle.directionalLight.shadow.camera.updateProjectionMatrix();
        this.dayNightCycle.directionalLight.shadow.autoUpdate = true;
        
        this.scene.add(this.dayNightCycle.directionalLight);
        
        // Create sun mesh (visual only, no light emission)
        const sunGeometry = new THREE.SphereGeometry(10, 16, 16);
        const sunMaterial = new THREE.MeshBasicMaterial({ 
            color: 0xFFD700
        });
        this.dayNightCycle.sun = new THREE.Mesh(sunGeometry, sunMaterial);
        this.dayNightCycle.sun.castShadow = false;
        this.dayNightCycle.sun.receiveShadow = false;
        this.scene.add(this.dayNightCycle.sun);
        
        // Create moon mesh (visual only, no light emission)
        const moonGeometry = new THREE.SphereGeometry(8, 16, 16);
        const moonMaterial = new THREE.MeshBasicMaterial({ 
            color: 0xE6E6FA
        });
        this.dayNightCycle.moon = new THREE.Mesh(moonGeometry, moonMaterial);
        this.dayNightCycle.moon.castShadow = false;
        this.dayNightCycle.moon.receiveShadow = false;
        this.scene.add(this.dayNightCycle.moon);
        
        // Create sky gradient
        this.createSkyGradient();
        
        // Create stars
        this.createStars();
        
        // Create torch for atmospheric lighting
        this.createTorch();
        
        // Set initial time to morning (around 8 AM) - higher in sky
        this.dayNightCycle.time = 0.35; // Slightly later morning for better initial position
        this.updateDayNightCycle();
    }
    
    createSkyGradient() {
        // Create a sky dome with gradient
        const skyGeometry = new THREE.SphereGeometry(500, 32, 32);
        const skyMaterial = new THREE.ShaderMaterial({
            uniforms: {
                time: { value: 0.0 },
                topColor: { value: new THREE.Color(0x87CEEB) }, // Sky blue
                bottomColor: { value: new THREE.Color(0xE0F6FF) }, // Light blue
                offset: { value: 33 },
                exponent: { value: 0.6 }
            },
            vertexShader: `
                varying vec3 vWorldPosition;
                void main() {
                    vec4 worldPosition = modelMatrix * vec4(position, 1.0);
                    vWorldPosition = worldPosition.xyz;
                    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
                }
            `,
            fragmentShader: `
                uniform vec3 topColor;
                uniform vec3 bottomColor;
                uniform float offset;
                uniform float exponent;
                varying vec3 vWorldPosition;
                void main() {
                    float h = normalize(vWorldPosition + offset).y;
                    gl_FragColor = vec4(mix(bottomColor, topColor, max(pow(max(h, 0.0), exponent), 0.0)), 1.0);
                }
            `,
            side: THREE.BackSide
        });
        
        this.skyDome = new THREE.Mesh(skyGeometry, skyMaterial);
        this.scene.add(this.skyDome);
    }
    
    updateDayNightCycle() {
        const time = this.dayNightCycle.time;
        
        // Calculate sun and moon positions
        const sunAngle = time * Math.PI * 2;
        const moonAngle = (time + 0.5) * Math.PI * 2; // Moon is opposite to sun
        
        // Sun position (rises in east, sets in west) - MUCH higher and further
        const sunHeight = Math.sin(sunAngle) * 300 + 400; // 100-700 units high
        const sunDistance = Math.cos(sunAngle) * 800; // ±800 units east/west
        this.dayNightCycle.sun.position.set(sunDistance, sunHeight, 0);
        
        // SIMPLIFIED: Light positioning is now handled in updateShadowCamera()
        // Just update the sun visual position for the sky
        if (this.dayNightCycle.directionalLight && this.camera) {
            // Debug: Log sun position occasionally
            if (Math.random() < 0.02) { // 2% chance each frame
                console.log(`🌞 Sun visual at: (${sunDistance.toFixed(1)}, ${sunHeight.toFixed(1)}) | Time: ${(time * 24).toFixed(1)}h | Light intensity: ${this.dayNightCycle.directionalLight.intensity.toFixed(1)}`);
            }
        }
        
        // Moon position - also much higher and further
        const moonHeight = Math.sin(moonAngle) * 200 + 300; // 100-500 units high
        const moonDistance = Math.cos(moonAngle) * 600; // ±600 units east/west
        this.dayNightCycle.moon.position.set(moonDistance, moonHeight, 0);
        
        // Update lighting based on time - REALISTIC lighting with natural shadow softness
        if (time > 0.25 && time < 0.75) {
            // Day time (6 AM - 6 PM) - Natural lighting with soft shadows
            this.dayNightCycle.directionalLight.intensity = 2.0; // Slightly reduced for softer shadows
            this.dayNightCycle.ambientLight.intensity = 0.8; // Higher ambient for natural shadow softness
            
            // Update sky colors for day
            this.updateSkyColors(0x87CEEB, 0xE0F6FF, 0xFFFFFF);
        } else {
            // Night time (6 PM - 6 AM) - Still bright enough for shadows
            this.dayNightCycle.directionalLight.intensity = 1.5; // Bright enough for night shadows
            this.dayNightCycle.ambientLight.intensity = 0.3; // Good night ambient
            
            // Update sky colors for night
            this.updateSkyColors(0x0B1426, 0x1a1a2e, 0x16213e);
        }
        
        // Update sun and moon visibility
        this.dayNightCycle.sun.visible = time > 0.25 && time < 0.75;
        this.dayNightCycle.moon.visible = time <= 0.25 || time >= 0.75;
        
        // Update sun color based on time (golden hour effects)
        if (time > 0.4 && time < 0.6) {
            // Midday - bright white
            this.dayNightCycle.sun.material.color.setHex(0xFFFFFF);
        } else if (time > 0.25 && time < 0.4) {
            // Morning - golden
            this.dayNightCycle.sun.material.color.setHex(0xFFD700);
        } else if (time > 0.6 && time < 0.75) {
            // Evening - orange/red
            this.dayNightCycle.sun.material.color.setHex(0xFF6B35);
        }
    }
    
    updateSkyColors(topColor, bottomColor, horizonColor) {
        if (this.skyDome && this.skyDome.material.uniforms) {
            this.skyDome.material.uniforms.topColor.value.setHex(topColor);
            this.skyDome.material.uniforms.bottomColor.value.setHex(bottomColor);
        }
    }
    
    createStars() {
        // Create a field of stars for the night sky
        const starGeometry = new THREE.SphereGeometry(0.5, 8, 8);
        const starMaterial = new THREE.MeshBasicMaterial({ 
            color: 0xFFFFFF
        });
        
        // Create minimal stars for performance (reduced from 200 to 50)
        for (let i = 0; i < 50; i++) {
            const star = new THREE.Mesh(starGeometry, starMaterial);
            
            // Random position on a sphere
            const phi = Math.acos(-1 + (2 * Math.random()));
            const theta = Math.sqrt(1 - Math.pow(-1 + (2 * Math.random()), 2)) * (2 * Math.PI);
            
            const radius = 400 + Math.random() * 100; // Between 400-500 units from center
            star.position.set(
                radius * Math.sin(phi) * Math.cos(theta),
                radius * Math.cos(phi),
                radius * Math.sin(phi) * Math.sin(theta)
            );
            
            // Random star brightness
            star.material.opacity = 0.5 + Math.random() * 0.5;
            star.material.transparent = true;
            
            this.dayNightCycle.stars.push(star);
            this.scene.add(star);
        }
    }
    
    createTorch() {
        // Create torch group
        this.torch = new THREE.Group();
        
        // Torch handle (wooden stick)
        const handleGeometry = new THREE.CylinderGeometry(0.1, 0.1, 2, 8);
        const handleMaterial = new THREE.MeshLambertMaterial({ color: 0x8B4513 }); // Brown wood
        const handle = new THREE.Mesh(handleGeometry, handleMaterial);
        handle.position.y = 1;
        handle.castShadow = true;
        handle.receiveShadow = true;
        this.torch.add(handle);
        
        // Torch head (flame base)
        const headGeometry = new THREE.ConeGeometry(0.3, 0.5, 8);
        const headMaterial = new THREE.MeshLambertMaterial({ color: 0x654321 }); // Dark brown
        const head = new THREE.Mesh(headGeometry, headMaterial);
        head.position.y = 2.25;
        head.castShadow = true;
        head.receiveShadow = true;
        this.torch.add(head);
        
        // Flame (emissive material for glow effect)
        const flameGeometry = new THREE.ConeGeometry(0.2, 0.8, 8);
        const flameMaterial = new THREE.MeshBasicMaterial({ 
            color: 0xFF4500, // Orange-red flame
            transparent: true,
            opacity: 0.8
        });
        this.flame = new THREE.Mesh(flameGeometry, flameMaterial);
        this.flame.position.y = 2.6;
        this.flame.castShadow = false; // Flame doesn't cast shadows
        this.flame.receiveShadow = false;
        this.torch.add(this.flame);
        
        // Torch light (point light for realistic lighting)
        this.torchLight = new THREE.PointLight(0xFF6B35, 1.5, 15, 2); // Orange light, 15 units range, 2 decay
        this.torchLight.position.set(0, 2.5, 0);
        this.torchLight.castShadow = true;
        this.torchLight.shadow.mapSize.width = 512;
        this.torchLight.shadow.mapSize.height = 512;
        this.torchLight.shadow.camera.near = 0.1;
        this.torchLight.shadow.camera.far = 20;
        this.torchLight.shadow.camera.fov = 90;
        this.torchLight.shadow.bias = -0.001;
        this.torchLight.shadow.radius = 1.0; // Soft shadows
        this.torch.add(this.torchLight);
        
        // Position torch in the world (near a temple for atmosphere)
        this.torch.position.set(60, 0, 60); // Near Temple 1
        this.torch.rotation.y = Math.PI / 4; // Face outward
        
        this.scene.add(this.torch);
        
        // Store torch reference for animation
        this.torchElements = {
            flame: this.flame,
            light: this.torchLight
        };
        
        console.log('🔥 Torch created and placed in the world');
    }
    
    updateStarsVisibility() {
        const time = this.dayNightCycle.time;
        const isNight = time <= 0.25 || time >= 0.75;
        
        // Show stars only at night
        this.dayNightCycle.stars.forEach(star => {
            star.visible = isNight;
            
            // Add twinkling effect
            if (isNight) {
                const twinkle = Math.sin(Date.now() * 0.001 + star.position.x * 0.01) * 0.3 + 0.7;
                star.material.opacity = twinkle;
            }
        });
    }

    // World update methods
    update(deltaTime) {
        // Update day/night cycle
        this.updateDayNightCycleProgress(deltaTime);
        
        // Update any animated world elements
        this.updateDecorations(deltaTime);
        
        // Performance optimizations (less frequent to reduce FPS spikes)
        if (this.camera) {
            // Add frame counter for performance optimizations
            if (!this.frameCount) this.frameCount = 0;
            this.frameCount++;
            
            // Update frustum and culling less frequently
            if (this.frameCount % 10 === 0) { // Every 10 frames instead of every 3 frames
                this.updateFrustum();
                this.updateObjectVisibility();
                this.updateLOD(this.camera.position);
            }
            
            // Safety check - ensure objects close to player are always visible
            if (this.frameCount % 5 === 0) { // Every 5 frames
                this.ensureCloseObjectsVisible();
            }
            
                    // Update shadows every frame to ensure they move with the sun
        this.updateShadowCamera();
        
        // Debug shadow camera position occasionally
        if (this.frameCount % 300 === 0) { // Every 5 seconds
            const shadowCamera = this.dayNightCycle.directionalLight.shadow.camera;
            console.log(`📷 Shadow Camera - Pos: (${shadowCamera.position.x.toFixed(1)}, ${shadowCamera.position.y.toFixed(1)}, ${shadowCamera.position.z.toFixed(1)}) | Looking at: (${this.dayNightCycle.directionalLight.target.position.x.toFixed(1)}, ${this.dayNightCycle.directionalLight.target.position.y.toFixed(1)}, ${this.dayNightCycle.directionalLight.target.position.z.toFixed(1)})`);
        }
            
                    // Debug: Log when day/night cycle is running
        if (this.frameCount % 60 === 0) { // Every 60 frames (about once per second)
            console.log(`🌍 World update - Time: ${(this.dayNightCycle.time * 24).toFixed(1)}h | Camera set: ${!!this.camera} | Light: ${!!this.dayNightCycle.directionalLight}`);
            
            // Debug lights every 10 seconds to find duplicates
            if (this.frameCount % 600 === 0) {
                this.debugLights();
            }
            
            // Also check for any default scene lights that might have been added
            if (this.frameCount === 1) { // Only once at the start
                this.checkForDefaultLights();
            }
            
            // Periodic object health monitoring (every 5 minutes)
            if (this.frameCount % 1800 === 0) {
                this.monitorObjectHealth();
            }
            
            // Object visibility check (every 2 minutes)
            if (this.frameCount % 720 === 0) {
                this.debugObjectVisibility();
            }
            
            // Comprehensive world integrity check (every 10 minutes)
            if (this.frameCount % 3600 === 0) {
                this.validateWorldIntegrity();
            }
        }
        } else {
            // Debug: Log when camera is not set
            if (!this.frameCount || this.frameCount % 120 === 0) { // Every 120 frames
                console.log(`🌍 World update - Camera not set in WorldManager`);
            }
        }
    }
    
    updateDayNightCycleProgress(deltaTime) {
        // Progress the day/night cycle
        this.dayNightCycle.time += this.dayNightCycle.cycleSpeed * deltaTime * 60;
        
        // Wrap around when we reach a full cycle
        if (this.dayNightCycle.time >= 1.0) {
            this.dayNightCycle.time = 0.0;
        }
        
        // Update the lighting and sky
        this.updateDayNightCycle();
        
        // Add some atmospheric effects
        this.updateAtmosphericEffects();
        
        // Notify UI of time change
        if (this.uiManager) {
            this.uiManager.updateTimeDisplay(this.dayNightCycle.time);
        }
    }
    
    updateAtmosphericEffects() {
        const time = this.dayNightCycle.time;
        
        // Add fog effects during dawn/dusk
        if ((time > 0.2 && time < 0.3) || (time > 0.7 && time < 0.8)) {
            // Dawn or dusk - add some atmospheric fog
            if (!this.scene.fog) {
                this.scene.fog = new THREE.Fog(0xE6E6FA, 100, 300);
            }
            this.scene.fog.color.setHex(0xE6E6FA);
        } else if (time > 0.25 && time < 0.75) {
            // Clear day - remove fog
            if (this.scene.fog) {
                this.scene.fog = null;
            }
        } else {
            // Night - add dark fog
            if (!this.scene.fog) {
                this.scene.fog = new THREE.Fog(0x0B1426, 50, 200);
            }
            this.scene.fog.color.setHex(0x0B1426);
        }
        
        // Update terrain colors based on time
        this.updateTerrainColors(time);
        
        // Update star visibility
        this.updateStarsVisibility();
    }
    
    updateShadowCamera() {
        if (!this.dayNightCycle.directionalLight || !this.camera) return;
        
        // PROPER SUN-FOLLOWING SHADOWS: Light follows sun position, shadows point away from sun
        
        const playerPos = this.camera.position;
        const time = this.dayNightCycle.time;
        
        // Calculate sun angle (0 = midnight, 0.5 = noon, 1 = midnight)
        const sunAngle = time * Math.PI * 2;
        
        // Sun rises in east (0), sets in west (0.5), rises again (1)
        // Position light at sun's actual location relative to player
        const sunDistance = Math.cos(sunAngle) * 200; // ±200 units east/west
        const sunHeight = Math.sin(sunAngle) * 100 + 100; // 0-200 units high
        
        // Light position follows sun
        const lightX = playerPos.x + sunDistance;
        const lightZ = playerPos.z; // Same Z as player (sun moves east-west)
        const lightY = sunHeight;
        
        this.dayNightCycle.directionalLight.position.set(lightX, lightY, lightZ);
        
        // CRITICAL: Light target is OPPOSITE direction from sun (shadows point away from sun)
        // When sun is east (morning), shadows point west
        // When sun is west (evening), shadows point east
        const shadowTargetX = playerPos.x - sunDistance; // Opposite from sun
        const shadowTargetZ = playerPos.z; // Same Z as player
        const shadowTargetY = 0; // Ground level
        
        this.dayNightCycle.directionalLight.target.position.set(shadowTargetX, shadowTargetY, shadowTargetZ);
        
        // Force updates
        this.dayNightCycle.directionalLight.target.updateMatrixWorld(true);
        this.dayNightCycle.directionalLight.shadow.needsUpdate = true;
        
        // Debug: Log proper shadow system occasionally
        if (this.frameCount % 600 === 0) { // Every 10 seconds
            console.log(`🌞 PROPER Shadow System - Sun at (${sunDistance.toFixed(1)}, ${sunHeight.toFixed(1)}) | Time: ${(time * 24).toFixed(1)}h`);
            console.log(`🔍 Light pos: (${lightX.toFixed(1)}, ${lightY.toFixed(1)}, ${lightZ.toFixed(1)}) | Target: (${shadowTargetX.toFixed(1)}, 0, ${shadowTargetZ.toFixed(1)})`);
        }
    }
    
    updateTerrainColors(time) {
        if (this.terrain) {
            const material = this.terrain.material;
            
            if (time > 0.25 && time < 0.75) {
                // Day - bright sandy colors
                material.color.setHex(0x8B4513);
            } else if (time > 0.4 && time < 0.6) {
                // Midday - brightest
                material.color.setHex(0xD2B48C);
            } else if ((time > 0.25 && time < 0.4) || (time > 0.6 && time < 0.75)) {
                // Morning/Evening - golden
                material.color.setHex(0xCD853F);
            } else {
                // Night - darker
                material.color.setHex(0x654321);
            }
        }
    }

    updateDecorations(deltaTime) {
        // Add some subtle animations to decorations
        // Note: Since decorations is an array, we can't easily identify types by key
        // For now, we'll disable animations to prevent floating objects
        // In the future, we could add type information to enable specific animations
        
        // Animate torch flame and light
        this.updateTorchAnimation(deltaTime);
    }
    
    updateTorchAnimation(deltaTime) {
        if (!this.torchElements) return;
        
        const time = Date.now() * 0.003; // Animation speed
        
        // Flickering flame effect
        const flicker = Math.sin(time * 8) * 0.1 + Math.sin(time * 15) * 0.05 + 0.95;
        this.torchElements.flame.scale.setScalar(flicker);
        
        // Gentle flame swaying
        this.torchElements.flame.rotation.z = Math.sin(time * 3) * 0.1;
        
        // Dynamic light intensity (flickering)
        const lightFlicker = Math.sin(time * 6) * 0.2 + Math.sin(time * 12) * 0.1 + 0.9;
        this.torchElements.light.intensity = 1.5 * lightFlicker;
        
        // Subtle light color variation
        const colorVariation = Math.sin(time * 4) * 0.1;
        this.torchElements.light.color.setRGB(
            1.0, // Red
            0.42 + colorVariation, // Green (varies slightly)
            0.21 + colorVariation * 0.5 // Blue (varies less)
        );
    }

    // Utility methods
    getWorldSize() {
        return this.worldSize;
    }

    getChunkSize() {
        return this.chunkSize;
    }

    getResourceNodes() {
        return Array.from(this.resourceNodes.values());
    }

    getLandmarks() {
        return [
            ...this.pyramids,
            ...this.temples,
            ...this.sphinxes,
            ...this.obelisks
        ];
    }

    // Cleanup
    destroy() {
        // Remove all world objects
        this.scene.remove(this.terrain);
        
        this.buildings.forEach(building => {
            this.scene.remove(building);
        });
        
        this.resourceNodes.forEach(node => {
            this.scene.remove(node);
        });
        
        this.npcs.forEach(npc => {
            this.scene.remove(npc);
        });
        
        this.decorations.forEach(decoration => {
            this.scene.remove(decoration);
        });
        
        this.pyramids.forEach(pyramid => {
            this.scene.remove(pyramid);
        });
        
        this.temples.forEach(temple => {
            this.scene.remove(temple);
        });
        
        this.sphinxes.forEach(sphinx => {
            this.scene.remove(sphinx);
        });
        
        this.obelisks.forEach(obelisk => {
            this.scene.remove(obelisk);
        });
        
        // Remove torch
        if (this.torch) {
            this.scene.remove(this.torch);
        }
        
        console.log('🌍 World Manager destroyed');
    }
    
    // Performance optimization methods
    setCamera(camera) {
        console.log('🌍 Camera set in WorldManager:', camera ? 'YES' : 'NO');
        this.camera = camera;
        this.updateFrustum();
        
        // Debug all lights immediately to see what's in the scene
        console.log('🔍 Checking all lights after camera set:');
        this.debugLights();
    }
    
    updateFrustum() {
        if (!this.camera) return;
        
        // Update frustum for culling
        this.frustum.setFromProjectionMatrix(
            new THREE.Matrix4().multiplyMatrices(
                this.camera.projectionMatrix,
                this.camera.matrixWorldInverse
            )
        );
    }
    
    isObjectVisible(object) {
        if (!this.frustum || !object.geometry) return true;
        
        // Simple bounding sphere test
        const boundingSphere = object.geometry.boundingSphere;
        if (!boundingSphere) {
            // Create bounding sphere if it doesn't exist
            object.geometry.computeBoundingSphere();
        }
        
        return this.frustum.intersectsSphere(object.geometry.boundingSphere);
    }
    
    updateObjectVisibility() {
        if (!this.camera) return;
        
        // Simplified visibility system - only optimize detail, never hide objects
        // This prevents the frustrating issue of objects disappearing when close to the player
        this.optimizeObjectVisibility();
    }
    
    updateStructureVisibility(structures) {
        // Simplified - don't hide objects based on frustum, only optimize detail
        structures.forEach(structure => {
            if (structure) {
                // Always keep objects visible
                structure.visible = true;
                    this.visibleObjects.add(structure);
            }
        });
    }
    
    // Level of Detail (LOD) system
    updateLOD(cameraPosition) {
        this.pyramids.forEach(pyramid => {
            const distance = cameraPosition.distanceTo(pyramid.position);
            this.applyLOD(pyramid, distance);
        });
        
        this.temples.forEach(temple => {
            const distance = cameraPosition.distanceTo(temple.position);
            this.applyLOD(temple, distance);
        });
        
        this.sphinxes.forEach(sphinx => {
            const distance = cameraPosition.distanceTo(sphinx.position);
            this.applyLOD(sphinx, distance);
        });
    }
    
    applyLOD(object, distance) {
        // Simplified LOD - only reduce detail for very distant objects
        // This prevents the frustrating issue of objects losing detail when close to the player
        if (distance > 300) {
            // Low LOD - reduce detail only for very distant objects
            if (object.geometry && object.geometry.attributes.position.count > 200) {
                object.geometry.setDrawRange(0, 200);
            }
        } else if (distance > 150) {
            // Medium LOD - moderate detail reduction
            if (object.geometry && object.geometry.attributes.position.count > 300) {
                object.geometry.setDrawRange(0, 300);
            }
        } else {
            // High LOD - full detail for close objects
            if (object.geometry) {
                object.geometry.setDrawRange(0, object.geometry.attributes.position.count);
            }
        }
    }
    
    // Performance optimization methods
    setShadowDistance(distance) {
        // Disable shadows on objects beyond the specified distance
        if (this.camera) {
            const cameraPos = this.camera.position;
            
            // Update pyramids
            this.pyramids.forEach(pyramid => {
                const dist = cameraPos.distanceTo(pyramid.position);
                pyramid.castShadow = dist < distance;
                pyramid.receiveShadow = dist < distance;
            });
            
            // Update temples
            this.temples.forEach(temple => {
                const dist = cameraPos.distanceTo(temple.position);
                temple.castShadow = dist < distance;
                temple.receiveShadow = dist < distance;
            });
            
            // Update sphinxes
            this.sphinxes.forEach(sphinx => {
                const dist = cameraPos.distanceTo(sphinx.position);
                sphinx.castShadow = dist < distance;
                sphinx.receiveShadow = dist < distance;
            });
            
            // Update obelisks
            this.obelisks.forEach(obelisk => {
                const dist = cameraPos.distanceTo(obelisk.position);
                obelisk.castShadow = dist < distance;
                obelisk.receiveShadow = dist < distance;
            });
        }
    }
    
    // Check for any default lights that Three.js might have added
    checkForDefaultLights() {
        console.log('🔍 Checking for default Three.js lights...');
        
        // Check if the scene has any default lighting
        if (this.scene.children.length > 0) {
            let hasDefaultLight = false;
            this.scene.children.forEach((child, index) => {
                if (child.isLight && child !== this.dayNightCycle.directionalLight && child !== this.dayNightCycle.ambientLight) {
                    console.log(`⚠️ Found default light at index ${index}:`, child.type);
                    hasDefaultLight = true;
                    
                    // Remove any default lights
                    console.log(`🔧 Removing default light: ${child.type}`);
                    this.scene.remove(child);
                }
            });
            
            if (!hasDefaultLight) {
                console.log('✅ No default lights found');
            }
        }
    }
    
    // System setters
    setUIManager(uiManager) {
        this.uiManager = uiManager;
    }
    
    // Debug method to find all lights in the scene
    debugLights() {
        console.log('🔍 Debugging all lights in scene:');
        let lightCount = 0;
        
        this.scene.traverse((object) => {
            if (object.isLight) {
                lightCount++;
                console.log(`  Light ${lightCount}: ${object.type} at (${object.position.x.toFixed(1)}, ${object.position.y.toFixed(1)}, ${object.position.z.toFixed(1)})`);
                console.log(`    - Intensity: ${object.intensity}`);
                console.log(`    - Casts shadows: ${object.castShadow}`);
                console.log(`    - Name: ${object.name || 'unnamed'}`);
                
                if (object === this.dayNightCycle.directionalLight) {
                    console.log(`    - ✅ This is the day/night cycle light`);
                } else if (object === this.dayNightCycle.ambientLight) {
                    console.log(`    - ✅ This is the day/night cycle ambient light`);
                } else if (object.isPlayerTorchLight) {
                    console.log(`    - 🔥 This is the player's equipped torch light`);
                } else {
                    console.log(`    - ℹ️ Additional light source`);
                }
            }
        });
        
        console.log(`Total lights found: ${lightCount}`);
    }
    
    // Enhanced resource cleanup and object management
    cleanupUnusedResources() {
        console.log('🌍 Starting WorldManager resource cleanup...');
        
        // Track objects before cleanup
        const beforePyramids = this.pyramids.length;
        const beforeTemples = this.temples.length;
        const beforeSphinxes = this.sphinxes.length;
        const beforeObelisks = this.obelisks.length;
        const beforeResources = this.resourceNodes.length;
        const beforeDecorations = this.decorations.length;
        
        // Clean up any objects that might have been corrupted
        this.cleanupCorruptedObjects();
        
        // Optimize object visibility based on camera position
        this.optimizeObjectVisibility();
        
        // Log cleanup results
        console.log(`🌍 Cleanup completed:`);
        console.log(`  - Pyramids: ${beforePyramids} → ${this.pyramids.length}`);
        console.log(`  - Temples: ${beforeTemples} → ${this.temples.length}`);
        console.log(`  - Sphinxes: ${beforeSphinxes} → ${this.sphinxes.length}`);
        console.log(`  - Obelisks: ${beforeObelisks} → ${this.obelisks.length}`);
        console.log(`  - Resources: ${beforeResources} → ${this.resourceNodes.length}`);
        console.log(`  - Decorations: ${beforeDecorations} → ${this.decorations.length}`);
    }
    
    cleanupCorruptedObjects() {
        // Remove any objects with invalid properties that could cause them to disappear
        const objectsToRemove = [];
        
        // Check pyramids
        this.pyramids.forEach((pyramid, index) => {
            if (this.isObjectCorrupted(pyramid)) {
                console.warn('⚠️ Corrupted pyramid detected, removing:', pyramid);
                objectsToRemove.push({ object: pyramid, type: 'pyramid', index });
            }
        });
        
        // Check temples
        this.temples.forEach((temple, index) => {
            if (this.isObjectCorrupted(temple)) {
                console.warn('⚠️ Corrupted temple detected, removing:', temple);
                objectsToRemove.push({ object: temple, type: 'temple', index });
            }
        });
        
        // Check sphinxes
        this.sphinxes.forEach((sphinx, index) => {
            if (this.isObjectCorrupted(sphinx)) {
                console.warn('⚠️ Corrupted sphinx detected, removing:', sphinx);
                objectsToRemove.push({ object: sphinx, type: 'sphinx', index });
            }
        });
        
        // Check obelisks
        this.obelisks.forEach((obelisk, index) => {
            if (this.isObjectCorrupted(obelisk)) {
                console.warn('⚠️ Corrupted obelisk detected, removing:', obelisk);
                objectsToRemove.push({ object: obelisk, type: 'obelisk', index });
            }
        });
        
        // Check resource nodes
        this.resourceNodes.forEach((resource, index) => {
            if (this.isObjectCorrupted(resource)) {
                console.warn('⚠️ Corrupted resource node detected, removing:', resource);
                objectsToRemove.push({ object: resource, type: 'resource', index });
            }
        });
        
        // Check decorations
        this.decorations.forEach((decoration, index) => {
            if (this.isObjectCorrupted(decoration)) {
                console.warn('⚠️ Corrupted decoration detected, removing:', decoration);
                objectsToRemove.push({ object: decoration, type: 'decoration', index });
            }
        });
        
        // Remove corrupted objects
        objectsToRemove.forEach(({ object, type, index }) => {
            this.removeObjectSafely(object, type, index);
        });
        
        if (objectsToRemove.length > 0) {
            console.log(`🔧 Removed ${objectsToRemove.length} corrupted objects`);
        }
    }
    
    isObjectCorrupted(object) {
        if (!object || !object.isObject3D) return true;
        
        // Check for invalid position
        if (object.position && (
            isNaN(object.position.x) || 
            isNaN(object.position.y) || 
            isNaN(object.position.z) ||
            !isFinite(object.position.x) ||
            !isFinite(object.position.y) ||
            !isFinite(object.position.z)
        )) {
            return true;
        }
        
        // Check for invalid geometry
        if (object.geometry && !object.geometry.attributes) {
            return true;
        }
        
        // Check for invalid material
        if (object.material && !object.material.isMaterial) {
            return true;
        }
        
        // Check if object is too far from world bounds (might have drifted)
        if (object.position && (
            Math.abs(object.position.x) > this.worldSize * 2 ||
            Math.abs(object.position.z) > this.worldSize * 2 ||
            object.position.y < -100 || object.position.y > 1000
        )) {
            return true;
        }
        
        return false;
    }
    
    optimizeObjectVisibility() {
        if (!this.camera) return;
        
        const cameraPos = this.camera.position;
        const maxDistance = 300; // Increased from 200 - objects beyond this distance get optimized
        const fadeDistance = 200; // Increased from 150 - start fading detail at this distance
        const closeDistance = 50; // New: objects within this distance always have full detail
        
        // Optimize pyramids
        this.pyramids.forEach(pyramid => {
            const distance = cameraPos.distanceTo(pyramid.position);
            
            // NEVER hide objects - only optimize detail
            pyramid.visible = true;
            
            if (distance <= closeDistance) {
                // Full detail for very close objects
                if (pyramid.geometry && pyramid.geometry.attributes.position) {
                    pyramid.geometry.setDrawRange(0, pyramid.geometry.attributes.position.count);
                }
            } else if (distance > fadeDistance) {
                // Reduce detail for distant objects but keep them visible
                if (pyramid.geometry && pyramid.geometry.attributes.position) {
                    const detailLevel = distance > maxDistance ? 0.5 : 0.8; // Increased from 0.3/0.7
                    pyramid.geometry.setDrawRange(0, Math.floor(pyramid.geometry.attributes.position.count * detailLevel));
                }
            } else {
                // Full detail for close objects
                if (pyramid.geometry && pyramid.geometry.attributes.position) {
                    pyramid.geometry.setDrawRange(0, pyramid.geometry.attributes.position.count);
                }
            }
        });
        
        // Optimize temples
        this.temples.forEach(temple => {
            const distance = cameraPos.distanceTo(temple.position);
            temple.visible = true; // Always visible
            
            if (distance <= closeDistance) {
                if (temple.geometry && temple.geometry.attributes.position) {
                    temple.geometry.setDrawRange(0, temple.geometry.attributes.position.count);
                }
            } else if (distance > fadeDistance) {
                if (temple.geometry && temple.geometry.attributes.position) {
                    const detailLevel = distance > maxDistance ? 0.5 : 0.8;
                    temple.geometry.setDrawRange(0, Math.floor(temple.geometry.attributes.position.count * detailLevel));
                }
            } else {
                if (temple.geometry && temple.geometry.attributes.position) {
                    temple.geometry.setDrawRange(0, temple.geometry.attributes.position.count);
                }
            }
        });
        
        // Optimize sphinxes
        this.sphinxes.forEach(sphinx => {
            const distance = cameraPos.distanceTo(sphinx.position);
            sphinx.visible = true; // Always visible
            
            if (distance <= closeDistance) {
                if (sphinx.geometry && sphinx.geometry.attributes.position) {
                    sphinx.geometry.setDrawRange(0, sphinx.geometry.attributes.position.count);
                }
            } else if (distance > fadeDistance) {
                if (sphinx.geometry && sphinx.geometry.attributes.position) {
                    const detailLevel = distance > maxDistance ? 0.5 : 0.8;
                    sphinx.geometry.setDrawRange(0, Math.floor(sphinx.geometry.attributes.position.count * detailLevel));
                }
            } else {
                if (sphinx.geometry && sphinx.geometry.attributes.position) {
                    sphinx.geometry.setDrawRange(0, sphinx.geometry.attributes.position.count);
                }
            }
        });
        
        // Optimize obelisks
        this.obelisks.forEach(obelisk => {
            const distance = cameraPos.distanceTo(obelisk.position);
            obelisk.visible = true; // Always visible
            
            if (distance <= closeDistance) {
                if (obelisk.geometry && obelisk.geometry.attributes.position) {
                    obelisk.geometry.setDrawRange(0, obelisk.geometry.attributes.position.count);
                }
            } else if (distance > fadeDistance) {
                if (obelisk.geometry && obelisk.geometry.attributes.position) {
                    const detailLevel = distance > maxDistance ? 0.5 : 0.8;
                    obelisk.geometry.setDrawRange(0, Math.floor(obelisk.geometry.attributes.position.count * detailLevel));
                }
            } else {
                if (obelisk.geometry && obelisk.geometry.attributes.position) {
                    obelisk.geometry.setDrawRange(0, obelisk.geometry.attributes.position.count);
                }
            }
        });
        
        // Optimize resource nodes
        this.resourceNodes.forEach(resource => {
            const distance = cameraPos.distanceTo(resource.position);
            resource.visible = true; // Always visible
            
            if (distance <= closeDistance) {
                if (resource.geometry && resource.geometry.attributes.position) {
                    resource.geometry.setDrawRange(0, resource.geometry.attributes.position.count);
                }
            } else if (distance > fadeDistance) {
                if (resource.geometry && resource.geometry.attributes.position) {
                    const detailLevel = distance > maxDistance ? 0.5 : 0.8;
                    resource.geometry.setDrawRange(0, Math.floor(resource.geometry.attributes.position.count * detailLevel));
                }
            } else {
                if (resource.geometry && resource.geometry.attributes.position) {
                    resource.geometry.setDrawRange(0, resource.geometry.attributes.position.count);
                }
            }
        });
        
        // Optimize decorations
        this.decorations.forEach(decoration => {
            const distance = cameraPos.distanceTo(decoration.position);
            decoration.visible = true; // Always visible
            
            if (distance <= closeDistance) {
                if (decoration.geometry && decoration.geometry.attributes.position) {
                    decoration.geometry.setDrawRange(0, decoration.geometry.attributes.position.count);
                }
            } else if (distance > fadeDistance) {
                if (decoration.geometry && decoration.geometry.attributes.position) {
                    const detailLevel = distance > maxDistance ? 0.5 : 0.8;
                    decoration.geometry.setDrawRange(0, Math.floor(decoration.geometry.attributes.position.count * detailLevel));
                }
            } else {
                if (decoration.geometry && decoration.geometry.attributes.position) {
                    decoration.geometry.setDrawRange(0, decoration.geometry.attributes.position.count);
                }
            }
        });
    }
    
    // Object validation and health check
    validateWorldIntegrity() {
        console.log('🌍 Starting world integrity validation...');
        
        let totalObjects = 0;
        let validObjects = 0;
        let invalidObjects = 0;
        
        // Check all tracked objects
        const allObjects = [
            ...this.pyramids,
            ...this.temples,
            ...this.sphinxes,
            ...this.obelisks,
            ...this.resourceNodes,
            ...this.decorations
        ];
        
        allObjects.forEach((object, index) => {
            totalObjects++;
            if (this.isObjectCorrupted(object)) {
                invalidObjects++;
                console.warn(`⚠️ Invalid object at index ${index}:`, object);
            } else {
                validObjects++;
            }
        });
        
        // Check scene children
        if (this.scene) {
            this.scene.traverse((object) => {
                if (object && object.isObject3D && object !== this.terrain) {
                    totalObjects++;
                    if (this.isObjectCorrupted(object)) {
                        invalidObjects++;
                        console.warn(`⚠️ Invalid scene object:`, object);
                    } else {
                        validObjects++;
                    }
                }
            });
        }
        
        console.log(`🌍 World integrity check: ${validObjects} valid, ${invalidObjects} invalid out of ${totalObjects} total objects`);
        
        if (invalidObjects > 0) {
            console.warn(`⚠️ ${invalidObjects} invalid objects detected - running cleanup...`);
            this.cleanupCorruptedObjects();
        }
        
        return { total: totalObjects, valid: validObjects, invalid: invalidObjects };
    }
    
    // Debug object visibility and prevent disappearing
    debugObjectVisibility() {
        if (!this.camera) return;
        
        const cameraPos = this.camera.position;
        console.log('🔍 Debugging object visibility near camera:', cameraPos.toArray().map(v => v.toFixed(1)));
        
        let hiddenObjects = 0;
        let visibleObjects = 0;
        
        // Check pyramids
        this.pyramids.forEach((pyramid, index) => {
            const distance = cameraPos.distanceTo(pyramid.position);
            if (!pyramid.visible) {
                hiddenObjects++;
                console.warn(`⚠️ Hidden pyramid at index ${index}, distance: ${distance.toFixed(1)}`);
                // Force visibility
                pyramid.visible = true;
            } else {
                visibleObjects++;
            }
        });
        
        // Check temples
        this.temples.forEach((temple, index) => {
            const distance = cameraPos.distanceTo(temple.position);
            if (!temple.visible) {
                hiddenObjects++;
                console.warn(`⚠️ Hidden temple at index ${index}, distance: ${distance.toFixed(1)}`);
                // Force visibility
                temple.visible = true;
            } else {
                visibleObjects++;
            }
        });
        
        // Check sphinxes
        this.sphinxes.forEach((sphinx, index) => {
            const distance = cameraPos.distanceTo(sphinx.position);
            if (!sphinx.visible) {
                hiddenObjects++;
                console.warn(`⚠️ Hidden sphinx at index ${index}, distance: ${distance.toFixed(1)}`);
                // Force visibility
                sphinx.visible = true;
            } else {
                visibleObjects++;
            }
        });
        
        // Check obelisks
        this.obelisks.forEach((obelisk, index) => {
            const distance = cameraPos.distanceTo(obelisk.position);
            if (!obelisk.visible) {
                hiddenObjects++;
                console.warn(`⚠️ Hidden obelisk at index ${index}, distance: ${distance.toFixed(1)}`);
                // Force visibility
                obelisk.visible = true;
            } else {
                visibleObjects++;
            }
        });
        
        // Check resource nodes
        this.resourceNodes.forEach((resource, index) => {
            const distance = cameraPos.distanceTo(resource.position);
            if (!resource.visible) {
                hiddenObjects++;
                console.warn(`⚠️ Hidden resource at index ${index}, distance: ${distance.toFixed(1)}`);
                // Force visibility
                resource.visible = true;
            } else {
                visibleObjects++;
            }
        });
        
        // Check decorations
        this.decorations.forEach((decoration, index) => {
            const distance = cameraPos.distanceTo(decoration.position);
            if (!decoration.visible) {
                hiddenObjects++;
                console.warn(`⚠️ Hidden decoration at index ${index}, distance: ${distance.toFixed(1)}`);
                // Force visibility
                decoration.visible = true;
            } else {
                visibleObjects++;
            }
        });
        
        if (hiddenObjects > 0) {
            console.warn(`🔧 Fixed ${hiddenObjects} hidden objects, ${visibleObjects} were already visible`);
        } else {
            console.log(`✅ All objects are visible (${visibleObjects} total)`);
        }
        
        return { hidden: hiddenObjects, visible: visibleObjects };
    }
    
    // Force all objects to be visible (emergency fix)
    forceAllObjectsVisible() {
        console.log('🔧 Force making all objects visible...');
        
        this.pyramids.forEach(obj => obj.visible = true);
        this.temples.forEach(obj => obj.visible = true);
        this.sphinxes.forEach(obj => obj.visible = true);
        this.obelisks.forEach(obj => obj.visible = true);
        this.resourceNodes.forEach(obj => obj.visible = true);
        this.decorations.forEach(obj => obj.visible = true);
        
        console.log('✅ All objects forced to visible');
    }
    
    // Protect important objects from accidental removal
    protectImportantObjects() {
        // Mark terrain as protected
        if (this.terrain) {
            this.terrain.userData.protected = true;
            this.terrain.userData.critical = true;
        }
        
        // Mark day/night cycle lights as protected
        if (this.dayNightCycle) {
            if (this.dayNightCycle.ambientLight) {
                this.dayNightCycle.ambientLight.userData.protected = true;
                this.dayNightCycle.ambientLight.userData.critical = true;
            }
            if (this.dayNightCycle.directionalLight) {
                this.dayNightCycle.directionalLight.userData.protected = true;
                this.dayNightCycle.directionalLight.userData.critical = true;
            }
        }
        
        // Mark player torch light as protected
        if (this.torchLight) { // Changed from this.playerTorchLight to this.torchLight
            this.torchLight.userData.protected = true;
            this.torchLight.userData.critical = true;
        }
    }
    
    // Enhanced object removal that respects protected objects
    removeObjectSafely(object, type, index) {
        // Don't remove protected objects
        if (object.userData && object.userData.protected) {
            console.warn(`⚠️ Attempted to remove protected ${type}, skipping:`, object);
            return false;
        }
        
        try {
            // Remove from scene
            if (this.scene && object.parent) {
                this.scene.remove(object);
            }
            
            // Dispose of geometry and material
            if (object.geometry) {
                object.geometry.dispose();
            }
            if (object.material) {
                if (Array.isArray(object.material)) {
                    object.material.forEach(mat => mat.dispose());
                } else {
                    object.material.dispose();
                }
            }
            
            // Remove from tracking arrays
            switch (type) {
                case 'pyramid':
                    this.pyramids.splice(index, 1);
                    break;
                case 'temple':
                    this.temples.splice(index, 1);
                    break;
                case 'sphinx':
                    this.sphinxes.splice(index, 1);
                    break;
                case 'obelisk':
                    this.obelisks.splice(index, 1);
                    break;
                case 'resource':
                    this.resourceNodes.splice(index, 1);
                    break;
                case 'decoration':
                    this.decorations.splice(index, 1);
                    break;
            }
            
            console.log(`✅ Successfully removed corrupted ${type} at index ${index}`);
            return true;
        } catch (error) {
            console.error(`❌ Error removing corrupted ${type}:`, error);
            return false;
        }
    }
    
    // Monitor object health and prevent drift
    monitorObjectHealth() {
        const maxDriftDistance = this.worldSize * 0.1; // 10% of world size
        const center = new THREE.Vector3(0, 0, 0);
        
        // Check for objects that have drifted too far
        const driftedObjects = [];
        
        this.pyramids.forEach((pyramid, index) => {
            if (pyramid.position.distanceTo(center) > maxDriftDistance) {
                driftedObjects.push({ object: pyramid, type: 'pyramid', index, distance: pyramid.position.distanceTo(center) });
            }
        });
        
        this.temples.forEach((temple, index) => {
            if (temple.position.distanceTo(center) > maxDriftDistance) {
                driftedObjects.push({ object: temple, type: 'temple', index, distance: temple.position.distanceTo(center) });
            }
        });
        
        this.sphinxes.forEach((sphinx, index) => {
            if (sphinx.position.distanceTo(center) > maxDriftDistance) {
                driftedObjects.push({ object: sphinx, type: 'sphinx', index, distance: sphinx.position.distanceTo(center) });
            }
        });
        
        this.obelisks.forEach((obelisk, index) => {
            if (obelisk.position.distanceTo(center) > maxDriftDistance) {
                driftedObjects.push({ object: obelisk, type: 'obelisk', index, distance: obelisk.position.distanceTo(center) });
            }
        });
        
        // Log drifted objects
        if (driftedObjects.length > 0) {
            console.warn(`⚠️ ${driftedObjects.length} objects have drifted too far from center:`);
            driftedObjects.forEach(({ type, index, distance }) => {
                console.warn(`  - ${type} at index ${index}: ${distance.toFixed(1)} units from center`);
            });
        }
        
        return driftedObjects;
    }
    
    // Restore drifted objects to their original positions
    restoreDriftedObjects() {
        const driftedObjects = this.monitorObjectHealth();
        
        driftedObjects.forEach(({ object, type, index }) => {
            // Try to restore to a reasonable position
            const restoredPosition = this.getRestoredPosition(object, type);
            if (restoredPosition) {
                object.position.copy(restoredPosition);
                console.log(`✅ Restored ${type} at index ${index} to position:`, restoredPosition);
            }
        });
    }
    
    getRestoredPosition(object, type) {
        // Generate a reasonable position based on object type and world layout
        const worldRadius = this.worldSize / 2;
        
        switch (type) {
            case 'pyramid':
                return new THREE.Vector3(
                    (Math.random() - 0.5) * worldRadius * 0.8,
                    0,
                    (Math.random() - 0.5) * worldRadius * 0.8
                );
            case 'temple':
                return new THREE.Vector3(
                    (Math.random() - 0.5) * worldRadius * 0.6,
                    0,
                    (Math.random() - 0.5) * worldRadius * 0.6
                );
            case 'sphinx':
                return new THREE.Vector3(
                    (Math.random() - 0.5) * worldRadius * 0.7,
                    0,
                    (Math.random() - 0.5) * worldRadius * 0.7
                );
            case 'obelisk':
                return new THREE.Vector3(
                    (Math.random() - 0.5) * worldRadius * 0.5,
                    0,
                    (Math.random() - 0.5) * worldRadius * 0.5
                );
            default:
                return new THREE.Vector3(
                    (Math.random() - 0.5) * worldRadius * 0.4,
                    0,
                    (Math.random() - 0.5) * worldRadius * 0.4
                );
        }
    }

    // Safety check to ensure objects close to player are never hidden
    ensureCloseObjectsVisible() {
        if (!this.camera) return;
        
        const cameraPos = this.camera.position;
        const safetyDistance = 100; // Objects within this distance should always be visible
        
        const allObjects = [
            ...this.pyramids,
            ...this.temples,
            ...this.sphinxes,
            ...this.obelisks,
            ...this.resourceNodes,
            ...this.decorations
        ];
        
        let closeObjectsCount = 0;
        
        allObjects.forEach(object => {
            if (object && object.position) {
                const distance = cameraPos.distanceTo(object.position);
                if (distance <= safetyDistance) {
                    // Force visibility for close objects
                    object.visible = true;
                    closeObjectsCount++;
                    
                    // Ensure full detail for close objects
                    if (object.geometry && object.geometry.attributes.position) {
                        object.geometry.setDrawRange(0, object.geometry.attributes.position.count);
                    }
                }
            }
        });
        
        // Debug log occasionally
        if (closeObjectsCount > 0 && this.frameCount % 300 === 0) { // Every 5 seconds
            console.log(`🔒 Safety check: Ensuring ${closeObjectsCount} objects within ${safetyDistance}m are visible`);
        }
    }
}
