import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

import {
  Alert,
  PanResponder,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { useFocusEffect } from 'expo-router';
import {useElioConnection} from '../context/ElioConnection';
import {useLanguage} from '../context/Language';
import {Pressable} from 'react-native';

import { C } from '../constants/theme';

import {
  Title,
  Sub,
  Card,
} from '../components/UI';

import {
  connectToElio,
  disconnectElio,
  onElioDisconnected,
  RobotCommand,
  RobotTelemetry,
  sendRobotCommand,
  sendRobotSpeed,
} from '../services/robot';


// =====================================================
// SPEED
// =====================================================

const MIN_SPEED = 30;
const MAX_SPEED = 100;


// =====================================================
// JOYSTICK
// =====================================================

const JOYSTICK_SIZE = 220;
const KNOB_SIZE = 76;

const MAX_JOYSTICK_DISTANCE =
  (JOYSTICK_SIZE - KNOB_SIZE) / 2;

const DEAD_ZONE = 25;


// =====================================================
// HEARTBEAT
// =====================================================

const MOVEMENT_HEARTBEAT_MS = 120;


export default function Robot() {
  const globalConnection=useElioConnection();
  const {t}=useLanguage();
  const [robotPanel,setRobotPanel]=useState<'joystick'|'speed'>('joystick');

  // ===================================================
  // STATE
  // ===================================================

  const [
    connected,
    setConnected,
  ] = useState(false);

  const [
    connecting,
    setConnecting,
  ] = useState(false);

  const [
    telemetry,
    setTelemetry,
  ] = useState<RobotTelemetry>({
    distance: null,
    state: 'DISCONNECTED',
  });

  const [
    speed,
    setSpeed,
  ] = useState(60);

  const [
    joystickX,
    setJoystickX,
  ] = useState(0);

  const [
    joystickY,
    setJoystickY,
  ] = useState(0);

  const [
    activeDirection,
    setActiveDirection,
  ] = useState<RobotCommand | null>(
    null
  );


  // ===================================================
  // REFS
  // ===================================================

  const disconnectSub =
    useRef<{
      remove: () => void;
    } | null>(null);

  const sliderWidth =
    useRef(1);

  const movementInterval =
    useRef<
      ReturnType<typeof setInterval> | null
    >(null);

  const directionRef =
    useRef<RobotCommand | null>(
      null
    );

  const connectedRef =
    useRef(false);

  // Prevent concurrent BLE scans and reconnect after a tab change.
  const connectingRef = useRef(false);
  const robotScreenActiveRef = useRef(false);
  const connectionGenerationRef = useRef(0);



  // ===================================================
  // KEEP CONNECTION REF UPDATED
  // ===================================================

  useEffect(() => {

    connectedRef.current =
      connected;

  }, [connected]);


  // ===================================================
  // HEARTBEAT
  // ===================================================

  function stopHeartbeat() {

    if (
      movementInterval.current
    ) {

      clearInterval(
        movementInterval.current
      );

      movementInterval.current =
        null;
    }
  }


  function startHeartbeat() {

    stopHeartbeat();

    movementInterval.current =
      setInterval(
        () => {

          const direction =
            directionRef.current;

          if (
            direction &&
            connectedRef.current
          ) {

            void sendRobotCommand(
              direction
            );
          }

        },
        MOVEMENT_HEARTBEAT_MS
      );
  }


  // ===================================================
  // RESET JOYSTICK + STOP
  // ===================================================

  function resetJoystick(
    sendStop = true
  ) {

    stopHeartbeat();

    directionRef.current =
      null;

    setActiveDirection(
      null
    );

    setJoystickX(0);
    setJoystickY(0);

    if (
      sendStop &&
      connectedRef.current
    ) {

      void sendRobotCommand(
        'stop'
      );

      setTimeout(
        () => {

          if (
            connectedRef.current &&
            directionRef.current === null
          ) {

            void sendRobotCommand(
              'stop'
            );
          }

        },
        80
      );
    }
  }


  // ===================================================
  // LEAVE ROBOT SCREEN
  // STOP + DISCONNECT AUTOMATIC
  // ===================================================

  async function leaveRobotScreen() {

    // 1. Oprim imediat heartbeat-ul
    stopHeartbeat();

    // 2. Eliminăm direcția activă
    directionRef.current = null;

    setActiveDirection(null);

    // 3. Joystick în centru
    setJoystickX(0);
    setJoystickY(0);

    // 4. Dacă suntem conectați,
    // trimitem STOP înainte de disconnect
    if (connectedRef.current) {

      try {

        await sendRobotCommand(
          'stop'
        );

      } catch (error) {

        console.log(
          'ELIO stop before leaving:',
          error
        );
      }
    }

    // 5. Deconectăm BLE
    try {

      await disconnectElio();

    } catch (error) {

      console.log(
        'ELIO auto disconnect:',
        error
      );
    }

    // 6. Curățăm listener-ul
    disconnectSub
      .current
      ?.remove();

    disconnectSub.current =
      null;

    // 7. Resetăm starea conexiunii
    connectedRef.current =
      false;

    setConnected(false);

    setTelemetry({
      distance: null,
      state: 'DISCONNECTED',
    });
  }


  // ===================================================
  // AUTO CONNECT + RETRY WHILE ROBOT TAB IS ACTIVE
  // ===================================================

  useFocusEffect(useCallback(()=>{
    robotScreenActiveRef.current=true;
    // BLE provider rămâne montat în timpul navigării.
    return ()=>{
      robotScreenActiveRef.current=false;
      stopHeartbeat();
      directionRef.current=null;
      setActiveDirection(null);
      setJoystickX(0);setJoystickY(0);
      void sendRobotCommand('stop');
    };
  },[]));

  useEffect(()=>{
    connectedRef.current=globalConnection.connected;
    setConnected(globalConnection.connected);
    setConnecting(globalConnection.connecting);
    setTelemetry(globalConnection.telemetry);
  },[globalConnection.connected,globalConnection.connecting,globalConnection.telemetry]);

  // ===================================================
  // CLEANUP
  // ===================================================

  useEffect(() => {

    return () => {

      stopHeartbeat();

      disconnectSub
        .current
        ?.remove();
    };

  }, []);


  // ===================================================
  // CONNECT
  // ===================================================

  async function connect(silent = false) {

    if (connectingRef.current || connectedRef.current || !robotScreenActiveRef.current) {
      return;
    }

    connectingRef.current = true;
    const generation = connectionGenerationRef.current;
    setConnecting(true);

    try {

      await connectToElio(
        data => {
          if (robotScreenActiveRef.current && generation === connectionGenerationRef.current) {
            setTelemetry(data);
          }
        }
      );

      if (!robotScreenActiveRef.current || generation !== connectionGenerationRef.current) {
        await disconnectElio();
        return;
      }

      connectedRef.current =
        true;

      setConnected(true);

      setTelemetry(
        current => ({
          ...current,
          state: 'CONNECTED',
        })
      );


      disconnectSub
        .current
        ?.remove();


      disconnectSub.current =
        onElioDisconnected(
          () => {

            stopHeartbeat();

            directionRef.current =
              null;

            connectedRef.current =
              false;

            setConnected(false);

            setActiveDirection(
              null
            );

            setJoystickX(0);
            setJoystickY(0);

            setTelemetry({
              distance: null,
              state: 'DISCONNECTED',
            });
          }
        );


      await sendRobotSpeed(
        speed
      );

    } catch (error: any) {

      connectedRef.current =
        false;

      setConnected(false);

      if (!silent && robotScreenActiveRef.current) {
        Alert.alert(
          'ELIO',
          error?.message || 'Could not connect to ELIO'
        );
      }

    } finally {

      connectingRef.current = false;
      if (robotScreenActiveRef.current) {
        setConnecting(false);
      }
    }
  }


  // ===================================================
  // MANUAL DISCONNECT
  // ===================================================

  async function disconnect() {

    await leaveRobotScreen();
  }


  // ===================================================
  // SET DIRECTION
  // ===================================================

  function changeDirection(
    newDirection:
      RobotCommand | null
  ) {

    const oldDirection =
      directionRef.current;


    if (
      oldDirection ===
      newDirection
    ) {

      return;
    }


    directionRef.current =
      newDirection;

    setActiveDirection(
      newDirection
    );


    if (!newDirection) {

      stopHeartbeat();

      if (
        connectedRef.current
      ) {

        void sendRobotCommand(
          'stop'
        );
      }

      return;
    }


    if (
      !connectedRef.current
    ) {

      return;
    }


    void sendRobotCommand(
      newDirection
    );


    startHeartbeat();
  }


  // ===================================================
  // DETERMINE DIRECTION
  // ===================================================

  function getDirection(
    x: number,
    y: number
  ): RobotCommand | null {

    const distance =
      Math.sqrt(
        x * x +
        y * y
      );


    if (
      distance <
      DEAD_ZONE
    ) {

      return null;
    }


    if (
      Math.abs(x) >
      Math.abs(y)
    ) {

      if (x > 0) {

        return 'right';

      } else {

        return 'left';
      }
    }


    if (y < 0) {

      return 'forward';

    } else {

      return 'backward';
    }
  }


  // ===================================================
  // JOYSTICK MOVEMENT
  // ===================================================

  function updateJoystick(
    rawX: number,
    rawY: number
  ) {

    const distance =
      Math.sqrt(
        rawX * rawX +
        rawY * rawY
      );


    let x = rawX;
    let y = rawY;


    if (
      distance >
      MAX_JOYSTICK_DISTANCE
    ) {

      const scale =
        MAX_JOYSTICK_DISTANCE /
        distance;

      x =
        rawX *
        scale;

      y =
        rawY *
        scale;
    }


    setJoystickX(x);
    setJoystickY(y);


    const direction =
      getDirection(
        x,
        y
      );


    changeDirection(
      direction
    );
  }


  // ===================================================
  // PAN RESPONDER
  // ===================================================

  const panResponder =
    useMemo(
      () =>
        PanResponder.create({

          onStartShouldSetPanResponder:
            () => true,

          onMoveShouldSetPanResponder:
            () => true,


          onPanResponderGrant:
            () => {

              setJoystickX(0);
              setJoystickY(0);

              changeDirection(
                null
              );
            },


          onPanResponderMove:
            (
              _event,
              gesture
            ) => {

              updateJoystick(
                gesture.dx,
                gesture.dy
              );
            },


          onPanResponderRelease:
            () => {

              resetJoystick(
                true
              );
            },


          onPanResponderTerminate:
            () => {

              resetJoystick(
                true
              );
            },


          onPanResponderTerminationRequest:
            () => false,

        }),
      []
    );


  // ===================================================
  // SPEED
  // ===================================================

  function calculateSpeed(
    x: number
  ) {

    const width =
      sliderWidth.current;


    const ratio =
      Math.max(
        0,
        Math.min(
          1,
          x / width
        )
      );


    return Math.round(
      MIN_SPEED +
        ratio *
          (
            MAX_SPEED -
            MIN_SPEED
          )
    );
  }


  function updateSpeed(
    x: number
  ) {

    const newSpeed =
      calculateSpeed(x);


    setSpeed(
      newSpeed
    );


    if (
      connectedRef.current
    ) {

      void sendRobotSpeed(
        newSpeed
      );
    }
  }


  const sliderPercent =
    (
      speed -
      MIN_SPEED
    ) /
    (
      MAX_SPEED -
      MIN_SPEED
    );


  // ===================================================
  // DIRECTION LABEL
  // ===================================================

  function directionLabel() {

    switch (
      activeDirection
    ) {

      case 'forward':
        return t('Forward');

      case 'backward':
        return t('Backward');

      case 'left':
        return t('Left');

      case 'right':
        return t('Right');

      default:
        return t('Ready');
    }
  }


  // ===================================================
  // UI
  // ===================================================

  return (

    <ScrollView

      style={
        s.page
      }

      contentContainerStyle={
        s.content
      }

      showsVerticalScrollIndicator={
        false
      }

      keyboardShouldPersistTaps="handled"

      nestedScrollEnabled
    >

      <Title>{t('Robot Control')}</Title>


      <Sub>{t('Bluetooth movement • Connection stays active across tabs.')}</Sub>
      <View style={{flexDirection:'row',gap:10}}><Pressable onPress={()=>{void sendRobotCommand('stop');setRobotPanel('joystick')}} style={[s.panelTab,{backgroundColor:robotPanel==='joystick'?C.accent:C.card2}]}><Text style={{color:robotPanel==='joystick'?'#101827':C.text,fontWeight:'800'}}>{t('Joystick')}</Text></Pressable><Pressable onPress={()=>{resetJoystick(true);setRobotPanel('speed')}} style={[s.panelTab,{backgroundColor:robotPanel==='speed'?C.accent:C.card2}]}><Text style={{color:robotPanel==='speed'?'#101827':C.text,fontWeight:'800'}}>{t('Speed & distance')}</Text></Pressable></View>



      {robotPanel==='speed' && <>
      {/* SPEED */}

      <Card>

        <View
          style={
            s.speedHeader
          }
        >

          <View>

            <Text
              style={
                s.speedTitle
              }
            >{t('Motor speed')}</Text>


            <Text
              style={
                s.speedSubtitle
              }
            >{t('Drag to adjust')}</Text>

          </View>


          <View
            style={
              s.speedBadge
            }
          >

            <Text
              style={
                s.speedValue
              }
            >
              {speed}%
            </Text>

          </View>

        </View>


        <View
          style={
            s.sliderLabels
          }
        >

          <Text
            style={
              s.sliderLabel
            }
          >
            30%
          </Text>


          <Text
            style={
              s.sliderLabel
            }
          >
            100%
          </Text>

        </View>


        <View

          style={
            s.sliderTouchArea
          }

          onLayout={
            event => {

              sliderWidth.current =
                event
                  .nativeEvent
                  .layout
                  .width;
            }
          }

          onStartShouldSetResponder={
            () => true
          }

          onMoveShouldSetResponder={
            () => true
          }

          onResponderGrant={
            event => {

              updateSpeed(
                event.nativeEvent.locationX
              );
            }
          }

          onResponderMove={
            event => {

              updateSpeed(
                event.nativeEvent.locationX
              );
            }
          }
        >

          <View
            style={
              s.sliderTrack
            }
          />


          <View
            style={[
              s.sliderFill,

              {
                width:
                  `${sliderPercent * 100}%`,
              },
            ]}
          />


          <View
            pointerEvents="none"

            style={[
              s.sliderThumb,

              {
                left:
                  `${sliderPercent * 100}%`,
              },
            ]}
          />

        </View>

      </Card>


      <Card><Text style={{color:C.muted,fontSize:15}}>{t('Ultrasonic sensor')}</Text><Text style={{color:C.accent,fontSize:38,fontWeight:'900',marginTop:12}}>{telemetry.distance===null?'—':telemetry.distance.toFixed(1)+' cm'}</Text><Text style={{color:C.muted}}>{t('Distance from obstacle')}</Text></Card>
      </>}
      {robotPanel==='joystick' && <>
      {/* JOYSTICK */}

      <View
        style={
          s.controlSection
        }
      >

        <Text
          style={
            s.controlTitle
          }
        >{t('Movement')}</Text>


        <Text
          style={
            s.controlSubtitle
          }
        >{t('Drag the joystick to move ELIO')}</Text>


        <View
          style={[
            s.directionBadge,

            activeDirection &&
              s.directionBadgeActive,
          ]}
        >

          <View
            style={[
              s.directionDot,

              activeDirection &&
                s.directionDotActive,
            ]}
          />


          <Text
            style={[
              s.directionText,

              activeDirection &&
                s.directionTextActive,
            ]}
          >
            {
              directionLabel()
            }
          </Text>

        </View>


        <View
          style={
            s.joystickWrapper
          }
        >

          <Text
            style={[
              s.joystickArrow,
              s.arrowTop,

              activeDirection ===
                'forward' &&
                s.arrowActive,
            ]}
          >
            ▲
          </Text>


          <Text
            style={[
              s.joystickArrow,
              s.arrowLeft,

              activeDirection ===
                'left' &&
                s.arrowActive,
            ]}
          >
            ◀
          </Text>


          <Text
            style={[
              s.joystickArrow,
              s.arrowRight,

              activeDirection ===
                'right' &&
                s.arrowActive,
            ]}
          >
            ▶
          </Text>


          <Text
            style={[
              s.joystickArrow,
              s.arrowBottom,

              activeDirection ===
                'backward' &&
                s.arrowActive,
            ]}
          >
            ▼
          </Text>


          <View
            {...panResponder.panHandlers}

            style={
              s.joystickBase
            }
          >

            <View
              pointerEvents="none"
              style={
                s.joystickRing
              }
            />


            <View
              pointerEvents="none"
              style={
                s.deadZone
              }
            />


            <View
              pointerEvents="none"
              style={
                s.horizontalLine
              }
            />


            <View
              pointerEvents="none"
              style={
                s.verticalLine
              }
            />


            <View
              pointerEvents="none"

              style={[
                s.joystickKnob,

                activeDirection &&
                  s.joystickKnobActive,

                {
                  transform: [
                    {
                      translateX:
                        joystickX,
                    },
                    {
                      translateY:
                        joystickY,
                    },
                  ],
                },
              ]}
            >

              <View
                style={
                  s.knobInner
                }
              />

            </View>

          </View>

        </View>


        <Text
          style={
            s.releaseText
          }
        >{t('Release the joystick to stop')}</Text>

      </View>
      </>}
    </ScrollView>
  );
}


// =====================================================
// STYLES
// =====================================================

const s =
  StyleSheet.create({

    panelTab:{flex:1,paddingVertical:14,paddingHorizontal:8,borderRadius:14,alignItems:'center',justifyContent:'center'},
    page: {
      flex: 1,
      backgroundColor: C.bg,
    },

    content: {
      paddingHorizontal: 22,
      paddingTop: 58,
      paddingBottom: 170,
      gap: 14,
    },

    label: {
      color: C.muted,
    },

    status: {
      color: C.accent,
      fontSize: 18,
      fontWeight: '800',
      marginTop: 5,
    },

    off: {
      color: C.muted,
    },

    telemetryRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginTop: 15,
    },

    telemetryRight: {
      alignItems: 'flex-end',
      maxWidth: '55%',
    },

    telemetryLabel: {
      color: C.muted,
      fontSize: 12,
    },

    telemetryValue: {
      color: C.text,
      fontWeight: '800',
      marginTop: 3,
    },

    stateValue: {
      color: C.text,
      fontWeight: '700',
      marginTop: 3,
      fontSize: 12,
    },

    connect: {
      marginTop: 16,
      paddingVertical: 13,
      borderRadius: 16,
      backgroundColor: C.accent,
      alignItems: 'center',
    },

    connectText: {
      fontWeight: '900',
      color: C.bg,
    },

    speedHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },

    speedTitle: {
      color: C.text,
      fontSize: 17,
      fontWeight: '900',
    },

    speedSubtitle: {
      color: C.muted,
      fontSize: 12,
      marginTop: 3,
    },

    speedBadge: {
      minWidth: 65,
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 14,
      backgroundColor: C.card2,
      alignItems: 'center',
    },

    speedValue: {
      color: C.accent,
      fontSize: 20,
      fontWeight: '900',
    },

    sliderLabels: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginTop: 17,
    },

    sliderLabel: {
      color: C.muted,
      fontSize: 11,
      fontWeight: '700',
    },

    sliderTouchArea: {
      height: 50,
      justifyContent: 'center',
      position: 'relative',
    },

    sliderTrack: {
      position: 'absolute',
      left: 0,
      right: 0,
      height: 8,
      borderRadius: 8,
      backgroundColor: C.card2,
    },

    sliderFill: {
      position: 'absolute',
      left: 0,
      height: 8,
      borderRadius: 8,
      backgroundColor: C.accent,
    },

    sliderThumb: {
      position: 'absolute',
      width: 26,
      height: 26,
      borderRadius: 13,
      marginLeft: -13,
      backgroundColor: C.accent,
      borderWidth: 3,
      borderColor: C.bg,
    },

    controlSection: {
      alignItems: 'center',
      marginTop: 8,
    },

    controlTitle: {
      color: C.text,
      fontSize: 19,
      fontWeight: '900',
    },

    controlSubtitle: {
      color: C.muted,
      fontSize: 12,
      marginTop: 4,
    },

    directionBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 7,
      marginTop: 12,
      paddingHorizontal: 14,
      paddingVertical: 7,
      borderRadius: 20,
      backgroundColor: C.card2,
      borderWidth: 1,
      borderColor: C.line,
    },

    directionBadgeActive: {
      borderColor: C.accent,
    },

    directionDot: {
      width: 7,
      height: 7,
      borderRadius: 4,
      backgroundColor: C.muted,
    },

    directionDotActive: {
      backgroundColor: C.accent,
    },

    directionText: {
      color: C.muted,
      fontWeight: '800',
      fontSize: 12,
    },

    directionTextActive: {
      color: C.accent,
    },

    joystickWrapper: {
      width: JOYSTICK_SIZE + 90,
      height: JOYSTICK_SIZE + 90,
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: 4,
      position: 'relative',
    },

    joystickBase: {
      width: JOYSTICK_SIZE,
      height: JOYSTICK_SIZE,
      borderRadius: JOYSTICK_SIZE / 2,
      backgroundColor: C.card2,
      borderWidth: 2,
      borderColor: C.line,
      alignItems: 'center',
      justifyContent: 'center',
      overflow: 'visible',
    },

    joystickRing: {
      position: 'absolute',
      width: JOYSTICK_SIZE - 34,
      height: JOYSTICK_SIZE - 34,
      borderRadius: (JOYSTICK_SIZE - 34) / 2,
      borderWidth: 1,
      borderColor: C.line,
      opacity: 0.7,
    },

    deadZone: {
      position: 'absolute',
      width: DEAD_ZONE * 2,
      height: DEAD_ZONE * 2,
      borderRadius: DEAD_ZONE,
      borderWidth: 1,
      borderColor: C.line,
      opacity: 0.6,
    },

    horizontalLine: {
      position: 'absolute',
      width: JOYSTICK_SIZE - 55,
      height: 1,
      backgroundColor: C.line,
      opacity: 0.35,
    },

    verticalLine: {
      position: 'absolute',
      width: 1,
      height: JOYSTICK_SIZE - 55,
      backgroundColor: C.line,
      opacity: 0.35,
    },

    joystickKnob: {
      position: 'absolute',
      width: KNOB_SIZE,
      height: KNOB_SIZE,
      borderRadius: KNOB_SIZE / 2,
      backgroundColor: C.card2,
      borderWidth: 3,
      borderColor: C.accent,
      alignItems: 'center',
      justifyContent: 'center',
    },

    joystickKnobActive: {
      backgroundColor: C.accent,
    },

    knobInner: {
      width: 18,
      height: 18,
      borderRadius: 9,
      backgroundColor: C.bg,
      opacity: 0.8,
    },

    joystickArrow: {
      position: 'absolute',
      color: C.muted,
      fontSize: 19,
      fontWeight: '900',
    },

    arrowActive: {
      color: C.accent,
    },

    arrowTop: {
      top: 3,
    },

    arrowBottom: {
      bottom: 3,
    },

    arrowLeft: {
      left: 8,
      top: '47%',
    },

    arrowRight: {
      right: 8,
      top: '47%',
    },

    releaseText: {
      color: C.muted,
      fontSize: 11,
      marginTop: -8,
    },

    safetyBox: {
      paddingHorizontal: 16,
      paddingVertical: 14,
      borderRadius: 18,
      backgroundColor: C.card2,
      borderWidth: 1,
      borderColor: C.line,
    },

    safetyTitle: {
      color: C.text,
      textAlign: 'center',
      fontWeight: '800',
      fontSize: 13,
    },

    safe: {
      color: C.muted,
      textAlign: 'center',
      marginTop: 5,
      lineHeight: 19,
      fontSize: 12,
    },
  });