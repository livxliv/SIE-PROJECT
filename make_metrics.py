"""
Estimate simple numbers for every map, so missions can be designed from real values.

Run from the project folder (the one with index.html and data/):
    python make_metrics.py

Reads  data/manifest.json and the PNGs in data/<Country>/
Writes data/metrics.json and prints a summary table per country.

IMPORTANT: these numbers are ESTIMATES recovered from the colours of the maps
(inverse of the 'magma' colour scale, 0..vmax metres, linear). Ask for the raw
per-cell values later and swap them in.
"""
import json, sys
from pathlib import Path
import numpy as np
from PIL import Image
try:
    from matplotlib import colormaps
    LUT = (colormaps["magma"](np.linspace(0, 1, 256))[:, :3] * 255).astype(float)
except Exception:
    print("Please run:  pip install matplotlib"); sys.exit(1)

THRESH_LOW = 0.1   # m  (the threshold used in your notebook)
THRESH_FLOOR = 3.0 # m  (one floor, discussed with the supervisors)

root = Path(".")
manifest = json.loads((root / "data" / "manifest.json").read_text())

def heights(png, vmax):
    im = np.array(Image.open(png).convert("RGBA")).astype(float)
    mask = im[..., 3] > 20                      # visible pixels only
    rgb = im[mask][:, :3]
    if len(rgb) == 0:
        return np.array([])
    # nearest colour in the magma scale -> position 0..255 -> metres
    d = ((rgb[:, None, :] - LUT[None, :, :]) ** 2).sum(axis=2)
    return d.argmin(axis=1) / 255.0 * vmax

out = {}
for country, entry in manifest.items():
    out[country] = {}
    vmax = entry["vmax"]
    for key, rel in entry["files"].items():
        p = root / rel
        if not p.exists():
            continue
        h = heights(p, vmax)
        out[country][key] = {
            "footprint_01": int((h >= THRESH_LOW).sum()),      # cells with any building
            "footprint_3m": int((h >= THRESH_FLOOR).sum()),    # cells with >= 1 floor
            "volume": round(float(h.sum()), 1),                # proxy for built volume
            "peak": round(float(np.percentile(h, 99)) if len(h) else 0, 2),
            "max": round(float(h.max()) if len(h) else 0, 2),
        }
    print(f"[{country}] {len(out[country])} maps analysed")

(root / "data" / "metrics.json").write_text(json.dumps(out, indent=1))

# ---- readable summary: the 15 futures in 2100 (urban-form model) ----
for country, m in out.items():
    rows = [(k.split("|"), v) for k, v in m.items() if k.startswith("ours|") and k.endswith("|2100")]
    if not rows:
        continue
    base = m.get("history|2015")
    print(f"\n=== {country}: 2100 (vs 2015: footprint {base['footprint_01'] if base else '?'}, volume {base['volume'] if base else '?'}) ===")
    print(f"{'SSP':5} {'shape':11} {'footprint>0.1m':>15} {'footprint>=3m':>14} {'volume':>9} {'peak(p99)':>10}")
    for (_, ssp, path, _), v in sorted(rows, key=lambda r: (r[0][1], r[0][2])):
        print(f"{ssp:5} {path:11} {v['footprint_01']:>15} {v['footprint_3m']:>14} {v['volume']:>9} {v['peak']:>10}")
print("\nSaved data/metrics.json")
