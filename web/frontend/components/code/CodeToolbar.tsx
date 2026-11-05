"use client";
import {useEffect,useState} from 'react';
import {runProgram,haltProgram,isRunning,clearProgram} from '@/services/codeRunner';
export default function CodeToolbar(){
 const [running,setRunning]=useState(false);
 const [message,setMessage]=useState('');
 useEffect(()=>{const fn=()=>setRunning(isRunning());window.addEventListener('elio-code-state',fn);return()=>window.removeEventListener('elio-code-state',fn)},[]);
 async function act(fn:()=>Promise<unknown>|void){try{setMessage('');await fn()}catch(e){setMessage(e instanceof Error?e.message:String(e))}}
 return <div className="codeToolbar codeToolbarFriendly">
 <div className="codeProjectName"><div className="codeProjectIcon">🧩</div><div><span>PROJECT</span><strong>My ELIO Program</strong>{message&&<small role="alert" style={{display:'block',color:'#d33',maxWidth:350}}>{message}</small>}</div></div>
 <div className="codeToolbarActions">
 <button type="button" className="codeToolButton" disabled={running} onClick={()=>act(clearProgram)}>＋ New</button>
 <button type="button" className="codeToolButton" disabled title="Save is not implemented yet">💾 Save</button>
 <button type="button" className="codeStopButton" onClick={()=>act(haltProgram)}>■ Stop</button>
 <button type="button" className="codeRunButton" disabled={running} onClick={()=>act(runProgram)}>{running?'Running…':'▶ Run'}</button>
 </div></div>
}
