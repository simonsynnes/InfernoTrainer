/**
 * Yama Phase 3 Simulator Controller
 * 
 * Main controller that initializes and manages the Yama P3 simulation
 */

import { World, Player, Location, Trainer, Viewport } from '../../sdk';
import { YamaP3Arena } from '../regions/YamaP3Arena';

export class YamaP3Simulator {
    private world: World;
    private arena: YamaP3Arena;
    private player: Player;
    
    constructor() {
        this.world = new World();
        this.arena = new YamaP3Arena();
    }
    
    /**
     * Initialize the Yama P3 simulation
     */
    initialize(): void {
        // Set up world and region
        this.world.getReadyTimer = 6;
        this.arena.world = this.world;
        this.world.addRegion(this.arena);
        
        // Initialize region and get player
        const { player } = this.arena.initialiseRegion();
        this.player = player;
        
        // Set player in Trainer for global access
        Trainer.setPlayer(this.player);
        
        // Set up viewport
        Viewport.setupViewport(this.arena);
        Viewport.viewport.setPlayer(this.player);
        
        console.log('Yama P3 Simulator initialized');
    }
    
    /**
     * Start the simulation
     */
    start(): void {
        this.world.startTicking();
        console.log('Yama P3 Simulator started');
    }
    
    /**
     * Reset the simulation to initial state
     */
    reset(): void {
        const { player } = this.arena.reset();
        this.player = player;
        Viewport.viewport.setPlayer(this.player);
        console.log('Yama P3 Simulator reset');
    }
    
    /**
     * Get the current arena instance
     */
    getArena(): YamaP3Arena {
        return this.arena;
    }
    
    /**
     * Get the current player instance
     */
    getPlayer(): Player {
        return this.player;
    }
}