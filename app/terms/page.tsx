import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { FileText, AlertCircle, Scale, Ban, RefreshCw, UserX } from "lucide-react"

export const metadata = {
  title: "Termos de Serviço | MOAP",
  description: "Termos e condições de utilização da plataforma MOAP",
}

export default function TermsPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1 bg-background">
        <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-12 text-center space-y-4">
            <div className="flex justify-center">
              <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-primary/10 border border-primary/20">
                <FileText className="h-10 w-10 text-primary" />
              </div>
            </div>
            <h1 className="text-4xl font-bold text-foreground">Termos de Serviço</h1>
            <p className="text-lg text-muted-foreground">
              Última atualização: {new Date().toLocaleDateString("pt-PT")}
            </p>
          </div>

          <div className="prose prose-invert max-w-none space-y-8">
            {/* Introduction */}
            <section className="rounded-lg border border-border bg-card p-6 space-y-4">
              <h2 className="text-2xl font-bold text-foreground flex items-center gap-3">
                <FileText className="h-6 w-6 text-primary" />
                Aceitação dos Termos
              </h2>
              <p className="text-muted-foreground leading-relaxed">
                Ao aceder e utilizar a plataforma MOAP, concorda com estes Termos de Serviço. Se não concordar 
                com alguma parte destes termos, não deve utilizar os nossos serviços. Estes termos aplicam-se a 
                todos os utilizadores, incluindo administradores, técnicos e clientes.
              </p>
            </section>

            {/* Service Description */}
            <section className="rounded-lg border border-border bg-card p-6 space-y-4">
              <h2 className="text-2xl font-bold text-foreground flex items-center gap-3">
                <Scale className="h-6 w-6 text-primary" />
                Descrição do Serviço
              </h2>
              <div className="space-y-3 text-muted-foreground">
                <p>A MOAP fornece:</p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Plataforma web para upload e análise de orçamentos de construção</li>
                  <li>Comparação automática de preços unitários com médias de mercado</li>
                  <li>Sistema de gestão de obras e documentos</li>
                  <li>Ferramentas de comunicação entre clientes e técnicos</li>
                  <li>Análise de dados e geração de relatórios</li>
                </ul>
                <p className="text-sm">
                  Reservamo-nos o direito de modificar, suspender ou descontinuar qualquer parte do serviço 
                  a qualquer momento, com ou sem aviso prévio.
                </p>
              </div>
            </section>

            {/* User Accounts */}
            <section className="rounded-lg border border-border bg-card p-6 space-y-4">
              <h2 className="text-2xl font-bold text-foreground flex items-center gap-3">
                <UserX className="h-6 w-6 text-primary" />
                Contas de Utilizador
              </h2>
              <div className="space-y-4 text-muted-foreground">
                <div>
                  <h3 className="text-lg font-semibold text-foreground mb-2">Registo</h3>
                  <ul className="list-disc list-inside space-y-1 ml-4">
                    <li>Deve fornecer informações verdadeiras, precisas e completas</li>
                    <li>É responsável por manter a confidencialidade da sua conta</li>
                    <li>Deve notificar-nos imediatamente sobre qualquer uso não autorizado</li>
                    <li>Todas as contas requerem aprovação do administrador</li>
                  </ul>
                </div>
                
                <div>
                  <h3 className="text-lg font-semibold text-foreground mb-2">Tipos de Conta</h3>
                  <div className="space-y-2">
                    <div className="rounded-lg bg-muted/30 p-3">
                      <p className="font-semibold text-foreground">Administrador</p>
                      <p className="text-sm">Controlo total da plataforma, aprovação de utilizadores e orçamentos</p>
                    </div>
                    <div className="rounded-lg bg-muted/30 p-3">
                      <p className="font-semibold text-foreground">Técnico</p>
                      <p className="text-sm">Análise de orçamentos, gestão de obras, comunicação com clientes</p>
                    </div>
                    <div className="rounded-lg bg-muted/30 p-3">
                      <p className="font-semibold text-foreground">Cliente</p>
                      <p className="text-sm">Submissão de orçamentos, visualização de análises aprovadas</p>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* User Obligations */}
            <section className="rounded-lg border border-border bg-card p-6 space-y-4">
              <h2 className="text-2xl font-bold text-foreground flex items-center gap-3">
                <AlertCircle className="h-6 w-6 text-primary" />
                Obrigações do Utilizador
              </h2>
              <div className="space-y-3 text-muted-foreground">
                <p>Ao utilizar a plataforma, compromete-se a:</p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Utilizar o serviço apenas para fins legais e autorizados</li>
                  <li>Não tentar aceder a áreas restritas ou dados de outros utilizadores</li>
                  <li>Não fazer upload de conteúdo malicioso, ilegal ou que viole direitos de terceiros</li>
                  <li>Não interferir com o funcionamento normal da plataforma</li>
                  <li>Não fazer engenharia reversa ou tentar extrair código fonte</li>
                  <li>Respeitar a propriedade intelectual da MOAP e de terceiros</li>
                </ul>
              </div>
            </section>

            {/* Prohibited Uses */}
            <section className="rounded-lg border border-border bg-card p-6 space-y-4">
              <h2 className="text-2xl font-bold text-foreground flex items-center gap-3">
                <Ban className="h-6 w-6 text-primary" />
                Usos Proibidos
              </h2>
              <div className="space-y-3 text-muted-foreground">
                <p>É expressamente proibido:</p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Partilhar credenciais de acesso com terceiros</li>
                  <li>Utilizar bots, scripts ou automação não autorizada</li>
                  <li>Fazer scraping ou extração massiva de dados</li>
                  <li>Sobrecarregar os servidores com pedidos excessivos</li>
                  <li>Tentar comprometer a segurança da plataforma</li>
                  <li>Publicar informações falsas ou enganosas</li>
                  <li>Utilizar o serviço para spam ou marketing não solicitado</li>
                </ul>
              </div>
            </section>

            {/* Data and Privacy */}
            <section className="rounded-lg border border-border bg-card p-6 space-y-4">
              <h2 className="text-2xl font-bold text-foreground flex items-center gap-3">
                <Scale className="h-6 w-6 text-primary" />
                Dados e Privacidade
              </h2>
              <div className="space-y-3 text-muted-foreground">
                <p>Relativamente aos dados submetidos:</p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Mantém a propriedade de todos os orçamentos e documentos que submete</li>
                  <li>Concede-nos licença para processar e analisar os dados para fornecer o serviço</li>
                  <li>Os dados podem ser utilizados de forma anónima para melhorar a plataforma</li>
                  <li>Consulte a nossa <a href="/privacy-policy" className="text-primary hover:underline">Política de Privacidade</a> para mais detalhes</li>
                </ul>
              </div>
            </section>

            {/* Budget Approval */}
            <section className="rounded-lg border border-primary/20 bg-primary/5 p-6 space-y-4">
              <h2 className="text-2xl font-bold text-foreground flex items-center gap-3">
                <RefreshCw className="h-6 w-6 text-primary" />
                Aprovação de Orçamentos
              </h2>
              <div className="space-y-3 text-muted-foreground">
                <p className="font-semibold text-foreground">Processo de Aprovação:</p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Todos os orçamentos submetidos requerem aprovação do administrador</li>
                  <li>Os orçamentos ficam em estado "pendente" até aprovação</li>
                  <li>Apenas orçamentos aprovados são visíveis para os clientes</li>
                  <li>O administrador pode adicionar margens de lucro (não visíveis para clientes)</li>
                  <li>Não garantimos prazos específicos para aprovação</li>
                </ul>
              </div>
            </section>

            {/* Liability */}
            <section className="rounded-lg border border-border bg-card p-6 space-y-4">
              <h2 className="text-2xl font-bold text-foreground flex items-center gap-3">
                <AlertCircle className="h-6 w-6 text-primary" />
                Limitação de Responsabilidade
              </h2>
              <div className="space-y-3 text-muted-foreground">
                <p>A MOAP:</p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Fornece a plataforma "como está" sem garantias de qualquer tipo</li>
                  <li>Não garante que o serviço será ininterrupto ou livre de erros</li>
                  <li>Não é responsável por decisões tomadas com base nas análises</li>
                  <li>Não garante a exatidão absoluta das comparações de preços</li>
                  <li>Não é responsável por perdas indiretas ou consequenciais</li>
                  <li>Limita a responsabilidade ao valor pago pelos serviços nos últimos 12 meses</li>
                </ul>
              </div>
            </section>

            {/* Termination */}
            <section className="rounded-lg border border-border bg-card p-6 space-y-4">
              <h2 className="text-2xl font-bold text-foreground flex items-center gap-3">
                <UserX className="h-6 w-6 text-primary" />
                Suspensão e Cancelamento
              </h2>
              <div className="space-y-3 text-muted-foreground">
                <p>Reservamo-nos o direito de:</p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Suspender ou cancelar contas que violem estes termos</li>
                  <li>Remover conteúdo que consideremos inapropriado</li>
                  <li>Modificar ou descontinuar o serviço com 30 dias de aviso</li>
                </ul>
                <p className="mt-4">
                  Pode cancelar a sua conta a qualquer momento. Após cancelamento, os seus dados serão 
                  eliminados de acordo com a nossa política de retenção.
                </p>
              </div>
            </section>

            {/* Intellectual Property */}
            <section className="rounded-lg border border-border bg-card p-6 space-y-4">
              <h2 className="text-2xl font-bold text-foreground">Propriedade Intelectual</h2>
              <p className="text-muted-foreground leading-relaxed">
                Todos os direitos de propriedade intelectual da plataforma MOAP, incluindo código, design, 
                logótipos e conteúdo, pertencem à MOAP ou aos seus licenciadores. É proibida a reprodução, 
                distribuição ou criação de obras derivadas sem autorização expressa.
              </p>
            </section>

            {/* Governing Law */}
            <section className="rounded-lg border border-border bg-card p-6 space-y-4">
              <h2 className="text-2xl font-bold text-foreground flex items-center gap-3">
                <Scale className="h-6 w-6 text-primary" />
                Lei Aplicável
              </h2>
              <p className="text-muted-foreground leading-relaxed">
                Estes Termos de Serviço são regidos pela lei portuguesa. Quaisquer disputas serão resolvidas 
                nos tribunais portugueses competentes. Se alguma disposição for considerada inválida, as 
                restantes permanecem em vigor.
              </p>
            </section>

            {/* Changes to Terms */}
            <section className="rounded-lg border border-border bg-card p-6 space-y-4">
              <h2 className="text-2xl font-bold text-foreground">Alterações aos Termos</h2>
              <p className="text-muted-foreground leading-relaxed">
                Podemos atualizar estes termos periodicamente. Notificaremos sobre alterações significativas 
                através de email ou aviso na plataforma. A continuação do uso após alterações constitui 
                aceitação dos novos termos.
              </p>
            </section>

            {/* Contact */}
            <section className="rounded-lg border border-primary/20 bg-primary/5 p-6 space-y-4">
              <h2 className="text-2xl font-bold text-foreground">Contacte-nos</h2>
              <p className="text-muted-foreground leading-relaxed">
                Para questões sobre estes Termos de Serviço:
              </p>
              <div className="space-y-2 text-sm text-muted-foreground">
                <p><strong className="text-foreground">Email:</strong> legal@moap.pt</p>
                <p><strong className="text-foreground">Telefone:</strong> +351 XXX XXX XXX</p>
                <p><strong className="text-foreground">Morada:</strong> MOAP, Lda. - Portugal</p>
              </div>
            </section>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}
