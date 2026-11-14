#!/usr/bin/env python3
"""Alpha 0.71.3 personal diagnostic: create clearly labeled *approximate*
visual stand-ins for 19 inaccessible forms. No original art overwritten,
no official-faithfulness or redistribution claim, no direct Pages install.
Base sprites are fetched via ordinary public SpriteCollab paths (no 403 bypass).
"""
import hashlib
import io
import json
import re
import sys
import tempfile
import urllib.error
import urllib.request
from pathlib import Path
from xml.etree import ElementTree as ET

from PIL import Image, ImageDraw, ImageOps

ALPHA, SRC = "0.71.3", "src-5ccc174cb8"
BASE_URL = "https://raw.githubusercontent.com/PMDCollab/SpriteCollab/master/"
LICENSE = "MIXED_OR_UNVERIFIED - PERSONAL_DIAGNOSTIC"
BASE = {
    "0007": ("sprite/0007/0000/0001", "portrait/0007/0000/0001"),
    "0008": ("sprite/0008/0001", "portrait/0008/0001"),
    "0009": ("sprite/0009/0004", "portrait/0009/0004"),
    "0092": ("sprite/0092/0000/0001", "portrait/0092/0000/0001"),
    "0093": ("sprite/0093/0000/0001", "portrait/0093/0000/0001"),
    "0094": ("sprite/0094/0003", "portrait/0094/0001"),
    "0146": ("sprite/0146/0003", "portrait/0146/0003"),
}
FORMS = (
    "0007-squad", "0008-squad", "0009-squad",
    *("0092-" + n for n in ("amarillogengar","azabachegengar","naranjagengar","shinygengar")),
    *("0093-" + n for n in ("amarillogengar","azabachegengar","naranjagengar","shinygengar")),
    *("0094-" + n for n in ("amarillogengar","azabachegengar","blancofucsiagengar","naranjagengar","shinygengar")),
    "0146", "0146-aureo", "0146-sombrio",
)
TINTS = {
    "amarillogengar": ((36,19,5),(255,234,47)),
    "azabachegengar": ((5,4,15),(90,74,118)),
    "naranjagengar": ((33,9,4),(255,129,36)),
    "shinygengar": ((20,39,43),(215,252,252)),
    "blancofucsiagengar": ((70,23,62),(255,220,248)),
    "aureo": ((56,22,2),(255,221,51)),
    "sombrio": ((5,4,20),(116,91,151)),
}

def sha(b):
    return hashlib.sha256(b).hexdigest()

def safe_under_capture(root):
    if "site-capture" not in root.parts or "_site" in root.parts or ".git" in root.parts:
        raise ValueError("Personal sprite build must stay inside site-capture quarantine")

def parse_xml(xml):
    data = {}
    for node in ET.fromstring(xml).findall("./Anims/Anim"):
        name = node.findtext("Name")
        if not name or not re.fullmatch(r"[A-Za-z0-9]+",name):
            continue
        data[name] = {
            "copy": node.findtext("CopyOf"),
            "fw": node.findtext("FrameWidth"),
            "fh": node.findtext("FrameHeight"),
        }
    return data

def frame_info(info, name):
    seen = set()
    current = name
    while current not in seen and current in info:
        seen.add(current)
        a = info[current]
        if a["copy"]:
            current = a["copy"]
            continue
        if a["fw"] and a["fh"]:
            fw, fh = int(a["fw"]),int(a["fh"])
            if not (0 < fw < 600 and 0 < fh < 600):
                raise ValueError("Unsafe source animation dimensions")
            return (current, fw, fh)
        break
    raise ValueError("No source animation metadata for "+name)

def recolor(im, dex):
    suffix = dex.split("-",1)[1] if "-" in dex else ""
    tint = TINTS.get(suffix)
    if not tint:
        return im
    alpha = im.getchannel("A")
    rgb = ImageOps.colorize(ImageOps.grayscale(im), black=tint[0],white=tint[1]).convert("RGBA")
    rgb.putalpha(alpha)
    return rgb

def add_personal_squad_glasses(im):
    # Approximate overlay for the private build, *not* claimed to match
    # any official Squirtle Squad design or positioning across directions.
    bbox = im.getbbox()
    if not bbox:
        return im
    x0,y0,x1,y1 = bbox
    width,height=x1-x0,y1-y0
    if width < 16 or height < 16:
        return im
    y=y0+round(height*.29)
    center=(x0+x1)//2
    half=max(2,round(width*.12))
    gap=max(1,round(width*.045))
    h=max(2,round(height*.07))
    draw=ImageDraw.Draw(im)
    draw.rectangle((center-gap-half*2,y,center-gap,y+h), fill=(10,13,21,245))
    draw.rectangle((center+gap,y,center+gap+half*2,y+h),fill=(10,13,21,245))
    draw.rectangle((center-gap,y,center+gap,y+1),fill=(20,20,26,255))
    return im

def render_sheet(data, fw, fh, target, dex, squad=False):
    img=Image.open(io.BytesIO(data)).convert("RGBA")
    out_fw,out_fh=target["fw"],target["fh"]
    n=len(target["durations"])
    if not all(isinstance(i,int) and i>0 for i in (out_fw,out_fh,n,fw,fh)):
        raise ValueError("Invalid PMD metadata")
    if img.width%fw or img.height%fh or n>40 or out_fw>600 or out_fh>600:
        raise ValueError("Incompatible SpriteCollab animation grid")
    cols, rows=img.width//fw,img.height//fh
    if not (1<=cols<=40 and 1<=rows<=8):
        raise ValueError("Unexpected SpriteCollab grid shape")
    if out_fw*out_fh*n*rows>30000000:
        raise ValueError("Oversize generated sprite sheet")
    dst=Image.new("RGBA",(out_fw*n,out_fh*rows),(0,0,0,0))
    for row in range(rows):
        for index in range(n):
            frame=img.crop(((index%cols)*fw,row*fh,(index%cols+1)*fw,(row+1)*fh))
            scale=min(out_fw/fw,out_fh/fh)
            w,h=max(1,round(fw*scale)),max(1,round(fh*scale))
            if (w,h)!=(fw,fh):
                frame=frame.resize((w,h),Image.Resampling.NEAREST)
            frame=recolor(frame,dex)
            if squad:
                frame=add_personal_squad_glasses(frame)
            dst.alpha_composite(frame,(index*out_fw+(out_fw-w)//2,row*out_fh+(out_fh-h)//2))
    output=io.BytesIO()
    dst.save(output,format="PNG",optimize=True)
    return output.getvalue()

def make_portrait(data,dex):
    image=Image.open(io.BytesIO(data)).convert("RGBA")
    if max(image.size)>512 or min(image.size)<8:
        raise ValueError("Unusual source portrait size")
    image=recolor(image,dex)
    if dex.endswith("-squad"):
        image=add_personal_squad_glasses(image)
    b=io.BytesIO()
    image.save(b,format="PNG",optimize=True)
    return b.getvalue()

def public_fetch(rel,cache):
    if not re.fullmatch(r"(?:sprite|portrait)/[0-9]{4}(?:/[0-9]{4}){0,2}/(?:[A-Za-z0-9]+-Anim\.png|Normal\.png|AnimData\.xml)",rel):
        raise ValueError("Unsafe public asset URI")
    if rel in cache:
        return cache[rel]
    url=BASE_URL+rel
    req=urllib.request.Request(url,headers={"User-Agent":"Torre2-Personal-Rea-Diagnostic/1.0"})
    with urllib.request.urlopen(req,timeout=20) as response:
        if response.geturl()!=url:
            raise ValueError("Unapproved SpriteCollab redirect")
        data=response.read(6*1024*1024+1)
    if not 0<len(data)<=6*1024*1024:
        raise ValueError("Unusual source asset length")
    cache[rel]=data
    return data

def build(root, fetch=public_fetch):
    root=Path(root).resolve()
    safe_under_capture(root)
    version=json.loads((root/"version.json").read_text())
    if version.get("officialAlpha")!=ALPHA or version.get("src")!=SRC:
        raise ValueError("Wrong Alpha/source; never merge different releases")
    manifest=json.loads((root/"assets/pmd/manifest.json").read_text())
    html=(root/"index.html").read_text()
    match=re.search(r'<script[^>]*id=["\']paq["\'][^>]*>([\s\S]*?)</script>',html)
    if not match:
        raise ValueError("No verified official pack index")
    index=json.loads(match.group(1))
    if any(not index.get("formas",{}).get(dex) for dex in FORMS):
        raise ValueError("19 expected official form IDs are not present")
    if len(FORMS)!=19 or len(set(FORMS))!=19:
        raise ValueError("19 IDs mismatch")
    cache={}
    xmls={base:parse_xml(fetch(src+"/AnimData.xml",cache)) for base,(src,_) in BASE.items()}
    planned=[]
    for dex in FORMS:
        base=dex[:4]
        source,portrait=BASE[base]
        entry=manifest[dex]
        if not entry["anims"].get("Idle"):
            raise ValueError("No native Idle animation for "+dex)
        if (root/"assets/p"/(index["formas"][dex]+".bin")).exists():
            raise ValueError("Official pack already present; no substitution: "+dex)
        dest_dir=root/"assets/pmd"/dex
        if dest_dir.exists() and any(dest_dir.glob("*.png")):
            raise ValueError("Existing native art; never overwrite: "+dex)
        portrait_rel=portrait+"/Normal.png"
        p=make_portrait(fetch(portrait_rel,cache),dex)
        planned.append((dex+"/portrait.png",p,portrait_rel))
        processed={dex+"/portrait.png"}
        for anim,meta in entry["anims"].items():
            file=meta["file"]
            if not re.fullmatch(re.escape(dex)+r"/[A-Za-z0-9]+-Anim\.png",file):
                raise ValueError("Unsafe native animation path: "+file)
            # Alias moves (for example Strike -> Attack) deliberately share
            # the SAME official PNG path; write it exactly once per species.
            if file in processed:
                continue
            processed.add(file)
            actual, fw,fh=frame_info(xmls[base],anim)
            src_rel=source+"/"+actual+"-Anim.png"
            raw=fetch(src_rel,cache)
            png=render_sheet(raw,fw,fh,meta,dex,dex.endswith("-squad"))
            planned.append((file,png,src_rel))
    # All 19 packages, animations and portraits validated before *any* writes.
    report_files=[]
    for rel,data,origin in planned:
        dest=root/"assets/pmd"/rel
        dest.parent.mkdir(parents=True,exist_ok=True)
        with dest.open("xb") as f:
            f.write(data)
        report_files.append({"relative":rel,"source":BASE_URL+origin,
                             "sha256":sha(data),"bytes":len(data)})
    report={
        "alpha":ALPHA,"sourceDir":SRC,"sourceAuthentic":False,
        "license":LICENSE,"visualSubstituteCount":19,"forms":list(FORMS),
        "privateDiagnostic":True,"exactOfficialVariants":False,
        "redistributionCleared":False,"clearlyNotOriginalCostumeArt":True,
        "files":report_files,"sourceRequests":len(cache),
        "note":"Artist/source credits need review; generated derivatives are not official artwork."
    }
    path=root/"assets/pmd/torre2-visual-substitutes.json"
    with path.open("x",encoding="utf8") as f:
        json.dump(report,f,indent=2)
    print("PERSONAL_ALPHA0713_VISUAL_FALLBACKS",json.dumps({
        "forms":19,"files":len(report_files),"sourceRequests":len(cache),
        "approvedForPublicPages":False
    }))
    return report

def self_test():
    assert len(FORMS)==19 and len(set(FORMS))==19
    xml=b'<AnimData><Anims><Anim><Name>Attack</Name><FrameWidth>32</FrameWidth><FrameHeight>32</FrameHeight></Anim><Anim><Name>Strike</Name><CopyOf>Attack</CopyOf></Anim></Anims></AnimData>'
    assert frame_info(parse_xml(xml),"Strike")==("Attack",32,32)
    src=Image.new("RGBA",(64,64),(76,28,126,255))
    mem=io.BytesIO();src.save(mem,format="PNG")
    out=render_sheet(mem.getvalue(),32,32,{"fw":40,"fh":40,"durations":[1,2,3]}, "0094-shinygengar")
    png=Image.open(io.BytesIO(out))
    assert png.size==(120,80)
    assert png.getpixel((20,20))!=(76,28,126,255)
    assert Image.open(io.BytesIO(make_portrait(mem.getvalue(),"0007-squad"))).size==(64,64)
    with tempfile.TemporaryDirectory() as tmp:
        try:
            safe_under_capture(Path(tmp))
            raise AssertionError("Quarantine not enforced")
        except ValueError:
            pass
    print("PERSONAL_ALPHA0713_SELFTEST_OK")

if __name__=="__main__":
    if "--self-test" in sys.argv:
        self_test()
    elif len(sys.argv)==2:
        build(sys.argv[1])
    else:
        raise SystemExit("Usage: stage-personal-alpha0713.py site-capture/pokearena-client")
