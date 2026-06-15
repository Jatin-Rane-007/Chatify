import { useState, useEffect } from 'react';

let isTabBarHidden = false;
const listeners = new Set<() => void>();

export const NavigationStore = {
  subscribe(listener: () => void) {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  },

  notify() {
    listeners.forEach((l) => l());
  },

  isTabBarHidden() {
    return isTabBarHidden;
  },

  setTabBarHidden(val: boolean) {
    if (isTabBarHidden !== val) {
      isTabBarHidden = val;
      this.notify();
    }
  },
};

export function useNavigationStore() {
  const [tabBarHidden, setTabBarHidden] = useState<boolean>(NavigationStore.isTabBarHidden());

  useEffect(() => {
    const handleUpdate = () => {
      setTabBarHidden(NavigationStore.isTabBarHidden());
    };

    const unsubscribe = NavigationStore.subscribe(handleUpdate);
    return () => {
      unsubscribe();
    };
  }, []);

  return {
    tabBarHidden,
    setTabBarHidden: (val: boolean) => NavigationStore.setTabBarHidden(val),
  };
}
