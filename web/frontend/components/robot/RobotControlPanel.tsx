"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

import ElioJoystick, {
  type ElioDirection,
} from "./ElioJoystick";

import {
  connect,
  disconnect,
  onTelemetry,
  isConnected,
  reconnectKnown,
  send,
  type Telemetry,
} from "@/services/robotBluetooth";

type Language =
  | "ro"
  | "en";

export default function RobotControlPanel() {
  const [language, setLanguage] =
    useState<Language>(
      "en"
    );

  const [connected, setConnected] =
    useState(false);

  const [connecting, setConnecting] =
    useState(false);

  const [speed, setSpeed] =
    useState(60);

  const [distance, setDistance] =
    useState<number | null>(
      null
    );

  const [robotState, setRobotState] =
    useState(
      "DISCONNECTED"
    );

  const heartbeatRef =
    useRef<number | null>(
      null
    );

  /* =======================================================
     LANGUAGE
     ======================================================= */

  useEffect(() => {
    const savedLanguage =
      localStorage.getItem(
        "elio-language"
      );

    if (
      savedLanguage ===
        "ro" ||
      savedLanguage ===
        "en"
    ) {
      setLanguage(
        savedLanguage
      );
    }
  }, []);

  /* =======================================================
     TRANSLATIONS
     ======================================================= */

  const t = {
    ro: {
      robotControl:
        "CONTROL ROBOT",

      title1:
        "Condu, explorează",

      title2:
        "și distrează-te!",

      description:
        "Folosește joystick-ul pentru a controla ELIO și reglează viteza oricând dorești.",

      connected:
        "ELIO conectat",

      offline:
        "ELIO offline",

      speed:
        "VITEZĂ",

      driveSpeed:
        "Viteză de deplasare",

      gentle:
        "Lent",

      fast:
        "Rapid",

      smartSafety:
        "SIGURANȚĂ INTELIGENTĂ",

      obstacleProtection:
        "Protecție la obstacole",

      safetyDescription:
        "ELIO se oprește automat când un obstacol este prea aproape.",

      yourRobot:
        "ROBOTUL TĂU",

      connect:
        "Conectează ELIO",

      connecting:
        "Se conectează...",

      disconnect:
        "Deconectează",

      status:
        "STARE",

      distance:
        "Distanță",

      state:
        "Stare",

      tip:
        "Ține joystick-ul pentru a mă deplasa. Când îi dai drumul, mă opresc automat!",

      stateDisconnected:
        "Deconectat",

      stateConnected:
        "Conectat",

      stateIdle:
        "Pregătit",

      stateMoving:
        "În mișcare",

      stateListening:
        "Ascult",

      stateThinking:
        "Mă gândesc",

      stateTalking:
        "Vorbesc",

      stateObstacle:
        "Obstacol detectat",
    },

    en: {
      robotControl:
        "ROBOT CONTROL",

      title1:
        "Drive, explore",

      title2:
        "and have fun!",

      description:
        "Use the joystick to move ELIO and adjust the speed whenever you want.",

      connected:
        "ELIO connected",

      offline:
        "ELIO offline",

      speed:
        "SPEED",

      driveSpeed:
        "Drive speed",

      gentle:
        "Gentle",

      fast:
        "Fast",

      smartSafety:
        "SMART SAFETY",

      obstacleProtection:
        "Obstacle protection",

      safetyDescription:
        "ELIO automatically stops when an obstacle is too close.",

      yourRobot:
        "YOUR ROBOT",

      connect:
        "Connect ELIO",

      connecting:
        "Connecting...",

      disconnect:
        "Disconnect",

      status:
        "STATUS",

      distance:
        "Distance",

      state:
        "State",

      tip:
        "Hold the joystick to move me. When you release it, I stop automatically!",

      stateDisconnected:
        "Disconnected",

      stateConnected:
        "Connected",

      stateIdle:
        "Ready",

      stateMoving:
        "Moving",

      stateListening:
        "Listening",

      stateThinking:
        "Thinking",

      stateTalking:
        "Talking",

      stateObstacle:
        "Obstacle detected",
    },
  }[language];

  /* =======================================================
     TRANSLATE ROBOT STATE
     ======================================================= */

  const getRobotStateLabel = (
    state: string
  ) => {
    const normalized =
      state
        .trim()
        .toUpperCase();

    switch (
      normalized
    ) {
      case "DISCONNECTED":
        return t.stateDisconnected;

      case "CONNECTED":
        return t.stateConnected;

      case "IDLE":
        return t.stateIdle;

      case "MOVING":
        return t.stateMoving;

      case "LISTENING":
        return t.stateListening;

      case "THINKING":
        return t.stateThinking;

      case "TALKING":
        return t.stateTalking;

      case "OBSTACLE":
        return t.stateObstacle;

      default:
        return state;
    }
  };

  /* =======================================================
     SEND SAFELY
     ======================================================= */

  const safeSend =
    useCallback(
      async (
        command: string
      ) => {
        if (!connected || !isConnected()) {
          return;
        }

        try {
          await send(
            command
          );
        } catch (error) {
          if (isConnected()) {
            console.error("ELIO command failed:", error);
          }
        }
      },
      [connected]
    );

  /* =======================================================
     STOP HEARTBEAT
     ======================================================= */

  const stopHeartbeat =
    useCallback(() => {
      if (
        heartbeatRef.current !==
        null
      ) {
        window.clearInterval(
          heartbeatRef.current
        );

        heartbeatRef.current =
          null;
      }
    }, []);

  /* =======================================================
     START HEARTBEAT
     ======================================================= */

  const startHeartbeat =
    useCallback(
      (
        direction:
          Exclude<
            ElioDirection,
            "STOP"
          >
      ) => {
        stopHeartbeat();

        safeSend(
          direction
        );

        heartbeatRef.current =
          window.setInterval(
            () => {
              safeSend(
                direction
              );
            },
            120
          );
      },
      [
        safeSend,
        stopHeartbeat,
      ]
    );

  /* =======================================================
     JOYSTICK
     ======================================================= */

  const handleDirectionChange =
    useCallback(
      (
        direction:
          ElioDirection
      ) => {
        if (
          direction ===
          "STOP"
        ) {
          stopHeartbeat();

          safeSend(
            "STOP"
          );

          return;
        }

        startHeartbeat(
          direction
        );
      },
      [
        safeSend,
        startHeartbeat,
        stopHeartbeat,
      ]
    );

  /* =======================================================
     SPEED
     ======================================================= */

  const handleSpeedChange = (
    value: number
  ) => {
    setSpeed(
      value
    );

    safeSend(
      `SPEED:${value}`
    );
  };

  /* =======================================================
     CONNECT
     ======================================================= */

  const handleConnect =
    async () => {
      if (connecting) {
        return;
      }

      setConnecting(
        true
      );

      try {
        await connect();

        setConnected(
          true
        );

        await send(
          `SPEED:${speed}`
        );
      } catch (error) {
        console.error(
          "Could not connect to ELIO:",
          error
        );

        setConnected(
          false
        );
      } finally {
        setConnecting(
          false
        );
      }
    };

  /* =======================================================
     DISCONNECT
     ======================================================= */

  const handleDisconnect =
    useCallback(
      async () => {
        stopHeartbeat();

        try {
          await send(
            "STOP"
          );
        } catch {}

        try {
          await disconnect();
        } catch (error) {
          console.error(
            "ELIO disconnect failed:",
            error
          );
        }

        setConnected(
          false
        );

        setDistance(
          null
        );

        setRobotState(
          "DISCONNECTED"
        );
      },
      [
        stopHeartbeat,
      ]
    );

  /* =======================================================
     TELEMETRY
     ======================================================= */

  useEffect(() => {
    const unsubscribe = onTelemetry((telemetry: Telemetry) => {
      setDistance(telemetry.distance);
      setRobotState(telemetry.state);
      const online = telemetry.state !== 'DISCONNECTED' && isConnected();
      setConnected(online);
      if (!online) stopHeartbeat();
    });
    void reconnectKnown().catch(() => {});
    return unsubscribe;
  }, [stopHeartbeat]);

  /* =======================================================
     LEAVE PAGE SAFETY
     ======================================================= */

  useEffect(() => {
    return () => {
      stopHeartbeat();

      if (isConnected()) void send("STOP").catch(() => {});


    };
  }, [stopHeartbeat]);

  /* =======================================================
     RENDER
     ======================================================= */

  return (
    <>
      <div className="robotControlPage">
        {/* =================================================
            MAIN AREA
            ================================================= */}

        <section className="robotControlMain">
          <div className="robotControlHero">
            <div>
              <span className="robotControlEyebrow">
                {t.robotControl}
              </span>

              <h1>
                {t.title1}

                <br />

                <span>
                  {t.title2}
                </span>
              </h1>

              <p>
                {
                  t.description
                }
              </p>
            </div>

            <div
              className={[
                "robotConnectionBadge",

                connected
                  ? "connected"
                  : "",
              ].join(" ")}
            >
              <span />

              {connected
                ? t.connected
                : t.offline}
            </div>
          </div>

          <div className="robotDriveCard">
            {/* =============================================
                JOYSTICK
                ============================================= */}

            <div className="robotDriveArea">
              <ElioJoystick
                language={
                  language
                }
                onDirectionChange={
                  handleDirectionChange
                }
              />
            </div>

            {/* =============================================
                SETTINGS
                ============================================= */}

            <div className="robotControlSettings">
              {/* SPEED */}

              <div className="robotSettingCard">
                <div className="robotSettingHeader">
                  <div className="robotSettingIcon">
                    ⚡
                  </div>

                  <div>
                    <span>
                      {t.speed}
                    </span>

                    <strong>
                      {
                        t.driveSpeed
                      }
                    </strong>
                  </div>

                  <div className="robotSpeedValue">
                    {speed}%
                  </div>
                </div>

                <input
                  type="range"
                  min="20"
                  max="100"
                  step="5"
                  value={
                    speed
                  }
                  onChange={(
                    event
                  ) =>
                    handleSpeedChange(
                      Number(
                        event
                          .target
                          .value
                      )
                    )
                  }
                  className="robotSpeedSlider"
                />

                <div className="robotSpeedLabels">
                  <span>
                    {t.gentle}
                  </span>

                  <span>
                    {t.fast}
                  </span>
                </div>
              </div>

              {/* SAFETY */}

              <div className="robotSafetyCard">
                <div className="robotSafetyIcon">
                  🛡️
                </div>

                <div>
                  <span>
                    {
                      t.smartSafety
                    }
                  </span>

                  <strong>
                    {
                      t.obstacleProtection
                    }
                  </strong>

                  <p>
                    {
                      t.safetyDescription
                    }
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* =================================================
            ROBOT SIDE PANEL
            ================================================= */}

        <aside className="robotControlSide">
          <div className="robotSideHeader">
            <div>
              <span>
                {t.yourRobot}
              </span>

              <h2>
                ELIO
                <span>
                  👋
                </span>
              </h2>
            </div>

            <div
              className={[
                "robotSideDot",

                connected
                  ? "online"
                  : "",
              ].join(" ")}
            />
          </div>

          {/* ROBOT IMAGE */}

          <div className="robotControlPreview">
            <div className="robotPreviewCircle robotPreviewCircleOne" />
            <div className="robotPreviewCircle robotPreviewCircleTwo" />

            <span className="robotPreviewStar robotPreviewStarOne">
              ✦
            </span>

            <span className="robotPreviewStar robotPreviewStarTwo">
              ✦
            </span>

            <img
              src="/elio-robot-transparent.png"
              alt="ELIO robot"
              draggable="false"
            />
          </div>

          {/* CONNECTION */}

          {!connected ? (
            <button
              type="button"
              className="robotConnectButton"
              onClick={
                handleConnect
              }
              disabled={
                connecting
              }
            >
              <span>
                🔗
              </span>

              {connecting
                ? t.connecting
                : t.connect}
            </button>
          ) : (
            <button
              type="button"
              className="robotDisconnectButton"
              onClick={
                handleDisconnect
              }
            >
              {
                t.disconnect
              }
            </button>
          )}

          {/* STATUS */}

          <div
            className={[
              "robotStatusCard",

              connected
                ? "connected"
                : "",
            ].join(" ")}
          >
            <span className="robotStatusDot" />

            <div>
              <small>
                {t.status}
              </small>

              <strong>
                {connected
                  ? getRobotStateLabel(
                      robotState
                    )
                  : t.offline}
              </strong>
            </div>
          </div>

          {/* TELEMETRY */}

          <div className="robotTelemetry">
            <div className="robotTelemetryCard">
              <div className="robotTelemetryIcon">
                📏
              </div>

              <div>
                <span>
                  {
                    t.distance
                  }
                </span>

                <strong>
                  {distance ===
                  null
                    ? "-- cm"
                    : `${distance} cm`}
                </strong>
              </div>
            </div>

            <div className="robotTelemetryCard">
              <div className="robotTelemetryIcon">
                ⚡
              </div>

              <div>
                <span>
                  {
                    t.speed
                  }
                </span>

                <strong>
                  {speed}%
                </strong>
              </div>
            </div>

            <div className="robotTelemetryCard">
              <div className="robotTelemetryIcon">
                🤖
              </div>

              <div>
                <span>
                  {
                    t.state
                  }
                </span>

                <strong>
                  {getRobotStateLabel(
                    robotState
                  )}
                </strong>
              </div>
            </div>
          </div>

          {/* TIP */}

          <div className="robotFriendlyTip">
            <span>
              💡
            </span>

            <p>
              {t.tip}
            </p>
          </div>
        </aside>
      </div>

      {/* ===================================================
          STYLE
          =================================================== */}

      <style jsx global>{`
        /* =================================================
           PAGE
           ================================================= */

        .robotControlPage {
          display: grid;

          grid-template-columns:
            minmax(0, 1fr)
            285px;

          gap: 16px;

          width: 100%;
          height: 100%;

          min-width: 0;
          min-height: 0;

          padding: 14px;

          overflow: hidden;

          background:
            #f6fbff;
        }

        /* =================================================
           MAIN
           ================================================= */

        .robotControlMain {
          min-width: 0;
          min-height: 0;

          display: flex;
          flex-direction: column;

          gap: 14px;
        }

        /* =================================================
           HERO
           ================================================= */

        .robotControlHero {
          display: flex;

          justify-content:
            space-between;

          align-items:
            flex-start;

          gap: 24px;

          padding:
            18px
            23px;

          border:
            1px solid
            #dceaf5;

          border-radius:
            22px;

          background:
            linear-gradient(
              135deg,
              #ffffff 0%,
              #edf8ff 100%
            );

          box-shadow:
            0
            8px
            22px
            rgba(
              31,
              77,
              113,
              0.045
            );
        }

        .robotControlEyebrow {
          display: block;

          margin-bottom:
            5px;

          color:
            #ff7a12;

          font-size:
            9px;

          font-weight:
            900;

          letter-spacing:
            1.4px;
        }

        .robotControlHero h1 {
          margin: 0;

          color:
            #164d7c;

          font-size:
            clamp(
              25px,
              2.1vw,
              34px
            );

          line-height:
            1.05;

          font-weight:
            900;
        }

        .robotControlHero h1 span {
          color:
            #087df0;
        }

        .robotControlHero p {
          max-width:
            520px;

          margin:
            9px
            0
            0;

          color:
            #718ba3;

          font-size:
            12px;

          line-height:
            1.5;

          font-weight:
            600;
        }

        /* =================================================
           CONNECTION BADGE
           ================================================= */

        .robotConnectionBadge {
          display:
            inline-flex;

          align-items:
            center;

          gap:
            8px;

          min-height:
            38px;

          padding:
            0
            14px;

          border:
            1px solid
            #e4edf5;

          border-radius:
            999px;

          background:
            #ffffff;

          color:
            #7890a5;

          font-size:
            11px;

          font-weight:
            800;

          white-space:
            nowrap;
        }

        .robotConnectionBadge > span {
          width:
            8px;

          height:
            8px;

          flex-shrink:
            0;

          border-radius:
            50%;

          background:
            #bdccd8;
        }

        .robotConnectionBadge.connected {
          color:
            #269f68;

          background:
            #effbf5;

          border-color:
            #d0f0df;
        }

        .robotConnectionBadge.connected > span {
          background:
            #27bd77;

          box-shadow:
            0
            0
            0
            4px
            rgba(
              39,
              189,
              119,
              0.11
            );
        }

        /* =================================================
           DRIVE CARD
           ================================================= */

        .robotDriveCard {
          flex:
            1;

          min-height:
            0;

          display:
            grid;

          grid-template-columns:
            minmax(
              380px,
              1fr
            )
            270px;

          gap:
            15px;

          padding:
            17px;

          border:
            1px solid
            #dceaf5;

          border-radius:
            24px;

          background:
            #ffffff;

          box-shadow:
            0
            10px
            26px
            rgba(
              28,
              69,
              103,
              0.045
            );
        }

        /* =================================================
           DRIVE AREA
           ================================================= */

        .robotDriveArea {
          min-width:
            0;

          min-height:
            0;

          display:
            grid;

          place-items:
            center;

          border:
            1px solid
            #e0eef8;

          border-radius:
            21px;

          background:
            radial-gradient(
              circle at
              50%
              40%,
              #ffffff 0%,
              #f3faff 58%,
              #eaf6ff 100%
            );
        }

        /* =================================================
           JOYSTICK
           ================================================= */

        .elioJoystickSection {
          width:
            min(
              100%,
              460px
            );

          display:
            flex;

          flex-direction:
            column;

          align-items:
            center;

          padding:
            15px;
        }

        .elioJoystickIntro {
          width:
            100%;

          margin-bottom:
            14px;

          text-align:
            center;
        }

        .elioJoystickIntro > span {
          display:
            block;

          color:
            #ff7a12;

          font-size:
            9px;

          font-weight:
            900;

          letter-spacing:
            1.4px;
        }

        .elioJoystickIntro strong {
          display:
            block;

          margin-top:
            2px;

          color:
            #174e7d;

          font-size:
            20px;

          font-weight:
            900;
        }

        .elioJoystickIntro p {
          margin:
            4px
            0
            0;

          color:
            #7892aa;

          font-size:
            10px;

          font-weight:
            600;
        }

        /* =================================================
           JOYSTICK BASE
           ================================================= */

        .elioJoystickBase {
          position:
            relative;

          width:
            270px;

          height:
            270px;

          flex-shrink:
            0;

          border-radius:
            50%;

          cursor:
            grab;

          touch-action:
            none;

          user-select:
            none;

          background:
            radial-gradient(
              circle at
              center,
              #ffffff 0%,
              #eef8ff 57%,
              #dceeff 100%
            );

          border:
            1px solid
            #c8e1f5;

          box-shadow:
            inset
            0
            0
            0
            11px
            rgba(
              255,
              255,
              255,
              0.68
            ),
            0
            16px
            32px
            rgba(
              35,
              88,
              128,
              0.14
            );

          transition:
            box-shadow
            180ms ease;
        }

        .elioJoystickBase:active {
          cursor:
            grabbing;
        }

        .elioJoystickRing {
          position:
            absolute;

          inset:
            28px;

          border:
            1px dashed
            #bcd9ee;

          border-radius:
            50%;

          pointer-events:
            none;
        }

        /* =================================================
           JOYSTICK DIRECTION GLOW
           ================================================= */

        .elioJoystick-forward {
          box-shadow:
            inset
            0
            48px
            60px
            rgba(
              76,
              151,
              255,
              0.17
            ),
            0
            16px
            32px
            rgba(
              35,
              88,
              128,
              0.14
            );
        }

        .elioJoystick-backward {
          box-shadow:
            inset
            0
            -48px
            60px
            rgba(
              76,
              151,
              255,
              0.17
            ),
            0
            16px
            32px
            rgba(
              35,
              88,
              128,
              0.14
            );
        }

        .elioJoystick-left {
          box-shadow:
            inset
            48px
            0
            60px
            rgba(
              255,
              122,
              18,
              0.14
            ),
            0
            16px
            32px
            rgba(
              35,
              88,
              128,
              0.14
            );
        }

        .elioJoystick-right {
          box-shadow:
            inset
            -48px
            0
            60px
            rgba(
              255,
              122,
              18,
              0.14
            ),
            0
            16px
            32px
            rgba(
              35,
              88,
              128,
              0.14
            );
        }

        /* =================================================
           JOYSTICK ARROWS
           ================================================= */

        .elioJoystickArrow {
          position:
            absolute;

          width:
            34px;

          height:
            34px;

          display:
            grid;

          place-items:
            center;

          border-radius:
            11px;

          color:
            #76a3c5;

          background:
            rgba(
              255,
              255,
              255,
              0.8
            );

          font-size:
            18px;

          font-weight:
            900;

          pointer-events:
            none;

          box-shadow:
            0
            4px
            10px
            rgba(
              38,
              81,
              116,
              0.06
            );
        }

        .elioJoystickArrowUp {
          top:
            18px;

          left:
            50%;

          transform:
            translateX(
              -50%
            );
        }

        .elioJoystickArrowDown {
          bottom:
            18px;

          left:
            50%;

          transform:
            translateX(
              -50%
            );
        }

        .elioJoystickArrowLeft {
          left:
            18px;

          top:
            50%;

          transform:
            translateY(
              -50%
            );
        }

        .elioJoystickArrowRight {
          right:
            18px;

          top:
            50%;

          transform:
            translateY(
              -50%
            );
        }

        /* =================================================
           CENTER DOT
           ================================================= */

        .elioJoystickCenterDot {
          position:
            absolute;

          left:
            50%;

          top:
            50%;

          width:
            9px;

          height:
            9px;

          transform:
            translate(
              -50%,
              -50%
            );

          border-radius:
            50%;

          background:
            #b4d1e7;

          pointer-events:
            none;
        }

        /* =================================================
           JOYSTICK KNOB
           ================================================= */

        .elioJoystickKnob {
          position:
            absolute;

          left:
            calc(
              50% - 40px
            );

          top:
            calc(
              50% - 40px
            );

          width:
            80px;

          height:
            80px;

          display:
            grid;

          place-items:
            center;

          border-radius:
            50%;

          z-index:
            5;

          pointer-events:
            none;

          will-change:
            transform;
        }

        .elioJoystickKnobInner {
          width:
            80px;

          height:
            80px;

          display:
            grid;

          place-items:
            center;

          border-radius:
            50%;

          color:
            #ffffff;

          background:
            linear-gradient(
              145deg,
              #36a6ff 0%,
              #087df0 65%,
              #006ed8 100%
            );

          border:
            5px solid
            #ffffff;

          box-shadow:
            0
            12px
            25px
            rgba(
              8,
              125,
              240,
              0.32
            ),
            inset
            0
            3px
            5px
            rgba(
              255,
              255,
              255,
              0.25
            );
        }

        .elioJoystickKnobInner span {
          font-size:
            23px;

          line-height:
            1;
        }

        /* =================================================
           JOYSTICK STATUS
           ================================================= */

        .elioJoystickState {
          margin-top:
            14px;

          display:
            grid;

          grid-template-columns:
            auto
            auto;

          align-items:
            center;

          justify-content:
            center;

          column-gap:
            7px;

          color:
            #174e7d;
        }

        .elioJoystickStateDot {
          width:
            8px;

          height:
            8px;

          border-radius:
            50%;

          background:
            #b7c8d5;
        }

        .elioJoystickStateDot.active {
          background:
            #27b875;

          box-shadow:
            0
            0
            0
            4px
            rgba(
              39,
              184,
              117,
              0.12
            );
        }

        .elioJoystickState strong {
          font-size:
            11px;

          font-weight:
            850;
        }

        .elioJoystickState > span:last-child {
          grid-column:
            1 / -1;

          margin-top:
            4px;

          color:
            #879caf;

          font-size:
            9px;

          text-align:
            center;
        }

        /* =================================================
           SETTINGS
           ================================================= */

        .robotControlSettings {
          display:
            flex;

          flex-direction:
            column;

          gap:
            12px;
        }

        .robotSettingCard,
        .robotSafetyCard {
          padding:
            17px;

          border:
            1px solid
            #e2edf6;

          border-radius:
            18px;

          background:
            #fbfdff;
        }

        .robotSettingHeader {
          display:
            grid;

          grid-template-columns:
            38px
            1fr
            auto;

          align-items:
            center;

          gap:
            10px;
        }

        .robotSettingIcon {
          width:
            38px;

          height:
            38px;

          display:
            grid;

          place-items:
            center;

          border-radius:
            12px;

          background:
            #e8f5ff;

          font-size:
            17px;
        }

        .robotSettingHeader span,
        .robotSafetyCard span {
          display:
            block;

          color:
            #91a8bb;

          font-size:
            8px;

          font-weight:
            900;

          letter-spacing:
            1px;
        }

        .robotSettingHeader strong,
        .robotSafetyCard strong {
          display:
            block;

          margin-top:
            2px;

          color:
            #164d7a;

          font-size:
            12px;

          font-weight:
            850;
        }

        .robotSpeedValue {
          color:
            #087df0;

          font-size:
            18px;

          font-weight:
            900;
        }

        /* =================================================
           SPEED SLIDER
           ================================================= */

        .robotSpeedSlider {
          width:
            100%;

          margin-top:
            18px;

          accent-color:
            #087df0;

          cursor:
            pointer;
        }

        .robotSpeedLabels {
          display:
            flex;

          justify-content:
            space-between;

          margin-top:
            5px;

          color:
            #9aabba;

          font-size:
            8px;

          font-weight:
            700;
        }

        /* =================================================
           SAFETY
           ================================================= */

        .robotSafetyCard {
          display:
            grid;

          grid-template-columns:
            38px
            1fr;

          gap:
            10px;

          background:
            #fffaf1;

          border-color:
            #f8e6bf;
        }

        .robotSafetyIcon {
          width:
            38px;

          height:
            38px;

          display:
            grid;

          place-items:
            center;

          border-radius:
            12px;

          background:
            #fff1d7;
        }

        .robotSafetyCard p {
          margin:
            7px
            0
            0;

          color:
            #8c8067;

          font-size:
            9px;

          line-height:
            1.45;

          font-weight:
            600;
        }

        /* =================================================
           SIDE PANEL
           ================================================= */

        .robotControlSide {
          min-width:
            0;

          min-height:
            0;

          display:
            flex;

          flex-direction:
            column;

          gap:
            10px;

          padding:
            16px;

          border:
            1px solid
            #dceaf5;

          border-radius:
            22px;

          background:
            #ffffff;

          overflow-y:
            auto;
        }

        .robotSideHeader {
          display:
            flex;

          justify-content:
            space-between;

          align-items:
            flex-start;
        }

        .robotSideHeader > div > span {
          display:
            block;

          color:
            #91a7bb;

          font-size:
            8px;

          font-weight:
            900;

          letter-spacing:
            1px;
        }

        .robotSideHeader h2 {
          margin:
            3px
            0
            0;

          color:
            #075fbc;

          font-size:
            22px;

          font-weight:
            900;
        }

        .robotSideHeader h2 span {
          margin-left:
            4px;

          font-size:
            14px;
        }

        .robotSideDot {
          width:
            10px;

          height:
            10px;

          margin-top:
            8px;

          border-radius:
            50%;

          background:
            #ff6e73;

          box-shadow:
            0
            0
            0
            5px
            #ffe8e9;
        }

        .robotSideDot.online {
          background:
            #29bf78;

          box-shadow:
            0
            0
            0
            5px
            #e3f8ee;
        }

        /* =================================================
           ROBOT PREVIEW
           ================================================= */

        .robotControlPreview {
          position:
            relative;

          height:
            185px;

          display:
            grid;

          place-items:
            center;

          overflow:
            hidden;

          border-radius:
            18px;

          background:
            linear-gradient(
              145deg,
              #e9f7ff,
              #f7fbff
            );
        }

        .robotControlPreview img {
          position:
            relative;

          z-index:
            3;

          width:
            90%;

          height:
            90%;

          object-fit:
            contain;
        }

        .robotPreviewCircle {
          position:
            absolute;

          border-radius:
            50%;

          background:
            rgba(
              255,
              255,
              255,
              0.65
            );
        }

        .robotPreviewCircleOne {
          width:
            75px;

          height:
            75px;

          left:
            -25px;

          top:
            10px;
        }

        .robotPreviewCircleTwo {
          width:
            90px;

          height:
            90px;

          right:
            -30px;

          bottom:
            -25px;
        }

        .robotPreviewStar {
          position:
            absolute;

          z-index:
            4;

          font-size:
            17px;
        }

        .robotPreviewStarOne {
          left:
            14px;

          bottom:
            21px;

          color:
            #ff7a12;
        }

        .robotPreviewStarTwo {
          right:
            15px;

          top:
            18px;

          color:
            #087df0;
        }

        /* =================================================
           CONNECT BUTTON
           ================================================= */

        .robotConnectButton,
        .robotDisconnectButton {
          width:
            100%;

          min-height:
            42px;

          border-radius:
            13px;

          cursor:
            pointer;

          font-family:
            inherit;

          font-size:
            11px;

          font-weight:
            850;

          transition:
            transform
            160ms ease;
        }

        .robotConnectButton:hover,
        .robotDisconnectButton:hover {
          transform:
            translateY(
              -1px
            );
        }

        .robotConnectButton {
          border:
            0;

          color:
            #ffffff;

          background:
            linear-gradient(
              135deg,
              #1c93fb,
              #087df0
            );

          box-shadow:
            0
            7px
            16px
            rgba(
              8,
              125,
              240,
              0.18
            );
        }

        .robotDisconnectButton {
          color:
            #d75555;

          background:
            #fff2f2;

          border:
            1px solid
            #ffdada;
        }

        /* =================================================
           STATUS
           ================================================= */

        .robotStatusCard {
          display:
            flex;

          align-items:
            center;

          gap:
            9px;

          padding:
            11px;

          border-radius:
            14px;

          background:
            #fff2f2;
        }

        .robotStatusCard.connected {
          background:
            #effbf5;
        }

        .robotStatusDot {
          width:
            8px;

          height:
            8px;

          flex-shrink:
            0;

          border-radius:
            50%;

          background:
            #fa646b;
        }

        .robotStatusCard.connected
          .robotStatusDot {
          background:
            #25bb76;
        }

        .robotStatusCard small {
          display:
            block;

          color:
            #9b8b8b;

          font-size:
            7px;

          font-weight:
            900;

          letter-spacing:
            1px;
        }

        .robotStatusCard strong {
          display:
            block;

          margin-top:
            2px;

          color:
            #df4e54;

          font-size:
            10px;

          font-weight:
            850;
        }

        .robotStatusCard.connected strong {
          color:
            #249b65;
        }

        /* =================================================
           TELEMETRY
           ================================================= */

        .robotTelemetry {
          display:
            flex;

          flex-direction:
            column;

          gap:
            8px;
        }

        .robotTelemetryCard {
          display:
            grid;

          grid-template-columns:
            36px
            1fr;

          align-items:
            center;

          gap:
            9px;

          padding:
            9px;

          border:
            1px solid
            #e2edf6;

          border-radius:
            13px;

          background:
            #ffffff;
        }

        .robotTelemetryIcon {
          width:
            36px;

          height:
            36px;

          display:
            grid;

          place-items:
            center;

          border-radius:
            11px;

          background:
            #edf7ff;

          font-size:
            15px;
        }

        .robotTelemetryCard span {
          display:
            block;

          color:
            #91a7b9;

          font-size:
            8px;

          font-weight:
            700;
        }

        .robotTelemetryCard strong {
          display:
            block;

          margin-top:
            1px;

          color:
            #064d8d;

          font-size:
            12px;

          font-weight:
            900;
        }

        /* =================================================
           TIP
           ================================================= */

        .robotFriendlyTip {
          display:
            flex;

          align-items:
            flex-start;

          gap:
            8px;

          margin-top:
            auto;

          padding:
            10px;

          border:
            1px solid
            #ffe2a0;

          border-radius:
            13px;

          background:
            #fff9e9;
        }

        .robotFriendlyTip p {
          margin:
            0;

          color:
            #856d40;

          font-size:
            8px;

          line-height:
            1.45;

          font-weight:
            650;
        }

        /* =================================================
           SMALLER DESKTOP HEIGHT
           ================================================= */

        @media (
          max-height:
          780px
        ) {
          .robotControlHero {
            padding:
              13px
              18px;
          }

          .robotControlHero h1 {
            font-size:
              25px;
          }

          .robotDriveCard {
            padding:
              11px;
          }

          .elioJoystickBase {
            width:
              225px;

            height:
              225px;
          }

          .elioJoystickKnob {
            left:
              calc(
                50% - 35px
              );

            top:
              calc(
                50% - 35px
              );

            width:
              70px;

            height:
              70px;
          }

          .elioJoystickKnobInner {
            width:
              70px;

            height:
              70px;
          }

          .robotControlPreview {
            height:
              155px;
          }
        }
      `}</style>
    </>
  );
}