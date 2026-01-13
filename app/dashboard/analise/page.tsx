import { Suspense } from "react"
import AnaliseContent from "./analise-content"

export default function AnalisePage() {
  return (
    <Suspense fallback={null}>
      <AnaliseContent />
    </Suspense>
  )
}
