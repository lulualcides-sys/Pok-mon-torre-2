// Node-only source alias: build-preview copies torre2-gen3-types.js to
// the original Phaser client path torre2/gen3-types.js. The browser uses
// that copied runtime file; tests import the same canonical Gen III logic.
export {gen3Effectiveness,gen3Stab} from './torre2-gen3-types.js';
