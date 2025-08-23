import * as THREE from 'three';

export class GridManager {
    constructor(scene, worldSize = 1000, gridSize = 2) { // Changed from 10 to 2 for player-sized cells
        this.scene = scene;
        this.worldSize = worldSize;
        this.gridSize = gridSize;
        this.gridCells = new Map(); // Store grid cell data
        this.visibleCells = new Set(); // Track visible grid cells
        this.highlightedCell = null; // Currently highlighted cell
        this.gridMesh = null; // Grid visualization mesh
        
        // Grid properties
        this.cellsX = Math.ceil(worldSize / gridSize);
        this.cellsZ = Math.ceil(worldSize / gridSize);
        this.totalCells = this.cellsX * this.cellsZ;
        
        // Grid cell states
        this.cellStates = {
            EMPTY: 'empty',
            WALKABLE: 'walkable',
            OBSTACLE: 'obstacle',
            WATER: 'water',
            BUILDING: 'building'
        };
        
        console.log(`🗺️ Grid Manager initialized: ${this.cellsX}x${this.cellsZ} cells (${this.totalCells} total) - ${gridSize}x${gridSize} units each`);
    }

    init() {
        console.log('🗺️ Initializing Grid Manager...');
        
        this.createGrid();
        this.initializeCellStates();
        this.createGridVisualization();
        
        console.log('✅ Grid Manager initialized');
    }

    createGrid() {
        // Create grid cell data structure
        for (let x = 0; x < this.cellsX; x++) {
            for (let z = 0; z < this.cellsZ; z++) {
                const cellKey = this.getCellKey(x, z);
                const worldX = (x * this.gridSize) - (this.worldSize / 2) + (this.gridSize / 2);
                const worldZ = (z * this.gridSize) - (this.worldSize / 2) + (this.gridSize / 2);
                
                this.gridCells.set(cellKey, {
                    x: x,
                    z: z,
                    worldX: worldX,
                    worldZ: worldZ,
                    center: new THREE.Vector3(worldX, 0, worldZ),
                    state: this.cellStates.WALKABLE,
                    occupied: false,
                    height: 0,
                    objects: []
                });
            }
        }
    }

    initializeCellStates() {
        // Set default cell states based on world layout
        this.gridCells.forEach((cell, key) => {
            // Mark edges as obstacles
            if (cell.x === 0 || cell.x === this.cellsX - 1 || 
                cell.z === 0 || cell.z === this.cellsZ - 1) {
                cell.state = this.cellStates.OBSTACLE;
            }
            
            // Mark center area as walkable
            const centerX = this.cellsX / 2;
            const centerZ = this.cellsZ / 2;
            const distanceFromCenter = Math.sqrt(
                Math.pow(cell.x - centerX, 2) + Math.pow(cell.z - centerZ, 2)
            );
            
            if (distanceFromCenter < 20) {
                cell.state = this.cellStates.WALKABLE;
            }
        });
    }

    createGridVisualization() {
        // Create a group for grid visualization
        this.gridMesh = new THREE.Group();
        this.scene.add(this.gridMesh);
        
        // Create grid lines (optional, for debugging)
        this.createGridLines();
        
        // Start with grid hidden by default (too many cells to show initially)
        this.gridMesh.visible = false;
        console.log('🗺️ Grid visualization created (hidden by default - press G to show)');
    }

    createGridLines() {
        const gridMaterial = new THREE.LineBasicMaterial({ 
            color: 0x444444, 
            transparent: true, 
            opacity: 0.1 // Reduced from 0.3 to 0.1 for less distraction
        });

        // Vertical lines
        for (let x = 0; x <= this.cellsX; x++) {
            const worldX = (x * this.gridSize) - (this.worldSize / 2);
            const geometry = new THREE.BufferGeometry().setFromPoints([
                new THREE.Vector3(worldX, 0, -this.worldSize / 2),
                new THREE.Vector3(worldX, 0, this.worldSize / 2)
            ]);
            const line = new THREE.Line(geometry, gridMaterial);
            this.gridMesh.add(line);
        }

        // Horizontal lines
        for (let z = 0; z <= this.cellsZ; z++) {
            const worldZ = (z * this.gridSize) - (this.worldSize / 2);
            const geometry = new THREE.BufferGeometry().setFromPoints([
                new THREE.Vector3(-this.worldSize / 2, 0, worldZ),
                new THREE.Vector3(this.worldSize / 2, 0, worldZ)
            ]);
            const line = new THREE.Line(geometry, gridMaterial);
            this.gridMesh.add(line);
        }
    }

    // Convert world position to grid coordinates
    worldToGrid(worldPosition) {
        const gridX = Math.floor((worldPosition.x + this.worldSize / 2) / this.gridSize);
        const gridZ = Math.floor((worldPosition.z + this.worldSize / 2) / this.gridSize);
        
        return { x: gridX, z: gridZ };
    }

    // Convert grid coordinates to world position
    gridToWorld(gridX, gridZ) {
        const worldX = (gridX * this.gridSize) - (this.worldSize / 2) + (this.gridSize / 2);
        const worldZ = (gridZ * this.gridSize) - (this.worldSize / 2) + (this.gridSize / 2);
        
        return new THREE.Vector3(worldX, 0, worldZ);
    }

    // Get cell key for Map lookup
    getCellKey(x, z) {
        return `${x},${z}`;
    }

    // Get cell at world position
    getCellAtWorld(worldPosition) {
        const grid = this.worldToGrid(worldPosition);
        const cellKey = this.getCellKey(grid.x, grid.z);
        return this.gridCells.get(cellKey);
    }

    // Get cell at grid coordinates
    getCellAtGrid(gridX, gridZ) {
        const cellKey = this.getCellKey(gridX, gridZ);
        return this.gridCells.get(cellKey);
    }

    // Check if cell is walkable
    isWalkable(worldPosition) {
        const cell = this.getCellAtWorld(worldPosition);
        return cell && cell.state === this.cellStates.WALKABLE && !cell.occupied;
    }

    // Find nearest walkable cell
    findNearestWalkable(worldPosition) {
        const startGrid = this.worldToGrid(worldPosition);
        const maxSearchRadius = 10; // Search radius in grid cells
        
        for (let radius = 0; radius <= maxSearchRadius; radius++) {
            for (let dx = -radius; dx <= radius; dx++) {
                for (let dz = -radius; dz <= radius; dz++) {
                    if (Math.abs(dx) === radius || Math.abs(dz) === radius) {
                        const testX = startGrid.x + dx;
                        const testZ = startGrid.z + dz;
                        
                        if (testX >= 0 && testX < this.cellsX && 
                            testZ >= 0 && testZ < this.cellsZ) {
                            const cell = this.getCellAtGrid(testX, testZ);
                            if (cell && cell.state === this.cellStates.WALKABLE && !cell.occupied) {
                                return cell.center.clone();
                            }
                        }
                    }
                }
            }
        }
        
        // Fallback to original position
        return worldPosition.clone();
    }

    // Highlight a grid cell
    highlightCell(worldPosition) {
        // Remove previous highlight
        this.clearHighlight();
        
        const cell = this.getCellAtWorld(worldPosition);
        if (!cell || cell.state !== this.cellStates.WALKABLE) {
            return false;
        }
        
        // Create highlight mesh
        const highlightGeometry = new THREE.PlaneGeometry(this.gridSize * 0.9, this.gridSize * 0.9);
        const highlightMaterial = new THREE.MeshBasicMaterial({ 
            color: 0x00ff00, 
            transparent: true, 
            opacity: 0.3,
            side: THREE.DoubleSide
        });
        
        this.highlightedCell = new THREE.Mesh(highlightGeometry, highlightMaterial);
        this.highlightedCell.rotation.x = -Math.PI / 2;
        this.highlightedCell.position.copy(cell.center);
        this.highlightedCell.position.y = 0.1;
        
        this.scene.add(this.highlightedCell);
        
        return true;
    }

    // Clear current highlight
    clearHighlight() {
        if (this.highlightedCell) {
            this.scene.remove(this.highlightedCell);
            this.highlightedCell = null;
        }
    }

    // Get path to target (simplified to prevent backtracking)
    getPathToTarget(startPos, targetPos) {
        const startCell = this.worldToGrid(startPos);
        const targetCell = this.worldToGrid(startPos);
        
        // For now, just return the target position directly
        // This prevents the backtracking issue by eliminating intermediate waypoints
        return [targetPos.clone()];
    }

    // Toggle grid visibility
    toggleGrid() {
        if (this.gridMesh) {
            this.gridMesh.visible = !this.gridMesh.visible;
            console.log('🗺️ Grid visibility toggled:', this.gridMesh.visible);
        }
    }

    // Set grid visibility
    setGridVisible(visible) {
        if (this.gridMesh) {
            this.gridMesh.visible = visible;
            console.log('🗺️ Grid visibility set to:', visible);
        }
    }

    // Update grid visualization
    update() {
        // Update grid based on camera position or other factors
        // This can be used to show/hide grid lines based on zoom level
    }

    // Cleanup
    destroy() {
        this.clearHighlight();
        
        if (this.gridMesh) {
            this.scene.remove(this.gridMesh);
            this.gridMesh = null;
        }
        
        this.gridCells.clear();
        this.visibleCells.clear();
    }
}
