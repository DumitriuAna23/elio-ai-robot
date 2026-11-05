import React, {useState} from 'react';
import {Alert, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Switch, Text, TextInput, View} from 'react-native';
import {Ionicons} from '@expo/vector-icons';
import {C} from '../constants/theme';
import {useLanguage} from '../context/Language';
import {useElioConnection} from '../context/ElioConnection';
import {configureElioWifi} from '../services/robot';

export default function Settings() {
  const {language,setLanguage} = useLanguage();
  const {connected} = useElioConnection();
  const ro = language === 'ro';
  const [voice,setVoice] = useState(true);
  const [ssid,setSsid] = useState('');
  const [password,setPassword] = useState('');
  const [showPassword,setShowPassword] = useState(false);
  const [busy,setBusy] = useState(false);
  const tr = (r:string,e:string) => ro?r:e;

  const submit = async () => {
    if (!connected) {
      Alert.alert('ELIO',tr('Conectează mai întâi robotul prin Bluetooth.','Connect ELIO over Bluetooth first.'));
      return;
    }
    if (!ssid.trim() || ssid.trim().length>32 || password.length>63) {
      Alert.alert('ELIO',tr('Introdu un nume Wi-Fi valid și o parolă de maximum 63 de caractere.','Enter a valid Wi-Fi name and a password of at most 63 characters.'));
      return;
    }
    setBusy(true);
    try {
      await configureElioWifi(ssid,password);
      setPassword('');
      Alert.alert('ELIO',tr('Configurația a fost trimisă. Conexiunea Wi-Fi nu este confirmată încă; ESP32 trebuie să raporteze starea rețelei.','Credentials sent. Wi-Fi connection is not confirmed yet; ESP32 must report network status.'));
    } catch(e) {
      Alert.alert(tr('Nu s-a putut configura Wi-Fi','Wi-Fi setup failed'),e instanceof Error?e.message:String(e));
    } finally {setBusy(false);}
  };
  return <KeyboardAvoidingView style={s.page} behavior={Platform.OS==='ios'?'padding':undefined}>
    <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={s.content}>
      <Text style={s.title}>{tr('Setări','Settings')}</Text>
      <View style={s.card}><View style={s.row}><View style={s.flex}><Text style={s.head}>{tr('Limbă','Language')}</Text><Text style={s.muted}>{ro?'Română':'English'}</Text></View><Switch value={!ro} onValueChange={v=>setLanguage(v?'en':'ro')}/></View></View>
      <View style={s.card}><View style={s.row}><View style={s.flex}><Text style={s.head}>{tr('Răspunsuri vocale','Voice responses')}</Text><Text style={s.muted}>{tr('Preferință pentru răspunsuri audio','Audio response preference')}</Text></View><Switch value={voice} onValueChange={setVoice}/></View></View>
      <View style={s.card}>
        <View style={s.row}><Ionicons name="wifi-outline" size={24} color={C.accent}/><Text style={[s.head,s.flex]}>{tr('Wi-Fi ELIO','ELIO Wi-Fi')}</Text></View>
        <Text style={s.muted}>{tr('Schimbă rețeaua când muți robotul la școală, acasă sau la sediu.','Change networks when moving ELIO between locations.')}</Text>
        <Text style={s.muted}>{tr('Bluetooth: ','Bluetooth: ')}{connected?tr('conectat','connected'):tr('deconectat','disconnected')}</Text>
        <Text style={s.label}>{tr('Numele rețelei (SSID)','Network name (SSID)')}</Text>
        <TextInput style={s.input} value={ssid} onChangeText={setSsid} placeholder={tr('Ex. TalesTech','E.g. TalesTech')} placeholderTextColor={C.muted} autoCapitalize="none" autoCorrect={false} maxLength={32}/>
        <Text style={s.label}>{tr('Parolă Wi-Fi','Wi-Fi password')}</Text>
        <View style={s.passwordRow}><TextInput style={[s.input,s.passwordInput]} secureTextEntry={!showPassword} value={password} onChangeText={setPassword} placeholder="••••••••" placeholderTextColor={C.muted} autoCapitalize="none" autoCorrect={false} maxLength={63}/><Pressable onPress={()=>setShowPassword(v=>!v)} accessibilityLabel={tr('Arată/ascunde parola','Show/hide password')} style={s.eye}><Ionicons color={C.text} name={showPassword?'eye-off-outline':'eye-outline'} size={22}/></Pressable></View>
        <Text style={s.note}>{tr('ESP32 folosește Wi-Fi de 2,4 GHz. Parola nu este salvată în aplicație.','ESP32 uses 2.4 GHz Wi-Fi. The password is not saved in the app.')}</Text>
        <Pressable onPress={()=>void submit()} disabled={!connected||busy||!ssid.trim()} style={[s.button,(!connected||busy||!ssid.trim())&&s.disabled]}><Text style={s.buttonText}>{busy?tr('Se trimite...','Sending...'):tr('Trimite noua rețea către ELIO','Send new network to ELIO')}</Text></Pressable>
        <Text style={s.note}>{tr('Necesită firmware ESP32 actualizat cu serviciul BLE de configurare. Trimiterea nu confirmă conectarea la internet.','Requires updated ESP32 firmware with a BLE provisioning characteristic. Sending does not confirm internet access.')}</Text>
      </View>
    </ScrollView>
  </KeyboardAvoidingView>;
}
const s=StyleSheet.create({page:{flex:1,backgroundColor:C.bg},content:{paddingHorizontal:18,paddingTop:100,paddingBottom:45,gap:12},title:{color:C.text,fontWeight:'800',fontSize:26,marginBottom:2},card:{backgroundColor:C.card,borderRadius:20,borderWidth:1,borderColor:C.line,padding:16,gap:11},row:{flexDirection:'row',alignItems:'center',gap:10,justifyContent:'space-between'},flex:{flex:1},head:{color:C.text,fontSize:17,fontWeight:'800'},muted:{color:C.muted,fontSize:13,lineHeight:19},label:{color:C.text,fontSize:14,fontWeight:'700',marginTop:5},input:{backgroundColor:C.bg,borderRadius:12,borderColor:C.line,borderWidth:1,color:C.text,paddingVertical:12,paddingHorizontal:13,fontSize:15},passwordRow:{flexDirection:'row',alignItems:'center'},passwordInput:{flex:1,paddingRight:44},eye:{position:'absolute',right:12,padding:6},note:{fontSize:12,lineHeight:18,color:C.muted},button:{backgroundColor:C.accent,padding:14,borderRadius:14,alignItems:'center'},buttonText:{fontWeight:'800',color:'#08131B'},disabled:{opacity:.45}});
