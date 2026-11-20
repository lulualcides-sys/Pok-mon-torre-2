/* Pokémon Torre 2 — story scenes of the Kanto campaign, following FireRed's
 * plot (original Portuguese lines, not the game's script). Pure data + rules:
 * they never change battles or progress.
 *  - Rival / Team Rocket: first battle of a stage, shown once per save.
 *    The Rival's lines name his real (evolved) starter.
 *  - Gym leaders, Elite Four and Champion: an introduction the first time,
 *    plus one line that reacts to the player's lead Pokémon type
 *    (advantage / disadvantage, Gen III type chart, no Fairy).
 *    After a loss, a short retry line (rotates with the number of losses).
 */
const list=v=>Array.isArray(v)?v:[];
export const SPEAKERS=Object.freeze({
 rival:'RIVAL',rocket:'EQUIPE ROCKET',brock:'BROCK',misty:'MISTY',surge:'LT. SURGE',
 erika:'ERIKA',koga:'KOGA',sabrina:'SABRINA',blaine:'BLAINE',giovanni:'GIOVANNI',
 lorelei:'LORELEI',bruno:'BRUNO',agatha:'AGATHA',lance:'LANCE'
});
export const STORY=Object.freeze({
 'rival-0':{place:'Rota 22',bg:{loc:'viridian',rect:[0,214,384,216]},lines:[
  ['rival','Ei! Achei você! O Professor Carvalho deu um Pokémon pra cada um de nós.'],
  ['rival','Eu peguei o {rival} de propósito: ele tem vantagem contra o seu. Batalha!']]},
 'rival-1':{place:'Ponte Pepita · Cerulean',bg:{loc:'route24',rect:[8,300,384,216]},lines:[
  ['rival','Você também está indo pra Cerulean? Eu já peguei um monte de Pokémon!'],
  ['rival','O meu {rival} está cada vez mais forte. Quero ver o seu!']]},
 'rival-2':{place:'S.S. Anne',bg:{loc:'ssanne',rect:[12,600,378,212]},lines:[
  ['rival','Também foi convidado pro S.S. Anne? Que coincidência...'],
  ['rival','Já que estamos aqui, vamos ver quem manda neste navio!']]},
 'rival-4':{place:'Torre Pokémon · Lavender',bg:{loc:'pokemontower',rect:[402,90,380,214]},lines:[
  ['rival','O que você está fazendo na Torre Pokémon? Seus Pokémon não morreram, né?'],
  ['rival','Hmm, eles parecem fortes. O {rival} vai testar isso!']]},
 'rival-5':{place:'Silph Co. · Saffron',bg:{loc:'silph',rect:[100,100,400,225]},lines:[
  ['rival','Cheguei antes de você na Silph Co.! A Equipe Rocket está em todo lugar aqui.'],
  ['rival','Mas antes de resolver isso, vamos ver quem é mais forte!']]},
 'rival-8':{place:'Rota 22 · Planalto Índigo',bg:{loc:'indigo',rect:[8,40,384,216]},lines:[
  ['rival','Juntei as 8 insígnias também. Vou ser o próximo Campeão!'],
  ['rival','Você é o último obstáculo antes da Liga. Vem, {rival}!']]},
 'rocket-1':{place:'Mt. Moon',bg:{loc:'mtmoon',rect:[1400,60,560,315]},lines:[
  ['rocket','Somos da Equipe Rocket! Esses fósseis do Mt. Moon são nossos!'],
  ['rocket','Some daqui, criança, ou vai se arrepender!']]},
 'rocket-3':{place:'Esconderijo Rocket · Celadon',bg:{loc:'rockethideout',rect:[20,350,284,160]},lines:[
  ['rocket','Ei! O Cassino é só fachada... você achou o esconderijo da Equipe Rocket!'],
  ['rocket','Ninguém que descobre o nosso segredo sai daqui!']]},
 'rocket-5':{place:'Silph Co. · Saffron',bg:{loc:'silph',rect:[800,1530,256,144]},lines:[
  ['rocket','A Silph Co. agora pertence à Equipe Rocket!'],
  ['rocket','O chefe quer a Master Ball. Você não vai atrapalhar!']]},
 'rocket-7':{place:'Viridian',bg:{loc:'viridian',rect:[330,60,384,216]},lines:[
  ['rocket','O chefe está ocupado e ninguém passa por aqui.'],
  ['rocket','Você derrotou a gente tantas vezes... desta vez não!']]}
});
// One entry per campaign stage (8 gyms, Elite Four, Champion).
// intro: first challenge · strong: player's lead hits the leader's type hard
// weak: the leader's type hits the player's lead hard · retry: after a loss.
export const LEADERS=Object.freeze([
 {who:'brock',type:'ROCK',place:'Ginásio de Pewter',bg:{loc:'pewter',rect:[790,544,190,247],panY:.08},intro:[
  'Sou o Brock, líder do Ginásio de Pewter.',
  'Meus Pokémon de Pedra são duros como a minha determinação.',
  'Mostre do que você é capaz!'],
  strong:'Água ou Planta, hein? Você estudou antes de vir. Isso eu respeito.',
  weak:'Você trouxe esse Pokémon contra as minhas rochas? Corajoso... ou ingênuo.',
  retry:['Voltou! Uma rocha só se quebra com insistência.',
   'Treinou mais um pouco? Então vamos de novo.',
   'Gosto de quem não desiste. Pode vir!']},
 {who:'misty',type:'WATER',place:'Ginásio de Cerulean',bg:{loc:'cerulean',rect:[1033,24,258,317],panY:.08},intro:[
  'Oi! Eu sou a Misty, a melhor treinadora de Pokémon de Água!',
  'Minha estratégia é atacar com tudo, como uma onda.',
  'Pronto pra se molhar?'],
  strong:'Elétrico ou Planta? Ai, que chato! Mas não vou pegar leve.',
  weak:'Hahaha! Esse Pokémon vai apagar com um jato d’água!',
  retry:['De novo por aqui? A maré ainda está a meu favor!',
   'Você não desiste mesmo, hein? Gostei.',
   'Desta vez vê se aguenta a correnteza!']},
 {who:'surge',type:'ELECTRIC',place:'Ginásio de Vermilion',bg:{loc:'vermilion',rect:[1034,24,168,340],panY:.08},intro:[
  'Ei, garoto! Eu sou o Lt. Surge, o Relâmpago Americano!',
  'Na guerra, os Pokémon Elétricos salvaram a minha vida.',
  'Vou deixar você paralisado igual eles fizeram com os inimigos!'],
  strong:'Um Pokémon de Terra?! Isso não é justo... mas vamos lá!',
  weak:'Água e Voador são meus alvos favoritos. ZAP!',
  retry:['Voltou pra levar outro choque?',
   'Você tem coragem, soldado. Vamos de novo!',
   'Recarregou as baterias? Eu também!']},
 {who:'erika',type:'GRASS',place:'Ginásio de Celadon',bg:{loc:'celadon',rect:[1154,700,204,298],panY:.08},intro:[
  'Ah, bom dia... Eu sou a Erika, líder de Celadon.',
  'Adoro arranjos de flores e Pokémon de Planta.',
  'Mas não se engane: em batalha eu não perco por gentileza.'],
  strong:'Fogo... minhas flores tremem só de olhar. Mesmo assim, vamos.',
  weak:'Que bonito o seu Pokémon. Pena que as raízes vão segurá-lo.',
  retry:['Ah... você voltou. Que persistência adorável.',
   'Um jardim cresce devagar. Treinadores também.',
   'Vamos tentar mais uma vez, com calma.']},
 {who:'koga',type:'POISON',place:'Ginásio de Fuchsia',bg:{loc:'fuchsia',rect:[1030,23,247,365],panY:.08},intro:[
  'Fwahahaha! Eu sou o Koga, mestre ninja de Fuchsia!',
  'Veneno, confusão e paciência: essas são as minhas armas.',
  'Você vai sentir o poder do ninja!'],
  strong:'Psíquico ou Terra... você enxergou além da fumaça. Impressionante.',
  weak:'Um Pokémon de Planta? O meu veneno vai murchá-lo num instante!',
  retry:['Ainda de pé? O veneno não te convenceu?',
   'Um ninja respeita quem se levanta. Venha!',
   'Fwahaha! Mais uma lição, então.']},
 {who:'sabrina',type:'PSYCHIC',place:'Ginásio de Saffron',bg:{loc:'saffron',rect:[1550,21,402,330],panY:.08},intro:[
  'Eu já sabia que você viria.',
  'Desde criança tenho poderes psíquicos. Eu vi esta batalha.',
  'Mas o futuro não me disse quem venceria.'],
  strong:'Um Inseto ou Fantasma... eu não previ isso. Interessante.',
  weak:'Lutador e Veneno nunca venceram a mente. Você vai entender.',
  retry:['Eu vi você voltar. E vi que ainda falta algo.',
   'Sua mente está mais forte. Será o bastante?',
   'De novo. Desta vez, não feche os olhos.']},
 {who:'blaine',type:'FIRE',place:'Ginásio de Cinnabar',bg:{loc:'cinnabar',rect:[712,22,484,395],panY:.08},intro:[
  'Hah! Eu sou o Blaine, o líder escaldante de Cinnabar!',
  'Meus Pokémon de Fogo transformam tudo em cinzas!',
  'Pegou o Antiqueimadura? Vai precisar!'],
  strong:'Água, Terra ou Pedra... alguém fez a lição de casa! Hah!',
  weak:'Planta, Gelo ou Inseto? Vai virar churrasco!',
  retry:['Voltou pro vulcão? Gosto de quem não esfria!',
   'Hah! A chama da sua vontade ainda queima!',
   'Mais uma rodada no calor?']},
 {who:'giovanni',type:'GROUND',place:'Ginásio de Viridian',bg:{loc:'viridian',rect:[1030,24,320,385],panY:.08},intro:[
  'Então é você quem atrapalhou a Equipe Rocket tantas vezes.',
  'Este é o meu ginásio. Aqui, eu sou o líder mais forte de Kanto.',
  'Vou mostrar por que a Rocket me obedece.'],
  strong:'Água, Planta ou Gelo. Você veio pronto. Não vai adiantar.',
  weak:'Fogo, Elétrico, Pedra... o chão vai engolir tudo isso.',
  retry:['Ainda insiste? Admiro a teimosia. Não a ingenuidade.',
   'Volte quantas vezes quiser. O resultado é o mesmo.',
   'Hm. Você está melhorando. Mostre.']},
 {who:'lorelei',type:'ICE',place:'Liga Pokémon · Elite Four',bg:{loc:'indigo',rect:[8,368,208,208],panY:.4},intro:[
  'Bem-vindo à Liga Pokémon. Eu sou a Lorelei, da Elite Four.',
  'Ninguém lida melhor com Pokémon de Gelo do que eu.',
  'Seus Pokémon vão congelar onde estão!'],
  strong:'Fogo, Lutador, Pedra... você sabe derreter o gelo. Veremos.',
  weak:'Dragões, Voadores, Planta... adoro congelar esses.',
  retry:['De volta ao frio? Que bom que não desistiu.',
   'O gelo não derrete sozinho. Tente outra vez.',
   'Vamos ver se agora você esquenta a batalha.']},
 {who:'bruno',type:'FIGHTING',place:'Liga Pokémon · Elite Four',bg:{loc:'indigo',rect:[224,368,208,208],panY:.4},intro:[
  'Eu sou o Bruno, da Elite Four!',
  'Treino meus Pokémon e meu corpo todos os dias até o limite.',
  'Hoo hah! Prepare-se para a força bruta!'],
  strong:'Voador ou Psíquico! Bom! Isso torna o treino mais duro!',
  weak:'Normal, Pedra, Gelo... meus punhos quebram tudo!',
  retry:['Hoo hah! Voltou pra mais uma rodada!',
   'Músculos crescem depois da derrota. Vamos!',
   'Mostre o que o seu treino rendeu!']},
 {who:'agatha',type:'GHOST',place:'Liga Pokémon · Elite Four',bg:{loc:'indigo',rect:[440,368,208,208],panY:.4},intro:[
  'Eu sou a Agatha, da Elite Four.',
  'O Carvalho e eu já fomos rivais, sabia? Bons tempos...',
  'Vou te mostrar como um treinador de verdade luta!'],
  strong:'Um Fantasma contra os meus? Ha! Pelo menos tem coragem.',
  weak:'Psíquicos não me assustam, criança. Eles me divertem.',
  retry:['Hehehe... voltou do além?',
   'Os fantasmas gostaram de você. Mais uma vez.',
   'Os jovens não aprendem... ou aprendem?']},
 {who:'lance',type:'DRAGON',place:'Liga Pokémon · Elite Four',bg:{loc:'indigo',rect:[8,620,208,190],panY:.4},intro:[
  'Ah, eu ouvi falar de você. Eu sou o Lance, o mestre dos Dragões.',
  'Dragões são Pokémon lendários, quase impossíveis de capturar.',
  'Não há como derrotá-los. Vou provar!'],
  strong:'Gelo ou Dragão... você conhece a fraqueza deles. Impressionante.',
  weak:'Nada resiste à fúria de um Dragão!',
  retry:['Você voltou. Dragões respeitam quem persiste.',
   'Mais uma vez, então. Com tudo!',
   'Mostre que é digno do último desafio.']},
 {who:'rival',type:null,place:'Liga Pokémon · Campeão',bg:{loc:'indigo',rect:[464,600,208,320],panY:.3},intro:[
  'Ei! Que bom que chegou até aqui. Eu sou o Campeão agora!',
  'Enquanto você treinava, eu montei o time perfeito.',
  'Agora eu sou o melhor treinador do mundo. Vem, {rival}!'],
  retry:['Achou que ia ser fácil tirar o título de mim?',
   'Volte quantas vezes quiser. Eu continuo o Campeão!',
   'De novo? Tá bom, eu e o {rival} te esperamos.']}
]);
// Gen III: which attacking types are super effective against `type`.
const BEATS=Object.freeze({
 ROCK:['WATER','GRASS','FIGHTING','GROUND','STEEL'],WATER:['GRASS','ELECTRIC'],
 ELECTRIC:['GROUND'],GRASS:['FIRE','ICE','POISON','FLYING','BUG'],
 POISON:['GROUND','PSYCHIC'],PSYCHIC:['BUG','GHOST','DARK'],
 FIRE:['WATER','GROUND','ROCK'],GROUND:['WATER','GRASS','ICE'],
 ICE:['FIRE','FIGHTING','ROCK','STEEL'],FIGHTING:['FLYING','PSYCHIC'],
 GHOST:['GHOST','DARK'],DRAGON:['ICE','DRAGON']
});
// Gen III: types that the leader's attacking `type` hits super effectively.
const HITS=Object.freeze({
 ROCK:['FIRE','ICE','FLYING','BUG'],WATER:['FIRE','GROUND','ROCK'],
 ELECTRIC:['WATER','FLYING'],GRASS:['WATER','GROUND','ROCK'],POISON:['GRASS'],
 PSYCHIC:['FIGHTING','POISON'],FIRE:['GRASS','ICE','BUG','STEEL'],
 GROUND:['FIRE','ELECTRIC','POISON','ROCK','STEEL'],ICE:['GRASS','GROUND','FLYING','DRAGON'],
 FIGHTING:['NORMAL','ICE','ROCK','DARK','STEEL'],GHOST:['PSYCHIC','GHOST'],DRAGON:['DRAGON']
});
export function matchup(leaderType,leadTypes){
 const t=list(leadTypes).map(x=>String(x).toUpperCase());
 if(!leaderType||!t.length)return 'neutral';
 if(t.some(x=>list(BEATS[leaderType]).includes(x)))return 'strong';
 if(t.some(x=>list(HITS[leaderType]).includes(x)))return 'weak';
 return 'neutral';
}
// Background of a scene: a 16:9 slice of the real FireRed map of the place
// (assets/ui/frlg/<loc>.png, the same sheets as the gym cards), taken from
// the room's rectangle; panY picks how far down the room it sits (leaders
// stand at the top of their gym). Returns {loc,crop:[x,y,w,h]} or null.
export function storyCrop(bg){
 if(!bg?.loc||!Array.isArray(bg.rect))return null;
 const [x,y,w,h]=bg.rect,cw=Math.round(Math.min(w,h*16/9)),ch=Math.round(cw*9/16);
 const pan=Number.isFinite(bg.panY)?bg.panY:.5;
 return {loc:bg.loc,crop:[x+Math.round((w-cw)/2),y+Math.round((h-ch)*pan),cw,ch]};
}
export function storyKey(stage,kind){return kind+'-'+stage}
const pretty=id=>String(id||'').split('-').map(w=>w.charAt(0).toUpperCase()+w.slice(1)).join(' ');
const fill=(text,opponent)=>text.replaceAll('{rival}',pretty(opponent?.id)||'meu Pokémon');
// ctx.leadTypes: types of the player's active Pokémon (for leader reactions).
// Returns {key,place,speaker,lines} or null (no scene / already seen).
export function storyFor(state,opponent,ctx={}){
 if(!opponent)return null;
 const stage=Number(state?.stage),seen=list(state?.storySeen);
 const done=(key,place,lines,bg=null)=>({key,place,bg:storyCrop(bg),speaker:lines[0][0],
  lines:lines.map(([who,text])=>[who,fill(text,opponent)])});
 if(opponent.kind==='leader'||opponent.leader){
  const L=LEADERS[stage];if(!L)return null;
  const key=storyKey(stage,'leader');
  if(seen.includes(key)){
   const losses=Math.max(0,Number(state?.losses)||0);
   return done(key,L.place,[[L.who,L.retry[losses%L.retry.length]]],L.bg);
  }
  const extra=L[matchup(L.type,ctx.leadTypes)];
  return done(key,L.place,[...L.intro,...(extra?[extra]:[])].map(t=>[L.who,t]),L.bg);
 }
 if(!['rival','rocket'].includes(opponent.kind))return null;
 const key=storyKey(stage,opponent.kind),scene=STORY[key];
 if(!scene||seen.includes(key))return null;
 return done(key,scene.place,scene.lines,scene.bg);
}
export function markStorySeen(state,key){
 return {...state,storySeen:[...new Set([...list(state?.storySeen),key])]};
}
