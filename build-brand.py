"""Build Hirebrew's approved Handoff direction as portable SVG artwork.

One-off brand tooling, not a website runtime dependency.
Requires fonttools[woff] and brotli; uses the bundled OFL font only.
Run from any directory: python build-brand.py
"""

from pathlib import Path
from html import escape
from fontTools.ttLib import TTFont
from fontTools.varLib.instancer import instantiateVariableFont
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.transformPen import TransformPen
from fontTools.pens.boundsPen import BoundsPen

ROOT = Path(__file__).resolve().parent
OUT = ROOT / "assets" / "brand"
INK, CORAL, CHALK, STONE = "#172326", "#FF6B4A", "#F7F5EF", "#E9E6DF"

# Two deliberately separate bands. The unpainted channel is real negative
# space (not a background-coloured mask), so the mark works on any flat field.
UPPER = "M5 44L20 14Q23 8 30 8H55Q61 8 64 14L73 32Q76 38 72 44L65 34Q59 26 52 26Q44 26 40 34L35 44Q32 49 26 49H8Q3 49 5 44Z"
LOWER = "M115 36L100 66Q97 72 90 72H65Q59 72 56 66L47 48Q44 42 48 36L55 46Q61 54 68 54Q76 54 80 46L85 36Q88 31 94 31H112Q117 31 115 36Z"
# Optical-size variant: open the meeting tips further for a 16px browser tab.
MICRO_UPPER = "M5 44L20 14Q23 8 30 8H55Q61 8 64 14L71 28Q74 34 70 39L64 32Q58 24 51 24Q42 24 37 34L32 44Q29 49 23 49H8Q3 49 5 44Z"
MICRO_LOWER = "M115 36L100 66Q97 72 90 72H65Q59 72 56 66L49 52Q46 46 50 41L56 48Q62 56 69 56Q78 56 83 46L88 36Q91 31 97 31H112Q117 31 115 36Z"


def bands(first=INK, second=CORAL, micro=False):
    upper, lower = (MICRO_UPPER, MICRO_LOWER) if micro else (UPPER, LOWER)
    return f'<path fill="{first}" d="{upper}"/><path fill="{second}" d="{lower}"/>'


def svg(viewbox, title, body, desc=""):
    description = f"<desc>{escape(desc)}</desc>" if desc else ""
    return (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="{viewbox}" '
            f'role="img" aria-labelledby="title"><title id="title">{escape(title)}</title>'
            f'{description}{body}</svg>\n')


font = instantiateVariableFont(TTFont(ROOT / "assets/fonts/bricolage.woff2"),
                               {"wght": 800, "opsz": 36}, inplace=True)
glyphs = font.getGlyphSet()
cmap = font.getBestCmap()
outline = SVGPathPen(glyphs, ntos=lambda n: f"{n:.3f}".rstrip("0").rstrip(".") if n else "0")
bounds = BoundsPen(glyphs)
cursor = 0
# Optical pair adjustments in font units, rather than a browser font dependency.
pair_spacing = {"hi": -13, "ir": -5, "re": -16, "eb": -9, "br": -12, "ew": -22}
for index, char in enumerate("hirebrew"):
    glyph = glyphs[cmap[ord(char)]]
    transform = (1, 0, 0, -1, cursor, 0)
    glyph.draw(TransformPen(outline, transform))
    glyph.draw(TransformPen(bounds, transform))
    cursor += glyph.width + pair_spacing.get("hirebrew"[index:index + 2], 0)
word_path = outline.getCommands()
x_min, y_min, x_max, y_max = bounds.bounds


def wordmark(x, center_y, width, color=INK):
    scale = width / (x_max - x_min)
    tx = x - x_min * scale
    ty = center_y - (y_min + y_max) * scale / 2
    return (f'<path fill="{color}" transform="translate({tx:.4f} {ty:.4f}) '
            f'scale({scale:.6f})" d="{word_path}"/>')


DESC = ("Original Hirebrew Handoff symbol: two connected folded bands and an open channel. "
        "Bold Bricolage Grotesque wordmark with optical spacing, converted to outlines. "
        "Typeface used under the SIL Open Font License. Not trademark-cleared.")
OUT.mkdir(exist_ok=True)

for name, first, second, word_color in [
    ("logo.svg", INK, CORAL, INK),
    ("logo-mono.svg", INK, INK, INK),
    ("logo-reversed.svg", CHALK, CHALK, CHALK),
]:
    body = f'<g transform="translate(1.4 9.6) scale(.76)">{bands(first, second)}</g>'
    (OUT / name).write_text(svg("0 0 344 80", "Hirebrew Handoff", body + wordmark(99, 40, 237, word_color), DESC))

for name, first, second in [
    ("mark.svg", INK, CORAL),
    ("mark-mono.svg", INK, INK),
    ("mark-reversed.svg", CHALK, CHALK),
]:
    (OUT / name).write_text(svg("0 0 120 120", "Hirebrew Handoff symbol",
                               f'<g transform="translate(0 20)">{bands(first, second)}</g>',
                               "Two folded bands connected by an open negative-space channel."))

(OUT / "logo-stacked.svg").write_text(svg("0 0 320 210", "Hirebrew Handoff stacked logo",
    f'<g transform="translate(76 8) scale(1.4)">{bands()}</g>' + wordmark(24, 162, 272), DESC))
(OUT / "wordmark.svg").write_text(svg("0 0 280 70", "Hirebrew wordmark",
    wordmark(8, 35, 264), DESC))
(OUT / "favicon.svg").write_text(svg("0 0 64 64", "Hirebrew Handoff favicon",
    f'<rect width="64" height="64" rx="16" fill="{INK}"/>'
    f'<g transform="translate(1.4 11.6) scale(.51)">{bands(CHALK, CHALK, micro=True)}</g>',
    "Optically simplified monochrome Handoff for small browser tabs."))

for name, background, first, second in [
    ("pattern.svg", STONE, INK, CORAL),
    ("pattern-reversed.svg", INK, "#BACBFA", CORAL),
]:
    motif = bands(first, second)
    body = (f'<defs><pattern id="handoff" width="240" height="184" patternUnits="userSpaceOnUse">'
            f'<g transform="translate(0 0)">{motif}</g>'
            f'<g transform="translate(120 92)">{motif}</g>'
            f'</pattern></defs><rect width="640" height="480" fill="{background}"/>'
            '<rect width="640" height="480" fill="url(#handoff)"/>')
    (OUT / name).write_text(svg("0 0 640 480", "Hirebrew Handoff connection pattern", body))

print(f"Built {len(list(OUT.glob('*.svg')))} outlined Handoff SVG assets.")
