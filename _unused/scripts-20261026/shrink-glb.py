# Blender headless: decimate a Meshy GLB to several triangle targets and render each next to the original.
# usage: blender -b --python shrink_glb.py -- in.glb out_dir name tex_px target1 target2 ...
import bpy, sys, os, math, json, time
from mathutils import Vector

args = sys.argv[sys.argv.index('--') + 1:]
src, out_dir, name, tex_px = args[0], args[1], args[2], int(args[3])
targets = [int(t) for t in args[4:]]
os.makedirs(out_dir, exist_ok=True)
log = {'name': name, 'source': src, 'levels': []}

bpy.ops.wm.read_factory_settings(use_empty=True)
t0 = time.time()
# merge_vertices: weld coincident verts so seams stay closed; UVs stay per-corner in Blender.
bpy.ops.import_scene.gltf(filepath=src, merge_vertices=True)
meshes = [o for o in bpy.context.scene.objects if o.type == 'MESH']
for o in bpy.context.scene.objects: o.select_set(o in meshes)
bpy.context.view_layer.objects.active = meshes[0]
if len(meshes) > 1: bpy.ops.object.join()
orig = bpy.context.view_layer.objects.active
orig.name = 'original'
orig_tris = sum(len(p.vertices) - 2 for p in orig.data.polygons)
log['original'] = {'tris': orig_tris, 'dims': list(orig.dimensions), 'import_s': round(time.time() - t0, 1)}

# Shrink textures once (shared by every level). Normal/color 1024 (tex_px), metal-roughness half.
for img in bpy.data.images:
    if img.size[0] > tex_px:
        side = tex_px // 2 if 'metal' in img.name.lower() or 'rough' in img.name.lower() else tex_px
        img.scale(side, side)

# Camera rig around the bounding box centre.
world_corners = [orig.matrix_world @ Vector(c) for c in orig.bound_box]
centre = sum(world_corners, Vector()) / 8
radius = max((c - centre).length for c in world_corners)
scene = bpy.context.scene
scene.render.engine = 'BLENDER_WORKBENCH'
scene.display.shading.light = 'STUDIO'
scene.display.shading.color_type = 'TEXTURE'
scene.render.resolution_x, scene.render.resolution_y = 640, 480
scene.render.image_settings.file_format = 'PNG'
cam_data = bpy.data.cameras.new('cam'); cam_data.lens = 50
cam = bpy.data.objects.new('cam', cam_data); scene.collection.objects.link(cam); scene.camera = cam
views = {'front': (0, -1, .35), 'side': (1, -.2, .2), 'below': (.3, -.6, -.75)}

def render(obj, tag):
    for o in scene.objects:
        if o.type == 'MESH': o.hide_render = o is not obj
    for view, d in views.items():
        direction = Vector(d).normalized()
        cam.location = centre + direction * radius * 3.1
        cam.rotation_euler = (centre - cam.location).to_track_quat('-Z', 'Y').to_euler()
        scene.render.filepath = os.path.join(out_dir, f'{name}-{tag}-{view}.png')
        bpy.ops.render.render(write_still=True)

render(orig, 'orig')

for target in targets:
    t1 = time.time()
    copy = orig.copy(); copy.data = orig.data.copy(); copy.name = f'lod{target}'
    scene.collection.objects.link(copy)
    for o in scene.objects: o.select_set(o is copy)
    bpy.context.view_layer.objects.active = copy
    mod = copy.modifiers.new('dec', 'DECIMATE')
    mod.decimate_type = 'COLLAPSE'; mod.use_collapse_triangulate = True
    mod.ratio = min(1.0, target / orig_tris)
    bpy.ops.object.modifier_apply(modifier='dec')
    tris = sum(len(p.vertices) - 2 for p in copy.data.polygons)
    path = os.path.join(out_dir, f'{name}-{target}.glb')
    bpy.ops.export_scene.gltf(filepath=path, export_format='GLB', use_selection=True, export_apply=True,
                              export_image_format='JPEG', export_image_quality=85, export_yup=True)
    render(copy, str(target))
    log['levels'].append({'target': target, 'tris': tris, 'dims': list(copy.dimensions), 'bytes': os.path.getsize(path), 's': round(time.time() - t1, 1)})
    copy.hide_render = True

with open(os.path.join(out_dir, f'{name}-log.json'), 'w') as f: json.dump(log, f, indent=1)
print('SHRINK DONE', json.dumps(log))
