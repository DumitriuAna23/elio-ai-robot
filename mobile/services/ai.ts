import type { ProjectId } from '../constants/aiProjects';
export type ChatTurn = { role: 'user' | 'assistant'; content: string };
// URL EXPO_PUBLIC_... is public; never put a secret API key here.
const BASE = (process.env.EXPO_PUBLIC_ELIO_API_URL || '').replace(/\/$/, '');
export async function askElio(message: string, project: ProjectId='general', language:'ro'|'en'='ro', history: ChatTurn[]=[]): Promise<string> {
  if (!BASE) throw new Error(language==='ro'?'Configurează EXPO_PUBLIC_ELIO_API_URL în mobile/.env':'Set EXPO_PUBLIC_ELIO_API_URL in mobile/.env');
  const response = await fetch(`${BASE}/api/chat`, { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({message,project,language,history: history.slice(-8)}) });
  if (!response.ok) throw new Error(`${language==='ro'?'Serviciul AI nu este disponibil':'AI service unavailable'} (${response.status})`);
  const data = await response.json();
  if (typeof data.reply!=='string') throw new Error('Invalid response from AI');
  return data.reply;
}
