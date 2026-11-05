"use client";
import { useEffect } from 'react';
import { keepConnected, stopAutoReconnect, stopRobot } from '@/services/robotBluetooth';
export default function ElioBluetoothKeeper() {
  useEffect(() => {
    keepConnected();
    const onHidden = () => { if (document.visibilityState === 'hidden') void stopRobot().catch(() => {}); };
    document.addEventListener('visibilitychange', onHidden);
    return () => {
      document.removeEventListener('visibilitychange', onHidden);
      stopAutoReconnect();
      void stopRobot().catch(() => {});
    };
  }, []);
  return null;
}
