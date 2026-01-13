import { Suspense } from "react"
import PricesContent from "./prices-content"

export default function PricesPage() {
  return (
    <Suspense fallback={null}>
      <PricesContent />
    </Suspense>
  )
}
