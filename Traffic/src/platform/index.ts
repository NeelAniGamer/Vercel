// @ts-nocheck
/**
 * Platform detection and abstraction
 * Provides a unified API for both Electron and Web environments
 */

export interface PlatformAdapter {
  name: 'electron' | 'web';
  getVersion(): Promise<string>;
  getSavePath(): Promise<string>;
  onMenuAction(callback: (action: string) => void): void;
  isFullscreen(): boolean;
  toggleFullscreen(): void;
  setWindowSize(width: number, height: number): void;
  quit(): void;
}

class WebPlatform implements PlatformAdapter {
  name = 'web' as const;

  async getVersion(): Promise<string> {
    return '1.0.0-web';
  }

  async getSavePath(): Promise<string> {
    return 'localStorage';
  }

  onMenuAction(_callback: (action: string) => void): void {
    // Web has no native menu — handled by in-game UI
  }

  isFullscreen(): boolean {
    return !!document.fullscreenElement;
  }

  toggleFullscreen(): void {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen?.();
    } else {
      document.exitFullscreen?.();
    }
  }

  setWindowSize(_width: number, _height: number): void {
    // Not applicable on web
  }

  quit(): void {
    window.close();
  }
}

class ElectronPlatform implements PlatformAdapter {
  name = 'electron' as const;

  async getVersion(): Promise<string> {
    return window.electron?.getVersion() ?? 'unknown';
  }

  async getSavePath(): Promise<string> {
    return window.electron?.getSavePath() ?? '';
  }

  onMenuAction(callback: (action: string) => void): void {
    window.electron?.onMenuAction(callback);
  }

  isFullscreen(): boolean {
    // TODO: Implement via IPC
    return false;
  }

  toggleFullscreen(): void {
    // TODO: Implement via IPC
  }

  setWindowSize(width: number, height: number): void {
    // TODO: Implement via IPC
  }

  quit(): void {
    // TODO: Implement via IPC
  }
}

export function createPlatform(): PlatformAdapter {
  if (typeof window !== 'undefined' && (window as any).electron) {
    return new ElectronPlatform();
  }
  return new WebPlatform();
}

export const platform = createPlatform();
