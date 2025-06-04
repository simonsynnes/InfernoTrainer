/**
 * Shadow Wave System
 * 
 * Environmental hazard that travels across the arena:
 * - Pattern: 2 waves after Shadow Crash, 2 after Void Flares, then 4 combined
 * - Travel from south to north across arena
 * - Deal damage to players caught in their path
 * - Can be dodged by moving out of the way
 */

import { Entity, Location, Region, Random, DelayedAction } from '../../sdk';

export class ShadowWave extends Entity {
    private direction: number; // Angle in degrees
    private speed: number = 1; // Tiles per tick
    private damage: number;
    private width: number = 3; // Wave width in tiles
    private hasDealtDamage: Set<string> = new Set(); // Track players already hit
    
    constructor(region: Region, startLocation: Location, direction: number = 0) {
        super(region, startLocation);
        this.direction = direction; // 0 = north, 90 = east, etc.
        this.damage = Random.get() * 15 + 5; // 5-20 damage
        
        console.log(`Shadow Wave created at ${startLocation.x},${startLocation.y}, direction: ${direction}°`);
    }
    
    get size(): number {
        return this.width;
    }
    
    get image(): string {
        // TODO: Use proper wave model when assets are available
        return null; // Use default rendering for now
    }
    
    override get color(): string {
        return "#2F4F4F"; // Dark slate gray for shadow waves
    }
    
    tick(): void {
        super.tick();
        
        // Move wave in specified direction
        this.moveWave();
        
        // Check for player collisions
        this.checkPlayerCollisions();
        
        // Remove if off screen
        if (this.isOffScreen()) {
            this.region.removeEntity(this);
        }
    }
    
    private moveWave(): void {
        const radians = (this.direction * Math.PI) / 180;
        const moveX = Math.cos(radians) * this.speed;
        const moveY = Math.sin(radians) * this.speed;
        
        this.location.x += moveX;
        this.location.y += moveY;
    }
    
    private checkPlayerCollisions(): void {
        this.region.players.forEach(player => {
            const playerId = player.serialNumber || 'player';
            
            // Skip if already hit this player
            if (this.hasDealtDamage.has(playerId)) {
                return;
            }
            
            // Check if player is in wave path
            if (this.isPlayerInWavePath(player)) {
                console.log(`Shadow Wave hits ${player.mobName()} for ${this.damage} damage`);
                
                // TODO: Apply damage
                // player.takeDamage(this.damage, 'magic');
                
                // Mark this player as hit
                this.hasDealtDamage.add(playerId);
            }
        });
    }
    
    private isPlayerInWavePath(player: any): boolean {
        // Calculate if player is within the wave's path
        const playerX = player.location.x;
        const playerY = player.location.y;
        
        // Simple rectangular collision for now
        // TODO: Improve with proper wave shape collision
        const halfWidth = this.width / 2;
        
        return (
            playerX >= this.location.x - halfWidth &&
            playerX <= this.location.x + halfWidth &&
            playerY >= this.location.y - halfWidth &&
            playerY <= this.location.y + halfWidth
        );
    }
    
    private isOffScreen(): boolean {
        // Check if wave has moved completely off the arena
        return (
            this.location.x < -5 ||
            this.location.x > this.region.width + 5 ||
            this.location.y < -5 ||
            this.location.y > this.region.height + 5
        );
    }
}

/**
 * Shadow Wave Pattern Controller
 * 
 * Manages the complex shadow wave patterns:
 * - 2 waves after Shadow Crash
 * - 2 waves after Void Flares
 * - 4 waves combined with Shadow Crash + auto-attack
 */
export class ShadowWavePattern {
    private region: Region;
    private currentPhase: 'post-crash' | 'post-flare' | 'combined' = 'post-crash';
    private waveCount: number = 0;
    
    constructor(region: Region) {
        this.region = region;
    }
    
    /**
     * Trigger shadow waves after Shadow Crash
     */
    triggerPostCrashWaves(): void {
        this.currentPhase = 'post-crash';
        console.log('Triggering 2 shadow waves after Shadow Crash');
        
        this.spawnWaveSequence(2, 1000); // 2 waves, 1000ms apart
    }
    
    /**
     * Trigger shadow waves after Void Flare spawning
     */
    triggerPostFlareWaves(): void {
        this.currentPhase = 'post-flare';
        console.log('Triggering 2 shadow waves after Void Flare spawn');
        
        this.spawnWaveSequence(2, 1200); // 2 waves, 1200ms apart
    }
    
    /**
     * Trigger combined waves with Shadow Crash and auto-attack
     */
    triggerCombinedWaves(): void {
        this.currentPhase = 'combined';
        console.log('Triggering 4 combined shadow waves with Shadow Crash');
        
        this.spawnWaveSequence(4, 800); // 4 waves, 800ms apart
    }
    
    private spawnWaveSequence(count: number, intervalMs: number): void {
        for (let i = 0; i < count; i++) {
            const delay = Math.floor((i * intervalMs) / 600); // Convert to ticks
            
            DelayedAction.registerDelayedAction(
                new DelayedAction(() => this.spawnSingleWave(i), delay)
            );
        }
    }
    
    private spawnSingleWave(waveIndex: number): void {
        // Spawn waves from south edge moving north
        const startY = this.region.height - 1;
        const startX = 5 + (waveIndex * 4); // Spread waves across arena width
        
        const startLocation = { x: startX, y: startY };
        const wave = new ShadowWave(this.region, startLocation, 270); // 270° = north direction
        
        this.region.addEntity(wave);
        
        this.waveCount++;
        console.log(`Spawned shadow wave #${this.waveCount} at ${startX}, ${startY}`);
    }
    
    /**
     * Get the current wave pattern phase
     */
    getCurrentPhase(): string {
        return this.currentPhase;
    }
    
    /**
     * Reset the pattern for a new cycle
     */
    reset(): void {
        this.currentPhase = 'post-crash';
        this.waveCount = 0;
        console.log('Shadow wave pattern reset');
    }
}

/**
 * Delayed Action for Shadow Wave spawning
 */
export class ShadowWaveAction extends DelayedAction {
    private wavePattern: ShadowWavePattern;
    private actionType: 'post-crash' | 'post-flare' | 'combined';
    
    constructor(region: Region, actionType: 'post-crash' | 'post-flare' | 'combined', delay: number = 1) {
        super(() => this.execute(), delay);
        this.wavePattern = new ShadowWavePattern(region);
        this.actionType = actionType;
    }
    
    execute(): void {
        switch (this.actionType) {
            case 'post-crash':
                this.wavePattern.triggerPostCrashWaves();
                break;
            case 'post-flare':
                this.wavePattern.triggerPostFlareWaves();
                break;
            case 'combined':
                this.wavePattern.triggerCombinedWaves();
                break;
        }
    }
}