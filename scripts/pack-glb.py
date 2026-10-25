# Blender headless: re-export an already reduced GLB with Draco geometry compression (shape untouched).
# usage: blender -b --python scripts/pack-glb.py -- in.glb out.glb
import bpy, sys
src, out = sys.argv[sys.argv.index('--') + 1:][:2]
bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath=src, merge_vertices=False)
for o in bpy.context.scene.objects: o.select_set(o.type == 'MESH')
# UV 12 bits = 4096 steps across a 1024 texture, so texture seams stay put; positions 14 bits.
bpy.ops.export_scene.gltf(filepath=out, export_format='GLB', use_selection=True, export_image_format='JPEG', export_image_quality=85,
                          export_draco_mesh_compression_enable=True, export_draco_mesh_compression_level=6,
                          export_draco_position_quantization=14, export_draco_normal_quantization=10,
                          export_draco_texcoord_quantization=12, export_draco_generic_quantization=12)
print('PACKED', out)
