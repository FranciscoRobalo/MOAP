import { Suspense } from "react"
import { HelpContent } from "./help-content"

export default function HelpPage() {
  return (
    <Suspense fallback={null}>
      <HelpContent />
    </Suspense>
  )
}
