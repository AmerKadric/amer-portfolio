import { useSyncExternalStore } from 'react'
import { playChime } from './sound'

const KEY = 'mc-portfolio-advancements'
const TOAST_MS = 5000

export const ADVANCEMENTS = {
  start: { title: 'Getting Started', desc: 'Open your first section' },
  explorer: { title: 'Adventuring Time', desc: 'Visit every screen' },
  resume: { title: 'Paper Trail', desc: 'Download the resume' },
  splash: { title: 'Splash Zone', desc: 'Reroll the splash text twice' },
  secret: { title: 'Into the World', desc: 'Find the hidden game' },
}

const SCREENS = ['experience', 'projects', 'about', 'skills', 'contact']
const SPLASH_GOAL = 2

let saved = load()
let splashCount = 0
let queue = []
let current = null
const listeners = new Set()

function load() {
  try {
    const data = JSON.parse(localStorage.getItem(KEY) || '{}')
    return { unlocked: data.unlocked ?? [], visited: data.visited ?? [] }
  } catch {
    return { unlocked: [], visited: [] }
  }
}

function save() {
  try {
    localStorage.setItem(KEY, JSON.stringify(saved))
  } catch {}
}

function emit() {
  listeners.forEach((l) => l())
}

function showNext() {
  current = queue.shift() ?? null
  emit()
  if (current) {
    playChime()
    setTimeout(showNext, TOAST_MS)
  }
}

export function unlock(id) {
  if (!ADVANCEMENTS[id] || saved.unlocked.includes(id)) return
  saved = { ...saved, unlocked: [...saved.unlocked, id] }
  save()
  queue.push({ id, ...ADVANCEMENTS[id] })
  if (!current) showNext()
}

export function visitScreen(route) {
  if (!SCREENS.includes(route)) return
  unlock('start')
  if (saved.visited.includes(route)) return
  saved = { ...saved, visited: [...saved.visited, route] }
  save()
  if (SCREENS.every((s) => saved.visited.includes(s))) unlock('explorer')
}

export function rerollSplash() {
  if (++splashCount >= SPLASH_GOAL) unlock('splash')
}

function subscribe(cb) {
  listeners.add(cb)
  return () => listeners.delete(cb)
}

export function useUnlocked() {
  return useSyncExternalStore(subscribe, () => saved.unlocked)
}

export function useToast() {
  return useSyncExternalStore(subscribe, () => current)
}
