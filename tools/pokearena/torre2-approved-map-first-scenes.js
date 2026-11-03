/* T41: verified click targets placed on the four user-approved pixel-art scenes.
 * These are presentation coordinates, NOT battle/save progression checkpoints.
 * Backgrounds are 1280x720 and the renderer scales them uniformly.
 */
const v=(id,cx,cy,w,h)=>Object.freeze({id,cx,cy,w,h,validated:'visual'});
export const FIRST_APPROVED_HOTSPOTS=Object.freeze({
 // Route 2 is the first original approved WebP (1280x720).
 // NORTH: painted PEWTER CITY sign; SOUTH: VIRIDIAN FOREST sign.
 // The cave at left is decorative until a Diglett's Cave scene exists.
 // Forest art is still absent: its hotspot deliberately has no destination.
 'route-2':Object.freeze([
  v('pewter',.546,.069,.145,.122),
  v('forest',.480,.932,.175,.118)
 ]),
 'pewter-city':Object.freeze([
  v('center',.184,.385,.12,.14),
  v('mart',.183,.612,.12,.14),
  v('gym',.800,.288,.14,.15),
  v('route2',.460,.867,.16,.11),
  v('route3',.952,.453,.09,.14)
 ]),
 'gym-brock':Object.freeze([
  v('challenge',.502,.237,.19,.16),
  v('exit',.500,.921,.20,.11)
 ]),
 // Four consecutive ORIGINAL images from the 60-map approved atlas.
 // Touch only painted street signs/existing cave entrances. No new map art.
 'route-3':Object.freeze([
  v('pewter',.070,.486,.132,.132),
  v('route4',.927,.485,.135,.130)
 ]),
 'route-4-west':Object.freeze([
  v('center',.295,.368,.145,.142),
  v('route3',.499,.913,.182,.133),
  v('moon',.749,.390,.163,.155)
 ]),
 'mt-moon':Object.freeze([
  v('entrance',.101,.917,.165,.141),
  v('exit',.925,.081,.148,.143)
 ]),
 'route-4-east':Object.freeze([
  v('moon',.073,.489,.135,.135),
  v('cerulean',.919,.394,.152,.145)
 ]),
 'cerulean-city':Object.freeze([
  v('center',.290,.369,.11,.14),
  v('mart',.495,.359,.10,.13),
  v('gym',.705,.355,.14,.16),
  v('route4',.057,.693,.10,.13),
  v('route24',.476,.072,.12,.12),
  v('route5',.505,.962,.14,.07),
  v('route9',.971,.500,.055,.16)
 ]),
 'gym-misty':Object.freeze([
  v('challenge',.505,.220,.20,.16),
  v('exit',.505,.918,.19,.13)
 ]),
 // T62: exact original approved route paintings, indices 10–14.
 // Billboard at Bill's house and Saffron's blocked gate do not create
 // extra interiors, gifts or early unlocks.
 'route-24':Object.freeze([
  v('cerulean',.505,.883,.167,.126),
  v('route25',.887,.113,.165,.135)
 ]),
 'route-25':Object.freeze([
  v('route24',.052,.433,.100,.144)
 ]),
 'route-5':Object.freeze([
  v('cerulean',.499,.061,.164,.118),
  v('underground',.893,.667,.178,.169)
 ]),
 'underground-5-6':Object.freeze([
  v('route5',.500,.060,.170,.119),
  v('route6',.500,.854,.170,.145)
 ]),
 'route-6':Object.freeze([
  v('underground',.873,.139,.165,.177),
  v('vermilion',.503,.913,.184,.140)
 ]),
 // Reviewed against the actual approved 1280×720 concept images.
 'vermilion-city':Object.freeze([
  v('center',.274,.300,.105,.110),
  v('mart',.654,.303,.105,.110),
  v('gym',.196,.686,.145,.120),
  v('ship',.598,.688,.160,.130),
  v('route6',.469,.085,.135,.145),
  v('route11',.946,.400,.095,.155)
 ]),
 'gym-surge':Object.freeze([
  v('challenge',.496,.227,.195,.160),
  v('exit',.501,.934,.170,.120)
 ]),
 // S.S. Anne: the only working exit leads to the painted VERMILION CITY door.
 // Captain/CUT, cabins and deck are NOT gameplay destinations yet. Never
 // grant HMs or invent battles from decorative text painted in the image.
 'ss-anne':Object.freeze([
  v('exit',.480,.910,.220,.120)
 ]),
 // Celadon 1280x720. Exact door/sign anchors, no scene repaint or zoom.
 'celadon-city':Object.freeze([
  v('center',.252,.526,.123,.120),
  v('mart',.500,.294,.142,.116),
  v('gym',.501,.825,.166,.126),
  v('game',.727,.318,.137,.125),
  v('route16',.070,.352,.119,.129),
  v('route7',.938,.353,.102,.130)
 ]),
 'gym-erika':Object.freeze([
  v('challenge',.503,.247,.182,.125),
  v('exit',.502,.946,.182,.100)
 ]),
 // Fuchsia: exactly the painted buildings/route signs, normalized from
 // the approved 1280x720 artwork. No movable overworld or forced HM.
 'fuchsia-city':Object.freeze([
  v('center',.501,.741,.133,.116),
  v('mart',.183,.311,.148,.128),
  v('gym',.197,.777,.147,.130),
  v('safari',.503,.144,.188,.120),
  v('route18',.056,.408,.094,.111),
  v('route15',.946,.405,.103,.111),
  v('route19',.500,.925,.147,.103)
 ]),
 'gym-koga':Object.freeze([
  v('challenge',.503,.236,.204,.140),
  v('exit',.501,.937,.175,.105)
 ]),
 // T64: use only four non-overlapping pre-existing building anchors in the ORIGINAL Saffron
 // 1280x720 atlas. The four painted city gates are intentionally NOT active:
 // no adjacent route has yet been audited for a reciprocal Saffron entrance.
 'saffron-city':Object.freeze([
  v('silph',.490,.470,.280,.450),
  v('center',.230,.700,.190,.260),
  v('mart',.780,.720,.190,.260),
  v('gym',.870,.200,.160,.220)
 ]),
 // T65: actual approved interiors and seaside coast (atlas 33-41).
 // Stage-specific battle, Card Key, fossil, and HM scripts are NOT inferred
 // from written labels or pictures in the scenery.
 'silph-co':Object.freeze([
  v('exit',.500,.938,.187,.115)
 ]),
 'fighting-dojo':Object.freeze([
  v('exit',.500,.925,.183,.128)
 ]),
 'gym-sabrina':Object.freeze([
  v('challenge',.501,.242,.187,.163),
  v('exit',.502,.930,.191,.124)
 ]),
 'routes-19-20':Object.freeze([
  v('fuchsia',.952,.124,.094,.129),
  v('seafoam',.214,.343,.161,.153)
 ]),
 'seafoam-islands':Object.freeze([
  v('route19',.914,.743,.164,.152),
  v('cinnabar',.080,.740,.153,.154)
 ]),
 'cinnabar-island':Object.freeze([
  v('mansion',.253,.331,.151,.145),
  v('gym',.748,.333,.148,.146),
  v('center',.473,.743,.144,.124),
  v('mart',.648,.742,.136,.122),
  v('route21',.500,.063,.155,.119),
  v('seafoam',.943,.502,.104,.141)
 ]),
 'pokemon-mansion':Object.freeze([
  v('exit',.503,.923,.201,.127)
 ]),
 'gym-blaine':Object.freeze([
  v('challenge',.500,.235,.194,.160),
  v('exit',.499,.929,.190,.121)
 ]),
 'route-21':Object.freeze([
  v('cinnabar',.503,.929,.198,.119)
 ]),
 // T66: original six approved backgrounds 42–47; no invented Viridian exit.
 'gym-giovanni':Object.freeze([
  v('challenge',.501,.238,.196,.155)
 ]),
 'routes-22-23':Object.freeze([
  v('victory',.573,.132,.184,.148)
 ]),
 'victory-road':Object.freeze([
  v('indigo',.502,.069,.184,.130),
  v('route23',.503,.941,.185,.115)
 ]),
 'indigo-plateau':Object.freeze([
  v('challenge',.501,.309,.174,.148),
  v('victory',.501,.937,.192,.118)
 ]),
 // Elite Four share ONE original approved background, not five maps.
 'elite-four-rooms':Object.freeze([
  v('bruno',.499,.148,.153,.137),
  v('agatha',.835,.148,.153,.137),
  v('lance',.254,.765,.153,.143),
  v('champion',.753,.765,.163,.145),
  v('hall',.753,.565,.151,.116),
  v('indigo',.140,.472,.150,.119)
 ]),
 'hall-of-fame':Object.freeze([
  v('elite',.497,.937,.182,.116)
 ]),
 // Safari park's only registered action is the signed south exit.
 // Gold Teeth and HM03 labels are decorative until a validated gameplay
 // interaction is implemented; don't grant HMs, items or badges.
 'safari-zone':Object.freeze([
  v('exit',.500,.908,.182,.111)
 ]),
 // T63: these nine image-backed scenes are already among the ORIGINAL 60.
 // Mark only painted exits; do not invent the false Route 11→Route 3 link.
 'route-11':Object.freeze([
  v('vermilion',.070,.522,.136,.155)
 ]),
 'route-9-solo':Object.freeze([
  v('cerulean',.070,.433,.137,.148),
  v('route10',.931,.431,.138,.152)
 ]),
 'routes-9-10':Object.freeze([
  v('route9',.070,.434,.138,.151),
  v('lavender',.654,.610,.132,.132)
 ]),
 'lavender-town':Object.freeze([
  v('route10',.406,.091,.160,.135),
  v('tower',.641,.427,.178,.148),
  v('route8',.065,.547,.122,.134),
  v('route12',.455,.899,.144,.145),
  v('center',.360,.633,.144,.147),
  v('mart',.752,.637,.137,.150)
 ]),
 'routes-7-8':Object.freeze([
  v('celadon',.066,.432,.128,.140),
  v('lavender',.933,.432,.131,.145)
 ]),
 'rocket-hideout':Object.freeze([
  v('exit',.505,.924,.183,.126)
 ]),
 'pokemon-tower':Object.freeze([
  v('exit',.505,.921,.190,.135)
 ]),
 'routes-12-15':Object.freeze([
  v('lavender',.943,.090,.113,.131),
  v('fuchsia',.065,.760,.129,.126)
 ]),
 'routes-16-18':Object.freeze([
  v('celadon',.055,.166,.108,.128),
  v('fuchsia',.945,.921,.107,.134)
 ]),
 // T67: all thirteen scenes are IDENTICAL approved WebPs #48–60.
 // Ferry ports are real signs on the island artworks. Never create
 // fake interiors for dotted hole, berry forest or Lost Cave.
 'sevii-1':Object.freeze([
  v('ember',.500,.056,.180,.100),
  v('center',.506,.398,.179,.143),
  v('port',.182,.615,.161,.144)
 ]),
 'mt-ember':Object.freeze([
  v('island1',.497,.931,.192,.115)
 ]),
 'sevii-2':Object.freeze([
  v('mart',.281,.440,.138,.133),
  v('center',.374,.606,.170,.145),
  v('port',.198,.747,.148,.137)
 ]),
 'sevii-3':Object.freeze([
  v('center',.532,.424,.178,.145),
  v('mart',.735,.430,.157,.145),
  v('port',.379,.764,.163,.143)
 ]),
 'sevii-4':Object.freeze([
  v('center',.557,.418,.170,.150),
  v('mart',.547,.688,.146,.130),
  v('icefall',.893,.097,.169,.123),
  v('port',.357,.751,.149,.137)
 ]),
 'icefall-cave':Object.freeze([
  v('island4',.500,.931,.181,.115)
 ]),
 'sevii-5':Object.freeze([
  v('center',.375,.403,.177,.149),
  v('mart',.387,.632,.149,.126),
  v('warehouse',.804,.416,.158,.139),
  v('port',.194,.757,.156,.144)
 ]),
 'rocket-warehouse':Object.freeze([
  v('island5',.500,.923,.187,.130)
 ]),
 'sevii-6':Object.freeze([
  v('center',.387,.393,.129,.139),
  v('mart',.555,.394,.125,.139),
  v('port',.208,.755,.153,.137)
 ]),
 // The five originally catalogued island-seven zones remain unchanged,
 // including its real Tower, Canyon, PC, Mart and Ferry signs.
 'sevault-canyon':Object.freeze([
  v('island7',.622,.083,.183,.125),
  v('tanoby',.508,.923,.181,.126)
 ]),
 // The original seven Tanoby chamber shapes stay in the atlas. Only
 // the canyon exit navigates; chamber names do not grant encounters.
 'trainer-tower':Object.freeze([
  v('battle-1',.260,.770,.180,.100),
  v('battle-2',.260,.646,.180,.100),
  v('battle-3',.280,.480,.171,.100),
  v('battle-4',.280,.349,.171,.100),
  v('battle-5',.750,.773,.180,.100),
  v('battle-6',.750,.640,.180,.100),
  v('battle-7',.750,.485,.180,.100),
  v('battle-8',.750,.349,.180,.100),
  v('final',.510,.167,.165,.155),
  v('exit',.500,.928,.170,.110)
 ])
});
export const FIRST_APPROVED_DESTINATIONS=Object.freeze({
 'route-2':Object.freeze({pewter:'pewter-city'}),
 'pewter-city':Object.freeze({route2:'route-2',route3:'route-3',gym:'gym-brock'}),
 'gym-brock':Object.freeze({exit:'pewter-city'}),
 'route-3':Object.freeze({pewter:'pewter-city',route4:'route-4-west'}),
 'route-4-west':Object.freeze({
  route3:'route-3',moon:'mt-moon'
 }),
 'mt-moon':Object.freeze({
  entrance:'route-4-west',exit:'route-4-east'
 }),
 'route-4-east':Object.freeze({
  moon:'mt-moon',cerulean:'cerulean-city'
 }),
 'cerulean-city':Object.freeze({route4:'route-4-east',route24:'route-24',
   route5:'route-5',route9:'route-9-solo',gym:'gym-misty'}),
 'gym-misty':Object.freeze({exit:'cerulean-city'}),
 'route-24':Object.freeze({cerulean:'cerulean-city',route25:'route-25'}),
 'route-25':Object.freeze({route24:'route-24'}),
 'route-5':Object.freeze({cerulean:'cerulean-city',underground:'underground-5-6'}),
 'underground-5-6':Object.freeze({route5:'route-5',route6:'route-6'}),
 'route-6':Object.freeze({underground:'underground-5-6',vermilion:'vermilion-city'}),
 'vermilion-city':Object.freeze({
  gym:'gym-surge',ship:'ss-anne',route6:'route-6',route11:'route-11'
 }),
 'gym-surge':Object.freeze({exit:'vermilion-city'}),
 'ss-anne':Object.freeze({exit:'vermilion-city'}),
 'celadon-city':Object.freeze({
  gym:'gym-erika',game:'rocket-hideout',
  route16:'routes-16-18',route7:'routes-7-8'
 }),
 'gym-erika':Object.freeze({exit:'celadon-city'}),
 'fuchsia-city':Object.freeze({
  gym:'gym-koga',safari:'safari-zone',
  route18:'routes-16-18',route15:'routes-12-15',
  route19:'routes-19-20'
 }),
 'gym-koga':Object.freeze({exit:'fuchsia-city'}),
 // T64: no unverified Saffron route shortcuts; native stage locks still apply.
 'saffron-city':Object.freeze({
  silph:'silph-co',gym:'gym-sabrina'
 }),
 'silph-co':Object.freeze({exit:'saffron-city'}),
 'fighting-dojo':Object.freeze({exit:'saffron-city'}),
 'gym-sabrina':Object.freeze({exit:'saffron-city'}),
 'routes-19-20':Object.freeze({
  fuchsia:'fuchsia-city',seafoam:'seafoam-islands'
 }),
 'seafoam-islands':Object.freeze({
  route19:'routes-19-20',cinnabar:'cinnabar-island'
 }),
 'cinnabar-island':Object.freeze({
  mansion:'pokemon-mansion',gym:'gym-blaine',
  route21:'route-21',seafoam:'seafoam-islands'
 }),
 'pokemon-mansion':Object.freeze({exit:'cinnabar-island'}),
 'gym-blaine':Object.freeze({exit:'cinnabar-island'}),
 'route-21':Object.freeze({cinnabar:'cinnabar-island'}),
 'routes-22-23':Object.freeze({victory:'victory-road'}),
 'victory-road':Object.freeze({route23:'routes-22-23',indigo:'indigo-plateau'}),
 'indigo-plateau':Object.freeze({victory:'victory-road'}),
 'elite-four-rooms':Object.freeze({indigo:'indigo-plateau',hall:'hall-of-fame'}),
 'hall-of-fame':Object.freeze({elite:'elite-four-rooms'}),
 'safari-zone':Object.freeze({exit:'fuchsia-city'}),
 'route-11':Object.freeze({vermilion:'vermilion-city'}),
 'route-9-solo':Object.freeze({cerulean:'cerulean-city',route10:'routes-9-10'}),
 'routes-9-10':Object.freeze({route9:'route-9-solo',lavender:'lavender-town'}),
 'lavender-town':Object.freeze({
  route10:'routes-9-10',tower:'pokemon-tower',
  route8:'routes-7-8',route12:'routes-12-15'
 }),
 'routes-7-8':Object.freeze({celadon:'celadon-city',lavender:'lavender-town'}),
 'rocket-hideout':Object.freeze({exit:'celadon-city'}),
 'pokemon-tower':Object.freeze({exit:'lavender-town'}),
 'routes-12-15':Object.freeze({lavender:'lavender-town',fuchsia:'fuchsia-city'}),
 'routes-16-18':Object.freeze({celadon:'celadon-city',fuchsia:'fuchsia-city'}),
 'sevii-1':Object.freeze({ember:'mt-ember'}),
 'mt-ember':Object.freeze({island1:'sevii-1'}),
 'sevii-4':Object.freeze({icefall:'icefall-cave'}),
 'icefall-cave':Object.freeze({island4:'sevii-4'}),
 'sevii-5':Object.freeze({warehouse:'rocket-warehouse'}),
 'rocket-warehouse':Object.freeze({island5:'sevii-5'}),
 'sevii-7':Object.freeze({tower:'trainer-tower',canyon:'sevault-canyon'}),
 'sevault-canyon':Object.freeze({island7:'sevii-7',tanoby:'tanoby-ruins'}),
 'tanoby-ruins':Object.freeze({exit:'sevault-canyon'}),
 'trainer-tower':Object.freeze({exit:'sevii-7'})
});
export function hasFirstApprovedHotspots(id){
 return Object.prototype.hasOwnProperty.call(FIRST_APPROVED_HOTSPOTS,id);
}
export function firstApprovedHotspots(entry){
 return FIRST_APPROVED_HOTSPOTS[entry?.id]||entry?.hotspots||[];
}
export function firstApprovedDestination(mapId,hotspotId){
 return FIRST_APPROVED_DESTINATIONS[mapId]?.[hotspotId]||null;
}

/* Native FireRed NPCs for the approved image-backed gym interiors.
 * Trainers REUSE the existing route/gym checkpoints for each stage.
 * They do not introduce a second save index or grant battle rewards.
 */
export const FIRST_APPROVED_GYM_LAYOUTS=Object.freeze({
 'gym-brock':Object.freeze({
  stage:0,leader:Object.freeze({kind:'brock',cx:.480,cy:.240}),
  ace:Object.freeze({dex:'0095',cx:.570,cy:.235}),
  trainers:Object.freeze([
   Object.freeze({kind:'hiker',cx:.27,cy:.54}),
   Object.freeze({kind:'youngster',cx:.73,cy:.54}),
   Object.freeze({kind:'hiker',cx:.50,cy:.72})
  ])
 }),
 'gym-misty':Object.freeze({
  stage:1,leader:Object.freeze({kind:'misty',cx:.470,cy:.230}),
  // Original Starmie PMD Idle stands on the leader's upper stone dais.
  ace:Object.freeze({dex:'0121',cx:.570,cy:.260}),
  // T77: four WATER-themed original FRLG land-standing overworld sheets.
  // The player requested no Picnicker/Camper in our CUSTOM four-trainer
  // variant (the original FRLG only has two non-leader trainers).
  // Land swimmers and tubers stand naturally on the four stone platforms.
  trainers:Object.freeze([
   Object.freeze({kind:'swimmer',cx:.27,cy:.465}),
   Object.freeze({kind:'swimmer_f',cx:.73,cy:.465}),
   Object.freeze({kind:'tuber_m',cx:.27,cy:.695}),
   Object.freeze({kind:'tuber_f',cx:.73,cy:.695})
  ])
 }),
 // The USER REPLACED the painted Surge background with a clean map on
 // 2026-11-03. Overlay original FRLG actors on the four EMPTY platforms;
 // do not modify the original archived WebP or invent any new battle index.
 'gym-surge':Object.freeze({
  stage:2,
  leader:Object.freeze({kind:'surge',cx:.480,cy:.240}),
  ace:Object.freeze({dex:'0026',cx:.565,cy:.240}),
  trainers:Object.freeze([
   Object.freeze({kind:'sailor',cx:.169,cy:.397}),
   Object.freeze({kind:'rocker',cx:.841,cy:.397}),
   Object.freeze({kind:'gentleman',cx:.169,cy:.727}),
   Object.freeze({kind:'worker_m',cx:.840,cy:.727})
  ])
 }),
 // Empty battle circles in the approved greenhouse: overlay real 16x32
 // FireRed sprites and reuse the last four saved battle checkpoints.
 'gym-erika':Object.freeze({
  stage:3,leader:Object.freeze({kind:'erika',cx:.493,cy:.248}),
  ace:Object.freeze({dex:'0045',cx:.592,cy:.265}),
  // Four original FRLG Grass-gym trainer classes, each a distinct sheet.
  // Unlike Surge, these circles are empty in the approved WebP background.
  trainers:Object.freeze([
   Object.freeze({kind:'lass',cx:.174,cy:.350}),
   Object.freeze({kind:'beauty',cx:.825,cy:.351}),
   Object.freeze({kind:'picnicker',cx:.153,cy:.718}),
   Object.freeze({kind:'ace_f',cx:.834,cy:.718})
  ])
 }),
 // Koga's four platforms have no painted trainer sprites: overlay original
 // 16x32 FireRed NPCs. They reuse the stage-4 route's saved battle indices.
 'gym-koga':Object.freeze({
  stage:4,leader:Object.freeze({kind:'koga',cx:.495,cy:.260}),
  ace:Object.freeze({dex:'0110',cx:.587,cy:.258}),
  trainers:Object.freeze([
   Object.freeze({kind:'biker',cx:.265,cy:.400}),
   Object.freeze({kind:'psychic',cx:.737,cy:.400}),
   Object.freeze({kind:'ace',cx:.267,cy:.763}),
   Object.freeze({kind:'biker',cx:.736,cy:.763})
  ])
 })
});
// Theme audit for every approved gym with named/interactive NPC layouts.
 // "painted" scenes cannot be repainted without changing approved WebPs.
 // "pending" stages remain explicitly listed rather than falsely certified.
export const APPROVED_GYM_NPC_THEMES=Object.freeze({
 'gym-brock':Object.freeze({theme:'rock',status:'review',allowed:['hiker','youngster']}),
 'gym-misty':Object.freeze({theme:'water',status:'validated',
  allowed:['swimmer','swimmer_f','tuber_m','tuber_f']}),
 'gym-surge':Object.freeze({theme:'electric',status:'validated',
  allowed:['sailor','rocker','gentleman','worker_m']}),
 'gym-erika':Object.freeze({theme:'grass',status:'validated',
  allowed:['lass','beauty','picnicker','ace_f']}),
 'gym-koga':Object.freeze({theme:'poison',status:'review',
  allowed:['biker','juggler','tamer','psychic']})
});
export function auditApprovedGymNpcThemes(){
 return Object.freeze(Object.entries(FIRST_APPROVED_GYM_LAYOUTS).map(([id,layout])=>{
  const policy=APPROVED_GYM_NPC_THEMES[id];
  const unexpected=layout.artworkOnly?[]:
   layout.trainers.map(actor=>actor.kind).filter(kind=>!policy?.allowed.includes(kind));
  return Object.freeze({id,theme:policy?.theme||'unknown',
   status:policy?.status||'missing-policy',
   artworkOnly:layout.artworkOnly===true,
   renderedNpcCount:layout.artworkOnly?0:layout.trainers.length,
   unexpected:Object.freeze([...unexpected])});
 }));
}
// Decode an actual local SpriteCollab PMD Idle sheet. No portrait, no new
// external runtime request, no guessed sprite frame dimensions.
export function approvedGymAceIdlePlan(dex,manifest){
 if(!/^[0-9]{4}$/.test(String(dex||'')))return null;
 const idle=manifest?.[dex]?.anims?.Idle;
 const file=idle?.file;
 if(!idle||!Number.isInteger(idle.fw)||idle.fw<12||idle.fw>256||
    !Number.isInteger(idle.fh)||idle.fh<12||idle.fh>256||
    !Array.isArray(idle.durations)||idle.durations.length<1||
    idle.durations.length>40||
    typeof file!=='string'||!file.startsWith(dex+'/')||
    !/^[A-Za-z0-9_-]+-Anim[.]png$/.test(file.slice(5)))
  return null;
 return Object.freeze({dex,key:'torre2-gym-ace-idle-'+dex,
  file:'assets/pmd/'+file,fw:idle.fw,fh:idle.fh,
  durations:Object.freeze([...idle.durations])});
}
export function firstApprovedGymActors(id,total){
 const layout=FIRST_APPROVED_GYM_LAYOUTS[id];
 if(!layout)return null;
 if(!Number.isInteger(total)||total!==13+layout.stage*2)
  throw new RangeError('Unexpected native checkpoint total for gym stage');
 return {
  stage:layout.stage,leader:layout.leader,ace:layout.ace,
  artworkOnly:layout.artworkOnly===true,
  trainers:layout.trainers.map((marker,i)=>({...marker,index:total-layout.trainers.length+i}))
 };
}
