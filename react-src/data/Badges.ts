/** Badge definitions — ported from course.js lines 1-19 */

export interface Badge {
  id: string
  name: string
  icon: string
  desc: string
}

export const BADGES: Badge[] = [
  { id: 'roadMaster', name: 'Road Master', icon: 'road', desc: 'Complete all basic driving levels' },
  { id: 'nightRider', name: 'Night Rider', icon: 'moon', desc: 'Complete all night driving levels' },
  { id: 'rainMaster', name: 'Rain Master', icon: 'rain', desc: 'Complete all rain driving levels' },
  { id: 'ecoDriver', name: 'Eco Driver', icon: 'leaf', desc: 'Complete all eco-driving levels' },
  { id: 'parkingExpert', name: 'Parking Expert', icon: 'parking', desc: 'Complete all parking levels' },
  { id: 'highwayPro', name: 'Highway Pro', icon: 'highway', desc: 'Complete all highway levels' },
  { id: 'cityExpert', name: 'City Expert', icon: 'city', desc: 'Complete all city driving levels' },
  { id: 'safetyChampion', name: 'Safety Champion', icon: 'shield', desc: 'Complete all safety levels' },
  { id: 'pedestrianPro', name: 'Pedestrian Pro', icon: 'pedestrian', desc: 'Complete all pedestrian levels' },
  { id: 'autoRickshawKing', name: 'Auto Rickshaw King', icon: 'auto', desc: 'Complete all auto-rickshaw levels' },
  { id: 'busDriver', name: 'Bus Driver', icon: 'bus', desc: 'Complete all bus driving levels' },
  { id: 'truckMaster', name: 'Truck Master', icon: 'truck', desc: 'Complete all truck driving levels' },
  { id: 'emergencyResponder', name: 'Emergency Responder', icon: 'alert', desc: 'Complete all emergency vehicle levels' },
  { id: 'drivingLegend', name: 'Driving Legend', icon: 'trophy', desc: 'Complete all levels' },
  { id: 'perfectScore', name: 'Perfect Score', icon: 'star', desc: 'Get perfect score on any level' },
  { id: 'streakMaster', name: 'Streak Master', icon: 'flame', desc: 'Complete 10 levels without failing' },
]

/** Quick lookup by id */
export const BADGE_MAP: Record<string, Badge> = Object.fromEntries(
  BADGES.map((b) => [b.id, b])
)
