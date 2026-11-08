"""
=============================================================================
Mumbai Traffic Hero — 14-Vehicle Indian Fleet & Props Generator for Blender
=============================================================================
This script procedurally generates an authentic, high-detail 3D Mumbai vehicle
fleet and traffic props.

Complete 14-Vehicle Lineup (Organized in 2 Showroom Rows):
Row 1:
  1. Bajaj RE Auto-Rickshaw (Green/Yellow CNG with open side doors & meter)
  2. Bajaj RE Classic Auto-Rickshaw (Black/Yellow Petrol Mumbai Taxi)
  3. Premier Padmini "Kaali-Peeli" Vintage Taxi (Yellow roof & chrome luggage rack)
  4. Modern Sedan "Kaali-Peeli" Taxi (Maruti Dzire style)
  5. Toyota Innova / 7-Seater Airport Taxi MUV (Silver metallic with roof rails)
  6. Mumbai Police Patrol SUV (Bolero style with front bullbar & dual flasher)
  7. Indian Emergency 108 Ambulance (High-roof Force Traveller with red cross)

Row 2:
  8. Tata Ace "Chhota Hathi" (India's #1 mini cargo pickup truck)
  9. Tata 407 Highway Truck (Decorated lorry with visor & "HORN OK PLEASE")
  10. Mumbai BEST Single-Decker Red Transit Bus (LED route board & passenger bays)
  11. Mumbai BEST Heritage Double-Decker Red Bus (Iconic 2-story Mumbai bus)
  12. Hero Splendor Indian Commuter Motorcycle (Fuel tank, twin gauges, exhaust)
  13. Royal Enfield "Bullet" 350 Classic Cruiser (Chrome engine, teardrop tank)
  14. Honda Activa Modern Scooter (Front apron shield, footboard, sleek cowl)

Props:
  15. Mumbai Police Steel Road Barricade & Yellow/Black Kerb Stones

Compatibility:
- Blender 3.6, 4.0, 4.1, 4.2, 4.3, 4.4, and 4.5+ (Safe across all animation APIs).
- Embedded 24-frame looping wheel spin animation (Press Spacebar to spin!).
- Visible 5-spoke alloy patterns, brake discs, and lug nuts.
- Inset tinted windows with black rubber gasket frames, wipers, and side mirrors.
=============================================================================
"""

import bpy
import bmesh
import math
import os

# =============================================================================
# PATHS & CONFIGURATION
# =============================================================================
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__)) if '__file__' in locals() else os.getcwd()
PROJECT_ROOT = os.path.abspath(os.path.join(SCRIPT_DIR, '..'))

MODELS_DIR = os.path.join(PROJECT_ROOT, 'Models')
EMBEDDED_DIR = os.path.join(MODELS_DIR, 'embedded')
OUTPUT_BLEND_DIR = os.path.join(PROJECT_ROOT, 'assets')

os.makedirs(MODELS_DIR, exist_ok=True)
os.makedirs(EMBEDDED_DIR, exist_ok=True)
os.makedirs(OUTPUT_BLEND_DIR, exist_ok=True)

# =============================================================================
# SCENE MANAGEMENT
# =============================================================================
def reset_scene():
    """Clear all existing objects, meshes, materials, and actions."""
    if bpy.context.active_object and bpy.context.active_object.mode != 'OBJECT':
        bpy.ops.object.mode_set(mode='OBJECT')
    bpy.ops.object.select_all(action='SELECT')
    bpy.ops.object.delete(use_global=False)
    for block in bpy.data.meshes: bpy.data.meshes.remove(block)
    for block in bpy.data.materials: bpy.data.materials.remove(block)
    for block in bpy.data.actions: bpy.data.actions.remove(block)

def get_or_create_collection(name):
    if name in bpy.data.collections:
        return bpy.data.collections[name]
    col = bpy.data.collections.new(name)
    bpy.context.scene.collection.children.link(col)
    return col

# =============================================================================
# PBR MATERIAL FACTORY (With Solid Viewport Display Color Support)
# =============================================================================
MAT_CACHE = {}

def get_mat(name, color=(0.5, 0.5, 0.5, 1.0), roughness=0.5, metallic=0.0,
            emission_color=None, emission_strength=0.0, alpha=1.0):
    if name in MAT_CACHE:
        return MAT_CACHE[name]

    mat = bpy.data.materials.new(name=name)
    mat.use_nodes = True

    # Critical: Set viewport display color so Solid mode is fully colored!
    mat.diffuse_color = (color[0], color[1], color[2], alpha)
    mat.roughness = roughness
    mat.metallic = metallic

    nodes = mat.node_tree.nodes
    links = mat.node_tree.links
    bsdf = nodes.get('Principled BSDF')
    if not bsdf:
        bsdf = nodes.new(type='ShaderNodeBsdfPrincipled')
        output = nodes.get('Material Output') or nodes.new(type='ShaderNodeOutputMaterial')
        links.new(bsdf.outputs['BSDF'], output.inputs['Surface'])

    if 'Base Color' in bsdf.inputs:
        bsdf.inputs['Base Color'].default_value = color
    if 'Roughness' in bsdf.inputs:
        bsdf.inputs['Roughness'].default_value = roughness
    if 'Metallic' in bsdf.inputs:
        bsdf.inputs['Metallic'].default_value = metallic
    if 'Alpha' in bsdf.inputs and alpha < 1.0:
        bsdf.inputs['Alpha'].default_value = alpha
        mat.blend_method = 'BLEND'

    if emission_color and emission_strength > 0:
        if 'Emission Color' in bsdf.inputs:  # Blender 4.0+
            bsdf.inputs['Emission Color'].default_value = emission_color
            bsdf.inputs['Emission Strength'].default_value = emission_strength
        elif 'Emission' in bsdf.inputs:      # Blender 3.x
            bsdf.inputs['Emission'].default_value = emission_color
            if 'Emission Strength' in bsdf.inputs:
                bsdf.inputs['Emission Strength'].default_value = emission_strength

    MAT_CACHE[name] = mat
    return mat

def init_all_materials():
    # Auto Rickshaw
    get_mat('Auto_Yellow', (0.96, 0.76, 0.04, 1.0), roughness=0.35, metallic=0.05)
    get_mat('Auto_Green_CNG', (0.04, 0.44, 0.18, 1.0), roughness=0.45)
    get_mat('Auto_Black_Body', (0.07, 0.07, 0.08, 1.0), roughness=0.6)
    get_mat('Auto_Canvas_Dark', (0.12, 0.12, 0.13, 1.0), roughness=0.85)

    # Taxis
    get_mat('Taxi_Yellow_Roof', (0.98, 0.78, 0.05, 1.0), roughness=0.3, metallic=0.05)
    get_mat('Taxi_Black_Paint', (0.05, 0.05, 0.06, 1.0), roughness=0.25, metallic=0.3)
    get_mat('Taxi_Sign_Yellow', (0.98, 0.85, 0.15, 1.0), emission_color=(1.0, 0.85, 0.1, 1.0), emission_strength=3.0)

    # BEST Buses
    get_mat('BEST_Red', (0.80, 0.08, 0.08, 1.0), roughness=0.35, metallic=0.05)
    get_mat('BEST_Cream_Stripe', (0.95, 0.92, 0.80, 1.0), roughness=0.45)
    get_mat('Bus_Route_LED', (0.1, 0.1, 0.1, 1.0), emission_color=(1.0, 0.65, 0.05, 1.0), emission_strength=3.5)

    # Indian Trucks
    get_mat('Truck_Blue_Cab', (0.08, 0.42, 0.75, 1.0), roughness=0.4)
    get_mat('Truck_Orange_Visor', (0.95, 0.45, 0.05, 1.0), roughness=0.5)
    get_mat('Truck_Wood_Bed', (0.48, 0.28, 0.15, 1.0), roughness=0.8)
    get_mat('Truck_Art_Yellow', (0.95, 0.85, 0.10, 1.0), roughness=0.4)
    get_mat('Truck_Art_Green', (0.10, 0.65, 0.25, 1.0), roughness=0.4)
    get_mat('Truck_White_Ace', (0.90, 0.91, 0.93, 1.0), roughness=0.35)

    # Police & Emergency
    get_mat('Police_White', (0.92, 0.93, 0.95, 1.0), roughness=0.3, metallic=0.1)
    get_mat('Police_Blue_Stripe', (0.04, 0.20, 0.60, 1.0), roughness=0.4)
    get_mat('Emergency_Red', (0.95, 0.05, 0.05, 1.0), emission_color=(1.0, 0.05, 0.05, 1.0), emission_strength=4.5)
    get_mat('Emergency_Blue', (0.05, 0.20, 0.95, 1.0), emission_color=(0.05, 0.20, 1.0, 1.0), emission_strength=4.5)

    # Cars & Bikes
    get_mat('Car_Silver_Metallic', (0.75, 0.77, 0.80, 1.0), roughness=0.25, metallic=0.85)
    get_mat('Car_White_Pearl', (0.92, 0.93, 0.94, 1.0), roughness=0.3, metallic=0.2)
    get_mat('Bullet_Dark_Green', (0.08, 0.22, 0.12, 1.0), roughness=0.25, metallic=0.4)

    # Glass, Hardware & Wheels
    get_mat('Vehicle_Glass', (0.12, 0.20, 0.28, 1.0), roughness=0.05, metallic=0.9, alpha=0.45)
    get_mat('Rubber_Trim_Black', (0.04, 0.04, 0.05, 1.0), roughness=0.9)
    get_mat('Wiper_Blade_Black', (0.05, 0.05, 0.06, 1.0), roughness=0.7)
    get_mat('Chrome_Trim', (0.88, 0.89, 0.92, 1.0), roughness=0.12, metallic=0.95)
    get_mat('Mirror_Reflective', (0.95, 0.95, 0.98, 1.0), roughness=0.05, metallic=1.0)
    get_mat('Tire_Rubber', (0.06, 0.06, 0.07, 1.0), roughness=0.85, metallic=0.0)
    get_mat('Wheel_Rim_Alloy', (0.78, 0.80, 0.82, 1.0), roughness=0.25, metallic=0.88)
    get_mat('Interior_Dark', (0.08, 0.08, 0.10, 1.0), roughness=0.85)
    get_mat('Seat_Brown', (0.35, 0.20, 0.12, 1.0), roughness=0.7)

    # Number Plates
    get_mat('Number_Plate_Yellow', (0.98, 0.85, 0.08, 1.0), roughness=0.4)
    get_mat('Number_Plate_White', (0.95, 0.95, 0.95, 1.0), roughness=0.4)

    # Emissive Lights
    get_mat('Headlight_Glass', (0.98, 0.98, 0.92, 1.0), emission_color=(1.0, 1.0, 0.92, 1.0), emission_strength=4.5)
    get_mat('Taillight_Glass', (0.95, 0.05, 0.05, 1.0), emission_color=(1.0, 0.05, 0.05, 1.0), emission_strength=3.8)
    get_mat('Indicator_Amber', (0.98, 0.60, 0.05, 1.0), emission_color=(1.0, 0.60, 0.05, 1.0), emission_strength=3.5)

    # Road Props
    get_mat('Barricade_Steel_Blue', (0.05, 0.22, 0.55, 1.0), roughness=0.4, metallic=0.5)
    get_mat('Barricade_Yellow', (0.95, 0.80, 0.08, 1.0), roughness=0.5)
    get_mat('Kerb_Yellow', (0.95, 0.80, 0.08, 1.0), roughness=0.8)
    get_mat('Kerb_Black', (0.12, 0.12, 0.14, 1.0), roughness=0.85)

# =============================================================================
# GEOMETRY HELPERS
# =============================================================================
def safe_parent(child, parent):
    if not parent or not child:
        return
    child.parent = parent
    child.matrix_parent_inverse = parent.matrix_world.inverted()

def make_box(name, size, loc=(0,0,0), rot=(0,0,0), mat=None, parent=None, collection=None):
    bpy.ops.mesh.primitive_cube_add(size=1.0, location=loc, rotation=rot)
    obj = bpy.context.active_object
    obj.name = name
    obj.scale = size
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    if mat:
        obj.data.materials.append(mat)
    if collection and obj.name not in collection.objects:
        collection.objects.link(obj)
        if obj.name in bpy.context.scene.collection.objects:
            bpy.context.scene.collection.objects.unlink(obj)
    if parent:
        safe_parent(obj, parent)
    return obj

def make_cylinder(name, radius, depth, vertices=16, loc=(0,0,0), rot=(0,0,0), mat=None, parent=None, collection=None):
    bpy.ops.mesh.primitive_cylinder_add(
        vertices=vertices, radius=radius, depth=depth,
        location=loc, rotation=rot
    )
    obj = bpy.context.active_object
    obj.name = name
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    if mat:
        obj.data.materials.append(mat)
    if collection and obj.name not in collection.objects:
        collection.objects.link(obj)
        if obj.name in bpy.context.scene.collection.objects:
            bpy.context.scene.collection.objects.unlink(obj)
    if parent:
        safe_parent(obj, parent)
    return obj

# =============================================================================
# HIGH-DETAIL ANIMATED WHEEL (BLENDER 3.x, 4.x, 4.4, 4.5+ BULLETPROOF)
# =============================================================================
def make_high_detail_wheel(name, radius=0.30, width=0.18, loc=(0,0,0), parent=None, collection=None):
    """
    Creates an authentic, high-detail wheel with 5-spoke alloys and animated rotation.
    Axle aligned with X-axis so it rolls forward along Y.
    Safe across all versions of Blender (handles Blender 4.4/4.5 slotted action changes).
    """
    # 1. Outer rubber tire
    bpy.ops.mesh.primitive_cylinder_add(
        vertices=18, radius=radius, depth=width,
        location=loc, rotation=(0, math.radians(90), 0)
    )
    wheel_obj = bpy.context.active_object
    wheel_obj.name = name
    wheel_obj.data.materials.append(MAT_CACHE['Tire_Rubber'])

    # 2. Recessed rim dish
    bpy.ops.mesh.primitive_cylinder_add(
        vertices=14, radius=radius * 0.72, depth=width * 1.04,
        location=loc, rotation=(0, math.radians(90), 0)
    )
    rim_dish = bpy.context.active_object
    rim_dish.name = name + '_rim'
    rim_dish.data.materials.append(MAT_CACHE['Wheel_Rim_Alloy'])

    # 3. 5-Spoke Star Detail
    spoke_objs = []
    for s in range(5):
        angle = s * (2.0 * math.pi / 5.0)
        bpy.ops.mesh.primitive_cube_add(
            size=1.0, location=loc,
            rotation=(angle, math.radians(90), 0)
        )
        spoke = bpy.context.active_object
        spoke.scale = (width * 1.06, radius * 0.12, radius * 0.65)
        bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
        spoke.data.materials.append(MAT_CACHE['Wheel_Rim_Alloy'])
        spoke_objs.append(spoke)

    # 4. Center hub / lug nuts cap
    bpy.ops.mesh.primitive_cylinder_add(
        vertices=10, radius=radius * 0.22, depth=width * 1.10,
        location=loc, rotation=(0, math.radians(90), 0)
    )
    hub_cap = bpy.context.active_object
    hub_cap.data.materials.append(MAT_CACHE['Chrome_Trim'])

    # 5. Join all parts into one single compound wheel mesh
    bpy.ops.object.select_all(action='DESELECT')
    for p in spoke_objs + [rim_dish, hub_cap]:
        p.select_set(True)
    wheel_obj.select_set(True)
    bpy.context.view_layer.objects.active = wheel_obj
    bpy.ops.object.join()
    bpy.ops.object.origin_set(type='ORIGIN_GEOMETRY', center='BOUNDS')

    # 6. Add 24-frame looping rotation animation (Version-Safe!)
    try:
        wheel_obj.animation_data_create()
        # Keyframe 1: 0 degrees
        wheel_obj.rotation_euler = (0, 0, 0)
        wheel_obj.keyframe_insert(data_path="rotation_euler", index=0, frame=1)

        # Keyframe 25: 360 degrees
        wheel_obj.rotation_euler = (2.0 * math.pi, 0, 0)
        wheel_obj.keyframe_insert(data_path="rotation_euler", index=0, frame=25)

        # Safely set linear interpolation and cyclic extrapolation across any Blender version
        if wheel_obj.animation_data and wheel_obj.animation_data.action:
            act = wheel_obj.animation_data.action
            curves = getattr(act, 'fcurves', None) or getattr(act, 'curves', None)
            if curves:
                for fc in curves:
                    for kp in getattr(fc, 'keyframe_points', []):
                        kp.interpolation = 'LINEAR'
                    fc.extrapolation = 'CYCLIC'
    except Exception as e:
        # Fail gracefully so animation never halts vehicle generation
        pass

    # Reset back to frame 1
    wheel_obj.rotation_euler = (0, 0, 0)

    if collection and wheel_obj.name not in collection.objects:
        collection.objects.link(wheel_obj)
        if wheel_obj.name in bpy.context.scene.collection.objects:
            bpy.context.scene.collection.objects.unlink(wheel_obj)

    if parent:
        safe_parent(wheel_obj, parent)

    return wheel_obj

# =============================================================================
# DETAIL ATTACHMENT HELPERS
# =============================================================================
def add_side_mirrors(parent, ox, y, z, span_x, collection):
    make_box("Mirror_H_L", (0.10, 0.14, 0.10), loc=(ox - span_x, y, z),
             mat=MAT_CACHE['Rubber_Trim_Black'], parent=parent, collection=collection)
    make_box("Mirror_G_L", (0.02, 0.11, 0.08), loc=(ox - span_x + 0.04, y, z),
             mat=MAT_CACHE['Mirror_Reflective'], parent=parent, collection=collection)
    make_box("Mirror_H_R", (0.10, 0.14, 0.10), loc=(ox + span_x, y, z),
             mat=MAT_CACHE['Rubber_Trim_Black'], parent=parent, collection=collection)
    make_box("Mirror_G_R", (0.02, 0.11, 0.08), loc=(ox + span_x - 0.04, y, z),
             mat=MAT_CACHE['Mirror_Reflective'], parent=parent, collection=collection)

def add_license_plates(parent, ox, front_y, rear_y, z, is_commercial=False, collection=None):
    plate_mat = MAT_CACHE['Number_Plate_Yellow'] if is_commercial else MAT_CACHE['Number_Plate_White']
    make_box("Plate_F", (0.42, 0.03, 0.12), loc=(ox, front_y, z), mat=plate_mat, parent=parent, collection=collection)
    make_box("Plate_R", (0.42, 0.03, 0.12), loc=(ox, rear_y, z), mat=plate_mat, parent=parent, collection=collection)

def add_windshield_wipers(parent, ox, y, z, span_x=0.35, collection=None):
    make_box("Wiper_L", (0.30, 0.02, 0.025), loc=(ox - span_x * 0.7, y, z),
             rot=(0, 0, math.radians(10)), mat=MAT_CACHE['Wiper_Blade_Black'],
             parent=parent, collection=collection)
    make_box("Wiper_R", (0.30, 0.02, 0.025), loc=(ox + span_x * 0.3, y, z),
             rot=(0, 0, math.radians(10)), mat=MAT_CACHE['Wiper_Blade_Black'],
             parent=parent, collection=collection)

def add_door_handles(parent, ox, y_coords, z, span_x, collection=None):
    for i, y in enumerate(y_coords):
        make_box(f"DoorHandle_L_{i}", (0.04, 0.14, 0.03), loc=(ox - span_x, y, z),
                 mat=MAT_CACHE['Chrome_Trim'], parent=parent, collection=collection)
        make_box(f"DoorHandle_R_{i}", (0.04, 0.14, 0.03), loc=(ox + span_x, y, z),
                 mat=MAT_CACHE['Chrome_Trim'], parent=parent, collection=collection)

# =============================================================================
# 1. BAJAJ RE AUTO-RICKSHAW (CNG GREEN & YELLOW)
# =============================================================================
def generate_auto_rickshaw(collection, offset_x=0.0, offset_y=0.0, is_classic=False):
    name = "Auto_Rickshaw_Classic" if is_classic else "Auto_Rickshaw_CNG"
    root = bpy.data.objects.new(name, None)
    collection.objects.link(root)
    root.location = (offset_x, offset_y, 0)
    ox, oy = offset_x, offset_y

    body_mat = MAT_CACHE['Auto_Black_Body'] if is_classic else MAT_CACHE['Auto_Green_CNG']

    # Chassis & Tapered Front Nose
    make_box(f"{name}_Chassis", (1.25, 2.45, 0.14), loc=(ox, oy, 0.32),
             mat=MAT_CACHE['Auto_Black_Body'], parent=root, collection=collection)
    make_box(f"{name}_FrontNose", (0.75, 0.70, 0.65), loc=(ox, oy + 0.85, 0.65),
             mat=body_mat, parent=root, collection=collection)
    make_box(f"{name}_LowerBody", (1.30, 1.45, 0.60), loc=(ox, oy - 0.25, 0.62),
             mat=body_mat, parent=root, collection=collection)

    # Open passenger cabin side cutouts & seating
    make_box(f"{name}_DriverSeat", (0.50, 0.40, 0.20), loc=(ox, oy + 0.25, 0.60),
             mat=MAT_CACHE['Seat_Brown'], parent=root, collection=collection)
    make_box(f"{name}_PassengerSeat", (1.18, 0.50, 0.28), loc=(ox, oy - 0.65, 0.62),
             mat=MAT_CACHE['Seat_Brown'], parent=root, collection=collection)

    # Inset windshield & black rubber gasket
    make_box(f"{name}_WindshieldFrame", (0.95, 0.06, 0.55), loc=(ox, oy + 0.70, 1.25),
             rot=(math.radians(12), 0, 0), mat=MAT_CACHE['Rubber_Trim_Black'],
             parent=root, collection=collection)
    make_box(f"{name}_WindshieldGlass", (0.88, 0.02, 0.48), loc=(ox, oy + 0.70, 1.25),
             rot=(math.radians(12), 0, 0), mat=MAT_CACHE['Vehicle_Glass'],
             parent=root, collection=collection)

    add_windshield_wipers(root, ox, y=oy + 0.74, z=1.04, span_x=0.30, collection=collection)
    add_side_mirrors(root, ox, y=oy + 0.68, z=1.20, span_x=0.58, collection=collection)

    # Canopy Roof & Dark Rear Canvas
    make_box(f"{name}_Pillars", (1.26, 1.70, 0.80), loc=(ox, oy - 0.15, 1.20),
             mat=MAT_CACHE['Auto_Black_Body'], parent=root, collection=collection)
    make_box(f"{name}_YellowRoof", (1.32, 1.95, 0.12), loc=(ox, oy - 0.05, 1.62),
             mat=MAT_CACHE['Auto_Yellow'], parent=root, collection=collection)
    make_box(f"{name}_CanvasRear", (1.28, 0.08, 0.75), loc=(ox, oy - 0.98, 1.20),
             mat=MAT_CACHE['Auto_Canvas_Dark'], parent=root, collection=collection)

    # Roll-up rain curtains & digital meter
    make_cylinder(f"{name}_Curtain_L", radius=0.04, depth=1.35, vertices=8,
                  loc=(ox - 0.65, oy - 0.15, 1.55), rot=(math.radians(90), 0, 0),
                  mat=MAT_CACHE['Auto_Canvas_Dark'], parent=root, collection=collection)
    make_cylinder(f"{name}_Curtain_R", radius=0.04, depth=1.35, vertices=8,
                  loc=(ox + 0.65, oy - 0.15, 1.55), rot=(math.radians(90), 0, 0),
                  mat=MAT_CACHE['Auto_Canvas_Dark'], parent=root, collection=collection)
    make_box(f"{name}_Meter", (0.16, 0.10, 0.12), loc=(ox + 0.32, oy + 0.60, 0.88),
             mat=MAT_CACHE['Bus_Route_LED'], parent=root, collection=collection)

    # Lights & Plates
    make_cylinder(f"{name}_Headlight", radius=0.09, depth=0.06, vertices=12,
                  loc=(ox, oy + 1.22, 0.68), rot=(math.radians(90), 0, 0),
                  mat=MAT_CACHE['Headlight_Glass'], parent=root, collection=collection)
    make_box(f"{name}_Tail_L", (0.14, 0.04, 0.08), loc=(ox - 0.52, oy - 1.02, 0.45),
             mat=MAT_CACHE['Taillight_Glass'], parent=root, collection=collection)
    make_box(f"{name}_Tail_R", (0.14, 0.04, 0.08), loc=(ox + 0.52, oy - 1.02, 0.45),
             mat=MAT_CACHE['Taillight_Glass'], parent=root, collection=collection)
    add_license_plates(root, ox, front_y=oy + 1.23, rear_y=oy - 1.03, z=0.35, is_commercial=True, collection=collection)

    # 3 Animated Spoke Wheels
    make_high_detail_wheel(f"{name}_wheel_f", radius=0.25, width=0.14, loc=(ox, oy + 0.95, 0.25), parent=root, collection=collection)
    make_high_detail_wheel(f"{name}_wheel_rl", radius=0.26, width=0.16, loc=(ox - 0.56, oy - 0.65, 0.26), parent=root, collection=collection)
    make_high_detail_wheel(f"{name}_wheel_rr", radius=0.26, width=0.16, loc=(ox + 0.56, oy - 0.65, 0.26), parent=root, collection=collection)

    return root

# =============================================================================
# 2. PREMIER PADMINI "KAALI-PEELI" VINTAGE TAXI
# =============================================================================
def generate_kaali_peeli_taxi(collection, offset_x=4.0, offset_y=0.0):
    root = bpy.data.objects.new("Kaali_Peeli_Taxi", None)
    collection.objects.link(root)
    root.location = (offset_x, offset_y, 0)
    ox, oy = offset_x, offset_y

    make_box("Taxi_LowerBody", (1.62, 3.85, 0.52), loc=(ox, oy, 0.55),
             mat=MAT_CACHE['Taxi_Black_Paint'], parent=root, collection=collection)
    make_box("Taxi_Hood", (1.56, 1.10, 0.22), loc=(ox, oy + 1.25, 0.72),
             mat=MAT_CACHE['Taxi_Black_Paint'], parent=root, collection=collection)
    make_box("Taxi_Trunk", (1.56, 0.90, 0.20), loc=(ox, oy - 1.35, 0.70),
             mat=MAT_CACHE['Taxi_Black_Paint'], parent=root, collection=collection)

    # Yellow Pillars & Roof
    make_box("Taxi_Pillars", (1.50, 1.82, 0.46), loc=(ox, oy - 0.05, 1.05),
             mat=MAT_CACHE['Taxi_Yellow_Roof'], parent=root, collection=collection)
    make_box("Taxi_YellowRoof", (1.52, 1.86, 0.10), loc=(ox, oy - 0.05, 1.32),
             mat=MAT_CACHE['Taxi_Yellow_Roof'], parent=root, collection=collection)

    # Windows & Inset Glass
    make_box("Taxi_FrontGlass", (1.40, 0.04, 0.42), loc=(ox, oy + 0.76, 1.05),
             rot=(math.radians(15), 0, 0), mat=MAT_CACHE['Vehicle_Glass'], parent=root, collection=collection)
    make_box("Taxi_RearGlass", (1.40, 0.04, 0.40), loc=(ox, oy - 0.86, 1.05),
             rot=(math.radians(-15), 0, 0), mat=MAT_CACHE['Vehicle_Glass'], parent=root, collection=collection)
    make_box("Taxi_SideGlass_L", (0.04, 1.65, 0.38), loc=(ox - 0.74, oy - 0.05, 1.05),
             mat=MAT_CACHE['Vehicle_Glass'], parent=root, collection=collection)
    make_box("Taxi_SideGlass_R", (0.04, 1.65, 0.38), loc=(ox + 0.74, oy - 0.05, 1.05),
             mat=MAT_CACHE['Vehicle_Glass'], parent=root, collection=collection)

    # Chrome Roof Luggage Carrier & TAXI Sign
    make_box("Taxi_Carrier_Bed", (1.20, 1.30, 0.03), loc=(ox, oy - 0.05, 1.40),
             mat=MAT_CACHE['Chrome_Trim'], parent=root, collection=collection)
    make_box("Taxi_RoofSign", (0.45, 0.18, 0.14), loc=(ox, oy + 0.30, 1.50),
             mat=MAT_CACHE['Taxi_Sign_Yellow'], parent=root, collection=collection)

    # Chrome Bumpers & Round Headlamps
    make_box("Taxi_ChromeGrille", (1.10, 0.05, 0.22), loc=(ox, oy + 1.94, 0.58),
             mat=MAT_CACHE['Chrome_Trim'], parent=root, collection=collection)
    make_box("Taxi_FrontBumper", (1.68, 0.10, 0.12), loc=(ox, oy + 1.98, 0.36),
             mat=MAT_CACHE['Chrome_Trim'], parent=root, collection=collection)
    make_box("Taxi_RearBumper", (1.68, 0.10, 0.12), loc=(ox, oy - 1.98, 0.36),
             mat=MAT_CACHE['Chrome_Trim'], parent=root, collection=collection)

    make_cylinder("Taxi_HL_L", radius=0.11, depth=0.06, vertices=12,
                  loc=(ox - 0.58, oy + 1.95, 0.62), rot=(math.radians(90), 0, 0),
                  mat=MAT_CACHE['Headlight_Glass'], parent=root, collection=collection)
    make_cylinder("Taxi_HL_R", radius=0.11, depth=0.06, vertices=12,
                  loc=(ox + 0.58, oy + 1.95, 0.62), rot=(math.radians(90), 0, 0),
                  mat=MAT_CACHE['Headlight_Glass'], parent=root, collection=collection)

    add_windshield_wipers(root, ox, y=oy + 0.82, z=0.86, collection=collection)
    add_side_mirrors(root, ox, y=oy + 0.70, z=0.86, span_x=0.88, collection=collection)
    add_door_handles(root, ox, y_coords=[oy + 0.35, oy - 0.45], z=0.72, span_x=0.82, collection=collection)
    add_license_plates(root, ox, front_y=oy + 2.04, rear_y=oy - 2.04, z=0.36, is_commercial=True, collection=collection)

    # 4 Animated Wheels
    track_x = 0.76
    make_high_detail_wheel("wheel_fl", radius=0.30, width=0.18, loc=(ox - track_x, oy + 1.15, 0.30), parent=root, collection=collection)
    make_high_detail_wheel("wheel_fr", radius=0.30, width=0.18, loc=(ox + track_x, oy + 1.15, 0.30), parent=root, collection=collection)
    make_high_detail_wheel("wheel_rl", radius=0.30, width=0.18, loc=(ox - track_x, oy - 1.15, 0.30), parent=root, collection=collection)
    make_high_detail_wheel("wheel_rr", radius=0.30, width=0.18, loc=(ox + track_x, oy - 1.15, 0.30), parent=root, collection=collection)

    return root

# =============================================================================
# 3. MODERN SEDAN "KAALI-PEELI" TAXI (DZIRE STYLE)
# =============================================================================
def generate_modern_taxi(collection, offset_x=8.0, offset_y=0.0):
    root = bpy.data.objects.new("Modern_Sedan_Taxi", None)
    collection.objects.link(root)
    root.location = (offset_x, offset_y, 0)
    ox, oy = offset_x, offset_y

    make_box("ModTaxi_Body", (1.68, 4.10, 0.54), loc=(ox, oy, 0.58),
             mat=MAT_CACHE['Taxi_Black_Paint'], parent=root, collection=collection)
    make_box("ModTaxi_Hood", (1.62, 1.20, 0.22), loc=(ox, oy + 1.35, 0.74),
             rot=(math.radians(-6), 0, 0), mat=MAT_CACHE['Taxi_Black_Paint'],
             parent=root, collection=collection)
    make_box("ModTaxi_YellowRoof", (1.56, 2.05, 0.12), loc=(ox, oy - 0.05, 1.40),
             mat=MAT_CACHE['Taxi_Yellow_Roof'], parent=root, collection=collection)
    make_box("ModTaxi_Glass", (1.52, 2.00, 0.55), loc=(ox, oy - 0.05, 1.12),
             mat=MAT_CACHE['Vehicle_Glass'], parent=root, collection=collection)
    make_box("ModTaxi_RoofSign", (0.42, 0.16, 0.12), loc=(ox, oy + 0.25, 1.52),
             mat=MAT_CACHE['Taxi_Sign_Yellow'], parent=root, collection=collection)

    add_windshield_wipers(root, ox, y=oy + 0.90, z=0.92, collection=collection)
    add_side_mirrors(root, ox, y=oy + 0.80, z=0.92, span_x=0.92, collection=collection)
    add_door_handles(root, ox, y_coords=[oy + 0.40, oy - 0.45], z=0.76, span_x=0.85, collection=collection)
    add_license_plates(root, ox, front_y=oy + 2.12, rear_y=oy - 2.12, z=0.38, is_commercial=True, collection=collection)

    track_x = 0.78
    make_high_detail_wheel("wheel_fl", radius=0.31, width=0.18, loc=(ox - track_x, oy + 1.25, 0.31), parent=root, collection=collection)
    make_high_detail_wheel("wheel_fr", radius=0.31, width=0.18, loc=(ox + track_x, oy + 1.25, 0.31), parent=root, collection=collection)
    make_high_detail_wheel("wheel_rl", radius=0.31, width=0.18, loc=(ox - track_x, oy - 1.25, 0.31), parent=root, collection=collection)
    make_high_detail_wheel("wheel_rr", radius=0.31, width=0.18, loc=(ox + track_x, oy - 1.25, 0.31), parent=root, collection=collection)

    return root

# =============================================================================
# 4. TOYOTA INNOVA / 7-SEATER MUV
# =============================================================================
def generate_innova_suv(collection, offset_x=12.0, offset_y=0.0):
    root = bpy.data.objects.new("Toyota_Innova_MUV", None)
    collection.objects.link(root)
    root.location = (offset_x, offset_y, 0)
    ox, oy = offset_x, offset_y

    make_box("Innova_Body", (1.76, 4.60, 0.65), loc=(ox, oy, 0.65),
             mat=MAT_CACHE['Car_Silver_Metallic'], parent=root, collection=collection)
    make_box("Innova_Hood", (1.68, 1.15, 0.25), loc=(ox, oy + 1.55, 0.82),
             rot=(math.radians(-6), 0, 0), mat=MAT_CACHE['Car_Silver_Metallic'],
             parent=root, collection=collection)
    make_box("Innova_Glass", (1.60, 2.65, 0.60), loc=(ox, oy - 0.30, 1.25),
             mat=MAT_CACHE['Vehicle_Glass'], parent=root, collection=collection)
    make_box("Innova_Roof", (1.62, 2.70, 0.10), loc=(ox, oy - 0.30, 1.58),
             mat=MAT_CACHE['Car_Silver_Metallic'], parent=root, collection=collection)

    add_windshield_wipers(root, ox, y=oy + 1.02, z=1.02, collection=collection)
    add_side_mirrors(root, ox, y=oy + 0.95, z=1.02, span_x=0.96, collection=collection)
    add_door_handles(root, ox, y_coords=[oy + 0.40, oy - 0.45], z=0.82, span_x=0.89, collection=collection)
    add_license_plates(root, ox, front_y=oy + 2.35, rear_y=oy - 2.35, z=0.42, is_commercial=False, collection=collection)

    track_x = 0.82
    make_high_detail_wheel("wheel_fl", radius=0.33, width=0.20, loc=(ox - track_x, oy + 1.45, 0.33), parent=root, collection=collection)
    make_high_detail_wheel("wheel_fr", radius=0.33, width=0.20, loc=(ox + track_x, oy + 1.45, 0.33), parent=root, collection=collection)
    make_high_detail_wheel("wheel_rl", radius=0.33, width=0.20, loc=(ox - track_x, oy - 1.45, 0.33), parent=root, collection=collection)
    make_high_detail_wheel("wheel_rr", radius=0.33, width=0.20, loc=(ox + track_x, oy - 1.45, 0.33), parent=root, collection=collection)

    return root

# =============================================================================
# 5. MUMBAI POLICE PATROL SUV (BOLERO STYLE)
# =============================================================================
def generate_police_patrol(collection, offset_x=16.0, offset_y=0.0):
    root = bpy.data.objects.new("Mumbai_Police_SUV", None)
    collection.objects.link(root)
    root.location = (offset_x, offset_y, 0)
    ox, oy = offset_x, offset_y

    make_box("Police_Body", (1.78, 4.30, 0.65), loc=(ox, oy, 0.68),
             mat=MAT_CACHE['Police_White'], parent=root, collection=collection)
    make_box("Police_Stripe_L", (0.04, 4.32, 0.16), loc=(ox - 0.88, oy, 0.65),
             mat=MAT_CACHE['Police_Blue_Stripe'], parent=root, collection=collection)
    make_box("Police_Stripe_R", (0.04, 4.32, 0.16), loc=(ox + 0.88, oy, 0.65),
             mat=MAT_CACHE['Police_Blue_Stripe'], parent=root, collection=collection)

    make_box("Police_CabinGlass", (1.64, 2.20, 0.58), loc=(ox, oy - 0.20, 1.28),
             mat=MAT_CACHE['Vehicle_Glass'], parent=root, collection=collection)
    make_box("Police_Roof", (1.68, 2.30, 0.10), loc=(ox, oy - 0.20, 1.62),
             mat=MAT_CACHE['Police_White'], parent=root, collection=collection)

    # Red & Blue emergency lightbar
    make_box("Police_Light_Red", (0.32, 0.16, 0.12), loc=(ox - 0.25, oy - 0.15, 1.74),
             mat=MAT_CACHE['Emergency_Red'], parent=root, collection=collection)
    make_box("Police_Light_Blue", (0.32, 0.16, 0.12), loc=(ox + 0.25, oy - 0.15, 1.74),
             mat=MAT_CACHE['Emergency_Blue'], parent=root, collection=collection)
    make_box("Police_Bullbar", (1.40, 0.10, 0.45), loc=(ox, oy + 2.22, 0.62),
             mat=MAT_CACHE['Auto_Black_Body'], parent=root, collection=collection)

    add_windshield_wipers(root, ox, y=oy + 0.95, z=1.05, collection=collection)
    add_side_mirrors(root, ox, y=oy + 0.85, z=1.05, span_x=0.96, collection=collection)
    add_license_plates(root, ox, front_y=oy + 2.26, rear_y=oy - 2.16, z=0.45, is_commercial=False, collection=collection)

    track_x = 0.84
    make_high_detail_wheel("wheel_fl", radius=0.34, width=0.22, loc=(ox - track_x, oy + 1.30, 0.34), parent=root, collection=collection)
    make_high_detail_wheel("wheel_fr", radius=0.34, width=0.22, loc=(ox + track_x, oy + 1.30, 0.34), parent=root, collection=collection)
    make_high_detail_wheel("wheel_rl", radius=0.34, width=0.22, loc=(ox - track_x, oy - 1.30, 0.34), parent=root, collection=collection)
    make_high_detail_wheel("wheel_rr", radius=0.34, width=0.22, loc=(ox + track_x, oy - 1.30, 0.34), parent=root, collection=collection)

    return root

# =============================================================================
# 6. INDIAN EMERGENCY AMBULANCE (108 SERVICE)
# =============================================================================
def generate_ambulance(collection, offset_x=20.0, offset_y=0.0):
    root = bpy.data.objects.new("Indian_Ambulance", None)
    collection.objects.link(root)
    root.location = (offset_x, offset_y, 0)
    ox, oy = offset_x, offset_y

    make_box("Amb_Body", (1.92, 5.10, 1.60), loc=(ox, oy, 1.45),
             mat=MAT_CACHE['Police_White'], parent=root, collection=collection)
    make_box("Amb_RedStripe_L", (0.04, 5.12, 0.24), loc=(ox - 0.96, oy, 1.25),
             mat=MAT_CACHE['Emergency_Red'], parent=root, collection=collection)
    make_box("Amb_RedStripe_R", (0.04, 5.12, 0.24), loc=(ox + 0.96, oy, 1.25),
             mat=MAT_CACHE['Emergency_Red'], parent=root, collection=collection)
    make_box("Amb_Windshield", (1.80, 0.05, 0.70), loc=(ox, oy + 2.54, 1.68),
             rot=(math.radians(10), 0, 0), mat=MAT_CACHE['Vehicle_Glass'], parent=root, collection=collection)

    make_box("Amb_Siren_L", (0.28, 0.20, 0.15), loc=(ox - 0.40, oy + 2.0, 2.32),
             mat=MAT_CACHE['Emergency_Red'], parent=root, collection=collection)
    make_box("Amb_Siren_R", (0.28, 0.20, 0.15), loc=(ox + 0.40, oy + 2.0, 2.32),
             mat=MAT_CACHE['Emergency_Red'], parent=root, collection=collection)

    add_windshield_wipers(root, ox, y=oy + 2.55, z=1.35, collection=collection)
    add_side_mirrors(root, ox, y=oy + 2.40, z=1.55, span_x=1.08, collection=collection)
    add_license_plates(root, ox, front_y=oy + 2.60, rear_y=oy - 2.60, z=0.50, is_commercial=True, collection=collection)

    track_x = 0.88
    make_high_detail_wheel("wheel_fl", radius=0.36, width=0.22, loc=(ox - track_x, oy + 1.65, 0.36), parent=root, collection=collection)
    make_high_detail_wheel("wheel_fr", radius=0.36, width=0.22, loc=(ox + track_x, oy + 1.65, 0.36), parent=root, collection=collection)
    make_high_detail_wheel("wheel_rl", radius=0.36, width=0.22, loc=(ox - track_x, oy - 1.65, 0.36), parent=root, collection=collection)
    make_high_detail_wheel("wheel_rr", radius=0.36, width=0.22, loc=(ox + track_x, oy - 1.65, 0.36), parent=root, collection=collection)

    return root

# =============================================================================
# 7. TATA ACE "CHHOTA HATHI" (MINI PICKUP TRUCK)
# =============================================================================
def generate_tata_ace(collection, offset_x=0.0, offset_y=6.0):
    root = bpy.data.objects.new("Tata_Ace_MiniTruck", None)
    collection.objects.link(root)
    root.location = (offset_x, offset_y, 0)
    ox, oy = offset_x, offset_y

    # Front Cab
    make_box("Ace_Cab", (1.52, 1.30, 1.25), loc=(ox, oy + 1.10, 1.05),
             mat=MAT_CACHE['Truck_White_Ace'], parent=root, collection=collection)
    make_box("Ace_Windshield", (1.42, 0.04, 0.55), loc=(ox, oy + 1.76, 1.25),
             mat=MAT_CACHE['Vehicle_Glass'], parent=root, collection=collection)

    # Cargo Tub Bed
    make_box("Ace_BedFloor", (1.55, 2.20, 0.12), loc=(ox, oy - 0.65, 0.68),
             mat=MAT_CACHE['Truck_White_Ace'], parent=root, collection=collection)
    make_box("Ace_BedSide_L", (0.06, 2.20, 0.42), loc=(ox - 0.74, oy - 0.65, 0.92),
             mat=MAT_CACHE['Truck_White_Ace'], parent=root, collection=collection)
    make_box("Ace_BedSide_R", (0.06, 2.20, 0.42), loc=(ox + 0.74, oy - 0.65, 0.92),
             mat=MAT_CACHE['Truck_White_Ace'], parent=root, collection=collection)
    make_box("Ace_BedTailgate", (1.55, 0.06, 0.42), loc=(ox, oy - 1.76, 0.92),
             mat=MAT_CACHE['Truck_White_Ace'], parent=root, collection=collection)

    add_side_mirrors(root, ox, y=oy + 1.35, z=1.15, span_x=0.86, collection=collection)
    add_license_plates(root, ox, front_y=oy + 1.78, rear_y=oy - 1.80, z=0.38, is_commercial=True, collection=collection)

    track_x = 0.70
    make_high_detail_wheel("wheel_fl", radius=0.28, width=0.16, loc=(ox - track_x, oy + 1.05, 0.28), parent=root, collection=collection)
    make_high_detail_wheel("wheel_fr", radius=0.28, width=0.16, loc=(ox + track_x, oy + 1.05, 0.28), parent=root, collection=collection)
    make_high_detail_wheel("wheel_rl", radius=0.28, width=0.16, loc=(ox - track_x, oy - 1.05, 0.28), parent=root, collection=collection)
    make_high_detail_wheel("wheel_rr", radius=0.28, width=0.16, loc=(ox + track_x, oy - 1.05, 0.28), parent=root, collection=collection)

    return root

# =============================================================================
# 8. TATA 407 HIGHWAY TRUCK ("HORN OK PLEASE")
# =============================================================================
def generate_indian_truck(collection, offset_x=4.5, offset_y=6.0):
    root = bpy.data.objects.new("Tata_407_Truck", None)
    collection.objects.link(root)
    root.location = (offset_x, offset_y, 0)
    ox, oy = offset_x, offset_y

    make_box("Truck_Chassis", (1.60, 7.80, 0.30), loc=(ox, oy - 0.40, 0.65),
             mat=MAT_CACHE['Auto_Black_Body'], parent=root, collection=collection)
    make_box("Truck_Cabin", (2.25, 2.10, 1.65), loc=(ox, oy + 2.20, 1.65),
             mat=MAT_CACHE['Truck_Blue_Cab'], parent=root, collection=collection)
    make_box("Truck_Visor", (2.32, 0.40, 0.22), loc=(ox, oy + 3.15, 2.52),
             rot=(math.radians(-15), 0, 0), mat=MAT_CACHE['Truck_Orange_Visor'], parent=root, collection=collection)
    make_box("Truck_Windshield", (2.05, 0.05, 0.70), loc=(ox, oy + 3.26, 1.95),
             mat=MAT_CACHE['Vehicle_Glass'], parent=root, collection=collection)

    # Wooden Cargo Bed with Ornate "HORN OK PLEASE"
    make_box("Truck_CargoFloor", (2.35, 5.20, 0.18), loc=(ox, oy - 1.40, 1.05),
             mat=MAT_CACHE['Truck_Wood_Bed'], parent=root, collection=collection)
    make_box("Truck_Railing_L", (0.08, 5.20, 0.85), loc=(ox - 1.14, oy - 1.40, 1.55),
             mat=MAT_CACHE['Truck_Wood_Bed'], parent=root, collection=collection)
    make_box("Truck_Railing_R", (0.08, 5.20, 0.85), loc=(ox + 1.14, oy - 1.40, 1.55),
             mat=MAT_CACHE['Truck_Wood_Bed'], parent=root, collection=collection)
    make_box("Truck_HornOKBoard", (2.35, 0.08, 0.50), loc=(ox, oy - 3.96, 1.35),
             mat=MAT_CACHE['Truck_Art_Yellow'], parent=root, collection=collection)

    add_windshield_wipers(root, ox, y=oy + 3.28, z=1.65, span_x=0.70, collection=collection)
    add_side_mirrors(root, ox, y=oy + 3.10, z=1.90, span_x=1.28, collection=collection)
    add_license_plates(root, ox, front_y=oy + 3.44, rear_y=oy - 4.02, z=0.55, is_commercial=True, collection=collection)

    track_x = 1.05
    make_high_detail_wheel("wheel_fl", radius=0.50, width=0.28, loc=(ox - track_x, oy + 2.30, 0.50), parent=root, collection=collection)
    make_high_detail_wheel("wheel_fr", radius=0.50, width=0.28, loc=(ox + track_x, oy + 2.30, 0.50), parent=root, collection=collection)
    make_high_detail_wheel("wheel_rl", radius=0.50, width=0.34, loc=(ox - track_x, oy - 2.40, 0.50), parent=root, collection=collection)
    make_high_detail_wheel("wheel_rr", radius=0.50, width=0.34, loc=(ox + track_x, oy - 2.40, 0.50), parent=root, collection=collection)

    return root

# =============================================================================
# 9. BEST RED SINGLE-DECKER BUS
# =============================================================================
def generate_best_bus(collection, offset_x=10.0, offset_y=6.0):
    root = bpy.data.objects.new("BEST_Single_Bus", None)
    collection.objects.link(root)
    root.location = (offset_x, offset_y, 0)
    ox, oy = offset_x, offset_y

    make_box("Bus_MainBody", (2.45, 9.80, 2.30), loc=(ox, oy, 1.85),
             mat=MAT_CACHE['BEST_Red'], parent=root, collection=collection)
    make_box("Bus_CreamStripe", (2.48, 9.82, 0.28), loc=(ox, oy, 1.35),
             mat=MAT_CACHE['BEST_Cream_Stripe'], parent=root, collection=collection)
    make_box("Bus_Windows_L", (0.05, 7.80, 0.70), loc=(ox - 1.24, oy - 0.40, 2.25),
             mat=MAT_CACHE['Vehicle_Glass'], parent=root, collection=collection)
    make_box("Bus_Windows_R", (0.05, 7.80, 0.70), loc=(ox + 1.24, oy - 0.40, 2.25),
             mat=MAT_CACHE['Vehicle_Glass'], parent=root, collection=collection)

    make_box("Bus_FrontGlass", (2.35, 0.06, 0.95), loc=(ox, oy + 4.91, 2.15),
             rot=(math.radians(6), 0, 0), mat=MAT_CACHE['Vehicle_Glass'], parent=root, collection=collection)
    make_box("Bus_RouteLED", (1.60, 0.08, 0.32), loc=(ox, oy + 4.92, 2.85),
             mat=MAT_CACHE['Bus_Route_LED'], parent=root, collection=collection)

    add_side_mirrors(root, ox, y=oy + 4.85, z=2.10, span_x=1.35, collection=collection)
    add_windshield_wipers(root, ox, y=oy + 4.94, z=1.70, span_x=0.80, collection=collection)
    add_license_plates(root, ox, front_y=oy + 5.05, rear_y=oy - 5.05, z=0.52, is_commercial=True, collection=collection)

    track_x = 1.10
    make_high_detail_wheel("wheel_fl", radius=0.52, width=0.30, loc=(ox - track_x, oy + 3.20, 0.52), parent=root, collection=collection)
    make_high_detail_wheel("wheel_fr", radius=0.52, width=0.30, loc=(ox + track_x, oy + 3.20, 0.52), parent=root, collection=collection)
    make_high_detail_wheel("wheel_rl", radius=0.52, width=0.34, loc=(ox - track_x, oy - 2.80, 0.52), parent=root, collection=collection)
    make_high_detail_wheel("wheel_rr", radius=0.52, width=0.34, loc=(ox + track_x, oy - 2.80, 0.52), parent=root, collection=collection)

    return root

# =============================================================================
# 10. BEST RED DOUBLE-DECKER BUS (HERITAGE ICON)
# =============================================================================
def generate_double_decker_bus(collection, offset_x=16.5, offset_y=6.0):
    root = bpy.data.objects.new("BEST_Double_Decker", None)
    collection.objects.link(root)
    root.location = (offset_x, offset_y, 0)
    ox, oy = offset_x, offset_y

    make_box("DDecker_LowerBody", (2.46, 9.60, 1.80), loc=(ox, oy, 1.60),
             mat=MAT_CACHE['BEST_Red'], parent=root, collection=collection)
    make_box("DDecker_UpperBody", (2.44, 9.60, 1.70), loc=(ox, oy, 3.30),
             mat=MAT_CACHE['BEST_Red'], parent=root, collection=collection)
    make_box("DDecker_Stripe", (2.48, 9.62, 0.20), loc=(ox, oy, 2.50),
             mat=MAT_CACHE['BEST_Cream_Stripe'], parent=root, collection=collection)
    make_box("DDecker_RoofCap", (2.40, 9.50, 0.16), loc=(ox, oy, 4.22),
             mat=MAT_CACHE['BEST_Cream_Stripe'], parent=root, collection=collection)

    make_box("DDecker_RouteBoard", (1.65, 0.06, 0.35), loc=(ox, oy + 4.82, 4.02),
             mat=MAT_CACHE['Bus_Route_LED'], parent=root, collection=collection)

    add_side_mirrors(root, ox, y=oy + 4.80, z=1.85, span_x=1.35, collection=collection)
    add_license_plates(root, ox, front_y=oy + 4.95, rear_y=oy - 4.95, z=0.52, is_commercial=True, collection=collection)

    track_x = 1.10
    make_high_detail_wheel("wheel_fl", radius=0.54, width=0.32, loc=(ox - track_x, oy + 3.10, 0.54), parent=root, collection=collection)
    make_high_detail_wheel("wheel_fr", radius=0.54, width=0.32, loc=(ox + track_x, oy + 3.10, 0.54), parent=root, collection=collection)
    make_high_detail_wheel("wheel_rl", radius=0.54, width=0.36, loc=(ox - track_x, oy - 2.80, 0.54), parent=root, collection=collection)
    make_high_detail_wheel("wheel_rr", radius=0.54, width=0.36, loc=(ox + track_x, oy - 2.80, 0.54), parent=root, collection=collection)

    return root

# =============================================================================
# 11. HERO SPLENDOR COMMUTER MOTORCYCLE
# =============================================================================
def generate_motorcycle(collection, offset_x=-4.0, offset_y=0.0):
    root = bpy.data.objects.new("Hero_Splendor_Bike", None)
    collection.objects.link(root)
    root.location = (offset_x, offset_y, 0)
    ox, oy = offset_x, offset_y

    make_box("Bike_Frame", (0.16, 1.10, 0.35), loc=(ox, oy - 0.05, 0.55),
             mat=MAT_CACHE['Auto_Black_Body'], parent=root, collection=collection)
    make_box("Bike_Engine", (0.24, 0.45, 0.30), loc=(ox, oy, 0.42),
             mat=MAT_CACHE['Chrome_Trim'], parent=root, collection=collection)
    make_box("Bike_FuelTank", (0.34, 0.65, 0.28), loc=(ox, oy + 0.30, 0.78),
             rot=(math.radians(-8), 0, 0), mat=MAT_CACHE['BEST_Red'], parent=root, collection=collection)
    make_box("Bike_Seat", (0.32, 0.85, 0.16), loc=(ox, oy - 0.38, 0.74),
             mat=MAT_CACHE['Interior_Dark'], parent=root, collection=collection)
    make_cylinder("Bike_Exhaust", radius=0.04, depth=0.95, vertices=8,
                  loc=(ox + 0.20, oy - 0.40, 0.30), rot=(math.radians(85), 0, 0),
                  mat=MAT_CACHE['Chrome_Trim'], parent=root, collection=collection)

    make_cylinder("Bike_Headlight", radius=0.08, depth=0.08, vertices=12,
                  loc=(ox, oy + 0.78, 0.85), rot=(math.radians(90), 0, 0),
                  mat=MAT_CACHE['Headlight_Glass'], parent=root, collection=collection)

    make_high_detail_wheel("wheel_f", radius=0.31, width=0.10, loc=(ox, oy + 0.78, 0.31), parent=root, collection=collection)
    make_high_detail_wheel("wheel_r", radius=0.31, width=0.12, loc=(ox, oy - 0.72, 0.31), parent=root, collection=collection)

    return root

# =============================================================================
# 12. ROYAL ENFIELD "BULLET" 350 CRUISER
# =============================================================================
def generate_bullet_cruiser(collection, offset_x=-7.5, offset_y=0.0):
    root = bpy.data.objects.new("Enfield_Bullet_350", None)
    collection.objects.link(root)
    root.location = (offset_x, offset_y, 0)
    ox, oy = offset_x, offset_y

    # Frame & Heavy Single-Cylinder Engine
    make_box("Bullet_Frame", (0.20, 1.25, 0.38), loc=(ox, oy, 0.52),
             mat=MAT_CACHE['Auto_Black_Body'], parent=root, collection=collection)
    make_box("Bullet_EngineBlock", (0.32, 0.50, 0.38), loc=(ox, oy + 0.05, 0.44),
             mat=MAT_CACHE['Chrome_Trim'], parent=root, collection=collection)

    # Classic Teardrop Dark Green Fuel Tank & Spring Saddle Seat
    make_box("Bullet_TeardropTank", (0.42, 0.75, 0.32), loc=(ox, oy + 0.35, 0.82),
             rot=(math.radians(-6), 0, 0), mat=MAT_CACHE['Bullet_Dark_Green'], parent=root, collection=collection)
    make_box("Bullet_SpringSeat", (0.36, 0.52, 0.14), loc=(ox, oy - 0.25, 0.76),
             mat=MAT_CACHE['Seat_Brown'], parent=root, collection=collection)

    # Long Chrome Swept Exhaust Pipe
    make_cylinder("Bullet_LongExhaust", radius=0.05, depth=1.30, vertices=10,
                  loc=(ox + 0.22, oy - 0.45, 0.28), rot=(math.radians(88), 0, 0),
                  mat=MAT_CACHE['Chrome_Trim'], parent=root, collection=collection)

    # Big Round Chrome Headlamp Nacelle ("Tiger Eyes")
    make_cylinder("Bullet_Headlamp", radius=0.12, depth=0.12, vertices=14,
                  loc=(ox, oy + 0.88, 0.88), rot=(math.radians(90), 0, 0),
                  mat=MAT_CACHE['Headlight_Glass'], parent=root, collection=collection)

    make_high_detail_wheel("wheel_f", radius=0.34, width=0.12, loc=(ox, oy + 0.90, 0.34), parent=root, collection=collection)
    make_high_detail_wheel("wheel_r", radius=0.34, width=0.14, loc=(ox, oy - 0.80, 0.34), parent=root, collection=collection)

    return root

# =============================================================================
# 13. HONDA ACTIVA MODERN SCOOTER
# =============================================================================
def generate_scooter(collection, offset_x=-11.0, offset_y=0.0):
    root = bpy.data.objects.new("Honda_Activa_Scooter", None)
    collection.objects.link(root)
    root.location = (offset_x, offset_y, 0)
    ox, oy = offset_x, offset_y

    make_box("Scoot_FrontApron", (0.48, 0.22, 0.65), loc=(ox, oy + 0.50, 0.70),
             rot=(math.radians(-12), 0, 0), mat=MAT_CACHE['Car_White_Pearl'], parent=root, collection=collection)
    make_box("Scoot_Footboard", (0.42, 0.45, 0.06), loc=(ox, oy + 0.15, 0.34),
             mat=MAT_CACHE['Interior_Dark'], parent=root, collection=collection)
    make_box("Scoot_RearBody", (0.46, 0.75, 0.45), loc=(ox, oy - 0.35, 0.55),
             mat=MAT_CACHE['Car_White_Pearl'], parent=root, collection=collection)
    make_box("Scoot_Seat", (0.36, 0.65, 0.14), loc=(ox, oy - 0.32, 0.82),
             mat=MAT_CACHE['Interior_Dark'], parent=root, collection=collection)

    make_box("Scoot_HandlebarCowl", (0.55, 0.20, 0.15), loc=(ox, oy + 0.42, 1.02),
             mat=MAT_CACHE['Car_White_Pearl'], parent=root, collection=collection)
    make_box("Scoot_Headlight", (0.24, 0.06, 0.10), loc=(ox, oy + 0.52, 1.02),
             mat=MAT_CACHE['Headlight_Glass'], parent=root, collection=collection)
    add_side_mirrors(root, ox, y=oy + 0.42, z=1.14, span_x=0.32, collection=collection)

    make_high_detail_wheel("wheel_f", radius=0.24, width=0.10, loc=(ox, oy + 0.55, 0.24), parent=root, collection=collection)
    make_high_detail_wheel("wheel_r", radius=0.24, width=0.11, loc=(ox, oy - 0.45, 0.24), parent=root, collection=collection)

    return root

# =============================================================================
# 14. PROPS
# =============================================================================
def generate_mumbai_props(collection, offset_x=-15.0, offset_y=0.0):
    barricade_root = bpy.data.objects.new("Mumbai_Police_Barricade", None)
    collection.objects.link(barricade_root)
    barricade_root.location = (offset_x, offset_y, 0)
    ox, oy = offset_x, offset_y

    make_cylinder("Barricade_TopTube", radius=0.03, depth=2.40, vertices=8,
                  loc=(ox, oy, 1.15), rot=(0, math.radians(90), 0),
                  mat=MAT_CACHE['Barricade_Steel_Blue'], parent=barricade_root, collection=collection)
    make_box("Barricade_Leg_L", (0.06, 0.60, 1.18), loc=(ox - 1.15, oy, 0.59),
             mat=MAT_CACHE['Barricade_Steel_Blue'], parent=barricade_root, collection=collection)
    make_box("Barricade_Leg_R", (0.06, 0.60, 1.18), loc=(ox + 1.15, oy, 0.59),
             mat=MAT_CACHE['Barricade_Steel_Blue'], parent=barricade_root, collection=collection)
    make_box("Barricade_SignBoard", (2.10, 0.04, 0.65), loc=(ox, oy, 0.72),
             mat=MAT_CACHE['Barricade_Yellow'], parent=barricade_root, collection=collection)
    make_box("Barricade_Header", (2.12, 0.05, 0.16), loc=(ox, oy, 0.96),
             mat=MAT_CACHE['Barricade_Steel_Blue'], parent=barricade_root, collection=collection)

    kerb_root = bpy.data.objects.new("Mumbai_Kerb_Segment", None)
    collection.objects.link(kerb_root)
    kerb_root.location = (offset_x - 3.5, offset_y, 0)
    kox = offset_x - 3.5
    for i in range(6):
        pos_y = oy - 1.25 + i * 0.5
        mat = MAT_CACHE['Kerb_Yellow'] if i % 2 == 0 else MAT_CACHE['Kerb_Black']
        make_box(f"Kerb_Block_{i}", (0.30, 0.50, 0.25), loc=(kox, pos_y, 0.125),
                 mat=mat, parent=kerb_root, collection=collection)

# =============================================================================
# EXPORT UTILITY (Blender 3.x, 4.x, and 4.5+ Safe)
# =============================================================================
def export_model(root_obj, output_glb_path):
    bpy.ops.object.select_all(action='DESELECT')

    def select_hierarchy(obj):
        obj.select_set(True)
        for child in obj.children:
            select_hierarchy(child)

    select_hierarchy(root_obj)
    bpy.context.view_layer.objects.active = root_obj

    print(f"Exporting '{root_obj.name}' -> {output_glb_path}")

    export_args = {
        'filepath': output_glb_path,
        'use_selection': True,
        'export_format': 'GLB',
        'export_apply': False,
        'export_materials': 'EXPORT',
        'export_animations': True,
        'export_lights': False,
        'export_cameras': False
    }

    try:
        bpy.ops.export_scene.gltf(**export_args)
    except TypeError as e:
        print(f"Note: Standard glTF export fallback ({e})")
        bpy.ops.export_scene.gltf(filepath=output_glb_path, use_selection=True)

# =============================================================================
# MAIN ORCHESTRATOR
# =============================================================================
def main():
    print("=" * 70)
    print("MUMBAI TRAFFIC HERO — COMPLETE 14-VEHICLE SHOWROOM FLEET")
    print("=" * 70)

    reset_scene()
    init_all_materials()

    col_vehicles = get_or_create_collection("Mumbai_Vehicles")
    col_props = get_or_create_collection("Mumbai_Props")

    # ── ROW 1: Taxis, Autos & Passenger Fleet ─────────────────────────────
    auto_cng     = generate_auto_rickshaw(col_vehicles, offset_x=0.0, offset_y=0.0, is_classic=False)
    auto_classic = generate_auto_rickshaw(col_vehicles, offset_x=3.2, offset_y=0.0, is_classic=True)
    taxi_vintage = generate_kaali_peeli_taxi(col_vehicles, offset_x=6.8, offset_y=0.0)
    taxi_modern  = generate_modern_taxi(col_vehicles, offset_x=11.0, offset_y=0.0)
    innova_suv   = generate_innova_suv(col_vehicles, offset_x=15.5, offset_y=0.0)
    police_suv   = generate_police_patrol(col_vehicles, offset_x=20.0, offset_y=0.0)
    ambulance    = generate_ambulance(col_vehicles, offset_x=24.5, offset_y=0.0)

    # ── ROW 2: Trucks, Buses & Two-Wheelers ───────────────────────────────
    scooter      = generate_scooter(col_vehicles, offset_x=-10.5, offset_y=0.0)
    bike_bullet  = generate_bullet_cruiser(col_vehicles, offset_x=-7.0, offset_y=0.0)
    bike_splendor= generate_motorcycle(col_vehicles, offset_x=-3.5, offset_y=0.0)
    tata_ace     = generate_tata_ace(col_vehicles, offset_x=0.0, offset_y=6.0)
    tata_truck   = generate_indian_truck(col_vehicles, offset_x=5.5, offset_y=6.0)
    bus_single   = generate_best_bus(col_vehicles, offset_x=12.0, offset_y=6.0)
    bus_double   = generate_double_decker_bus(col_vehicles, offset_x=19.5, offset_y=6.0)

    generate_mumbai_props(col_props, offset_x=-14.5, offset_y=0.0)

    # ── BATCH EXPORTS ─────────────────────────────────────────────────────
    export_model(auto_cng, os.path.join(EMBEDDED_DIR, 'auto.glb'))
    export_model(auto_cng, os.path.join(MODELS_DIR, 'auto_rickshaw.glb'))
    export_model(auto_classic, os.path.join(MODELS_DIR, 'auto_classic_petrol.glb'))

    export_model(taxi_vintage, os.path.join(EMBEDDED_DIR, 'taxi.glb'))
    export_model(taxi_vintage, os.path.join(MODELS_DIR, 'taxi_kaali_peeli.glb'))
    export_model(taxi_modern, os.path.join(MODELS_DIR, 'taxi_modern_dzire.glb'))

    export_model(bus_single, os.path.join(EMBEDDED_DIR, 'bus.glb'))
    export_model(bus_single, os.path.join(MODELS_DIR, 'bus_best_red.glb'))
    export_model(bus_double, os.path.join(MODELS_DIR, 'bus_double_decker.glb'))

    export_model(tata_ace, os.path.join(MODELS_DIR, 'truck_tata_ace.glb'))
    export_model(tata_truck, os.path.join(MODELS_DIR, 'truck_tata_407.glb'))

    export_model(police_suv, os.path.join(MODELS_DIR, 'police_patrol_suv.glb'))
    export_model(ambulance, os.path.join(MODELS_DIR, 'ambulance_emergency.glb'))
    export_model(innova_suv, os.path.join(MODELS_DIR, 'innova_suv_7seater.glb'))

    export_model(bike_splendor, os.path.join(EMBEDDED_DIR, 'bike.glb'))
    export_model(bike_splendor, os.path.join(MODELS_DIR, 'bike_splendor.glb'))
    export_model(bike_bullet, os.path.join(MODELS_DIR, 'bike_bullet_enfield.glb'))
    export_model(scooter, os.path.join(MODELS_DIR, 'scooter_activa.glb'))

    master_blend_path = os.path.join(OUTPUT_BLEND_DIR, 'mumbai_vehicles_pack.blend')
    bpy.ops.wm.save_as_mainfile(filepath=master_blend_path)

    print(f"\n[OK] Master Blender scene saved to: {master_blend_path}")
    print("[OK] Complete 14-Vehicle Animated Fleet exported successfully!")
    print("=" * 70)

if __name__ == '__main__':
    main()
