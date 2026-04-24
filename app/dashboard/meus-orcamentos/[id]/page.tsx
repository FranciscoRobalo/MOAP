import type { Metadata } from "next"
import { MeuOrcamentoDetail } from "./detail-content"

export const metadata: Metadata = {
  title: "Orçamento · Feedback · MOAP",
}

export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  return <MeuOrcamentoDetail id={id} />
}
