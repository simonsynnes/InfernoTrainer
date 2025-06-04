/**
 * Yama Ranged Attack
 * 
 * Yama's ranged attack with prayer-piercing mechanics.
 * - Hits up to 3 damage through Protect from Missiles
 * - Higher damage without prayer protection
 * - 7-tick attack speed
 */

import { RangedWeapon } from '../../sdk/weapons/RangedWeapon';
import { Unit, Random, ItemName } from '../../sdk';
import { AttackBonuses } from '../../sdk/gear/Weapon';

export class YamaRangedAttack extends RangedWeapon {
    constructor() {
        super();
    }
    
    get itemName(): ItemName {
        return ItemName.YAMA_RANGED_ATTACK;
    }
    
    get attackSound() {
        // TODO: Use proper sound asset when available
        return null;
    }
    
    get attackLandingSound() {
        // TODO: Use proper sound asset when available
        return null;
    }
    
    get projectileModel() {
        // TODO: Use proper model asset when available
        return null;
    }
    
    _maxHit(from: Unit, to: Unit, bonuses: AttackBonuses): number {
        // High base damage for Yama
        let maxDamage = 45; // TODO: Research exact max hit
        
        // Check for prayer protection
        if (bonuses.effectivePrayers?.overhead?.feature() === 'range') {
            // Prayer piercing: max 3 damage through Protect from Missiles
            maxDamage = Math.min(maxDamage, 3);
        }
        
        return maxDamage;
    }
    
    calculateDamage(from: Unit, to: Unit, bonuses: AttackBonuses): number {
        const maxHit = this._maxHit(from, to, bonuses);
        
        // Yama has high accuracy - rarely misses
        const accuracy = this._calculateAccuracy(from, to, bonuses);
        
        if (Random.get() * 100 < accuracy) {
            return Math.floor(Random.get() * (maxHit + 1));
        }
        
        return 0; // Miss
    }
    
    private _calculateAccuracy(from: Unit, to: Unit, bonuses: AttackBonuses): number {
        // Yama has very high accuracy
        let baseAccuracy = 95; // 95% base hit chance
        
        // Prayer protection reduces accuracy slightly but doesn't prevent prayer piercing
        if (bonuses.effectivePrayers?.overhead?.feature() === 'range') {
            baseAccuracy = 90; // Still very high accuracy
        }
        
        return baseAccuracy;
    }
    
    isBlockable(from: Unit, to: Unit, bonuses: AttackBonuses): boolean {
        // Calculate prayer effects
        this._calculatePrayerEffects(from, to, bonuses);
        
        // Prayer reduces damage but doesn't completely block
        return false; // Yama's attacks always hit (prayer piercing)
    }
    
    calculateHitDelay(distance: number): number {
        // Projectile travel time based on distance
        return Math.max(1, Math.floor(distance / 3));
    }
}