/**
 * Yama Phase 3 Simulator Entry Point
 * 
 * This module initializes and runs the Yama Phase 3 boss fight simulator
 * using the InfernoTrainer SDK.
 */

export { YamaP3Arena } from './regions/YamaP3Arena';
export { YamaP3 } from './entities/YamaP3';
export { YamaP3Simulator } from './simulator/YamaP3Simulator';

// Weapons
export { YamaRangedAttack } from './weapons/YamaRangedAttack';
export { YamaMagicAttack } from './weapons/YamaMagicAttack';
export { YamaMeleeAttack } from './weapons/YamaMeleeAttack';

// Phase 2 Entities - Core Mechanics
export { VoidFlare } from './entities/VoidFlare';
export { ShadowCrashFireball, ConvergingShadow, ShadowCrashSequence } from './entities/ShadowCrash';
export { ShadowWave, ShadowWavePattern, ShadowWaveAction } from './entities/ShadowWave';
// export { PurgingStaff } from './weapons/PurgingStaff';
// export { MarkOfDarkness } from './effects/MarkOfDarkness';
// export { DarkDemonbane } from './spells/DarkDemonbane';