/// <reference types="vite/client" />

import type { API } from '../../preload/types';

declare global {
  interface Window {
    electron: {
      ipcRenderer: {
        send: (channel: string, ...args: any[]) => void;
        on: (channel: string, func: (...args: any[]) => void) => void;
        invoke: <T>(channel: string, ...args: any[]) => Promise<T>;
      };
    };
    api: API;
  }
}

export {};
