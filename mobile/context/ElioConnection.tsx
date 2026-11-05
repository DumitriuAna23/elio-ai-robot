import React, {createContext, useCallback, useContext, useEffect, useRef, useState} from 'react';
import {AppState} from 'react-native';
import {connectToElio, disconnectElio, isElioConnected, onElioDisconnected, RobotTelemetry, sendRobotCommand} from '../services/robot';

type Status = {connected:boolean; connecting:boolean; telemetry:RobotTelemetry; reconnect:()=>void; disconnect:()=>Promise<void>};
const Context = createContext<Status | null>(null);
const empty:RobotTelemetry={distance:null,state:'DISCONNECTED'};
export function ElioConnectionProvider({children}:{children:React.ReactNode}) {
 const [connected,setConnected]=useState(false);
 const [connecting,setConnecting]=useState(false);
 const [telemetry,setTelemetry]=useState<RobotTelemetry>(empty);
 const started=useRef(false); const busy=useRef(false); const enabled=useRef(true);
 const disconnectListener=useRef<{remove:()=>void}|null>(null);
 const connect=useCallback(async()=>{
  if(!enabled.current||busy.current||AppState.currentState!=='active')return;
  busy.current=true;setConnecting(true);
  try{
   await connectToElio(setTelemetry);
   if(!enabled.current){await disconnectElio();return;}
   setConnected(true);setTelemetry(v=>({...v,state:v.state==='DISCONNECTED'?'CONNECTED':v.state}));
   disconnectListener.current?.remove();
   disconnectListener.current=onElioDisconnected(()=>{setConnected(false);setTelemetry(empty);});
  }catch(_){setConnected(false);}finally{busy.current=false;setConnecting(false);}
 },[]);
 useEffect(()=>{
  if(started.current)return;
  started.current=true;
  const first=setTimeout(()=>{void connect();},900);
  const retry=setInterval(async()=>{
   if(busy.current||!enabled.current||AppState.currentState!=='active')return;
   const live=await isElioConnected();
   if(!live){setConnected(false);void connect();}
   else setConnected(true);
  },8000);
  const appSub=AppState.addEventListener('change',status=>{
   if(status==='active'&&enabled.current)void connect();
   // Fără mișcare necontrolată când aplicația nu este în prim-plan.
   if(status!=='active')void sendRobotCommand('stop');
  });
  return ()=>{clearTimeout(first);clearInterval(retry);appSub.remove();disconnectListener.current?.remove();void sendRobotCommand('stop');};
 },[connect]);
 const disconnect=useCallback(async()=>{enabled.current=false;await sendRobotCommand('stop');await disconnectElio();disconnectListener.current?.remove();disconnectListener.current=null;setConnected(false);setTelemetry(empty);},[]);
 const reconnect=useCallback(()=>{enabled.current=true;void connect();},[connect]);
 return <Context.Provider value={{connected,connecting,telemetry,reconnect,disconnect}}>{children}</Context.Provider>;
}
export function useElioConnection(){const value=useContext(Context);if(!value)throw new Error('Missing ElioConnectionProvider');return value;}
