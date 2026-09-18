import {useEffect,useRef,useState} from 'react';
import {Alert,Pressable,StyleSheet,Text,View} from 'react-native';
import {C} from '../constants/theme';
import {Title,Sub,Card} from '../components/UI';
import {connectToElio,disconnectElio,onElioDisconnected,RobotCommand,RobotTelemetry,sendRobotCommand} from '../services/robot';

export default function Robot(){
  const [connected,setConnected]=useState(false);
  const [connecting,setConnecting]=useState(false);
  const [telemetry,setTelemetry]=useState<RobotTelemetry>({distance:null,state:'DISCONNECTED'});
  const disconnectSub=useRef<{remove:()=>void}|null>(null);

  useEffect(()=>()=>{disconnectSub.current?.remove();},[]);

  async function connect(){
    if(connecting)return;
    setConnecting(true);
    try{
      await connectToElio(setTelemetry);
      setConnected(true);
      setTelemetry(t=>({...t,state:'CONNECTED'}));
      disconnectSub.current?.remove();
      disconnectSub.current=onElioDisconnected(()=>{
        setConnected(false);setTelemetry({distance:null,state:'DISCONNECTED'});
      });
    }catch(e:any){Alert.alert('ELIO',e?.message||'Could not connect to ELIO');}
    finally{setConnecting(false);}
  }

  async function disconnect(){await sendRobotCommand('stop');await disconnectElio();setConnected(false);setTelemetry({distance:null,state:'DISCONNECTED'});}

  async function go(c:RobotCommand){
    if(!connected){Alert.alert('ELIO','Connect to ELIO first.');return;}
    if(!(await sendRobotCommand(c))) setConnected(false);
  }

  const Move=({x,c}:{x:string;c:RobotCommand})=><Pressable
    onPressIn={()=>go(c)}
    onPressOut={()=>c!=='stop'&&go('stop')}
    style={[s.b,c==='stop'&&s.stop,!connected&&s.disabled]}>
    <Text style={s.bt}>{x}</Text>
  </Pressable>;

  return <View style={s.page}>
    <Title>Robot Control</Title><Sub>Bluetooth control & live telemetry.</Sub>
    <Card>
      <Text style={s.label}>Connection</Text>
      <Text style={[s.status,!connected&&s.off]}>{connected?'Connected to ELIO':'Disconnected'}</Text>
      <Text style={s.dist}>Distance: {telemetry.distance==null?'--':telemetry.distance.toFixed(1)} cm</Text>
      <Text style={s.state}>State: {telemetry.state}</Text>
      <Pressable onPress={connected?disconnect:connect} style={s.connect}>
        <Text style={s.connectText}>{connecting?'Searching for ELIO…':connected?'Disconnect':'Connect to ELIO'}</Text>
      </Pressable>
    </Card>
    <View style={s.pad}>
      <Move x="▲" c="forward"/>
      <View style={s.row}><Move x="◀" c="left"/><Move x="STOP" c="stop"/><Move x="▶" c="right"/></View>
      <Move x="▼" c="backward"/>
    </View>
    <Text style={s.safe}>Hold a direction to move. Releasing it sends STOP. ESP32 safety stops ELIO at 8 cm.</Text>
  </View>;
}

const s=StyleSheet.create({page:{flex:1,backgroundColor:C.bg,padding:22,paddingTop:58,gap:14},label:{color:C.muted},status:{color:C.accent,fontSize:18,fontWeight:'800',marginTop:5},off:{color:C.muted},dist:{color:C.text,marginTop:10,fontWeight:'700'},state:{color:C.muted,marginTop:5},connect:{marginTop:16,paddingVertical:13,borderRadius:16,backgroundColor:C.accent,alignItems:'center'},connectText:{fontWeight:'900',color:C.bg},pad:{alignItems:'center',gap:12,marginTop:20},row:{flexDirection:'row',gap:12},b:{width:78,height:68,borderRadius:22,backgroundColor:C.card2,alignItems:'center',justifyContent:'center',borderWidth:1,borderColor:C.line},stop:{backgroundColor:C.danger,width:90},disabled:{opacity:.45},bt:{color:C.text,fontWeight:'900',fontSize:18},safe:{color:C.muted,textAlign:'center',marginTop:8,lineHeight:20}});
