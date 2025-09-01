// global.d.ts（放在 src 或 app 根目录，保证 tsconfig.json 有包含它）
declare namespace YT {
  interface Player {
    playVideo(): void;
    pauseVideo(): void;
    destroy(): void;
  }

  interface PlayerState {
    UNSTARTED: -1;
    ENDED: 0;
    PLAYING: 1;
    PAUSED: 2;
    BUFFERING: 3;
    CUED: 5;
  }

  interface OnStateChangeEvent {
    data: number;
  }

  interface PlayerOptions {
    videoId?: string;
    height?: string | number;
    width?: string | number;
    playerVars?: Record<string, any>;
    events?: {
      onReady?: (event: any) => void;
      onStateChange?: (event: OnStateChangeEvent) => void;
    };
  }

  class Player {
    constructor(elementId: string | HTMLElement, options: PlayerOptions);
  }
}
