"use client";
import { useCallback, useEffect, useState } from "react";
import {
  connect as bleConnect,
  disconnect as bleDisconnect,
  isConnected,
  onTelemetry,
  reconnectKnown,
  send,
  supported,
} from "@/services/robotBluetooth";

// Shared Bluetooth state for the mobile screens. The connection itself lives in
// services/robotBluetooth.ts, so it survives page changes (same as desktop).
export function useElio() {
  const [connected, setConnected] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [distance, setDistance] = useState<number | null>(null);
  const [state, setState] = useState("DISCONNECTED");
  const [available, setAvailable] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setAvailable(supported());
    const off = onTelemetry((t) => {
      setDistance(t.distance);
      setState(t.state);
      setConnected(t.state !== "DISCONNECTED" && isConnected());
    });
    void reconnectKnown().catch(() => {});
    return off;
  }, []);

  // Must be called directly from a tap (browser rule for Bluetooth pairing).
  const connect = useCallback(async () => {
    if (connecting) return;
    setError(null);
    setConnecting(true);
    try {
      await bleConnect();
      setConnected(true);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      // User closing the device picker is not an error worth showing.
      if (!/cancel|chosen|selected/i.test(msg)) setError(msg);
    } finally {
      setConnecting(false);
    }
  }, [connecting]);

  const disconnect = useCallback(async () => {
    await bleDisconnect().catch(() => {});
    setConnected(false);
  }, []);

  const command = useCallback(async (payload: string) => {
    if (!isConnected()) return false;
    try { return await send(payload); } catch { return false; }
  }, []);

  return { connected, connecting, distance, state, available, error, connect, disconnect, command };
}
