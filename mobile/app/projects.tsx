import {useLanguage} from '../context/Language';
import React from 'react';
import {ScrollView,View,Text,StyleSheet} from 'react-native';
import {C} from '../constants/theme';
import {Card,Title,Sub} from '../components/UI';
export default function Page(){const {t}=useLanguage();return <ScrollView style={s.page} contentContainerStyle={s.content}><Title>{t('ELIO Projects')}</Title><Sub>{t('Visual programming workspace')}</Sub>{['📁 Saved programs', '➕ New project'].map(item=><Card key={item}><Text style={s.text}>{t(item)}</Text></Card>)}<Text style={s.note}>{t('This section is a desktop feature preview. Hardware actions and persistent storage are not implemented in the supplied desktop project.')}</Text></ScrollView>}
const s=StyleSheet.create({page:{flex:1,backgroundColor:C.bg},content:{padding:22,paddingTop:55,paddingBottom:120,gap:14},text:{color:C.text,fontSize:19,fontWeight:'800'},note:{color:C.muted,lineHeight:21}});
