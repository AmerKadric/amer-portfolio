import { Compass, FileText, Sparkles } from 'lucide-react'
import { useToast } from '../lib/advancements'

const ICONS = { explorer: Compass, resume: FileText, splash: Sparkles }

// In-game style "Advancement Made!" popup, top-right.
export default function Toast() {
  const toast = useToast()
  if (!toast) return null
  const Icon = ICONS[toast.id]
  return (
    <div className="toast" role="status" key={toast.id}>
      <div className="toast-icon"><Icon /></div>
      <div>
        <p className="toast-kicker">Advancement Made!</p>
        <p className="toast-title">{toast.title}</p>
      </div>
    </div>
  )
}
