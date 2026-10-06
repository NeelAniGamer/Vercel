# Robot NPC Models — Provenance & Licensing

Sourced for the robot NPC feature. All four are **CC0 / Public Domain**.

## Attribution

| File | Author | Source | License |
|---|---|---|---|
| `animated_robot.glb` | Quaternius | https://poly.pizza/m/QCm7qe9uNJ | CC0 1.0 |
| `robot_enemy.glb` | Quaternius | https://poly.pizza/m/1gNo5ezvmr | CC0 1.0 |
| `robot_enemy_large.glb` | Quaternius | https://poly.pizza/m/mPDR0L5uKx | CC0 1.0 |
| `robot_enemy_flying.glb` | Quaternius | https://poly.pizza/m/lF3jeRJwiH | CC0 1.0 |

Upstream pack: "Animated Robot" by Quaternius — https://quaternius.com/packs/animatedrobot.html

CC0 waives attribution, but credit is recorded here and in the in-game credits
because third-party asset provenance should stay auditable.

## SHA-256 (first 32 hex chars, MD5-era truncation for quick diffing)

```
animated_robot.glb        54F1A6999CCA701CDC2F8FB67BCD9A28
robot_enemy.glb           D5D1DE1481560415C9006DD1989C2DD0
robot_enemy_large.glb     1D21EE204A8080897623171BAADCD3B4
robot_enemy_flying.glb    7E3A27532B43807B375E3D3AD9CBE1F7
```

## Integrity

All four validated as glTF 2.0 binary: magic `glTF`, version 2, and the header's
declared chunk length matches actual file size. No `extensionsUsed`, so **no
Draco decompression is required** — they load with plain `GLTFLoader`.

## Contents

| File | Size | Skins | Animations |
|---|---|---|---|
| `animated_robot.glb` | 401 KB | 2 | 14 — Idle, Walking, Running, Wave, ThumbsUp, Yes, No, Sitting, Standing, Jump, Dance, Punch, Death, WalkJump |
| `robot_enemy.glb` | 563 KB | 1 | 7 — Idle, Walk, Run, Attack, Death, Jump, Shoot |
| `robot_enemy_large.glb` | 430 KB | 2 | 8 — Idle, Walk, Run, Attack, Attack.001, Death, Jump, Shoot |
| `robot_enemy_flying.glb` | 298 KB | 2 | 6 — Idle, Walk, Run, Attack, Dead, Shoot |

All are skinned (`skins` present) with named armature clips, so they plug into
the existing animation path used by `Models/anim_walker_biped.glb`.

## REQUIRED SCALE CORRECTION

These models are **not** in metres. Bind-pose bounds are centimetre-scale, so
they must be scaled up on load or they render sub-millimetre and invisible.

Measured against existing game references (`anim_walker_biped.glb` = 1.700 m
tall pedestrian, `supercar_white.glb` = 1.000 m long car):

| File | Bind-pose Y height | Scale to reach 1.70 m |
|---|---|---|
| `animated_robot.glb` | 0.026 m | **~65x** |
| `robot_enemy_large.glb` | 0.064 m | **~27x** |
| `robot_enemy.glb` | 0.005 m | **~340x** |
| `robot_enemy_flying.glb` | 0.005 m | **~340x** |

Store the factor per-model in the NPC definition. Do not hardcode a single
global value — the four models differ by ~13x.

## Content note

Three of these are Quaternius' "Robot Enemy" set and ship `Attack`, `Shoot` and
`Death` clips. This project is a **pedestrian road-safety teaching tool for
learners**, so the hostile set is tonally wrong and should not be placed in
Mumbai traffic scenes.

`animated_robot.glb` is the appropriate primary: friendly humanoid, and its
`Wave` / `ThumbsUp` / `Yes` / `No` clips map cleanly onto road-safety teaching
behaviour. The enemy set is retained here only as a source of alternate
silhouettes; decide before any are spawned in a learner-facing level.