/**
 * Void Flare Entity
 * 
 * Small entities that spawn during Yama P3 fight:
 * - 71 total HP, spawn with half health (35.5 → 36 HP)
 * - Stationary targets
 * - Explode on death causing 25 damage to nearby players
 * - Can be one-shotted with Purging Staff + Dark Demonbane + Mark of Darkness + 20% magic damage
 * - Spawn intermittently or guaranteed on Yama melee attack
 */

import { Mob, Location, Region, UnitOptions, UnitBonuses, Random, ItemName } from '../../sdk';
import { Player } from '../../sdk/Player';

export class VoidFlare extends Mob {
    private isOneShot: boolean = false;
    
    constructor(region?: Region, location?: Location, options: UnitOptions = {}) {
        super(region, location, options);
        this.setStats();
        
        // Spawn with half health
        this.currentStats.hitpoint = Math.ceil(this.stats.hitpoint / 2);
    }
    
    override setStats() {
        this.stats = {
            attack: 1,
            strength: 1,
            defence: 1,
            range: 1,
            magic: 1,
            hitpoint: 71
        };
        
        this.currentStats = { ...this.stats };
    }
    
    override get size(): number {
        return 1; // 1x1 entity
    }
    
    override get combatLevel(): number {
        return 35; // Relatively low combat level
    }
    
    override get attackSpeed(): number {
        return 999; // Void Flares don't attack
    }
    
    override get attackRange(): number {
        return 0; // No attacks
    }
    
    override get maxHit(): number {
        return 0; // No direct attacks
    }
    
    override mobName(): string {
        return "Void Flare";
    }
    
    override get image(): string {
        // TODO: Use proper Void Flare model when assets are available
        return null; // Use default rendering for now
    }
    
    override get bonuses(): UnitBonuses {
        return {
            attack: {
                stab: 0,
                slash: 0,
                crush: 0,
                magic: 0,
                range: 0,
            },
            defence: {
                stab: 1,
                slash: 1,
                crush: 1,
                magic: 1,
                range: 1,
            },
            other: {
                meleeStrength: 0,
                rangedStrength: 0,
                magicDamage: 0,
                prayer: 0,
            },
            targetSpecific: {
                undead: 0,
                slayer: 0,
            },
        };
    }
    
    override canMove(): boolean {
        // Void Flares are stationary
        return false;
    }
    
    override getNextMovementStep(): { dx: number; dy: number } {
        // Stationary
        return { dx: this.location.x, dy: this.location.y };
    }
    
    override canBeAttacked(): boolean {
        return true;
    }
    
    override attackIfPossible(): void {
        // Void Flares don't attack players
        return;
    }
    
    /**
     * Check if this Void Flare can be one-shot
     */
    canBeOneShot(attacker: Player): boolean {
        // Check for specific conditions:
        // 1. Purging Staff equipped
        // 2. Casting Dark Demonbane spell
        // 3. Mark of Darkness effect active
        // 4. Total 20% magic damage bonus
        
        const weapon = attacker.equipment?.weapon;
        const hasMarkOfDarkness = this.hasMarkOfDarkness(attacker);
        const magicDamageBonus = this.getMagicDamageBonus(attacker);
        
        const isPurgingStaff = weapon && weapon.itemName === ItemName.PURGING_STAFF;
        const hasSufficientBonus = magicDamageBonus >= 20;
        
        return isPurgingStaff && hasMarkOfDarkness && hasSufficientBonus;
    }
    
    private hasMarkOfDarkness(player: Player): boolean {
        // TODO: Check player effects for Mark of Darkness
        // For now, return false - will implement when effects system is ready
        return false;
    }
    
    private getMagicDamageBonus(player: Player): number {
        // TODO: Calculate total magic damage bonus from equipment and effects
        // Purging Staff provides 10%, Mark of Darkness provides 10% = 20% total
        return 0;
    }
    
    /**
     * Handle one-shot destruction (no explosion)
     */
    onOneShot(): void {
        this.isOneShot = true;
        console.log('Void Flare one-shotted - no explosion');
        this.dead();
    }
    
    override dead(): void {
        if (!this.isOneShot) {
            // Normal death - explode and damage nearby players
            this.explode();
        }
        
        super.dead();
    }
    
    /**
     * Explode and damage nearby players
     */
    private explode(): void {
        console.log('Void Flare explodes!');
        
        // Find all players within explosion radius
        this.region.players.forEach(player => {
            const distance = this.distanceTo(player);
            
            if (distance <= 2) { // 2-tile explosion radius
                const explosionDamage = Random.get() * 25; // Up to 25 damage
                console.log(`Void Flare explosion hits ${player.mobName()} for ${explosionDamage} damage`);
                
                // TODO: Apply damage to player
                // player.takeDamage(explosionDamage, 'magic');
            }
        });
        
        // TODO: Play explosion sound and visual effects
    }
    
    private distanceTo(other: any): number {
        const dx = Math.abs(this.location.x - other.location.x);
        const dy = Math.abs(this.location.y - other.location.y);
        return Math.max(dx, dy); // Chebyshev distance (OSRS standard)
    }
    
    override get color(): string {
        // Purple/void color for Void Flares
        return "#8A2BE2";
    }
    
    override removedFromWorld(): void {
        super.removedFromWorld();
        console.log('Void Flare removed from world');
    }
    
    /**
     * Get spawn location near arena edges (safe from Yama)
     */
    static getRandomSpawnLocation(region: Region): Location {
        // Spawn in safe areas around the arena edge
        const edgeDistance = 3; // Distance from arena edge
        const arenaCenter = { x: 15, y: 15 }; // Yama's position
        const minDistanceFromYama = 6; // Minimum distance from Yama
        
        let attempts = 0;
        let location: Location;
        
        do {
            const x = Random.get() * (region.width - 2 * edgeDistance) + edgeDistance;
            const y = Random.get() * (region.height - 2 * edgeDistance) + edgeDistance;
            
            location = { x: Math.floor(x), y: Math.floor(y) };
            
            // Check distance from Yama
            const distanceFromYama = Math.max(
                Math.abs(location.x - arenaCenter.x),
                Math.abs(location.y - arenaCenter.y)
            );
            
            if (distanceFromYama >= minDistanceFromYama) {
                break;
            }
            
            attempts++;
        } while (attempts < 20); // Prevent infinite loops
        
        return location;
    }
}