"use client";

import { useEffect, useRef, useState } from "react";
import type { CSSProperties } from "react";
import * as Blockly from "blockly";
import { registerWorkspace, haltProgram } from "@/services/codeRunner";

/* =========================================================
   TYPES
   ========================================================= */

type ElioCategoryId =
  | "motion"
  | "looks"
  | "sound"
  | "events"
  | "control"
  | "sensing"
  | "operators"
  | "variables";

type CategoryInfo = {
  id: ElioCategoryId;
  label: string;
  icon: string;
  main: string;
  soft: string;
  border: string;
};

/* =========================================================
   CATEGORIES
   ========================================================= */

const categories: CategoryInfo[] = [
  {
    id: "motion",
    label: "Motion",
    icon: "↗",
    main: "#4C97FF",
    soft: "#EAF4FF",
    border: "#D3E7FF",
  },

  {
    id: "looks",
    label: "Looks",
    icon: "☺",
    main: "#9966FF",
    soft: "#F2EBFF",
    border: "#E3D5FF",
  },

  {
    id: "sound",
    label: "Sound",
    icon: "♪",
    main: "#CF63CF",
    soft: "#FBEAFB",
    border: "#F1D2F1",
  },

  {
    id: "events",
    label: "Events",
    icon: "⚡",
    main: "#FFBF00",
    soft: "#FFF7D9",
    border: "#FFE8A0",
  },

  {
    id: "control",
    label: "Control",
    icon: "↻",
    main: "#FFAB19",
    soft: "#FFF0DC",
    border: "#FFDCAB",
  },

  {
    id: "sensing",
    label: "Sensing",
    icon: "◉",
    main: "#5CB1D6",
    soft: "#E7F7FC",
    border: "#CDEDF8",
  },

  {
    id: "operators",
    label: "Operators",
    icon: "+−",
    main: "#59C059",
    soft: "#EAF8EA",
    border: "#D1EFD1",
  },

  {
    id: "variables",
    label: "Variables",
    icon: "x",
    main: "#FF8C1A",
    soft: "#FFF0E1",
    border: "#FFDCB8",
  },
];

/* =========================================================
   REGISTER BLOCKS
   ========================================================= */

function registerElioBlocks() {
  if (Blockly.Blocks["elio_move_forward"]) {
    return;
  }

  Blockly.defineBlocksWithJsonArray([
    /* =====================================================
       MOTION
       ===================================================== */

    {
      type: "elio_move_forward",
      message0: "↑  move forward",
      previousStatement: null,
      nextStatement: null,
      colour: "#4C97FF",
      tooltip: "Move ELIO forward",
    },

    {
      type: "elio_move_backward",
      message0: "↓  move backward",
      previousStatement: null,
      nextStatement: null,
      colour: "#4C97FF",
      tooltip: "Move ELIO backward",
    },

    {
      type: "elio_turn_left",
      message0: "↶  turn left",
      previousStatement: null,
      nextStatement: null,
      colour: "#4C97FF",
      tooltip: "Turn ELIO left",
    },

    {
      type: "elio_turn_right",
      message0: "↷  turn right",
      previousStatement: null,
      nextStatement: null,
      colour: "#4C97FF",
      tooltip: "Turn ELIO right",
    },

    {
      type: "elio_stop",
      message0: "■  stop ELIO",
      previousStatement: null,
      nextStatement: null,
      colour: "#4C97FF",
      tooltip: "Stop ELIO",
    },

    {
      type: "elio_speed",
      message0: "⚡  set speed to %1 %%",
      args0: [
        {
          type: "field_number",
          name: "SPEED",
          value: 60,
          min: 0,
          max: 100,
          precision: 1,
        },
      ],
      previousStatement: null,
      nextStatement: null,
      colour: "#4C97FF",
      tooltip: "Set movement speed",
    },

    /* =====================================================
       LOOKS
       ===================================================== */

    {
      type: "elio_face",
      message0: "😊  show face %1",
      args0: [
        {
          type: "field_dropdown",
          name: "FACE",
          options: [
            ["😊 Happy", "HAPPY"],
            ["😍 Love", "LOVE"],
            ["😎 Cool", "COOL"],
            ["🤔 Curious", "CURIOUS"],
            ["😢 Sad", "SAD"],
            ["😮 Surprised", "SURPRISED"],
            ["🥱 Tired", "TIRED"],
            ["😴 Sleepy", "SLEEPY"],
          ],
        },
      ],
      previousStatement: null,
      nextStatement: null,
      colour: "#9966FF",
      tooltip: "Change ELIO's face",
    },

    /* =====================================================
       SOUND
       ===================================================== */

    {
      type: "elio_say",
      message0: "🔊  say %1",
      args0: [
        {
          type: "field_input",
          name: "TEXT",
          text: "Hello!",
        },
      ],
      previousStatement: null,
      nextStatement: null,
      colour: "#CF63CF",
      tooltip: "Make ELIO say something",
    },

    {
      type: "elio_sound",
      message0: "♪  play sound %1",
      args0: [
        {
          type: "field_dropdown",
          name: "SOUND",
          options: [
            ["🔔 Beep", "BEEP"],
            ["✨ Success", "SUCCESS"],
            ["⚠ Alert", "ALERT"],
          ],
        },
      ],
      previousStatement: null,
      nextStatement: null,
      colour: "#CF63CF",
      tooltip: "Play a sound",
    },

    /* =====================================================
       EVENTS
       ===================================================== */

    {
      type: "elio_start",
      message0: "▶  when Start clicked",
      nextStatement: null,
      colour: "#FFBF00",
      hat: "cap",
      tooltip: "Start the program",
    },

    {
      type: "elio_connected_event",
      message0: "🤖  when ELIO connected",
      nextStatement: null,
      colour: "#FFBF00",
      hat: "cap",
      tooltip: "Run when ELIO connects",
    },

    {
      type: "elio_obstacle_event",
      message0: "⚠  when obstacle detected",
      nextStatement: null,
      colour: "#FFBF00",
      hat: "cap",
      tooltip: "Run when an obstacle is detected",
    },

    /* =====================================================
       CONTROL
       ===================================================== */

    {
      type: "elio_wait",
      message0: "wait %1 seconds",
      args0: [
        {
          type: "field_number",
          name: "SECONDS",
          value: 1,
          min: 0,
          precision: 0.1,
        },
      ],
      previousStatement: null,
      nextStatement: null,
      colour: "#FFAB19",
    },

    {
      type: "elio_repeat",
      message0: "repeat %1",
      args0: [
        {
          type: "field_number",
          name: "TIMES",
          value: 10,
          min: 1,
          precision: 1,
        },
      ],

      message1: "%1",

      args1: [
        {
          type: "input_statement",
          name: "DO",
        },
      ],

      previousStatement: null,
      nextStatement: null,

      colour: "#FFAB19",
    },

    {
      type: "elio_forever",

      message0: "forever",

      message1: "%1",

      args1: [
        {
          type: "input_statement",
          name: "DO",
        },
      ],

      previousStatement: null,

      colour: "#FFAB19",
    },

    {
      type: "elio_if",

      message0: "if %1 then",

      args0: [
        {
          type: "input_value",
          name: "CONDITION",
          check: "Boolean",
        },
      ],

      message1: "%1",

      args1: [
        {
          type: "input_statement",
          name: "DO",
        },
      ],

      previousStatement: null,
      nextStatement: null,

      colour: "#FFAB19",
    },

    {
      type: "elio_if_else",

      message0: "if %1 then",

      args0: [
        {
          type: "input_value",
          name: "CONDITION",
          check: "Boolean",
        },
      ],

      message1: "%1",

      args1: [
        {
          type: "input_statement",
          name: "DO",
        },
      ],

      message2: "else",

      message3: "%1",

      args3: [
        {
          type: "input_statement",
          name: "ELSE",
        },
      ],

      previousStatement: null,
      nextStatement: null,

      colour: "#FFAB19",
    },

    {
      type: "elio_wait_until",

      message0: "wait until %1",

      args0: [
        {
          type: "input_value",
          name: "CONDITION",
          check: "Boolean",
        },
      ],

      previousStatement: null,
      nextStatement: null,

      colour: "#FFAB19",
    },

    {
      type: "elio_repeat_until",

      message0: "repeat until %1",

      args0: [
        {
          type: "input_value",
          name: "CONDITION",
          check: "Boolean",
        },
      ],

      message1: "%1",

      args1: [
        {
          type: "input_statement",
          name: "DO",
        },
      ],

      previousStatement: null,
      nextStatement: null,

      colour: "#FFAB19",
    },

    /* =====================================================
       SENSING
       ===================================================== */

    {
      type: "elio_distance",
      message0: "📏  distance",
      output: "Number",
      colour: "#5CB1D6",
      tooltip: "Distance measured by ELIO",
    },

    {
      type: "elio_obstacle",
      message0: "⚠  obstacle detected?",
      output: "Boolean",
      colour: "#5CB1D6",
      tooltip: "Check if ELIO detected an obstacle",
    },

    {
      type: "elio_is_connected",
      message0: "🤖  ELIO connected?",
      output: "Boolean",
      colour: "#5CB1D6",
      tooltip: "Check if ELIO is connected",
    },

    /* =====================================================
       OPERATORS
       ===================================================== */

    {
      type: "elio_number",
      message0: "%1",

      args0: [
        {
          type: "field_number",
          name: "NUM",
          value: 10,
        },
      ],

      output: "Number",
      colour: "#59C059",
    },

    {
      type: "elio_add",
      message0: "%1 + %2",

      args0: [
        {
          type: "input_value",
          name: "A",
        },
        {
          type: "input_value",
          name: "B",
        },
      ],

      inputsInline: true,
      output: "Number",

      colour: "#59C059",
    },

    {
      type: "elio_subtract",
      message0: "%1 - %2",

      args0: [
        {
          type: "input_value",
          name: "A",
        },
        {
          type: "input_value",
          name: "B",
        },
      ],

      inputsInline: true,
      output: "Number",

      colour: "#59C059",
    },

    {
      type: "elio_multiply",
      message0: "%1 × %2",

      args0: [
        {
          type: "input_value",
          name: "A",
        },
        {
          type: "input_value",
          name: "B",
        },
      ],

      inputsInline: true,
      output: "Number",

      colour: "#59C059",
    },

    {
      type: "elio_divide",
      message0: "%1 ÷ %2",

      args0: [
        {
          type: "input_value",
          name: "A",
        },
        {
          type: "input_value",
          name: "B",
        },
      ],

      inputsInline: true,
      output: "Number",

      colour: "#59C059",
    },

    {
      type: "elio_less_than",
      message0: "%1 < %2",

      args0: [
        {
          type: "input_value",
          name: "A",
        },
        {
          type: "input_value",
          name: "B",
        },
      ],

      inputsInline: true,
      output: "Boolean",

      colour: "#59C059",
    },

    {
      type: "elio_equals",
      message0: "%1 = %2",

      args0: [
        {
          type: "input_value",
          name: "A",
        },
        {
          type: "input_value",
          name: "B",
        },
      ],

      inputsInline: true,
      output: "Boolean",

      colour: "#59C059",
    },

    {
      type: "elio_greater_than",
      message0: "%1 > %2",

      args0: [
        {
          type: "input_value",
          name: "A",
        },
        {
          type: "input_value",
          name: "B",
        },
      ],

      inputsInline: true,
      output: "Boolean",

      colour: "#59C059",
    },

    {
      type: "elio_and",
      message0: "%1 and %2",

      args0: [
        {
          type: "input_value",
          name: "A",
          check: "Boolean",
        },
        {
          type: "input_value",
          name: "B",
          check: "Boolean",
        },
      ],

      inputsInline: true,
      output: "Boolean",

      colour: "#59C059",
    },

    {
      type: "elio_or",
      message0: "%1 or %2",

      args0: [
        {
          type: "input_value",
          name: "A",
          check: "Boolean",
        },
        {
          type: "input_value",
          name: "B",
          check: "Boolean",
        },
      ],

      inputsInline: true,
      output: "Boolean",

      colour: "#59C059",
    },

    {
      type: "elio_not",
      message0: "not %1",

      args0: [
        {
          type: "input_value",
          name: "VALUE",
          check: "Boolean",
        },
      ],

      output: "Boolean",

      colour: "#59C059",
    },
  ]);
}

/* =========================================================
   CATEGORY BLOCKS
   ========================================================= */

const categoryBlocks: Record<
  ElioCategoryId,
  Blockly.utils.toolbox.ToolboxItemInfo[]
> = {
  /* ================= MOTION ================= */

  motion: [
    {
      kind: "block",
      type: "elio_move_forward",
    },
    {
      kind: "block",
      type: "elio_move_backward",
    },
    {
      kind: "block",
      type: "elio_turn_left",
    },
    {
      kind: "block",
      type: "elio_turn_right",
    },
    {
      kind: "block",
      type: "elio_stop",
    },
    {
      kind: "block",
      type: "elio_speed",
    },
  ],

  /* ================= LOOKS ================= */

  looks: [
    {
      kind: "block",
      type: "elio_face",
    },
  ],

  /* ================= SOUND ================= */

  sound: [
    {
      kind: "block",
      type: "elio_say",
    },
    {
      kind: "block",
      type: "elio_sound",
    },
  ],

  /* ================= EVENTS ================= */

  events: [
    {
      kind: "block",
      type: "elio_start",
    },
    {
      kind: "block",
      type: "elio_connected_event",
    },
    {
      kind: "block",
      type: "elio_obstacle_event",
    },
  ],

  /* ================= CONTROL ================= */

  control: [
    {
      kind: "block",
      type: "elio_wait",
    },
    {
      kind: "block",
      type: "elio_repeat",
    },
    {
      kind: "block",
      type: "elio_forever",
    },
    {
      kind: "block",
      type: "elio_if",
    },
    {
      kind: "block",
      type: "elio_if_else",
    },
    {
      kind: "block",
      type: "elio_wait_until",
    },
    {
      kind: "block",
      type: "elio_repeat_until",
    },
  ],

  /* ================= SENSING ================= */

  sensing: [
    {
      kind: "block",
      type: "elio_distance",
    },
    {
      kind: "block",
      type: "elio_obstacle",
    },
    {
      kind: "block",
      type: "elio_is_connected",
    },
  ],

  /* ================= OPERATORS ================= */

  operators: [
    {
      kind: "block",
      type: "elio_number",
    },
    {
      kind: "block",
      type: "elio_add",
    },
    {
      kind: "block",
      type: "elio_subtract",
    },
    {
      kind: "block",
      type: "elio_multiply",
    },
    {
      kind: "block",
      type: "elio_divide",
    },
    {
      kind: "block",
      type: "elio_less_than",
    },
    {
      kind: "block",
      type: "elio_equals",
    },
    {
      kind: "block",
      type: "elio_greater_than",
    },
    {
      kind: "block",
      type: "elio_and",
    },
    {
      kind: "block",
      type: "elio_or",
    },
    {
      kind: "block",
      type: "elio_not",
    },
  ],

  /* ================= VARIABLES ================= */

  variables: [
    {
      kind: "block",
      type: "variables_set",
    },
    {
      kind: "block",
      type: "variables_get",
    },
    {
      kind: "block",
      type: "math_change",
    },
  ],
};

/* =========================================================
   CREATE FLYOUT TOOLBOX
   ========================================================= */

function createFlyoutToolbox(
  category: ElioCategoryId
): Blockly.utils.toolbox.ToolboxDefinition {
  return {
    kind: "flyoutToolbox",
    contents: categoryBlocks[category],
  };
}

/* =========================================================
   COMPONENT
   ========================================================= */

export default function CodeWorkspace() {
  const blocklyDiv =
    useRef<HTMLDivElement | null>(null);

  const workspaceRef =
    useRef<Blockly.WorkspaceSvg | null>(null);

  const [activeCategory, setActiveCategory] =
    useState<ElioCategoryId>("motion");
    const activeCategoryInfo =
  categories.find(
    (category) =>
      category.id === activeCategory
  ) ?? categories[0];

  /* =======================================================
     CATEGORY CHANGE
     ======================================================= */

  const handleCategoryChange = (
    category: ElioCategoryId
  ) => {
    setActiveCategory(category);

    const workspace =
      workspaceRef.current;

    if (!workspace) return;

    workspace.updateToolbox(
      createFlyoutToolbox(category)
    );

    Blockly.svgResize(workspace);
  };

  /* =======================================================
     INITIALIZE BLOCKLY
     ======================================================= */

  useEffect(() => {
    if (!blocklyDiv.current) {
      return;
    }

    registerElioBlocks();

    /* =====================================================
       THEME
       ===================================================== */

    const elioTheme =
      Blockly.Theme.defineTheme(
        "elio",
        {
          name: "elio",

          base:
            Blockly.Themes.Classic,

          componentStyles: {
            workspaceBackgroundColour:
              "#F8FCFF",

            flyoutBackgroundColour:
              "#FFFFFF",

            flyoutForegroundColour:
              "#204C75",

            flyoutOpacity:
              1,

            scrollbarColour:
              "#BED0DF",

            insertionMarkerColour:
              "#087DF0",

            insertionMarkerOpacity:
              0.35,

            cursorColour:
              "#087DF0",
          },
        }
      );

    /* =====================================================
       BLOCKLY WORKSPACE

       IMPORTANT:
       We use flyoutToolbox, NOT categoryToolbox.
       ===================================================== */

    const workspace =
      Blockly.inject(
        blocklyDiv.current,
        {
          toolbox:
            createFlyoutToolbox(
              "motion"
            ),

          theme:
            elioTheme,

          renderer:
            "zelos",

          trashcan:
            true,

          move: {
            scrollbars: {
              horizontal:
                true,

              vertical:
                true,
            },

            drag:
              true,

            wheel:
              true,
          },

          zoom: {
            controls:
              true,

            wheel:
              true,

            startScale:
              0.9,

            maxScale:
              1.4,

            minScale:
              0.5,

            scaleSpeed:
              1.1,
          },

          grid: {
            spacing:
              20,

            length:
              1,

            colour:
              "#DCE8F2",

            snap:
              false,
          },

          sounds:
            true,
        }
      );

    workspaceRef.current =
      workspace;
    registerWorkspace(workspace);

    /* =====================================================
       RESIZE
       ===================================================== */

    const resizeBlockly = () => {
      if (
        !workspaceRef.current
      ) {
        return;
      }

      Blockly.svgResize(
        workspaceRef.current
      );
    };

    window.addEventListener(
      "resize",
      resizeBlockly
    );

    const initialResize =
      window.setTimeout(
        resizeBlockly,
        150
      );

    /* =====================================================
       CLEANUP
       ===================================================== */

    return () => {
      window.clearTimeout(
        initialResize
      );

      window.removeEventListener(
        "resize",
        resizeBlockly
      );

      void haltProgram().catch(() => {});
      registerWorkspace(null);
      workspace.dispose();

      workspaceRef.current =
        null;
    };
  }, []);

  /* =======================================================
     RENDER
     ======================================================= */

  return (
    <>
      <section className="elioVisualCode">
        {/* =================================================
            CUSTOM CATEGORY MENU
            ================================================= */}

        <aside className="elioVisualCategories">
          <div className="elioVisualCategoryList">
            {categories.map(
              (category) => {
                const isActive =
                  activeCategory ===
                  category.id;

                const buttonStyle = {
                  background:
                    category.soft,

                  borderColor:
                    category.border,

                  "--elio-category-color":
                    category.main,
                } as CSSProperties;

                return (
                  <button
                    key={
                      category.id
                    }
                    type="button"
                    className={
                      isActive
                        ? "elioVisualCategory active"
                        : "elioVisualCategory"
                    }
                    style={
                      buttonStyle
                    }
                    onClick={() =>
                      handleCategoryChange(
                        category.id
                      )
                    }
                  >
                    <span
                      className="elioVisualCategoryIcon"
                      style={{
                        background:
                          category.main,
                      }}
                    >
                      {
                        category.icon
                      }
                    </span>

                    <span className="elioVisualCategoryLabel">
                      {
                        category.label
                      }
                    </span>

                    <span className="elioVisualCategoryArrow">
                      ›
                    </span>
                  </button>
                );
              }
            )}
          </div>
        </aside>

        {/* =================================================
            BLOCKLY
            ================================================= */}

        <div
  className="elioVisualBlocklyArea"
  style={
    {
      "--elio-active-color":
        activeCategoryInfo.main,

      "--elio-active-soft":
        activeCategoryInfo.soft,

      "--elio-active-border":
        activeCategoryInfo.border,
    } as CSSProperties
  }
>
          <div
            ref={blocklyDiv}
            className="elioVisualBlocklyHost"
          />
        </div>
      </section>

      {/* ===================================================
          STYLES
          =================================================== */}

      <style jsx global>{`
        /* =================================================
           WHOLE CODE AREA
           ================================================= */

        .elioVisualCode {
          position: relative;

          display: grid;

          grid-template-columns:
            225px
            minmax(0, 1fr);

          width: 100%;
          height: 100%;

          min-width: 0;
          min-height: 0;

          overflow: hidden;

          background:
            #f8fcff;

          border-radius:
            20px;
        }

        /* =================================================
           CATEGORY COLUMN
           ================================================= */

        .elioVisualCategories {
          position: relative;

          z-index: 30;

          display: flex;
          flex-direction: column;

          width: 100%;

          min-width: 0;
          min-height: 0;

          padding:
            8px
            13px;

          overflow:
            hidden;

          background:
            linear-gradient(
              180deg,
              #ffffff 0%,
              #f7fbff 100%
            );

          border-right:
            1px solid
            #dceaf5;

          box-shadow:
            4px
            0
            16px
            rgba(
              29,
              66,
              98,
              0.035
            );
        }

        /* =================================================
           CATEGORY LIST

           Uses all available vertical space so all 8
           categories fit without scrolling.
           ================================================= */

        .elioVisualCategoryList {
          display: grid;

          grid-template-rows:
            repeat(
              8,
              minmax(
                46px,
                1fr
              )
            );

          gap: 6px;

          width: 100%;
          height: 100%;

          min-height: 0;
        }

        /* =================================================
           CATEGORY BUTTON
           ================================================= */

        .elioVisualCategory {
          position: relative;

          display: grid;

          grid-template-columns:
            34px
            minmax(0, 1fr)
            14px;

          align-items: center;

          gap: 9px;

          width: 100%;
          height: 100%;

          min-height: 46px;
          max-height: 60px;

          padding:
            0
            10px;

          border:
            1px solid;

          border-radius:
            15px;

          outline: none;

          cursor: pointer;

          text-align: left;

          font-family:
            inherit;

          transition:
            transform
              180ms ease,
            box-shadow
              180ms ease,
            filter
              180ms ease;
        }

        .elioVisualCategory:hover {
          transform:
            translateX(
              3px
            );

          filter:
            saturate(
              1.07
            );

          box-shadow:
            0
            6px
            15px
            rgba(
              29,
              70,
              104,
              0.09
            );
        }

        .elioVisualCategory.active {
          transform:
            translateX(
              3px
            );

          box-shadow:
            0
            7px
            18px
            rgba(
              27,
              69,
              104,
              0.12
            );
        }

        /* =================================================
           ACTIVE COLOR BAR
           ================================================= */

        .elioVisualCategory.active::after {
          content: "";

          position:
            absolute;

          right:
            -1px;

          top:
            11px;

          bottom:
            11px;

          width:
            4px;

          border-radius:
            999px
            0
            0
            999px;

          background:
            var(
              --elio-category-color
            );
        }

        /* =================================================
           ICON
           ================================================= */

        .elioVisualCategoryIcon {
          display: grid;

          place-items:
            center;

          width:
            34px;

          height:
            34px;

          border-radius:
            10px;

          color:
            #ffffff;

          font-size:
            16px;

          font-weight:
            900;

          line-height:
            1;

          box-shadow:
            0
            4px
            9px
            rgba(
              31,
              64,
              92,
              0.12
            );
        }

        /* =================================================
           CATEGORY LABEL
           ================================================= */

        .elioVisualCategoryLabel {
          min-width: 0;

          color:
            #204e75;

          font-size:
            13px;

          font-weight:
            850;

          white-space:
            nowrap;

          overflow:
            hidden;

          text-overflow:
            ellipsis;
        }

        /* =================================================
           ARROW
           ================================================= */

        .elioVisualCategoryArrow {
          color:
            rgba(
              32,
              78,
              117,
              0.34
            );

          font-size:
            20px;

          line-height:
            1;

          transition:
            transform
              180ms ease;
        }

        .elioVisualCategory:hover
          .elioVisualCategoryArrow {
          transform:
            translateX(
              2px
            );
        }

        /* =================================================
           BLOCKLY AREA
           ================================================= */

        .elioVisualBlocklyArea {
          position: relative;

          width: 100%;
          height: 100%;

          min-width: 0;
          min-height: 0;

          overflow: hidden;

          background:
            #f8fcff;
        }

        .elioVisualBlocklyHost {
          position: absolute;

          inset: 0;

          width: 100%;
          height: 100%;
        }

        /* =================================================
           HIDE OLD BLOCKLY CATEGORY MENU
           ================================================= */

        .elioVisualBlocklyArea
          .blocklyToolboxDiv {
          display:
            none !important;

          width:
            0 !important;

          min-width:
            0 !important;

          max-width:
            0 !important;

          padding:
            0 !important;

          margin:
            0 !important;

          overflow:
            hidden !important;
        }

        /* =================================================
           BLOCK PALETTE
           ================================================= */

        .elioVisualBlocklyArea
          .blocklyFlyoutBackground {
          fill:
            #ffffff !important;

          fill-opacity:
            1 !important;
        }

        .elioVisualBlocklyArea
          .blocklyFlyout {
          filter:
            drop-shadow(
              5px
              0
              9px
              rgba(
                29,
                70,
                103,
                0.07
              )
            );
        }
      `}</style>
    </>
  );
}