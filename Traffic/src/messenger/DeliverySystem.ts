import * as THREE from 'three';
import { soundManager } from './Audio';
import { MumbaiLandmark, TrafficSignal } from './MumbaiPlanet';

export interface MumbaiQuest {
  id: string;
  title: string;
  pickupId: string;
  destId: string;
  item: string;
  icon: string;
  brief: string;
  stampId: string;
  stampTitle: string;
  rewardCoins: number;
}

export interface StampData {
  id: string;
  title: string;
  icon: string;
  unlocked: boolean;
  desc: string;
}

export class DeliverySystem {
  public quests: MumbaiQuest[] = [
    {
      id: 'quest_1',
      title: 'The 6-Sigma Dabba Express',
      pickupId: 'csmt_station',
      destId: 'marine_drive',
      item: '12 Hot Tiffins (Dabbas)',
      icon: '🍱',
      brief: 'Deliver fresh lunch tiffins from CSMT Station to corporate towers on Marine Drive before lunchtime!',
      stampId: 'dabba_stamp',
      stampTitle: '6-Sigma Dabbawala Stamp',
      rewardCoins: 150
    },
    {
      id: 'quest_2',
      title: 'Urgent Cutting Chai Run',
      pickupId: 'chai_stall',
      destId: 'sealink_toll',
      item: '10 Hot Cutting Chais & Vada Pavs',
      icon: '☕',
      brief: 'Deliver piping hot cutting chai to the maintenance crew at the Bandra-Worli Sea Link toll plaza!',
      stampId: 'chai_stamp',
      stampTitle: 'Cutting Chai Artisan Stamp',
      rewardCoins: 120
    },
    {
      id: 'quest_3',
      title: 'Festive Marigold Garlands',
      pickupId: 'csmt_station',
      destId: 'gateway_of_india',
      item: 'Golden Marigold Flower Garlands',
      icon: '🌸',
      brief: 'Rush fragrant marigold garlands to the Gateway of India to welcome arriving harbor ferry travelers!',
      stampId: 'gateway_stamp',
      stampTitle: 'Gateway of India Seal',
      rewardCoins: 140
    },
    {
      id: 'quest_4',
      title: 'Sunset Chowpatty Snacks',
      pickupId: 'chai_stall',
      destId: 'chowpatty_beach',
      item: 'Crispy Butter Pav & Chutney',
      icon: '🏖️',
      brief: 'Express evening snack drop for sunset watchers relaxing by the Arabian Sea at Chowpatty beach!',
      stampId: 'chowpatty_stamp',
      stampTitle: 'Girgaon Sunset Stamp',
      rewardCoins: 130
    },
    {
      id: 'quest_5',
      title: 'Sea Link Express Circuit',
      pickupId: 'sealink_toll',
      destId: 'marine_drive',
      item: 'Emergency Bridge FastTags',
      icon: '🌉',
      brief: 'High-speed coastal transit from the Sea Link across the Queen’s Necklace!',
      stampId: 'sealink_stamp',
      stampTitle: 'Sea Link Cable Marvel Stamp',
      rewardCoins: 200
    }
  ];

  public stamps: Record<string, StampData> = {
    dabba_stamp: { id: 'dabba_stamp', title: '6-Sigma Dabbawala', icon: '🍱', unlocked: false, desc: 'World-renowned lunch distribution precision.' },
    chai_stamp: { id: 'chai_stamp', title: 'Cutting Chai Master', icon: '☕', unlocked: false, desc: 'Hot, fragrant street tea of Mumbai.' },
    gateway_stamp: { id: 'gateway_stamp', title: 'Gateway of India', icon: '🏛️', unlocked: false, desc: 'The historic ceremonial arch of the Arabian Sea.' },
    chowpatty_stamp: { id: 'chowpatty_stamp', title: 'Girgaon Chowpatty', icon: '🏖️', unlocked: false, desc: 'Golden sands, kulfi, and coastal sunsets.' },
    sealink_stamp: { id: 'sealink_stamp', title: 'Bandra-Worli Sea Link', icon: '🌉', unlocked: false, desc: 'Cable-stayed bridge spanning Mumbai bay.' },
    queens_stamp: { id: 'queens_stamp', title: "Queen's Necklace", icon: '🌊', unlocked: false, desc: 'The glowing coastal arc of Marine Drive.' }
  };

  public currentQuestIndex = 0;
  public totalCoins = 0;
  public safeDriverScore = 100;
  public totalDeliveries = 0;

  private nearSignalCooldown = 0;

  constructor() {}

  public getActiveQuest(): MumbaiQuest {
    return this.quests[this.currentQuestIndex % this.quests.length];
  }

  /**
   * Check if player reached delivery destination
   */
  public checkDestination(playerPos: THREE.Vector3, destPos: THREE.Vector3): boolean {
    const dist = playerPos.distanceTo(destPos);
    return dist < 6.5;
  }

  /**
   * Complete the active delivery
   */
  public completeDelivery(): { quest: MumbaiQuest; coins: number; stampUnlocked: string } {
    const quest = this.getActiveQuest();
    this.totalDeliveries++;
    this.totalCoins += quest.rewardCoins;

    // Unlock stamp
    if (this.stamps[quest.stampId]) {
      this.stamps[quest.stampId].unlocked = true;
    }

    // Play victory fanfare
    soundManager.playDeliverySuccess();

    // Advance to next quest
    this.currentQuestIndex = (this.currentQuestIndex + 1) % this.quests.length;

    return {
      quest,
      coins: quest.rewardCoins,
      stampUnlocked: quest.stampTitle
    };
  }

  /**
   * Check Traffic Signals for Safe Driver points
   */
  public updateTrafficSafety(playerPos: THREE.Vector3, playerSpeed: number, signals: TrafficSignal[], delta: number): string | null {
    if (this.nearSignalCooldown > 0) {
      this.nearSignalCooldown -= delta;
      return null;
    }

    for (const sig of signals) {
      const dist = playerPos.distanceTo(sig.position);
      if (dist < 5.5) {
        if (sig.state === 'RED') {
          if (playerSpeed < 2.0) {
            // Good driver! Stopped at red signal
            this.safeDriverScore += 50;
            this.nearSignalCooldown = 6.0;
            return 'SAFE_STOP';
          } else if (playerSpeed > 10.0) {
            // Ran a red light!
            this.safeDriverScore = Math.max(0, this.safeDriverScore - 25);
            this.nearSignalCooldown = 5.0;
            return 'RED_VIOLATION';
          }
        }
      }
    }
    return null;
  }

  public getRank(): string {
    if (this.totalDeliveries >= 5) return 'Legendary Mumbai Dabbawala 🌟';
    if (this.totalDeliveries >= 3) return 'Master Traffic Hero 🛺';
    if (this.totalDeliveries >= 1) return 'Express Route Scout 🚲';
    return 'Apprentice Courier 📦';
  }
}
