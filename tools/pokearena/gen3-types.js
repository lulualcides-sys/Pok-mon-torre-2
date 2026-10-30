/* Source-only alias. In the captured Phaser client, build-preview.mjs copies
 * torre2-gen3-types.js into ./torre2/gen3-types.js. In Node tests we keep
 * that same relative import path without ever shipping a second type chart.
 */
export {gen3Effectiveness,gen3Types,gen3Stab,gen3Category,gen3MoveType,
 GEN3_TYPES,GEN3_CHART,gen3BurnModifier} from './torre2-gen3-types.js';
