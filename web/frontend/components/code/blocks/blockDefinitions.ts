export type BlockCategory =
  | "motion"
  | "looks"
  | "sound"
  | "events"
  | "control"
  | "sensing"
  | "operators"
  | "variables";

export type ElioBlock = {
  id: string;
  category: BlockCategory;
  label: string;
  type:
    | "command"
    | "hat"
    | "control"
    | "reporter"
    | "boolean";
};

export const blockCategories = [
  {
    id: "motion" as BlockCategory,
    label: "Motion",
    color: "#4c97ff",
  },
  {
    id: "looks" as BlockCategory,
    label: "Looks",
    color: "#9966ff",
  },
  {
    id: "sound" as BlockCategory,
    label: "Sound",
    color: "#cf63cf",
  },
  {
    id: "events" as BlockCategory,
    label: "Events",
    color: "#ffbf00",
  },
  {
    id: "control" as BlockCategory,
    label: "Control",
    color: "#ffab19",
  },
  {
    id: "sensing" as BlockCategory,
    label: "Sensing",
    color: "#5cb1d6",
  },
  {
    id: "operators" as BlockCategory,
    label: "Operators",
    color: "#59c059",
  },
  {
    id: "variables" as BlockCategory,
    label: "Variables",
    color: "#ff8c1a",
  },
];

export const blocks: ElioBlock[] = [
  /* =====================================================
     MOTION
     ===================================================== */

  {
    id: "move-forward",
    category: "motion",
    label: "move forward",
    type: "command",
  },
  {
    id: "move-backward",
    category: "motion",
    label: "move backward",
    type: "command",
  },
  {
    id: "turn-left",
    category: "motion",
    label: "turn left",
    type: "command",
  },
  {
    id: "turn-right",
    category: "motion",
    label: "turn right",
    type: "command",
  },
  {
    id: "stop-elio",
    category: "motion",
    label: "stop ELIO",
    type: "command",
  },
  {
    id: "set-speed",
    category: "motion",
    label: "set speed to [60] %",
    type: "command",
  },

  /* =====================================================
     LOOKS
     ===================================================== */

  {
    id: "show-face",
    category: "looks",
    label: "show face [Happy]",
    type: "command",
  },

  {
    id: "show-happy",
    category: "looks",
    label: "show face [Happy]",
    type: "command",
  },

  {
    id: "show-love",
    category: "looks",
    label: "show face [Love]",
    type: "command",
  },

  {
    id: "show-curious",
    category: "looks",
    label: "show face [Curious]",
    type: "command",
  },

  {
    id: "show-surprised",
    category: "looks",
    label: "show face [Surprised]",
    type: "command",
  },

  /* =====================================================
     SOUND
     ===================================================== */

  {
    id: "say",
    category: "sound",
    label: "say [Hello!]",
    type: "command",
  },

  {
    id: "play-sound",
    category: "sound",
    label: "play sound [Beep]",
    type: "command",
  },

  /* =====================================================
     EVENTS
     ===================================================== */

  {
    id: "green-flag",
    category: "events",
    label: "when green flag clicked",
    type: "hat",
  },

  {
    id: "elio-connected",
    category: "events",
    label: "when ELIO connected",
    type: "hat",
  },

  {
    id: "obstacle-event",
    category: "events",
    label: "when obstacle detected",
    type: "hat",
  },

  /* =====================================================
     CONTROL
     ===================================================== */

  {
    id: "wait",
    category: "control",
    label: "wait [1] seconds",
    type: "command",
  },

  {
    id: "repeat",
    category: "control",
    label: "repeat [10]",
    type: "control",
  },

  {
    id: "forever",
    category: "control",
    label: "forever",
    type: "control",
  },

  {
    id: "if",
    category: "control",
    label: "if <> then",
    type: "control",
  },

  {
    id: "if-else",
    category: "control",
    label: "if <> then else",
    type: "control",
  },

  {
    id: "wait-until",
    category: "control",
    label: "wait until <>",
    type: "control",
  },

  {
    id: "repeat-until",
    category: "control",
    label: "repeat until <>",
    type: "control",
  },

  /* =====================================================
     SENSING
     ===================================================== */

  {
    id: "distance",
    category: "sensing",
    label: "distance",
    type: "reporter",
  },

  {
    id: "obstacle",
    category: "sensing",
    label: "obstacle detected?",
    type: "boolean",
  },

  {
    id: "connected",
    category: "sensing",
    label: "ELIO connected?",
    type: "boolean",
  },

  /* =====================================================
     OPERATORS
     ===================================================== */

  {
    id: "add",
    category: "operators",
    label: "[ ] + [ ]",
    type: "reporter",
  },

  {
    id: "subtract",
    category: "operators",
    label: "[ ] - [ ]",
    type: "reporter",
  },

  {
    id: "multiply",
    category: "operators",
    label: "[ ] * [ ]",
    type: "reporter",
  },

  {
    id: "divide",
    category: "operators",
    label: "[ ] / [ ]",
    type: "reporter",
  },

  {
    id: "less-than",
    category: "operators",
    label: "[ ] < [ ]",
    type: "boolean",
  },

  {
    id: "equals",
    category: "operators",
    label: "[ ] = [ ]",
    type: "boolean",
  },

  {
    id: "greater-than",
    category: "operators",
    label: "[ ] > [ ]",
    type: "boolean",
  },

  {
    id: "and",
    category: "operators",
    label: "< > and < >",
    type: "boolean",
  },

  {
    id: "or",
    category: "operators",
    label: "< > or < >",
    type: "boolean",
  },

  {
    id: "not",
    category: "operators",
    label: "not < >",
    type: "boolean",
  },

  /* =====================================================
     VARIABLES
     ===================================================== */

  {
    id: "set-variable",
    category: "variables",
    label: "set [my variable] to [0]",
    type: "command",
  },

  {
    id: "change-variable",
    category: "variables",
    label: "change [my variable] by [1]",
    type: "command",
  },

  {
    id: "variable",
    category: "variables",
    label: "my variable",
    type: "reporter",
  },
];