/* Johto 46 move behavior research - Gen III / FireRed / LeafGreen.
 * Sources: https://pokemondb.net/move/generation/2 and move-specific pages.
 * https://bulbapedia.bulbagarden.net/wiki/List_of_changed_moves
 * Research docs and visual direction; NOT 46 playable mechanics.
 * Preserve 3 user-approved VFX and main game.
 */
export const JOHTO_GEN3_SOURCE="https://pokemondb.net/move/generation/2";
export const JOHTO_GEN3_SPEC=Object.freeze(Object.fromEntries(
[
 [
  "triple-kick",
  "triple-hit",
  "foe",
  "Três chutes: força 10, 20 e 30, precisão verificada por impacto.",
  "Três golpes crescentes; parar no primeiro erro."
 ],
 [
  "thief",
  "steal-return",
  "travel",
  "Acerta e pode roubar o item segurado pelo adversário.",
  "Golpe escuro vai e volta; itens ainda indisponíveis no lab."
 ],
 [
  "snore",
  "sound-wave",
  "travel",
  "Só funciona se o usuário estiver dormindo; pode causar recuo.",
  "Ondas sonoras rítmicas partem do usuário."
 ],
 [
  "powder-snow",
  "approved",
  "foe",
  "Sopro de neve causa dano e pode congelar.",
  "Preservar VFX aprovado."
 ],
 [
  "octazooka",
  "ink-projectile",
  "travel",
  "Jato de tinta que pode baixar a precisão do alvo.",
  "Tinta escura voa e explode no alvo."
 ],
 [
  "zap-cannon",
  "approved",
  "foe",
  "Projétil de baixa precisão causa paralisia quando acerta.",
  "Preservar VFX aprovado com Electro Ball."
 ],
 [
  "false-swipe",
  "arc-slash",
  "foe",
  "Dano não pode nocautear: sempre deixa pelo menos 1 HP.",
  "Corte nítido que se detém antes de nocautear."
 ],
 [
  "steel-wing",
  "wing-sweep",
  "foe",
  "Asa metálica pode aumentar a defesa do usuário.",
  "Dois arcos metálicos em varredura."
 ],
 [
  "return",
  "return-dash",
  "travel",
  "Força do golpe depende da amizade alta.",
  "Investida luminosa; amizade real pendente no lab."
 ],
 [
  "present",
  "gift-arc",
  "travel",
  "Presente com potência variável ou que cura alvo.",
  "Presente sobe em arco; pode explodir ou curar."
 ],
 [
  "frustration",
  "rage-dash",
  "travel",
  "Força do golpe depende da amizade baixa.",
  "Impacto vermelho e pesado; amizade real pendente no lab."
 ],
 [
  "magnitude",
  "seismic",
  "field",
  "Magnitude usa sete valores ponderados de 4 até 10.",
  "Fendas no solo expandem ao redor do alvo."
 ],
 [
  "pursuit",
  "shadow-chase",
  "travel",
  "Força dobra se o oponente estiver trocando de Pokémon.",
  "Rastro sombrio persegue o alvo; troca ausente no lab."
 ],
 [
  "vital-throw",
  "lift-drop",
  "foe",
  "Ataque inevitável que age por último em turnos.",
  "Elevação seguida por arremesso; prioridade pendente no lab."
 ],
 [
  "hidden-power",
  "iv-orbs",
  "travel",
  "Tipo e força (30 a 70) derivam de IVs na Gen III.",
  "Orbes saem do usuário; IVs não simulados."
 ],
 [
  "rock-smash",
  "shatter",
  "foe",
  "Quebra rocha e pode diminuir defesa do alvo.",
  "Pedra racha em fragmentos sobre alvo."
 ],
 [
  "whirlpool",
  "approved",
  "foe",
  "Redemoinho prende e causa dano continuado em turnos.",
  "Preservar VFX aprovado."
 ],
 [
  "beat-up",
  "party-hits",
  "foe",
  "Ataca uma vez por aliado saudável, fórmula Gen III específica.",
  "Sequência por membros da equipe, sem inventar aliados."
 ],
 [
  "sketch",
  "copy-rune",
  "self",
  "Copia permanentemente o último golpe do inimigo.",
  "Runas de cópia; persistência desabilitada no lab."
 ],
 [
  "spider-web",
  "web-trap",
  "foe",
  "Teia impede troca ou fuga do oponente.",
  "Fios cruzados prendem o alvo."
 ],
 [
  "mind-reader",
  "target-lock",
  "both",
  "Fixa mira para o próximo golpe acertar o alvo.",
  "Anel do usuário forma mira no alvo."
 ],
 [
  "nightmare",
  "sleep-haunt",
  "foe",
  "Somente alvo dormindo sofre 1/4 do HP por turno.",
  "Sombras agarram o alvo; dano residual pendente."
 ],
 [
  "curse",
  "curse-dual",
  "both",
  "Fantasma perde metade do HP e amaldiçoa; não fantasma sobe Attack e Defesa e perde Speed.",
  "Mewtwo não é Ghost: aura de status próprio."
 ],
 [
  "conversion-2",
  "type-shift",
  "self",
  "Muda o tipo do usuário para resistir ao último golpe sofrido.",
  "Paleta troca no usuário; precisa rastrear último dano."
 ],
 [
  "cotton-spore",
  "spore-drift",
  "travel",
  "Nuvem de algodão reduz muito a velocidade adversária.",
  "Esporos flutuam lentamente até o alvo."
 ],
 [
  "spite",
  "pp-drain",
  "travel",
  "Consome 2 a 5 PP do último movimento usado pelo alvo.",
  "Fragmentos PP retornam ao usuário; sem PP no lab."
 ],
 [
  "sweet-kiss",
  "confuse-hearts",
  "foe",
  "Beijo confunde sem dano; em Gen III é tipo NORMAL.",
  "Corações pequenos giram em volta do alvo."
 ],
 [
  "belly-drum",
  "drum-burst",
  "self",
  "Consome metade do HP máximo e maximiza Attack.",
  "Rufar de tambor centrado no usuário."
 ],
 [
  "spikes",
  "ground-spikes",
  "field",
  "Espinhos prejudicam Pokémon que entrarem no campo.",
  "Espinhos fincados no chão, sem projéteis."
 ],
 [
  "foresight",
  "ghost-reveal",
  "foe",
  "Revela fantasmas contra golpes Normal e Lutador e ignora evasão elevada.",
  "Marca de reconhecimento aparece sobre adversário."
 ],
 [
  "destiny-bond",
  "fate-link",
  "both",
  "Se o usuário for nocauteado, pode levar o alvo junto.",
  "Energia conecta os dois combatentes."
 ],
 [
  "perish-song",
  "perish-notes",
  "both",
  "Ambos caem em três turnos se continuarem em batalha.",
  "Notas musicais envolvem ambos, não só adversário."
 ],
 [
  "detect",
  "avoid-shield",
  "self",
  "Protege no turno e pode falhar em usos consecutivos.",
  "Flash curto de esquiva junto ao usuário."
 ],
 [
  "endure",
  "endure-guard",
  "self",
  "Resiste a dano letal e fica com ao menos 1 HP.",
  "Escudo próximo ao usuário, não cura."
 ],
 [
  "swagger",
  "taunt-confuse",
  "foe",
  "Aumenta muito Attack do alvo mas causa confusão.",
  "Aura agressiva confusa no adversário."
 ],
 [
  "milk-drink",
  "milk-heal",
  "self",
  "Recupera metade do HP máximo do usuário.",
  "Cura ascendente junto ao usuário."
 ],
 [
  "mean-look",
  "gaze-lock",
  "foe",
  "Olhar intimidador impede troca ou fuga.",
  "Olho assombroso fixa o alvo."
 ],
 [
  "attract",
  "attract-hearts",
  "foe",
  "Só funciona em gênero oposto; Mewtwo é sem gênero.",
  "Corações exibem falha no lab com Mewtwo."
 ],
 [
  "sleep-talk",
  "dream-voice",
  "self",
  "Enquanto dorme usa outra habilidade aleatória própria.",
  "Sono e ondas, seleção aleatória real pendente."
 ],
 [
  "heal-bell",
  "bell-waves",
  "self",
  "Remove condições de status do time.",
  "Sino e ondas partem do usuário."
 ],
 [
  "pain-split",
  "hp-balance",
  "both",
  "Reparte HP deixando ambos com média aritmética do HP atual.",
  "Fluxos de energia em sentidos opostos."
 ],
 [
  "baton-pass",
  "relay-sprint",
  "self",
  "Troca de Pokémon transferindo mudanças de atributos.",
  "Aura de passagem; troca de equipe indisponível."
 ],
 [
  "encore",
  "clap-notes",
  "foe",
  "Repete último golpe do adversário por 2-6 turnos na Gen III.",
  "Palmas e notas em torno do alvo."
 ],
 [
  "sweet-scent",
  "scent-cloud",
  "travel",
  "Aroma reduz evasão adversária.",
  "Pólen rosa perfumado flutua ao alvo."
 ],
 [
  "morning-sun",
  "sunrise-heal",
  "self",
  "Recupera metade do HP, dois terços sob sol e um quarto sob outros climas.",
  "Raios solares ascendentes no usuário."
 ],
 [
  "psych-up",
  "stats-copy",
  "both",
  "Copia as alterações de atributos do adversário.",
  "Aura parte do alvo e termina no usuário."
 ]
]
.map(([id,motion,anchor,effect,visual])=>[id,Object.freeze({
 id,motion,anchor,effect,visual,source:"https://pokemondb.net/move/"+id,
 approved:["powder-snow","whirlpool","zap-cannon"].includes(id)})])));
export const JOHTO_GEN3_IDS=Object.freeze(Object.keys(JOHTO_GEN3_SPEC));
export const JOHTO_GEN3_STATUS=Object.freeze({
  preserved:3,visuallyUnapproved:43,visualOnly:28,
  gameplay:"Gen III combat parity NOT yet implemented for all 46",
  preview:"isolated Mewtwo Training Lab",cooldown:1
});
