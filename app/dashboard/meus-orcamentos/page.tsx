import type { Metadata } from "next"
import { MeusOrcamentosContent } from "./meus-orcamentos-content"

export const metadata: Metadata = {
  title: "Os meus orçamentos · MOAP",
  description:
    "Acompanhe o estado dos orçamentos submetidos para revisão da equipa MOAP e consulte o feedback detalhado.",
}

export default function MeusOrcamentosPage() {
  return <MeusOrcamentosContent />
}
