import { Suspense } from "react"
import RegistosContent from "./registos-content"

export default function RegistosPage() {
  return (
    <Suspense fallback={null}>
      <RegistosContent />
    </Suspense>
  )
}
