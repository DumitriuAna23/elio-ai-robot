import React from 'react';
import {Pressable,StyleSheet,Text,View} from 'react-native';
import {C} from '../constants/theme';
export function Card({children}:{children:React.ReactNode}){return <View style={s.card}>{children}</View>}
export function Button({title,onPress,danger=false}:{title:string,onPress?:()=>void,danger?:boolean}){return <Pressable onPress={onPress} style={[s.btn,danger&&s.danger]}><Text style={s.bt}>{title}</Text></Pressable>}
export function Title({children}:{children:React.ReactNode}){return <Text style={s.title}>{children}</Text>}
export function Sub({children}:{children:React.ReactNode}){return <Text style={s.sub}>{children}</Text>}
const s=StyleSheet.create({card:{backgroundColor:C.card,borderRadius:24,padding:18,borderWidth:1,borderColor:C.line},btn:{backgroundColor:C.accent,borderRadius:18,paddingVertical:15,paddingHorizontal:18,alignItems:'center'},danger:{backgroundColor:C.danger},bt:{color:'#08131B',fontWeight:'800',fontSize:16},title:{color:C.text,fontSize:28,fontWeight:'800'},sub:{color:C.muted,fontSize:15,lineHeight:21}});
