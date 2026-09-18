import {PermissionsAndroid, Platform} from 'react-native';
import {BleManager, Device, Subscription} from 'react-native-ble-plx';
import {decode as b64decode, encode as b64encode} from 'base-64';

export type RobotCommand='forward'|'backward'|'left'|'right'|'stop';
export type RobotTelemetry={distance:number|null;state:string};

export const SERVICE_UUID='12345678-1234-1234-1234-123456789000';
export const COMMAND_UUID='12345678-1234-1234-1234-123456789001';
export const TELEMETRY_UUID='12345678-1234-1234-1234-123456789002';

const manager=new BleManager();
let elio:Device|null=null;
let telemetrySub:Subscription|null=null;

async function requestBlePermissions(){
  if(Platform.OS!=='android') return true;
  if(Number(Platform.Version)>=31){
    const result=await PermissionsAndroid.requestMultiple([
      PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
      PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
    ]);
    return result[PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN]===PermissionsAndroid.RESULTS.GRANTED &&
      result[PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT]===PermissionsAndroid.RESULTS.GRANTED;
  }
  return (await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION))===PermissionsAndroid.RESULTS.GRANTED;
}

export async function connectToElio(onTelemetry?:(data:RobotTelemetry)=>void):Promise<Device>{
  if(!(await requestBlePermissions())) throw new Error('Bluetooth permission denied');
  const state=await manager.state();
  if(state!=='PoweredOn') throw new Error('Turn Bluetooth on');

  if(elio){
    try{
      if(await elio.isConnected()){
        if(onTelemetry) startTelemetry(onTelemetry);
        return elio;
      }
    }catch{}
  }

  return await new Promise<Device>((resolve,reject)=>{
    let finished=false;
    const timer=setTimeout(()=>{
      if(finished)return; finished=true; manager.stopDeviceScan(); reject(new Error('ELIO not found'));
    },12000);

    manager.startDeviceScan([SERVICE_UUID],null,async(error,device)=>{
      if(finished)return;
      if(error){finished=true;clearTimeout(timer);manager.stopDeviceScan();reject(error);return;}
      if(device && (device.name==='ELIO'||device.localName==='ELIO')){
        finished=true;clearTimeout(timer);manager.stopDeviceScan();
        try{
          elio=await device.connect();
          elio=await elio.discoverAllServicesAndCharacteristics();
          if(onTelemetry) startTelemetry(onTelemetry);
          resolve(elio);
        }catch(e){elio=null;reject(e);}
      }
    });
  });
}

export async function disconnectElio(){
  telemetrySub?.remove(); telemetrySub=null;
  if(elio){try{await manager.cancelDeviceConnection(elio.id);}catch{} }
  elio=null;
}

export async function isElioConnected(){
  try{return !!elio && await elio.isConnected();}catch{return false;}
}

export async function sendRobotCommand(command:RobotCommand){
  if(!elio || !(await isElioConnected())) return false;
  const payload=command.toUpperCase();
  try{
    await elio.writeCharacteristicWithResponseForService(SERVICE_UUID,COMMAND_UUID,b64encode(payload));
    return true;
  }catch{
    try{
      await elio.writeCharacteristicWithoutResponseForService(SERVICE_UUID,COMMAND_UUID,b64encode(payload));
      return true;
    }catch{return false;}
  }
}

function startTelemetry(onTelemetry:(data:RobotTelemetry)=>void){
  if(!elio)return;
  telemetrySub?.remove();
  let last:RobotTelemetry={distance:null,state:'CONNECTED'};
  telemetrySub=elio.monitorCharacteristicForService(SERVICE_UUID,TELEMETRY_UUID,(error,c)=>{
    if(error||!c?.value)return;
    const msg=b64decode(c.value);
    if(msg.startsWith('DISTANCE:')){
      const n=Number(msg.slice(9)); if(Number.isFinite(n)) last={...last,distance:n};
    }else if(msg.startsWith('STATE:')) last={...last,state:msg.slice(6)};
    onTelemetry({...last});
  });
}

export function onElioDisconnected(callback:()=>void){
  if(!elio)return null;
  return manager.onDeviceDisconnected(elio.id,()=>{elio=null;telemetrySub?.remove();telemetrySub=null;callback();});
}
