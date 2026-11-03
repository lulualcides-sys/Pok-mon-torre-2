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
  v('exit',.499,.929,.190,.121)
 ]),
 'route-21':Object.freeze([
  v('cinnabar',.503,.929,.198,.119)
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
 'routes-16-18':Object.freeze({celadon:'celadon-city',fuchsia:'fuchsia-city'})
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
  ace:Object.freeze({dex:'0121',cx:.570,cy:.225}),
  trainers:Object.freeze([
   Object.freeze({kind:'swimmer',cx:.27,cy:.465}),
   Object.freeze({kind:'lass',cx:.73,cy:.465}),
   Object.freeze({kind:'swimmer',cx:.27,cy:.695}),
   Object.freeze({kind:'lass',cx:.73,cy:.695})
  ])
 }),
 // The approved Surge image ALREADY contains leader, Pikachu and four NPCs.
 // Attach invisible Phaser actions over their positions, not duplicate them.
 'gym-surge':Object.freeze({
  stage:2,artworkOnly:true,
  leader:Object.freeze({kind:'surge',cx:.480,cy:.232}),
  ace:Object.freeze({dex:'0025',cx:.558,cy:.232}),
  trainers:Object.freeze([
   Object.freeze({kind:'youngster',cx:.169,cy:.394}),
   Object.freeze({kind:'rocker',cx:.841,cy:.395}),
   Object.freeze({kind:'lass',cx:.169,cy:.667}),
   Object.freeze({kind:'youngster',cx:.840,cy:.667})
  ])
 }),
 // Empty battle circles in the approved greenhouse: overlay real 16x32
 // FireRed sprites and reuse the last four saved battle checkpoints.
 'gym-erika':Object.freeze({
  stage:3,leader:Object.freeze({kind:'erika',cx:.493,cy:.248}),
  ace:Object.freeze({dex:'0045',cx:.592,cy:.245}),
  trainers:Object.freeze([
   Object.freeze({kind:'lass',cx:.174,cy:.350}),
   Object.freeze({kind:'bugcatcher',cx:.825,cy:.351}),
   Object.freeze({kind:'lass',cx:.153,cy:.718}),
   Object.freeze({kind:'bugcatcher',cx:.834,cy:.718})
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
