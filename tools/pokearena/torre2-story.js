/* Pokémon Torre 2 — story scenes before the first Rival and Team Rocket
 * battle of each stage, following FireRed's plot. Pure data + rules: shown
 * once per save (state.storySeen), never changing battles or progress.
 */
const list=v=>Array.isArray(v)?v:[];
export const STORY=Object.freeze({
 'rival-0':{place:'Rota 22',lines:[
  ['rival','Ei! Achei você! O Professor Carvalho deu um Pokémon pra cada um de nós.'],
  ['rival','Vamos ver qual dos dois escolheu melhor. Prepare-se!']]},
 'rival-1':{place:'Ponte Pepita · Cerulean',lines:[
  ['rival','Você também está indo pra Cerulean? Eu já peguei um monte de Pokémon!'],
  ['rival','Quero ver se você está treinando de verdade. Batalha!']]},
 'rival-2':{place:'S.S. Anne',lines:[
  ['rival','Também foi convidado pro S.S. Anne? Que coincidência...'],
  ['rival','Já que estamos aqui, vamos ver quem manda neste navio!']]},
 'rival-4':{place:'Torre Pokémon · Lavender',lines:[
  ['rival','O que você está fazendo na Torre Pokémon? Seus Pokémon não morreram, né?'],
  ['rival','Hmm, eles parecem fortes. Deixa eu testar isso!']]},
 'rival-5':{place:'Silph Co. · Saffron',lines:[
  ['rival','Cheguei antes de você na Silph Co.! A Equipe Rocket está em todo lugar aqui.'],
  ['rival','Mas antes de resolver isso, vamos ver quem é mais forte!']]},
 'rival-8':{place:'Rota 22 · Planalto Índigo',lines:[
  ['rival','Juntei as 8 insígnias também. Vou ser o próximo Campeão!'],
  ['rival','Você é o último obstáculo antes da Liga. Vem!']]},
 'rocket-1':{place:'Mt. Moon',lines:[
  ['rocket','Somos da Equipe Rocket! Esses fósseis do Mt. Moon são nossos!'],
  ['rocket','Some daqui, criança, ou vai se arrepender!']]},
 'rocket-3':{place:'Esconderijo Rocket · Celadon',lines:[
  ['rocket','Ei! O Cassino é só fachada... você achou o esconderijo da Equipe Rocket!'],
  ['rocket','Ninguém que descobre o nosso segredo sai daqui!']]},
 'rocket-5':{place:'Silph Co. · Saffron',lines:[
  ['rocket','A Silph Co. agora pertence à Equipe Rocket!'],
  ['rocket','O chefe quer a Master Ball. Você não vai atrapalhar!']]},
 'rocket-7':{place:'Viridian',lines:[
  ['rocket','O chefe está ocupado e ninguém passa por aqui.'],
  ['rocket','Você derrotou a gente tantas vezes... desta vez não!']]}
});
export function storyKey(stage,kind){return kind+'-'+stage}
// Scene to show before this battle, or null (already seen / no story).
export function storyFor(state,opponent){
 if(!opponent||!['rival','rocket'].includes(opponent.kind))return null;
 const key=storyKey(Number(state?.stage),opponent.kind),scene=STORY[key];
 if(!scene||list(state?.storySeen).includes(key))return null;
 return {key,...scene};
}
export function markStorySeen(state,key){
 return {...state,storySeen:[...new Set([...list(state?.storySeen),key])]};
}
