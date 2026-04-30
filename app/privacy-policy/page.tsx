import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Shield, Lock, Eye, Database, UserCheck, Mail } from "lucide-react"

export const metadata = {
  title: "Política de Privacidade | MOAP",
  description: "Política de privacidade e tratamento de dados da plataforma MOAP",
}

export default function PrivacyPolicyPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1 bg-background">
        <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-12 text-center space-y-4">
            <div className="flex justify-center">
              <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-primary/10 border border-primary/20">
                <Shield className="h-10 w-10 text-primary" />
              </div>
            </div>
            <h1 className="text-4xl font-bold text-foreground">Política de Privacidade</h1>
            <p className="text-lg text-muted-foreground">
              Última atualização: {new Date().toLocaleDateString("pt-PT")}
            </p>
          </div>

          <div className="prose prose-invert max-w-none space-y-8">
            {/* Introduction */}
            <section className="rounded-lg border border-border bg-card p-6 space-y-4">
              <h2 className="text-2xl font-bold text-foreground flex items-center gap-3">
                <Lock className="h-6 w-6 text-primary" />
                Introdução
              </h2>
              <p className="text-muted-foreground leading-relaxed">
                A MOAP valoriza e respeita a sua privacidade. Esta Política de Privacidade descreve como 
                recolhemos, utilizamos, armazenamos e protegemos os seus dados pessoais quando utiliza a nossa 
                plataforma de análise de orçamentos de construção.
              </p>
            </section>

            {/* Data Collection */}
            <section className="rounded-lg border border-border bg-card p-6 space-y-4">
              <h2 className="text-2xl font-bold text-foreground flex items-center gap-3">
                <Database className="h-6 w-6 text-primary" />
                Dados que Recolhemos
              </h2>
              <div className="space-y-4 text-muted-foreground">
                <div>
                  <h3 className="text-lg font-semibold text-foreground mb-2">Dados de Registo</h3>
                  <ul className="list-disc list-inside space-y-1 ml-4">
                    <li>Nome completo</li>
                    <li>Endereço de email</li>
                    <li>Empresa (opcional)</li>
                    <li>Número de telefone (opcional)</li>
                    <li>Função/Cargo</li>
                  </ul>
                </div>
                
                <div>
                  <h3 className="text-lg font-semibold text-foreground mb-2">Dados de Utilização</h3>
                  <ul className="list-disc list-inside space-y-1 ml-4">
                    <li>Ficheiros de orçamentos carregados</li>
                    <li>Histórico de análises realizadas</li>
                    <li>Preferências de configuração</li>
                    <li>Registos de atividade na plataforma</li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-foreground mb-2">Dados Técnicos</h3>
                  <ul className="list-disc list-inside space-y-1 ml-4">
                    <li>Endereço IP</li>
                    <li>Tipo de navegador e versão</li>
                    <li>Sistema operativo</li>
                    <li>Cookies e tecnologias similares</li>
                  </ul>
                </div>
              </div>
            </section>

            {/* How We Use Data */}
            <section className="rounded-lg border border-border bg-card p-6 space-y-4">
              <h2 className="text-2xl font-bold text-foreground flex items-center gap-3">
                <Eye className="h-6 w-6 text-primary" />
                Como Utilizamos os Seus Dados
              </h2>
              <div className="space-y-3 text-muted-foreground">
                <p>Utilizamos os dados recolhidos para:</p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Fornecer e manter os nossos serviços de análise de orçamentos</li>
                  <li>Processar e analisar os ficheiros de orçamentos que submete</li>
                  <li>Gerir a sua conta e autenticação</li>
                  <li>Comunicar consigo sobre atualizações e melhorias</li>
                  <li>Melhorar a experiência do utilizador e funcionalidades da plataforma</li>
                  <li>Garantir a segurança e prevenir fraudes</li>
                  <li>Cumprir obrigações legais</li>
                </ul>
              </div>
            </section>

            {/* Data Protection */}
            <section className="rounded-lg border border-border bg-card p-6 space-y-4">
              <h2 className="text-2xl font-bold text-foreground flex items-center gap-3">
                <Lock className="h-6 w-6 text-primary" />
                Proteção de Dados
              </h2>
              <div className="space-y-3 text-muted-foreground">
                <p>Implementamos medidas de segurança rigorosas para proteger os seus dados:</p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Encriptação SSL/TLS para todas as transmissões de dados</li>
                  <li>Armazenamento seguro em servidores protegidos</li>
                  <li>Controlo de acesso baseado em funções (RBAC)</li>
                  <li>Autenticação segura com hashing de passwords</li>
                  <li>Backups regulares e recuperação de desastres</li>
                  <li>Monitorização contínua de segurança</li>
                </ul>
              </div>
            </section>

            {/* Cookies */}
            <section className="rounded-lg border border-border bg-card p-6 space-y-4">
              <h2 className="text-2xl font-bold text-foreground flex items-center gap-3">
                <Database className="h-6 w-6 text-primary" />
                Cookies e Tecnologias Similares
              </h2>
              <div className="space-y-3 text-muted-foreground">
                <p>Utilizamos cookies para:</p>
                <div className="space-y-3">
                  <div className="rounded-lg bg-muted/30 p-4">
                    <h4 className="font-semibold text-foreground mb-1">Cookies Essenciais</h4>
                    <p className="text-sm">Necessários para autenticação e funcionamento básico do site.</p>
                  </div>
                  <div className="rounded-lg bg-muted/30 p-4">
                    <h4 className="font-semibold text-foreground mb-1">Cookies de Análise</h4>
                    <p className="text-sm">Ajudam-nos a entender como utiliza o site (com o seu consentimento).</p>
                  </div>
                  <div className="rounded-lg bg-muted/30 p-4">
                    <h4 className="font-semibold text-foreground mb-1">Cookies de Preferências</h4>
                    <p className="text-sm">Guardam as suas preferências e configurações.</p>
                  </div>
                </div>
                <p className="text-sm">
                  Pode gerir as suas preferências de cookies a qualquer momento através das configurações do seu navegador.
                </p>
              </div>
            </section>

            {/* User Rights */}
            <section className="rounded-lg border border-border bg-card p-6 space-y-4">
              <h2 className="text-2xl font-bold text-foreground flex items-center gap-3">
                <UserCheck className="h-6 w-6 text-primary" />
                Os Seus Direitos
              </h2>
              <div className="space-y-3 text-muted-foreground">
                <p>De acordo com o RGPD, tem os seguintes direitos:</p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li><strong className="text-foreground">Direito de Acesso:</strong> Pode solicitar uma cópia dos seus dados pessoais</li>
                  <li><strong className="text-foreground">Direito de Retificação:</strong> Pode corrigir dados incorretos ou incompletos</li>
                  <li><strong className="text-foreground">Direito ao Apagamento:</strong> Pode solicitar a eliminação dos seus dados</li>
                  <li><strong className="text-foreground">Direito à Portabilidade:</strong> Pode receber os seus dados num formato estruturado</li>
                  <li><strong className="text-foreground">Direito de Oposição:</strong> Pode opor-se ao tratamento dos seus dados</li>
                  <li><strong className="text-foreground">Direito de Limitação:</strong> Pode solicitar a limitação do tratamento</li>
                </ul>
              </div>
            </section>

            {/* Data Retention */}
            <section className="rounded-lg border border-border bg-card p-6 space-y-4">
              <h2 className="text-2xl font-bold text-foreground flex items-center gap-3">
                <Database className="h-6 w-6 text-primary" />
                Retenção de Dados
              </h2>
              <p className="text-muted-foreground leading-relaxed">
                Mantemos os seus dados pessoais apenas pelo tempo necessário para cumprir os fins para os quais 
                foram recolhidos, incluindo requisitos legais, contabilísticos ou de relatórios. Quando os dados 
                já não forem necessários, serão eliminados de forma segura.
              </p>
            </section>

            {/* Third Party Sharing */}
            <section className="rounded-lg border border-border bg-card p-6 space-y-4">
              <h2 className="text-2xl font-bold text-foreground flex items-center gap-3">
                <Shield className="h-6 w-6 text-primary" />
                Partilha com Terceiros
              </h2>
              <div className="space-y-3 text-muted-foreground">
                <p>Não vendemos os seus dados. Partilhamos dados apenas com:</p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Fornecedores de serviços essenciais (hosting, autenticação)</li>
                  <li>Autoridades legais quando requerido por lei</li>
                  <li>Parceiros de análise (apenas dados anónimos e com o seu consentimento)</li>
                </ul>
                <p className="text-sm">
                  Todos os terceiros são obrigados a manter a confidencialidade e segurança dos seus dados.
                </p>
              </div>
            </section>

            {/* Contact */}
            <section className="rounded-lg border border-primary/20 bg-primary/5 p-6 space-y-4">
              <h2 className="text-2xl font-bold text-foreground flex items-center gap-3">
                <Mail className="h-6 w-6 text-primary" />
                Contacte-nos
              </h2>
              <p className="text-muted-foreground leading-relaxed">
                Para questões sobre esta Política de Privacidade ou para exercer os seus direitos, contacte-nos:
              </p>
              <div className="space-y-2 text-sm text-muted-foreground">
                <p><strong className="text-foreground">Email:</strong> privacidade@moap.pt</p>
                <p><strong className="text-foreground">Telefone:</strong> +351 XXX XXX XXX</p>
                <p><strong className="text-foreground">Morada:</strong> MOAP, Lda. - Portugal</p>
              </div>
            </section>

            {/* Changes to Policy */}
            <section className="rounded-lg border border-border bg-card p-6 space-y-4">
              <h2 className="text-2xl font-bold text-foreground">Alterações a Esta Política</h2>
              <p className="text-muted-foreground leading-relaxed">
                Reservamo-nos o direito de atualizar esta Política de Privacidade periodicamente. Notificaremos 
                sobre alterações significativas através do email ou aviso na plataforma. A continuação do uso dos 
                nossos serviços após tais alterações constitui aceitação da nova política.
              </p>
            </section>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}
