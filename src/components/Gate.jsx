import { useState } from 'react'
import { playClick } from '../lib/sound'

// Simple passcode screen shown before the site. It's a polite "keep out" for
// casual visitors, not real security: the code ships with the page.
const PASSCODE = '1946'
const KEY = 'mc-portfolio-unlocked'

export function isUnlocked() {
  try {
    return sessionStorage.getItem(KEY) === '1'
  } catch {
    return false
  }
}

export default function Gate({ onUnlock }) {
  const [code, setCode] = useState('')
  const [wrong, setWrong] = useState(false)

  const submit = (e) => {
    e.preventDefault()
    playClick()
    if (code === PASSCODE) {
      try {
        sessionStorage.setItem(KEY, '1') // stays unlocked until the tab is closed
      } catch {}
      onUnlock()
    } else {
      setWrong(false)
      requestAnimationFrame(() => setWrong(true)) // restart the shake on every wrong try
      setCode('')
    }
  }

  return (
    <div className="gate">
      <form className={`gate-box${wrong ? ' wrong' : ''}`} onSubmit={submit}>
        <h1>Enter Passcode</h1>
        <input
          className="mc-input"
          type="password"
          inputMode="numeric"
          autoComplete="off"
          autoFocus
          maxLength={12}
          value={code}
          onChange={(e) => setCode(e.target.value)}
          aria-label="Passcode"
          aria-invalid={wrong}
        />
        <p className="gate-error" role="alert">{wrong ? 'Incorrect passcode' : ' '}</p>
        <button type="submit" className="mc-btn">Enter</button>
      </form>
    </div>
  )
}
