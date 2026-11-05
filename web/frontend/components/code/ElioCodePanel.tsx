"use client";
import {useEffect,useState} from 'react';
import {isConnected,onTelemetry,type Telemetry} from '@/services/robotBluetooth';
export default function ElioCodePanel(){
 const [online,setOnline]=useState(false);
 const [data,setData]=useState<Telemetry>({distance:null,state:'DISCONNECTED'});
 useEffect(()=>{
  const refresh=()=>setOnline(isConnected());
  const unsubscribe=onTelemetry(v=>{setData(v);refresh()});
  window.addEventListener('elio-ble-state',refresh);
  refresh();
  return()=>{unsubscribe();window.removeEventListener('elio-ble-state',refresh)};
 },[]);
 return <aside className="elioCodePanel">
 <div className="elioPanelHeading"><div><span className="elioPanelEyebrow">YOUR ROBOT</span><h3>ELIO <span className="elioPanelWave">👋</span></h3></div>
 <div className="elioConnectionDot" title={online?'Connected':'Disconnected'} style={{background:online?'#27bd72':'#f56565'}} /></div>
 <div className="elioCodePreview"><div className="elioPreviewBubble elioBubbleOne"/><div className="elioPreviewBubble elioBubbleTwo"/><span className="elioPreviewSparkle elioSparkleOne">✦</span><span className="elioPreviewSparkle elioSparkleTwo">✦</span><img src="/elio-robot-transparent.png" alt="ELIO" draggable="false" /></div>
 <div className={'elioStatusPill '+(online?'':'elioStatusOffline')}><span className="elioStatusDot"/><div><small>STATUS</small><strong>{online?'ELIO connected':'ELIO is offline'}</strong></div></div>
 <div className="elioCodeStats"><div className="elioStatCard"><div className="elioStatIcon">📏</div><div><span>Distance</span><strong>{data.distance===null?'--':data.distance} cm</strong></div></div><div className="elioStatCard"><div className="elioStatIcon">⚡</div><div><span>Connection</span><strong>{online?'BLE':'Offline'}</strong></div></div><div className="elioStatCard"><div className="elioStatIcon">🤖</div><div><span>State</span><strong>{data.state}</strong></div></div></div>
 <div className="elioCodeTip"><span>💡</span><p>{online?'Use Run to execute supported movement blocks.':'Connect ELIO from Robot Control first.'}</p></div></aside>
}
