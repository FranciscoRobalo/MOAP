import Link from "next/link"
import { FileText } from "lucide-react"

export function Footer() {
  return (
    <footer className="border-t border-border/40 bg-card/30 py-12">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-8 md:grid-cols-4">
          <div className="md:col-span-2">
            <Link href="/" className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
                <FileText className="h-5 w-5 text-primary-foreground" />
              </div>
              <span className="text-xl font-bold tracking-tight">MOAP</span>
            </Link>
            <p className="mt-4 max-w-md text-sm text-muted-foreground">
              Plataforma inteligente para análise de orçamentos de construção. Compare preços unitários com a média do
              mercado e tome decisões informadas.
            </p>
          </div>

          <div>
            <h4 className="font-semibold">Plataforma</h4>
            <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
              <li>
                <Link href="#funcionalidades" className="hover:text-foreground">
                  Funcionalidades
                </Link>
              </li>
              <li>
                <Link href="#como-funciona" className="hover:text-foreground">
                  Como Funciona
                </Link>
              </li>
              <li>
                <Link href="#relatorio" className="hover:text-foreground">
                  Relatório
                </Link>
              </li>
              <li>
                <Link href="#carregar" className="hover:text-foreground">
                  Carregar Documento
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold">Empresa</h4>
            <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
              <li>
                <Link href="#" className="hover:text-foreground">
                  Sobre Nós
                </Link>
              </li>
              <li>
                <Link href="#" className="hover:text-foreground">
                  Contacto
                </Link>
              </li>
              <li>
                <Link href="#" className="hover:text-foreground">
                  Privacidade
                </Link>
              </li>
              <li>
                <Link href="#" className="hover:text-foreground">
                  Termos de Uso
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 border-t border-border/40 pt-8 text-center text-sm text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} MOAP. Todos os direitos reservados.</p>
        </div>
      </div>
    </footer>
  )
}
