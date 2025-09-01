// Global navigation service to perform SPA navigation from non-React modules
import type { NavigateFunction } from 'react-router-dom';

let navigateRef: NavigateFunction | null = null;

export function setNavigator(navigate: NavigateFunction) {
  navigateRef = navigate;
}

export function navigateTo(path: string, options?: { replace?: boolean }) {
  if (navigateRef) {
    navigateRef(path, { replace: options?.replace });
  } else {
    // Fallback to full reload if navigator not ready yet
    window.location.href = path;
  }
}

