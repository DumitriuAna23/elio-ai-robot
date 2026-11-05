import React,{useState} from 'react';
import {ActivityIndicator,Alert,KeyboardAvoidingView,Platform,Pressable,ScrollView,StyleSheet,Text,TextInput,View} from 'react-native';
import {ExpoSpeechRecognitionModule,useSpeechRecognitionEvent} from 'expo-speech-recognition';
import {C} from '../constants/theme';
import {useLanguage} from '../context/Language';
import {projects,type ProjectId} from '../constants/aiProjects';
import {askElio,type ChatTurn} from '../services/ai';

export default function Assistant(){
 const {language}=useLanguage();const ro=language==='ro';
 const [project,setProject]=useState<ProjectId>('general');const [draft,setDraft]=useState('');
 const [history,setHistory]=useState<ChatTurn[]>([]);const [loading,setLoading]=useState(false);const [listening,setListening]=useState(false);
 useSpeechRecognitionEvent('result',e=>{const text=e.results?.[0]?.transcript;if(text)setDraft(text);});
 useSpeechRecognitionEvent('end',()=>setListening(false));
 useSpeechRecognitionEvent('error',e=>{setListening(false);Alert.alert('Microfon',String(e.message||e.error));});
 async function startVoice(){try{if(listening){ExpoSpeechRecognitionModule.stop();return;}const p=await ExpoSpeechRecognitionModule.requestPermissionsAsync();if(!p.granted){Alert.alert('Microfon',ro?'Permisiunea microfonului este necesară.':'Microphone permission is required.');return;}setListening(true);ExpoSpeechRecognitionModule.start({lang:ro?'ro-RO':'en-US',interimResults:false,continuous:false});}catch(e){setListening(false);Alert.alert('Microfon',String(e));}}
 async function send(){const question=draft.trim();if(!question||loading)return;const prior=history;setDraft('');setHistory(h=>[...h,{role:'user',content:question}]);setLoading(true);try{const answer=await askElio(question,project,language,prior);setHistory(h=>[...h,{role:'assistant',content:answer}]);}catch(e){setHistory(h=>[...h,{role:'assistant',content:ro?'Nu pot contacta serviciul AI. Verifică internetul și adresa backendului.':'Cannot reach the AI service. Check internet and backend URL.'}]);Alert.alert('ELIO',String(e));}finally{setLoading(false);}}
 const current=projects.find(p=>p.id===project)!;
 return <KeyboardAvoidingView style={s.page} behavior={Platform.OS==='ios'?'padding':undefined}>
  <View style={s.header}><Text style={s.title}>{ro?'Asistentul ELIO':'ELIO Assistant'}</Text><Text style={s.subtitle}>{ro?'Întreabă prin voce sau text':'Ask by voice or text'}</Text></View>
  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.projectList} contentContainerStyle={s.projectContent}>{projects.map(p=><Pressable key={p.id} onPress={()=>{if(listening)ExpoSpeechRecognitionModule.stop();setProject(p.id);setHistory([]);}} style={[s.pill,project===p.id&&s.selected]}><Text style={[s.pillText,project===p.id&&s.selectedText]}>{ro?p.ro:p.en}</Text></Pressable>)}</ScrollView>
  <ScrollView style={s.messages} contentContainerStyle={s.messageContent} keyboardShouldPersistTaps="handled">
   {history.length===0&&<View style={s.note}><Text style={s.text}>{ro?'ELIO îți explică pas cu pas. Alege un proiect și întreabă-l ce vrei să înțelegi.':'ELIO explains step by step. Select a project and ask what you want to understand.'}</Text><Pressable onPress={()=>setDraft(ro?current.exampleRo:current.exampleEn)}><Text style={s.example}>{ro?current.exampleRo:current.exampleEn}</Text></Pressable></View>}
   {history.map((m,i)=><View key={i} style={[s.bubble,m.role==='user'&&s.userBubble]}><Text style={s.text}>{m.content}</Text></View>)}
   {loading&&<ActivityIndicator color={C.accent}/>}
  </ScrollView>
  <View style={s.composer}><Pressable accessibilityLabel={ro?'Înregistrează întrebare':'Record question'} onPress={startVoice} style={[s.mic,listening&&s.micActive]}><Text style={s.micLabel}>{listening?'■':'🎙'}</Text></Pressable><TextInput style={s.input} multiline value={draft} onChangeText={setDraft} placeholder={ro?'Întreabă-l pe ELIO...':'Ask ELIO...'} placeholderTextColor={C.muted}/><Pressable disabled={loading||!draft.trim()} onPress={send} style={s.send}><Text style={s.sendLabel}>➤</Text></Pressable></View>
  <Text style={s.footer}>{ro?'AI educațional • nu controlează automat robotul':'Educational AI • does not automatically control the robot'}</Text>
 </KeyboardAvoidingView>;
}
const s=StyleSheet.create({page:{flex:1,backgroundColor:C.bg},header:{paddingHorizontal:18,paddingTop:52,paddingBottom:10},title:{color:C.text,fontWeight:'800',fontSize:24},subtitle:{color:C.muted,fontSize:13,marginTop:4},projectList:{flexGrow:0,maxHeight:55},projectContent:{gap:8,paddingHorizontal:16,paddingVertical:8},pill:{paddingHorizontal:13,paddingVertical:10,borderRadius:16,backgroundColor:C.card},selected:{backgroundColor:C.accent},pillText:{color:C.text,fontWeight:'700',fontSize:12},selectedText:{color:C.bg},messages:{flex:1},messageContent:{padding:16,gap:10},note:{padding:18,borderRadius:18,backgroundColor:C.card,gap:12},bubble:{padding:14,borderRadius:17,backgroundColor:C.card,maxWidth:'90%'},userBubble:{alignSelf:'flex-end',backgroundColor:C.card2},text:{color:C.text,lineHeight:21},example:{color:C.accent,fontWeight:'700'},composer:{padding:10,flexDirection:'row',alignItems:'center',gap:8,borderTopWidth:1,borderColor:C.line},mic:{backgroundColor:C.card,padding:13,borderRadius:14},micActive:{backgroundColor:C.danger},micLabel:{fontSize:21,color:C.text},input:{backgroundColor:C.card,flex:1,borderRadius:14,padding:11,color:C.text,maxHeight:100},send:{backgroundColor:C.accent,padding:13,borderRadius:14},sendLabel:{fontSize:18,color:C.bg},footer:{textAlign:'center',fontSize:10,color:C.muted,paddingBottom:8}});
