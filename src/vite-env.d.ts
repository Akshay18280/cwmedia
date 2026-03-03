/// <reference types="vite/client" />

declare global {
  interface Window {
    hideLoadingScreen?: () => void;
  }
}
