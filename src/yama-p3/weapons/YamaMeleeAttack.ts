/**
 * Yama Melee Attack
 * 
 * Yama's melee attack with prayer-piercing mechanics.
 * - Hits up to 22 damage through Protect from Melee
 * - Much higher damage without prayer protection
 * - Always spawns a Void Flare on successful hit
 * - Only used when player is in melee range
 */

import { MeleeWeapon } from '../../sdk/weapons/MeleeWeapon';
import { Unit, Random, ItemName } from '../../sdk';
import { AttackBonuses } from '../../sdk/gear/Weapon';

export class YamaMeleeAttack extends MeleeWeapon {
    constructor() {
        super();
    }
    
    get itemName(): ItemName {
        return ItemName.YAMA_MELEE_ATTACK;
    }
    
    get attackSound() {
        // TODO: Use proper sound asset when available
        return null;
    }
    
    get attackLandingSound() {
        // TODO: Use proper sound asset when available
        return null;
    }
    
    _maxHit(from: Unit, to: Unit, bonuses: AttackBonuses): number {
        // Very high base damage for Yama melee
        let maxDamage = 60; // TODO: Research exact max hit
        
        // Check for prayer protection
        if (bonuses.effectivePrayers?.overhead?.feature() === 'melee') {
            // Prayer piercing: max 22 damage through Protect from Melee
            maxDamage = Math.min(maxDamage, 22);
        }
        
        return maxDamage;
    }
    
    calculateDamage(from: Unit, to: Unit, bonuses: AttackBonuses): number {
        const maxHit = this._maxHit(from, to, bonuses);
        
        // Yama has very high melee accuracy
        const accuracy = this._calculateAccuracy(from, to, bonuses);
        
        if (Random.get() * 100 < accuracy) {
            return Math.floor(Random.get() * maxHit) + 1; // Melee rarely does 0 damage
        }
        
        return 0; // Miss
    }
    
    private _calculateAccuracy(from: Unit, to: Unit, bonuses: AttackBonuses): number {
        // Yama has extremely high melee accuracy
        let baseAccuracy = 98; // 98% base hit chance
        
        // Prayer protection reduces accuracy slightly but doesn't prevent prayer piercing
        if (bonuses.effectivePrayers?.overhead?.feature() === 'melee') {
            baseAccuracy = 95; // Still extremely high accuracy
        }
        
        return baseAccuracy;
    }
    
    isBlockable(from: Unit, to: Unit, bonuses: AttackBonuses): boolean {
        // Calculate prayer effects
        this._calculatePrayerEffects(from, to, bonuses);
        
        // Prayer reduces damage but doesn't completely block
        return false; // Yama's attacks always hit (prayer piercing)
    }
    
    // TODO: Implement onSuccessfulHit when we add it to base class or use different approach
    // onSuccessfulHit(from: Unit, to: Unit, damage: number): void {
    //     if (damage > 0) {
    //         console.log('Yama melee hit - triggering guaranteed Void Flare spawn');
    //         
    //         // Trigger void flare spawning on the attacking Yama
    //         if (from.mobName && from.mobName() === 'Yama') {
    //             // This will be handled by the YamaP3 entity's onMeleeAttack method
    //             (from as any).onMeleeAttack?.();
    //         }
    //     }
    // }
    
    calculateHitDelay(distance: number): number {
        // Melee attacks are instant
        return 0;
    }
}