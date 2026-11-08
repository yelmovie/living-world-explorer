"""Render the fixed BIO Core view and export coordinates for the five live lamps.

blender --background --factory-startup --python scripts/render-core-figure.py -- OUTPUT_DIR
"""
import json
import math
from pathlib import Path
import sys
import bpy
from bpy_extras.object_utils import world_to_camera_view
from mathutils import Vector

out = Path(sys.argv[sys.argv.index("--") + 1])
out.mkdir(parents=True, exist_ok=True)
bpy.ops.object.select_all(action='SELECT')
bpy.ops.object.delete(use_global=False)

def material(name, rgb, metallic=0.0, roughness=.35):
    mat = bpy.data.materials.new(name)
    mat.diffuse_color = (*rgb, 1)
    mat.use_nodes = True
    shader = mat.node_tree.nodes.get('Principled BSDF')
    shader.inputs['Base Color'].default_value = (*rgb, 1)
    shader.inputs['Metallic'].default_value = metallic
    shader.inputs['Roughness'].default_value = roughness
    return mat

brass = material('Honey brass', (.59, .31, .09), .72, .29)
gold = material('Polished gold edge', (.87, .53, .17), .68, .24)
dark = material('Dark patinated brass', (.13, .082, .034), .68, .34)
wood = material('Walnut', (.115, .050, .023), .13, .46)
teal = material('Petrol green enamel', (.037, .122, .105), .43, .35)
stone = material('Dark moss ceramic', (.034, .060, .044), .17, .54)
ivory = material('Pale porcelain', (.57, .47, .31), .25, .42)
glass = material('Bottle green lens', (.079, .19, .122), .38, .18)
gem = [
    material('Crystal ' + str(i), rgb, .15, .24)
    for i, rgb in enumerate([(.035, .29, .20), (.066, .42, .29), (.16, .59, .39),
                             (.28, .68, .43), (.086, .35, .27), (.45, .72, .38)])
]

def finish(obj, name, mat, bevel=0):
    obj.name = name
    obj.data.materials.append(mat)
    if bevel:
        mod = obj.modifiers.new('Rounded edges', 'BEVEL')
        mod.width = bevel
        mod.segments = 3
        mod = obj.modifiers.new('Weighted normals', 'WEIGHTED_NORMAL')
        mod.keep_sharp = True
    return obj

def block(name, at, size, mat, bevel=.08):
    bpy.ops.mesh.primitive_cube_add(size=1, location=at)
    obj = bpy.context.object
    obj.dimensions = size
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    return finish(obj, name, mat, bevel)

def cylinder(name, at, radius, depth, mat, bevel=.04, vertices=48):
    bpy.ops.mesh.primitive_cylinder_add(vertices=vertices, radius=radius, depth=depth, location=at)
    return finish(bpy.context.object, name, mat, bevel)

def tube(name, points, radius, mat):
    curve = bpy.data.curves.new(name, 'CURVE')
    curve.dimensions = '3D'
    curve.bevel_depth = radius
    curve.bevel_resolution = 3
    spline = curve.splines.new('BEZIER')
    spline.bezier_points.add(len(points) - 1)
    for bp, point in zip(spline.bezier_points, points):
        bp.co = point
        bp.handle_left_type = bp.handle_right_type = 'AUTO'
    obj = bpy.data.objects.new(name, curve)
    bpy.context.collection.objects.link(obj)
    obj.data.materials.append(mat)
    return obj

def sphere(name, at, r, mat):
    bpy.ops.mesh.primitive_uv_sphere_add(segments=24, ring_count=12, radius=r, location=at)
    obj = finish(bpy.context.object, name, mat)
    for poly in obj.data.polygons:
        poly.use_smooth = True
    return obj

def torus(name, at, radius, wire, mat):
    bpy.ops.mesh.primitive_torus_add(major_segments=60, minor_segments=12, major_radius=radius, minor_radius=wire, location=at)
    obj = finish(bpy.context.object, name, mat)
    for poly in obj.data.polygons:
        poly.use_smooth = True
    return obj

def crystal():
    # Two staggered rings and uneven tips make flat colored facets read from the fixed camera.
    n = 6
    rings = [(1.30, .34, .07), (1.75, .68, 0), (2.74, .59, .18)]
    verts = [(r * math.cos(i*math.tau/n + spin),
              .28 + r * math.sin(i*math.tau/n + spin), z + .045 * math.sin(i*2))
             for z, r, spin in rings for i in range(n)]
    verts += [(.12, .25, 3.48), (-.11, .28, 1.04)]
    faces = []
    for ring in range(2):
        for i in range(n):
            a, b = ring*n+i, ring*n+(i+1)%n
            faces.extend([(a, b, b+n), (a, b+n, a+n)])
    for i in range(n):
        faces.append((2*n+i, 2*n+(i+1)%n, 3*n))
        faces.append(((i+1)%n, i, 3*n+1))
    mesh = bpy.data.meshes.new('Crystal facets')
    mesh.from_pydata(verts, [], faces)
    mesh.update()
    obj = bpy.data.objects.new('BIO crystal', mesh)
    bpy.context.collection.objects.link(obj)
    for mat in gem:
        mesh.materials.append(mat)
    palette = [1, 2, 2, 1, 4, 2, 4, 0, 1, 2, 2, 3]
    for poly in mesh.polygons:
        poly.material_index = palette[poly.index % len(palette)] if poly.index < 24 else (poly.index*7 % 6)

# A little museum instrument: walnut under a dark green enamel face and brass trims.
block('Walnut plinth', (0, .03, .25), (7.55, 3.95, .48), wood, .22)
block('Brass seam', (0, .03, .36), (7.56, 3.96, .11), brass, .052)
block('Moss enamel deck', (0, .03, .48), (7.44, 3.85, .23), teal, .16)
block('Front inset panel', (0, -1.93, .26), (6.95, .09, .20), dark, .043)
for x in (-3.22, 3.22):
    for y in (-1.50, 1.47):
        cylinder('Rubber foot', (x,y,.045), .24,.14,stone,.05)
        sphere('Plinth rivet', (x,y,.61), .058,gold)

center = (0, .35)
for name, z, radius, depth, mat in [
    ('Pedestal foot', .69, 1.46, .20, dark),
    ('Cast bronze rim', .80, 1.42, .14, brass),
    ('Green collar', .91, 1.20, .18, teal),
    ('Crystal cradle', 1.00, .99, .13, gold),
    ('Porcelain mount', 1.08, .62, .14, ivory)
]:
    cylinder(name, (*center, z), radius, depth, mat)
torus('Pedestal fillet', (*center, .91), 1.19, .052, gold)
crystal()

# Three brass ribs frame the crystal and leave its front silhouette open.
for angle in (math.radians(20), math.radians(91), math.radians(160)):
    dx, dy = math.cos(angle), math.sin(angle)
    points = [(dx*r, .35 + dy*r, z) for r,z in [(1.24,.94),(1.46,1.43),(1.40,2.44),(1.02,3.35),(.56,3.72),(.14,3.90)]]
    tube('Swept bronze rib', points, .085, brass)
    tube('Inlaid bright seam', [(x*.99, .35+(y-.35)*.99,z+.025) for x,y,z in points], .024, gold)
    sphere('Rib brass foot', points[0], .123, gold)
cylinder('Top finial', (*center,3.96), .205, .16, gold)
sphere('Green finial bead', (*center,4.105), .12, glass)
torus('Crown trim', (*center,3.91), .21, .047, dark)

lamp_centers = []
for i,x in enumerate((-2.98, -1.49, 0, 1.49, 2.98)):
    y = -1.43
    block('Port mount ' + str(i+1), (x,y,.63), (1.04, .66, .23), dark, .12)
    cylinder('Port surround', (x,y,.77), .245, .13, brass)
    torus('Port gold ring', (x,y,.84), .208, .045, gold)
    bulb = sphere('Port lens', (x,y,.855), .176, glass)
    bulb.scale.z = .62
    lamp_centers.append((x,y,.92))
    x0 = x*.28
    tube('Brass conduit', [(x,-1.10,.61), (x,-.90,.65), ((x+x0)*.5,-.52,.65), (x0,-.37,.70)], .039, brass)
    for sign in (-1,1):
        cylinder('Port screw', (x+sign*.37,y,.76), .049, .038, gold, .011, 12)

scene = bpy.context.scene
bpy.ops.object.camera_add(location=(0, -11.9, 7.65))
camera = bpy.context.object
target = Vector((0, .20, 1.74))
camera.rotation_euler = (target-camera.location).to_track_quat('-Z','Y').to_euler()
camera.data.type = 'ORTHO'
camera.data.ortho_scale = 8.45
scene.camera = camera

def light(name, position, target, color, watts, size):
    bpy.ops.object.light_add(type='AREA', location=position)
    obj = bpy.context.object
    obj.name = name
    obj.rotation_euler = (Vector(target)-obj.location).to_track_quat('-Z','Y').to_euler()
    obj.data.color = color
    obj.data.energy = watts
    obj.data.shape = 'DISK'
    obj.data.size = size

light('Window key', (-4,-5,8), (0,0,1.7), (1,.84,.62), 1150, 6)
light('Soft blue fill', (4,-5,4.5), (0,0,1.5), (.66,.85,1), 750, 5)
light('Golden rim', (2,3,6), (0,0,2.2), (1,.73,.39), 1350, 4)
scene.world.color = (.18,.18,.18)
scene.render.engine = 'CYCLES'
scene.cycles.samples = 24
scene.cycles.use_denoising = True
scene.render.resolution_x = 1050
scene.render.resolution_y = 760
scene.render.resolution_percentage = 100
scene.render.film_transparent = True
scene.render.image_settings.file_format = 'PNG'
scene.render.image_settings.color_mode = 'RGBA'
scene.view_settings.view_transform = 'AgX'
scene.render.filepath = str(out / 'bio-core.png')

bpy.context.view_layer.update()
def project(coords):
    point = world_to_camera_view(scene, camera, Vector(coords))
    return [round(100*point.x, 2), round(100*(1-point.y), 2)]
(out / 'anchors.json').write_text(json.dumps({
    'width': scene.render.resolution_x,
    'height': scene.render.resolution_y,
    'lamps': [project(x) for x in lamp_centers],
    'crystal': project((0,.28,2.20)),
}, indent=2) + '\n')
bpy.ops.render.render(write_still=True)

for mat in gem:
    shader = mat.node_tree.nodes.get('Principled BSDF')
    r, g, b, _ = mat.diffuse_color
    shader.inputs['Emission Color'].default_value = (r*.65, g, b*.60, 1)
    shader.inputs['Emission Strength'].default_value = 1.25
scene.render.filepath = str(out / 'bio-core-powered.png')
bpy.ops.render.render(write_still=True)
