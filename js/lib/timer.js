// A Pomodoro timer that keeps running while you move around the site.

import { get, logMinutes } from '../store.js';

const listeners = new Set();
let timer = { mode: 'focus', running: false, started: false, endsAt: 0, remaining: 0, sessions: 0 };
let tick;

const minutesFor = (mode) => (mode === 'focus' ? get().settings.pomodoro : get().settings.shortBreak) || (mode === 'focus' ? 25 : 5);

export function state() {
  const remaining = timer.running ? Math.max(0, timer.endsAt - Date.now()) : timer.remaining || minutesFor(timer.mode) * 60000;
  return { ...timer, remaining };
}

export const subscribe = (fn) => (listeners.add(fn), () => listeners.delete(fn));
const emit = () => listeners.forEach((fn) => fn(state()));

function loop() {
  clearInterval(tick);
  tick = setInterval(() => {
    if (!timer.running) return;
    if (Date.now() >= timer.endsAt) finish();
    emit();
  }, 500);
}

function finish() {
  const wasFocus = timer.mode === 'focus';
  if (wasFocus) {
    logMinutes(minutesFor('focus'));
    timer.sessions++;
  }
  timer.mode = wasFocus ? 'break' : 'focus';
  timer.running = false;
  timer.remaining = minutesFor(timer.mode) * 60000;
  notify(wasFocus ? 'Focus session done — take a break!' : 'Break over — back to it!');
}

function notify(msg) {
  try {
    if ('Notification' in window && Notification.permission === 'granted') new Notification('My IGCSE', { body: msg });
  } catch { /* ignore */ }
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.connect(g); g.connect(ctx.destination);
    o.frequency.value = 880;
    g.gain.setValueAtTime(0.2, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1);
    o.start(); o.stop(ctx.currentTime + 1);
  } catch { /* ignore */ }
}

export function start() {
  if (timer.running) return;
  const rem = timer.remaining || minutesFor(timer.mode) * 60000;
  timer.running = true;
  timer.started = true;
  timer.endsAt = Date.now() + rem;
  if ('Notification' in window && Notification.permission === 'default') Notification.requestPermission().catch(() => {});
  loop();
  emit();
}

export function pause() {
  if (!timer.running) return;
  timer.remaining = Math.max(0, timer.endsAt - Date.now());
  timer.running = false;
  emit();
}

export function reset(mode = timer.mode) {
  timer.running = false;
  timer.started = false;
  timer.mode = mode;
  timer.remaining = minutesFor(mode) * 60000;
  emit();
}

export const format = (ms) => {
  const s = Math.ceil(ms / 1000);
  return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
};
