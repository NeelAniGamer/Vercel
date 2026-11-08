import * as THREE from 'three';
import { soundManager } from './Audio';

export interface DesiEmoji {
  symbol: string;
  label: string;
}

export class EmojiWheel {
  public group: THREE.Group = new THREE.Group();
  public emojis: DesiEmoji[] = [
    { symbol: '🙏', label: 'Namaste' },
    { symbol: '🛺', label: 'Auto' },
    { symbol: '☕', label: 'Cutting Chai' },
    { symbol: '❤️', label: 'Dil Se' },
    { symbol: '🎉', label: 'Balle Balle' },
    { symbol: '🍱', label: 'Dabba Express' },
    { symbol: '⚡', label: 'Speed Rush' }
  ];

  private activeFloatingEmojis: { sprite: THREE.Sprite; velocity: THREE.Vector3; life: number }[] = [];

  constructor() {}

  /**
   * Spawn a floating 3D animated emoji sprite above the player's vehicle
   */
  public triggerEmoji(symbol: string, playerPos: THREE.Vector3, playerNormal: THREE.Vector3) {
    soundManager.playEmotePop();

    // Create Canvas Texture with emoji
    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 128;
    const ctx = canvas.getContext('2d')!;

    // Circle bubble background
    ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
    ctx.beginPath();
    ctx.arc(64, 64, 58, 0, Math.PI * 2);
    ctx.fill();
    ctx.lineWidth = 6;
    ctx.strokeStyle = '#f59e0b'; // Amber outline
    ctx.stroke();

    // Emoji icon
    ctx.font = '64px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(symbol, 64, 68);

    const texture = new THREE.CanvasTexture(canvas);
    const spriteMat = new THREE.SpriteMaterial({ map: texture, transparent: true });
    const sprite = new THREE.Sprite(spriteMat);
    sprite.scale.set(2.4, 2.4, 2.4);

    // Position above player along surface normal
    sprite.position.copy(playerPos).addScaledVector(playerNormal, 3.8);
    this.group.add(sprite);

    this.activeFloatingEmojis.push({
      sprite,
      velocity: playerNormal.clone().multiplyScalar(2.2),
      life: 0.0
    });
  }

  public update(delta: number) {
    for (let i = this.activeFloatingEmojis.length - 1; i >= 0; i--) {
      const item = this.activeFloatingEmojis[i];
      item.life += delta * 0.9;
      item.sprite.position.addScaledVector(item.velocity, delta);

      // Bounce and fade
      const scale = 2.4 * (1.0 + Math.sin(item.life * 6.0) * 0.2);
      item.sprite.scale.set(scale, scale, scale);
      item.sprite.material.opacity = Math.max(0, 1.0 - item.life);

      if (item.life >= 1.0) {
        this.group.remove(item.sprite);
        item.sprite.material.dispose();
        if (item.sprite.material.map) item.sprite.material.map.dispose();
        this.activeFloatingEmojis.splice(i, 1);
      }
    }
  }
}
