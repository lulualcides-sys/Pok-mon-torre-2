/* Johto Gen II VFX ONLY, using original PixelFX MIT modules.
 * No battle effects, status rules, damage or campaign unlocks are implied.
 * Pinned source: https://github.com/patch-gg/pixelfx/tree/a84159688af3ca37a4be05a0d422b94451b2e24e
 * License: MIT. The previews must pass visual/user review before gameplay integration.
 */
export const PIXELFX_PIN="a84159688af3ca37a4be05a0d422b94451b2e24e";
export const JOHTO_PIXELFX_28=Object.freeze([
 {"id":"sketch","nombre":"Sketch","tipo":"NORMAL","fx":"arcane/rune-circle"},
 {"id":"spider-web","nombre":"Spider Web","tipo":"BUG","fx":"nature/root-snare"},
 {"id":"mind-reader","nombre":"Mind Reader","tipo":"NORMAL","fx":"arcane/spell-charge"},
 {"id":"nightmare","nombre":"Nightmare","tipo":"GHOST","fx":"shadow/grasping-hands"},
 {"id":"curse","nombre":"Curse","tipo":"GHOST","fx":"shadow/curse"},
 {"id":"conversion-2","nombre":"Conversion 2","tipo":"NORMAL","fx":"arcane/portal"},
 {"id":"cotton-spore","nombre":"Cotton Spore","tipo":"GRASS","fx":"nature/spore-burst"},
 {"id":"spite","nombre":"Spite","tipo":"GHOST","fx":"shadow/soul-drain"},
 {"id":"sweet-kiss","nombre":"Sweet Kiss","tipo":"FAIRY","fx":"status/charmed"},
 {"id":"belly-drum","nombre":"Belly Drum","tipo":"NORMAL","fx":"status/rage"},
 {"id":"spikes","nombre":"Spikes","tipo":"GROUND","fx":"nature/thorns"},
 {"id":"foresight","nombre":"Foresight","tipo":"NORMAL","fx":"arcane/magic-circle-cast"},
 {"id":"destiny-bond","nombre":"Destiny Bond","tipo":"GHOST","fx":"shadow/hex-sigil"},
 {"id":"perish-song","nombre":"Perish Song","tipo":"NORMAL","fx":"shadow/necro-skulls"},
 {"id":"detect","nombre":"Detect","tipo":"FIGHTING","fx":"status/haste"},
 {"id":"endure","nombre":"Endure","tipo":"NORMAL","fx":"holy/divine-shield"},
 {"id":"swagger","nombre":"Swagger","tipo":"NORMAL","fx":"status/confused"},
 {"id":"milk-drink","nombre":"Milk Drink","tipo":"NORMAL","fx":"holy/heal"},
 {"id":"mean-look","nombre":"Mean Look","tipo":"NORMAL","fx":"shadow/eclipse"},
 {"id":"attract","nombre":"Attract","tipo":"NORMAL","fx":"holy/blessing"},
 {"id":"sleep-talk","nombre":"Sleep Talk","tipo":"NORMAL","fx":"status/sleep"},
 {"id":"heal-bell","nombre":"Heal Bell","tipo":"NORMAL","fx":"holy/heal-aoe"},
 {"id":"pain-split","nombre":"Pain Split","tipo":"NORMAL","fx":"shadow/life-steal"},
 {"id":"baton-pass","nombre":"Baton Pass","tipo":"NORMAL","fx":"arcane/blink-out"},
 {"id":"encore","nombre":"Encore","tipo":"NORMAL","fx":"ui/confetti"},
 {"id":"sweet-scent","nombre":"Sweet Scent","tipo":"NORMAL","fx":"nature/healing-bloom"},
 {"id":"morning-sun","nombre":"Morning Sun","tipo":"NORMAL","fx":"holy/sunburst"},
 {"id":"psych-up","nombre":"Psych Up","tipo":"NORMAL","fx":"arcane/mana-burst"},
].map((m)=>Object.freeze({
 ...m,categoria:"STATUS",poder:0,precisao:100,pp:20,dano:0,alcance:180,
 anim:"Charge",style:"pixelfx",forma:"torre2_pixelfx_"+m.id.replaceAll("-",""),
 coste:8,cd:2.4,lanzar:.13,source:"pixelfx-visual-preview",visualOnly:true,
 approved:false,pendiente:false
})));
