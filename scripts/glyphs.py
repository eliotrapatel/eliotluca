# Writes the Gravesend Sans capitals as vector outlines, so the brand
# wordmarks can be drawn, cut and animated as SVG without waiting on a font.
# Run: python3 scripts/glyphs.py
import json
from fontTools.ttLib import TTFont
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.boundsPen import BoundsPen

font = TTFont('src/assets/og-fonts/GravesendSans-Medium.otf')
gs = font.getGlyphSet()
cmap = font.getBestCmap()
upm = font['head'].unitsPerEm
cap = font['OS/2'].sCapHeight

out = {'upm': upm, 'cap': cap, 'glyphs': {}}
for ch in 'ABCDEFGHIJKLMNOPQRSTUVWXYZ ':
    name = cmap[ord(ch)]
    g = gs[name]
    pen = SVGPathPen(gs, ntos=lambda v: ('%.1f' % v).rstrip('0').rstrip('.'))
    g.draw(pen)
    bp = BoundsPen(gs)
    g.draw(bp)
    # Outlines are y-up in font units; flip to y-down with the baseline at y = cap.
    out['glyphs'][ch] = {'w': g.width, 'd': pen.getCommands(), 'b': bp.bounds}

with open('src/data/gravesend-glyphs.json', 'w') as f:
    json.dump(out, f, separators=(',', ':'))
print('ok', len(out['glyphs']))
