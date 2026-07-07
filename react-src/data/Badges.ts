/** Badge definitions — ported from course.js lines 1-19 */

export interface Badge {
  id: string
  name: string
  icon: string
  desc: string
}

export const BADGES: Badge[] = [
  { id: 'roadMaster', name: 'Road Master', icon: '🛣️', desc: 'Complete all basic driving levels' },
  { id: 'nightRider', name: 'Night Rider', icon: '🌙', desc: 'Complete all night driving levels' },
  { id: 'rainMaster', name: 'Rain Master', icon: '🌧️', desc: 'Complete all rain driving levels' },
  { id: 'ecoDriver', name: 'Eco Driver', icon: '🌱', desc: 'Complete all eco-driving levels' },
  { id: 'parkingExpert', name: 'Parking Expert', icon: '🅿️', desc: 'Complete all parking levels' },
  { id: 'highwayPro', name: 'Highway Pro', icon: '🛣️', desc: 'Complete all highway levels' },
  { id: 'cityExpert', name: 'City Expert', icon: '🏙️', desc: 'Complete all city driving levels' },
  { id: 'safetyChampion', name: 'Safety Champion', icon: '🛡️', desc: 'Complete all safety levels' },
  { id: 'pedestrianPro', name: 'Pedestrian Pro', icon: '🚶', desc: 'Complete all pedestrian levels' },
  { id: 'autoRickshawKing', name: 'Auto Rickshaw King', icon: '🛺', desc: 'Complete all auto-rickshaw levels' },
  { id: 'busDriver', name: 'Bus Driver', icon: '🚌', desc: 'Complete all bus driving levels' },
  { id: 'truckMaster', name: 'Truck Master', icon: '🚛', desc: 'Complete all truck driving levels' },
  { id: 'emergencyResponder', name: 'Emergency Responder', icon: '🚨', desc: 'Complete all emergency vehicle levels' },
  { id: 'drivingLegend', name: 'Driving Legend', icon: '🏆', desc: 'Complete all levels' },
  { id: 'perfectScore', name: 'Perfect Score', icon: '⭐', desc: 'Get perfect score on any level' },
  { id: 'streakMaster', name: 'Streak Master', icon: '🔥', desc: 'Complete 10 levels without failing' },
]

/** Quick lookup by id */
export const BADGE_MAP: Record<string, Badge> = Object.fromEntries(
  BADGES.map((b) => [b.id, b])
)
