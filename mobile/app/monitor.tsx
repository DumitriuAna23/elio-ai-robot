import React from 'react';
import {ScrollView,Text,View,StyleSheet,Pressable,Alert} from 'react-native';
import {C} from '../constants/theme';import {Card,Title,Sub} from '../components/UI';
import {useElioConnection} from '../context/ElioConnection';
import {useLanguage} from '../context/Language';import {sendRobotCommand} from '../services/robot';
export default function Monitor(){const b=useElioConnection();const {t}=useLanguage();return <ScrollView style={s.page} contentContainerStyle={s.content}>
<Title>{t('ELIO Monitor')}</Title><Sub>{t('Bluetooth, sensors and safety')}</Sub>
<Card><Text style={s.label}>{t('Bluetooth status')}</Text><Text style={[s.value,{color:b.connected?C.accent:C.danger}]}>{b.connected?t('● Connected to ELIO'):b.connecting?t('◌ Searching for ELIO…'):t('○ Disconnected')}</Text>
<Pressable style={s.button} onPress={()=>b.connected?Alert.alert('ELIO',t('Disconnect from ELIO?'),[{text:t('Cancel')},{text:t('Disconnect'),onPress:()=>{void b.disconnect();}}]):b.reconnect()}><Text style={s.buttonText}>{b.connected?t('Disconnect'):t('Connect / Retry')}</Text></Pressable></Card>
<Card><Text style={s.label}>{t('Ultrasonic sensor')}</Text><Text style={s.big}>{b.telemetry.distance===null?'—':b.telemetry.distance.toFixed(1)+' cm'}</Text><Text style={s.label}>{t('Distance from obstacle')}</Text></Card>
<Card><Text style={s.label}>{t('Robot state')}</Text><Text style={s.value}>{b.telemetry.state}</Text></Card>
<Card><Text style={s.label}>{t('Emergency stop')}</Text><Pressable style={[s.button,{backgroundColor:C.danger}]} onPress={()=>{void sendRobotCommand('stop');}}><Text style={s.buttonText}>{t('■ STOP MOTORS')}</Text></Pressable></Card>
<Card><Text style={s.label}>{t('Safety')}</Text><Text style={s.desc}>{t('Stop movement when leaving the joystick screen. BLE remains connected.')}</Text></Card></ScrollView>}
const s=StyleSheet.create({page:{flex:1,backgroundColor:C.bg},content:{padding:22,paddingTop:58,paddingBottom:110,gap:14},label:{color:C.muted,fontSize:13,fontWeight:'700'},value:{color:C.text,fontSize:20,fontWeight:'800',marginTop:10},big:{color:C.accent,fontSize:38,fontWeight:'900',marginTop:12},button:{backgroundColor:C.card2,padding:16,borderRadius:16,alignItems:'center',marginTop:14},buttonText:{color:C.text,fontWeight:'800'},desc:{color:C.text,lineHeight:22,marginTop:10}});
