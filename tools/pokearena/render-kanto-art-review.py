#!/usr/bin/env python3
"""Rasterize the exact committed SVG rectangles/polygons with no image AI.
Outputs six transparent PNGs and a clearly labeled visual review contact sheet.
No gameplay modifications or screenshots are implied.
"""
from pathlib import Path
import argparse
import xml.etree.ElementTree as ET
from PIL import Image, ImageDraw, ImageFont

ROOT = Path("reference-assets/kanto/vector-reference-v1/art-directed")
NAMES = [
    ("viridian-oak", "VIRIDIAN / Arvore"),
    ("pewter-ridge", "PEWTER / Rochas"),
    ("cerulean-canal-bridge", "CERULEAN / Canal"),
    ("vermilion-pier", "VERMILION / Cais"),
    ("celadon-botanic-bed", "CELADON / Jardim"),
    ("fuchsia-wetland", "FUCHSIA / Pantano"),
]
def render_svg(path):
    root = ET.parse(path).getroot()
    w, h = int(root.attrib['width']), int(root.attrib['height'])
    assert 48 <= w <= 160 and 48 <= h <= 128
    assert root.attrib['shape-rendering'] == 'crispEdges'
    image = Image.new('RGBA', (w, h))
    draw = ImageDraw.Draw(image)
    counts = {'rect': 0, 'polygon': 0}
    for node in root:
        tag = node.tag.rsplit('}', 1)[-1]
        if tag == 'rect':
            x, y = int(node.attrib['x']), int(node.attrib['y'])
            rw, rh = int(node.attrib['width']), int(node.attrib['height'])
            assert rw > 0 and rh > 0 and x >= 0 and y >= 0
            draw.rectangle((x, y, x + rw - 1, y + rh - 1), fill=node.attrib['fill'])
        elif tag == 'polygon':
            pts = [tuple(map(int, pair.split(','))) for pair in node.attrib['points'].split()]
            assert len(pts) >= 3
            draw.polygon(pts, fill=node.attrib['fill'])
        else:
            raise ValueError('Unsupported SVG tag: ' + tag)
        counts[tag] += 1
    assert sum(counts.values()) >= 75
    return image, counts

def rgb(h):
    return tuple(int(h[i:i+2], 16) for i in (1,3,5))

def make_checker(w, h, cell=8):
    bg = Image.new('RGBA', (w, h), '#203346')
    d = ImageDraw.Draw(bg)
    for y in range(0, h, cell):
        for x in range(0, w, cell):
            if (x // cell + y // cell) % 2:
                d.rectangle((x, y, x + cell-1, y + cell-1), '#294156')
    return bg

def font(size=23):
    for path in ['/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf','/usr/share/fonts/truetype/liberation2/LiberationSans-Bold.ttf']:
        if Path(path).exists():
            return ImageFont.truetype(path, size)
    return ImageFont.load_default()

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--out', type=Path, default=Path('test-evidence/kanto-art-directed'))
    args = parser.parse_args()
    out = args.out
    out.mkdir(parents=True, exist_ok=True)
    cols, rows, cw, ch = 3, 2, 430, 346
    board = Image.new('RGB', (cols*cw+24, rows*ch+115), '#07131e')
    d = ImageDraw.Draw(board)
    d.text((26, 18), 'KANTO / Pixel art construida com geometria', font=font(30), fill='#f4e8c7')
    d.text((27, 60), 'PREVIA DE ASSETS REAIS  -  NAO E SCREENSHOT DO JOGO', font=font(15), fill='#9ec3d7')
    summary = []
    for i, (name, title) in enumerate(NAMES):
        asset, counts = render_svg(ROOT / (name + '.svg'))
        asset.save(out / (name + '.png'))
        x, y = 12 + (i%cols)*cw, 93 + (i//cols)*ch
        d.rounded_rectangle((x,y,x+cw-9,y+ch-9), radius=11, fill='#122638', outline='#41617a', width=2)
        d.text((x+16,y+10),title,font=font(19),fill='#f9e8bf')
        w, h = asset.size
        scale = min(3, (cw-45)//w, (ch-82)//h)
        enlarged = asset.resize((w*scale,h*scale),Image.Resampling.NEAREST)
        bg = make_checker(cw-34,ch-66)
        bg.alpha_composite(enlarged,((bg.width-enlarged.width)//2,(bg.height-enlarged.height)//2))
        board.paste(bg.convert('RGB'),(x+16,y+42))
        d.text((x+16,y+ch-31),f'{w}x{h}px  |  {counts["rect"]+counts["polygon"]} elementos vetoriais',font=font(13),fill='#acd2d6')
        summary.append((name,w,h,counts))
    board.save(out/'kanto-art-directed-preview.png',optimize=True)
    print('RENDERED',len(NAMES),'native assets and labeled contact sheet')
    for item in summary: print(*item)

if __name__ == '__main__':
    main()
