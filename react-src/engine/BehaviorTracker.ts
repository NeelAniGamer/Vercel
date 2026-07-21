/**
 * BehaviorTracker — Observes player driving behaviour each frame and
 * accumulates telemetry for the adaptive quiz system (CorrectiveQuiz.ts).
 *
 * Call `tracker.update(dt, frameState)` every frame with the current
 * velocity, position, heading, and input state. When the level ends,
 * call `tracker.snapshot()` to get a frozen summary.
 */

// ──────────────────────────────────────────────
// Types
// ──────────────────────────────────────────────

export interface FrameState {
  /** Current vehicle speed (world units / sec, NOT km/h) */
  speed: number
  /** Current world position */
  position: { x: number; z: number }
  /** Current heading in radians */
  heading: number
  /** Whether the player is currently in a vehicle */
  inVehicle: boolean
  /** Currently pressed keys for detecting turns */
  keys: Record<string, boolean>
  /** Whether the player is currently reversing */
  isReversing: boolean
  /** Current road bounds (optional — for off-road detection) */
  roadBounds?: { minX: number; maxX: number; minZ: number; maxZ: number }
  /** Speed limit for the current road (world units/sec) */
  speedLimit?: number
}

export interface BehaviorSnapshot {
  /** Percentage of time spent above the speed limit (0-1) */
  speedingRatio: number
  /** Number of harsh braking events (sudden speed drops) */
  harshBrakeCount: number
  /** Number of harsh acceleration events (sudden speed spikes) */
  harshAccelCount: number
  /** Percentage of time idle / nearly stopped (0-1) */
  idleRatio: number
  /** Percentage of time in reverse gear (0-1) */
  reverseRatio: number
  /** Number of times the vehicle went off-road */
  offRoadCount: number
  /** Total distance travelled (world units) */
  totalDistance: number
  /** Peak speed reached (world units/sec) */
  maxSpeed: number
  /** Number of distinct turns (heading changes > 30 deg) */
  turnCount: number
  /** Average speed (world units/sec) */
  avgSpeed: number
  /** Total elapsed time (seconds) */
  totalTime: number
}

// ──────────────────────────────────────────────
// Implementation
// ──────────────────────────────────────────────

export class BehaviorTracker {
  private _frameCount = 0

  // Accumulators
  private _totalTime = 0
  private _totalDistance = 0
  private _speedSum = 0
  private _maxSpeed = 0
  private _speedingFrames = 0
  private _idleFrames = 0
  private _reverseFrames = 0
  private _offRoadEvents = 0
  private _harshBrakeEvents = 0
  private _harshAccelEvents = 0
  private _turnEvents = 0

  // Previous-frame state for derivative detection
  private _prevSpeed = 0
  private _prevHeading = 0
  private _initialized = false

  // Tuning constants
  private static readonly HARSH_BRAKE_THRESHOLD = -15   // speed drop per second
  private static readonly HARSH_ACCEL_THRESHOLD = 20    // speed rise per second
  private static readonly TURN_THRESHOLD = 0.52         // ~30 degrees in radians
  private static readonly IDLE_SPEED_THRESHOLD = 0.5    // world units/sec
  private static readonly SPEEDING_MARGIN = 1.0         // world units/sec above limit
  private static readonly OFF_ROAD_MARGIN = 20          // how far from road center is "off-road"

  /**
   * Update with current frame data. Call once per frame.
   */
  update(dt: number, state: FrameState): void {
    if (dt <= 0 || dt > 0.5) return // skip garbage dt values

    this._totalTime += dt
    this._frameCount++

    if (!this._initialized) {
      this._prevSpeed = state.speed
      this._prevHeading = state.heading
      this._initialized = true
      return
    }

    const absSpeed = Math.abs(state.speed)
    this._speedSum += absSpeed
    if (absSpeed > this._maxSpeed) this._maxSpeed = absSpeed

    // Distance
    this._totalDistance += absSpeed * dt

    // Speeding
    const limit = state.speedLimit ?? 27.8 // default ~100 km/h in world units
    if (absSpeed > limit + this.SPEEDING_MARGIN) {
      this._speedingFrames++
    }

    // Idle
    if (absSpeed < this.IDLE_SPEED_THRESHOLD) {
      this._idleFrames++
    }

    // Reverse
    if (state.isReversing || (state.speed < -this.IDLE_SPEED_THRESHOLD)) {
      this._reverseFrames++
    }

    // Harsh brake / accel (speed derivative)
    const speedDelta = (state.speed - this._prevSpeed) / dt
    if (speedDelta < this.HARSH_BRAKE_THRESHOLD) {
      this._harshBrakeEvents++
    }
    if (speedDelta > this.HARSH_ACCEL_THRESHOLD) {
      this._harshAccelEvents++
    }

    // Turn detection (heading change)
    let headingDelta = state.heading - this._prevHeading
    // Normalize to [-PI, PI]
    while (headingDelta > Math.PI) headingDelta -= 2 * Math.PI
    while (headingDelta < -Math.PI) headingDelta += 2 * Math.PI
    if (Math.abs(headingDelta) > this.TURN_THRESHOLD) {
      this._turnEvents++
    }

    // Off-road detection (simple: if position is far from any axis-aligned road line)
    // This is a lightweight heuristic — we check if the player is more than
    // OFF_ROAD_MARGIN units away from any road center.
    // For a more accurate check, we'd need the full road list — but this heuristic
    // works well for grid-based layouts.
    if (state.inVehicle && this._isLikelyOffRoad(state)) {
      this._offRoadEvents++
    }

    this._prevSpeed = state.speed
    this._prevHeading = state.heading
  }

  /**
   * Simple off-road heuristic for grid-based layouts.
   * Returns true if the position is far from a grid line (±OFF_ROAD_MARGIN).
   */
  private _isLikelyOffRoad(state: FrameState): boolean {
    const { x, z } = state.position
    const m = BehaviorTracker.OFF_ROAD_MARGIN

    // Check if we're near a grid axis line (x = multiple of 120, or z = multiple of 120)
    // Standard grid spacing is 120 world units
    const gridSpacing = 120
    const nearVertical = Math.abs(((x % gridSpacing) + gridSpacing) % gridSpacing) < m ||
                         Math.abs(((x % gridSpacing) + gridSpacing) % gridSpacing - gridSpacing) < m
    const nearHorizontal = Math.abs(((z % gridSpacing) + gridSpacing) % gridSpacing) < m ||
                           Math.abs(((z % gridSpacing) + gridSpacing) % gridSpacing - gridSpacing) < m

    return !nearVertical && !nearHorizontal
  }

  /**
   * Generate a frozen snapshot of accumulated behavior data.
   * Call this when the level ends to feed into CorrectiveQuiz.
   */
  snapshot(): BehaviorSnapshot {
    const frames = Math.max(1, this._frameCount)
    return {
      speedingRatio: this._totalTime > 0 ? this._speedingFrames / frames : 0,
      harshBrakeCount: this._harshBrakeEvents,
      harshAccelCount: this._harshAccelEvents,
      idleRatio: this._totalTime > 0 ? this._idleFrames / frames : 0,
      reverseRatio: this._totalTime > 0 ? this._reverseFrames / frames : 0,
      offRoadCount: Math.floor(this._offRoadEvents / 2), // debounce: 2-frame window
      totalDistance: this._totalDistance,
      maxSpeed: this._maxSpeed,
      turnCount: this._turnEvents,
      avgSpeed: this._totalTime > 0 ? this._speedSum / frames : 0,
      totalTime: this._totalTime,
    }
  }

  /**
   * Reset all accumulators for a new level.
   */
  reset(): void {
    this._frameCount = 0
    this._totalTime = 0
    this._totalDistance = 0
    this._speedSum = 0
    this._maxSpeed = 0
    this._speedingFrames = 0
    this._idleFrames = 0
    this._reverseFrames = 0
    this._offRoadEvents = 0
    this._harshBrakeEvents = 0
    this._harshAccelEvents = 0
    this._turnEvents = 0
    this._prevSpeed = 0
    this._prevHeading = 0
    this._initialized = false
  }
}
