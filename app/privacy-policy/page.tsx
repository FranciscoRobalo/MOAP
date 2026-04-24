import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { BlueprintBackdrop } from "@/components/landing/blueprint-backdrop"

export const metadata = {
  title: "Política de Privacidade | MOAP",
  description: "Política de privacidade e tratamento de dados da plataforma MOAP",
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

export default function PrivacyPolicyPage() {
  const updatedAt = new Date().toLocaleDateString("pt-PT")

  const sections: Section[] = [
    {
      id: "introducao",
      eyebrow: "Introdução",
      title: "Privacidade é uma responsabilidade partilhada",
      body: (
        <p>
          A MOAP valoriza e respeita a sua privacidade. Esta Política de Privacidade descreve como recolhemos,
          utilizamos, armazenamos e protegemos os seus dados pessoais quando utiliza a nossa plataforma de
          análise de orçamentos de construção.
        </p>
      ),
    },
    {
      id: "dados",
      eyebrow: "Dados que recolhemos",
      title: "O que guardamos e porquê",
      body: (
        <div className="space-y-6">
          <div>
            <p className="eyebrow mb-2">Dados de registo</p>
            <ul className="list-disc space-y-1 pl-5">
              <li>Nome completo</li>
              <li>Endereço de email</li>
              <li>Empresa (opcional)</li>
              <li>Número de telefone (opcional)</li>
              <li>Função/Cargo</li>
            </ul>
          </div>
          <div>
            <p className="eyebrow mb-2">Dados de utilização</p>
            <ul className="list-disc space-y-1 pl-5">
              <li>Ficheiros de orçamentos carregados</li>
              <li>Histórico de análises realizadas</li>
              <li>Preferências de configuração</li>
              <li>Registos de atividade na plataforma</li>
            </ul>
          </div>
          <div>
            <p className="eyebrow mb-2">Dados técnicos</p>
            <ul className="list-disc space-y-1 pl-5">
              <li>Endereço IP</li>
              <li>Tipo de navegador e versão</li>
              <li>Sistema operativo</li>
              <li>Cookies e tecnologias similares</li>
            </ul>
          </div>
        </div>
      ),
    },
    {
      id: "uso",
      eyebrow: "Como usamos",
      title: "Como utilizamos os seus dados",
      body: (
        <div>
          <p>Utilizamos os dados recolhidos para:</p>
          <ul className="mt-3 list-disc space-y-2 pl-5">
            <li>Fornecer e manter os nossos serviços de análise de orçamentos</li>
            <li>Processar e analisar os ficheiros de orçamentos que submete</li>
            <li>Gerir a sua conta e autenticação</li>
            <li>Comunicar consigo sobre atualizações e melhorias</li>
            <li>Melhorar a experiência do utilizador e funcionalidades da plataforma</li>
            <li>Garantir a segurança e prevenir fraudes</li>
            <li>Cumprir obrigações legais</li>
          </ul>
        </div>
      ),
    },
    {
      id: "protecao",
      eyebrow: "Proteção",
      title: "Medidas de segurança",
      body: (
        <div>
          <p>Implementamos medidas de segurança rigorosas para proteger os seus dados:</p>
          <ul className="mt-3 list-disc space-y-2 pl-5">
            <li>Encriptação SSL/TLS para todas as transmissões de dados</li>
            <li>Armazenamento seguro em servidores protegidos</li>
            <li>Controlo de acesso baseado em funções (RBAC)</li>
            <li>Autenticação segura com hashing de passwords</li>
            <li>Backups regulares e recuperação de desastres</li>
            <li>Monitorização contínua de segurança</li>
          </ul>
        </div>
      ),
    },
    {
      id: "cookies",
      eyebrow: "Cookies",
      title: "Cookies e tecnologias similares",
      body: (
        <div>
          <p>Utilizamos cookies para:</p>
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            {[
              {
                name: "Essenciais",
                desc: "Necessários para autenticação e funcionamento básico do site.",
              },
              {
                name: "Análise",
                desc: "Ajudam-nos a entender como utiliza o site (com o seu consentimento).",
              },
              {
                name: "Preferências",
                desc: "Guardam as suas preferências e configurações.",
              },
            ].map((c) => (
              <div key={c.name} className="rounded-lg border hairline bg-secondary/30 p-4">
                <p className="eyebrow-strong">{c.name}</p>
                <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{c.desc}</p>
              </div>
            ))}
          </div>
          <p className="mt-4 text-xs">
            Pode gerir as suas preferências de cookies a qualquer momento através das configurações do seu
            navegador.
          </p>
        </div>
      ),
    },
    {
      id: "direitos",
      eyebrow: "Os seus direitos",
      title: "Direitos RGPD",
      body: (
        <div>
          <p>De acordo com o RGPD, tem os seguintes direitos:</p>
          <ul className="mt-3 list-disc space-y-2 pl-5">
            <li>
              <strong className="text-foreground">Direito de Acesso:</strong> Pode solicitar uma cópia dos seus
              dados pessoais
            </li>
            <li>
              <strong className="text-foreground">Direito de Retificação:</strong> Pode corrigir dados incorretos
              ou incompletos
            </li>
            <li>
              <strong className="text-foreground">Direito ao Apagamento:</strong> Pode solicitar a eliminação
              dos seus dados
            </li>
            <li>
              <strong className="text-foreground">Direito à Portabilidade:</strong> Pode receber os seus dados
              num formato estruturado
            </li>
            <li>
              <strong className="text-foreground">Direito de Oposição:</strong> Pode opor-se ao tratamento dos
              seus dados
            </li>
            <li>
              <strong className="text-foreground">Direito de Limitação:</strong> Pode solicitar a limitação do
              tratamento
            </li>
          </ul>
        </div>
      ),
    },
    {
      id: "retencao",
      eyebrow: "Retenção",
      title: "Retenção de dados",
      body: (
        <p>
          Mantemos os seus dados pessoais apenas pelo tempo necessário para cumprir os fins para os quais foram
          recolhidos, incluindo requisitos legais, contabilísticos ou de relatórios. Quando os dados já não
          forem necessários, serão eliminados de forma segura.
        </p>
      ),
    },
    {
      id: "terceiros",
      eyebrow: "Terceiros",
      title: "Partilha com terceiros",
      body: (
        <div>
          <p>Não vendemos os seus dados. Partilhamos dados apenas com:</p>
          <ul className="mt-3 list-disc space-y-2 pl-5">
            <li>Fornecedores de serviços essenciais (hosting, autenticação)</li>
            <li>Autoridades legais quando requerido por lei</li>
            <li>Parceiros de análise (apenas dados anónimos e com o seu consentimento)</li>
          </ul>
          <p className="mt-3 text-xs">
            Todos os terceiros são obrigados a manter a confidencialidade e segurança dos seus dados.
          </p>
        </div>
      ),
    },
    {
      id: "contacto",
      eyebrow: "Contacto",
      title: "Contacte-nos",
      highlight: true,
      body: (
        <div className="space-y-4">
          <p>
            Para questões sobre esta Política de Privacidade ou para exercer os seus direitos, contacte-nos:
          </p>
          <dl className="grid gap-2 font-mono text-xs sm:grid-cols-[auto_1fr] sm:gap-x-6">
            <dt className="eyebrow">Email</dt>
            <dd className="text-foreground">privacidade@moap.pt</dd>
            <dt className="eyebrow">Telefone</dt>
            <dd className="text-foreground">+351 XXX XXX XXX</dd>
            <dt className="eyebrow">Morada</dt>
            <dd className="text-foreground">MOAP, Lda. — Portugal</dd>
          </dl>
        </div>
      ),
    },
    {
      id: "alteracoes",
      eyebrow: "Alterações",
      title: "Alterações a esta política",
      body: (
        <p>
          Reservamo-nos o direito de atualizar esta Política de Privacidade periodicamente. Notificaremos sobre
          alterações significativas através do email ou aviso na plataforma. A continuação do uso dos nossos
          serviços após tais alterações constitui aceitação da nova política.
        </p>
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
                <span className="eyebrow-strong">Documento legal · Privacidade</span>
              </div>
              <h1 className="font-display text-5xl font-medium tracking-tight text-foreground sm:text-6xl lg:text-7xl">
                Política de
                <br />
                <span className="text-primary">Privacidade</span>
              </h1>
              <p className="mt-6 max-w-2xl text-pretty text-lg leading-relaxed text-muted-foreground">
                Como recolhemos, tratamos e protegemos os seus dados pessoais na plataforma MOAP.
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
