export type ProjectId = 'general' | 'blocks' | 'traffic' | 'sensors' | 'robot';
export const projects: { id: ProjectId; ro: string; en: string; exampleRo: string; exampleEn: string }[] = [
 { id:'general',ro:'Discuție liberă',en:'Free discussion',exampleRo:'Explică-mi ce este o variabilă.',exampleEn:'Explain what a variable is.' },
 { id:'blocks',ro:'Cod și blocuri',en:'Code and blocks',exampleRo:'Explică-mi un program Scratch cu repetiții.',exampleEn:'Explain a Scratch program with loops.' },
 { id:'robot',ro:'Robotul ELIO',en:'ELIO robot',exampleRo:'Explică-mi cum controlez motoarele.',exampleEn:'Explain how to control the motors.' },
 { id:'sensors',ro:'Senzori',en:'Sensors',exampleRo:'La ce folosește senzorul ultrasonic?',exampleEn:'What does an ultrasonic sensor do?' },
 { id:'traffic',ro:'Semafor educațional',en:'Traffic light project',exampleRo:'Explică-mi codul unui semafor cu LED-uri.',exampleEn:'Explain traffic light LED code.' },
];
