/*
 * ========================================
 * 3D BLOCK GAME - Main Game Logic
 * ========================================
 * 
 * This game features:
 * - Player with 20-sided (icosahedron) head
 * - Block-based world with platforms
 * - Gravity and collision detection
 * - Arrow key movement
 * - Shift+arrow directional jumps
 * 
 * ========================================
 */

// ========================================
// GLOBAL VARIABLES
// ========================================

let scene, camera, renderer;
let player, playerBody;
let worldBlocks = [];
let keys = {};
let mouseX = 0, mouseY = 0;
let isMouseDown = false;
let monsters = [];
let attackCooldown = 0;
let monsterSpawnTimer = 0;
let coins = [];
let shopOpen = false;
let trees = [];
let buildingMode = false;
let castleBuilderOpen = false;
let worldLayers = []; // Track different world layers
const FALL_THROUGH_HEIGHT = 2; // Above this Y, you fall through blue sky (can walk on ground, but fall through when above platforms)

// Player physics and stats
const playerState = {
    position: { x: 0, y: 1, z: 0 }, // Start on ground - can walk normally, but fall through when above Y=2
    velocity: { x: 0, y: 0, z: 0 },
    isOnGround: false,
    moveSpeed: 0.1,
    jumpPower: 0.3,
    gravity: -0.02,
    size: { width: 0.8, height: 2, depth: 0.8 },
    health: 100,
    maxHealth: 100,
    attackDamage: 18, // Lower base damage to increase difficulty
    attackRange: 5, // Slightly shorter range
    attackCooldownTime: 0.65, // Slower attacks
    coins: 0,
    // Upgrade levels for shop
    healthUpgradeLevel: 0,
    attackUpgradeLevel: 0,
    // Pickaxe system
    pickaxeLevel: 0, // 0 = weak pickaxe (starts with this)
    pickaxeMiningPower: 5, // Blocks per hit
    pickaxeBreakRange: 4, // How far away you can break blocks
    // Void escape powerup
    hasVoidEscapePowerup: false, // One-time escape from void
    isStuckInVoid: false, // Current stuck status
    // Resources
    wood: 0 // Wood for building
};

// Monster stats tracking for progressive difficulty
let monstersKilled = 0;
let gameTime = 0;
let lastTime = 0; // For delta time calculation in animation loop

// ========================================
// SCENE SETUP
// ========================================

function initScene() {
    // Create scene
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x87CEEB); // Sky blue
    
    // Create camera (third-person view)
    camera = new THREE.PerspectiveCamera(
        75, // Field of view
        window.innerWidth / window.innerHeight, // Aspect ratio
        0.1, // Near clipping plane
        1000 // Far clipping plane
    );
    // Camera position will be set after player is created
    camera.position.set(0, 8, 10);
    
    // Create renderer
    const canvas = document.getElementById('game-canvas');
    renderer = new THREE.WebGLRenderer({ 
        canvas: canvas,
        antialias: true 
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    
    // Add lighting - brighter to ensure visibility
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
    scene.add(ambientLight);
    
    const directionalLight = new THREE.DirectionalLight(0xffffff, 1.0);
    directionalLight.position.set(10, 20, 10);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    directionalLight.shadow.camera.near = 0.5;
    directionalLight.shadow.camera.far = 50;
    directionalLight.shadow.camera.left = -20;
    directionalLight.shadow.camera.right = 20;
    directionalLight.shadow.camera.top = 20;
    directionalLight.shadow.camera.bottom = -20;
    scene.add(directionalLight);
    
    // Handle window resize
    window.addEventListener('resize', onWindowResize);
}

// ========================================
// PLAYER CREATION
// ========================================

function createPlayer() {
    // Create player group
    player = new THREE.Group();
    
    // HEAD: 20-sided shape (Icosahedron)
    const headGeometry = new THREE.IcosahedronGeometry(0.4, 0); // Radius 0.4, detail level 0 (perfect 20 faces)
    const headMaterial = new THREE.MeshLambertMaterial({ color: 0xffdbac }); // Skin tone
    const head = new THREE.Mesh(headGeometry, headMaterial);
    head.position.set(0, 1.2, 0);
    head.castShadow = true;
    head.receiveShadow = false;
    
    // BODY: Torso
    const torsoGeometry = new THREE.BoxGeometry(0.5, 0.6, 0.3);
    const torsoMaterial = new THREE.MeshLambertMaterial({ color: 0x3498db }); // Blue
    const torso = new THREE.Mesh(torsoGeometry, torsoMaterial);
    torso.position.set(0, 0.5, 0);
    torso.castShadow = true;
    torso.receiveShadow = false;
    
    // ARMS: Left and Right
    const armGeometry = new THREE.BoxGeometry(0.2, 0.6, 0.2);
    const armMaterial = new THREE.MeshLambertMaterial({ color: 0xffdbac });
    
    const leftArm = new THREE.Mesh(armGeometry, armMaterial);
    leftArm.position.set(-0.4, 0.5, 0);
    leftArm.castShadow = true;
    
    const rightArm = new THREE.Mesh(armGeometry, armMaterial);
    rightArm.position.set(0.4, 0.5, 0);
    rightArm.castShadow = true;
    
    // LEGS: Left and Right
    const legGeometry = new THREE.BoxGeometry(0.25, 0.6, 0.25);
    const legMaterial = new THREE.MeshLambertMaterial({ color: 0x2c3e50 }); // Dark blue
    
    const leftLeg = new THREE.Mesh(legGeometry, legMaterial);
    leftLeg.position.set(-0.15, -0.3, 0);
    leftLeg.castShadow = true;
    
    const rightLeg = new THREE.Mesh(legGeometry, legMaterial);
    rightLeg.position.set(0.15, -0.3, 0);
    rightLeg.castShadow = true;
    
    // Add all parts to player group
    player.add(head);
    player.add(torso);
    player.add(leftArm);
    player.add(rightArm);
    player.add(leftLeg);
    player.add(rightLeg);
    
    // Set initial position
    player.position.copy(playerState.position);
    
    scene.add(player);
    
    // Create a simple bounding box representation for collision
    playerBody = {
        minX: -playerState.size.width / 2,
        maxX: playerState.size.width / 2,
        minY: -playerState.size.height / 2,
        maxY: playerState.size.height / 2,
        minZ: -playerState.size.depth / 2,
        maxZ: playerState.size.depth / 2
    };
}

// ========================================
// WORLD GENERATION
// ========================================

function createWorldLayer(groundY, layerName, color = 0x8B4513) {
    // Create a world layer at a specific Y height
    const blockMaterial = new THREE.MeshLambertMaterial({ color: color });
    const groundSize = 50;
    const blockSize = 1;
    const layerBlocks = [];
    
    for (let x = -groundSize; x < groundSize; x++) {
        for (let z = -groundSize; z < groundSize; z++) {
            const blockGeometry = new THREE.BoxGeometry(blockSize, blockSize, blockSize);
            const block = new THREE.Mesh(blockGeometry, blockMaterial);
            block.position.set(x * blockSize, groundY - 0.5, z * blockSize);
            block.receiveShadow = true;
            block.castShadow = true;
            
            // Store collision info
            block.userData = {
                isBlock: true,
                worldLayer: groundY,
                minX: block.position.x - blockSize / 2,
                maxX: block.position.x + blockSize / 2,
                minY: block.position.y - blockSize / 2,
                maxY: block.position.y + blockSize / 2,
                minZ: block.position.z - blockSize / 2,
                maxZ: block.position.z + blockSize / 2
            };
            
            scene.add(block);
            worldBlocks.push(block);
            layerBlocks.push(block);
        }
    }
    
    console.log(`Created ${layerBlocks.length} blocks for ${layerName} at Y=${groundY}`);
    return layerBlocks;
}

function createWorld() {
    const blockMaterial = new THREE.MeshLambertMaterial({ color: 0x8B4513 }); // Brown ground
    const platformMaterial = new THREE.MeshLambertMaterial({ color: 0x2ecc71 }); // Green platforms
    
    // Create multiple world layers at different heights
    // Main world at Y=0
    createWorldLayer(0, "Main World", 0x8B4513);
    
    // Lower worlds - different colors for variety
    createWorldLayer(-50, "Lower World 1", 0x654321); // Darker brown
    createWorldLayer(-100, "Lower World 2", 0x4B3621); // Even darker
    createWorldLayer(-150, "Lower World 3", 0x2F1B14); // Very dark
    
    // Store world layer info
    worldLayers = [0, -50, -100, -150];
    
    console.log(`Created ${worldBlocks.length} total ground blocks across ${worldLayers.length} layers`);
    
    // Create platforms for each world layer
    function createPlatformsForLayer(layerY, count = 8) {
        const platforms = [];
        for (let i = 0; i < count; i++) {
            const x = (Math.random() - 0.5) * 80;
            const z = (Math.random() - 0.5) * 80;
            const height = 2 + Math.random() * 4;
            platforms.push({
                x: x,
                y: layerY + height,
                z: z,
                width: 2 + Math.random() * 3,
                height: 1,
                depth: 2 + Math.random() * 3
            });
        }
        return platforms;
    }
    
    // Create platforms for main world (Y=0)
    const mainWorldPlatforms = [
        // Original platforms (near spawn)
        { x: 5, y: 2, z: 5, width: 3, height: 1, depth: 3 },
        { x: -5, y: 4, z: -5, width: 2, height: 1, depth: 2 },
        { x: 8, y: 6, z: -8, width: 2, height: 1, depth: 2 },
        { x: -8, y: 3, z: 8, width: 4, height: 1, depth: 4 },
        { x: 0, y: 5, z: -10, width: 3, height: 1, depth: 3 },
        { x: 10, y: 3, z: 0, width: 2, height: 1, depth: 2 },
        // More platforms
        { x: 15, y: 3, z: 15, width: 3, height: 1, depth: 3 },
        { x: -15, y: 4, z: 15, width: 2, height: 1, depth: 2 },
        { x: 20, y: 5, z: -20, width: 4, height: 1, depth: 4 },
        { x: -20, y: 6, z: -20, width: 3, height: 1, depth: 3 },
        { x: 25, y: 4, z: 10, width: 2, height: 1, depth: 2 },
        { x: -25, y: 5, z: -10, width: 3, height: 1, depth: 3 },
        { x: 30, y: 7, z: 0, width: 2, height: 1, depth: 2 },
        { x: -30, y: 4, z: 0, width: 4, height: 1, depth: 4 },
        { x: 0, y: 6, z: 25, width: 3, height: 1, depth: 3 },
        { x: 0, y: 8, z: -30, width: 2, height: 1, depth: 2 },
        { x: 35, y: 5, z: 20, width: 3, height: 1, depth: 3 },
        { x: -35, y: 6, z: -25, width: 2, height: 1, depth: 2 },
        { x: 40, y: 4, z: -15, width: 4, height: 1, depth: 4 },
        { x: -40, y: 7, z: 15, width: 2, height: 1, depth: 2 },
        { x: 15, y: 8, z: -35, width: 3, height: 1, depth: 3 },
        { x: -15, y: 5, z: 35, width: 2, height: 1, depth: 2 }
    ];
    
    // Add platforms for each world layer
    worldLayers.forEach(layerY => {
        const platforms = layerY === 0 ? mainWorldPlatforms : createPlatformsForLayer(layerY, 10);
        
        platforms.forEach(plat => {
            const platformGeometry = new THREE.BoxGeometry(
                plat.width,
                plat.height,
                plat.depth
            );
            const platform = new THREE.Mesh(platformGeometry, platformMaterial);
            platform.position.set(plat.x, plat.y, plat.z);
            platform.castShadow = true;
            platform.receiveShadow = true;
            
            // Store collision info
            platform.userData = {
                isBlock: true,
                worldLayer: layerY,
                minX: plat.x - plat.width / 2,
                maxX: plat.x + plat.width / 2,
                minY: plat.y - plat.height / 2,
                maxY: plat.y + plat.height / 2,
                minZ: plat.z - plat.depth / 2,
                maxZ: plat.z + plat.depth / 2
            };
            
            scene.add(platform);
            worldBlocks.push(platform);
        });
    });
    
    console.log(`Total blocks in world: ${worldBlocks.length}`);
    console.log(`Player starting position:`, playerState.position);
    console.log(`Camera position:`, camera.position);
    
    // Create trees scattered across the world
    createTrees();
}

function createTrees() {
    // Spawn trees at random locations across the world
    const treeCount = 30; // Number of trees to spawn
    const worldSize = 50; // Match groundSize
    
    for (let i = 0; i < treeCount; i++) {
        // Random position, avoiding spawn area
        let x, z;
        let attempts = 0;
        do {
            x = (Math.random() - 0.5) * worldSize * 1.5;
            z = (Math.random() - 0.5) * worldSize * 1.5;
            attempts++;
        } while ((Math.abs(x) < 5 && Math.abs(z) < 5) && attempts < 20); // Avoid spawn area
        
        // Only place trees on ground (not on platforms usually)
        const y = getGroundHeight(x, z, 10, false);
        if (y > 0) continue; // Skip if not on ground level
        
        createTree(x, z);
    }
    
    console.log(`Created ${trees.length} trees`);
}

// ========================================
// MONSTER SYSTEM
// ========================================

function createMonster(level, spawnX = null, spawnY = null, spawnZ = null) {
    // Progressive difficulty based on level
    const baseHealth = 70;       // tougher base
    const baseDamage = 16;       // harder hits
    const baseSpeed = 0.15;      // much faster base speed for testing
    
    const health = baseHealth + (level * 30);
    const maxHealth = health;
    const damage = baseDamage + (level * 8);
    const speed = baseSpeed + (level * 0.015);
    const size = 0.8 + (level * 0.1);
    
    // Choose random spawn position away from player (or use provided position)
    if (spawnX === null || spawnY === null || spawnZ === null) {
        const angle = Math.random() * Math.PI * 2;
        const distance = 15 + Math.random() * 20;
        spawnX = playerState.position.x + Math.cos(angle) * distance;
        spawnZ = playerState.position.z + Math.sin(angle) * distance;
        spawnY = getGroundHeight(spawnX, spawnZ, 10, false) + 0.5;
    }
    
    // Create monster group
    const monster = new THREE.Group();
    
    // Body (cube)
    const bodyGeometry = new THREE.BoxGeometry(size, size * 1.2, size);
    let bodyColor;
    if (level >= 5) {
        bodyColor = 0x8B0000; // Dark red for very high level guardians
    } else if (level === 0) {
        bodyColor = 0xff0000; // Red
    } else if (level === 1) {
        bodyColor = 0xff6600; // Orange
    } else {
        bodyColor = 0x9900ff; // Purple
    }
    const bodyMaterial = new THREE.MeshLambertMaterial({ color: bodyColor });
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    body.position.set(0, size * 0.6, 0);
    body.castShadow = true;
    monster.add(body);
    
    // Head (smaller cube)
    const headGeometry = new THREE.BoxGeometry(size * 0.7, size * 0.7, size * 0.7);
    const headMaterial = new THREE.MeshLambertMaterial({ color: 0x333333 });
    const head = new THREE.Mesh(headGeometry, headMaterial);
    head.position.set(0, size * 1.4, 0);
    head.castShadow = true;
    monster.add(head);
    
    // Eyes
    const eyeGeometry = new THREE.SphereGeometry(0.1, 8, 8);
    const eyeMaterial = new THREE.MeshLambertMaterial({ color: 0xffff00 });
    const leftEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
    leftEye.position.set(-size * 0.2, size * 1.5, size * 0.35);
    const rightEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
    rightEye.position.set(size * 0.2, size * 1.5, size * 0.35);
    monster.add(leftEye);
    monster.add(rightEye);
    
    // Store monster data
    monster.userData = {
        isMonster: true,
        health: health,
        maxHealth: maxHealth,
        damage: damage,
        speed: speed,
        level: level,
        attackCooldown: 0,
        attackRange: 2,
        lastAttackTime: 0,
        size: size, // Store size for void detection
        isStuckInVoid: false // Track if monster is stuck in void
    };
    
    monster.position.set(spawnX, spawnY, spawnZ);
    scene.add(monster);
    
    // Create health bar
    const healthBar = createHealthBar(monster, health / maxHealth);
    monster.userData.healthBar = healthBar;
    
    return monster;
}

function createHealthBar(monster, healthPercent) {
    const barContainer = document.createElement('div');
    barContainer.className = 'monster-health-bar';
    barContainer.style.cssText = `
        position: absolute;
        width: 60px;
        height: 8px;
        background: rgba(0, 0, 0, 0.5);
        border: 1px solid white;
        display: none;
    `;
    
    const barFill = document.createElement('div');
    barFill.className = 'monster-health-fill';
    barFill.style.cssText = `
        width: ${healthPercent * 100}%;
        height: 100%;
        background: linear-gradient(to right, #ff0000, #ff6600);
        transition: width 0.2s;
    `;
    
    barContainer.appendChild(barFill);
    document.getElementById('game-container').appendChild(barContainer);
    
    return { container: barContainer, fill: barFill };
}

function updateMonsters(deltaTime) {
    monsters.forEach((monster, index) => {
        if (!monster.userData) return;
        
        const monsterData = monster.userData;
        const monsterPos = monster.position;
        const playerPos = playerState.position;
        
        // Calculate distance to player
        const dx = playerPos.x - monsterPos.x;
        const dz = playerPos.z - monsterPos.z;
        const dy = playerPos.y - monsterPos.y;
        const distance = Math.sqrt(dx * dx + dz * dz);
        const totalDistance = Math.sqrt(dx * dx + dy * dy + dz * dz);
        
        // Check if monster is stuck in void
        const isMonsterInVoid = checkIfMonsterInVoid(monster);
        
        if (isMonsterInVoid) {
            if (!monsterData.isStuckInVoid) {
                monsterData.isStuckInVoid = true;
            }
            // Monster is stuck - skip movement logic (monster cannot move)
        } else {
            // Monster is not in void - clear stuck status
            if (monsterData.isStuckInVoid) {
                monsterData.isStuckInVoid = false;
            }
        }
        
        // Guardian behavior: stay close to coin, only chase if player is near coin
        let targetX = monsterPos.x;
        let targetZ = monsterPos.z;
        let shouldMove = false;
        
        // Only calculate movement if monster is not stuck
        if (!monsterData.isStuckInVoid) {
        
        if (monsterData.isGuardian && monsterData.guardedCoin && !monsterData.guardedCoin.userData.collected) {
            const coin = monsterData.guardedCoin;
            const coinPos = coin.position;
            const currentTime = Date.now() / 1000;
            
            // Check if aggressive mode should end (timeout or player far away)
            let justEndedAggressive = false;
            if (monsterData.aggressiveMode && monsterData.aggressiveModeEndTime > 0) {
                const playerDistanceFromCoin = Math.sqrt(
                    Math.pow(coinPos.x - playerPos.x, 2) + 
                    Math.pow(coinPos.z - playerPos.z, 2)
                );
                
                // End aggressive mode if timeout or player is very far from coin (chase from farther!)
                if (currentTime >= monsterData.aggressiveModeEndTime || playerDistanceFromCoin > 40) {
                    monsterData.aggressiveMode = false;
                    monsterData.aggressiveModeEndTime = 0;
                    justEndedAggressive = true; // Flag that we just ended aggressive mode
                }
            }
            
            // Distance from monster to coin
            const coinDx = coinPos.x - monsterPos.x;
            const coinDz = coinPos.z - monsterPos.z;
            const distanceToCoin = Math.sqrt(coinDx * coinDx + coinDz * coinDz);
            
            // Distance from player to coin
            const playerToCoinDx = coinPos.x - playerPos.x;
            const playerToCoinDz = coinPos.z - playerPos.z;
            const playerDistanceToCoin = Math.sqrt(playerToCoinDx * playerToCoinDx + playerToCoinDz * playerToCoinDz);
            
            const guardRadius = 6; // Guardians will stay within this radius of coin (tighter guard!)
            const alertRadius = 15; // If player gets this close to coin, guardians will chase (detect from farther!)
            
            // AGGRESSIVE MODE: Chase player regardless of distance from coin
            if (monsterData.aggressiveMode) {
                // Chase player aggressively - no distance restrictions!
                targetX = playerPos.x;
                targetZ = playerPos.z;
                shouldMove = true;
            }
            // If aggressive mode just ended or guardian is far from guard position, prioritize returning
            else if (justEndedAggressive || (monsterData.guardPosition && Math.sqrt(
                Math.pow(monsterData.guardPosition.x - monsterPos.x, 2) + 
                Math.pow(monsterData.guardPosition.z - monsterPos.z, 2)
            ) > guardRadius)) {
                // Return to guard position immediately
                if (monsterData.guardPosition) {
                    targetX = monsterData.guardPosition.x;
                    targetZ = monsterData.guardPosition.z;
                    shouldMove = true;
                } else {
                    // Fallback to coin position
                    targetX = coinPos.x;
                    targetZ = coinPos.z;
                    shouldMove = true;
                }
            }
            // Normal guard behavior when not aggressive (more aggressive!)
            else if (playerDistanceToCoin < alertRadius) {
                // If player gets very close to coin, automatically trigger aggressive mode!
                if (playerDistanceToCoin < 8 && !monsterData.aggressiveMode) {
                    monsterData.aggressiveMode = true;
                    monsterData.aggressiveModeEndTime = Date.now() / 1000 + 20; // 20 seconds of aggression!
                }
                
                // If player is close to coin, guardians will chase player aggressively
                if (distanceToCoin < guardRadius * 2) {
                    // Can chase further from coin (more aggressive!)
                    targetX = playerPos.x;
                    targetZ = playerPos.z;
                    shouldMove = true;
                } else {
                    // Too far from coin, return to coin area
                    targetX = coinPos.x;
                    targetZ = coinPos.z;
                    shouldMove = true;
                }
            } else {
                // Player not near coin, return to guard position or patrol
                if (monsterData.guardPosition) {
                    // Return to original guard position
                    const guardDx = monsterData.guardPosition.x - monsterPos.x;
                    const guardDz = monsterData.guardPosition.z - monsterPos.z;
                    const distanceToGuardPos = Math.sqrt(guardDx * guardDx + guardDz * guardDz);
                    
                    if (distanceToGuardPos > 1) {
                        // Move back to guard position
                        targetX = monsterData.guardPosition.x;
                        targetZ = monsterData.guardPosition.z;
                        shouldMove = true;
                    } else if (distanceToCoin > guardRadius) {
                        // If guard position was reset, use coin as fallback
                        targetX = coinPos.x;
                        targetZ = coinPos.z;
                        shouldMove = true;
                    } else if (distanceToCoin < guardRadius * 0.5) {
                        // Too close to coin, move a bit away (patrol)
                        const angle = Math.random() * Math.PI * 2;
                        targetX = coinPos.x + Math.cos(angle) * guardRadius * 0.7;
                        targetZ = coinPos.z + Math.sin(angle) * guardRadius * 0.7;
                        shouldMove = Math.random() > 0.95; // Slow patrol movement
                    }
                } else {
                    // Fallback to coin-based patrol
                    if (distanceToCoin > guardRadius) {
                        targetX = coinPos.x;
                        targetZ = coinPos.z;
                        shouldMove = true;
                    } else if (distanceToCoin < guardRadius * 0.5) {
                        const angle = Math.random() * Math.PI * 2;
                        targetX = coinPos.x + Math.cos(angle) * guardRadius * 0.7;
                        targetZ = coinPos.z + Math.sin(angle) * guardRadius * 0.7;
                        shouldMove = Math.random() > 0.95;
                    }
                }
            }
        } else {
            // Normal monster behavior: always chase player (no stopping!)
            targetX = playerPos.x;
            targetZ = playerPos.z;
            shouldMove = true; // Always chase, never stop
        }
        } // End of !isStuckInVoid check for movement calculation
        
        // Move toward target (only if not stuck)
        if (shouldMove && !monsterData.isStuckInVoid) {
            const targetDx = targetX - monsterPos.x;
            const targetDz = targetZ - monsterPos.z;
            const targetDistance = Math.sqrt(targetDx * targetDx + targetDz * targetDz);
            
            if (targetDistance > 0.1) {
                const moveX = (targetDx / targetDistance) * monsterData.speed;
                const moveZ = (targetDz / targetDistance) * monsterData.speed;
                
                // Calculate new position
                const newMonsterX = monsterPos.x + moveX;
                const newMonsterZ = monsterPos.z + moveZ;
                
                // Get ground height at new position using simple monster function
                const groundHeight = getMonsterGroundHeight(newMonsterX, newMonsterZ, monsterPos.y);
                
                // Move the monster directly - no collision check for now
                monsterPos.x = newMonsterX;
                monsterPos.z = newMonsterZ;
                monsterPos.y = groundHeight + 0.5;
                
                // Always face target (or player if guardian and player is near)
                const faceDx = monsterData.isGuardian && distance < 15 ? dx : targetDx;
                const faceDz = monsterData.isGuardian && distance < 15 ? dz : targetDz;
                const angle = Math.atan2(faceDx, faceDz);
                monster.rotation.y = angle;
            }
        } else if (distance > 0) {
            // Still face player even when not moving
            const angle = Math.atan2(dx, dz);
            monster.rotation.y = angle;
        }
        
        // Attack player if in range (monsters have shorter range than player)
        if (totalDistance <= monsterData.attackRange) {
            const currentTime = Date.now() / 1000;
            if (currentTime - monsterData.lastAttackTime > 1.2) { // Attack faster
                playerState.health -= monsterData.damage;
                monsterData.lastAttackTime = currentTime;
                
                // Update player health UI
                updatePlayerHealthUI();
                
                // Flash player red on hit
                flashPlayerRed();
                
                if (playerState.health <= 0) {
                    playerState.health = 0;
                    showGameOver();
                }
            }
        }
        
        // Update health bar position
        if (monsterData.healthBar) {
            updateHealthBarPosition(monster, monsterData.healthBar);
            const healthPercent = monsterData.health / monsterData.maxHealth;
            monsterData.healthBar.fill.style.width = `${healthPercent * 100}%`;
            
            if (healthPercent < 1) {
                monsterData.healthBar.container.style.display = 'block';
            }
        }
        
        // Remove if dead
        if (monsterData.health <= 0) {
            scene.remove(monster);
            if (monsterData.healthBar) {
                monsterData.healthBar.container.remove();
            }
            monsters.splice(index, 1);
            monstersKilled++;
            updateKillsUI();
        }
    });
}

function updateHealthBarPosition(monster, healthBar) {
    const vector = new THREE.Vector3();
    vector.setFromMatrixPosition(monster.matrixWorld);
    vector.project(camera);
    
    const x = (vector.x * 0.5 + 0.5) * window.innerWidth;
    const y = (-vector.y * 0.5 + 0.5) * window.innerHeight;
    
    healthBar.container.style.left = (x - 30) + 'px';
    healthBar.container.style.top = (y - 40) + 'px';
}

function spawnMonster() {
    // Calculate difficulty level based on kills and time
    const level = Math.min(Math.floor(monstersKilled / 3), 5); // Faster leveling, max level 5
    const monster = createMonster(level);
    monsters.push(monster);
}

// ========================================
// COIN SYSTEM
// ========================================

function createCoin(x, z, y = null) {
    // Create a spinning coin
    const coinGroup = new THREE.Group();
    
    // Coin geometry (cylinder)
    const coinGeometry = new THREE.CylinderGeometry(0.3, 0.3, 0.05, 16);
    const coinMaterial = new THREE.MeshLambertMaterial({ 
        color: 0xffd700, // Gold
        emissive: 0x333300 // Slight glow
    });
    const coin = new THREE.Mesh(coinGeometry, coinMaterial);
    coin.rotation.x = Math.PI / 2; // Lay flat
    coin.castShadow = true;
    coinGroup.add(coin);
    
    // Get ground height if not provided
    if (y === null) {
        y = getGroundHeight(x, z, 10, false) + 0.5;
    }
    
    coinGroup.position.set(x, y, z);
    
    // Store coin data
    coinGroup.userData = {
        isCoin: true,
        collected: false,
        rotationSpeed: 0.05
    };
    
    scene.add(coinGroup);
    coins.push(coinGroup);
    
    return coinGroup;
}

function createCoinWithGuardians(x, z) {
    // Create the coin
    const coin = createCoin(x, z);
    
    // Spawn 4-5 VERY high-level guardian monsters around the coin (harder!)
    const guardianLevel = 8; // Even higher level - much tougher!
    const guardianCount = 4 + Math.floor(Math.random() * 2); // 4 or 5 guardians (more guards!)
    
    for (let i = 0; i < guardianCount; i++) {
        // Spawn guardians in a tighter circle around the coin (closer = harder to get past)
        const angle = (i / guardianCount) * Math.PI * 2;
        const distance = 2 + Math.random() * 1.5; // 2-3.5 units away from coin (tighter formation!)
        const guardianX = x + Math.cos(angle) * distance;
        const guardianZ = z + Math.sin(angle) * distance;
        const guardianY = getGroundHeight(guardianX, guardianZ, 10, false) + 0.5;
        
        // Create guardian monster with very high level at specific position
        const guardian = createMonster(guardianLevel, guardianX, guardianY, guardianZ);
        
        // Link guardian to coin
        guardian.userData.isGuardian = true;
        guardian.userData.guardedCoin = coin;
        guardian.userData.aggressiveMode = false;
        guardian.userData.aggressiveModeEndTime = 0;
        guardian.userData.guardPosition = { x: guardianX, z: guardianZ }; // Store original guard position
        
        monsters.push(guardian);
    }
    
    return coin;
}

function updateCoins(deltaTime) {
    coins.forEach((coin, index) => {
        if (!coin.userData || coin.userData.collected) return;
        
        // Rotate coin
        coin.rotation.y += coin.userData.rotationSpeed;
        
        // Check if player is close enough to collect
        const dx = coin.position.x - playerState.position.x;
        const dz = coin.position.z - playerState.position.z;
        const dy = coin.position.y - playerState.position.y;
        const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);
        
        if (distance < 0.8) { // Collection range (much smaller - must get very close!)
            // Collect coin
            coin.userData.collected = true;
            playerState.coins++;
            updateCoinsUI();
            
            // Remove coin from scene
            scene.remove(coin);
            coins.splice(index, 1);
        }
    });
}

// ========================================
// COMBAT SYSTEM
// ========================================

function attackMonsters() {
    if (attackCooldown > 0) return;
    
    const playerPos = playerState.position;
    let hitSomething = false;
    
    // First, try to break blocks (mining)
    const brokenBlock = tryBreakBlock();
    if (brokenBlock) {
        hitSomething = true;
    }
    
    // Then, try to cut trees
    const treeCut = tryCutTree();
    if (treeCut) {
        hitSomething = true;
    }
    
    // Finally, try to attack monsters
    monsters.forEach(monster => {
        if (!monster.userData) return;
        
        const monsterPos = monster.position;
        const dx = monsterPos.x - playerPos.x;
        const dz = monsterPos.z - playerPos.z;
        const dy = monsterPos.y - playerPos.y;
        const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);
        
        if (distance <= playerState.attackRange) {
            // Hit the monster!
            monster.userData.health -= playerState.attackDamage;
            hitSomething = true;
            
            // If this is a guardian, trigger aggressive mode (longer and more intense!)
            if (monster.userData.isGuardian) {
                monster.userData.aggressiveMode = true;
                monster.userData.aggressiveModeEndTime = Date.now() / 1000 + 20; // Aggressive for 20 seconds (longer chase!)
            }
            
            // Visual feedback - flash monster
            monster.children.forEach(child => {
                if (child.material) {
                    const originalColor = child.material.color.clone();
                    child.material.color.setHex(0xffffff);
                    setTimeout(() => {
                        child.material.color.copy(originalColor);
                    }, 100);
                }
            });
        }
    });
    
    if (hitSomething) {
        attackCooldown = playerState.attackCooldownTime;
        showAttackEffect();
    }
}

function flashPlayerRed() {
    player.children.forEach(child => {
        if (child.material) {
            const originalColor = child.material.color.clone();
            child.material.color.setHex(0xff0000);
            setTimeout(() => {
                child.material.color.copy(originalColor);
            }, 200);
        }
    });
}

function showAttackEffect() {
    // Simple visual feedback - could be expanded
    const effect = document.getElementById('attack-effect');
    if (effect) {
        effect.style.display = 'block';
        setTimeout(() => {
            effect.style.display = 'none';
        }, 200);
    }
}

// ========================================
// MINING SYSTEM
// ========================================

function getTargetBlock() {
    // Get camera direction (where player is looking)
    const cameraDirection = new THREE.Vector3();
    camera.getWorldDirection(cameraDirection);
    
    // Start from player position
    const playerPos = playerState.position;
    const startX = playerPos.x;
    const startY = playerPos.y;
    const startZ = playerPos.z;
    
    // Check blocks in the direction player is looking
    const checkDistance = playerState.pickaxeBreakRange;
    const stepSize = 0.5;
    const steps = Math.ceil(checkDistance / stepSize);
    
    // Find the closest block the player is looking at
    let closestBlock = null;
    let closestDistance = Infinity;
    
    for (let step = 1; step <= steps; step++) {
        const distance = step * stepSize;
        if (distance > checkDistance) break;
        
        // Calculate position along the look direction
        const checkX = startX + cameraDirection.x * distance;
        const checkY = startY + cameraDirection.y * distance;
        const checkZ = startZ + cameraDirection.z * distance;
        
        // Check all blocks to see if this point is inside one
        for (let block of worldBlocks) {
            if (!block.userData || !block.userData.isBlock) continue;
            if (block.userData.isVoid) continue; // Skip void blocks
            if (!block.visible) continue; // Skip already broken blocks
            
            // Skip broken blocks (double check)
            const blockData = block.userData;
            if (!blockData.isBlock) continue;
            
            // Check if the check point is inside this block
            if (checkX >= blockData.minX && checkX <= blockData.maxX &&
                checkY >= blockData.minY && checkY <= blockData.maxY &&
                checkZ >= blockData.minZ && checkZ <= blockData.maxZ) {
                
                // Found a block, check if it's the closest
                const blockCenterX = (blockData.minX + blockData.maxX) / 2;
                const blockCenterY = (blockData.minY + blockData.maxY) / 2;
                const blockCenterZ = (blockData.minZ + blockData.maxZ) / 2;
                
                const blockDistance = Math.sqrt(
                    Math.pow(startX - blockCenterX, 2) +
                    Math.pow(startY - blockCenterY, 2) +
                    Math.pow(startZ - blockCenterZ, 2)
                );
                
                if (blockDistance < closestDistance) {
                    closestDistance = blockDistance;
                    closestBlock = block;
                }
            }
        }
        
        // If we found a block, we can stop (we want the closest one)
        if (closestBlock) break;
    }
    
    return closestBlock;
}

function tryBreakBlock() {
    const targetBlock = getTargetBlock();
    
    if (!targetBlock) return false;
    
    // Check if block is within breaking range
    const playerPos = playerState.position;
    const blockPos = targetBlock.position;
    const dx = blockPos.x - playerPos.x;
    const dy = blockPos.y - playerPos.y;
    const dz = blockPos.z - playerPos.z;
    const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);
    
    if (distance > playerState.pickaxeBreakRange) {
        return false;
    }
    
    // Don't break blocks if player is standing on them (prevent falling through ground)
    const playerBox = {
        minX: playerPos.x + playerBody.minX,
        maxX: playerPos.x + playerBody.maxX,
        minY: playerPos.y + playerBody.minY,
        maxY: playerPos.y + playerBody.maxY,
        minZ: playerPos.z + playerBody.minZ,
        maxZ: playerPos.z + playerBody.maxZ
    };
    
    const blockData = targetBlock.userData;
    
    // Check if player is standing on this block
    const isStandingOn = playerBox.minY <= blockData.maxY + 0.1 && 
                         playerBox.minY >= blockData.maxY - 0.5 &&
                         playerBox.maxX > blockData.minX &&
                         playerBox.minX < blockData.maxX &&
                         playerBox.maxZ > blockData.minZ &&
                         playerBox.minZ < blockData.maxZ;
    
    if (isStandingOn) {
        return false; // Don't break the block you're standing on
    }
    
    // Break the block!
    breakBlock(targetBlock);
    return true;
}

function breakBlock(block) {
    if (!block || !block.userData || !block.userData.isBlock) return;
    
    // Create a void/hole instead of just removing the block
    // Replace the block material with a dark void material that looks like empty space
    const voidMaterial = new THREE.MeshLambertMaterial({ 
        color: 0x000011, // Very dark blue/black
        emissive: 0x000000, // No glow
        transparent: false,
        opacity: 1.0
    });
    
    // Change all children to void material
    block.traverse((child) => {
        if (child.isMesh) {
            child.material = voidMaterial;
            child.receiveShadow = false;
            child.castShadow = false;
        }
    });
    
    // Mark as broken so collision ignores it
    block.userData.isBlock = false;
    block.userData.isVoid = true;
    
    // Make it slightly larger to emphasize the void (or keep it same size)
    // The dark color will make it look like a hole
    
    console.log('Block broken - void created!');
}

// ========================================
// TREE SYSTEM
// ========================================

function createTree(x, z, y = null) {
    // Create a simple blocky tree
    const treeGroup = new THREE.Group();
    
    // Trunk (brown cylinder)
    const trunkHeight = 2 + Math.random() * 1;
    const trunkGeometry = new THREE.CylinderGeometry(0.2, 0.25, trunkHeight, 8);
    const trunkMaterial = new THREE.MeshLambertMaterial({ color: 0x8B4513 }); // Brown
    const trunk = new THREE.Mesh(trunkGeometry, trunkMaterial);
    trunk.position.y = trunkHeight / 2;
    trunk.castShadow = true;
    treeGroup.add(trunk);
    
    // Leaves (green spheres)
    const leafGeometry = new THREE.SphereGeometry(0.8, 8, 8);
    const leafMaterial = new THREE.MeshLambertMaterial({ color: 0x228B22 }); // Forest green
    const leaves = new THREE.Mesh(leafGeometry, leafMaterial);
    leaves.position.y = trunkHeight + 0.3;
    leaves.castShadow = true;
    treeGroup.add(leaves);
    
    // Get ground height if not provided
    if (y === null) {
        y = getGroundHeight(x, z, 10, false) + trunkHeight / 2;
    }
    
    treeGroup.position.set(x, y, z);
    
    // Store tree data
    treeGroup.userData = {
        isTree: true,
        cutDown: false,
        woodAmount: 3 + Math.floor(Math.random() * 3) // 3-5 wood per tree
    };
    
    scene.add(treeGroup);
    trees.push(treeGroup);
    
    return treeGroup;
}

function getTargetTree() {
    // Get camera direction (where player is looking)
    const cameraDirection = new THREE.Vector3();
    camera.getWorldDirection(cameraDirection);
    
    // Start from player position
    const playerPos = playerState.position;
    const startX = playerPos.x;
    const startY = playerPos.y;
    const startZ = playerPos.z;
    
    // Check trees in the direction player is looking
    const checkDistance = 5; // Range to cut trees
    const stepSize = 0.5;
    const steps = Math.ceil(checkDistance / stepSize);
    
    // Find the closest tree the player is looking at
    let closestTree = null;
    let closestDistance = Infinity;
    
    for (let step = 1; step <= steps; step++) {
        const distance = step * stepSize;
        if (distance > checkDistance) break;
        
        // Calculate position along the look direction
        const checkX = startX + cameraDirection.x * distance;
        const checkY = startY + cameraDirection.y * distance;
        const checkZ = startZ + cameraDirection.z * distance;
        
        // Check all trees to see if this point is near one
        for (let tree of trees) {
            if (!tree.userData || !tree.userData.isTree || tree.userData.cutDown) continue;
            if (!tree.visible) continue;
            
            const treePos = tree.position;
            const dx = checkX - treePos.x;
            const dy = checkY - treePos.y;
            const dz = checkZ - treePos.z;
            const treeDistance = Math.sqrt(dx * dx + dy * dy + dz * dz);
            
            if (treeDistance < 1.5 && treeDistance < closestDistance) {
                closestDistance = treeDistance;
                closestTree = tree;
            }
        }
        
        if (closestTree) break;
    }
    
    return closestTree;
}

function tryCutTree() {
    const targetTree = getTargetTree();
    
    if (!targetTree) return false;
    
    // Check if tree is within cutting range
    const playerPos = playerState.position;
    const treePos = targetTree.position;
    const dx = treePos.x - playerPos.x;
    const dy = treePos.y - playerPos.y;
    const dz = treePos.z - playerPos.z;
    const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);
    
    if (distance > 5) {
        return false;
    }
    
    // Cut the tree!
    cutTree(targetTree);
    return true;
}

function cutTree(tree) {
    if (!tree || !tree.userData || !tree.userData.isTree || tree.userData.cutDown) return;
    
    // Give player wood
    const woodAmount = tree.userData.woodAmount || 3;
    playerState.wood += woodAmount;
    updateWoodUI();
    
    // Mark tree as cut down
    tree.userData.cutDown = true;
    
    // Remove tree from scene (or make it disappear)
    scene.remove(tree);
    tree.visible = false;
    
    console.log(`Tree cut down! Got ${woodAmount} wood. Total wood: ${playerState.wood}`);
}

// ========================================
// BUILDING SYSTEM
// ========================================

function tryPlaceBlock() {
    if (playerState.wood < 1) return false; // Need wood to build
    
    // Get camera direction (where player is looking)
    const cameraDirection = new THREE.Vector3();
    camera.getWorldDirection(cameraDirection);
    
    // Start from player position
    const playerPos = playerState.position;
    const checkDistance = 5; // Building range
    const stepSize = 0.5;
    
    // Find the block position in front of player
    for (let step = 1; step <= checkDistance / stepSize; step++) {
        const distance = step * stepSize;
        const checkX = playerPos.x + cameraDirection.x * distance;
        const checkY = playerPos.y + cameraDirection.y * distance;
        const checkZ = playerPos.z + cameraDirection.z * distance;
        
        // Snap to grid (1 unit blocks)
        const blockX = Math.round(checkX);
        const blockY = Math.round(checkY);
        const blockZ = Math.round(checkZ);
        
        // Check if this position is valid (not occupied, not too close to player)
        const distanceToPlayer = Math.sqrt(
            Math.pow(blockX - playerPos.x, 2) + 
            Math.pow(blockY - playerPos.y, 2) + 
            Math.pow(blockZ - playerPos.z, 2)
        );
        
        if (distanceToPlayer < 1.5) continue; // Too close to player
        
        // Check if position is already occupied
        let positionFree = true;
        for (let block of worldBlocks) {
            if (!block.visible || block.userData.isVoid) continue;
            const blockPos = block.position;
            if (Math.abs(blockPos.x - blockX) < 0.1 &&
                Math.abs(blockPos.y - blockY) < 0.1 &&
                Math.abs(blockPos.z - blockZ) < 0.1) {
                positionFree = false;
                break;
            }
        }
        
        if (positionFree) {
            // Place block here
            placeBlock(blockX, blockY, blockZ);
            return true;
        }
    }
    
    return false;
}

function placeBlock(x, y, z) {
    if (playerState.wood < 1) return;
    
    // Create a new wooden block
    const blockMaterial = new THREE.MeshLambertMaterial({ color: 0x8B4513 }); // Brown wood color
    const blockGeometry = new THREE.BoxGeometry(1, 1, 1);
    const block = new THREE.Mesh(blockGeometry, blockMaterial);
    block.position.set(x, y, z);
    block.receiveShadow = true;
    block.castShadow = true;
    
    // Store collision info
    block.userData = {
        isBlock: true,
        minX: x - 0.5,
        maxX: x + 0.5,
        minY: y - 0.5,
        maxY: y + 0.5,
        minZ: z - 0.5,
        maxZ: z + 0.5,
        isPlaced: true // Mark as player-placed block
    };
    
    scene.add(block);
    worldBlocks.push(block);
    
    // Deduct wood
    playerState.wood--;
    updateWoodUI();
    
    console.log(`Block placed at (${x}, ${y}, ${z}). Wood remaining: ${playerState.wood}`);
}

// ========================================
// CASTLE BUILDER SYSTEM
// ========================================

const CASTLE_WOOD_COST = 50;

function toggleCastleBuilder() {
    castleBuilderOpen = !castleBuilderOpen;
    const builder = document.getElementById('castle-builder');
    if (builder) {
        builder.style.display = castleBuilderOpen ? 'block' : 'none';
        if (castleBuilderOpen) {
            updateCastleBuilderUI();
        }
    }
}

function updateCastleBuilderUI() {
    if (!castleBuilderOpen) return;
    
    const currentWoodDisplay = document.getElementById('current-wood-display');
    if (currentWoodDisplay) {
        currentWoodDisplay.textContent = playerState.wood;
    }
    
    const message = document.getElementById('castle-builder-message');
    if (message) {
        if (playerState.wood < CASTLE_WOOD_COST) {
            message.textContent = `Need ${CASTLE_WOOD_COST - playerState.wood} more wood!`;
            message.style.color = '#ff0000';
        } else {
            message.textContent = 'Ready to build!';
            message.style.color = '#00ff00';
        }
    }
}

function buildCastleAtCurrentLocation() {
    const playerPos = playerState.position;
    const centerX = Math.round(playerPos.x);
    const centerZ = Math.round(playerPos.z);
    buildCastle(centerX, centerZ);
}

function buildCastleAtCoords() {
    const xInput = document.getElementById('castle-x');
    const zInput = document.getElementById('castle-z');
    
    if (!xInput || !zInput) return;
    
    const x = parseInt(xInput.value);
    const z = parseInt(zInput.value);
    
    if (isNaN(x) || isNaN(z)) {
        const message = document.getElementById('castle-builder-message');
        if (message) {
            message.textContent = 'Please enter valid coordinates!';
            message.style.color = '#ff0000';
        }
        return;
    }
    
    buildCastle(x, z);
}

function buildCastle(centerX, centerZ) {
    // Check if player has enough wood
    if (playerState.wood < CASTLE_WOOD_COST) {
        const message = document.getElementById('castle-builder-message');
        if (message) {
            message.textContent = `Not enough wood! Need ${CASTLE_WOOD_COST} wood. You have ${playerState.wood}.`;
            message.style.color = '#ff0000';
        }
        return;
    }
    
    // Check if area is clear (only check where walls/towers will be built)
    const castleSize = 8; // 8x8 area
    const halfSize = castleSize / 2;
    
    // Only check perimeter where walls will be (not the entire area)
    // Check corner positions for towers first
    const towerChecks = [
        { x: centerX - halfSize, z: centerZ - halfSize },
        { x: centerX + halfSize, z: centerZ - halfSize },
        { x: centerX - halfSize, z: centerZ + halfSize },
        { x: centerX + halfSize, z: centerZ + halfSize }
    ];
    
    // Check if corner towers can be built (allow if area is mostly clear)
    let blocksInWay = 0;
    for (let checkX = centerX - halfSize; checkX <= centerX + halfSize; checkX++) {
        for (let checkZ = centerZ - halfSize; checkZ <= centerZ + halfSize; checkZ++) {
            // Only check perimeter (walls)
            const isPerimeter = (checkX === centerX - halfSize || checkX === centerX + halfSize ||
                                checkZ === centerZ - halfSize || checkZ === centerZ + halfSize);
            
            if (isPerimeter) {
                for (let block of worldBlocks) {
                    if (!block.visible || block.userData.isVoid) continue;
                    const blockPos = block.position;
                    if (Math.abs(blockPos.x - checkX) < 0.5 && Math.abs(blockPos.z - checkZ) < 0.5 &&
                        Math.abs(blockPos.y - getGroundHeight(checkX, checkZ, 10, false)) < 2) {
                        blocksInWay++;
                    }
                }
            }
        }
    }
    
    // Allow building if less than 20% of perimeter is blocked (can clear some blocks)
    if (blocksInWay > 10) {
        const message = document.getElementById('castle-builder-message');
        if (message) {
            message.textContent = 'Area is too blocked! Clear more space first.';
            message.style.color = '#ff0000';
        }
        return;
    }
    
    // Build the castle!
    const blocksCreated = createCastleStructure(centerX, centerZ);
    
    // Deduct wood
    playerState.wood -= CASTLE_WOOD_COST;
    updateWoodUI();
    updateCastleBuilderUI();
    
    const message = document.getElementById('castle-builder-message');
    if (message) {
        message.textContent = `✅ Castle built! Used ${CASTLE_WOOD_COST} wood.`;
        message.style.color = '#00ff00';
    }
    
    console.log(`Castle built at (${centerX}, ${centerZ})!`);
}

function createCastleStructure(centerX, centerZ) {
    const blockMaterial = new THREE.MeshLambertMaterial({ color: 0x696969 }); // Gray stone
    const castleSize = 8; // 8x8 castle
    const wallHeight = 4; // 4 blocks tall walls
    let blocksCreated = 0;
    
    // Get ground height at center
    const centerY = getGroundHeight(centerX, centerZ, 10, false);
    
    // Build walls (outer perimeter)
    const halfSize = castleSize / 2;
    
    // Front and back walls
    for (let x = -halfSize; x <= halfSize; x++) {
        for (let y = 0; y < wallHeight; y++) {
            // Front wall
            createCastleBlock(centerX + x, centerY + y, centerZ - halfSize, blockMaterial);
            blocksCreated++;
            // Back wall
            createCastleBlock(centerX + x, centerY + y, centerZ + halfSize, blockMaterial);
            blocksCreated++;
        }
    }
    
    // Left and right walls (excluding corners already built)
    for (let z = -halfSize + 1; z < halfSize; z++) {
        for (let y = 0; y < wallHeight; y++) {
            // Left wall
            createCastleBlock(centerX - halfSize, centerY + y, centerZ + z, blockMaterial);
            blocksCreated++;
            // Right wall
            createCastleBlock(centerX + halfSize, centerY + y, centerZ + z, blockMaterial);
            blocksCreated++;
        }
    }
    
    // Build corner towers (taller than walls)
    const towerHeight = wallHeight + 2;
    const towerPositions = [
        { x: -halfSize, z: -halfSize },
        { x: halfSize, z: -halfSize },
        { x: -halfSize, z: halfSize },
        { x: halfSize, z: halfSize }
    ];
    
    towerPositions.forEach(tower => {
        for (let y = 0; y < towerHeight; y++) {
            createCastleBlock(centerX + tower.x, centerY + y, centerZ + tower.z, blockMaterial);
            blocksCreated++;
        }
    });
    
    // Build entrance (don't build blocks at entrance in front wall)
    // The front wall loop above will build all blocks, so we need to skip entrance
    // Actually, let's just not build those blocks in the first place
    // Entrance is 3 blocks wide, 2 blocks tall, centered in front wall
    const entranceY = centerY;
    for (let x = -1; x <= 1; x++) {
        for (let y = 0; y < 2; y++) {
            // Remove blocks at entrance (front wall, bottom 2 blocks)
            const entranceX = centerX + x;
            const entranceZ = centerZ - halfSize;
            removeBlockAt(entranceX, entranceY + y, entranceZ);
        }
    }
    
    return blocksCreated;
}

function createCastleBlock(x, y, z, material) {
    // Check if block already exists here
    for (let block of worldBlocks) {
        const blockPos = block.position;
        if (Math.abs(blockPos.x - x) < 0.1 &&
            Math.abs(blockPos.y - y) < 0.1 &&
            Math.abs(blockPos.z - z) < 0.1) {
            return; // Block already exists
        }
    }
    
    const blockGeometry = new THREE.BoxGeometry(1, 1, 1);
    const block = new THREE.Mesh(blockGeometry, material);
    block.position.set(x, y, z);
    block.receiveShadow = true;
    block.castShadow = true;
    
    // Store collision info
    block.userData = {
        isBlock: true,
        minX: x - 0.5,
        maxX: x + 0.5,
        minY: y - 0.5,
        maxY: y + 0.5,
        minZ: z - 0.5,
        maxZ: z + 0.5,
        isPlaced: true,
        isCastle: true
    };
    
    scene.add(block);
    worldBlocks.push(block);
}

function removeBlockAt(x, y, z) {
    // Find and remove block at specific coordinates
    for (let i = worldBlocks.length - 1; i >= 0; i--) {
        const block = worldBlocks[i];
        const blockPos = block.position;
        if (Math.abs(blockPos.x - x) < 0.1 &&
            Math.abs(blockPos.y - y) < 0.1 &&
            Math.abs(blockPos.z - z) < 0.1) {
            scene.remove(block);
            worldBlocks.splice(i, 1);
            break;
        }
    }
}

// Make castle builder functions globally accessible
window.buildCastleAtCurrentLocation = buildCastleAtCurrentLocation;
window.buildCastleAtCoords = buildCastleAtCoords;

// ========================================
// VOID TRAP SYSTEM
// ========================================

function checkIfPlayerInVoid() {
    const playerPos = playerState.position;
    const playerBox = {
        minX: playerPos.x + playerBody.minX,
        maxX: playerPos.x + playerBody.maxX,
        minY: playerPos.y + playerBody.minY,
        maxY: playerPos.y + playerBody.maxY,
        minZ: playerPos.z + playerBody.minZ,
        maxZ: playerPos.z + playerBody.maxZ
    };
    
    // Check if player's bounding box intersects with any void block
    for (let block of worldBlocks) {
        const blockData = block.userData;
        if (!blockData || !blockData.isVoid) continue;
        if (!block.visible) continue;
        
        // Check if player box overlaps with void block
        if (playerBox.maxX > blockData.minX &&
            playerBox.minX < blockData.maxX &&
            playerBox.maxY > blockData.minY &&
            playerBox.minY < blockData.maxY &&
            playerBox.maxZ > blockData.minZ &&
            playerBox.minZ < blockData.maxZ) {
            return true; // Player is in a void
        }
    }
    
    return false;
}

function checkIfMonsterInVoid(monster) {
    if (!monster || !monster.userData) return false;
    
    const monsterPos = monster.position;
    const monsterData = monster.userData;
    
    // Estimate monster bounding box (monsters have size stored in userData or we can estimate)
    const monsterSize = monsterData.size || 0.8; // Default size
    const monsterBox = {
        minX: monsterPos.x - monsterSize / 2,
        maxX: monsterPos.x + monsterSize / 2,
        minY: monsterPos.y - monsterSize / 2,
        maxY: monsterPos.y + monsterSize * 1.2, // Monsters are taller
        minZ: monsterPos.z - monsterSize / 2,
        maxZ: monsterPos.z + monsterSize / 2
    };
    
    // Check if monster's bounding box intersects with any void block
    for (let block of worldBlocks) {
        const blockData = block.userData;
        if (!blockData || !blockData.isVoid) continue;
        if (!block.visible) continue;
        
        // Check if monster box overlaps with void block
        if (monsterBox.maxX > blockData.minX &&
            monsterBox.minX < blockData.maxX &&
            monsterBox.maxY > blockData.minY &&
            monsterBox.minY < blockData.maxY &&
            monsterBox.maxZ > blockData.minZ &&
            monsterBox.minZ < blockData.maxZ) {
            return true; // Monster is in a void
        }
    }
    
    return false;
}

function handleVoidTrap() {
    const isInVoid = checkIfPlayerInVoid();
    
    if (isInVoid) {
        // Player is in a void
        if (!playerState.isStuckInVoid) {
            // Just entered void
            playerState.isStuckInVoid = true;
            updateVoidTrapUI();
        }
        
        // Movement prevention is handled in updatePlayer()
    } else {
        // Player is not in void anymore
        if (playerState.isStuckInVoid) {
            playerState.isStuckInVoid = false;
            updateVoidTrapUI();
        }
    }
}

function updateVoidTrapUI() {
    const voidTrapStatus = document.getElementById('void-trap-status');
    if (voidTrapStatus) {
        if (playerState.isStuckInVoid) {
            if (playerState.hasVoidEscapePowerup) {
                voidTrapStatus.textContent = '⚠️ Stuck in Void - Move to use escape powerup!';
                voidTrapStatus.style.color = '#ffaa00';
            } else {
                voidTrapStatus.textContent = '💀 STUCK IN VOID FOREVER!';
                voidTrapStatus.style.color = '#ff0000';
            }
            voidTrapStatus.style.display = 'block';
        } else {
            if (playerState.hasVoidEscapePowerup) {
                voidTrapStatus.textContent = '✨ Void Escape Powerup Ready';
                voidTrapStatus.style.color = '#00ff00';
                voidTrapStatus.style.display = 'block';
            } else {
                voidTrapStatus.style.display = 'none';
            }
        }
    }
}

// ========================================
// COLLISION DETECTION
// ========================================

function checkCollision(newX, newY, newZ) {
    // If player is in blue sky, don't check for collisions (they fall through)
    if (isInBlueSky(newY)) {
        return null;
    }
    
    const playerBox = {
        minX: newX + playerBody.minX,
        maxX: newX + playerBody.maxX,
        minY: newY + playerBody.minY,
        maxY: newY + playerBody.maxY,
        minZ: newZ + playerBody.minZ,
        maxZ: newZ + playerBody.maxZ
    };
    
    for (let block of worldBlocks) {
        const blockData = block.userData;
        
        // Skip broken blocks and voids
        if (!blockData || !blockData.isBlock || blockData.isVoid || !block.visible) continue;
        
        // Skip blocks that are in blue sky area (above FALL_THROUGH_HEIGHT)
        if (blockData.maxY > FALL_THROUGH_HEIGHT) {
            continue; // Don't collide with blocks in blue sky
        }
        
        // Check if boxes overlap
        if (playerBox.maxX > blockData.minX &&
            playerBox.minX < blockData.maxX &&
            playerBox.maxY > blockData.minY &&
            playerBox.minY < blockData.maxY &&
            playerBox.maxZ > blockData.minZ &&
            playerBox.minZ < blockData.maxZ) {
            return blockData;
        }
    }
    
    return null;
}

function checkMonsterBlockCollision(monsterX, monsterY, monsterZ, monsterSize) {
    // Simplified collision check - only check for blocks that would block horizontal movement
    // Monsters can walk on ground blocks, we only care about walls/obstacles
    
    const monsterRadius = monsterSize / 2;
    const monsterHeight = monsterSize * 1.2;
    const monsterBottom = monsterY - 0.5; // Monsters are positioned at groundHeight + 0.5
    
    // Check collision with all blocks
    for (let block of worldBlocks) {
        const blockData = block.userData;
        
        // Skip broken blocks and voids
        if (!blockData || !blockData.isBlock || blockData.isVoid || !block.visible) continue;
        
        // Check horizontal overlap first (X and Z axes)
        const horizontalOverlap = (monsterX + monsterRadius > blockData.minX &&
                                   monsterX - monsterRadius < blockData.maxX &&
                                   monsterZ + monsterRadius > blockData.minZ &&
                                   monsterZ - monsterRadius < blockData.maxZ);
        
        if (!horizontalOverlap) {
            continue; // No horizontal overlap, skip this block
        }
        
        // Now check if this block would actually block the monster
        // Ignore blocks that are clearly below (monster is standing on them)
        // A block is "below" if its top is at or below the monster's feet
        if (blockData.maxY <= monsterBottom + 0.2) {
            continue; // Block is at or below monster's feet - can walk on it
        }
        
        // Ignore blocks that are clearly above (monster can walk under them if tall enough)
        if (blockData.minY > monsterY + monsterHeight - 0.2) {
            continue; // Block is above monster - can walk under it
        }
        
        // This block would block the monster's movement (it's in the way horizontally and vertically)
        return true;
    }
    
    return false; // No collision
}

function getMonsterGroundHeight(x, z, currentY = -1) {
    // Simple ground height for monsters - find the highest block at this X,Z position
    // If in blue sky, find ground on next layer below
    if (currentY > FALL_THROUGH_HEIGHT) {
        const nextLayer = getNextWorldLayerBelow(currentY);
        let maxHeight = nextLayer;
        
        for (let block of worldBlocks) {
            const blockData = block.userData;
            if (!blockData || !blockData.isBlock || blockData.isVoid || !block.visible) continue;
            if (blockData.worldLayer !== nextLayer && blockData.worldLayer !== undefined) continue;
            
            if (x >= blockData.minX && x <= blockData.maxX &&
                z >= blockData.minZ && z <= blockData.maxZ) {
                if (blockData.maxY > maxHeight) {
                    maxHeight = blockData.maxY;
                }
            }
        }
        return maxHeight;
    }
    
    let maxHeight = -1; // Default ground level
    
    for (let block of worldBlocks) {
        const blockData = block.userData;
        if (!blockData || !blockData.isBlock || blockData.isVoid || !block.visible) continue;
        
        // Check if this position is over this block
        if (x >= blockData.minX && x <= blockData.maxX &&
            z >= blockData.minZ && z <= blockData.maxZ) {
            if (blockData.maxY > maxHeight) {
                maxHeight = blockData.maxY;
            }
        }
    }
    
    return maxHeight;
}

function getNextWorldLayerBelow(currentY) {
    // Find the next world layer below the current Y position
    // Sort layers descending and find first one below currentY
    const sortedLayers = [...worldLayers].sort((a, b) => b - a); // Descending
    for (let layerY of sortedLayers) {
        if (layerY < currentY) {
            return layerY;
        }
    }
    return sortedLayers[sortedLayers.length - 1]; // Return lowest layer if none found
}

function isInBlueSky(y) {
    // Blue sky is above FALL_THROUGH_HEIGHT - you fall through it
    const result = y > FALL_THROUGH_HEIGHT;
    // Debug occasionally
    if (result && Math.random() < 0.05) {
        console.log('isInBlueSky check: Y=', y.toFixed(2), '>', FALL_THROUGH_HEIGHT, '=', result);
    }
    return result;
}

function getGroundHeight(x, z, currentY, allowStepUp = false) {
    // If in blue sky, return null/undefined to indicate no ground (don't land on anything)
    if (isInBlueSky(currentY)) {
        return null; // No ground in blue sky - player falls through
    }
    
    let maxHeight = null; // No ground found yet (null means no ground/air)
    
    // Maximum step-up height - player can only step up this much when allowStepUp is true
    const maxStepHeight = 0.5;
    
    for (let block of worldBlocks) {
        const blockData = block.userData;
        
        // Skip broken blocks and voids
        if (!blockData || !blockData.isBlock || blockData.isVoid || !block.visible) continue;
        
        // Skip blocks that are in blue sky area (above FALL_THROUGH_HEIGHT)
        if (blockData.maxY > FALL_THROUGH_HEIGHT) {
            continue; // Don't consider blocks in blue sky as ground
        }
        
        // Check if player is above this block
        if (x + playerBody.minX < blockData.maxX &&
            x + playerBody.maxX > blockData.minX &&
            z + playerBody.minZ < blockData.maxZ &&
            z + playerBody.maxZ > blockData.minZ) {
            
            const playerBottom = currentY + playerBody.minY;
            const blockTop = blockData.maxY;
            
            // Only consider blocks that are:
            // 1. At or below the player's current bottom (can stand on)
            // 2. Or within step-up distance ONLY if allowStepUp is true (can step onto)
            if (blockTop <= playerBottom) {
                // Block is below player - can stand on it
                if (maxHeight === null || blockTop > maxHeight) {
                    maxHeight = blockTop;
                }
            } else if (allowStepUp && blockTop <= playerBottom + maxStepHeight) {
                // Block is within step-up distance - only if explicitly allowed
                if (maxHeight === null || blockTop > maxHeight) {
                    maxHeight = blockTop;
                }
            }
        }
    }
    
    // Return null if no ground found (air/blue sky), or the max height if found
    return maxHeight;
}

function getGroundHeightOnLayer(x, z, layerY) {
    // Get ground height on a specific world layer
    let maxHeight = layerY; // Default to layer height
    
    for (let block of worldBlocks) {
        const blockData = block.userData;
        if (!blockData || !blockData.isBlock || blockData.isVoid || !block.visible) continue;
        if (blockData.worldLayer !== layerY && blockData.worldLayer !== undefined) continue; // Only check blocks on this layer
        
        // Check if position is over this block
        if (x + playerBody.minX < blockData.maxX &&
            x + playerBody.maxX > blockData.minX &&
            z + playerBody.minZ < blockData.maxZ &&
            z + playerBody.maxZ > blockData.minZ) {
            
            const blockTop = blockData.maxY;
            if (blockTop > maxHeight) {
                maxHeight = blockTop;
            }
        }
    }
    
    return maxHeight;
}

// ========================================
// UI FUNCTIONS
// ========================================

function updatePlayerHealthUI() {
    const healthPercent = Math.max(0, playerState.health / playerState.maxHealth);
    const healthBarFill = document.getElementById('health-bar-fill');
    const healthText = document.getElementById('health-text');
    
    if (healthBarFill) {
        healthBarFill.style.width = `${healthPercent * 100}%`;
        healthBarFill.style.background = healthPercent > 0.5 
            ? 'linear-gradient(to right, #4CAF50, #8BC34A)'
            : healthPercent > 0.25
            ? 'linear-gradient(to right, #ff9800, #ffc107)'
            : 'linear-gradient(to right, #f44336, #ff5722)';
    }
    
    if (healthText) {
        healthText.textContent = `${Math.max(0, Math.ceil(playerState.health))} / ${playerState.maxHealth}`;
    }
}

function updateKillsUI() {
    const killsCounter = document.getElementById('kills-counter');
    if (killsCounter) {
        killsCounter.textContent = `Kills: ${monstersKilled}`;
    }
    
    const finalKills = document.getElementById('final-kills');
    if (finalKills) {
        finalKills.textContent = monstersKilled;
    }
}

function updateMonstersAliveUI() {
    const monstersAlive = document.getElementById('monsters-alive');
    if (monstersAlive) {
        monstersAlive.textContent = `Monsters: ${monsters.length}`;
    }
}

function updateCoinsUI() {
    const coinsCounter = document.getElementById('coins-counter');
    if (coinsCounter) {
        coinsCounter.textContent = `💰 Coins: ${playerState.coins}`;
    }
    // Update shop UI when coins change
    updateShopUI();
}

function updateWoodUI() {
    const woodCounter = document.getElementById('wood-counter');
    if (woodCounter) {
        woodCounter.textContent = `🪵 Wood: ${playerState.wood}`;
    }
    // Update castle builder UI when wood changes
    updateCastleBuilderUI();
}

// ========================================
// SHOP SYSTEM
// ========================================

function toggleShop() {
    shopOpen = !shopOpen;
    const shop = document.getElementById('shop');
    if (shop) {
        shop.style.display = shopOpen ? 'block' : 'none';
        if (shopOpen) {
            updateShopUI();
        }
    }
}

function updateShopUI() {
    if (!shopOpen) return;
    
    // Update upgrade levels
    const healthUpgradeLevel = document.getElementById('health-upgrade-level');
    const attackUpgradeLevel = document.getElementById('attack-upgrade-level');
    const maxHealthDisplay = document.getElementById('max-health-display');
    const attackDamageDisplay = document.getElementById('attack-damage-display');
    
    if (healthUpgradeLevel) {
        healthUpgradeLevel.textContent = playerState.healthUpgradeLevel;
    }
    if (attackUpgradeLevel) {
        attackUpgradeLevel.textContent = playerState.attackUpgradeLevel;
    }
    if (maxHealthDisplay) {
        maxHealthDisplay.textContent = playerState.maxHealth;
    }
    if (attackDamageDisplay) {
        attackDamageDisplay.textContent = playerState.attackDamage;
    }
    
    // Update costs (progressive pricing)
    const healthUpgradeCost = 10 + (playerState.healthUpgradeLevel * 5);
    const attackUpgradeCost = 15 + (playerState.attackUpgradeLevel * 5);
    
    const healthCostEl = document.getElementById('health-upgrade-cost');
    const attackCostEl = document.getElementById('attack-upgrade-cost');
    
    if (healthCostEl) {
        healthCostEl.textContent = healthUpgradeCost;
    }
    if (attackCostEl) {
        attackCostEl.textContent = attackUpgradeCost;
    }
    
    // Update button states (enable/disable based on coins)
    const shopItems = document.querySelectorAll('.shop-item');
    if (shopItems.length >= 4) {
        const healButton = shopItems[0].querySelector('.shop-button');
        const healthButton = shopItems[1].querySelector('.shop-button');
        const attackButton = shopItems[2].querySelector('.shop-button');
        const voidEscapeButton = shopItems[3].querySelector('.shop-button');
        const voidEscapeStatus = document.getElementById('void-escape-status-text');
        
        if (healButton) {
            healButton.disabled = playerState.coins < 5 || playerState.health >= playerState.maxHealth;
        }
        if (healthButton) {
            healthButton.disabled = playerState.coins < healthUpgradeCost;
        }
        if (attackButton) {
            attackButton.disabled = playerState.coins < attackUpgradeCost;
        }
        if (voidEscapeButton) {
            voidEscapeButton.disabled = playerState.coins < 20 || playerState.hasVoidEscapePowerup;
        }
        if (voidEscapeStatus) {
            voidEscapeStatus.textContent = playerState.hasVoidEscapePowerup ? 'Owned' : 'Not owned';
        }
    }
}

function buyHeal() {
    if (playerState.coins < 5) return;
    if (playerState.health >= playerState.maxHealth) return;
    
    playerState.coins -= 5;
    playerState.health = playerState.maxHealth;
    updateCoinsUI();
    updatePlayerHealthUI();
}

function buyHealthUpgrade() {
    const cost = 10 + (playerState.healthUpgradeLevel * 5);
    if (playerState.coins < cost) return;
    
    playerState.coins -= cost;
    playerState.healthUpgradeLevel++;
    playerState.maxHealth += 25;
    playerState.health += 25; // Also heal the new health
    updateCoinsUI();
    updatePlayerHealthUI();
    updateShopUI();
}

function buyAttackUpgrade() {
    const cost = 15 + (playerState.attackUpgradeLevel * 5);
    if (playerState.coins < cost) return;
    
    playerState.coins -= cost;
    playerState.attackUpgradeLevel++;
    playerState.attackDamage += 10;
    updateCoinsUI();
    updateShopUI();
}

function buyVoidEscapePowerup() {
    if (playerState.coins < 20) return;
    if (playerState.hasVoidEscapePowerup) return; // Already have one
    
    playerState.coins -= 20;
    playerState.hasVoidEscapePowerup = true;
    updateCoinsUI();
    updateShopUI();
    updateVoidTrapUI();
}

// Make shop functions globally accessible
window.buyHeal = buyHeal;
window.buyHealthUpgrade = buyHealthUpgrade;
window.buyAttackUpgrade = buyAttackUpgrade;
window.buyVoidEscapePowerup = buyVoidEscapePowerup;

function showGameOver() {
    const gameOver = document.getElementById('game-over');
    if (gameOver) {
        gameOver.style.display = 'block';
    }
}

// ========================================
// INPUT HANDLING
// ========================================

function setupInput() {
    // Make sure canvas can receive focus for keyboard events
    const canvas = document.getElementById('game-canvas');
    canvas.setAttribute('tabindex', '0');
    
    // Focus canvas on any interaction
    canvas.addEventListener('click', () => {
        canvas.focus();
        console.log('Canvas focused - controls should work now!');
    });
    
    // Also focus on page load
    window.addEventListener('load', () => {
        setTimeout(() => canvas.focus(), 100);
    });
    
    // Keyboard events - attach to document AND window to catch all keys
    function handleKeyDown(event) {
        // Store both key and code for compatibility
        const keyName = event.key;
        const keyCode = event.code;
        
        keys[keyName] = true;
        keys[keyCode] = true;
        
        // Debug: log key presses (helpful for debugging)
        const activeKeys = Object.keys(keys).filter(k => keys[k] === true);
        console.log('Key pressed:', keyName, keyCode, 'Active keys:', activeKeys);
        
        // Handle attack
        if (keyName === ' ' || keyName === 'Space' || keyCode === 'Space') {
            event.preventDefault();
            event.stopPropagation();
            console.log('ATTACK triggered!');
            attackMonsters();
            return;
        }
        
        // Handle directional jumps (Shift + Arrow)
        if (event.shiftKey && (keyName.includes('Arrow') || keyCode.includes('Arrow'))) {
            event.preventDefault();
            event.stopPropagation();
            console.log('JUMP triggered:', keyName);
            handleDirectionalJump(keyName);
            return;
        }
        
        // Handle shop toggle (B key)
        if (keyName === 'b' || keyName === 'B' || keyCode === 'KeyB') {
            event.preventDefault();
            event.stopPropagation();
            toggleShop();
            return;
        }
        
        // Handle building (E key)
        if (keyName === 'e' || keyName === 'E' || keyCode === 'KeyE') {
            event.preventDefault();
            event.stopPropagation();
            tryPlaceBlock();
            return;
        }
        
        // Handle castle builder toggle (C key)
        if (keyName === 'c' || keyName === 'C' || keyCode === 'KeyC') {
            event.preventDefault();
            event.stopPropagation();
            toggleCastleBuilder();
            return;
        }
    }
    
    function handleKeyUp(event) {
        keys[event.key] = false;
        keys[event.code] = false;
    }
    
    // Add listeners to multiple targets
    document.addEventListener('keydown', handleKeyDown, true);
    window.addEventListener('keydown', handleKeyDown, true);
    canvas.addEventListener('keydown', handleKeyDown, true);
    
    document.addEventListener('keyup', handleKeyUp, true);
    window.addEventListener('keyup', handleKeyUp, true);
    canvas.addEventListener('keyup', handleKeyUp, true);
    
    // Mouse events for camera control
    window.addEventListener('mousedown', (event) => {
        isMouseDown = true;
        mouseX = event.clientX;
        mouseY = event.clientY;
    });
    
    window.addEventListener('mouseup', () => {
        isMouseDown = false;
    });
    
    window.addEventListener('mousemove', (event) => {
        if (isMouseDown) {
            const deltaX = event.clientX - mouseX;
            const deltaY = event.clientY - mouseY;
            
            // Rotate camera around player
            const angleX = deltaX * 0.005;
            const angleY = deltaY * 0.005;
            
            // Rotate camera horizontally
            const cameraDistance = 10;
            const cameraAngle = Math.atan2(
                camera.position.x - player.position.x,
                camera.position.z - player.position.z
            ) + angleX;
            
            camera.position.x = player.position.x + Math.sin(cameraAngle) * cameraDistance;
            camera.position.z = player.position.z + Math.cos(cameraAngle) * cameraDistance;
            
            // Adjust camera height
            camera.position.y = Math.max(3, Math.min(15, camera.position.y - angleY * 10));
            camera.lookAt(player.position);
            
            mouseX = event.clientX;
            mouseY = event.clientY;
        }
    });
}

function handleDirectionalJump(key) {
    if (!playerState.isOnGround) return; // Can't jump in air
    
    const jumpStrength = playerState.jumpPower;
    
    // Determine jump direction based on camera angle
    const cameraAngle = Math.atan2(
        camera.position.x - player.position.x,
        camera.position.z - player.position.z
    );
    
    // Handle different key name formats
    if (key === 'ArrowUp' || key === 'Up' || key === 'KeyW') {
        // Jump forward (away from camera)
        playerState.velocity.x = -Math.sin(cameraAngle) * jumpStrength;
        playerState.velocity.z = -Math.cos(cameraAngle) * jumpStrength;
        playerState.velocity.y = jumpStrength * 1.5;
    } else if (key === 'ArrowDown' || key === 'Down' || key === 'KeyS') {
        // Jump backward (toward camera)
        playerState.velocity.x = Math.sin(cameraAngle) * jumpStrength;
        playerState.velocity.z = Math.cos(cameraAngle) * jumpStrength;
        playerState.velocity.y = jumpStrength * 1.5;
    } else if (key === 'ArrowLeft' || key === 'Left' || key === 'KeyA') {
        // Jump left
        playerState.velocity.x = Math.sin(cameraAngle - Math.PI / 2) * jumpStrength;
        playerState.velocity.z = Math.cos(cameraAngle - Math.PI / 2) * jumpStrength;
        playerState.velocity.y = jumpStrength * 1.5;
    } else if (key === 'ArrowRight' || key === 'Right' || key === 'KeyD') {
        // Jump right
        playerState.velocity.x = Math.sin(cameraAngle + Math.PI / 2) * jumpStrength;
        playerState.velocity.z = Math.cos(cameraAngle + Math.PI / 2) * jumpStrength;
        playerState.velocity.y = jumpStrength * 1.5;
    }
    
    playerState.isOnGround = false;
}

// ========================================
// PHYSICS AND MOVEMENT
// ========================================

function updatePlayer() {
    // Check for void trap first
    const wasInVoid = playerState.isStuckInVoid;
    handleVoidTrap();
    
    // If stuck in void without powerup, prevent all movement
    if (playerState.isStuckInVoid && !playerState.hasVoidEscapePowerup) {
        // Player is stuck - zero out all movement
        playerState.velocity.x = 0;
        playerState.velocity.z = 0;
        playerState.velocity.y = 0;
        return; // Exit early - no movement allowed
    }
    
    // If player has powerup and is in void, check if they're trying to move to escape
    if (playerState.isStuckInVoid && playerState.hasVoidEscapePowerup) {
        // Check if player is pressing movement keys
        const shiftPressed = keys['Shift'] || keys['ShiftLeft'] || keys['ShiftRight'];
        const upPressed = keys['ArrowUp'] || keys['Up'] || keys['w'] || keys['W'] || keys['KeyW'];
        const downPressed = keys['ArrowDown'] || keys['Down'] || keys['s'] || keys['S'] || keys['KeyS'];
        const leftPressed = keys['ArrowLeft'] || keys['Left'] || keys['a'] || keys['A'] || keys['KeyA'];
        const rightPressed = keys['ArrowRight'] || keys['Right'] || keys['d'] || keys['D'] || keys['KeyD'];
        
        if (upPressed || downPressed || leftPressed || rightPressed || shiftPressed) {
            // Player is trying to move - use powerup to escape
            playerState.hasVoidEscapePowerup = false;
            playerState.isStuckInVoid = false;
            updateVoidTrapUI();
            console.log('Used void escape powerup!');
        }
    }
    
    // Get camera angle for movement direction
    const cameraAngle = Math.atan2(
        camera.position.x - player.position.x,
        camera.position.z - player.position.z
    );
    
    // Handle movement (Arrow keys only, no Shift)
    // Check multiple possible key names - be very explicit
    const shiftPressed = keys['Shift'] || keys['ShiftLeft'] || keys['ShiftRight'];
    
    if (!shiftPressed) {
        // Check all possible key names for each direction
        const upPressed = keys['ArrowUp'] || keys['Up'] || keys['w'] || keys['W'] || keys['KeyW'] || keys['ArrowUp'] === true;
        const downPressed = keys['ArrowDown'] || keys['Down'] || keys['s'] || keys['S'] || keys['KeyS'] || keys['ArrowDown'] === true;
        const leftPressed = keys['ArrowLeft'] || keys['Left'] || keys['a'] || keys['A'] || keys['KeyA'] || keys['ArrowLeft'] === true;
        const rightPressed = keys['ArrowRight'] || keys['Right'] || keys['d'] || keys['D'] || keys['KeyD'] || keys['ArrowRight'] === true;
        
        if (upPressed) {
            // Move forward (away from camera, in the direction player is facing)
            playerState.velocity.x -= Math.sin(cameraAngle) * playerState.moveSpeed;
            playerState.velocity.z -= Math.cos(cameraAngle) * playerState.moveSpeed;
        }
        if (downPressed) {
            // Move backward (toward camera)
            playerState.velocity.x += Math.sin(cameraAngle) * playerState.moveSpeed;
            playerState.velocity.z += Math.cos(cameraAngle) * playerState.moveSpeed;
        }
        if (leftPressed) {
            playerState.velocity.x += Math.sin(cameraAngle - Math.PI / 2) * playerState.moveSpeed;
            playerState.velocity.z += Math.cos(cameraAngle - Math.PI / 2) * playerState.moveSpeed;
        }
        if (rightPressed) {
            playerState.velocity.x += Math.sin(cameraAngle + Math.PI / 2) * playerState.moveSpeed;
            playerState.velocity.z += Math.cos(cameraAngle + Math.PI / 2) * playerState.moveSpeed;
        }
        
        // Debug: log if keys are pressed but player isn't moving
        if (upPressed || downPressed || leftPressed || rightPressed) {
            const activeKeys = Object.keys(keys).filter(k => keys[k] === true);
            if (activeKeys.length > 0 && Math.abs(playerState.velocity.x) < 0.001 && Math.abs(playerState.velocity.z) < 0.001) {
                console.log('Keys pressed but no movement:', activeKeys);
            }
        }
    }
    
    // Check if player is in blue sky FIRST - if so, skip all collision checks and just fall
    const isCurrentlyInBlueSky = isInBlueSky(playerState.position.y);
    
    // Apply friction to horizontal movement
    playerState.velocity.x *= 0.9;
    playerState.velocity.z *= 0.9;
    
    // Apply gravity (always apply in blue sky, or if not on ground)
    if (isCurrentlyInBlueSky || !playerState.isOnGround) {
        playerState.velocity.y += playerState.gravity;
    }
    
    // Calculate new position
    let newX = playerState.position.x + playerState.velocity.x;
    let newY = playerState.position.y + playerState.velocity.y;
    let newZ = playerState.position.z + playerState.velocity.z;
    
    // If in blue sky, skip all collision checks and just fall through
    if (isCurrentlyInBlueSky || isInBlueSky(newY)) {
        // In blue sky - no collision checks, just fall
        playerState.isOnGround = false;
        
        // Debug: log when in blue sky (more frequent)
        if (Math.random() < 0.1) {
            console.log('In blue sky! Y:', newY.toFixed(2), 'Falling to layer:', getNextWorldLayerBelow(newY), 'Ground height:', getGroundHeightOnLayer(newX, newZ, getNextWorldLayerBelow(newY)).toFixed(2));
        }
        
            // Check if we've reached a lower world layer to land on
        const nextLayer = getNextWorldLayerBelow(newY);
        const groundHeightOnLayer = getGroundHeightOnLayer(newX, newZ, nextLayer);
        
        // If we've fallen to or past the layer, land on it
        // Make sure we're actually below the layer before landing
        // Only land if we're close to or below the ground height on that layer
        if (newY < nextLayer + 10) {
            // We're approaching a lower layer
            if (newY <= groundHeightOnLayer + 1) {
                // Land on the ground/platform
                newY = groundHeightOnLayer - playerBody.minY + 0.1;
                playerState.velocity.y = 0;
                playerState.isOnGround = true;
            }
            // Otherwise keep falling
        }
        // Otherwise, keep falling (don't check for ground collision)
        
        // Update position and return early - skip all other collision checks
        playerState.position.x = newX;
        playerState.position.y = newY;
        playerState.position.z = newZ;
        player.position.copy(playerState.position);
        
        // Update camera
        const cameraAngle = Math.atan2(
            camera.position.x - player.position.x,
            camera.position.z - player.position.z
        );
        const cameraDistance = 10;
        const cameraHeight = 8;
        camera.position.x = player.position.x + Math.sin(cameraAngle) * cameraDistance;
        camera.position.z = player.position.z + Math.cos(cameraAngle) * cameraDistance;
        camera.position.y = player.position.y + cameraHeight;
        camera.lookAt(player.position);
        return; // Exit early - no more collision checks needed
    }
    
    // Maximum step-up height - player can only step up this much
    const maxStepHeight = 0.5;
    const playerBottom = playerState.position.y + playerBody.minY;
    
    // Check if there's a block at the destination that would prevent movement
    // Check collision with new X position
    const collisionX = checkCollision(newX, playerState.position.y, playerState.position.z);
    if (collisionX) {
        const blockTop = collisionX.maxY;
        const blockBottom = collisionX.minY;
        const playerTop = playerBottom + (playerBody.maxY - playerBody.minY);
        
        // Check what type of collision this is
        if (blockTop > playerBottom + maxStepHeight && blockBottom < playerTop) {
            // Block is too high to step onto and blocks player - prevent horizontal movement
            newX = playerState.position.x;
            playerState.velocity.x = 0;
        } else if (blockBottom > playerTop) {
            // Block is completely above player - allow movement (ceiling)
        } else if (blockTop <= playerBottom + maxStepHeight && blockBottom <= playerBottom) {
            // Block is low enough to step on - but don't auto-step-up, just allow movement
            // The ground height check will handle placement
        } else {
            // Block is in the way horizontally - stop movement
            newX = playerState.position.x;
            playerState.velocity.x = 0;
        }
    }
    
    // Check collision with new Z position
    const collisionZ = checkCollision(playerState.position.x, playerState.position.y, newZ);
    if (collisionZ) {
        const blockTop = collisionZ.maxY;
        const blockBottom = collisionZ.minY;
        const playerTop = playerBottom + (playerBody.maxY - playerBody.minY);
        
        // Same logic as X collision
        if (blockTop > playerBottom + maxStepHeight && blockBottom < playerTop) {
            // Block is too high to step onto and blocks player - prevent horizontal movement
            newZ = playerState.position.z;
            playerState.velocity.z = 0;
        } else if (blockBottom > playerTop) {
            // Block is completely above player - allow movement (ceiling)
        } else if (blockTop <= playerBottom + maxStepHeight && blockBottom <= playerBottom) {
            // Block is low enough to step on - but don't auto-step-up, just allow movement
        } else {
            // Block is in the way horizontally - stop movement
            newZ = playerState.position.z;
            playerState.velocity.z = 0;
        }
    }
    
    // CRITICAL: Prevent walking onto platforms from the side
    // Check the ground height at the destination BEFORE moving (don't allow step-up)
    // Skip this check if in blue sky (already handled above)
    if (!isCurrentlyInBlueSky && !isInBlueSky(newY)) {
        const destinationGroundHeight = getGroundHeight(newX, newZ, playerState.position.y, false);
        const currentGroundHeight = getGroundHeight(playerState.position.x, playerState.position.z, playerState.position.y, false);
        
        // Only check if both ground heights are valid (not null/blue sky)
        if (destinationGroundHeight !== null && currentGroundHeight !== null) {
            // If destination has a platform that's higher than current position, prevent horizontal movement
            // This prevents walking onto platforms - you MUST jump to reach them
            if (playerState.isOnGround && Math.abs(playerState.velocity.y) < 0.01) {
                // Only check if we're on the ground and not jumping/falling
                if (destinationGroundHeight > currentGroundHeight + 0.01) {
                    // Destination is higher - this is a platform we can't walk onto
                    // Reset horizontal movement to prevent stepping up
                    newX = playerState.position.x;
                    newZ = playerState.position.z;
                    playerState.velocity.x = 0;
                    playerState.velocity.z = 0;
                }
            }
        }
    }
    
    // Check collision with new Y position FIRST (before ground check)
    const collisionY = checkCollision(newX, newY, newZ);
    if (collisionY) {
        // If moving up and hit ceiling, stop upward velocity
        if (playerState.velocity.y > 0) {
            playerState.velocity.y = 0;
            newY = playerState.position.y;
        }
        // If falling and hit platform, land on it (from above only)
        else if (playerState.velocity.y < 0) {
            newY = collisionY.maxY - playerBody.minY + 0.01;
            playerState.velocity.y = 0;
            playerState.isOnGround = true;
        }
        // If moving horizontally and hit a wall/platform, prevent walking through
        else if (playerState.velocity.y === 0 && Math.abs(playerState.velocity.x) + Math.abs(playerState.velocity.z) > 0) {
            // Check if trying to walk into a block from the side
            const playerBottom = newY + playerBody.minY;
            const blockTop = collisionY.maxY;
            
            // If block is above player's feet, prevent walking onto it
            if (blockTop > playerBottom + 0.5) {
                // This is a wall/platform - stop horizontal movement
                newX = playerState.position.x;
                newZ = playerState.position.z;
                playerState.velocity.x = 0;
                playerState.velocity.z = 0;
            }
        }
    }
    
    // Check ground collision and apply gravity (only if not in blue sky - that's handled above)
    // Only check for ground at or below current position (no stepping up)
    const groundHeight = getGroundHeight(newX, newZ, playerState.position.y, false);
    
    // If no ground found (null), player is in air - keep falling
    if (groundHeight === null) {
        playerState.isOnGround = false;
        // Keep falling - don't try to land on anything
    } else {
        // Ground found - check if we should land on it
        const playerBottomAfterGravity = newY + playerBody.minY;
        const currentPlayerBottom = playerState.position.y + playerBody.minY;
        
        // Only land on ground if:
        // 1. We're falling down (negative velocity) OR already on ground at same level
        // 2. The ground is at or below our current bottom position
        if (playerState.velocity.y <= 0 && playerBottomAfterGravity <= groundHeight + 0.1) {
            const heightDifference = groundHeight - currentPlayerBottom;
        
        // Allow landing only if:
        // - Falling down onto it (negative Y velocity) - can land on platforms
        // - Or already standing on it (very small height difference) - stay on ground
        if (playerState.velocity.y < 0) {
            // Falling - can land on any surface below (including platforms)
            newY = groundHeight - playerBody.minY + 0.1;
            playerState.velocity.y = 0;
            playerState.isOnGround = true;
        } else if (Math.abs(heightDifference) < 0.1 && playerState.isOnGround) {
            // Already on this surface - stay on it (ground level only)
            newY = groundHeight - playerBody.minY + 0.1;
            playerState.velocity.y = 0;
            playerState.isOnGround = true;
        } else if (heightDifference > 0) {
            // Trying to step up - NOT ALLOWED, stay at current height
            playerState.isOnGround = false;
        }
        } else {
            playerState.isOnGround = false;
        }
    }
    
    // Update position
    playerState.position.x = newX;
    playerState.position.y = newY;
    playerState.position.z = newZ;
    
    // Update player mesh position
    player.position.copy(playerState.position);
    
    // Update camera to follow player
    const cameraDistance = 10;
    const cameraHeight = 8;
    camera.position.x = player.position.x + Math.sin(cameraAngle) * cameraDistance;
    camera.position.z = player.position.z + Math.cos(cameraAngle) * cameraDistance;
    camera.position.y = player.position.y + cameraHeight;
    camera.lookAt(player.position);
}

// ========================================
// ANIMATION LOOP
// ========================================

function animate(time) {
    requestAnimationFrame(animate);
    
    // Calculate delta time
    const currentTime = time / 1000; // Convert to seconds
    const deltaTime = lastTime ? currentTime - lastTime : 0.016; // ~60fps default
    lastTime = currentTime;
    
    // Update attack cooldown
    if (attackCooldown > 0) {
        attackCooldown -= deltaTime;
        if (attackCooldown < 0) attackCooldown = 0;
    }
    
    // Update game time
    gameTime += deltaTime;
    
    // Spawn monsters periodically (harder: faster spawns and higher cap)
    monsterSpawnTimer += deltaTime;
    const spawnInterval = Math.max(2, 6 - (monstersKilled * 0.15)); // Faster spawns as you kill more
    const maxMonsters = 20; // More monsters chasing you!
    if (monsterSpawnTimer >= spawnInterval && monsters.length < maxMonsters) {
        spawnMonster();
        monsterSpawnTimer = 0;
    }
    
    // Update player physics and movement
    updatePlayer();
    
    // Update monsters
    updateMonsters(deltaTime);
    
    // Update coins
    updateCoins(deltaTime);
    
    // Update UI
    updateMonstersAliveUI();
    
    // Update debug panel
    updateDebugPanel();
    
    // Render the scene
    renderer.render(scene, camera);
}

function updateDebugPanel() {
    const activeKeys = Object.keys(keys).filter(k => keys[k] === true);
    const keysEl = document.getElementById('debug-keys');
    const posEl = document.getElementById('debug-pos');
    const velEl = document.getElementById('debug-vel');
    
    if (keysEl) {
        keysEl.textContent = activeKeys.length > 0 ? activeKeys.join(', ') : 'None';
    }
    if (posEl && playerState.position) {
        posEl.textContent = `${playerState.position.x.toFixed(1)}, ${playerState.position.y.toFixed(1)}, ${playerState.position.z.toFixed(1)}`;
    }
    if (velEl && playerState.velocity) {
        velEl.textContent = `${playerState.velocity.x.toFixed(2)}, ${playerState.velocity.y.toFixed(2)}, ${playerState.velocity.z.toFixed(2)}`;
    }
}

// ========================================
// UTILITY FUNCTIONS
// ========================================

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

// ========================================
// INITIALIZATION
// ========================================

function init() {
    initScene();
    createPlayer();
    createWorld();
    setupInput();
    
    // Set initial camera position to look at player
    const cameraDistance = 10;
    const cameraHeight = 8;
    const initialCameraAngle = 0; // Start looking from positive Z direction
    camera.position.set(
        playerState.position.x + Math.sin(initialCameraAngle) * cameraDistance,
        playerState.position.y + cameraHeight,
        playerState.position.z + Math.cos(initialCameraAngle) * cameraDistance
    );
    camera.lookAt(playerState.position.x, playerState.position.y, playerState.position.z);
    
    // Force an initial render to make sure everything is visible
    renderer.render(scene, camera);
    
    // Initialize UI
    updatePlayerHealthUI();
    updateKillsUI();
    updateMonstersAliveUI();
    updateCoinsUI();
    updateWoodUI();
    updateVoidTrapUI();
    
    // Spawn initial monsters (more monsters chasing you!)
    for (let i = 0; i < 6; i++) {
        setTimeout(() => spawnMonster(), i * 800);
    }
    
    // Create coins with high-level guardian monsters scattered across the world
    const coinLocations = [
        { x: 20, z: 20 },
        { x: -20, z: 20 },
        { x: 20, z: -20 },
        { x: -20, z: -20 },
        { x: 30, z: 10 },
        { x: -30, z: -10 },
        { x: 10, z: -30 },
        { x: -10, z: 30 }
    ];
    
    coinLocations.forEach(loc => {
        createCoinWithGuardians(loc.x, loc.z);
    });
    
    animate(0);
}

// Start the game when page loads
window.addEventListener('load', init);

