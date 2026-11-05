import {
  PermissionsAndroid,
  Platform,
} from 'react-native';

import {
  BleManager,
  Device,
  Subscription,
} from 'react-native-ble-plx';

import {
  decode as b64decode,
  encode as b64encode,
} from 'base-64';

export type RobotCommand =
  | 'forward'
  | 'backward'
  | 'left'
  | 'right'
  | 'stop';

export type RobotTelemetry = {
  distance: number | null;
  state: string;
};

export const SERVICE_UUID =
  '12345678-1234-1234-1234-123456789000';

export const COMMAND_UUID =
  '12345678-1234-1234-1234-123456789001';

export const TELEMETRY_UUID =
  '12345678-1234-1234-1234-123456789002';

const manager = new BleManager();

let elio: Device | null = null;
let telemetrySub: Subscription | null = null;


// ==========================================
// PERMISIUNI BLUETOOTH
// ==========================================

async function requestBlePermissions() {
  if (Platform.OS !== 'android') {
    return true;
  }

  if (Number(Platform.Version) >= 31) {
    const result =
      await PermissionsAndroid.requestMultiple([
        PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
        PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
      ]);

    return (
      result[
        PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN
      ] === PermissionsAndroid.RESULTS.GRANTED &&
      result[
        PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT
      ] === PermissionsAndroid.RESULTS.GRANTED
    );
  }

  return (
    await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION
    )
  ) === PermissionsAndroid.RESULTS.GRANTED;
}


// ==========================================
// CONNECT
// ==========================================

export async function connectToElio(
  onTelemetry?: (data: RobotTelemetry) => void
): Promise<Device> {
  if (!(await requestBlePermissions())) {
    throw new Error('Bluetooth permission denied');
  }

  const state = await manager.state();

  if (state !== 'PoweredOn') {
    throw new Error('Turn Bluetooth on');
  }

  // Dacă există deja o conexiune validă,
  // o reutilizăm.
  if (elio) {
    try {
      if (await elio.isConnected()) {
        if (onTelemetry) {
          startTelemetry(onTelemetry);
        }

        return elio;
      }
    } catch {
      elio = null;
    }
  }

  return await new Promise<Device>(
    (resolve, reject) => {
      let finished = false;

      const timer = setTimeout(() => {
        if (finished) return;

        finished = true;

        manager.stopDeviceScan();

        reject(
          new Error('ELIO not found')
        );
      }, 12000);

      manager.startDeviceScan(
        [SERVICE_UUID],
        null,
        async (error, device) => {
          if (finished) return;

          if (error) {
            finished = true;

            clearTimeout(timer);

            manager.stopDeviceScan();

            reject(error);

            return;
          }

          if (
            device &&
            (
              device.name === 'ELIO' ||
              device.localName === 'ELIO'
            )
          ) {
            finished = true;

            clearTimeout(timer);

            manager.stopDeviceScan();

            try {
              elio =
                await device.connect();

              elio =
                await elio.discoverAllServicesAndCharacteristics();

              if (onTelemetry) {
                startTelemetry(
                  onTelemetry
                );
              }

              resolve(elio);
            } catch (error) {
              elio = null;

              reject(error);
            }
          }
        }
      );
    }
  );
}


// ==========================================
// DISCONNECT
// ==========================================

export async function disconnectElio() {
  telemetrySub?.remove();

  telemetrySub = null;

  const device = elio;

  if (!device) {
    elio = null;
    return;
  }

  try {
    const connected =
      await device.isConnected();

    if (connected) {
      await manager.cancelDeviceConnection(
        device.id
      );
    }
  } catch (error) {
    console.log(
      'ELIO disconnect error:',
      error
    );
  } finally {
    elio = null;
  }
}


// ==========================================
// CONNECTION STATE
// ==========================================

export async function isElioConnected() {
  try {
    return (
      !!elio &&
      await elio.isConnected()
    );
  } catch {
    return false;
  }
}


// ==========================================
// RAW COMMAND
// ==========================================

async function writeCommand(
  payload: string
) {
  if (
    !elio ||
    !(await isElioConnected())
  ) {
    return false;
  }

  const encoded =
    b64encode(payload);

  // Pentru controlul motoarelor vrem latență mică.
  // Încercăm întâi WRITE WITHOUT RESPONSE.
  try {
    await elio.writeCharacteristicWithoutResponseForService(
      SERVICE_UUID,
      COMMAND_UUID,
      encoded
    );

    return true;
  } catch {
    // Dacă nu merge, folosim WRITE WITH RESPONSE.
    try {
      await elio.writeCharacteristicWithResponseForService(
        SERVICE_UUID,
        COMMAND_UUID,
        encoded
      );

      return true;
    } catch {
      return false;
    }
  }
}


// ==========================================
// DIRECȚIE / STOP
// ==========================================

export async function sendRobotCommand(
  command: RobotCommand
) {
  return await writeCommand(
    command.toUpperCase()
  );
}


// ==========================================
// SPEED
// ==========================================

export async function sendRobotSpeed(
  speed: number
) {
  const safeSpeed =
    Math.max(
      0,
      Math.min(
        100,
        Math.round(speed)
      )
    );

  return await writeCommand(
    `SPEED:${safeSpeed}`
  );
}


// ==========================================
// TELEMETRIE
// ==========================================

function startTelemetry(
  onTelemetry: (
    data: RobotTelemetry
  ) => void
) {
  if (!elio) return;

  telemetrySub?.remove();

  let last: RobotTelemetry = {
    distance: null,
    state: 'CONNECTED',
  };

  telemetrySub =
    elio.monitorCharacteristicForService(
      SERVICE_UUID,
      TELEMETRY_UUID,
      (
        error,
        characteristic
      ) => {
        if (
          error ||
          !characteristic?.value
        ) {
          return;
        }

        const msg =
          b64decode(
            characteristic.value
          );

        if (
          msg.startsWith(
            'DISTANCE:'
          )
        ) {
          const n =
            Number(
              msg.slice(9)
            );

          if (
            Number.isFinite(n)
          ) {
            last = {
              ...last,
              distance: n,
            };
          }
        }

        else if (
          msg.startsWith(
            'STATE:'
          )
        ) {
          last = {
            ...last,
            state:
              msg.slice(6),
          };
        }

        onTelemetry({
          ...last,
        });
      }
    );
}


// ==========================================
// LISTENER DE DECONECTARE
// ==========================================

export function onElioDisconnected(
  callback: () => void
) {
  if (!elio) {
    return null;
  }

  return manager.onDeviceDisconnected(
    elio.id,
    () => {
      elio = null;

      telemetrySub?.remove();

      telemetrySub = null;

      callback();
    }
  );
}

// Requires ESP32 firmware implementing a writable BLE characteristic 9003.
// Never log the Wi-Fi password or persist it in the phone app.
export const WIFI_CONFIG_UUID = '12345678-1234-1234-1234-123456789003';
export async function configureElioWifi(ssid: string, password: string): Promise<void> {
  if (!ssid.trim() || ssid.length > 32 || password.length > 63) {
    throw new Error('Invalid Wi-Fi name or password length');
  }
  if (!elio || !(await isElioConnected())) {
    throw new Error('Connect ELIO over Bluetooth first');
  }
  // BLE default MTU is often too small for an arbitrary JSON payload;
  // request a larger MTU and verify the negotiated value.
  const device = await elio.requestMTU(185);
  const payload = JSON.stringify({ssid: ssid.trim(), password});
  const byteLength = unescape(encodeURIComponent(payload)).length;
  if (byteLength > 180) {
    throw new Error('Wi-Fi credentials too long for this BLE protocol');
  }
  await device.writeCharacteristicWithResponseForService(
    SERVICE_UUID, WIFI_CONFIG_UUID, b64encode(unescape(encodeURIComponent(payload)))
  );
  // GATT acknowledgement means the characteristic was written, not that
  // Wi-Fi successfully connected. Firmware must report its Wi-Fi status.
}
