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

    alwaysShow: true,

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
      { id: 'vikram', kind: 'vehicle', type: 'bike', color: 0x1b1f26, x: 4.0, y: 0, z: -12.5, rotY: Math.PI / 2, withRider: true },
      { id: 'fortuner', kind: 'vehicle', type: 'suv', color: 0x0b0d10, x: 6.4, y: 0, z: -12.5, rotY: 0, withDriver: true },
      { id: 'iyer', kind: 'ped', variant: 'elderly', x: 10.5, y: 0, z: -16.0, rotY: -Math.PI / 2 },
      { id: 'arjun', kind: 'ped', variant: 'normal', x: -6.5, y: 0, z: -19, rotY: -Math.PI / 2 }
    ],

    tags: [
      { id: 'vikram', text: 'Vikram Sawant' },
      { id: 'iyer', text: 'Mrs. Iyer' },
      { id: 'arjun', text: 'Insp. Arjun Kadam' }
    ],

    // ── PROLOGUE — cold open ───────────────────────────────────────────
    //
    // Six shots, ~50s, structured as an EXCHANGE, not a monologue.
    //
    // The previous version had one man saying three things to nobody, which is
    // why it did not read as dialogue: there was no other party, so there was no
    // scene, only a caption track. This version gives the Fortuner a voice and
    // puts the two of them in opposition across three shots — refusal,
    // pressure, refusal — before the fourth shot answers with the only thing
    // that actually ends an argument.
    //
    // THE FIVE BEATS, so a later edit can see the shape rather than infer it:
    //   1  status quo + objective   the junction is empty; a man is obeying a rule
    //   2  complication             the Fortuner pulls up and speaks first
    //   3  friction                 he demands the road; the man holds the line
    //   4  SHIFT                    the sound, and the taking of the red
    //   5  consequence / CTA        the line, alone, with what is on it
    //
    // Every shot carries an `audio` block (see story/audio.js): an ambience bed,
    // an optional one-shot, and — because a shot with a subtitle speaks by
    // default — an actual synthesised voice.
    prologue: [
      // 1 — ESTABLISH. Crane down out of the rain onto the junction, held wide
      //     and long enough that the geography is legible before anyone is in it:
      //     Linking Road running away south, the cross street, the signal head on
      //     its east kerb, sodium lamps, four empty lanes at 3am.
      //
      //     Framed from the NORTH-EAST and high, and it STAYS high. Two failed
      //     versions are encoded here:
      //       · from the WEST — the signal head is on the east kerb, so a western
      //         crane puts the whole street wall between camera and junction.
      //       · descending to y≈11 at z=-46 — that is level with the (34,-34)
      //         block's street wall, so the crane finished pointed at a building
      //         rather than at the road.
      //
      //     It ends HIGH ENOUGH to see over the frontages. No subtitle: nobody
      //     has spoken yet, and a card over an empty junction would be telling
      //     the audience what the frame already says.
      {
        dur: 9,
        ease: 'cinematic',
        transition: 'cut',
        from: [52, 44, -92], to: [26, 26, -58],
        look: [2, 1, -12],
        lookTo: [5, 1, -12.5],
        fov: 46,
        act: 'night',
        prior: true,
        title: 'Linking Road Signal · 3:14 AM',
        audio: { beds: { rain: 0.5, room: 0.15 } }
      },

      // 2 — THE LINE. Push in along the stop line so the paint fills the bottom
      //     of frame and the two vehicles sit beyond it, stopped. THIS IS THE
      //     BEAT PROMISED BY THE TITLE: the Fortuner is now clearly in frame, a
      //     black SUV alongside a motorcycle, both stationary. The subtitle names
      //     the vehicle the audience is now looking at.
      {
        dur: 8,
        ease: 'outCubic',
        transition: 'cut',
        from: [-4, 3.2, -4], to: [0.5, 1.15, -8.5],
        look: [4.6, 0.7, -12.4],
        fov: 40,
        act: 'night',
        prior: true,
        sub: {
          speaker: 'Vikram Sawant',
          line: '"Stopping at the line. Even for a Fortuner."'
        },
        audio: { beds: { rain: 0.45, engine: 0.1 } }
      },

      // 3 — COMPLICATION. Hard cut to the Fortuner's flank, window down, the
      //     driver's hand on the sill. The antagonist SPEAKS FIRST, which is
      //     what makes the following exchange an exchange: he arrives, he is
      //     already talking, and Vikram has to answer.
      //
      //     The camera barely moves. A near-locked frame is the only way to make
      //     a threat feel patient.
      {
        dur: 8,
        ease: 'linear',
        transition: 'cut',
        from: [1.6, 1.45, -16.2], to: [2.6, 1.3, -14.6],
        look: [6.4, 1.5, -12.5],
        fov: 42,
        act: 'night',
        prior: true,
        sub: {
          speaker: 'The Fortuner Driver',
          line: '"Bhai, do minute. Bas."'
        },
        audio: { beds: { rain: 0.4, engine: 0.16 }, sting: 'click', stingGain: 0.4 }
      },

      // 4 — FRICTION. Across Vikram's shoulder, the Fortuner filling frame. He
      //     explains himself: he is late, it is only a light. Then Vikram gives
      //     the film's thesis in one line — a rule is not a suggestion, and there
      //     is something on the ground. Both men are in the same shot, which is
      //     the whole point: this is a scene between two people.
      {
        dur: 11,
        ease: 'inOutQuad',
        transition: 'cut',
        from: [1.4, 2.3, -17.4], to: [2.8, 2.15, -15.0],
        look: [6.3, 1.6, -12.5],
        fov: 44,
        act: 'night',
        prior: true,
        sub: {
          speaker: 'The Fortuner Driver',
          line: '"Do minute ki baat hai. Signal toh sirf ek ruka hai."'
        },
        // Second line lands late in the same shot. This is what an exchange
        // looks like in a shot list: two utterances, one cut.
        sayThen: {
          at: 0.52,
          speaker: 'Vikram Sawant',
          line: '"Sir, yeh red light hai. Zameen pe ek line hai. Please."'
        },
        audio: { beds: { rain: 0.4, engine: 0.14 } }
      },

      // 5 — SHIFT. The only fast move in the film, and it holds for 6 seconds
      //     afterwards. Whip along the line, then stay on the Fortuner's tail as
      //     it takes the red and goes south. The stillness AFTER the violence is
      //     the shot; without the hold this reads as an accident.
      //
      //     No line. A stinger at 40% and then nothing — the silence is the
      //     reaction, and a caption here would explain the joke.
      {
        dur: 8,
        ease: 'outQuint',
        transition: 'cut',
        from: [0.5, 1.9, -15.0], to: [6.4, 1.5, -4.0],
        look: [6.4, 1.0, -12.5],
        lookTo: [6.4, 1.4, 12],
        fov: 50,
        act: 'night',
        prior: true,
        motion: [
          { id: 'fortuner', from: [6.4, 0, -12.5], to: [6.4, 0, 95] }
        ],
        audio: {
          beds: { rain: 0.5, engine: 0.3 },
          stingAt: { name: 'gun', kind: 'shot', at: 0.42, gain: 1.0 }
        }
      },

      // 6 — CONSEQUENCE. Back to the stop line. The Fortuner is gone, the rain
      //     has not stopped, and there is a shape across the paint. Crane up and
      //     away to the EXACT framing of shot 1 — same start point, same end
      //     point, same look target — so the film ends on the junction it opened
      //     on with one thing changed. Bookending an identical frame is the
      //     cheapest way to make six shots read as one film.
      {
        dur: 9,
        ease: 'cinematic',
        transition: 'cut',
        from: [0.5, 1.1, -8.5], to: [52, 44, -92],
        look: [4.0, 0.5, -12.5],
        lookTo: [2, 1, -12],
        fov: 46,
        act: 'night',
        prior: true,
        aftermath: true,
        title: 'Vikram Sawant · 19 Years, Traffic Division',
        audio: { beds: { rain: 0.5, room: 0.2 } }
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
        after: 'wait_red',
        once: true,
        title: 'Six Hours Later · Same Signal',

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
            dur: 7,
            ease: 'outCubic',
            transition: 'cut',
            from: [-4, 3.2, -4], to: [0.5, 1.15, -8.5],
            look: [4.6, 0.7, -12.4],
            fov: 40,
            act: 'day'
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
            }
          },
          // 3 — The rule, said out loud by the man it killed. Wide, so the
          //     junction is in frame and the jeep sits on the line where the
          //     Fortuner sat. End on the player's own car.
          {
            dur: 8,
            ease: 'inOutQuad',
            transition: 'cut',
            from: [16, 6.0, -44], to: [8, 3.2, -26],
            look: [-1.0, 1.2, -13.0],
            fov: 44,
            act: 'day',
            sub: {
              speaker: 'Insp. Arjun Kadam',
              line: '"Red light karna, sir. Yahi toh sikhaya tha unhone."'
            }
          }
        ]
      },
      {
        after: 'deliver_dabba',
        once: true,
        title: 'Sharma General Stores · The Cliffhanger',
        cast: [
          { id: 'arjun', kind: 'ped', variant: 'normal', x: 42, y: 0, z: 98, rotY: Math.PI },
          { id: 'iyer', kind: 'ped', variant: 'elderly', x: 46, y: 0, z: 98, rotY: -Math.PI / 2 }
        ],
        shots: [
          // 1 — Storefront arrival. Mrs. Iyer watches from under the awning.
          {
            dur: 6,
            ease: 'outCubic',
            transition: 'cut',
            from: [30, 2.8, 90], to: [36, 2.2, 94],
            look: [46, 1.4, 98],
            fov: 44,
            act: 'day',
            sub: {
              speaker: 'Mrs. Iyer',
              line: '"Vikram bhai har roz isi signal par rukta tha. Har roz. Tum bhi ruko."'
            }
          },
          // 2 — Crash zoom on Mrs. Iyer's eyes. Nathan Doan style intense comedic focus.
          {
            dur: 7,
            ease: 'inOutQuad',
            transition: 'cut',
            from: [43, 1.8, 96], to: [45.2, 1.6, 97.4],
            look: [46, 1.5, 98],
            fov: 34,
            act: 'day',
            sub: {
              speaker: 'Mrs. Iyer',
              line: '"Maine Fortuner dekha, Arjun. Aur piche baithe aadmi ko bhi."'
            }
          },
          // 3 — Reverse angle on Arjun. The shock register.
          {
            dur: 6,
            ease: 'outCubic',
            transition: 'cut',
            from: [48, 1.8, 100], to: [44.5, 1.6, 99.2],
            look: [42, 1.5, 98],
            fov: 38,
            act: 'day',
            sub: {
              speaker: 'Insp. Arjun Kadam',
              line: '"Kaun tha woh, Mrs. Iyer?!"'
            }
          },
          // 4 — The cliffhanger revelation.
          {
            dur: 8,
            ease: 'linear',
            transition: 'cut',
            from: [45.2, 1.6, 97.4], to: [45.6, 1.6, 97.7],
            look: [46, 1.5, 98],
            fov: 30,
            act: 'day',
            sub: {
              speaker: 'Mrs. Iyer',
              line: '"Police uniform thi uski. Aur agla entry tumhare notebook mein... Shanti Galli ka hai."'
            }
          },
          // 5 — Cinematic crane-away into freeze frame title card.
          {
            dur: 7,
            ease: 'cinematic',
            transition: 'cut',
            from: [36, 3.0, 94], to: [18, 16.0, 70],
            look: [44, 1.5, 98],
            fov: 48,
            act: 'day',
            title: 'Cliffhanger · To Be Continued In Lesson 2'
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