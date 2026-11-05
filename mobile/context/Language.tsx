import React,{createContext,useContext,useMemo,useState} from 'react';
export type Language='ro'|'en';
type State={language:Language;setLanguage:(v:Language)=>void;t:(english:string)=>string};
const Context=createContext<State|null>(null);
const ro:Record<string,string>={
'Home':'Acasă','Assistant':'Asistent','Learn':'Învățare','Control':'Control','Monitor':'Senzori','Blocks':'Blocuri','Settings':'Setări',
"Hi, I'm ELIO 👋":'Salut, eu sunt ELIO 👋','Your AI learning & desk companion.':'Prietenul tău inteligent pentru învățare.','● Ready to learn':'● Pregătit de învățare','Robot status':'Starea robotului','View live connection in Monitor':'Vezi conexiunea în Senzori','Ask ELIO':'Întreabă-l pe ELIO','Learn & Play':'Învață și joacă-te','😊 Emotions (desktop)':'😊 Emoții','📁 Projects (desktop)':'📁 Proiecte',
'Robot Control':'Controlul robotului','Bluetooth movement • Connection stays active across tabs.':'Comenzi Bluetooth • Conexiunea rămâne activă între pagini.','Motor speed':'Viteza motoarelor','Drag to adjust':'Glisează pentru reglare','Movement':'Deplasare','Drag the joystick to move ELIO':'Mișcă joystickul pentru a deplasa ELIO','Release the joystick to stop':'Eliberează joystickul pentru oprire','Forward':'Înainte','Backward':'Înapoi','Left':'Stânga','Right':'Dreapta','Ready':'Pregătit',
'Joystick':'Joystick','Speed & distance':'Viteză și distanță','Control with the joystick.':'Controlează direcția cu joystickul.','Adjust speed and follow the distance sensor.':'Reglează viteza și urmărește senzorul de distanță.','Ultrasonic sensor':'Senzor ultrasonic','Distance from obstacle':'Distanța față de obstacol',
'ELIO Monitor':'Senzorii ELIO','Bluetooth, sensors and safety':'Bluetooth, senzori și siguranță','Bluetooth status':'Stare Bluetooth','● Connected to ELIO':'● Conectat la ELIO','◌ Searching for ELIO…':'◌ Se caută ELIO…','○ Disconnected':'○ Deconectat','Disconnect':'Deconectează','Connect / Retry':'Conectează / Reîncearcă','Robot state':'Starea robotului','Emergency stop':'Oprire de urgență','■ STOP MOTORS':'■ OPREȘTE MOTOARELE','Safety':'Siguranță','Stop movement when leaving the joystick screen. BLE remains connected.':'Oprește deplasarea la ieșirea din pagina joystick. Bluetooth rămâne conectat.','Disconnect from ELIO?':'Te deconectezi de la ELIO?','Cancel':'Anulează',
'ELIO Code':'Cod ELIO','Scratch-style editor • same blocks and categories as desktop':'Editor tip Scratch • aceleași blocuri și categorii ca pe desktop','1. Categories':'1. Categorii','Tap a block to add it to your program.':'Atinge un bloc pentru a-l adăuga în program.','2. Program':'2. Program','blocks':'blocuri','Choose blocks above to build your program.':'Alege blocuri de mai sus pentru a crea programul.','Clear program':'Șterge programul','3. Execute':'3. Execută','ELIO connected':'ELIO conectat','ELIO disconnected':'ELIO deconectat','▶ Run':'▶ Rulează','Running…':'Se execută…','■ Stop':'■ Oprește','Move block up':'Mută blocul mai sus','Move block down':'Mută blocul mai jos','Blocks not supported on ESP32':'Blocuri neacceptate de ESP32','Execution interrupted.':'Execuția a fost întreruptă.','Connect the robot from the Monitor tab first.':'Conectează mai întâi robotul din pagina Senzori.','Some blocks require new ESP32 firmware commands.':'Unele blocuri necesită comenzi noi în firmware-ul ESP32.','Personalize ELIO.':'Personalizează ELIO.','Language':'Limbă','Voice responses':'Răspunsuri vocale','ELIO can answer out loud':'ELIO poate răspunde cu voce tare','Robot Wi-Fi':'Wi-Fi robot','Default prototype address: 192.168.4.1':'Adresă prototip implicită: 192.168.4.1',
'Talk, ask, discover.':'Vorbește, întreabă, descoperă.','Ask ELIO...':'Întreabă-l pe ELIO...','Learn with ELIO':'Învață cu ELIO','Choose an activity.':'Alege o activitate.','Stories':'Povești','Riddles':'Ghicitori','General knowledge':'Cultură generală',
'ELIO Emotions':'Emoțiile ELIO','Expressions from the desktop experience':'Expresii din versiunea desktop','😊 Happy':'😊 Fericit','😍 Love':'😍 Iubire','😎 Cool':'😎 Relaxat','🤔 Curious':'🤔 Curios','😢 Sad':'😢 Trist','😮 Surprised':'😮 Surprins','This section is a desktop feature preview. Hardware actions and persistent storage are not implemented in the supplied desktop project.':'Această secțiune este o previzualizare. Acțiunile hardware și salvarea permanentă nu sunt încă implementate.','ELIO Projects':'Proiectele ELIO','Visual programming workspace':'Spațiu de programare vizuală','📁 Saved programs':'📁 Programe salvate','➕ New project':'➕ Proiect nou',
'Motion':'Mișcare','Looks':'Aspect','Sound':'Sunet','Events':'Evenimente','Control blocks':'Control','Sensing':'Senzori','Operators':'Operatori','Variables':'Variabile',

'move forward':'mergi înainte',
'move backward':'mergi înapoi',
'turn left':'virează stânga',
'turn right':'virează dreapta',
'stop ELIO':'oprește ELIO',
'set speed to [60] %':'setează viteza la [60] %',
'show face [Happy]':'arată expresia [Fericit]',
'show face [Love]':'arată expresia [Iubire]',
'show face [Curious]':'arată expresia [Curios]',
'show face [Surprised]':'arată expresia [Surprins]',
'say [Hello!]':'spune [Salut!]',
'play sound [Beep]':'redă sunetul [Bip]',
'when green flag clicked':'când este apăsat steagul verde',
'when ELIO connected':'când ELIO este conectat',
'when obstacle detected':'când este detectat un obstacol',
'wait [1] seconds':'așteaptă [1] secunde',
'repeat [10]':'repetă [10]',
'forever':'la nesfârșit',
'if <> then':'dacă <> atunci',
'if <> then else':'dacă <> atunci altfel',
'wait until <>':'așteaptă până când <>',
'repeat until <>':'repetă până când <>',
'distance':'distanță',
'obstacle detected?':'obstacol detectat?',
'ELIO connected?':'ELIO conectat?',
'< > and < >':'< > și < >',
'< > or < >':'< > sau < >',
'not < >':'nu < >',
'set [my variable] to [0]':'setează [variabila mea] la [0]',
'change [my variable] by [1]':'modifică [variabila mea] cu [1]',
'my variable':'variabila mea',
};
const enFromRomanian:Record<string,string>={"Povești": "Stories", "Ghicitori": "Riddles", "Cultură generală": "General knowledge", "Povești interactive create împreună cu ELIO": "Interactive stories created with ELIO", "Antrenează curiozitatea și logica": "Train curiosity and logic", "Întrebări pe niveluri și teme": "Questions by level and topic", "Descoperă lumea prin întrebări": "Discover the world through questions", "Alege o activitate.": "Choose an activity.", "ELIO: Salut! Ce vrei să descoperim astăzi?": "ELIO: Hello! What would you like to discover today?"};
export function LanguageProvider({children}:{children:React.ReactNode}){const [language,setLanguage]=useState<Language>('ro');const value=useMemo(()=>({language,setLanguage,t:(v:string)=>language==='ro'?(ro[v]??v):(enFromRomanian[v]??v)}),[language]);return <Context.Provider value={value}>{children}</Context.Provider>}
export function useLanguage(){const x=useContext(Context);if(!x)throw new Error('LanguageProvider missing');return x}
