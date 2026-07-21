/**
 * CorrectiveQuiz — Two-layer adaptive quiz system.
 *
 * Layer 1: Violation-keyed corrective questions (shown when player commits a specific violation).
 * Layer 2: Generic driving quiz pool (general road-safety knowledge).
 * Layer 3: Behavior-generated questions (20% of quiz derived from real-time driving telemetry).
 *
 * The quiz is assembled at level-end by `assembleQuiz()`.
 */

import type { BehaviorSnapshot } from '../engine/BehaviorTracker'

// ──────────────────────────────────────────────
// Types
// ──────────────────────────────────────────────

export interface QuizQuestion {
  id: string
  q: string
  o: string[]
  a: number
  /** If this question was generated from behavior telemetry, tag it. */
  source?: 'violation' | 'behavior' | 'generic'
  /** The behavior category that triggered this question, if any. */
  behaviorTag?: string
}

// ──────────────────────────────────────────────
// Layer 1 — Violation-keyed corrective questions
// Exactly matches ui.js lines 54-62
// ──────────────────────────────────────────────

export const VIOLATION_QUIZ: Record<string, QuizQuestion> = {
  NO_HONKING: {
    id: 'v_no_honking',
    q: 'What is the rule for honking in silence zones?',
    o: [
      'It is strictly prohibited and carries a fine.',
      'Honking is allowed once',
      'Only honk if traffic is slow',
      'Honk to warn pedestrians',
    ],
    a: 0,
    source: 'violation',
  },
  MOBILE_USE: {
    id: 'v_mobile_use',
    q: 'Why is phone use prohibited while driving?',
    o: [
      'It causes distraction and significantly increases accident risk.',
      'It is only banned on highways',
      'It is allowed if using a speaker',
      'It only affects the vehicle speed',
    ],
    a: 0,
    source: 'violation',
  },
  SAFETY_VIOLATION: {
    id: 'v_safety',
    q: 'What is the primary purpose of safety gear like helmets/seatbelts?',
    o: [
      'To reduce fatalities and injuries during accidents',
      'To avoid police fines',
      'To make the driver look professional',
      'To improve vehicle aerodynamics',
    ],
    a: 0,
    source: 'violation',
  },
  NO_INDICATOR: {
    id: 'v_no_indicator',
    q: 'When is it mandatory to use a turn indicator?',
    o: [
      'Every time you intend to change direction or merge',
      'Only at red lights',
      'Only on highways',
      'Only when other cars are present',
    ],
    a: 0,
    source: 'violation',
  },
  LITTER_HIT: {
    id: 'v_litter',
    q: 'How does road litter affect vehicle control?',
    o: [
      'It can cause skidding or damage tires',
      'It has no effect on control',
      'It improves grip on wet roads',
      'It only affects the paint',
    ],
    a: 0,
    source: 'violation',
  },
  CHECKPOINT_EVASION: {
    id: 'v_checkpoint',
    q: 'What is the legal consequence of fleeing a police checkpoint?',
    o: [
      'It is a serious offense often leading to immediate arrest',
      'A simple warning',
      'A small fine payable online',
      'No consequence if you have a license',
    ],
    a: 0,
    source: 'violation',
  },
  RED_LIGHT_VIOLATION: {
    id: 'v_red_light',
    q: 'What is the mandatory action when a signal turns red?',
    o: [
      'Stop completely before the stop line',
      'Slow down and proceed cautiously',
      'Stop only if cars are coming',
      'Flash headlights and pass quickly',
    ],
    a: 0,
    source: 'violation',
  },
}

// ──────────────────────────────────────────────
// Layer 2 — Generic driving quiz pool
// These fill the remaining ~80% of the quiz
// ──────────────────────────────────────────────

export const GENERIC_QUIZ: QuizQuestion[] = [
  { id: 'g1', q: 'What does a red traffic light mean?', o: ['Slow down', 'Stop', 'Speed up', 'Turn left'], a: 1, source: 'generic' },
  { id: 'g2', q: 'What does a zebra crossing mean?', o: ['Pedestrians have priority', 'Cars have priority', 'Nothing', 'Park here'], a: 0, source: 'generic' },
  { id: 'g3', q: 'What is the speed limit in a school zone?', o: ['20 km/h', '40 km/h', '60 km/h', '80 km/h'], a: 0, source: 'generic' },
  { id: 'g4', q: 'What does a yellow light mean?', o: ['Stop', 'Speed up', 'Prepare to stop', 'Turn'], a: 2, source: 'generic' },
  { id: 'g5', q: 'Which side of the road do we drive on in India?', o: ['Left', 'Right', 'Middle', 'Either'], a: 0, source: 'generic' },
  { id: 'g6', q: 'What does a flashing red light mean?', o: ['Go fast', 'Stop and proceed when safe', 'Nothing', 'Turn'], a: 1, source: 'generic' },
  { id: 'g7', q: 'What is a speed breaker for?', o: ['To slow down traffic', 'To make noise', 'For parking', 'For racing'], a: 0, source: 'generic' },
  { id: 'g8', q: 'What should you do at a stop sign?', o: ['Slow down', 'Stop completely', 'Honk', 'Turn'], a: 1, source: 'generic' },
  { id: 'g9', q: 'What does a white line on the road mean?', o: ['Lane divider', 'Speed limit', 'Parking zone', 'Nothing'], a: 0, source: 'generic' },
  { id: 'g10', q: 'What does a yellow line on the road mean?', o: ['No parking', 'Speed limit', 'Bus lane', 'Nothing'], a: 0, source: 'generic' },
  { id: 'g11', q: 'What should you do when an ambulance is coming?', o: ['Race it', 'Give way', 'Block it', 'Ignore'], a: 1, source: 'generic' },
  { id: 'g12', q: 'What is the meaning of a blue sign?', o: ['Information', 'Warning', 'Prohibition', 'Direction'], a: 0, source: 'generic' },
  { id: 'g13', q: 'What is the meaning of a red sign?', o: ['Information', 'Warning', 'Prohibition', 'Direction'], a: 2, source: 'generic' },
  { id: 'g14', q: 'What does a roundabout sign mean?', o: ['Stop', 'Give way to traffic in roundabout', 'Go fast', 'Turn left'], a: 1, source: 'generic' },
  { id: 'g15', q: 'What does a pedestrian crossing sign mean?', o: ['Pedestrians may cross', 'No pedestrians', 'Speed up', 'Park'], a: 0, source: 'generic' },
  { id: 'g16', q: 'What does a no-entry sign mean?', o: ['Enter freely', 'Do not enter', 'Speed up', 'Turn'], a: 1, source: 'generic' },
  { id: 'g17', q: 'What does a one-way sign mean?', o: ['Two-way traffic', 'One-way traffic', 'No traffic', 'Park here'], a: 1, source: 'generic' },
  { id: 'g18', q: 'What does a horn prohibition sign mean?', o: ['Honk loudly', 'Do not honk', 'Speed up', 'Turn'], a: 1, source: 'generic' },
  { id: 'g19', q: 'What does a no-parking sign mean?', o: ['Park here', 'Do not park', 'Speed up', 'Turn'], a: 1, source: 'generic' },
  { id: 'g20', q: 'What does a speed limit sign mean?', o: ['Go faster', 'Do not exceed speed', 'No limit', 'Stop'], a: 1, source: 'generic' },
  { id: 'g21', q: 'What does a give-way sign mean?', o: ['Stop and go', 'Slow down and give way', 'Speed up', 'Turn'], a: 1, source: 'generic' },
  { id: 'g22', q: 'What does a hazard warning sign mean?', o: ['No hazard', 'Danger ahead', 'Speed up', 'Park'], a: 1, source: 'generic' },
  { id: 'g23', q: 'What does a cattle crossing sign mean?', o: ['No cattle', 'Cattle may cross', 'Speed up', 'Park'], a: 1, source: 'generic' },
  { id: 'g24', q: 'What does a school zone sign mean?', o: ['No school', 'Children may be around', 'Speed up', 'Park'], a: 1, source: 'generic' },
  { id: 'g25', q: 'What does a steep ascent sign mean?', o: ['Flat road', 'Road goes uphill steeply', 'Speed up', 'Turn'], a: 1, source: 'generic' },
  { id: 'g26', q: 'What does a narrow road sign mean?', o: ['Wide road', 'Road narrows', 'Speed up', 'Turn'], a: 1, source: 'generic' },
  { id: 'g27', q: 'What does a slippery road sign mean?', o: ['Dry road', 'Road may be slippery', 'Speed up', 'Turn'], a: 1, source: 'generic' },
  { id: 'g28', q: 'When should you use headlights?', o: ['Only at night', 'In low visibility and at night', 'Only on highways', 'Never'], a: 1, source: 'generic' },
  { id: 'g29', q: 'What is the safe following distance?', o: ['1 second', '2 seconds', 'At least 3 seconds', 'Half a second'], a: 2, source: 'generic' },
  { id: 'g30', q: 'What should you do before changing lanes?', o: ['Speed up', 'Check mirrors and signal', 'Honk', 'Close eyes'], a: 1, source: 'generic' },
]

// ──────────────────────────────────────────────
// Layer 3 — Behavior-generated questions
// Derived from BehaviorTracker telemetry
// ──────────────────────────────────────────────

interface BehaviorQuestionTemplate {
  /** Behavior category key from BehaviorTracker */
  category: string
  /** Threshold that must be exceeded to trigger this question */
  threshold: number
  question: QuizQuestion
}

const BEHAVIOR_QUESTIONS: BehaviorQuestionTemplate[] = [
  {
    category: 'speedingRatio',
    threshold: 0.3,
    question: {
      id: 'b_speeding',
      q: 'You were speeding for over 30% of the drive. What is the effect of speeding on stopping distance?',
      o: [
        'Stopping distance increases significantly with speed',
        'Speed does not affect stopping distance',
        'Higher speed reduces stopping distance',
        'Only road surface affects stopping distance',
      ],
      a: 0,
      source: 'behavior',
      behaviorTag: 'speedingRatio',
    },
  },
  {
    category: 'speedingRatio',
    threshold: 0.5,
    question: {
      id: 'b_speeding2',
      q: 'You exceeded the speed limit more than half the time. What is the legal penalty for habitual speeding in India?',
      o: [
        'License suspension and heavy fines under the Motor Vehicles Act',
        'No penalty if no accident occurs',
        'Only a verbal warning',
        'A small ₹100 fine',
      ],
      a: 0,
      source: 'behavior',
      behaviorTag: 'speedingRatio',
    },
  },
  {
    category: 'harshBrakeCount',
    threshold: 5,
    question: {
      id: 'b_harsh_brake',
      q: 'You braked harshly multiple times. What does frequent hard braking indicate?',
      o: [
        'Poor anticipation of traffic conditions ahead',
        'Good driving habits',
        'The car brakes are too sensitive',
        'Normal behaviour in city driving',
      ],
      a: 0,
      source: 'behavior',
      behaviorTag: 'harshBrakeCount',
    },
  },
  {
    category: 'harshAccelCount',
    threshold: 5,
    question: {
      id: 'b_harsh_accel',
      q: 'You accelerated aggressively several times. How does aggressive acceleration affect fuel efficiency?',
      o: [
        'Significantly reduces fuel efficiency and increases wear',
        'Has no effect on fuel consumption',
        'Improves engine performance',
        'Reduces tyre wear',
      ],
      a: 0,
      source: 'behavior',
      behaviorTag: 'harshAccelCount',
    },
  },
  {
    category: 'idleRatio',
    threshold: 0.4,
    question: {
      id: 'b_idle',
      q: 'You were stationary for over 40% of the drive. When should you turn off the engine to save fuel?',
      o: [
        'When stopped for more than 60 seconds at a red light or junction',
        'Never — idling is always efficient',
        'Only when parking overnight',
        'When driving uphill',
      ],
      a: 0,
      source: 'behavior',
      behaviorTag: 'idleRatio',
    },
  },
  {
    category: 'reverseRatio',
    threshold: 0.15,
    question: {
      id: 'b_reverse',
      q: 'You spent over 15% of the drive in reverse. What is a key risk of prolonged reversing?',
      o: [
        'Reduced visibility increases collision risk with pedestrians and objects',
        'It causes the engine to overheat',
        'It wears out the clutch faster',
        'There is no risk if mirrors are used',
      ],
      a: 0,
      source: 'behavior',
      behaviorTag: 'reverseRatio',
    },
  },
  {
    category: 'offRoadCount',
    threshold: 3,
    question: {
      id: 'b_offroad',
      q: 'You drove off-road multiple times. Why should vehicles stay on designated roads?',
      o: [
        'Off-road driving damages infrastructure and endangers pedestrians',
        'Off-road surfaces are faster',
        'It is allowed during low traffic',
        'Only heavy vehicles should stay on roads',
      ],
      a: 0,
      source: 'behavior',
      behaviorTag: 'offRoadCount',
    },
  },
  {
    category: 'totalDistance',
    threshold: 2000,
    question: {
      id: 'b_distance',
      q: 'You covered a long distance this session. What should a driver check before a long drive?',
      o: [
        'Tyre pressure, fuel, oil, lights, and brakes',
        'Only fuel level',
        'Nothing — modern cars handle everything',
        'Only the music system',
      ],
      a: 0,
      source: 'behavior',
      behaviorTag: 'totalDistance',
    },
  },
  {
    category: 'maxSpeed',
    threshold: 80,
    question: {
      id: 'b_max_speed',
      q: 'You reached a very high speed. At high speeds, what happens to a driver\'s field of vision?',
      o: [
        'Peripheral vision narrows significantly (tunnel vision effect)',
        'Vision becomes sharper',
        'Nothing changes',
        'Night vision improves',
      ],
      a: 0,
      source: 'behavior',
      behaviorTag: 'maxSpeed',
    },
  },
  {
    category: 'turnCount',
    threshold: 15,
    question: {
      id: 'b_turns',
      q: 'You made many turns this session. What is the correct procedure before making a turn?',
      o: [
        'Signal early, check mirrors and blind spots, then turn',
        'Turn quickly without signaling',
        'Honk and turn',
        'Close your eyes and turn',
      ],
      a: 0,
      source: 'behavior',
      behaviorTag: 'turnCount',
    },
  },
]

// ──────────────────────────────────────────────
// Public API
// ──────────────────────────────────────────────

/**
 * Shuffle options inside a quiz question (correct answer index changes).
 */
function shuffleQuestion(q: QuizQuestion): QuizQuestion {
  const copy = { ...q, o: [...q.o] }
  const correctAnswer = copy.o[copy.a]
  const rIdx = Math.floor(Math.random() * copy.o.length)
  copy.o[copy.a] = copy.o[rIdx]
  copy.o[rIdx] = correctAnswer
  copy.a = rIdx
  return copy
}

/**
 * Get corrective questions for specific violations the player committed.
 * Returns one question per unique violation tag (deduplicated).
 */
export function getViolationQuestions(violations: string[]): QuizQuestion[] {
  const seen = new Set<string>()
  const result: QuizQuestion[] = []
  for (const tag of violations) {
    if (seen.has(tag)) continue
    seen.add(tag)
    const q = VIOLATION_QUIZ[tag]
    if (q) result.push(shuffleQuestion(q))
  }
  return result
}

/**
 * Generate behavior-based questions (the "20% adaptive" portion).
 * Examines the BehaviorSnapshot telemetry and produces questions
 * for any behavior categories that exceeded their thresholds.
 * Returns at most 2 questions to keep quiz length reasonable.
 */
export function getBehaviorQuestions(snapshot: BehaviorSnapshot): QuizQuestion[] {
  const result: QuizQuestion[] = []
  for (const tmpl of BEHAVIOR_QUESTIONS) {
    const val = snapshot[tmpl.category as keyof BehaviorSnapshot]
    if (typeof val === 'number' && val >= tmpl.threshold) {
      result.push(shuffleQuestion(tmpl.question))
    }
  }
  // Limit to 2 behavior questions max (keeps quiz at ~20% adaptive)
  return result.slice(0, 2)
}

/**
 * Pick N random generic questions from the pool.
 */
export function pickGenericQuestions(count: number, excludeIds?: ReadonlySet<string>): QuizQuestion[] {
  const exclude = excludeIds || new Set<string>()
  const pool = GENERIC_QUIZ.filter(q => !exclude.has(q.id))
  const shuffled = [...pool].sort(() => Math.random() - 0.5)
  return shuffled.slice(0, count).map(shuffleQuestion)
}

/**
 * Assemble the final quiz for a level.
 *
 * Strategy:
 *  - 20% of questions come from behavior telemetry (adaptive, personal)
 *  - If the player committed violations, those corrective questions are injected
 *  - The remaining slots are filled from the generic pool
 *
 * @param totalQuestions  Total questions for this quiz (default 5)
 * @param violations     Array of violation tags from violationsLog
 * @param snapshot       BehaviorSnapshot from BehaviorTracker
 * @param excludeIds     Question IDs to exclude (already answered in this session)
 * @returns Array of QuizQuestion ready for display
 */
export function assembleQuiz(
  totalQuestions: number,
  violations: string[],
  snapshot: BehaviorSnapshot,
  excludeIds?: ReadonlySet<string>,
): QuizQuestion[] {
  const targetAdaptive = Math.max(1, Math.floor(totalQuestions * 0.2)) // ~20%
  const questions: QuizQuestion[] = []
  const usedIds = new Set<string>(excludeIds || [])

  // 1. Behavior questions (up to targetAdaptive)
  const behaviorQs = getBehaviorQuestions(snapshot)
  for (const q of behaviorQs) {
    if (questions.length >= targetAdaptive) break
    if (!usedIds.has(q.id)) {
      questions.push(q)
      usedIds.add(q.id)
    }
  }

  // 2. Violation corrective questions
  const violationQs = getViolationQuestions(violations)
  for (const q of violationQs) {
    if (!usedIds.has(q.id)) {
      questions.push(q)
      usedIds.add(q.id)
    }
  }

  // 3. Fill remaining with generic questions
  const remaining = totalQuestions - questions.length
  if (remaining > 0) {
    const genericQs = pickGenericQuestions(remaining, usedIds)
    for (const q of genericQs) {
      questions.push(q)
      usedIds.add(q.id)
    }
  }

  // Shuffle final order so adaptive questions aren't always first
  return questions.sort(() => Math.random() - 0.5)
}

/**
 * Get a fallback quiz when no behavior data is available.
 * Uses level-specific law data + generic questions.
 */
export function getFallbackQuiz(levelLaw?: { sec: string; fine: string; off: string }): QuizQuestion[] {
  const qs: QuizQuestion[] = []
  if (levelLaw) {
    qs.push(shuffleQuestion({
      id: 'fb_law1',
      q: `What is the primary rule: ${levelLaw.sec}?`,
      o: [levelLaw.sec, 'Speed up', 'Ignore signals', 'Honk loudly'],
      a: 0,
      source: 'generic',
    }))
    qs.push(shuffleQuestion({
      id: 'fb_law2',
      q: `What is the penalty for ${levelLaw.off}?`,
      o: [levelLaw.fine, '₹100', 'No fine', 'Warning'],
      a: 0,
      source: 'generic',
    }))
  }
  // Fill with generic
  const generic = pickGenericQuestions(Math.max(3, 5 - qs.length))
  return [...qs, ...generic]
}
