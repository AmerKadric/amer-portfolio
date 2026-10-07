import { useSyncExternalStore } from 'react'

const KEY = 'mc-portfolio-settings'
const reducedMotion =
  typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches

const defaults = { sound: true, splash: true, motion: !reducedMotion, blur: true }

let state = load()
const listeners = new Set()

function load() {
  try {
    return { ...defaults, ...JSON.parse(localStorage.getItem(KEY) || '{}') }
  } catch {
    return { ...defaults }
  }
}

export function getSettings() {
  return state
}

export function setSetting(key, value) {
  state = { ...state, [key]: value }
  try {
    localStorage.setItem(KEY, JSON.stringify(state))
  } catch {}
  listeners.forEach((l) => l())
}

function subscribe(cb) {
  listeners.add(cb)
  return () => listeners.delete(cb)
}

export function useSettings() {
  return useSyncExternalStore(subscribe, getSettings)
}
