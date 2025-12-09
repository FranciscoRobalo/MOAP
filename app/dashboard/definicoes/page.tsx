"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { useAuth } from "@/contexts/auth-context"
import { User, Bell, Shield, Palette, Globe, Save, Camera, Key, Mail, Building } from "lucide-react"

export default function DefinicoesPage() {
  const { user } = useAuth()
  const [saving, setSaving] = useState(false)

  const [profile, setProfile] = useState({
    name: user?.name || "",
    email: user?.email || "",
    phone: "+351 912 345 678",
    company: "MOAP",
    role: "Administrador",
    bio: "Gestor de projetos com mais de 10 anos de experiência em construção civil.",
  })

  const [notifications, setNotifications] = useState({
    email: true,
    push: true,
    obras: true,
    messages: true,
    budgets: true,
    visits: true,
    concursos: true,
    marketing: false,
  })

  const [preferences, setPreferences] = useState({
    language: "pt",
    currency: "EUR",
    dateFormat: "dd/MM/yyyy",
    theme: "dark",
  })

  const handleSave = async () => {
    setSaving(true)
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000))
    setSaving(false)
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Definições</h1>
        <p className="text-muted-foreground">Gerencie as suas preferências e configurações da conta.</p>
      </div>

      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList className="bg-card/50">
          <TabsTrigger value="profile" className="gap-2">
            <User className="h-4 w-4" />
            Perfil
          </TabsTrigger>
          <TabsTrigger value="notifications" className="gap-2">
            <Bell className="h-4 w-4" />
            Notificações
          </TabsTrigger>
          <TabsTrigger value="preferences" className="gap-2">
            <Palette className="h-4 w-4" />
            Preferências
          </TabsTrigger>
          <TabsTrigger value="security" className="gap-2">
            <Shield className="h-4 w-4" />
            Segurança
          </TabsTrigger>
        </TabsList>

        {/* Profile Tab */}
        <TabsContent value="profile" className="space-y-6">
          <Card className="bg-card/50">
            <CardHeader>
              <CardTitle>Informação do Perfil</CardTitle>
              <CardDescription>Atualize as suas informações pessoais.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Avatar */}
              <div className="flex items-center gap-6">
                <Avatar className="h-24 w-24">
                  <AvatarImage src={user?.avatar || "/placeholder.svg"} alt={user?.name} />
                  <AvatarFallback className="text-2xl">{user?.name?.charAt(0)}</AvatarFallback>
                </Avatar>
                <div className="space-y-2">
                  <Button variant="outline" size="sm">
                    <Camera className="mr-2 h-4 w-4" />
                    Alterar Foto
                  </Button>
                  <p className="text-xs text-muted-foreground">JPG, PNG ou GIF. Máximo 2MB.</p>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="name">Nome Completo</Label>
                  <Input
                    id="name"
                    value={profile.name}
                    onChange={(e) => setProfile((p) => ({ ...p, name: e.target.value }))}
                    className="bg-input/50"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={profile.email}
                    onChange={(e) => setProfile((p) => ({ ...p, email: e.target.value }))}
                    className="bg-input/50"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Telefone</Label>
                  <Input
                    id="phone"
                    value={profile.phone}
                    onChange={(e) => setProfile((p) => ({ ...p, phone: e.target.value }))}
                    className="bg-input/50"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="company">Empresa</Label>
                  <Input
                    id="company"
                    value={profile.company}
                    onChange={(e) => setProfile((p) => ({ ...p, company: e.target.value }))}
                    className="bg-input/50"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="bio">Biografia</Label>
                <Textarea
                  id="bio"
                  value={profile.bio}
                  onChange={(e) => setProfile((p) => ({ ...p, bio: e.target.value }))}
                  className="bg-input/50 min-h-[100px]"
                  placeholder="Conte um pouco sobre si..."
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notifications Tab */}
        <TabsContent value="notifications" className="space-y-6">
          <Card className="bg-card/50">
            <CardHeader>
              <CardTitle>Preferências de Notificações</CardTitle>
              <CardDescription>Escolha como e quando deseja ser notificado.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <h4 className="font-medium flex items-center gap-2">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  Canais de Notificação
                </h4>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Notificações por Email</p>
                      <p className="text-sm text-muted-foreground">Receba atualizações no seu email</p>
                    </div>
                    <Switch
                      checked={notifications.email}
                      onCheckedChange={(checked) => setNotifications((n) => ({ ...n, email: checked }))}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Notificações Push</p>
                      <p className="text-sm text-muted-foreground">Receba alertas no navegador</p>
                    </div>
                    <Switch
                      checked={notifications.push}
                      onCheckedChange={(checked) => setNotifications((n) => ({ ...n, push: checked }))}
                    />
                  </div>
                </div>
              </div>

              <div className="border-t pt-6 space-y-4">
                <h4 className="font-medium flex items-center gap-2">
                  <Building className="h-4 w-4 text-muted-foreground" />
                  Tipos de Notificação
                </h4>
                <div className="space-y-3">
                  {[
                    { key: "obras", label: "Obras", desc: "Atualizações sobre o estado das suas obras" },
                    { key: "messages", label: "Mensagens", desc: "Novas mensagens de outros utilizadores" },
                    { key: "budgets", label: "Orçamentos", desc: "Alterações e aprovações de orçamentos" },
                    { key: "visits", label: "Visitas", desc: "Lembretes de visitas agendadas" },
                    { key: "concursos", label: "Concursos", desc: "Novos concursos e prazos" },
                    { key: "marketing", label: "Marketing", desc: "Novidades e ofertas especiais" },
                  ].map((item) => (
                    <div key={item.key} className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{item.label}</p>
                        <p className="text-sm text-muted-foreground">{item.desc}</p>
                      </div>
                      <Switch
                        checked={notifications[item.key as keyof typeof notifications] as boolean}
                        onCheckedChange={(checked) => setNotifications((n) => ({ ...n, [item.key]: checked }))}
                      />
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Preferences Tab */}
        <TabsContent value="preferences" className="space-y-6">
          <Card className="bg-card/50">
            <CardHeader>
              <CardTitle>Preferências Gerais</CardTitle>
              <CardDescription>Configure a aparência e formato da aplicação.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="language" className="flex items-center gap-2">
                    <Globe className="h-4 w-4" />
                    Idioma
                  </Label>
                  <Select
                    value={preferences.language}
                    onValueChange={(v) => setPreferences((p) => ({ ...p, language: v }))}
                  >
                    <SelectTrigger className="bg-input/50">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pt">Português</SelectItem>
                      <SelectItem value="en">English</SelectItem>
                      <SelectItem value="es">Español</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="currency">Moeda</Label>
                  <Select
                    value={preferences.currency}
                    onValueChange={(v) => setPreferences((p) => ({ ...p, currency: v }))}
                  >
                    <SelectTrigger className="bg-input/50">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="EUR">Euro (€)</SelectItem>
                      <SelectItem value="USD">US Dollar ($)</SelectItem>
                      <SelectItem value="GBP">British Pound (£)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="dateFormat">Formato de Data</Label>
                  <Select
                    value={preferences.dateFormat}
                    onValueChange={(v) => setPreferences((p) => ({ ...p, dateFormat: v }))}
                  >
                    <SelectTrigger className="bg-input/50">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="dd/MM/yyyy">DD/MM/AAAA</SelectItem>
                      <SelectItem value="MM/dd/yyyy">MM/DD/AAAA</SelectItem>
                      <SelectItem value="yyyy-MM-dd">AAAA-MM-DD</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="theme" className="flex items-center gap-2">
                    <Palette className="h-4 w-4" />
                    Tema
                  </Label>
                  <Select value={preferences.theme} onValueChange={(v) => setPreferences((p) => ({ ...p, theme: v }))}>
                    <SelectTrigger className="bg-input/50">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="dark">Escuro</SelectItem>
                      <SelectItem value="light">Claro</SelectItem>
                      <SelectItem value="system">Sistema</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Security Tab */}
        <TabsContent value="security" className="space-y-6">
          <Card className="bg-card/50">
            <CardHeader>
              <CardTitle>Segurança da Conta</CardTitle>
              <CardDescription>Gerencie a segurança da sua conta.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <h4 className="font-medium flex items-center gap-2">
                  <Key className="h-4 w-4 text-muted-foreground" />
                  Alterar Palavra-passe
                </h4>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="currentPassword">Palavra-passe Atual</Label>
                    <Input id="currentPassword" type="password" className="bg-input/50" />
                  </div>
                  <div></div>
                  <div className="space-y-2">
                    <Label htmlFor="newPassword">Nova Palavra-passe</Label>
                    <Input id="newPassword" type="password" className="bg-input/50" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">Confirmar Palavra-passe</Label>
                    <Input id="confirmPassword" type="password" className="bg-input/50" />
                  </div>
                </div>
                <Button variant="outline">Alterar Palavra-passe</Button>
              </div>

              <div className="border-t pt-6 space-y-4">
                <h4 className="font-medium flex items-center gap-2">
                  <Shield className="h-4 w-4 text-muted-foreground" />
                  Autenticação de Dois Fatores
                </h4>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">2FA</p>
                    <p className="text-sm text-muted-foreground">Adicione uma camada extra de segurança à sua conta</p>
                  </div>
                  <Button variant="outline">Configurar</Button>
                </div>
              </div>

              <div className="border-t pt-6 space-y-4">
                <h4 className="font-medium text-destructive">Zona de Perigo</h4>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Eliminar Conta</p>
                    <p className="text-sm text-muted-foreground">
                      Esta ação é irreversível e eliminará todos os seus dados.
                    </p>
                  </div>
                  <Button variant="destructive">Eliminar Conta</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={saving}>
          <Save className="mr-2 h-4 w-4" />
          {saving ? "A guardar..." : "Guardar Alterações"}
        </Button>
      </div>
    </div>
  )
}
