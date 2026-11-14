#!/usr/bin/env python3
"""Replace ONLY ten previously quarantined PMDCollab PNG species with
separately credited public fan-created alternate animation sets.

This runs after stage-priority and stage-personal, inside isolated
site-capture. No committed original PNGs, VFX, approved sprites or saves are
overwritten. It never invents license rights: the following independent
per-animation contributor audit remains mandatory before any release.
"""
import hashlib
import json
import re
import runpy
import sys
from pathlib import Path

HELPER=runpy.run_path(str(Path(__file__).with_name("stage-personal-alpha0713.py")))
public_fetch=HELPER["public_fetch"]
safe_under_capture=HELPER["safe_under_capture"]
parse_xml=HELPER["parse_xml"]
frame_info=HELPER["frame_info"]
render_sheet=HELPER["render_sheet"]
make_portrait=HELPER["make_portrait"]
BASE_URL=HELPER["BASE_URL"]

ALPHA,SRC="0.71.3","src-5ccc174cb8"
ALT={
 "0132":("sprite/0132/0001","portrait/0132/0001"),
 "0133":("sprite/0133/0002","portrait/0133/0002"),
 "0480":("sprite/0480/0000/0001","portrait/0480/0000/0001"),
 "0481":("sprite/0481/0001/0001","portrait/0481/0000/0001"),
 "0482":("sprite/0482/0001/0001","portrait/0482/0000/0001"),
 "0196":("sprite/0196/0001","portrait/0196/0001"),
 "0197":("sprite/0197/0001","portrait/0197/0001"),
 "0282":("sprite/0282/0001","portrait/0282/0001"),
 "0286":("sprite/0286/0000/0001","portrait/0286/0000/0001"),
 "0128":("sprite/0128/0002","portrait/0128/0002"),
}
# Each alias is a documented approximation when an alternate artist
# source lacks the native 0.71.3 named animation. Prefer the native name
# whenever it exists in the alternate source's AnimData.xml.
ALIAS={
 "Shoot":"Attack","Strike":"Attack","Faint":"Hurt","Pose":"Idle",
 "LeapForth":"Hop","Appeal":"Idle","SpAttack":"Attack",
 "Hover":"Idle","Punch":"Attack","MultiStrike":"Attack",
 "Withdraw":"Walk",
}
SPECIFIC={
 "0133":{"Appeal":"TailWhip"},
 "0481":{"SpAttack":"Special0"},
 "0482":{"SpAttack":"Special0"}
}
def sha(b):
 return hashlib.sha256(b).hexdigest()

def source_anim(dex,xml,name):
 if name in xml:
  return name
 choice=SPECIFIC.get(dex,{}).get(name,ALIAS.get(name))
 if not choice or choice not in xml:
  raise ValueError("Missing artist animation without vetted alias: "+dex+" "+name)
 return choice

def upgrade(root,fetch=public_fetch):
 root=Path(root).resolve()
 safe_under_capture(root)
 version=json.loads((root/"version.json").read_text())
 if (version.get("officialAlpha"),version.get("src"))!=(ALPHA,SRC):
  raise ValueError("Do not mix versions in rights-preserving artist overlay")
 manifest=json.loads((root/"assets/pmd/manifest.json").read_text())
 index_html=(root/"index.html").read_text()
 match=re.search(r'<script[^>]*id=["\']paq["\'][^>]*>([\s\S]*?)</script>',index_html)
 if not match:
  raise ValueError("Missing official indexed pack evidence")
 index=json.loads(match.group(1))
 file=root/"priority-licensed-pmd-report.json"
 priority=json.loads(file.read_text())
 if priority.get("alpha")!=ALPHA or priority.get("src")!=SRC or \
   priority.get("sourceAuthentic") is not False or \
   priority.get("redistributionCleared") is not False:
  raise ValueError("Unverified priority source audit")
 recorded={r["dex"]:r for r in priority["licensed"]}
 if not set(ALT).issubset(recorded):
  raise ValueError("Missing one of ten priority species; refuse partial license conversion")
 cache={}
 plan=[]
 aliases=[]
 for dex,(sprite,portrait) in ALT.items():
  entry=manifest[dex]
  if not entry["anims"].get("Idle"):
   raise ValueError("Missing exact native target form "+dex)
  official_bin=root/"assets/p"/(index["formas"][dex]+".bin")
  if official_bin.exists():
   raise ValueError("Do not replace verified official pack "+dex)
  record=recorded[dex]
  names={dex+"/portrait.png"}|{x["file"] for x in entry["anims"].values()}
  old={x["relative"]:x for x in record["files"]}
  if set(old)!=names or len(old)!=len(record["files"]):
   raise ValueError("Missing or duplicated original priority SHA inventory "+dex)
  for rel,x in old.items():
   actual=(root/"assets/pmd"/rel).read_bytes()
   if sha(actual)!=x["sha256"] or len(actual)!=x["bytes"]:
    raise ValueError("Original priority source collision "+rel)
  xml=parse_xml(fetch(sprite+"/AnimData.xml",cache))
  images=[]
  prel=portrait+"/Normal.png"
  img=make_portrait(fetch(prel,cache),dex)
  images.append((dex+"/portrait.png",img,prel))
  handled={dex+"/portrait.png"}
  for anim,meta in entry["anims"].items():
   rel=meta["file"]
   if not re.fullmatch(re.escape(dex)+r"/[A-Za-z0-9]+-Anim\.png",rel):
    raise ValueError("Unsafe animation destination "+str(rel))
   if rel in handled:
    continue
   handled.add(rel)
   alias=source_anim(dex,xml,anim)
   resolved,fw,fh=frame_info(xml,alias)
   source= sprite+"/"+resolved+"-Anim.png"
   data=render_sheet(fetch(source,cache),fw,fh,meta,dex)
   images.append((rel,data,source))
   if alias!=anim:
    aliases.append({"dex":dex,"nativeAnimation":anim,"sourceAnimation":alias})
  if {x[0] for x in images}!=names:
   raise ValueError("Artist alternate animation set incomplete: "+dex)
  plan.append((dex,images))
 # All 10 species, source directions and source metadata are fully validated
 # before modifying any already verified source-art PNG in this temp client.
 for dex,images in plan:
  record=recorded[dex]
  proofs={x["relative"]:x for x in record["files"]}
  for rel,data,origin in images:
   dest=root/"assets/pmd"/rel
   dest.write_bytes(data)
   item=proofs[rel]
   item.update({"source":BASE_URL+origin,"bytes":len(data),"sha256":sha(data)})
 priority["alternateArtistSourceVerified"]=True
 priority["alternateArtistSourceForms"]=sorted(ALT)
 priority["licenseReviewRequired"]=True
 priority["redistributionCleared"]=False
 tmp=file.with_suffix(".tmp")
 tmp.write_text(json.dumps(priority,indent=2)+"\n")
 tmp.replace(file)
 result={"alpha":ALPHA,"src":SRC,"replacedForms":sorted(ALT),
  "animationsReplaced":sum(len(x) for _,x in plan),
  "sourceRequests":len(cache),"sourceAnimationAliases":aliases,
  "copyrightClearanceCertified":False,"sourceAuthentic":False,
  "description":"Artist-created alternate variants from PMDCollab, not exact native 0.71.3 sprites"}
 (root/"priority-artist-upgrade-report.json").write_text(json.dumps(result,indent=2)+"\n")
 print("ALT_PRIORITY_ARTISTS_STAGED",json.dumps({
  "forms":len(ALT),"pngs":result["animationsReplaced"],
  "aliases":len(aliases),"sourceRequests":len(cache),
  "releaseApproved":False}))
 return result

def self_test():
 assert len(ALT)==10 and "0700" not in ALT
 assert source_anim("0132",{"Attack":{}},"Strike")=="Attack"
 assert source_anim("0481",{"Special0":{}},"SpAttack")=="Special0"
 assert source_anim("0133",{"TailWhip":{}},"Appeal")=="TailWhip"
 assert source_anim("0197",{"Strike":{}},"Strike")=="Strike"
 try:
  source_anim("0480",{"Walk":{}},"UNKNOWN_MOVE")
  raise AssertionError("Unknown artist animation must fail")
 except ValueError:
  pass
 print("ALT_PRIORITY_ARTISTS_SELFTEST_OK")

if __name__=="__main__":
 if "--self-test" in sys.argv:
  self_test()
 elif len(sys.argv)==2:
  upgrade(sys.argv[1])
 else:
  raise SystemExit("Usage: upgrade-priority-artist-sources.py site-capture/pokearena-client")
