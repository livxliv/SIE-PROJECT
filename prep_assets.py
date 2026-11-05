
import sys, json, re
from pathlib import Path
import numpy as np, pandas as pd
from PIL import Image

assets, audit_csv, out = Path(sys.argv[1]), sys.argv[2], Path(sys.argv[3])
W = int(sys.argv[4]) if len(sys.argv) > 4 else 160
df = pd.read_csv(audit_csv)
df = df[df.model.isin(["history", "ours", "fu3d"])].copy()
df["file"] = df.png_path.str.replace("\\", "/", regex=False).str.split("/").str[-1]
df["country"] = df.system_name.str.split("_seqsys").str[0].str.replace("C_te_d_Ivoire", "Cote_d_Ivoire")

manifest = {}
for system, g in df.groupby("system_name"):
    country = g.country.iloc[0]
    paths = [assets / system / f for f in g.file]
    missing = [p for p in paths if not p.exists()]
    if missing:
        print(f"[{country}] {len(missing)} files missing, e.g. {missing[0]}"); 
    paths = [p for p in paths if p.exists()]
    # union bounding box of non-transparent pixels, so every frame is cropped identically
    x0 = y0 = 10**9; x1 = y1 = 0
    for p in paths:
        a = np.array(Image.open(p).convert("RGBA"))[..., 3] > 0
        ys, xs = np.where(a)
        if len(xs):
            x0, x1 = min(x0, xs.min()), max(x1, xs.max() + 1)
            y0, y1 = min(y0, ys.min()), max(y1, ys.max() + 1)
    H = round(W * (y1 - y0) / (x1 - x0))
    d = out / country; d.mkdir(parents=True, exist_ok=True)
    for p in paths:
        im = Image.open(p).convert("RGBA").crop((x0, y0, x1, y1)).resize((W, H), Image.BOX)
        im.save(d / p.name, optimize=True)
    entry = {"width": W, "height": H, "vmax": float(g.system_vmax.iloc[0]),
             "history": sorted(int(y) for y in g[g.model == "history"].year),
             "future_years": sorted(int(y) for y in g[g.model == "ours"].year.unique()),
             "ssps": sorted(g[g.model == "ours"].scenario.unique()),
             "pathways": sorted(g[g.model == "ours"].pathway.unique()),
             "files": {}}
    for _, r in g.iterrows():
        m = r.model
        key = f"{m}|{r.scenario}|{r.pathway}|{r.year}" if m == "ours" else \
              f"{m}|{r.scenario}|{r.year}" if m == "fu3d" else f"{m}|{r.year}"
        entry["files"][key] = f"data/{country}/{r.file}"
    manifest[country] = entry
    print(f"[{country}] {len(paths)} images, {W}x{H}px, vmax={entry['vmax']}")

(out / "manifest.json").write_text(json.dumps(manifest, indent=1))
print("Total size (MB):", round(sum(f.stat().st_size for f in out.rglob('*.png')) / 1e6, 1))



