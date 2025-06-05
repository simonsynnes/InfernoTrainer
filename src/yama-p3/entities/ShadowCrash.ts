/**
 * Shadow Crash Mechanics
 * 
 * Yama's special attack system:
 * - 3 fireballs in a line centered on player
 * - Side fireballs spawn converging shadows (bowtie pattern)
 * - Performed 3 times: cardinal -> diagonal -> cardinal angles
 * - Up to 20 damage per fireball/shadow explosion
 * - Continues standard attacks during fireball sequence
 */

import { Entity, Location, Region, Random, DelayedAction } from '../../sdk';
import { Projectile } from '../../sdk/weapons/Projectile';
import { Player } from '../../sdk/Player';

export class ShadowCrashFireball extends Entity {
    private willSpawnShadows: boolean;
    private impactLocation: Location;
    private delay: number;
    private damage: number;
    
    constructor(region: Region, startLocation: Location, targetLocation: Location, spawnShadows: boolean = false) {
        super(region, startLocation);
        this.impactLocation = targetLocation;
        this.willSpawnShadows = spawnShadows;
        this.delay = 6; // 6 ticks to impact (3.6 seconds)
        this.damage = Random.get() * 20 + 1; // 1-20 damage
        
        console.log(`Shadow Crash fireball created: ${startLocation.x},${startLocation.y} -> ${targetLocation.x},${targetLocation.y}`);
    }
    
    get size(): number {
        return 1;
    }
    
    get image(): string {
        // TODO: Use proper fireball model when assets are available
        return null; // Use default rendering for now
    }
    
    get color(): string {
        return "#FF4500"; // Orange-red for fireballs
    }
    
    tick(): void {
        super.tick();
        
        this.delay--;
        
        if (this.delay <= 0) {
            this.impact();
        } else {
            // Move fireball toward target
            this.updatePosition();
        }
    }
    
    private updatePosition(): void {
        // Interpolate position from start to target
        const progress = (6 - this.delay) / 6;
        
        // TODO: Implement proper arc trajectory
        this.location.x = Math.floor(this.location.x + (this.impactLocation.x - this.location.x) * progress);
        this.location.y = Math.floor(this.location.y + (this.impactLocation.y - this.location.y) * progress);
    }
    
    private impact(): void {
        console.log(`Shadow Crash fireball impacts at ${this.impactLocation.x},${this.impactLocation.y}`);
        
        // Set final position
        this.location = this.impactLocation;
        
        // Damage any players at impact location
        this.region.players.forEach(player => {
            if (this.isPlayerAtLocation(player, this.impactLocation)) {
                console.log(`Shadow Crash fireball hits player for ${this.damage} damage`);
                this.dealDamageToPlayer(player, this.damage);
            }
        });
        
        // Spawn converging shadows if this is a side fireball
        if (this.willSpawnShadows) {
            this.spawnConvergingShadows();
        }
        
        // Remove this fireball
        this.region.removeEntity(this);
    }
    
    private isPlayerAtLocation(player: any, location: Location): boolean {
        return player.location.x === location.x && player.location.y === location.y;
    }
    
    private dealDamageToPlayer(player: Player, damage: number): void {
        // Create a magic projectile that instantly hits for the damage
        const projectile = new Projectile(
            null, // No weapon source
            damage,
            null, // No attacking unit 
            player,
            'magic',
            {
                setDelay: 0, // Instant damage
                color: '#FF4500' // Orange fireball color
            }
        );
        
        player.addProjectile(projectile);
    }
    
    private spawnConvergingShadows(): void {
        console.log('Spawning converging shadows from side fireball');
        
        // Create shadows in bowtie pattern converging to center fireball location
        const shadowSpawnPoints = this.calculateShadowSpawnPoints();
        
        shadowSpawnPoints.forEach(spawnPoint => {
            const shadow = new ConvergingShadow(this.region, spawnPoint, this.impactLocation);
            this.region.addEntity(shadow);
        });
    }
    
    private calculateShadowSpawnPoints(): Location[] {
        // Calculate spawn points for converging shadows in bowtie pattern
        const baseDistance = 5;
        const points: Location[] = [];
        
        // Four cardinal directions from impact point
        points.push({ x: this.impactLocation.x - baseDistance, y: this.impactLocation.y });
        points.push({ x: this.impactLocation.x + baseDistance, y: this.impactLocation.y });
        points.push({ x: this.impactLocation.x, y: this.impactLocation.y - baseDistance });
        points.push({ x: this.impactLocation.x, y: this.impactLocation.y + baseDistance });
        
        return points;
    }
}

export class ConvergingShadow extends Entity {
    private targetLocation: Location;
    private speed: number = 1;
    private damage: number;
    private hasReachedTarget: boolean = false;
    
    constructor(region: Region, startLocation: Location, targetLocation: Location) {
        super(region, startLocation);
        this.targetLocation = targetLocation;
        this.damage = Random.get() * 20 + 1; // 1-20 damage
        
        console.log(`Converging shadow created: ${startLocation.x},${startLocation.y} -> ${targetLocation.x},${targetLocation.y}`);
    }
    
    get size(): number {
        return 1;
    }
    
    get image(): string {
        // TODO: Use proper shadow model when assets are available
        return null; // Use default rendering for now
    }
    
    get color(): string {
        return "#4B0082"; // Dark purple for shadows
    }
    
    tick(): void {
        super.tick();
        
        if (!this.hasReachedTarget) {
            this.moveTowardTarget();
        }
    }
    
    private moveTowardTarget(): void {
        const dx = this.targetLocation.x - this.location.x;
        const dy = this.targetLocation.y - this.location.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance <= this.speed) {
            // Reached target
            this.location = this.targetLocation;
            this.hasReachedTarget = true;
            this.explode();
        } else {
            // Move toward target
            const moveX = (dx / distance) * this.speed;
            const moveY = (dy / distance) * this.speed;
            
            this.location.x += moveX;
            this.location.y += moveY;
        }
    }
    
    private explode(): void {
        console.log(`Converging shadow explodes at ${this.location.x},${this.location.y}`);
        
        // Damage any players at explosion location
        this.region.players.forEach(player => {
            if (this.isPlayerNearby(player)) {
                console.log(`Converging shadow hits player for ${this.damage} damage`);
                this.dealDamageToPlayer(player, this.damage);
            }
        });
        
        // Remove this shadow
        this.region.removeEntity(this);
    }
    
    private isPlayerNearby(player: any): boolean {
        const distance = Math.max(
            Math.abs(player.location.x - this.location.x),
            Math.abs(player.location.y - this.location.y)
        );
        return distance <= 1; // 1-tile explosion radius
    }
    
    private dealDamageToPlayer(player: Player, damage: number): void {
        // Create a magic projectile that instantly hits for the damage
        const projectile = new Projectile(
            null, // No weapon source
            damage,
            null, // No attacking unit 
            player,
            'magic',
            {
                setDelay: 0, // Instant damage
                color: '#FF4500' // Orange fireball color
            }
        );
        
        player.addProjectile(projectile);
    }
}

/**
 * Shadow Crash Controller
 * 
 * Manages the complete Shadow Crash sequence
 */
export class ShadowCrashSequence {
    private region: Region;
    private playerLocation: Location;
    private angleIndex: number; // 0 = cardinal, 1 = diagonal
    
    // Angle sets for Shadow Crash
    private static readonly ANGLE_SETS = [
        [0, 90, 180, 270],      // Cardinal directions
        [45, 135, 225, 315]     // Diagonal directions
    ];
    
    constructor(region: Region, playerLocation: Location, angleIndex: number) {
        this.region = region;
        this.playerLocation = playerLocation;
        this.angleIndex = angleIndex;
    }
    
    /**
     * Execute the complete Shadow Crash sequence
     * Creates 3 sets of fireballs in lines at different angles
     */
    execute(): void {
        const angles = ShadowCrashSequence.ANGLE_SETS[this.angleIndex];
        const isCardinal = this.angleIndex === 0;
        
        console.log(`Executing Shadow Crash sequence: ${isCardinal ? 'Cardinal' : 'Diagonal'} angles - 3 sets of fireballs`);
        
        // Create 3 sets of fireballs in sequence
        // Set 1: Immediate
        this.createFireballLine(angles[0]);
        
        // Set 2: After 2 ticks (1.2 seconds)
        DelayedAction.registerDelayedAction(
            new DelayedAction(() => this.createFireballLine(angles[1]), 2)
        );
        
        // Set 3: After 4 ticks (2.4 seconds) 
        DelayedAction.registerDelayedAction(
            new DelayedAction(() => this.createFireballLine(angles[2]), 4)
        );
        
        // Trigger shadow wave sequence after all fireballs impact
        DelayedAction.registerDelayedAction(
            new DelayedAction(() => this.triggerShadowWaves(), 12) // After all sets impact
        );
    }
    
    private createFireballLine(primaryAngle: number): void {
        const fireballSpacing = 2; // Tiles between fireballs
        const lineLength = 2; // Fireballs on each side of center
        
        // Calculate line direction
        const radians = (primaryAngle * Math.PI) / 180;
        const dx = Math.cos(radians);
        const dy = Math.sin(radians);
        
        // Create center fireball (no shadows)
        const centerLocation = { ...this.playerLocation };
        const centerFireball = new ShadowCrashFireball(
            this.region,
            { x: centerLocation.x, y: centerLocation.y - 10 }, // Start above
            { x: centerLocation.x, y: centerLocation.y },
            false // No shadows
        );
        this.region.addEntity(centerFireball);
        
        // Create side fireballs (spawn shadows)
        for (let i = 1; i <= lineLength; i++) {
            // Left side
            const leftTarget = {
                x: Math.floor(centerLocation.x + dx * i * fireballSpacing),
                y: Math.floor(centerLocation.y + dy * i * fireballSpacing)
            };
            const leftFireball = new ShadowCrashFireball(
                this.region,
                { x: leftTarget.x, y: leftTarget.y - 10 },
                leftTarget,
                true // Spawn shadows
            );
            this.region.addEntity(leftFireball);
            
            // Right side
            const rightTarget = {
                x: Math.floor(centerLocation.x - dx * i * fireballSpacing),
                y: Math.floor(centerLocation.y - dy * i * fireballSpacing)
            };
            const rightFireball = new ShadowCrashFireball(
                this.region,
                { x: rightTarget.x, y: rightTarget.y - 10 },
                rightTarget,
                true // Spawn shadows
            );
            this.region.addEntity(rightFireball);
        }
    }
    
    private triggerShadowWaves(): void {
        // TODO: Trigger 2 shadow waves after Shadow Crash
        console.log('Triggering shadow waves after Shadow Crash');
    }
}