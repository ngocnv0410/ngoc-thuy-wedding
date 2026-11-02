"""// [DANCE-SWAP] Offline UV packing; run with a Python environment containing numpy/xatlas."""
import sys
import numpy as np
import xatlas

source, destination = sys.argv[1:]
mesh = np.load(source)
atlas = xatlas.Atlas()
atlas.add_mesh(mesh['vertices'].astype(np.float32), mesh['triangles'].astype(np.uint32))
pack = xatlas.PackOptions()
pack.resolution = 2048
pack.padding = 8
pack.bilinear = True
chart = xatlas.ChartOptions()
chart.max_iterations = 2
atlas.generate(chart_options=chart, pack_options=pack)
mapping, triangles, uv = atlas[0]
if not np.array_equal(mapping[triangles], mesh['triangles']):
    raise RuntimeError('UV output must preserve source triangle/corner correspondence')
np.savez(destination, uv=uv[triangles].reshape(-1, 2), utilization=atlas.utilization,
         charts=atlas.chart_count, width=atlas.width, height=atlas.height)
print('DANCE_SWAP_UV', atlas.chart_count, atlas.utilization, atlas.width, atlas.height, flush=True)
