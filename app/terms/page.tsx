import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { BlueprintBackdrop } from "@/components/landing/blueprint-backdrop"

export const metadata = {
  title: "Termos de Serviço | MOAP",
  description: "Termos e condições de utilização da plataforma MOAP",
}

type Section = {
  id: string
  eyebrow: string
  title: string
  body: React.ReactNode
  highlight?: boolean
}

function LegalSection({ index, section }: { index: number; section: Section }) {
  const num = String(index).padStart(2, "0")
  return (
    <section
      id={section.id}
      className={`bp-bracket scroll-mt-28 rounded-2xl border hairline p-6 sm:p-8 ${
        section.highlight ? "bg-primary/5" : "bg-card"
      }`}
    >
      <div className="mb-5 flex items-center gap-3 border-b hairline pb-4">
        <span className="font-mono text-xs text-primary">§{num}</span>
        <span className="eyebrow-strong">{section.eyebrow}</span>
      </div>
      <h2 className="font-display text-2xl font-medium tracking-tight text-foreground sm:text-3xl">
        {section.title}
      </h2>
      <div className="mt-5 space-y-4 text-sm leading-relaxed text-muted-foreground sm:text-base">
        {section.body}
      </div>
    </section>
  )
}

export default function TermsPage() {
  const updatedAt = new Date().toLocaleDateString("pt-PT")

  const sections: Section[] = [
    {
      id: "aceitacao",
      eyebrow: "Aceitação",
      title: "Aceitação dos termos",
      body: (
        <p>
          Ao aceder e utilizar a plataforma MOAP, concorda com estes Termos de Serviço. Se não concordar com
          alguma parte destes termos, não deve utilizar os nossos serviços. Estes termos aplicam-se a todos os
          utilizadores, incluindo administradores, técnicos e clientes.
        </p>
      ),
    },
    {
      id: "descricao",
      eyebrow: "Serviço",
      title: "Descrição do serviço",
      body: (
        <div>
          <p>A MOAP fornece:</p>
          <ul className="mt-3 list-disc space-y-2 pl-5">
            <li>Plataforma web para upload e análise de orçamentos de construção</li>
            <li>Comparação automática de preços unitários com médias de mercado</li>
            <li>Sistema de gestão de obras e documentos</li>
            <li>Ferramentas de comunicação entre clientes e técnicos</li>
            <li>Análise de dados e geração de relatórios</li>
          </ul>
          <p className="mt-3 text-xs">
            Reservamo-nos o direito de modificar, suspender ou descontinuar qualquer parte do serviço a
            qualquer momento, com ou sem aviso prévio.
          </p>
        </div>
      ),
    },
    {
      id: "contas",
      eyebrow: "Contas",
      title: "Contas de utilizador",
      body: (
        <div className="space-y-6">
          <div>
            <p className="eyebrow mb-2">Registo</p>
            <ul className="list-disc space-y-1 pl-5">
              <li>Deve fornecer informações verdadeiras, precisas e completas</li>
              <li>É responsável por manter a confidencialidade da sua conta</li>
              <li>Deve notificar-nos imediatamente sobre qualquer uso não autorizado</li>
              <li>Todas as contas requerem aprovação do administrador</li>
            </ul>
          </div>
          <div>
            <p className="eyebrow mb-2">Tipos de conta</p>
            <div className="grid gap-3 sm:grid-cols-3">
              {[
                {
                  name: "Administrador",
                  desc: "Controlo total da plataforma, aprovação de utilizadores e orçamentos.",
                },
                {
                  name: "Técnico",
                  desc: "Análise de orçamentos, gestão de obras, comunicação com clientes.",
                },
                {
                  name: "Cliente",
                  desc: "Submissão de orçamentos, visualização de análises aprovadas.",
                },
              ].map((c) => (
                <div key={c.name} className="rounded-lg border hairline bg-secondary/30 p-4">
                  <p className="eyebrow-strong">{c.name}</p>
                  <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{c.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      ),
    },
    {
      id: "obrigacoes",
      eyebrow: "Obrigações",
      title: "Obrigações do utilizador",
      body: (
        <div>
          <p>Ao utilizar a plataforma, compromete-se a:</p>
          <ul className="mt-3 list-disc space-y-2 pl-5">
            <li>Utilizar o serviço apenas para fins legais e autorizados</li>
            <li>Não tentar aceder a áreas restritas ou dados de outros utilizadores</li>
            <li>Não fazer upload de conteúdo malicioso, ilegal ou que viole direitos de terceiros</li>
            <li>Não interferir com o funcionamento normal da plataforma</li>
            <li>Não fazer engenharia reversa ou tentar extrair código fonte</li>
            <li>Respeitar a propriedade intelectual da MOAP e de terceiros</li>
          </ul>
        </div>
      ),
    },
    {
      id: "proibidos",
      eyebrow: "Proibições",
      title: "Usos proibidos",
      body: (
        <div>
          <p>É expressamente proibido:</p>
          <ul className="mt-3 list-disc space-y-2 pl-5">
            <li>Partilhar credenciais de acesso com terceiros</li>
            <li>Utilizar bots, scripts ou automação não autorizada</li>
            <li>Fazer scraping ou extração massiva de dados</li>
            <li>Sobrecarregar os servidores com pedidos excessivos</li>
            <li>Tentar comprometer a segurança da plataforma</li>
            <li>Publicar informações falsas ou enganosas</li>
            <li>Utilizar o serviço para spam ou marketing não solicitado</li>
          </ul>
        </div>
      ),
    },
    {
      id: "dados",
      eyebrow: "Dados",
      title: "Dados e privacidade",
      body: (
        <div>
          <p>Relativamente aos dados submetidos:</p>
          <ul className="mt-3 list-disc space-y-2 pl-5">
            <li>Mantém a propriedade de todos os orçamentos e documentos que submete</li>
            <li>Concede-nos licença para processar e analisar os dados para fornecer o serviço</li>
            <li>Os dados podem ser utilizados de forma anónima para melhorar a plataforma</li>
            <li>
              Consulte a nossa{" "}
              <a href="/privacy-policy" className="text-primary hover:underline">
                Política de Privacidade
              </a>{" "}
              para mais detalhes
            </li>
          </ul>
        </div>
      ),
    },
    {
      id: "aprovacao",
      eyebrow: "Aprovação",
      title: "Aprovação de orçamentos",
      highlight: true,
      body: (
        <div>
          <p className="font-semibold text-foreground">Processo de aprovação:</p>
          <ul className="mt-3 list-disc space-y-2 pl-5">
            <li>Todos os orçamentos submetidos requerem aprovação do administrador</li>
            <li>Os orçamentos ficam em estado &quot;pendente&quot; até aprovação</li>
            <li>Apenas orçamentos aprovados são visíveis para os clientes</li>
            <li>O administrador pode adicionar margens de lucro (não visíveis para clientes)</li>
            <li>Não garantimos prazos específicos para aprovação</li>
          </ul>
        </div>
      ),
    },
    {
      id: "responsabilidade",
      eyebrow: "Responsabilidade",
      title: "Limitação de responsabilidade",
      body: (
        <div>
          <p>A MOAP:</p>
          <ul className="mt-3 list-disc space-y-2 pl-5">
            <li>Fornece a plataforma &quot;como está&quot; sem garantias de qualquer tipo</li>
            <li>Não garante que o serviço será ininterrupto ou livre de erros</li>
            <li>Não é responsável por decisões tomadas com base nas análises</li>
            <li>Não garante a exatidão absoluta das comparações de preços</li>
            <li>Não é responsável por perdas indiretas ou consequenciais</li>
            <li>Limita a responsabilidade ao valor pago pelos serviços nos últimos 12 meses</li>
          </ul>
        </div>
      ),
    },
    {
      id: "suspensao",
      eyebrow: "Suspensão",
      title: "Suspensão e cancelamento",
      body: (
        <div>
          <p>Reservamo-nos o direito de:</p>
          <ul className="mt-3 list-disc space-y-2 pl-5">
            <li>Suspender ou cancelar contas que violem estes termos</li>
            <li>Remover conteúdo que consideremos inapropriado</li>
            <li>Modificar ou descontinuar o serviço com 30 dias de aviso</li>
          </ul>
          <p className="mt-4">
            Pode cancelar a sua conta a qualquer momento. Após cancelamento, os seus dados serão eliminados de
            acordo com a nossa política de retenção.
          </p>
        </div>
      ),
    },
    {
      id: "propriedade",
      eyebrow: "Propriedade intelectual",
      title: "Propriedade intelectual",
      body: (
        <p>
          Todos os direitos de propriedade intelectual da plataforma MOAP, incluindo código, design, logótipos
          e conteúdo, pertencem à MOAP ou aos seus licenciadores. É proibida a reprodução, distribuição ou
          criação de obras derivadas sem autorização expressa.
        </p>
      ),
    },
    {
      id: "lei",
      eyebrow: "Lei aplicável",
      title: "Lei aplicável",
      body: (
        <p>
          Estes Termos de Serviço são regidos pela lei portuguesa. Quaisquer disputas serão resolvidas nos
          tribunais portugueses competentes. Se alguma disposição for considerada inválida, as restantes
          permanecem em vigor.
        </p>
      ),
    },
    {
      id: "alteracoes",
      eyebrow: "Alterações",
      title: "Alterações aos termos",
      body: (
        <p>
          Podemos atualizar estes termos periodicamente. Notificaremos sobre alterações significativas através
          de email ou aviso na plataforma. A continuação do uso após alterações constitui aceitação dos novos
          termos.
        </p>
      ),
    },
    {
      id: "contacto",
      eyebrow: "Contacto",
      title: "Contacte-nos",
      highlight: true,
      body: (
        <div className="space-y-4">
          <p>Para questões sobre estes Termos de Serviço:</p>
          <dl className="grid gap-2 font-mono text-xs sm:grid-cols-[auto_1fr] sm:gap-x-6">
            <dt className="eyebrow">Email</dt>
            <dd className="text-foreground">legal@moap.pt</dd>
            <dt className="eyebrow">Telefone</dt>
            <dd className="text-foreground">+351 XXX XXX XXX</dd>
            <dt className="eyebrow">Morada</dt>
            <dd className="text-foreground">MOAP, Lda. — Portugal</dd>
          </dl>
        </div>
      ),
    },
  ]

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="relative flex-1 overflow-hidden bg-background">
        <BlueprintBackdrop />

        <div className="relative mx-auto max-w-5xl px-4 pt-32 pb-20 sm:px-6 lg:px-8 lg:pt-40">
          {/* Editorial hero */}
          <div className="mb-16 grid gap-10 border-b hairline pb-12 lg:grid-cols-12">
            <div className="lg:col-span-8">
              <div className="mb-6 flex items-center gap-3">
                <span className="h-px w-8 bg-primary" />
                <span className="eyebrow-strong">Documento legal · Termos</span>
              </div>
              <h1 className="font-display text-5xl font-medium tracking-tight text-foreground sm:text-6xl lg:text-7xl">
                Termos de
                <br />
                <span className="text-primary">Serviço</span>
              </h1>
              <p className="mt-6 max-w-2xl text-pretty text-lg leading-relaxed text-muted-foreground">
                Condições que regem a utilização da plataforma MOAP por todos os utilizadores.
              </p>
            </div>
            <aside className="lg:col-span-4">
              <div className="rounded-xl border hairline bg-card/60 p-5 backdrop-blur">
                <p className="eyebrow">Última atualização</p>
                <p className="mt-2 font-mono text-base text-foreground">{updatedAt}</p>
                <div className="mt-5 border-t hairline pt-4">
                  <p className="eyebrow mb-3">Índice</p>
                  <ol className="space-y-2 text-sm">
                    {sections.map((s, i) => (
                      <li key={s.id}>
                        <a
                          href={`#${s.id}`}
                          className="flex items-baseline gap-3 text-muted-foreground transition-colors hover:text-foreground"
                        >
                          <span className="font-mono text-[10px] text-primary">
                            §{String(i + 1).padStart(2, "0")}
                          </span>
                          <span>{s.title}</span>
                        </a>
                      </li>
                    ))}
                  </ol>
                </div>
              </div>
            </aside>
          </div>

          {/* Sections */}
          <div className="space-y-6">
            {sections.map((s, i) => (
              <LegalSection key={s.id} index={i + 1} section={s} />
            ))}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}
