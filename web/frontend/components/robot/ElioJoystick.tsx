"use client";

import {
  PointerEvent as ReactPointerEvent,
  useEffect,
  useRef,
  useState,
} from "react";

export type ElioDirection =
  | "FORWARD"
  | "BACKWARD"
  | "LEFT"
  | "RIGHT"
  | "STOP";

type Language = "ro" | "en";

type Props = {
  language: Language;

  onDirectionChange: (
    direction: ElioDirection
  ) => void;
};

const MAX_DISTANCE = 72;
const DEAD_ZONE = 18;

export default function ElioJoystick({
  language,
  onDirectionChange,
}: Props) {
  const baseRef =
    useRef<HTMLDivElement | null>(
      null
    );

  const directionRef =
    useRef<ElioDirection>(
      "STOP"
    );

  const [position, setPosition] =
    useState({
      x: 0,
      y: 0,
    });

  const [dragging, setDragging] =
    useState(false);

  const [direction, setDirection] =
    useState<ElioDirection>(
      "STOP"
    );

  /* =======================================================
     TRANSLATIONS
     ======================================================= */

  const t = {
    ro: {
      drive: "CONDU",
      title: "Controlează ELIO",

      description:
        "Glisează cercul albastru pentru a conduce robotul.",

      ready:
        "Pregătit",

      forward:
        "Merge înainte",

      backward:
        "Merge înapoi",

      left:
        "Virează la stânga",

      right:
        "Virează la dreapta",

      release:
        "Eliberează joystick-ul pentru a opri ELIO",

      keepHolding:
        "Ține joystick-ul pentru a continua",
    },

    en: {
      drive: "DRIVE",
      title: "Move ELIO",

      description:
        "Drag the blue circle to drive the robot.",

      ready:
        "Ready",

      forward:
        "Moving forward",

      backward:
        "Moving backward",

      left:
        "Turning left",

      right:
        "Turning right",

      release:
        "Release the joystick to stop ELIO",

      keepHolding:
        "Keep holding to continue",
    },
  }[language];

  /* =======================================================
     SET DIRECTION
     ======================================================= */

  const setRobotDirection = (
    nextDirection:
      ElioDirection
  ) => {
    if (
      directionRef.current ===
      nextDirection
    ) {
      return;
    }

    directionRef.current =
      nextDirection;

    setDirection(
      nextDirection
    );

    onDirectionChange(
      nextDirection
    );
  };

  /* =======================================================
     CALCULATE DIRECTION
     ======================================================= */

  const calculateDirection = (
    x: number,
    y: number
  ) => {
    const distance =
      Math.hypot(
        x,
        y
      );

    if (
      distance <
      DEAD_ZONE
    ) {
      setRobotDirection(
        "STOP"
      );

      return;
    }

    const absoluteX =
      Math.abs(x);

    const absoluteY =
      Math.abs(y);

    if (
      absoluteY >=
      absoluteX
    ) {
      setRobotDirection(
        y < 0
          ? "FORWARD"
          : "BACKWARD"
      );

      return;
    }

    setRobotDirection(
      x < 0
        ? "LEFT"
        : "RIGHT"
    );
  };

  /* =======================================================
     MOVE JOYSTICK
     ======================================================= */

  const updateJoystick = (
    clientX: number,
    clientY: number
  ) => {
    const base =
      baseRef.current;

    if (!base) {
      return;
    }

    const rect =
      base.getBoundingClientRect();

    const centerX =
      rect.left +
      rect.width / 2;

    const centerY =
      rect.top +
      rect.height / 2;

    let x =
      clientX -
      centerX;

    let y =
      clientY -
      centerY;

    const distance =
      Math.hypot(
        x,
        y
      );

    if (
      distance >
      MAX_DISTANCE
    ) {
      const ratio =
        MAX_DISTANCE /
        distance;

      x *= ratio;
      y *= ratio;
    }

    setPosition({
      x,
      y,
    });

    calculateDirection(
      x,
      y
    );
  };

  /* =======================================================
     POINTER DOWN
     ======================================================= */

  const handlePointerDown = (
    event:
      ReactPointerEvent<HTMLDivElement>
  ) => {
    event.preventDefault();

    setDragging(true);

    event.currentTarget
      .setPointerCapture(
        event.pointerId
      );

    updateJoystick(
      event.clientX,
      event.clientY
    );
  };

  /* =======================================================
     POINTER MOVE
     ======================================================= */

  const handlePointerMove = (
    event:
      ReactPointerEvent<HTMLDivElement>
  ) => {
    if (!dragging) {
      return;
    }

    event.preventDefault();

    updateJoystick(
      event.clientX,
      event.clientY
    );
  };

  /* =======================================================
     RESET / STOP
     ======================================================= */

  const resetJoystick = () => {
    setDragging(false);

    setPosition({
      x: 0,
      y: 0,
    });

    setRobotDirection(
      "STOP"
    );
  };

  /* =======================================================
     SAFETY ON UNMOUNT
     ======================================================= */

  useEffect(() => {
    return () => {
      onDirectionChange(
        "STOP"
      );
    };
  }, [onDirectionChange]);

  /* =======================================================
     DIRECTION TEXT
     ======================================================= */

  const directionText =
    direction === "FORWARD"
      ? t.forward
      : direction ===
          "BACKWARD"
        ? t.backward
        : direction ===
            "LEFT"
          ? t.left
          : direction ===
              "RIGHT"
            ? t.right
            : t.ready;

  return (
    <div className="elioJoystickSection">
      <div className="elioJoystickIntro">
        <span>
          {t.drive}
        </span>

        <strong>
          {t.title}
        </strong>

        <p>
          {t.description}
        </p>
      </div>

      <div
        ref={baseRef}
        className={[
          "elioJoystickBase",

          direction !==
          "STOP"
            ? "elioJoystickActive"
            : "",

          `elioJoystick-${direction.toLowerCase()}`,
        ].join(" ")}
        onPointerDown={
          handlePointerDown
        }
        onPointerMove={
          handlePointerMove
        }
        onPointerUp={
          resetJoystick
        }
        onPointerCancel={
          resetJoystick
        }
        onLostPointerCapture={
          resetJoystick
        }
      >
        <div className="elioJoystickRing" />

        <span className="elioJoystickArrow elioJoystickArrowUp">
          ↑
        </span>

        <span className="elioJoystickArrow elioJoystickArrowDown">
          ↓
        </span>

        <span className="elioJoystickArrow elioJoystickArrowLeft">
          ←
        </span>

        <span className="elioJoystickArrow elioJoystickArrowRight">
          →
        </span>

        <div className="elioJoystickCenterDot" />

        <div
          className="elioJoystickKnob"
          style={{
            transform:
              `translate3d(${position.x}px, ${position.y}px, 0)`,
          }}
        >
          <div className="elioJoystickKnobInner">
            <span>
              ✦
            </span>
          </div>
        </div>
      </div>

      <div className="elioJoystickState">
        <span
          className={[
            "elioJoystickStateDot",

            direction !==
            "STOP"
              ? "active"
              : "",
          ].join(" ")}
        />

        <strong>
          {directionText}
        </strong>

        <span>
          {direction ===
          "STOP"
            ? t.release
            : t.keepHolding}
        </span>
      </div>
    </div>
  );
}