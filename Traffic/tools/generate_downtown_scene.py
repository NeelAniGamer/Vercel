"""
=============================================================================
Dense Downtown & Mixed Urban Scene Map Generator for Blender (bpy)
=============================================================================
This script procedurally generates a comprehensive 3D city scene map:
- 4-Lane Arterial Avenues & 2-Lane Residential Streets
- Detailed 4-way & T-intersections with Zebra Crossings & Road Markings
- Commercial Core: Modern Glass & Concrete Skyscrapers with Rooftop Details
- Mid-Rise District: 3-5 Story Commercial/Retail Blocks with Storefronts
- Residential District: Detailed Normal Houses (Pitched Roofs, Porch,
  Windows with Frames, Front Doors, Chimneys, Yard Fences)
- Traffic Infrastructure: Cantilever Traffic Signals (Illuminated R/Y/G),
  Dual-Arm Streetlights, Bus Stops, Benches, Planters & Trees
- Custom Model Slotting: Automatically imports & places external .glb/.fbx
  models if found in CUSTOM_MODELS_DIR (e.g., Traffic/Models/kenney_city-pack).
- Exports ready-to-use glTF (.glb) for Three.js / WebGL and saves .blend file.

Usage:
  Headless / Command Line:
    blender --background --python generate_downtown_scene.py

  Inside Blender UI:
    Open Blender -> Scripting tab -> Open this file -> Run Script (Alt+P)
=============================================================================
"""

import bpy
import bmesh
import math
import os
import random

# =============================================================================
# CONFIGURATION & PATHS
# =============================================================================
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__)) if '__file__' in locals() else os.getcwd()
PROJECT_ROOT = os.path.abspath(os.path.join(SCRIPT_DIR, '..'))

# Directory for user-provided models (.glb, .gltf, .fbx, .obj)
CUSTOM_MODELS_DIR = os.path.join(PROJECT_ROOT, 'Models', 'kenney_city-pack')

# Output paths
OUTPUT_DIR = os.path.join(PROJECT_ROOT, 'assets')
BLEND_OUTPUT_PATH = os.path.join(OUTPUT_DIR, 'downtown_scene_map.blend')
GLB_OUTPUT_PATH = os.path.join(OUTPUT_DIR, 'downtown_scene_map.glb')

os.makedirs(OUTPUT_DIR, exist_ok=True)

# Random seed for reproducible generation
random.seed(42)

# =============================================================================
# SCENE RESET & COLLECTION SETUP
# =============================================================================
def reset_scene():
    """Clear all existing objects, materials, and collections from the scene."""
    if bpy.context.active_object and bpy.context.active_object.mode != 'OBJECT':
        bpy.ops.object.mode_set(mode='OBJECT')
    
    bpy.ops.object.select_all(action='SELECT')
    bpy.ops.object.delete(use_global=False)
    
    # Remove orphan data
    for block in bpy.data.meshes: bpy.data.meshes.remove(block)
    for block in bpy.data.materials: bpy.data.materials.remove(block)
    for block in bpy.data.cameras: bpy.data.cameras.remove(block)
    for block in bpy.data.lights: bpy.data.lights.remove(block)

def get_or_create_collection(name, parent_collection=None):
    """Retrieve or create a collection hierarchy."""
    if name in bpy.data.collections:
        col = bpy.data.collections[name]
    else:
        col = bpy.data.collections.new(name)
        if parent_collection:
            parent_collection.children.link(col)
        else:
            bpy.context.scene.collection.children.link(col)
    return col

# =============================================================================
# MATERIAL CREATION HELPERS
# =============================================================================
MAT_CACHE = {}

def get_material(name, diffuse=(0.5, 0.5, 0.5, 1.0), roughness=0.6, metallic=0.0,
                 emission_color=None, emission_strength=0.0):
    """Create a Principled BSDF material with custom PBR parameters."""
    if name in MAT_CACHE:
        return MAT_CACHE[name]
    
    mat = bpy.data.materials.new(name=name)
    mat.use_nodes = True
    nodes = mat.node_tree.nodes
    links = mat.node_tree.links
    
    bsdf = nodes.get('Principled BSDF')
    if not bsdf:
        bsdf = nodes.new(type='ShaderNodeBsdfPrincipled')
        output = nodes.get('Material Output') or nodes.new(type='ShaderNodeOutputMaterial')
        links.new(bsdf.outputs['BSDF'], output.inputs['Surface'])
    
    # Set base color & PBR inputs (compatible with Blender 3.x and 4.x)
    if 'Base Color' in bsdf.inputs:
        bsdf.inputs['Base Color'].default_value = diffuse
    if 'Roughness' in bsdf.inputs:
        bsdf.inputs['Roughness'].default_value = roughness
    if 'Metallic' in bsdf.inputs:
        bsdf.inputs['Metallic'].default_value = metallic
        
    if emission_color and emission_strength > 0:
        if 'Emission Color' in bsdf.inputs: # Blender 4.0+
            bsdf.inputs['Emission Color'].default_value = emission_color
            bsdf.inputs['Emission Strength'].default_value = emission_strength
        elif 'Emission' in bsdf.inputs: # Blender 3.x
            bsdf.inputs['Emission'].default_value = emission_color
            if 'Emission Strength' in bsdf.inputs:
                bsdf.inputs['Emission Strength'].default_value = emission_strength

    MAT_CACHE[name] = mat
    return mat

def init_palette():
    """Pre-initialize city materials."""
    get_material('Road_Asphalt', diffuse=(0.14, 0.15, 0.17, 1.0), roughness=0.85)
    get_material('Road_Marking_White', diffuse=(0.95, 0.95, 0.95, 1.0), roughness=0.5)
    get_material('Road_Marking_Yellow', diffuse=(0.95, 0.72, 0.08, 1.0), roughness=0.5)
    get_material('Sidewalk_Concrete', diffuse=(0.68, 0.69, 0.71, 1.0), roughness=0.8)
    get_material('Curb_Stone', diffuse=(0.45, 0.46, 0.48, 1.0), roughness=0.9)
    get_material('Glass_Curtain_Blue', diffuse=(0.12, 0.32, 0.55, 1.0), roughness=0.1, metallic=0.7)
    get_material('Glass_Curtain_Dark', diffuse=(0.08, 0.14, 0.22, 1.0), roughness=0.15, metallic=0.6)
    get_material('Tower_Facade_Concrete', diffuse=(0.78, 0.76, 0.72, 1.0), roughness=0.7)
    get_material('Tower_Metal_Trim', diffuse=(0.25, 0.27, 0.30, 1.0), roughness=0.3, metallic=0.85)
    get_material('House_Wall_Cream', diffuse=(0.92, 0.88, 0.80, 1.0), roughness=0.75)
    get_material('House_Wall_Brick', diffuse=(0.65, 0.28, 0.22, 1.0), roughness=0.85)
    get_material('House_Wall_Blue', diffuse=(0.38, 0.52, 0.62, 1.0), roughness=0.7)
    get_material('House_Roof_Terracotta', diffuse=(0.72, 0.32, 0.20, 1.0), roughness=0.8)
    get_material('House_Roof_Slate', diffuse=(0.22, 0.24, 0.28, 1.0), roughness=0.6)
    get_material('House_Door_Wood', diffuse=(0.42, 0.25, 0.15, 1.0), roughness=0.5)
    get_material('House_Window_Frame', diffuse=(0.96, 0.96, 0.96, 1.0), roughness=0.4)
    get_material('Window_Glass', diffuse=(0.15, 0.25, 0.35, 1.0), roughness=0.1, metallic=0.8)
    get_material('Metal_Poles', diffuse=(0.20, 0.22, 0.24, 1.0), roughness=0.4, metallic=0.8)
    get_material('Traffic_Signal_Housing', diffuse=(0.10, 0.12, 0.10, 1.0), roughness=0.5)
    get_material('Signal_Red_Emissive', diffuse=(1.0, 0.05, 0.05, 1.0), emission_color=(1.0, 0.05, 0.05, 1.0), emission_strength=4.0)
    get_material('Signal_Amber_Emissive', diffuse=(1.0, 0.65, 0.05, 1.0), emission_color=(1.0, 0.65, 0.05, 1.0), emission_strength=4.0)
    get_material('Signal_Green_Emissive', diffuse=(0.05, 0.95, 0.35, 1.0), emission_color=(0.05, 0.95, 0.35, 1.0), emission_strength=4.0)
    get_material('Street_Light_Glow', diffuse=(1.0, 0.95, 0.8, 1.0), emission_color=(1.0, 0.95, 0.8, 1.0), emission_strength=5.0)
    get_material('Foliage_Green', diffuse=(0.18, 0.45, 0.16, 1.0), roughness=0.9)
    get_material('Trunk_Brown', diffuse=(0.35, 0.22, 0.14, 1.0), roughness=0.9)
    get_material('Lawn_Grass', diffuse=(0.24, 0.50, 0.22, 1.0), roughness=0.9)

# =============================================================================
# PROCEDURAL MESH PRIMITIVES
# =============================================================================
def create_box(name, location, size, material=None, collection=None):
    """Create a rectangular box mesh with given dimensions."""
    mesh = bpy.data.meshes.new(name)
    obj = bpy.data.objects.new(name, mesh)
    
    bm = bmesh.new()
    bmesh.ops.create_cube(bm, size=1.0)
    for v in bm.verts:
        v.co.x *= size[0]
        v.co.y *= size[1]
        v.co.z *= size[2]
    bm.to_mesh(mesh)
    bm.free()
    
    obj.location = location
    if material:
        obj.data.materials.append(material)
        
    target_col = collection or bpy.context.scene.collection
    target_col.objects.link(obj)
    return obj

def create_cylinder(name, location, radius, depth, material=None, collection=None, vertices=16):
    """Create a cylinder mesh."""
    mesh = bpy.data.meshes.new(name)
    obj = bpy.data.objects.new(name, mesh)
    
    bm = bmesh.new()
    bmesh.ops.create_cone(bm, cap_ends=True, cap_tris=False, segments=vertices,
                          radius1=radius, radius2=radius, depth=depth)
    bm.to_mesh(mesh)
    bm.free()
    
    obj.location = location
    if material:
        obj.data.materials.append(material)
        
    target_col = collection or bpy.context.scene.collection
    target_col.objects.link(obj)
    return obj

# =============================================================================
# 1. ROAD NETWORK & INTERSECTION BUILDER
# =============================================================================
def build_road_network(col_roads, col_props):
    """Builds the 4-lane avenues, 2-lane cross streets, sidewalks, and intersections."""
    road_mat = get_material('Road_Asphalt')
    white_mat = get_material('Road_Marking_White')
    yellow_mat = get_material('Road_Marking_Yellow')
    sidewalk_mat = get_material('Sidewalk_Concrete')
    curb_mat = get_material('Curb_Stone')
    
    # Ground plane (base terrain)
    create_box('Ground_Terrain', (0, 0, -0.1), (600, 600, 0.2), get_material('Lawn_Grass'), col_roads)
    
    # ── Arterial Avenue 1 (SV Boulevard, along X-axis, width 22m, length 500m) ──
    create_box('Road_Arterial_X', (0, 0, 0.01), (500, 22, 0.02), road_mat, col_roads)
    
    # Double solid yellow center line
    create_box('Center_Yellow_X_1', (0, 0.2, 0.025), (500, 0.18, 0.01), yellow_mat, col_roads)
    create_box('Center_Yellow_X_2', (0, -0.2, 0.025), (500, 0.18, 0.01), yellow_mat, col_roads)
    
    # Dashed lane divider lines (lanes at +5.5m and -5.5m)
    for y_lane in [5.5, -5.5]:
        for x_seg in range(-240, 240, 10):
            if abs(x_seg) > 18:
                create_box(f'Dash_X_{y_lane}_{x_seg}', (x_seg, y_lane, 0.025), (4.5, 0.16, 0.01), white_mat, col_roads)
                
    # ── Arterial Avenue 2 (Grand Central Way, along Y-axis, width 22m, length 500m) ──
    create_box('Road_Arterial_Y', (0, 0, 0.01), (22, 500, 0.02), road_mat, col_roads)
    
    # Double solid yellow center line
    create_box('Center_Yellow_Y_1', (0.2, 0, 0.025), (0.18, 500, 0.01), yellow_mat, col_roads)
    create_box('Center_Yellow_Y_2', (-0.2, 0, 0.025), (0.18, 500, 0.01), yellow_mat, col_roads)
    
    # Dashed lane divider lines (lanes at +5.5m and -5.5m)
    for x_lane in [5.5, -5.5]:
        for y_seg in range(-240, 240, 10):
            if abs(y_seg) > 18:
                create_box(f'Dash_Y_{x_lane}_{y_seg}', (x_lane, y_seg, 0.025), (0.16, 4.5, 0.01), white_mat, col_roads)
                
    # ── Secondary Residential Cross Streets (Width 14m, Y = 90 and Y = -90) ──
    for y_cross in [90, -90]:
        create_box(f'Road_Res_{y_cross}', (0, y_cross, 0.01), (500, 14, 0.02), road_mat, col_roads)
        for x_seg in range(-240, 240, 8):
            if abs(x_seg) > 16:
                create_box(f'Res_Dash_{y_cross}_{x_seg}', (x_seg, y_cross, 0.025), (4.0, 0.15, 0.01), white_mat, col_roads)

    # ── Sidewalks & Curbs along SV Boulevard (Y = +/- 11m to +/- 16m) ──
    for y_side in [13.5, -13.5]:
        for x_block in [(-135, 230), (135, 230)]:
            create_box(f'Sidewalk_X_{y_side}_{x_block[0]}', (x_block[0], y_side, 0.1), (x_block[1], 5.0, 0.2), sidewalk_mat, col_roads)
            curb_y = y_side - 2.6 if y_side > 0 else y_side + 2.6
            create_box(f'Curb_X_{y_side}_{x_block[0]}', (x_block[0], curb_y, 0.1), (x_block[1], 0.25, 0.22), curb_mat, col_roads)

    # ── Sidewalks & Curbs along Grand Central Way (X = +/- 11m to +/- 16m) ──
    for x_side in [13.5, -13.5]:
        for y_block in [(-135, 230), (135, 230)]:
            create_box(f'Sidewalk_Y_{x_side}_{y_block[0]}', (x_side, y_block[0], 0.1), (5.0, y_block[1], 0.2), sidewalk_mat, col_roads)
            curb_x = x_side - 2.6 if x_side > 0 else x_side + 2.6
            create_box(f'Curb_Y_{x_side}_{y_block[0]}', (curb_x, y_block[0], 0.1), (0.25, y_block[1], 0.22), curb_mat, col_roads)

    # ── Zebra Crossings at Central 4-Way Intersection (X=0, Y=0) ──
    for x_stripe in range(-9, 10, 2):
        create_box(f'Zebra_N_{x_stripe}', (x_stripe, 13.5, 0.028), (1.0, 3.2, 0.01), white_mat, col_roads)
        create_box(f'Zebra_S_{x_stripe}', (x_stripe, -13.5, 0.028), (1.0, 3.2, 0.01), white_mat, col_roads)
    for y_stripe in range(-9, 10, 2):
        create_box(f'Zebra_E_{y_stripe}', (13.5, y_stripe, 0.028), (3.2, 1.0, 0.01), white_mat, col_roads)
        create_box(f'Zebra_W_{y_stripe}', (-13.5, y_stripe, 0.028), (3.2, 1.0, 0.01), white_mat, col_roads)

    # Stop lines before crossings
    create_box('Stop_Line_N', (5.5, 16.0, 0.028), (10.5, 0.5, 0.01), white_mat, col_roads)
    create_box('Stop_Line_S', (-5.5, -16.0, 0.028), (10.5, 0.5, 0.01), white_mat, col_roads)
    create_box('Stop_Line_E', (16.0, -5.5, 0.028), (0.5, 10.5, 0.01), white_mat, col_roads)
    create_box('Stop_Line_W', (-16.0, 5.5, 0.028), (0.5, 10.5, 0.01), white_mat, col_roads)

# =============================================================================
# 2. COMMERCIAL SKYSCRAPERS & TOWERS
# =============================================================================
def generate_skyscraper(name, loc, width, depth, height, style='curtain_wall', collection=None):
    """Build a modern high-rise skyscraper with lobby and rooftop plant rooms."""
    col = collection or bpy.context.scene.collection
    glass_mat = get_material('Glass_Curtain_Blue') if style == 'curtain_wall' else get_material('Glass_Curtain_Dark')
    concrete_mat = get_material('Tower_Facade_Concrete')
    trim_mat = get_material('Tower_Metal_Trim')
    
    # Base podium
    podium_h = 16.0
    podium_w = width * 1.15
    podium_d = depth * 1.15
    create_box(f'{name}_Podium', (loc[0], loc[1], podium_h/2), (podium_w, podium_d, podium_h), concrete_mat, col)
    
    # Entrance canopy & revolving door cutout
    canopy_d = 4.0
    create_box(f'{name}_Canopy', (loc[0], loc[1] - podium_d/2 - canopy_d/2, 4.2), (8.0, canopy_d, 0.4), trim_mat, col)
    create_box(f'{name}_LobbyGlass', (loc[0], loc[1] - podium_d/2 + 0.1, 2.5), (10.0, 0.2, 4.0), glass_mat, col)
    
    # Main tower shaft
    tower_h = height - podium_h
    tower_center_z = podium_h + tower_h / 2
    create_box(f'{name}_TowerCore', (loc[0], loc[1], tower_center_z), (width, depth, tower_h), glass_mat, col)
    
    # Vertical mullions
    num_mullions_x = max(3, int(width / 4))
    for i in range(num_mullions_x + 1):
        mx = loc[0] - width/2 + i * (width / num_mullions_x)
        create_box(f'{name}_Mullion_F_{i}', (mx, loc[1] - depth/2 - 0.15, tower_center_z), (0.25, 0.3, tower_h), trim_mat, col)
        create_box(f'{name}_Mullion_B_{i}', (mx, loc[1] + depth/2 + 0.15, tower_center_z), (0.25, 0.3, tower_h), trim_mat, col)
        
    # Horizontal floor spandrels
    num_floors = int(tower_h / 3.5)
    for f in range(num_floors + 1):
        fz = podium_h + f * (tower_h / num_floors)
        create_box(f'{name}_Spandrel_{f}', (loc[0], loc[1], fz), (width + 0.2, depth + 0.2, 0.35), concrete_mat, col)
        
    # Rooftop mechanical penthouse & chillers
    roof_z = podium_h + tower_h
    create_box(f'{name}_Penthouse', (loc[0], loc[1], roof_z + 4.0), (width * 0.6, depth * 0.6, 8.0), concrete_mat, col)
    create_box(f'{name}_Chiller1', (loc[0] + width*0.2, loc[1] + depth*0.2, roof_z + 2.0), (3.0, 4.0, 2.5), trim_mat, col)
    create_box(f'{name}_Chiller2', (loc[0] - width*0.2, loc[1] + depth*0.2, roof_z + 2.0), (3.0, 4.0, 2.5), trim_mat, col)
    
    # Rooftop antenna mast & warning beacon
    create_cylinder(f'{name}_Antenna', (loc[0], loc[1], roof_z + 16.0), 0.35, 18.0, trim_mat, col)
    create_cylinder(f'{name}_Beacon', (loc[0], loc[1], roof_z + 25.2), 0.25, 0.4, get_material('Signal_Red_Emissive'), col)

# =============================================================================
# 3. MID-RISE COMMERCIAL & APARTMENT BLOCKS
# =============================================================================
def generate_midrise_block(name, loc, width, depth, floors=4, collection=None):
    """Build a 3-5 story mixed-use commercial/residential building."""
    col = collection or bpy.context.scene.collection
    wall_mat = get_material('House_Wall_Cream') if random.random() > 0.5 else get_material('House_Wall_Brick')
    window_mat = get_material('Window_Glass')
    frame_mat = get_material('House_Window_Frame')
    metal_mat = get_material('Tower_Metal_Trim')
    
    floor_height = 3.4
    total_height = floors * floor_height
    
    create_box(f'{name}_Body', (loc[0], loc[1], total_height/2), (width, depth, total_height), wall_mat, col)
    
    # Ground floor storefront awning
    awning_color = (0.85, 0.2, 0.2, 1.0) if random.random() > 0.5 else (0.15, 0.45, 0.75, 1.0)
    awning_mat = get_material(f'Awning_{name}', diffuse=awning_color, roughness=0.6)
    create_box(f'{name}_Awning', (loc[0], loc[1] - depth/2 - 1.2, 3.2), (width * 0.85, 2.2, 0.3), awning_mat, col)
    create_box(f'{name}_ShopGlass', (loc[0], loc[1] - depth/2 - 0.05, 1.6), (width * 0.75, 0.2, 2.4), window_mat, col)
    create_box(f'{name}_Sign', (loc[0], loc[1] - depth/2 - 0.2, 4.0), (width * 0.7, 0.2, 0.8), get_material('Tower_Facade_Concrete'), col)
    
    # Upper floor windows and balconies
    for fl in range(1, floors):
        fz = fl * floor_height + floor_height / 2
        for wx in [-width/3, 0, width/3]:
            create_box(f'{name}_WFrame_{fl}_{wx:.1f}', (loc[0] + wx, loc[1] - depth/2 - 0.05, fz), (1.6, 0.15, 2.0), frame_mat, col)
            create_box(f'{name}_WGlass_{fl}_{wx:.1f}', (loc[0] + wx, loc[1] - depth/2 - 0.08, fz), (1.4, 0.05, 1.8), window_mat, col)
            if abs(wx) < 0.1:
                create_box(f'{name}_BalconyBase_{fl}', (loc[0], loc[1] - depth/2 - 0.8, fz - 0.9), (2.2, 1.5, 0.2), frame_mat, col)
                create_box(f'{name}_BalconyRailing_{fl}', (loc[0], loc[1] - depth/2 - 1.5, fz - 0.4), (2.2, 0.1, 0.9), metal_mat, col)
                
    create_box(f'{name}_Cornice', (loc[0], loc[1], total_height + 0.3), (width + 0.6, depth + 0.6, 0.6), frame_mat, col)

# =============================================================================
# 4. DETAILED NORMAL HOUSES & VILLAS
# =============================================================================
def generate_residential_house(name, loc, width=12.0, depth=10.0, stories=2, collection=None):
    """
    Build a realistic, detailed 1-2 story residential house:
    - Ground slab / foundation
    - Main walls with siding/stucco
    - Pitched gable roof with overhang and shingles
    - Front covered porch with supporting columns & steps
    - Detailed entrance door
    - Framed windows with cross-mullions
    - Brick chimney
    - Front yard fence and walkway
    """
    col = collection or bpy.context.scene.collection
    wall_mats = [get_material('House_Wall_Cream'), get_material('House_Wall_Brick'), get_material('House_Wall_Blue')]
    roof_mats = [get_material('House_Roof_Terracotta'), get_material('House_Roof_Slate')]
    
    wall_mat = random.choice(wall_mats)
    roof_mat = random.choice(roof_mats)
    door_mat = get_material('House_Door_Wood')
    frame_mat = get_material('House_Window_Frame')
    window_mat = get_material('Window_Glass')
    brick_mat = get_material('House_Wall_Brick')
    
    story_h = 3.2
    body_h = stories * story_h
    
    # 1. Foundation slab
    create_box(f'{name}_Foundation', (loc[0], loc[1], 0.25), (width + 0.4, depth + 0.4, 0.5), get_material('Curb_Stone'), col)
    
    # 2. Main walls
    create_box(f'{name}_Walls', (loc[0], loc[1], 0.5 + body_h/2), (width, depth, body_h), wall_mat, col)
    
    # 3. Pitched Gable Roof
    roof_h = 4.0
    roof_mesh = bpy.data.meshes.new(f'{name}_RoofMesh')
    roof_obj = bpy.data.objects.new(f'{name}_Roof', roof_mesh)
    
    bm = bmesh.new()
    hw = (width + 1.2) / 2
    hd = (depth + 1.2) / 2
    base_z = 0.5 + body_h
    
    v1 = bm.verts.new((-hw, -hd, base_z))
    v2 = bm.verts.new((hw, -hd, base_z))
    v3 = bm.verts.new((hw, hd, base_z))
    v4 = bm.verts.new((-hw, hd, base_z))
    v_ridge_w = bm.verts.new((-hw, 0, base_z + roof_h))
    v_ridge_e = bm.verts.new((hw, 0, base_z + roof_h))
    
    bm.faces.new((v1, v2, v_ridge_e, v_ridge_w))
    bm.faces.new((v3, v4, v_ridge_w, v_ridge_e))
    bm.faces.new((v4, v1, v_ridge_w))
    bm.faces.new((v2, v3, v_ridge_e))
    bm.faces.new((v4, v3, v2, v1))
    
    bm.to_mesh(roof_mesh)
    bm.free()
    
    roof_obj.location = (loc[0], loc[1], 0)
    roof_obj.data.materials.append(roof_mat)
    col.objects.link(roof_obj)
    
    # 4. Covered Front Porch
    porch_w = 4.8
    porch_d = 2.4
    porch_h = 2.8
    porch_center_y = loc[1] - depth/2 - porch_d/2
    
    create_box(f'{name}_PorchDeck', (loc[0], porch_center_y, 0.25), (porch_w, porch_d, 0.5), get_material('Curb_Stone'), col)
    create_box(f'{name}_PorchRoof', (loc[0], porch_center_y, 0.5 + porch_h), (porch_w + 0.4, porch_d + 0.4, 0.3), roof_mat, col)
    for col_x in [loc[0] - porch_w/2 + 0.2, loc[0] + porch_w/2 - 0.2]:
        create_cylinder(f'{name}_PorchCol_{col_x:.1f}', (col_x, loc[1] - depth/2 - porch_d + 0.2, 0.5 + porch_h/2),
                        0.12, porch_h, frame_mat, col, vertices=8)
    create_box(f'{name}_Step1', (loc[0], loc[1] - depth/2 - porch_d - 0.4, 0.12), (2.0, 0.8, 0.24), get_material('Curb_Stone'), col)
    
    # 5. Entrance Door
    door_w = 1.3
    door_h = 2.4
    create_box(f'{name}_DoorFrame', (loc[0], loc[1] - depth/2 - 0.05, 0.5 + door_h/2), (door_w + 0.2, 0.15, door_h + 0.2), frame_mat, col)
    create_box(f'{name}_DoorLeaf', (loc[0], loc[1] - depth/2 - 0.08, 0.5 + door_h/2), (door_w, 0.08, door_h), door_mat, col)
    create_cylinder(f'{name}_DoorKnob', (loc[0] + 0.45, loc[1] - depth/2 - 0.15, 0.5 + 1.1), 0.05, 0.08, get_material('Tower_Metal_Trim'), col, vertices=8)
    
    # 6. Windows
    for s in range(stories):
        w_z = 0.5 + s * story_h + 1.8
        for wx in [loc[0] - width/3, loc[0] + width/3]:
            create_box(f'{name}_WinSill_{s}_{wx:.1f}', (wx, loc[1] - depth/2 - 0.12, w_z - 0.9), (1.8, 0.3, 0.12), frame_mat, col)
            create_box(f'{name}_WinFrame_{s}_{wx:.1f}', (wx, loc[1] - depth/2 - 0.05, w_z), (1.6, 0.12, 1.6), frame_mat, col)
            create_box(f'{name}_WinGlass_{s}_{wx:.1f}', (wx, loc[1] - depth/2 - 0.08, w_z), (1.4, 0.05, 1.4), window_mat, col)
            create_box(f'{name}_WinMull_V_{s}_{wx:.1f}', (wx, loc[1] - depth/2 - 0.1, w_z), (0.08, 0.04, 1.4), frame_mat, col)
            create_box(f'{name}_WinMull_H_{s}_{wx:.1f}', (wx, loc[1] - depth/2 - 0.1, w_z), (1.4, 0.04, 0.08), frame_mat, col)

    # 7. Chimney
    chimney_x = loc[0] + width/3
    chimney_y = loc[1] + depth/4
    create_box(f'{name}_Chimney', (chimney_x, chimney_y, base_z + roof_h * 0.8), (1.2, 1.2, roof_h + 1.5), brick_mat, col)
    create_box(f'{name}_ChimneyCap', (chimney_x, chimney_y, base_z + roof_h * 0.8 + (roof_h + 1.5)/2 + 0.1), (1.5, 1.5, 0.2), get_material('Curb_Stone'), col)
    
    # 8. Front Fence & Pathway
    fence_mat = frame_mat
    fence_w = width + 4.0
    fence_front_y = loc[1] - depth/2 - porch_d - 3.0
    for side, f_x in [('L', loc[0] - fence_w/4 - 1.0), ('R', loc[0] + fence_w/4 + 1.0)]:
        create_box(f'{name}_Fence_{side}', (f_x, fence_front_y, 0.5), (fence_w/2 - 1.2, 0.1, 0.9), fence_mat, col)
    create_box(f'{name}_Path', (loc[0], (porch_center_y - porch_d/2 + fence_front_y)/2, 0.03), (1.8, abs(fence_front_y - (porch_center_y - porch_d/2)), 0.02), get_material('Curb_Stone'), col)

# =============================================================================
# 5. TRAFFIC INFRASTRUCTURE & STREET PROPS
# =============================================================================
def build_traffic_signal(name, loc, rotation_deg, collection=None):
    """Build a cantilever mast-arm traffic signal pole with illuminated lenses."""
    col = collection or bpy.context.scene.collection
    pole_mat = get_material('Metal_Poles')
    housing_mat = get_material('Traffic_Signal_Housing')
    red_mat = get_material('Signal_Red_Emissive')
    amber_mat = get_material('Signal_Amber_Emissive')
    green_mat = get_material('Signal_Green_Emissive')
    
    pole_grp = bpy.data.objects.new(name, None)
    col.objects.link(pole_grp)
    pole_grp.location = loc
    pole_grp.rotation_euler = (0, 0, math.radians(rotation_deg))
    
    # Vertical mast
    mast = create_cylinder(f'{name}_Mast', (0, 0, 3.5), 0.18, 7.0, pole_mat, col, vertices=12)
    mast.parent = pole_grp
    
    # Cantilever arm
    arm = create_cylinder(f'{name}_Arm', (3.0, 0, 6.8), 0.12, 6.0, pole_mat, col, vertices=10)
    arm.rotation_euler = (0, math.radians(90), 0)
    arm.parent = pole_grp
    
    # Overhead signal head
    head = create_box(f'{name}_Head', (4.5, 0, 6.2), (0.45, 0.45, 1.4), housing_mat, col)
    head.parent = pole_grp
    
    for lens_name, z_off, mat in [('Red', 0.42, red_mat), ('Amber', 0.0, amber_mat), ('Green', -0.42, green_mat)]:
        lens = create_cylinder(f'{name}_{lens_name}', (4.5, -0.24, 6.2 + z_off), 0.15, 0.1, mat, col, vertices=12)
        lens.rotation_euler = (math.radians(90), 0, 0)
        lens.parent = pole_grp
        visor = create_box(f'{name}_{lens_name}_Visor', (4.5, -0.28, 6.2 + z_off + 0.16), (0.34, 0.2, 0.06), housing_mat, col)
        visor.parent = pole_grp
        
    # Lower pole signal head
    head_low = create_box(f'{name}_HeadLow', (0.3, 0, 3.2), (0.35, 0.35, 1.1), housing_mat, col)
    head_low.parent = pole_grp
    for lens_name, z_off, mat in [('RedL', 0.32, red_mat), ('AmberL', 0.0, amber_mat), ('GreenL', -0.32, green_mat)]:
        lens_l = create_cylinder(f'{name}_{lens_name}', (0.3, -0.19, 3.2 + z_off), 0.12, 0.08, mat, col, vertices=12)
        lens_l.rotation_euler = (math.radians(90), 0, 0)
        lens_l.parent = pole_grp

def build_streetlight(name, loc, rotation_deg, collection=None):
    """Build a modern curved LED streetlight."""
    col = collection or bpy.context.scene.collection
    metal_mat = get_material('Metal_Poles')
    glow_mat = get_material('Street_Light_Glow')
    
    light_grp = bpy.data.objects.new(name, None)
    col.objects.link(light_grp)
    light_grp.location = loc
    light_grp.rotation_euler = (0, 0, math.radians(rotation_deg))
    
    pole = create_cylinder(f'{name}_Pole', (0, 0, 4.0), 0.14, 8.0, metal_mat, col, vertices=10)
    pole.parent = light_grp
    
    arm = create_box(f'{name}_Arm', (1.2, 0, 8.0), (2.4, 0.15, 0.15), metal_mat, col)
    arm.rotation_euler = (0, math.radians(-15), 0)
    arm.parent = light_grp
    
    fixture = create_box(f'{name}_Fixture', (2.4, 0, 8.2), (0.9, 0.4, 0.15), metal_mat, col)
    fixture.parent = light_grp
    
    emitter = create_box(f'{name}_Emitter', (2.4, 0, 8.12), (0.75, 0.3, 0.04), glow_mat, col)
    emitter.parent = light_grp

def build_bus_stop(name, loc, rotation_deg, collection=None):
    """Build a modern transit bus shelter."""
    col = collection or bpy.context.scene.collection
    metal_mat = get_material('Tower_Metal_Trim')
    glass_mat = get_material('Glass_Curtain_Blue')
    wood_mat = get_material('House_Door_Wood')
    
    shelter_grp = bpy.data.objects.new(name, None)
    col.objects.link(shelter_grp)
    shelter_grp.location = loc
    shelter_grp.rotation_euler = (0, 0, math.radians(rotation_deg))
    
    roof = create_box(f'{name}_Roof', (0, 0, 3.1), (6.0, 2.5, 0.2), metal_mat, col)
    roof.parent = shelter_grp
    
    for px in [-2.7, 2.7]:
        p = create_cylinder(f'{name}_Pillar_{px}', (px, 0.9, 1.5), 0.08, 3.0, metal_mat, col, vertices=8)
        p.parent = shelter_grp
        
    back_glass = create_box(f'{name}_BackGlass', (0, 0.9, 1.5), (5.2, 0.05, 2.6), glass_mat, col)
    back_glass.parent = shelter_grp
    
    bench_seat = create_box(f'{name}_Bench', (0, 0.3, 0.55), (3.6, 0.6, 0.08), wood_mat, col)
    bench_seat.parent = shelter_grp

def build_urban_tree(name, loc, scale=1.0, collection=None):
    """Build a stylized urban tree with planter base."""
    col = collection or bpy.context.scene.collection
    trunk_mat = get_material('Trunk_Brown')
    leaf_mat = get_material('Foliage_Green')
    curb_mat = get_material('Curb_Stone')
    
    tree_grp = bpy.data.objects.new(name, None)
    col.objects.link(tree_grp)
    tree_grp.location = loc
    tree_grp.scale = (scale, scale, scale)
    
    planter = create_box(f'{name}_Planter', (0, 0, 0.3), (2.0, 2.0, 0.6), curb_mat, col)
    planter.parent = tree_grp
    
    trunk = create_cylinder(f'{name}_Trunk', (0, 0, 2.2), 0.25, 3.6, trunk_mat, col, vertices=8)
    trunk.parent = tree_grp
    
    clusters = [
        ((0, 0, 4.2), 1.6),
        ((0.6, 0.5, 4.8), 1.2),
        ((-0.5, -0.4, 4.6), 1.3),
        ((0.2, -0.6, 5.2), 1.0)
    ]
    for idx, (c_loc, rad) in enumerate(clusters):
        leaf = create_cylinder(f'{name}_Leaves_{idx}', c_loc, rad, rad * 1.5, leaf_mat, col, vertices=10)
        leaf.parent = tree_grp

# =============================================================================
# 6. EXTERNAL CUSTOM MODEL IMPORTER & SLOTTING
# =============================================================================
def try_import_custom_model(filename, loc, rot_z_deg=0.0, target_scale=(1, 1, 1), collection=None):
    """Attempts to import an existing 3D model (.glb/.gltf/.fbx/.obj) from CUSTOM_MODELS_DIR."""
    if not os.path.exists(CUSTOM_MODELS_DIR):
        return False
        
    model_path = os.path.join(CUSTOM_MODELS_DIR, filename)
    if not os.path.isfile(model_path):
        for f in os.listdir(CUSTOM_MODELS_DIR):
            if f.lower() == filename.lower():
                model_path = os.path.join(CUSTOM_MODELS_DIR, f)
                break
                
    if not os.path.isfile(model_path):
        return False
        
    ext = os.path.splitext(model_path)[1].lower()
    col = collection or bpy.context.scene.collection
    existing_objs = set(bpy.data.objects)
    
    try:
        if ext in ['.glb', '.gltf']:
            bpy.ops.import_scene.gltf(filepath=model_path)
        elif ext == '.fbx':
            bpy.ops.import_scene.fbx(filepath=model_path)
        elif ext == '.obj':
            if hasattr(bpy.ops.wm, 'obj_import'):
                bpy.ops.wm.obj_import(filepath=model_path)
            else:
                bpy.ops.import_scene.obj(filepath=model_path)
        else:
            return False
    except Exception as e:
        print(f"[CustomModel] Failed importing {filename}: {e}")
        return False
        
    new_objs = [o for o in bpy.data.objects if o not in existing_objs]
    if not new_objs:
        return False
        
    root_name = f"Custom_{os.path.splitext(filename)[0]}"
    root_grp = bpy.data.objects.new(root_name, None)
    col.objects.link(root_grp)
    root_grp.location = loc
    root_grp.rotation_euler = (0, 0, math.radians(rot_z_deg))
    root_grp.scale = target_scale
    
    for o in new_objs:
        if o.parent is None:
            o.parent = root_grp
        for c in o.users_collection:
            c.objects.unlink(o)
        col.objects.link(o)
        
    print(f"[CustomModel] Successfully imported: {filename} at {loc}")
    return True

# =============================================================================
# 7. LIGHTING, ENVIRONMENT & CAMERAS
# =============================================================================
def setup_lighting_and_cameras(col_light):
    """Sets up daylight sun, sky fill, and scenic camera."""
    sun_data = bpy.data.lights.new(name='Sun_Light', type='SUN')
    sun_data.energy = 4.5
    sun_data.color = (1.0, 0.98, 0.94)
    sun_data.angle = math.radians(1.5)
    
    sun_obj = bpy.data.objects.new('Sun_Light', sun_data)
    sun_obj.location = (80, -100, 150)
    sun_obj.rotation_euler = (math.radians(52), math.radians(24), math.radians(-35))
    col_light.objects.link(sun_obj)
    
    fill_data = bpy.data.lights.new(name='Sky_Fill', type='SUN')
    fill_data.energy = 1.2
    fill_data.color = (0.75, 0.85, 1.0)
    fill_obj = bpy.data.objects.new('Sky_Fill', fill_data)
    fill_obj.rotation_euler = (math.radians(180), 0, 0)
    col_light.objects.link(fill_obj)
    
    cam_data = bpy.data.cameras.new('Downtown_Cam')
    cam_data.lens = 35.0
    cam_data.clip_end = 2000.0
    
    cam_obj = bpy.data.objects.new('Downtown_Cam', cam_data)
    cam_obj.location = (-120, -140, 75)
    cam_obj.rotation_euler = (math.radians(65), 0, math.radians(-42))
    col_light.objects.link(cam_obj)
    bpy.context.scene.camera = cam_obj

# =============================================================================
# 8. MASTER SCENE GENERATOR PIPELINE
# =============================================================================
def generate_full_scene():
    """Main orchestrator function."""
    print("==================================================")
    print("  Generating Dense Downtown & Mixed Urban Scene   ")
    print("==================================================")
    
    reset_scene()
    init_palette()
    
    col_roads = get_or_create_collection("01_Roads_Network")
    col_skyscrapers = get_or_create_collection("02_Commercial_Skyscrapers")
    col_midrise = get_or_create_collection("03_Midrise_Commercial")
    col_houses = get_or_create_collection("04_Residential_Houses")
    col_custom = get_or_create_collection("05_Custom_Imported_Models")
    col_traffic = get_or_create_collection("06_Traffic_Infrastructure")
    col_props = get_or_create_collection("07_Street_Props")
    col_light = get_or_create_collection("08_Lighting_Cameras")
    
    # 1. Roads, Intersections, Sidewalks
    print("[1/6] Building Roads, Intersections, and Sidewalks...")
    build_road_network(col_roads, col_props)
    
    # 2. Commercial Core: Skyscrapers at Central Junction
    print("[2/6] Building Downtown Commercial Skyscrapers...")
    generate_skyscraper('Tower_NE_Financial', (45, 45, 0), width=28, depth=26, height=115, style='curtain_wall', collection=col_skyscrapers)
    generate_skyscraper('Tower_NW_Corporate', (-45, 45, 0), width=24, depth=24, height=88, style='dark_glass', collection=col_skyscrapers)
    generate_skyscraper('Tower_SW_Tech', (-45, -45, 0), width=26, depth=28, height=96, style='curtain_wall', collection=col_skyscrapers)
    generate_skyscraper('Tower_SE_Plaza', (45, -45, 0), width=30, depth=25, height=78, style='curtain_wall', collection=col_skyscrapers)
    
    # 3. Mid-Rise Commercial & Retail Blocks
    print("[3/6] Building Mid-Rise Commercial & Storefront Blocks...")
    midrise_lots = [
        ('Midrise_East_1', (105, 30, 0), 22, 16, 4),
        ('Midrise_East_2', (145, 30, 0), 24, 16, 5),
        ('Midrise_West_1', (-105, 30, 0), 22, 16, 4),
        ('Midrise_West_2', (-145, 30, 0), 24, 16, 3),
        ('Midrise_North_1', (30, 118, 0), 16, 22, 4),
        ('Midrise_South_1', (30, -118, 0), 16, 22, 5)
    ]
    for name, loc, w, d, fl in midrise_lots:
        imported = False
        if 'East' in name:
            imported = try_import_custom_model('Big Building.glb', loc, rot_z_deg=180, target_scale=(4.0, 4.0, 4.0), collection=col_custom)
        elif 'West' in name:
            imported = try_import_custom_model('Building Red Corner.glb', loc, rot_z_deg=0, target_scale=(4.5, 4.5, 4.5), collection=col_custom)
        if not imported:
            generate_midrise_block(name, loc, w, d, floors=fl, collection=col_midrise)

    # 4. Detailed Normal Residential Houses & Neighborhood
    print("[4/6] Building Detailed Normal Houses and Neighborhood...")
    residential_lots = [
        ('House_N1', (-85, 115, 0), 12, 10, 2),
        ('House_N2', (-115, 115, 0), 11, 9, 1),
        ('House_N3', (-145, 115, 0), 13, 10, 2),
        ('House_N4', (85, 115, 0), 12, 9, 2),
        ('House_N5', (115, 115, 0), 14, 11, 2),
        ('House_N6', (145, 115, 0), 10, 9, 1),
        ('House_S1', (-85, -115, 0), 13, 10, 2),
        ('House_S2', (-115, -115, 0), 12, 10, 1),
        ('House_S3', (-145, -115, 0), 11, 9, 2),
        ('House_S4', (85, -115, 0), 13, 10, 2),
        ('House_S5', (115, -115, 0), 10, 9, 1),
        ('House_S6', (145, -115, 0), 12, 10, 2),
    ]
    custom_house_models = ['Building Green.glb', 'Brown Building.glb', 'Building Red.glb', 'Pizza Corner.glb']
    for idx, (h_name, h_loc, hw, hd, h_st) in enumerate(residential_lots):
        custom_candidate = custom_house_models[idx % len(custom_house_models)]
        rot = 0 if h_loc[1] > 0 else 180
        imported = try_import_custom_model(custom_candidate, h_loc, rot_z_deg=rot, target_scale=(4.0, 4.0, 4.0), collection=col_custom)
        if not imported:
            generate_residential_house(h_name, h_loc, width=hw, depth=hd, stories=h_st, collection=col_houses)

    # 5. Traffic Signals, Streetlights, Bus Stops, Trees
    print("[5/6] Building Traffic Signals, Streetlights, and Props...")
    build_traffic_signal('Signal_NE', (13.5, 13.5, 0.2), rotation_deg=-90, collection=col_traffic)
    build_traffic_signal('Signal_NW', (-13.5, 13.5, 0.2), rotation_deg=0, collection=col_traffic)
    build_traffic_signal('Signal_SW', (-13.5, -13.5, 0.2), rotation_deg=90, collection=col_traffic)
    build_traffic_signal('Signal_SE', (13.5, -13.5, 0.2), rotation_deg=180, collection=col_traffic)
    
    for lx in [-160, -110, -60, 60, 110, 160]:
        build_streetlight(f'Streetlight_N_{lx}', (lx, 13.5, 0.2), rotation_deg=0, collection=col_traffic)
        build_streetlight(f'Streetlight_S_{lx}', (lx, -13.5, 0.2), rotation_deg=180, collection=col_traffic)
    for ly in [-160, -110, -60, 60, 110, 160]:
        build_streetlight(f'Streetlight_E_{ly}', (13.5, ly, 0.2), rotation_deg=-90, collection=col_traffic)
        build_streetlight(f'Streetlight_W_{ly}', (-13.5, ly, 0.2), rotation_deg=90, collection=col_traffic)

    build_bus_stop('BusStop_East', (75, 14.5, 0.2), rotation_deg=0, collection=col_props)
    build_bus_stop('BusStop_West', (-75, -14.5, 0.2), rotation_deg=180, collection=col_props)
    
    for tx in [-140, -120, -90, -70, 70, 90, 120, 140]:
        build_urban_tree(f'Tree_N_{tx}', (tx, 15.0, 0.2), scale=random.uniform(0.85, 1.15), collection=col_props)
        build_urban_tree(f'Tree_S_{tx}', (tx, -15.0, 0.2), scale=random.uniform(0.85, 1.15), collection=col_props)

    # 6. Lighting & Cameras
    print("[6/6] Setting up Sunlight, Environment, and Cameras...")
    setup_lighting_and_cameras(col_light)
    
    # Save .blend
    print(f"[Save] Saving Blender scene to: {BLEND_OUTPUT_PATH}")
    bpy.ops.wm.save_as_mainfile(filepath=BLEND_OUTPUT_PATH)
    
    # Export glTF/GLB
    print(f"[Export] Exporting glTF/GLB to: {GLB_OUTPUT_PATH}")
    try:
        bpy.ops.export_scene.gltf(
            filepath=GLB_OUTPUT_PATH,
            export_format='GLB',
            use_selection=False,
            export_apply=True,
            export_yup=True,
            export_materials='EXPORT',
            export_colors=True
        )
        print("[Export] glTF/GLB export SUCCESSFUL!")
    except Exception as e:
        print(f"[Export Warning] glTF exporter error: {e}")

    print("==================================================")
    print("  Scene Map Generation Completed Successfully!    ")
    print(f"  Blend: {BLEND_OUTPUT_PATH}")
    print(f"  GLB:   {GLB_OUTPUT_PATH}")
    print("==================================================")

if __name__ == '__main__':
    generate_full_scene()
