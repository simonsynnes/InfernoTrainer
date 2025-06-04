/**
 * Yama Phase 3 Boss Entity
 * 
 * Core implementation of Yama's Phase 3 mechanics:
 * - Stationary at arena center (3x3 size)
 * - 7-tick attack speed (4.2 seconds)
 * - Alternating Ranged/Magic attacks
 * - Prayer-piercing damage (Melee 22, Ranged/Magic 3)
 * - Shadow Crash special attack
 * - Guaranteed Void Flare spawning on melee
 * - Increased P3 defense stats
 */

import { Mob, Location, Region, UnitOptions, UnitBonuses, Random, Assets } from '../../sdk';
import { AttackStyle } from '../../sdk/AttackStylesController';
import { GLTFModel } from '../../sdk/rendering/GLTFModel';
import { YamaRangedAttack } from '../weapons/YamaRangedAttack';
import { YamaMagicAttack } from '../weapons/YamaMagicAttack';
import { YamaMeleeAttack } from '../weapons/YamaMeleeAttack';
import { YamaP3Arena } from '../regions/YamaP3Arena';
import { VoidFlare } from './VoidFlare';
import { ShadowCrashSequence } from './ShadowCrash';
import { ShadowWaveAction } from './ShadowWave';

// TODO: Replace with actual Yama model ID when available
// Using Verzik model as temporary placeholder for testing 3D rendering
const YamaModel = Assets.getAssetUrl("models/verzik.glb");

export class YamaP3 extends Mob {
    private attackPattern: 'ranged' | 'magic' = 'ranged'; // Initial style based on P2 glyphs
    private shadowCrashCooldown = 0;
    private shadowCrashAngleIndex = 0; // Tracks cardinal/diagonal sequence
    private voidFlareCount = 0;
    private isStationary = true;
    
    // Shadow Crash angles: cardinal -> diagonal -> cardinal
    private shadowCrashAngles = [
        [0, 90, 180, 270],    // Cardinal directions
        [45, 135, 225, 315]   // Diagonal directions
    ];
    
    constructor(region?: Region, location?: Location, options: UnitOptions = {}) {
        super(region, location, options);
        
        // Set up Yama P3 weapons
        this.weapons = {
            ranged: new YamaRangedAttack(),
            magic: new YamaMagicAttack(),
            slash: new YamaMeleeAttack()
        };
        
        this.setStats();
    }
    
    override setStats() {
        // TODO: Research exact Yama P3 stats
        this.stats = {
            attack: 999,
            strength: 999,
            defence: 850,  // Significantly higher defense in P3
            range: 999,
            magic: 999,
            hitpoint: 1800 // TODO: Research exact P3 HP
        };
        
        this.currentStats = { ...this.stats };
    }
    
    override get size(): number {
        return 3; // 3x3 boss
    }
    
    override get combatLevel(): number {
        return 1372; // TODO: Verify exact combat level
    }
    
    override get attackSpeed(): number {
        return 7; // 7 ticks = 4.2 seconds
    }
    
    override get attackRange(): number {
        return 15; // Long range for ranged/magic attacks
    }
    
    override get maxHit(): number {
        // Base max hit without prayer piercing
        return 45; // TODO: Research exact values
    }
    
    override mobName(): string {
        return "Yama";
    }
    
    override get image(): string {
        // TODO: Use proper Yama P3 model when assets are available
        return null; // Use default rendering for now
    }
    
    
    get color(): string {
        return "#8B0000"; // Dark red color for Yama
    }
    
    override create3dModel() {
        // For now, return null to use the default 2D colored square rendering
        // TODO: Re-enable 3D model once Verzik model loading is confirmed working
        console.log('Using default 2D rendering for Yama P3');
        return null;
    }
    
    override get bonuses(): UnitBonuses {
        return {
            attack: {
                stab: 200,
                slash: 200,
                crush: 200,
                magic: 200,
                range: 200,
            },
            defence: {
                stab: 300,
                slash: 300,
                crush: 300,
                magic: 200,
                range: 200,
            },
            other: {
                meleeStrength: 150,
                rangedStrength: 150,
                magicDamage: 150,
                prayer: 0,
            },
            targetSpecific: {
                undead: 0,
                slayer: 0,
            },
        };
    }
    
    override attackStyleForNewAttack(): string {
        // Check if player is in melee range first
        if (this.canMeleeTarget()) {
            return 'slash'; // Melee attack style
        }
        
        // Alternate between ranged and magic
        const style = this.attackPattern === 'ranged' ? 'range' : 'magic';
        this.attackPattern = this.attackPattern === 'ranged' ? 'magic' : 'ranged';
        return style;
    }
    
    private canMeleeTarget(): boolean {
        if (!this.aggro) return false;
        
        // Check if player is within melee range (adjacent to 3x3 boss)
        const playerX = this.aggro.location.x;
        const playerY = this.aggro.location.y;
        const bossX = this.location.x;
        const bossY = this.location.y;
        
        // Check all tiles adjacent to the 3x3 boss
        return (
            (playerX >= bossX - 1 && playerX <= bossX + this.size) &&
            (playerY >= bossY - this.size && playerY <= bossY + 1)
        ) && !(
            playerX >= bossX && playerX < bossX + this.size &&
            playerY > bossY - this.size && playerY <= bossY
        );
    }
    
    override getNextMovementStep(): { dx: number; dy: number } {
        // Yama is stationary in P3
        return { dx: this.location.x, dy: this.location.y };
    }
    
    override canMove(): boolean {
        // Yama cannot move in P3
        return false;
    }
    
    override attack(): boolean {
        const attacked = super.attack();
        
        if (attacked) {
            // Check for special attack (Shadow Crash)
            if (this.shouldPerformShadowCrash()) {
                this.performShadowCrash();
            }
            
            // Handle melee attack special effects
            if (this.attackStyle === 'slash' && this.canMeleeTarget()) {
                this.onMeleeAttack();
            }
        }
        
        return attacked;
    }
    
    private shouldPerformShadowCrash(): boolean {
        // Shadow Crash when player is outside melee range and cooldown is ready
        return this.shadowCrashCooldown <= 0 && !this.canMeleeTarget() && Random.get() < 0.3;
    }
    
    private performShadowCrash(): void {
        if (!this.aggro) return;
        
        const player = this.aggro;
        const currentAngles = this.shadowCrashAngles[this.shadowCrashAngleIndex];
        
        console.log(`Yama performs Shadow Crash - ${this.shadowCrashAngleIndex === 0 ? 'Cardinal' : 'Diagonal'} angles`);
        
        // Create 3 fireballs in a line centered on player
        this.createShadowCrashFireballs(player.location, currentAngles);
        
        // Alternate between cardinal and diagonal angles
        this.shadowCrashAngleIndex = (this.shadowCrashAngleIndex + 1) % 2;
        
        // Set cooldown (TODO: Research exact timing)
        this.shadowCrashCooldown = 20; // ~12 seconds
        
        // Notify arena of Shadow Crash completion
        if (this.region instanceof YamaP3Arena) {
            this.region.onShadowCrashComplete();
        }
    }
    
    private createShadowCrashFireballs(targetLocation: Location, angles: number[]): void {
        // Create Shadow Crash sequence
        const shadowCrash = new ShadowCrashSequence(
            this.region,
            targetLocation,
            this.shadowCrashAngleIndex
        );
        
        shadowCrash.execute();
        console.log(`Shadow Crash sequence executed at ${targetLocation.x}, ${targetLocation.y}`);
    }
    
    private onMeleeAttack(): void {
        console.log('Yama melee attack - spawning guaranteed Void Flare');
        
        // Always spawn void flare on melee
        this.spawnVoidFlare();
        
        // Notify arena
        if (this.region instanceof YamaP3Arena) {
            this.region.onYamaMeleeAttack();
        }
    }
    
    private spawnVoidFlare(): void {
        // Create new Void Flare at random safe location
        const spawnLocation = VoidFlare.getRandomSpawnLocation(this.region);
        const voidFlare = new VoidFlare(this.region, spawnLocation);
        
        this.region.addMob(voidFlare);
        this.voidFlareCount++;
        
        console.log(`Spawned Void Flare #${this.voidFlareCount} at ${spawnLocation.x}, ${spawnLocation.y}`);
        
        // Trigger shadow waves after void flare spawn
        if (this.region instanceof YamaP3Arena) {
            this.region.onVoidFlareSpawned();
        }
    }
    
    override timerStep(): void {
        super.timerStep();
        
        // Decrement cooldowns
        if (this.shadowCrashCooldown > 0) {
            this.shadowCrashCooldown--;
        }
    }
    
    override attackStep(): void {
        super.attackStep();
        
        // Process P3 specific mechanics
        this.processP3Mechanics();
    }
    
    private processP3Mechanics(): void {
        // Handle complex P3 timing and mechanics
        // This will coordinate with the arena for shadow waves, etc.
    }
    
    /**
     * Set the initial attack pattern based on P2 glyph dominance
     */
    setInitialAttackPattern(pattern: 'ranged' | 'magic'): void {
        this.attackPattern = pattern;
        console.log(`Yama P3 opening attack style set to: ${pattern}`);
    }
    
    /**
     * Get current void flare count for tracking mechanics
     */
    getVoidFlareCount(): number {
        return this.voidFlareCount;
    }
    
    
    override removedFromWorld(): void {
        super.removedFromWorld();
        console.log('Yama P3 defeated!');
    }
    
    /**
     * Preload the Yama model for better performance
     */
    override async preload(): Promise<void> {
        await super.preload();
        console.log('Yama P3 model preloaded');
    }
}