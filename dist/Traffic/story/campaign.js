/**
 * story/campaign.js — Story Mode narrative, keyed by level id.
 *
 * THIS FILE HOLDS WORDS AND CAMERA INTENT. NOTHING ELSE.
 *
 *   - The prose, the speakers and the subtitle text live here.
 *   - The camera vectors live here too, because a shot's framing belongs with
 *     the line it cuts to: you cannot retime a push-in without seeing the
 *     dialogue it belongs to. story/shots.js owns the MATH (easing, duration
 *     clamping, anchor resolution) so this file stays readable.
 *   - story/stage.js owns the concrete (roads, buildings, weather).
 *
 * WHY THE OVERLAY EXISTS
 *   The campaign is one continuous story running Lesson 1 → Lesson 53, but the
 *   teaching content of each lesson must stay exactly where it is: in
 *   `levels/levelN.js`. So the narrative lives here as an overlay and the levels
 *   remain pure syllabus + map.
 *
 *   prologue : the film before the player takes control. Once per level.
 *   beats    : films DURING the level, fired from an objective milestone. The
 *              playable map is not rebuilt; the camera borrows it.
 *   cast     : actors the film needs that the gameplay world does not already
 *              own. Positions live here because they are blocking, which is
 *              direction, which is narrative.
 *   borrow   : real gameplay NPCs to park on their cinematic marks.
 *   epilogue : the closing beat, used by the continuity lint.
 *   carry    : the thread handed to the next lesson's prologue.
 *
 * HOUSE RULES ENFORCED HERE
 *   - Every subtitle is reused verbatim from that level's `story.dialogue[]`.
 *     No line is invented, so a film can never drift from its syllabus.
 *   - Every speaker passes the cast roster in tools/validate-levels.js.
 *   - `profileKey` values must exist in npc-ai.js.
 *   - No shot under 4 seconds, and no film may name a concept above its own
 *     lesson's tier. Both are enforced by the validator, not by good intentions.
 *
 * STORY — "MUMBAI 4000"
 *   A suspended traffic inspector drives his dead partner's route book to find
 *   who killed him. The syllabus is the evidence: every rule on that book was
 *   broken by someone, and the breaking is the case.
 */
(function () {
  'use strict';

  window.STORY = window.STORY || {};

  // ── Level 1 — "The White Line" ────────────────────────────────────────────
  //
  // SYLLABUS (from levels/level1.js, themeType signal_jump)
  //   MV Act Sec 119 · red-light patience · the solid white stop line · crossing
  //   priority. This lesson is ABOUT the line. The film is about the line too,
  //   which is the whole trick: the syllabus and the murder are one object.
  //
  // CARRIAGEWAY (fixed in story/stage.js — read that file's header first)
  //   Linking Road x=0, 20m wide, north-south. +z is south. LHT ⇒ southbound
  //   traffic uses x 0..+10.
  //
  //     Vikram's bike   ( 4.0, -12.5)   stopped at the line
  //     Fortuner        ( 6.4, -12.5)   alongside, same lane, slightly outboard
  //     Signal head     (11.4, -16.5)   east kerb, arm reaching west
  //     Stop line                 z = -12.5, painted x 0..+10
  //
  // THE STRUCTURE
  //   PROLOGUE (cold open, ~47s) — 3:14am, rain. Six shots. All `prior: true`:
  //   this depicts what happened BEFORE the lesson, which is why it may sit at
  //   3am and name a Fortuner even though L1 teaches daytime signal discipline.
  //   BEAT (after `wait_red`) — 6:02am, day. Three shots on the PLAYABLE map.
  //   The player has just stopped at the red. The film says why that matters.
  window.STORY['1'] = {

    title: 'The White Line',

    // REPLAYS EVERY LOAD — this is the "cutscenes play until skipped, and skipping
    // does not dismiss them" rule.
    //
    // Skipping a film must not retire it. There is one flag on the campaign,
    // `alwaysReplay`, and cutscene.js reads it on BOTH sides of the gate:
    //
    //   begin()   — refuses to honour a stored "seen" mark, so the film plays.
    //   finish()  — refuses to store one, so the next load plays it again.
    //
    // Both halves are required and they have to agree. Reading the flag in one
    // place and hardcoding the level id in the other — which is what this
    // replaced — works for exactly one lesson and then silently lets L2's
    // prologue get dismissed by a single skip.
    //
    // `seen()` and `markSeen()` still exist and still gate every OTHER level, so
    // this is opt-in per campaign rather than a global behaviour change.
    alwaysReplay: true,

    epilogue: {
      title: 'Cliffhanger · The Man In The Uniform',
      line: 'You delivered the dabba and held the white line. But Mrs. Iyer revealed the chilling truth: the passenger in the black Fortuner wore the Commissioner\'s uniform, and the next entry in Vikram\'s notebook points directly to an illegal escort in Shanti Galli.'
    },

    // The thread handed to Lesson 2 (Street Parking). Names the concept L2
    // teaches, so the continuity lint can prove the handoff is real.
    carry: 'Mrs. Iyer was waiting at the white line before you got there — sixty-two years old, and she had already counted the seconds the Fortuner had been standing on it. She will not get into a police jeep for a stranger. But Vikram drove her for eleven years, and she still parks outside Sharma General Stores every morning waiting for him to come back for the change.',

    // ── Cast ────────────────────────────────────────────────────────────────
    // Positioned on the STAGE map. `vikram` is a motorcycle stopped at the line;
    // `fortuner` is NOT here — it is stage dressing, because it has to survive
    // into the act change and is never addressed or tagged.
    cast: [
      { id: 'vikram', kind: 'vehicle', type: 'bike', color: 0xf8fafc, x: 3.6, y: 0, z: -12.5, rotY: 0, withRider: true },
      { id: 'fortuner', kind: 'vehicle', type: 'suv', color: 0x111317, x: 6.4, y: 0, z: -12.5, rotY: 0, withDriver: true },

      // ── The two people who are actually IN this film ──────────────────────
      //
      // Until these two lines existed, L1 was nine shots about a constable being
      // shot at a junction, and the constable was never on screen: `cast` held a
      // motorcycle and an SUV. `_buildCutsceneArjun` and `_buildCutsceneIyer` were
      // written, wired, and called by id — nobody declared the ids. The Death and
      // Hit clips were staged and loaded and bound to nothing.
      //
      // `aftermath: true` means VISIBLE ONLY FROM THE AFTERMATH ON. It is the one
      // flag this cast needed and the campaign had no way to express: a film has
      // to be able to keep a character out of a shot, and an inspector standing at
      // the scene during shots 1-7 — before the shooting — would tell the audience
      // the case was already open. So they are hidden until shot 8, which is the
      // first shot flagged `aftermath`, and appear for the rest.
      //
      // PLACEMENT, against the stage geometry rather than by eye:
      //   Linking Road is x=0, width 20, so the carriageway is x=-10..+10 and
      //   anything beyond that is footpath. Both stand EAST of the east kerb, so
      //   neither is in a traffic lane, and both are clear of the aftermath
      //   apparatus — barricades at (0,-30), (0,4), (-14,-12); evidence markers at
      //   (2.2,-11), (5.6,-13.6), (8.4,-10.2); cones at (-3,-9), (-3,-16),
      //   (10.5,-8), (10.5,-17); the light bar at (-7.5,-14.5).
      //
      //   rotY faces each toward the sheet over Vikram at (4.0, -12.5), via
      //   atan2(dx, dz) from the actor's own position to the body.
      //
      //   Shot 8 is tight on the body and neither actor is in frame — which is
      //   right, it is the crime scene. Shot 9 is the crane to [8,38,-75], and
      //   that is the shot they are in: two small figures on a wet junction, one
      //   of them speaking. That is the reveal, and it is the first time this film
      //   shows a person who is not riding away in it.
      { id: 'arjun', kind: 'human', x: 12.6, y: 0, z: -13.6, rotY: -1.42, aftermath: true },
      { id: 'iyer', kind: 'human', x: 13.4, y: 0, z: -18.5, rotY: -0.99, aftermath: true }
    ],

    tags: [
      { id: 'vikram', text: 'Vikram Sawant' },
      { id: 'arjun', text: 'Insp. Arjun Kadam' },
      { id: 'iyer', text: 'Mrs. Iyer' }
    ],

    // ── PROLOGUE — cold open ───────────────────────────────────────────
    //
    // NINE shots, ~72s, structured as an EXCHANGE, not a monologue.
    //
    // The previous version had one man saying three things to nobody, which is
    // why it did not read as dialogue: there was no other party, so there was no
    // scene, only a caption track. This version gives the Fortuner a voice and
    // puts the two of them in opposition across three shots — refusal,
    // pressure, refusal — before the fourth shot answers with the only thing
    // that actually ends an argument.
    //
    // THE FIVE MOVEMENTS, so a later edit can see the shape rather than infer it.
    // Nine shots cover five movements; three of them carry two cuts each.
    //   I    ARRIVAL      1-2   the empty junction; the man who obeys it
    //   II   COMPLICATION 3     the Fortuner draws up and speaks first
    //   III  FRICTION     4-5   he demands the road; the man holds the line
    //   IV   SHIFT        6-7   the sound, and the taking of the red
    //   V    CONSEQUENCE   8-9   the apparatus of a crime scene, and the line alone
    //
    // THE CCTV INSERT (shot 3, `osd`) is the addition the six-shot version
    // needed. It is a fixed camera on the opposite kerb with its own OSD and
    // timecode, and the camera does not move at all. Two jobs: it makes the film
    // look FOUND rather than staged, and it plants the fact that there is
    // footage — which is the thing Arjun opens the cold open with. It is also the
    // only framing in this film that is not somebody's creative choice, and
    // placing it right after the two-shot coverage says so without a caption.
    //
    // Every shot carries an `audio` block (see story/audio.js): an ambience bed,
    // an optional one-shot, and — because a shot with a subtitle speaks by
    // default — an actual synthesised voice.
    prologue: [
      // 1 — ESTABLISH. Elevated crane tracking shot overlooking the junction.
      //     Looking north as the menacing Fortuner and SI Vikram Sawant approach
      //     through the rain, headlamps sweeping the wet asphalt, and decelerate to a halt
      //     at the solid white stop line.
      {
        dur: 12,
        hold: 3,
        ease: 'cinematic',
        transition: 'cut',
        from: [1.2, 3.6, -5.5], to: [1.8, 2.2, -8.8],
        look: [5.0, 1.0, -20.0],
        lookTo: [5.0, 1.0, -12.5],
        fov: 38,
        act: 'night',
        prior: true,
        motion: [
          { id: 'fortuner', from: [5.2, 0, -48], to: [6.4, 0, -12.5] },
          { id: 'vikram', from: [3.6, 0, -36], to: [3.6, 0, -12.5] }
        ],
        motionEase: 'outQuad',
        title: 'Linking Road Signal · 3:14 AM',
        audio: { beds: { rain: 0.04, engine: 0.05 } }
      },

      // 2 — THE LINE. Low-angle medium hero shot of Vikram holding the white line.
      //     Framed from the front-left three-quarter angle in front of the line, showing Vikram's
      //     tactical police motorcycle, reflective rain vest, and the Fortuner idling alongside.
      {
        dur: 8,
        ease: 'outCubic',
        transition: 'cut',
        from: [1.5, 1.18, -8.6], to: [2.0, 1.22, -9.4],
        look: [4.6, 1.28, -12.5],
        fov: 32,
        act: 'night',
        prior: true,
        sub: {
          speaker: 'SI Vikram Sawant',
          line: '"Control Room, SI Sawant. Linking Road junction check. 03:14 hours. Monsoon visibility low. Holding the white line."'
        },
        audio: { beds: { rain: 0.04, engine: 0.05 }, sting: 'radio_call', stingGain: 0.7, radio: true }
      },

      // 2b — THE SIGNAL & CCTV. Low-angle upward hero view of the overhead traffic signal
      //      burning deep red against the monsoon night sky, with the Mumbai Police CCTV surveillance
      //      camera recording the intersection below.
      {
        dur: 4,
        ease: 'outQuad',
        transition: 'cut',
        from: [4.6, 1.5, -13.5], to: [4.8, 1.7, -14.2],
        look: [6.8, 5.25, -16.5],
        fov: 38,
        act: 'night',
        prior: true,
        title: 'Mumbai Police Traffic Surveillance · Camera 04',
        audio: { beds: { rain: 0.04, room: 0.01 }, sting: 'click', stingGain: 0.25 }
      },

      // 3 — CCTV INSERT. High-angle surveillance monitor feed from the camera we just established,
      //     recording the Fortuner and Vikram stopped at the white line with live OSD timecode.
      {
        dur: 7,
        ease: 'linear',
        locked: true,
        transition: 'cut',
        from: [-7.8, 7.0, -7.5], to: [-7.8, 7.0, -7.5],
        look: [5.0, 0.8, -12.5],
        fov: 44,
        act: 'night',
        prior: true,
        osd: {
          clock: '3:13:52',
          banner: 'ANDHERI-WEST CCTV // JUNCTION 04',
          rec: 'REC  ●  LIVE',
          gps: 'CAM 04 · LINKING RD / SIGNAL JUNCTION',
          unit: 'IR LOW-LUX · 24FPS · AUDIO MUTED'
        },
        audio: { beds: { rain: 0.04, room: 0.01 }, sting: 'click', stingGain: 0.2 }
      },

      // 4 — COMPLICATION. Intense confrontation through the lowered driver window.
      //     Framed looking into the Fortuner's lowered driver window in the corridor between vehicles,
      //     where the escort driver leans out speaking dismissively in the electric dashboard and warm cabin glow.
      {
        dur: 8,
        ease: 'linear',
        transition: 'cut',
        from: [4.45, 1.32, -12.10], to: [4.65, 1.30, -12.10],
        look: [5.70, 1.25, -12.15],
        lookTo: [5.70, 1.25, -12.15],
        fov: 34,
        act: 'night',
        prior: true,
        sub: {
          speaker: 'Fortuner Escort Driver',
          line: '"Aye Hawaldar. VIP movement hai. Side hatt, signal todne de."'
        },
        audio: { beds: { rain: 0.04, engine: 0.05 }, sting: 'click', stingGain: 0.2 }
      },

      // 5 — FRICTION. Hero medium close-up on SI Vikram Sawant holding the line.
      //     Framed looking back at Vikram from the front three-quarter driver perspective,
      //     revealing his steadfast gaze, human face, official white helmet, and authoritative traffic command gesture.
      {
        dur: 14,
        hold: 3,
        ease: 'inOutQuad',
        transition: 'cut',
        from: [4.90, 1.40, -10.20], to: [4.60, 1.38, -10.90],
        look: [3.60, 1.35, -12.50],
        lookTo: [3.60, 1.35, -12.50],
        fov: 34,
        act: 'night',
        prior: true,
        sub: {
          speaker: 'SI Vikram Sawant',
          line: '"Sir, CM ka kaafila bhi ho toh red light red hoti hai. Gaadi white line ke peeche lijiye."'
        },
        sayThen: {
          at: 0.42,
          speaker: 'Fortuner Escort Driver',
          line: '"Tujhe nahi pata andar kaun baitha hai. Yeh aakhri warning hai."'
        },
        audio: {
          beds: { rain: 0.04, engine: 0.05 },
          stingAt: [{ name: 'tension', kind: 'tension', at: 0.35, gain: 0.8 }]
        }
      },

      // 6 — THE VIP EXECUTION ORDER.
      //     Intimate close-up directly through the Fortuner\'s lowering rear passenger window.
      //     In the dark cabin, the peaked cap of the Commissioner emerges into the reading light, gun in hand:
      //     "Isko hatao yahan se."
      {
        dur: 5,
        ease: 'linear',
        transition: 'cut',
        noRain: true,
        from: [4.50, 1.40, -12.85], to: [4.75, 1.36, -12.85],
        look: [5.70, 1.26, -12.85],
        lookTo: [5.70, 1.26, -12.85],
        fov: 28,
        act: 'night',
        prior: true,
        sub: {
          speaker: 'Shadowed VIP Passenger',
          line: '"Isko hatao yahan se."'
        },
        audio: {
          beds: { rain: 0.02, room: 0.01, engine: 0.04 },
          stingAt: [{ name: 'cock', kind: 'cock_gun', at: 0.38, gain: 0.85 }]
        }
      },

      // 7 — THE FLASH. One frame of white, then the Fortuner accelerates away.
      //     Dynamic tracking camera keeping the fleeing Fortuner in frame as its red tail lamps blaze
      //     and it speeds across the white line into the dark rainy avenue.
      {
        dur: 8,
        ease: 'outQuint',
        transition: 'cut',
        from: [2.6, 1.35, -15.5], to: [3.8, 1.50, -8.0],
        look: [6.4, 1.15, -10.0],
        lookTo: [6.4, 1.30, 40.0],
        fov: 44,
        act: 'night',
        prior: true,
        flashAt: 0.08,
        flashGain: 0.9,
        motion: [
          { id: 'fortuner', from: [6.4, 0, -12.5], to: [6.4, 0, 85] }
        ],
        motionEase: 'inCubic',
        audio: {
          beds: { rain: 0.04, engine: 0.08 },
          stingAt: [
            { name: 'gun', kind: 'shot', at: 0.08, gain: 1.0 },
            { name: 'roar', kind: 'engine_roar', at: 0.14, gain: 0.85 }
          ],
          sampleAt: [
            { name: 'sfx_windscreen', at: 0.09, gain: 0.5 },
            { name: 'sfx_skid_long', at: 0.12, gain: 0.65 }
          ]
        }
      },

      // 8 — CONSEQUENCE. Back to the stop line. The Fortuner is gone, the rain
      //     has not stopped, and there is a shape across the paint.
      {
        dur: 13,
        hold: 5,
        ease: 'linear',
        transition: 'cut',
        from: [-2.2, 2.0, -6.5], to: [-1.2, 1.5, -8.5],
        look: [3.6, 0.35, -12.5],
        fov: 46,
        act: 'night',
        prior: true,
        aftermath: true,
        title: 'Vikram Sawant · 22 Years, Traffic Division',
        sub: {
          speaker: 'Mumbai Police Radio',
          line: '"All units, 10-33 on Linking Road! Officer down! Black Fortuner fled south towards Shanti Galli!"'
        },
        sampleLoop: 'sfx_police_siren',
        sampleGain: 0.38,
        audio: {
          beds: { rain: 0.04, room: 0.01 },
          radio: true,
          stingAt: [
            { name: 'radio', kind: 'radio_call', at: 0.02, gain: 0.85 },
            { name: 'body', kind: 'thud', at: 0.30, gain: 0.8 }
          ]
        }
      },

      // 9 — TRANSITION TO SHANTI GALLI. Three hours later, dawn breaks over the colony.
      //     The camera glides down onto Sharma Niwas on Shanti Galli, revealing the
      //     family home, the garage with the parked car, and Kabir's mother calling from
      //     the balcony. This establishes the player's immediate spawn point and vehicle,
      //     creating seamless narrative and spatial handover into the driving lesson.
      {
        dur: 10,
        hold: 3,
        ease: 'cinematic',
        transition: 'cut',
        timePass: true,
        title: 'Three Hours Later · Shanti Galli — Arjun\'s Safehouse',
        from: [-54, 8, -112], to: [-62, 3.2, -122],
        look: [-64.0, 1.2, -128],
        lookTo: [-64.0, 1.2, -128],
        fov: 46,
        act: 'dawn',
        prior: true,
        sampleStop: ['sfx_police_siren'],
        sub: {
          speaker: 'Insp. Arjun Kadam',
          line: '"Three hours later... Vikram\'s notebook. Entry one: Mrs. Iyer. She sees everything. I have to reach her at Bazaar Road."'
        },
        audio: {
          beds: { room: 0.04, engine: 0.02, birds: 0.05 },
          stingAt: [{ name: 'whoosh', kind: 'transition_whoosh', at: 0.02, gain: 0.8 }]
        }
      }
    ],

    // ── BEATS — films DURING the level ──────────────────────────────────────
    //
    // A beat fires from an objective milestone and plays on the PLAYABLE map
    // without rebuilding it. The camera borrows the world the player is already
    // driving, then hands it straight back, so the lesson resumes from exactly
    // where it was interrupted.
    //
    // `after` is an objective id from the level's `tasks[]`; the validator fails
    // the build if that objective does not exist, because a beat hung off a task
    // that never fires is a film nobody ever sees.
    beats: [
      {
        // Fires when the player has genuinely stopped at the red behind the
        // line — i.e. they have just done the thing this film is about.
        //
        // Hung off `wait_red` rather than `exit_home` on purpose. By the time this
        // fires the player has driven the whole colony road, turned onto Linking
        // Road, joined the queue and stopped behind the paint — so the camera is
        // borrowing a world they have already looked at, and Arjun is standing in
        // the exact spot the prologue spent nine shots framing.
        after: 'wait_red',
        once: true,
        title: 'Three Hours Later · Same Signal',

        // A beat films on the PLAYABLE map, so it needs its own cast in
        // playable coordinates. Declaring this does NOT reuse the stage cast —
        // the stage's Vikram is stopped in the middle of a murder three hours
        // earlier, and having him still be at the line when Arjun opens his
        // notebook would be a continuity error, not a shot.
        //
        // Arjun stands on the west footpath of Linking Road with the notebook.
        cast: [
          { id: 'arjun', kind: 'ped', variant: 'normal', x: -6.5, y: 0, z: -19, rotY: -Math.PI / 2 },
          { id: 'iyer', kind: 'ped', variant: 'elderly', x: 8.6, y: 0, z: -22, rotY: Math.PI / 2 }
        ],

        shots: [
          // 1 — Match on the line, now daylight and dry. Same composition as
          //     prologue shot 2, inverted in time. The audience has to feel the
          //     cut before they are told it is a cut.
          {
            dur: 9,
            hold: 3,
            ease: 'outCubic',
            transition: 'cut',
            from: [-4, 3.2, -4], to: [0.5, 1.15, -8.5],
            look: [4.6, 0.7, -12.4],
            fov: 40,
            act: 'day',
            audio: { beds: { room: 0.12, engine: 0.04, birds: 0.04 } }
          },
          // 2 — Arjun, low and close, notebook in frame. The subtitle is the
          //     whole case in one line.
          {
            dur: 8,
            ease: 'linear',
            transition: 'cut',
            from: [-9.4, 1.9, -22.4], to: [-8.2, 1.7, -20.6],
            look: [-6.5, 1.4, -19.0],
            fov: 44,
            act: 'day',
            sub: {
              speaker: 'Insp. Arjun Kadam',
              line: '"Entry one. Mrs. Iyer. She sees everything."'
            },
            audio: { beds: { room: 0.12, engine: 0.04, birds: 0.04 } }
          },
          // 3 — The rule, said out loud by the man it killed. Wide, so the
          //     junction is in frame and the jeep sits on the line where the
          //     Fortuner sat. End on the player's own car.
          //
          //     `dawn`, not `day`. The prologue was 3:14am; the lesson runs at
          //     midday. This beat is the handover between them and it is staged
          //     three hours on from the murder, so it gets its own low-sun act
          //     rather than borrowing full daylight — a rising sun rakes across
          //     the carriageway here and throws the junction's own shadows across
          //     the stop line, which is the one image in the whole film that puts
          //     the line and Vikram in the same frame as daylight.
          {
            dur: 8,
            ease: 'inOutQuad',
            transition: 'cut',
            from: [16, 6.0, -44], to: [8, 3.2, -26],
            look: [-1.0, 1.2, -13.0],
            fov: 44,
            act: 'dawn',
            sub: {
              speaker: 'Insp. Arjun Kadam',
              line: '"Red light karna, sir. Yahi toh sikhaya tha unhone."'
            },
            audio: { beds: { room: 0.12, engine: 0.04, birds: 0.04 } }
          }
        ]
      },
      {
        // THE CLIFFHANGER. Hung off the LAST objective of the lesson, so it fires
        // the instant the dabba is delivered and before the results panel — the
        // only placement where a hook can actually land, because the player is
        // still driving and still holding the controller.
        //
        // Seven shots, ~50s. The shape is a WITNESS, not a conversation: Mrs.
        // Iyer says almost nothing, and the things she does say are worse each
        // time. She starts by comparing Vikram to the player (which is reassuring,
        // and wrong), then reports a second man she should not have been able to
        // see, then tells the inspector the man was wearing his own department's
        // uniform.
        //
        // The last three shots are the hook. Arjun does not react — a reaction
        // shot is a release. Instead we cut to the notebook in his hands (the
        // physical object the case lives in), then to Shanti Galli as an empty
        // establishing plate at the exact hour and weather Vikram wrote about,
        // and only THEN the title card. The audience is left holding an address
        // and a time.
        after: 'deliver_dabba',
        once: true,
        title: 'Sharma General Stores · The Cliffhanger',

        // Both actors are staged under the store's awning on the Bazaar Road
        // frontage — the level's own 'Sharma General Stores' plot sits at
        // (72, 100), so the awning and its signboard are already in frame.
        // Arjun is closer to the road, Mrs. Iyer further in: the shot-reverse
        // pattern below works off that depth difference rather than off a
        // cutaway, which is why the two never share a frame again.
        cast: [
          { id: 'arjun', kind: 'ped', variant: 'normal', x: 42, y: 0, z: 98, rotY: Math.PI },
          { id: 'iyer', kind: 'ped', variant: 'elderly', x: 46, y: 0, z: 98, rotY: -Math.PI / 2 }
        ],

        shots: [
          // 1 — Storefront arrival. Mrs. Iyer watches from under the awning and
          //     the first thing she says is a compliment to the player. It is
          //     framed as a two-shot's worth of depth but she is the only one
          //     addressed, which is what makes it feel like she has been waiting.
          {
            dur: 12,
            hold: 5,
            ease: 'outCubic',
            transition: 'cut',
            from: [30, 2.8, 90], to: [36, 2.2, 94],
            look: [46, 1.4, 98],
            fov: 44,
            act: 'day',
            sub: {
              speaker: 'Mrs. Iyer',
              line: '"Vikram bhai har roz isi signal par rukta tha. Har roz. Tum bhi ruko."'
            },
            audio: { beds: { room: 0.14, engine: 0.04, birds: 0.04 } }
          },

          // 2 — Push in on Mrs. Iyer. A slow push rather than a cut for the
          //     second half of her line, because the information changes register
          //     mid-sentence and the camera should notice before the audience
          //     does. fov 34 is tight enough that the awning edge crops the top of
          //     frame — the frame gets smaller as the news gets worse.
          {
            dur: 10,
            hold: 3,
            ease: 'inOutQuad',
            transition: 'cut',
            from: [43, 1.8, 96], to: [45.2, 1.6, 97.4],
            look: [46, 1.5, 98],
            fov: 34,
            act: 'day',
            sub: {
              speaker: 'Mrs. Iyer',
              line: '"Maine Fortuner dekha, Arjun. Aur piche baithe aadmi ko bhi."'
            },
            audio: { beds: { room: 0.14, engine: 0.04, birds: 0.04 } }
          },

          // 3 — Reverse on Arjun. The only reaction shot in the film, and it is
          //     4 seconds because he has nothing to say. The camera drifts in
          //     rather than cutting, which is what a person does when they are
          //     listening hard.
          {
            dur: 6,
            ease: 'outCubic',
            transition: 'cut',
            from: [48, 1.8, 100], to: [45.6, 1.7, 99.4],
            look: [42, 1.5, 98],
            fov: 38,
            act: 'day',
            sub: {
              speaker: 'Insp. Arjun Kadam',
              line: '"Kaun tha woh, Mrs. Iyer?!"'
            },
            audio: { beds: { room: 0.14, engine: 0.04, birds: 0.04 } }
          },

          // 4 — THE REVELATION. Shot 2's framing again, tighter still (fov 30),
          //     and this time it does not move at all. Repeating a setup is the
          //     cheapest available way to make an audience feel they have already
          //     been told something — they remember the frame before they process
          //     the line.
          //
          //     The line does the damage in two halves and the cut lands exactly
          //     between them: "police uniform thi uski" kills the passenger as an
          //     outsider, then "agla entry tumhare notebook mein" makes it
          //     Vikram's own paperwork. Vikram's notebook being the next exhibit
          //     is the hook: the dead man's records are the evidence.
          {
            dur: 13,
            ease: 'linear',
            transition: 'cut',
            from: [45.2, 1.6, 97.4], to: [45.6, 1.6, 97.7],
            look: [46, 1.5, 98],
            fov: 30,
            act: 'day',
            sub: {
              speaker: 'Mrs. Iyer',
              line: '"Police uniform thi uski. Aur agla entry tumhare notebook mein... Shanti Galli ka hai."'
            },
            // The second half arrives after the cut's beat, so the two facts land
            // as two separate pieces of bad news rather than one sentence.
            sayThen: {
              at: 0.5,
              speaker: 'Insp. Arjun Kadam',
              line: '"Shanti Galli. Mere ghar ke saamne."'
            },
            // The reveal is the cliffhanger, so the film owes it a beat of nothing.
            // Without the hold, "Shanti Galli" lands on the same frame as "police
            // uniform" and both leave at once — the audience processes them as one
            // fact instead of two. The 4s of silence is what turns a sentence into
            // a turn.
            hold: 4,
            audio: { beds: { room: 0.16, engine: 0.04, birds: 0.04 }, stingAt: { name: 'turn', kind: 'page', at: 0.48, gain: 0.7 } }
          },

          // 5 — THE OBJECT. Vikram's notebook in Arjun's hands, open. This is the
          //     first time the film shows a prop instead of a face, and it is
          //     placed immediately after the line that names it. The page turn is
          //     the sound: `page` at 55%, and the page itself catches the light as
          //     it lifts.
          //
          //     Framing is over-the-shoulder from behind Arjun, so the audience
          //     reads the notebook over his shoulder at the same time he does —
          //     which is the whole point of the shot. Nobody gets to look at the
          //     page alone before he does.
          {
            dur: 9,
            hold: 4,
            ease: 'linear',
            transition: 'cut',
            from: [40.4, 1.75, 98.4], to: [41.0, 1.68, 98.2],
            look: [42.4, 1.35, 98.0],
            fov: 40,
            act: 'day',
            audio: {
              beds: { room: 0.12, engine: 0.04, birds: 0.04 },
              stingAt: { name: 'turn', kind: 'page', at: 0.55, gain: 0.85 }
            }
          },

          // 6 — SHANTI GALLI. The empty plate.
          //
          //     This is the shot that turns a cliffhanger into a location. Not a
          //     reaction, not a title card over a face — the actual street, empty,
          //     at the hour and weather Vikram's entry described. The player has
          //     driven this exact road for the last three minutes, so the
          //     audience recognises it instantly, and the recognition is what does
          //     the work: they already know that road is ordinary and safe.
          //
          //     Framed from the EAST side, looking west-north up Shanti Galli, so
          //     the colony road recedes and the junction it leads to is implied.
          //     It is staged on the EAST because the west side is occupied: the
          //     house at (-88,-128) and its garage at (-69.5,-128) leave a gap
          //     barely wider than the player capsule, and a crane path threaded
          //     through that gap is framed by a garage wall. cinematics.js already
          //     warns about exactly this ("shot camera is within 5m of garage"),
          //     which is how the collision was found.
          {
            dur: 12,
            hold: 4,
            ease: 'cinematic',
            transition: 'cut',
            from: [-24, 20, -156], to: [-28, 12, -128],
            look: [-56, 2, -118],
            lookTo: [-58, 1.2, -104],
            fov: 50,
            act: 'day',
            title: 'Shanti Galli · 10:15 AM · Entry Two',
            audio: { beds: { room: 0.18, engine: 0.03, birds: 0.04 } }
          },

          // 7 — TITLE CARD. Pull back off the street to black.
          //
          //     The camera rises off the plate while the title holds, so the card
          //     is left sitting in the last of the frame rather than snapping in on
          //     a black screen. There is no dialogue: the previous shot said
          //     everything, and a line here would explain the joke.
          {
            dur: 10,
            hold: 4,
            ease: 'cinematic',
            transition: 'cut',
            from: [-28, 12, -128], to: [-16, 30, -170],
            look: [-58, 1.2, -104],
            fov: 50,
            act: 'day',
            title: 'To Be Continued · Lesson 2',
            audio: { beds: { room: 0.2, engine: 0.02, birds: 0.03 } }
          }
        ]
      }
    ]
  };

  // ── Continuity scaffold ──────────────────────────────────────────────────
  // Only Lesson 1 has an authored stage today (of 53 lessons). Entries are added
  // here as each stage lands in story/stage.js. A lesson with no entry plays
  // exactly as it does today: no film, no interruption.
  //
  // Shape each entry must follow:
  //
  //   window.STORY['<levelId>'] = {
  //     title, epilogue: { title, line }, carry,
  //     cast: [...], tags: [...],
  //     prologue: [ { dur, ease, act, from, to, look, fov, title?, sub? } ],
  //     beats:  [ { after, once, title?, shots: [...] } ]
  //   }
  //
  // Rules the validator enforces (tools/validate-levels.js --story-report):
  //   - Every subtitle verbatim from that level's story.dialogue[].
  //   - Every speaker inside the cast roster.
  //   - No shot under the 4s floor; no film naming a concept above its tier
  //     unless the shot is marked `prior: true`.
  //   - Every `motion` id resolves to a cast entry.
  //   - No unanchored camera position inside a house or garage shell.
  //   - Every beat's `after` objective exists in that level's `tasks[]`.
  //   - A lesson that sets `carry` must have a receiving lesson with a prologue.
})();