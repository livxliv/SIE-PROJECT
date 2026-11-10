"""
Build the files the website needs for the 3D bars and the V(t) curve, straight from the GeoJSON.

For every country it writes, in the output folder:
    <Country>.json   small description (cell positions, field names, years)
    <Country>.bin    heights of every coarse cell for every field (uint16, centimetres)
and it adds the country to   vt.json   (total built volume in km3 for every field = V(t)).

How: it STREAMS the GeoJSON (never loads it whole), groups the 100 m cells into blocks of
BLOCK x BLOCK cells (default 5 -> 500 m) using the row/col columns, and averages h in each block.
V(t) is the exact sum of h * area_m2 over ALL original cells (before blocking), divided by 1e9.

Run from the project folder:
    pip install ijson numpy
    python prepare_bars.py "villes/historical_projected_3d_city/urban_system_geojson" data/bars
Options:
    python prepare_bars.py <geojson_folder> <out_folder> [block] [CountryNameFilter ...]
Example, only Rwanda first (smallest, a few minutes):
    python prepare_bars.py "villes/.../urban_system_geojson" data/bars 5 Rwanda
"""
import sys, json, re
from pathlib import Path
import numpy as np
import ijson

src = Path(sys.argv[1]); out = Path(sys.argv[2]); out.mkdir(parents=True, exist_ok=True)
BLOCK = int(sys.argv[3]) if len(sys.argv) > 3 else 5
filters = [a.lower() for a in sys.argv[4:]]
MIN_KEEP = 0.1        # drop blocks that never reach 0.1 m in any field

def country_of(p):
    return p.name.split("__")[0].replace("C_te_d_Ivoire", "Cote_d_Ivoire")

files = sorted(src.glob("*.geojson"), key=lambda p: p.stat().st_size)
if filters:
    files = [f for f in files if any(k in f.name.lower() for k in filters)]

vt_path = out / "vt.json"
vt_all = json.loads(vt_path.read_text()) if vt_path.exists() else {}
mx_path = out / "metrics.json"
mx_all = json.loads(mx_path.read_text()) if mx_path.exists() else {}

def metric_key(field):
    m = re.fullmatch(r"hist_(\d{4})", field)
    if m: return f"history|{m.group(1)}"
    m = re.fullmatch(r"ours_(SSP\d)_([a-z]+)_(\d{4})", field)
    return f"ours|{m.group(1)}|{m.group(2)}|{m.group(3)}"

for f in files:
    country = country_of(f)
    print(f"[{country}] {f.stat().st_size/1e6:.0f} MB, streaming (ijson backend: {ijson.backend}) ... this can take a while", flush=True)
    fields = None; n_done = 0
    acc = {}                   # (brow, bcol) -> [sum_h (nf), count, sum_lon, sum_lat]
    tot = None                 # total volume per field (m3)
    NB = 1000                  # histogram of cell heights, 0.1 m bins up to 100 m (exact counts, no sampling)
    hist = None; hmax_f = None
    with open(f, "rb") as fh:
        for feat in ijson.items(fh, "features.item", use_float=True):
            pr = feat["properties"]
            if fields is None:
                hist = sorted([k for k in pr if re.fullmatch(r"hist_\d{4}", k)], key=lambda x: int(x[-4:]))
                ours = sorted([k for k in pr if re.fullmatch(r"ours_SSP\d_[a-z]+_\d{4}", k)],
                              key=lambda x: (x.split("_")[1], x.split("_")[2], int(x[-4:])))
                fields = hist + ours
                ignored = [k for k in pr if k not in fields]
                tot = np.zeros(len(fields))
                hist = np.zeros((len(fields), NB), dtype=np.int64); hmax_f = np.zeros(len(fields))
                rows_idx = np.arange(len(fields))
                print(f"   using {len(fields)} fields ({len(hist)} observed + {len(ours)} projected)", flush=True)
                print(f"   ignored columns: {len(ignored)} e.g. {ignored[:6]}", flush=True)
            vals = np.fromiter((pr[k] if pr[k] is not None else 0.0 for k in fields), dtype=float, count=len(fields))
            area = pr.get("area_m2", 10000.0)
            tot += vals * area
            hist[rows_idx, np.clip((vals * 10).astype(np.int64), 0, NB - 1)] += 1
            np.maximum(hmax_f, vals, out=hmax_f)
            ring = feat["geometry"]["coordinates"][0]
            lon = sum(p[0] for p in ring[:4]) / 4; lat = sum(p[1] for p in ring[:4]) / 4
            key = (int(pr["row"]) // BLOCK, int(pr["col"]) // BLOCK)
            a = acc.get(key)
            if a is None:
                acc[key] = [vals.copy(), 1, lon, lat]
            else:
                a[0] += vals; a[1] += 1; a[2] += lon; a[3] += lat
            n_done += 1
            if n_done % 100000 == 0:
                print(f"   {n_done} cells ...", flush=True)

    keys = sorted(acc)
    H = np.array([acc[k][0] / acc[k][1] for k in keys])           # mean h per block, shape (cells, fields)
    keep = H.max(axis=1) >= MIN_KEEP
    keys = [k for k, kp in zip(keys, keep) if kp]; H = H[keep]
    lonlat = [[round(acc[k][2] / acc[k][1], 5), round(acc[k][3] / acc[k][1], 5)] for k in keys]
    u16 = np.clip(np.round(H.T * 100), 0, 65535).astype("<u2")    # field-major: one frame is contiguous
    (out / f"{country}.bin").write_bytes(u16.tobytes())
    # block size in metres (approx, from the typical spacing between neighbouring blocks)
    (out / f"{country}.json").write_text(json.dumps({
        "country": country, "block_cells": BLOCK, "block_m": BLOCK * 100,
        "n": len(keys), "fields": fields, "scale": 100,
        "lonlat": lonlat,
        "hmax": round(float(H.max()), 2),
    }))
    vt_all[country] = {fld: round(float(v) / 1e9, 5) for fld, v in zip(fields, tot)}
    vt_path.write_text(json.dumps(vt_all, indent=1))
    # exact metrics per field (used by the missions): cells with any building (>=0.1 m), cells with >=1 floor (>=3 m),
    # 99th percentile height among built cells, maximum height, and total volume
    mx = {}
    for i, fld in enumerate(fields):
        vis = hist[i, 1:]; nvis = int(vis.sum())
        k = int(np.searchsorted(np.cumsum(vis), 0.99 * nvis)) if nvis else 0
        mx[metric_key(fld)] = {"footprint_01": nvis, "footprint_3m": int(hist[i, 30:].sum()),
                               "volume": round(float(tot[i]) / 1e9, 5),
                               "peak": round((k + 1) * 0.1, 1), "max": round(float(hmax_f[i]), 1)}
    mx_all[country] = mx
    mx_path.write_text(json.dumps(mx_all, indent=1))
    print(f"[{country}] {len(keys)} blocks, {len(fields)} fields, bin = {u16.nbytes/1e6:.1f} MB; "
          f"V(1980)={vt_all[country].get('hist_1980')} km3, V(2015)={vt_all[country].get('hist_2015')} km3")
print("Done. Files are in", out)
