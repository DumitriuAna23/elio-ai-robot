"use client";
import type * as Blockly from 'blockly';
import { isConnected, onTelemetry, send, stopRobot } from './robotBluetooth';

let workspace: Blockly.WorkspaceSvg | null = null;
let running = false;
let cancelled = false;
let wake: (() => void) | null = null;
let distance: number | null = null;
let lastTelemetryAt = 0;
let telemetrySubscribed = false;
const OBSTACLE_CM = 12; // change this threshold to match the ESP32 safety firmware
const MAX_WAIT_MS = 15000;
const MAX_ITERATIONS = 100;
const MAX_RUN_MS = 60000;
let runStart = 0;

export function registerWorkspace(value: Blockly.WorkspaceSvg | null) { workspace = value; }
export const getWorkspace = () => workspace;  // used by the phone Blocks page to save/open programs
export const isRunning = () => running;
function notify() { if (typeof window !== 'undefined') window.dispatchEvent(new Event('elio-code-state')); }
function subscribeTelemetry() {
  if (telemetrySubscribed || typeof window === 'undefined') return;
  telemetrySubscribed = true;
  onTelemetry(value => {
    distance = typeof value.distance === 'number' && Number.isFinite(value.distance) ? value.distance : null;
    lastTelemetryAt = Date.now();
  });
}
function check() {
  if (cancelled) throw new Error('Program stopped.');
  if (!isConnected()) throw new Error('Bluetooth connection lost.');
  if (Date.now() - runStart > MAX_RUN_MS) throw new Error('Program time limit (60 s) reached.');
}
function sleep(ms: number) {
  return new Promise<void>(resolve => {
    let ended = false;
    const finish = () => { if (ended) return; ended = true; clearTimeout(timer); if (wake === finish) wake = null; resolve(); };
    const timer = setTimeout(finish, ms);
    wake = finish;
  });
}
function get(block: Blockly.Block, input: string) { return block.getInputTargetBlock(input); }
function numberField(block: Blockly.Block, field: string, fallback: number) {
  const raw = Number(block.getFieldValue(field));
  return Number.isFinite(raw) ? raw : fallback;
}
function evaluate(block: Blockly.Block | null): number | boolean {
  if (!block) throw new Error('An input or condition block is missing.');
  const n = (key: string) => Number(evaluate(get(block, key)));
  const b = (key: string) => Boolean(evaluate(get(block, key)));
  switch (block.type) {
    case 'elio_obstacle': {
      if (distance === null || Date.now() - lastTelemetryAt > 4000) throw new Error('Distance sensor data unavailable.');
      return distance <= OBSTACLE_CM;
    }
    case 'elio_distance': {
      if (distance === null || Date.now() - lastTelemetryAt > 4000) throw new Error('Distance sensor data unavailable.');
      return distance;
    }
    case 'elio_is_connected': return isConnected();
    case 'elio_number': return numberField(block, 'NUM', 0);
    case 'elio_add': return n('A') + n('B');
    case 'elio_subtract': return n('A') - n('B');
    case 'elio_multiply': return n('A') * n('B');
    case 'elio_divide': { const divisor = n('B'); if (!divisor) throw new Error('Division by zero.'); return n('A') / divisor; }
    case 'elio_less_than': return n('A') < n('B');
    case 'elio_equals': return evaluate(get(block, 'A')) === evaluate(get(block, 'B'));
    case 'elio_greater_than': return n('A') > n('B');
    case 'elio_and': return b('A') && b('B');
    case 'elio_or': return b('A') || b('B');
    case 'elio_not': return !b('VALUE');
    default: throw new Error(`Condition ${block.type} is not supported yet.`);
  }
}
async function transmit(text: string) { check(); if (!await send(text)) throw new Error('Bluetooth connection lost.'); }
async function executeChain(first: Blockly.Block | null): Promise<void> {
  let block = first;
  while (block) {
    check();
    switch (block.type) {
      case 'elio_start': break;
      case 'elio_speed': await transmit(`SPEED:${Math.max(0, Math.min(100, numberField(block, 'SPEED', 30)))}`); break;
      case 'elio_stop': await transmit('STOP'); break;
      case 'elio_move_forward':
      case 'elio_move_backward':
      case 'elio_turn_left':
      case 'elio_turn_right': {
        const cmd: Record<string,string> = {elio_move_forward:'FORWARD',elio_move_backward:'BACKWARD',elio_turn_left:'LEFT',elio_turn_right:'RIGHT'};
        // A movement command is a SHORT pulse; the app never allows unbounded travel.
        await transmit(cmd[block.type]);
        try { await sleep(400); } finally { if (isConnected()) await stopRobot(); }
        break;
      }
      case 'elio_wait': await sleep(Math.max(0, Math.min(15, numberField(block, 'SECONDS', 1))) * 1000); break;
      case 'elio_wait_until': {
        const condition = get(block, 'CONDITION');
        if (!condition) throw new Error('Add a condition to wait until.');
        const started = Date.now();
        while (true) {
          check();
          if (Boolean(evaluate(condition))) break;
          if (Date.now() - started >= MAX_WAIT_MS) throw new Error('Wait timed out (15 s).');
          await sleep(150);
        }
        break;
      }
      case 'elio_repeat': {
        const count = Math.max(0, Math.min(MAX_ITERATIONS, Math.floor(numberField(block, 'TIMES', 1))));
        for (let i=0;i<count;i++) { check(); await executeChain(get(block, 'DO')); }
        break;
      }
      case 'elio_forever': {
        // Bounded by global 60-second limit and Stop.
        while (true) { check(); await executeChain(get(block, 'DO')); await sleep(75); }
      }
      case 'elio_if': if (Boolean(evaluate(get(block, 'CONDITION')))) await executeChain(get(block, 'DO')); break;
      case 'elio_if_else': await executeChain(get(block, Boolean(evaluate(get(block, 'CONDITION'))) ? 'DO' : 'ELSE')); break;
      case 'elio_repeat_until': {
        let cycles = 0;
        const condition = get(block, 'CONDITION');
        if (!condition) throw new Error('Add a condition to repeat until.');
        while (!Boolean(evaluate(condition))) {
          check();
          if (++cycles > MAX_ITERATIONS) throw new Error('Repeat limit reached.');
          await executeChain(get(block, 'DO'));
          await sleep(75);
        }
        break;
      }
      default: throw new Error(`Block ${block.type} cannot be executed by this runner.`);
    }
    block = block.getNextBlock();
  }
}
export async function haltProgram() {
  cancelled = true;
  wake?.();
  if (isConnected()) await stopRobot().catch(() => {});
  notify();
}
export function clearProgram() {
  if (running) throw new Error('Stop the program first.');
  workspace?.clear();
}
export async function runProgram() {
  if (running) return;
  if (!workspace) throw new Error('Editor not ready.');
  if (!isConnected()) throw new Error('Connect ELIO in Robot Control first.');
  const tops = workspace.getTopBlocks(true).filter(block => !block.getPreviousBlock());
  if (!tops.length) throw new Error('Drag blocks into the workspace first.');
  subscribeTelemetry();
  running = true; cancelled = false; runStart = Date.now(); notify();
  try {
    for (const top of tops) {
      check();
      // Event hats are not event subscriptions; run only green-flag stacks.
      if (top.type !== 'elio_start') throw new Error('Begin the program with the yellow Start block.');
      await executeChain(top);
    }
  } finally {
    cancelled = true;
    wake?.();
    if (isConnected()) await stopRobot().catch(() => {});
    running = false;
    notify();
  }
}
