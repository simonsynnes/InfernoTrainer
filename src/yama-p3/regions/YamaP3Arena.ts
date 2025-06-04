/**
 * Yama Phase 3 Arena Region
 * 
 * The specific encounter arena for Yama Phase 3 below the Chasm of Fire.
 * Features:
 * - Yama positioned at center (stationary)
 * - Disabled glyphs for Phase 3
 * - Arena boundaries and collision detection
 * - Complex mechanics timing (Shadow Crash, Void Flares, Shadow Waves)
 */

import { Region, Player, Location, Collision } from '../../sdk';
import { YamaP3 } from '../entities/YamaP3';
import { ShadowWaveAction } from '../entities/ShadowWave';
import { 
    TorvaFullhelm, TorvaPlatebody, TorvaPlatelegs, 
    AmuletOfTorture, InfernalCape, FerociousGloves, 
    PrimordialBoots, UltorRing 
} from '../../content/equipment';
import { ScytheOfVitur } from '../../content/weapons';
import { 
    SaradominBrew, SuperRestore, SuperCombatPotion, 
    Shark, StaminaPotion 
} from '../../content/items';

export class YamaP3Arena extends Region {
    private yama: YamaP3;
    private shadowCrashCooldown = 0;
    private voidFlareSpawnTimer = 0;
    private shadowWaveSequence = 0;
    
    constructor() {
        super();
    }
    
    get width(): number {
        return 30; // TODO: Research exact arena dimensions
    }
    
    get height(): number {
        return 30; // TODO: Research exact arena dimensions
    }
    
    getName(): string {
        return "Yama's Lair - Phase 3";
    }
    
    mapImagePath(): string {
        // TODO: Path to Yama arena background image
        return "";
    }
    
    drawWorldBackground(context: OffscreenCanvasRenderingContext2D, scale: number): void {
        // Draw a dark rocky arena floor
        context.fillStyle = "#2a1f1a"; // Dark brown/rock color
        context.fillRect(0, 0, this.width * scale, this.height * scale);
        
        // Draw grid pattern for visibility
        context.strokeStyle = "#3a2f2a";
        context.lineWidth = 1;
        
        // Draw vertical lines
        for (let x = 0; x <= this.width; x++) {
            context.beginPath();
            context.moveTo(x * scale, 0);
            context.lineTo(x * scale, this.height * scale);
            context.stroke();
        }
        
        // Draw horizontal lines
        for (let y = 0; y <= this.height; y++) {
            context.beginPath();
            context.moveTo(0, y * scale);
            context.lineTo(this.width * scale, y * scale);
            context.stroke();
        }
        
        // Draw arena boundary
        context.strokeStyle = "#ff0000";
        context.lineWidth = 2;
        context.strokeRect(scale, scale, (this.width - 2) * scale, (this.height - 2) * scale);
    }
    
    override drawDefaultFloor(): boolean {
        return true;
    }
    
    initialiseRegion(): { player: Player } {
        // Set up collision map for arena boundaries
        this.setupArenaCollision();
        
        // Place Yama at center of arena (stationary)
        this.yama = new YamaP3(this, { x: 15, y: 15 });
        this.addMob(this.yama);
        
        // Create player spawn position (safe distance from Yama)
        const player = new Player(this, { x: 10, y: 10 });
        
        // Set up player with high-end gear for Yama P3
        const loadout = {
            equipment: {
                weapon: new ScytheOfVitur(),
                offhand: null,
                helmet: new TorvaFullhelm(),
                necklace: new AmuletOfTorture(),
                cape: new InfernalCape(),
                ammo: null,
                chest: new TorvaPlatebody(),
                legs: new TorvaPlatelegs(),
                feet: new PrimordialBoots(),
                gloves: new FerociousGloves(),
                ring: new UltorRing(),
            },
            inventory: [
                // Food and potions for sustain
                new SaradominBrew(),
                new SaradominBrew(),
                new SaradominBrew(),
                new SuperRestore(),
                new SuperRestore(),
                new SuperCombatPotion(),
                new StaminaPotion(),
                new Shark(),
                new Shark(),
                new Shark(),
                new Shark(),
                new Shark(),
            ],
        };
        
        player.setUnitOptions(loadout);
        this.addPlayer(player);
        
        // Initialize combat - make Yama aggro the player and player aggro Yama
        this.yama.aggro = player;
        player.aggro = this.yama;
        
        // Start combat immediately by making both units target each other
        this.yama.lastInteraction = player;
        this.yama.lastInteractionAge = 0;
        player.lastInteraction = this.yama;
        player.lastInteractionAge = 0;
        
        console.log('Yama P3 Arena - mutual combat initialized between player and Yama');
        
        // Mark glyph areas as disabled for P3
        this.disableGlyphs();
        
        console.log('Yama P3 Arena initialized - Yama at center, glyphs disabled, combat started');
        
        return { player };
    }
    
    private setupArenaCollision(): void {
        // TODO: Research exact collision map and arena boundaries
        // For now, create basic rectangular arena with walls
        
        // Add arena boundary walls
        for (let x = 0; x < this.width; x++) {
            // North and south walls
            this.addWall(x, 0);
            this.addWall(x, this.height - 1);
        }
        
        for (let y = 0; y < this.height; y++) {
            // East and west walls
            this.addWall(0, y);
            this.addWall(this.width - 1, y);
        }
    }
    
    private addWall(x: number, y: number): void {
        // TODO: Use proper Wall entity from SDK
        // For now, this is a placeholder for collision setup
    }
    
    private disableGlyphs(): void {
        // TODO: Mark glyph areas as non-functional for P3
        // Visual indication that glyphs are disabled
        console.log('Glyphs disabled for Phase 3');
    }
    
    midTick(): void {
        super.midTick();
        
        // Debug combat status every 30 ticks (18 seconds)
        if (this.world.globalTickCounter % 30 === 0) {
            console.log('Combat Status Check:', {
                yamaHP: this.yama ? `${this.yama.currentStats.hitpoint}/${this.yama.stats.hitpoint}` : 'No Yama',
                yamaAggro: this.yama?.aggro ? 'Has aggro' : 'No aggro',
                yamaAttackDelay: this.yama?.attackDelay || 'N/A',
                playerHP: this.players[0] ? `${this.players[0].currentStats.hitpoint}/${this.players[0].stats.hitpoint}` : 'No player',
                playerAggro: this.players[0]?.aggro ? 'Has aggro' : 'No aggro',
                playerAttackDelay: this.players[0]?.attackDelay || 'N/A'
            });
        }
        
        // Process Yama P3 specific mechanics timing
        this.processYamaP3Mechanics();
    }
    
    private processYamaP3Mechanics(): void {
        // Handle complex timing between Shadow Crash, Void Flares, Shadow Waves
        this.shadowCrashCooldown--;
        this.voidFlareSpawnTimer--;
        
        // Process shadow wave sequences
        this.manageShadowWaveSequence();
        
        // Handle intermittent void flare spawning
        this.handleIntermittentVoidFlares();
    }
    
    private manageShadowWaveSequence(): void {
        // TODO: Implement the complex shadow wave pattern:
        // 2 waves after Shadow Crash
        // 2 waves after Void Flare spawns  
        // 4 waves combined with Shadow Crash + auto-attack
        // Then sequence repeats
    }
    
    private handleIntermittentVoidFlares(): void {
        // TODO: Handle "intermittent" void flare spawning
        // Research exact timing and triggers
        if (this.voidFlareSpawnTimer <= 0) {
            // Spawn void flare at random safe location
            // Reset timer based on research
            this.voidFlareSpawnTimer = 30; // Placeholder value
        }
    }
    
    
    /**
     * Handle special Yama P3 events
     */
    onYamaMeleeAttack(): void {
        // Guaranteed void flare spawn on Yama melee
        this.spawnVoidFlare();
    }
    
    onShadowCrashComplete(): void {
        // Trigger 2 shadow waves after shadow crash
        console.log('Shadow Crash complete - triggering shadow waves');
        const shadowWaveAction = new ShadowWaveAction(this, 'post-crash');
        shadowWaveAction.execute();
    }
    
    onVoidFlareSpawned(): void {
        // Trigger 2 shadow waves after void flare spawning
        console.log('Void Flare spawned - triggering shadow waves');
        const shadowWaveAction = new ShadowWaveAction(this, 'post-flare');
        shadowWaveAction.execute();
    }
    
    onVoidFlareDestroyed(): void {
        // Handle void flare destruction
        console.log('Void Flare destroyed');
        // Additional logic can be added here for tracking patterns
    }
    
    triggerCombinedMechanics(): void {
        // Trigger the complex combined sequence (4 waves + Shadow Crash + auto-attack)
        console.log('Triggering combined mechanics phase');
        const shadowWaveAction = new ShadowWaveAction(this, 'combined');
        shadowWaveAction.execute();
    }
    
    private spawnVoidFlare(): void {
        // This is now handled by YamaP3 entity directly
        if (this.yama) {
            // Trigger the Yama's void flare spawning method
            (this.yama as any).spawnVoidFlare?.();
        }
    }
    
    
    getSidebarContent(): string {
        return `
            <h3>Yama Phase 3</h3>
            <p><strong>Boss:</strong> ${this.yama ? this.yama.mobName() : 'Not spawned'}</p>
            <p><strong>HP:</strong> ${this.yama ? `${this.yama.currentStats.hitpoint}/${this.yama.stats.hitpoint}` : 'N/A'}</p>
            <p><strong>Attack Speed:</strong> 7 ticks (4.2s)</p>
            <p><strong>Mechanics:</strong></p>
            <ul>
                <li>Prayer-piercing damage</li>
                <li>Shadow Crash special attack</li>
                <li>Void Flare spawning</li>
                <li>Shadow Wave patterns</li>
            </ul>
            <p><strong>Strategy:</strong> Use Purging Staff + Dark Demonbane to one-shot Void Flares</p>
        `;
    }
    
    /**
     * Get the Yama boss entity
     */
    getYama(): YamaP3 | null {
        return this.yama;
    }
}