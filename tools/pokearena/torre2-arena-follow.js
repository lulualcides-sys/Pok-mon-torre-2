/* Pokémon Torre 2 — pure helpers of the arena trainers (no Phaser, Node-testable). */
// Owner 2026-11-24 (second message): the trainer does NOT walk after its
// Pokémon. It stays where it stands and only turns to keep looking at it.
// Facing from the trainer to its Pokémon, with a dead zone so it does not
// flicker between two directions. Pure: tests use it.
export const FACE_DEADZONE=10;
export function facingToward(from,to,current='side-right'){
 const dx=to.x-from.x,dy=to.y-from.y;
 if(Math.hypot(dx,dy)<FACE_DEADZONE)return current;
 // Prefer the side view; front/back only when the Pokémon is clearly
 // above or below (1.6× more vertical than horizontal).
 if(Math.abs(dy)>Math.abs(dx)*1.6)return dy>0?'front':'back';
 return dx>=0?'side-right':'side-left';
}
// More lines when a battle ends (owner 2026-11-24).
export const END_LINES=Object.freeze({
 playerWin:['Isso aí!','Muito bem, parceiro!','Vitória!','Foi demais!','Sabia que dava!','Mais uma pra conta!','Ninguém nos para!','Bom trabalho, equipe!','É assim que se faz!','Arrasamos!'],
 playerLose:['Ah, não...','Quase...','Da próxima vez!','Vamos treinar mais.','Droga!','Ainda não acabou!','Descanse, parceiro.','Foi por pouco...','Eu volto mais forte!','Que batalha difícil...'],
 foeWin:['Hahaha! Ganhei!','Volte quando estiver pronto!','Fácil demais!','Treine mais!','Meus Pokémon são os melhores!','Vitória minha!','Ainda falta muito pra você!','Não foi dessa vez!','Hehe, sabia!','Melhor sorte na próxima!'],
 foeLose:['Não acredito...','Você é forte!','Como assim?!','Perdi... Parabéns.','Bela batalha!','Vou treinar mais!','Desta vez você venceu.','Que Pokémon incríveis!','Impressionante...','Eu ainda vou te vencer!']
});
export function endLine(kind,random=Math.random){const l=END_LINES[kind]||[];return l[Math.floor(Math.max(0,Math.min(.999,Number(random())||0))*l.length)]||''}
