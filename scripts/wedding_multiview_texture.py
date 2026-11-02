"""// [DANCE-SWAP] Register and bake the owner's four-view photographs onto the source mesh."""
import math
import os
import subprocess
from collections import deque
from pathlib import Path

import bpy
import numpy as np
from mathutils import Vector
from mathutils.bvhtree import BVHTree


def paint_four_views(obj, reference_path, subject, output):
    """Keep mesh/weights unchanged; bake four calibrated projections into one glTF texture."""
    bride = subject == 'bride'
    image = bpy.data.images.load(str(reference_path), check_existing=False)
    width, height = image.size
    pixels = np.array(image.pixels[:], dtype=np.float32).reshape(height, width, 4)
    panel_width = width // 4
    # [DANCE-SWAP] Extend foreground edge colors into white background, preventing white seams
    # at hair, hands and shoes without changing any visible reference pixel.
    for view in range(4):
        panel = pixels[:, view * panel_width:(view + 1) * panel_width]
        mask = panel[:, :, :3].min(axis=2) < .85
        if bride:
            for row in range(height):
                top_y = height - 1 - row
                if 265 < top_y < 476:
                    center = [173, 174, 145, 128][view]
                    half = (40 + (top_y - 265) * .52) if view != 2 else (28 + (top_y - 265) * .43)
                    mask[row, max(0, int(center - half)):min(panel_width, int(center + half))] = True
        from scipy.ndimage import binary_fill_holes
        mask = binary_fill_holes(mask)
        if bride:
            # Preserve the white veil/dress instead of spreading neighboring peach arm colors.
            mask[:height - 185] = True
        visited = mask.copy()
        queue = deque()
        for yy, xx in zip(*np.where(mask)):
            if any(0 <= y < height and 0 <= x < panel_width and not mask[y, x]
                   for y, x in [(yy - 1, xx), (yy + 1, xx), (yy, xx - 1), (yy, xx + 1)]):
                queue.append((yy, xx, 0))
        while queue:
            yy, xx, distance = queue.popleft()
            for ny, nx in [(yy - 1, xx), (yy + 1, xx), (yy, xx - 1), (yy, xx + 1)]:
                if 0 <= ny < height and 0 <= nx < panel_width and not visited[ny, nx]:
                    visited[ny, nx] = True
                    panel[ny, nx, :3] = panel[yy, xx, :3]
                    queue.append((ny, nx, distance + 1))
    pixels[:, :, 3] = 1
    image.pixels.foreach_set(pixels.ravel()); image.update(); image.pack()

    # [DANCE-SWAP] Registration uses actual eye/chin/shoulder/hem heights, not the previous
    # portrait's proportions. The source silhouettes differ slightly from the photographs.
    if bride:
        heights = [0, .69, .89, .94, 1.117, 1.30, 1.60]
        photo_rows = [478, 266, 219, 207, 153, 99, 24]
        centers = [173, 174, 148, 128]
        pixel_scale = 454 / 1.6
    else:
        heights = [0, .09, .43, .765, .84, 1.025, 1.2, 1.60]
        photo_rows = [480, 452, 352, 248, 232, 183, 125, 11]
        centers = [183, 168, 132, 132]
        pixel_scale = 469 / 1.6
    angles = [0, math.pi / 6, math.pi / 2, math.pi]
    directions = [Vector((math.sin(a), -math.cos(a), 0)) for a in angles]
    vertices = obj.data.vertices
    tree = BVHTree.FromPolygons([v.co for v in vertices], [tuple(p.vertices) for p in obj.data.polygons])
    uv_names = []
    for view, angle in enumerate(angles):
        uv_name = f'OwnerView{view}'
        obj.data.uv_layers.new(name=uv_name)
        uv_names.append(uv_name)
        obj.data.color_attributes.new(name=uv_name + 'Weight', type='FLOAT_COLOR', domain='CORNER')
        # Retrieve by name after CustomData additions, which invalidate RNA layer handles.
        uv = obj.data.uv_layers[uv_name]
        weights = obj.data.color_attributes[uv_name + 'Weight']
        for loop in obj.data.loops:
            v = vertices[loop.vertex_index]
            x, y, z = v.co
            horizontal = x * math.cos(angle) + y * math.sin(angle)
            factor = 1.0
            if view == 2:
                factor = 1.25 if bride else 1.10
            elif view == 1:
                factor = 1.08 if bride else 1.0
            elif z < (.93 if bride else .82):
                factor = .98 if bride and z < .46 else .90
            if bride and view == 0 and .88 < z < 1.12:
                factor *= float(np.interp(z, [.88, .94, 1.03, 1.12], [.75, .75, .90, 1]))
            row = float(np.interp(z, heights, photo_rows))
            pixel_x = centers[view] + horizontal * pixel_scale * factor
            if bride and view == 2 and z > .88:
                # [DANCE-SWAP] Side photo registration anchors nose/eye/ear/back-of-head.
                pixel_x = float(np.interp(y, [-.34, -.25, .015, .28], [55, 107, 173, 250]))
            uv.data[loop.index].uv = ((view * panel_width + pixel_x) / width,
                                        (height - 1 - row) / height)
            direction = directions[view].copy()
            if view in (1, 2) and x < 0:
                direction.x *= -1
            normal = v.normal
            facing = max(0, normal.dot(direction)) ** 12
            # Portrait features use front data until the cheek rolls out of view; this prevents
            # doubled eyes from inconsistent photograph perspectives.
            head_bottom = .94 if bride else .84
            if z > head_bottom - .06:
                azimuth = math.atan2(abs(x), -(y - .015))
                if view == 0:
                    facing = max(0, min(1, (1.25 - azimuth) / .38))
                elif view == 1:
                    facing = 0
                elif view == 2:
                    facing = max(0, 1 - abs(azimuth - math.pi / 2) / .72)
                else:
                    facing = max(0, min(1, (azimuth - 1.9) / .55))
            # [DANCE-SWAP] Front/back garment panels use their matching photograph directly;
            # blending oblique tailoring onto a frontal lapel creates false white seams.
            body_center = .015 if bride else -.065
            if z <= head_bottom - .06:
                if y < body_center - .025:
                    facing = 1 if view == 0 else 0
                elif y > body_center + .03:
                    facing = 1 if view == 3 else 0
            origin = v.co + direction * .004
            hit, _, _, _ = tree.ray_cast(origin, direction, 4)
            # Use visibility to avoid projecting the coat/face onto a nearer arm or veil.
            if hit is not None and not (view == 0 and z > head_bottom - .06 and azimuth < 1.05):
                facing *= .02
            weights.data[loop.index].color = (facing, facing, facing, 1)

    # [DANCE-SWAP] Normalize view weights at each corner; no unpainted holes.
    for i in range(len(obj.data.loops)):
        values = [obj.data.color_attributes[n + 'Weight'].data[i].color[0] for n in uv_names]
        total = sum(values)
        if total < 1e-8:
            values[0 if vertices[obj.data.loops[i].vertex_index].co.y < 0 else 3] = 1
            total = 1
        for name, weight in zip(uv_names, values):
            w = weight / total
            obj.data.color_attributes[name + 'Weight'].data[i].color = (w, w, w, 1)
    material = bpy.data.materials.new('Owner four-view colors, baked photograph shading')
    material.use_nodes = True
    nodes, links = material.node_tree.nodes, material.node_tree.links
    base = nodes['Principled BSDF']
    accumulated = None
    for name in uv_names:
        uv = nodes.new('ShaderNodeUVMap'); uv.uv_map = name
        texture = nodes.new('ShaderNodeTexImage'); texture.image = image; texture.extension = 'EXTEND'
        links.new(uv.outputs['UV'], texture.inputs['Vector'])
        weight = nodes.new('ShaderNodeVertexColor'); weight.layer_name = name + 'Weight'
        multiply = nodes.new('ShaderNodeMixRGB'); multiply.blend_type = 'MULTIPLY'; multiply.inputs[0].default_value = 1
        links.new(texture.outputs['Color'], multiply.inputs[1]); links.new(weight.outputs['Color'], multiply.inputs[2])
        if accumulated is None:
            accumulated = multiply.outputs[0]
        else:
            add = nodes.new('ShaderNodeMixRGB'); add.blend_type = 'ADD'; add.inputs[0].default_value = 1
            links.new(accumulated, add.inputs[1]); links.new(multiply.outputs[0], add.inputs[2]); accumulated = add.outputs[0]
    # [DANCE-SWAP] The reconstructed jaw is wider than the photograph's chin. Prevent
    # hair/background sampled just outside that chin from becoming a dark band on skin.
    if bride:
        obj.data.color_attributes.new(name='ChinSkin', type='FLOAT_COLOR', domain='CORNER')
        obj.data.color_attributes.new(name='NeckSkin', type='FLOAT_COLOR', domain='CORNER')
        obj.data.color_attributes.new(name='CheekSkin', type='FLOAT_COLOR', domain='CORNER')
        chin = obj.data.color_attributes['ChinSkin']
        neck = obj.data.color_attributes['NeckSkin']
        cheek = obj.data.color_attributes['CheekSkin']
        for loop in obj.data.loops:
            x, y, z = vertices[loop.vertex_index].co
            weight = max(0, min(1, (z - .87) / .04, (1.025 - z) / .035))
            weight *= max(0, min(1, (-y - .055) / .045)) * max(0, min(1, (.255 - abs(x)) / .035))
            chin.data[loop.index].color = (weight, weight, weight, 1)
            bare = max(0, min(1, (z - .87) / .02, (.965 - z) / .02))
            bare *= max(0, min(1, (.105 - abs(x)) / .03)) * max(0, min(1, (.12 - y) / .07))
            neck.data[loop.index].color = (bare, bare, bare, 1)
            radius = ((abs(x) - .275) / .065) ** 2 + ((y + .145) / .105) ** 2 + ((z - 1.105) / .105) ** 2
            flesh = max(0, min(1, 1 - radius))
            cheek.data[loop.index].color = (flesh, flesh, flesh, 1)
        region = nodes.new('ShaderNodeVertexColor'); region.layer_name = 'ChinSkin'
        separate = nodes.new('ShaderNodeSeparateRGB'); links.new(accumulated, separate.inputs[0])
        dark = nodes.new('ShaderNodeMath'); dark.operation = 'LESS_THAN'; dark.inputs[1].default_value = .35
        links.new(separate.outputs['R'], dark.inputs[0])
        factor = nodes.new('ShaderNodeMath'); factor.operation = 'MULTIPLY'
        links.new(region.outputs['Color'], factor.inputs[0]); links.new(dark.outputs[0], factor.inputs[1])
        correction = nodes.new('ShaderNodeMixRGB')
        bare = nodes.new('ShaderNodeVertexColor'); bare.layer_name = 'NeckSkin'
        combined = nodes.new('ShaderNodeMath'); combined.operation = 'MAXIMUM'
        links.new(factor.outputs[0], combined.inputs[0]); links.new(bare.outputs['Color'], combined.inputs[1])
        cheeks = nodes.new('ShaderNodeVertexColor'); cheeks.layer_name = 'CheekSkin'
        complete = nodes.new('ShaderNodeMath'); complete.operation = 'MAXIMUM'
        links.new(combined.outputs[0], complete.inputs[0]); links.new(cheeks.outputs['Color'], complete.inputs[1])
        links.new(complete.outputs[0], correction.inputs[0]); links.new(accumulated, correction.inputs[1])
        correction.inputs[2].default_value = (*pixels[height - 1 - 190, 173, :3], 1)
        accumulated = correction.outputs[0]
    links.new(accumulated, base.inputs['Base Color'])
    obj.data.materials.clear(); obj.data.materials.append(material)
    for p in obj.data.polygons:
        p.material_index = 0
    obj.data.uv_layers.new(name='WeddingAtlas')
    obj.data.uv_layers.active = obj.data.uv_layers['WeddingAtlas']
    obj.data.uv_layers['WeddingAtlas'].active_render = True
    bpy.context.view_layer.objects.active = obj
    bpy.ops.object.select_all(action='DESELECT'); obj.select_set(True)
    # [DANCE-SWAP] Pack distortion-controlled UV charts with xatlas. Blender Smart UV left
    # subpixel charts on the reconstructed hair/eyelids and produced visible bake seams.
    uv_input = output / (subject + '-uv-input.npz')
    uv_output = output / (subject + '-uv-output.npz')
    np.savez(uv_input, vertices=np.array([v.co[:] for v in obj.data.vertices]),
             triangles=np.array([p.vertices[:] for p in obj.data.polygons]))
    subprocess.run([os.environ.get('DANCE_UNWRAP_PYTHON', 'python'),
                    str(Path(__file__).with_name('wedding_uv_atlas.py')), str(uv_input), str(uv_output)], check=True)
    unwrapped = np.load(uv_output)
    packed_uv = obj.data.uv_layers['WeddingAtlas']
    for index, coordinates in enumerate(unwrapped['uv']):
        packed_uv.data[index].uv = coordinates
    uv_metrics = {'charts': int(unwrapped['charts']), 'utilization': float(unwrapped['utilization'])}
    atlas = bpy.data.images.new(subject + '-four-view-atlas', width=2048, height=2048, alpha=False)
    target = nodes.new('ShaderNodeTexImage'); target.image = atlas; nodes.active = target
    scene = bpy.context.scene; scene.render.engine = 'CYCLES'; scene.cycles.samples = 1; scene.cycles.use_denoising = False
    scene.render.bake.use_pass_direct = False; scene.render.bake.use_pass_indirect = False; scene.render.bake.use_pass_color = True; scene.render.bake.margin = 8
    # [DANCE-SWAP] Save a projection-stage authoring preview to audit atlas seams separately.
    inspect_emission = nodes.new('ShaderNodeEmission')
    links.new(accumulated, inspect_emission.inputs['Color'])
    links.new(inspect_emission.outputs[0], nodes['Material Output'].inputs['Surface'])
    bpy.ops.wm.save_as_mainfile(filepath=str(output / (subject + '-projection.blend')))
    links.new(base.outputs[0], nodes['Material Output'].inputs['Surface'])
    nodes.remove(inspect_emission)
    nodes.active = target
    bpy.ops.object.bake(type='DIFFUSE')
    # [DANCE-SWAP] Dilate unpainted atlas texels before mipmapping. Tiny charts from the
    # reconstructed mesh must not expose black bake background along hair/eyelids/folds.
    from scipy.ndimage import distance_transform_edt
    baked = np.array(atlas.pixels[:], dtype=np.float32).reshape(2048, 2048, 4)
    empty = baked[:, :, :3].max(axis=2) < .003
    nearest = distance_transform_edt(empty, return_distances=False, return_indices=True)
    baked[empty] = baked[nearest[0][empty], nearest[1][empty]]
    baked[:, :, 3] = 1
    atlas.pixels.foreach_set(baked.ravel()); atlas.update()
    atlas.filepath_raw = str(output / (subject + '-atlas.png')); atlas.file_format = 'PNG'; atlas.save(); atlas.pack()
    # Baked shading comes from the reference. An unlit glTF material preserves its exact
    # color values under the unchanged invitation lights instead of washing out the face.
    for node in list(nodes):
        if node not in [target, nodes.get('Material Output')]:
            nodes.remove(node)
    emission = nodes.new('ShaderNodeEmission'); emission.inputs['Strength'].default_value = 1
    links.new(target.outputs['Color'], emission.inputs['Color'])
    # [DANCE-SWAP] Blender's glTF exporter recognizes this camera-ray pattern as
    # KHR_materials_unlit; a bare Emission shader exports a lit emissive PBR material.
    lightpath = nodes.new('ShaderNodeLightPath')
    camera_mix = nodes.new('ShaderNodeMixShader')
    links.new(lightpath.outputs['Is Camera Ray'], camera_mix.inputs[0])
    links.new(emission.outputs[0], camera_mix.inputs[2])
    links.new(camera_mix.outputs[0], nodes['Material Output'].inputs['Surface'])
    for name in [a.name for a in obj.data.color_attributes]:
        obj.data.color_attributes.remove(obj.data.color_attributes[name])
    for name in [a.name for a in obj.data.uv_layers if a.name != 'WeddingAtlas']:
        obj.data.uv_layers.remove(obj.data.uv_layers[name])
    obj.data.uv_layers.active = obj.data.uv_layers['WeddingAtlas']
    return {'method': 'Visibility-weighted four-view photograph projection, calibrated eye/chin/shoulder/hem heights',
            'reference': str(Path(reference_path).name), 'atlasSize': 2048, 'material': 'KHR_materials_unlit; retain reference photograph shading',
            'geometryChanged': False, 'rigChanged': False, 'uvPacking': uv_metrics}
