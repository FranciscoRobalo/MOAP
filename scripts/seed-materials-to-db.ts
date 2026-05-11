// Run with: npx tsx scripts/seed-materials-to-db.ts
import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseServiceKey)

// Comprehensive Portuguese construction materials and services database
// Prices are for Portugal market 2024-2025
const materials = [
  // ==================== DEMOLIÇÕES ====================
  { name: "Levantamento de revestimento e pavimento cerâmico", unit: "m2", min_price: 8, avg_price: 11.2, max_price: 16.8, category: "Demolições" },
  { name: "Demolição de divisórias em tijolo", unit: "m2", min_price: 14, avg_price: 18.2, max_price: 27.2, category: "Demolições" },
  { name: "Demolição de alvenaria em tijolo maciço", unit: "m2", min_price: 18, avg_price: 22.4, max_price: 33.6, category: "Demolições" },
  { name: "Demolição de laje de betão armado até 12cm", unit: "m2", min_price: 80, avg_price: 101.6, max_price: 169.4, category: "Demolições" },
  { name: "Demolição de betão armado - trabalhos especiais", unit: "hora", min_price: 35, avg_price: 40.3, max_price: 60.5, category: "Demolições" },
  { name: "Desmontagem de banheira", unit: "un", min_price: 50, avg_price: 68.4, max_price: 102.6, category: "Demolições" },
  { name: "Desmontagem de lavatório", unit: "un", min_price: 25, avg_price: 30.0, max_price: 45.0, category: "Demolições" },
  { name: "Desmontagem de núcleo sanitário", unit: "un", min_price: 400, avg_price: 519.8, max_price: 779.6, category: "Demolições" },
  { name: "Desmontagem de cozinha antiga", unit: "un", min_price: 70, avg_price: 95.8, max_price: 143.6, category: "Demolições" },
  { name: "Levantamento de pavimento flutuante", unit: "m2", min_price: 1.2, avg_price: 1.8, max_price: 2.8, category: "Demolições" },
  { name: "Arranque de aros metálicos em betão", unit: "un", min_price: 35, avg_price: 49.0, max_price: 73.4, category: "Demolições" },
  { name: "Remoção de entulho e transporte a vazadouro", unit: "m3", min_price: 25, avg_price: 35.0, max_price: 50.0, category: "Demolições" },
  
  // ==================== ESTRUTURA / BETÃO ====================
  { name: "Betão C20/25 em fundações", unit: "m3", min_price: 85, avg_price: 105.0, max_price: 130.0, category: "Estrutura" },
  { name: "Betão C25/30 em fundações", unit: "m3", min_price: 90, avg_price: 115.0, max_price: 140.0, category: "Estrutura" },
  { name: "Betão C30/37 em elementos estruturais", unit: "m3", min_price: 100, avg_price: 130.0, max_price: 160.0, category: "Estrutura" },
  { name: "Cofragem para fundações", unit: "m2", min_price: 18, avg_price: 28.0, max_price: 42.0, category: "Estrutura" },
  { name: "Cofragem para pilares", unit: "m2", min_price: 28, avg_price: 38.0, max_price: 55.0, category: "Estrutura" },
  { name: "Cofragem para lajes", unit: "m2", min_price: 22, avg_price: 32.0, max_price: 48.0, category: "Estrutura" },
  { name: "Armadura em aço A500 NR", unit: "kg", min_price: 1.4, avg_price: 1.8, max_price: 2.4, category: "Estrutura" },
  { name: "Malhasol CQ38", unit: "m2", min_price: 3.5, avg_price: 4.8, max_price: 6.5, category: "Estrutura" },
  { name: "Betonilha de regularização até 5cm", unit: "m2", min_price: 10, avg_price: 14.0, max_price: 20.0, category: "Estrutura" },
  { name: "Laje aligeirada pré-esforçada", unit: "m2", min_price: 45, avg_price: 62.0, max_price: 85.0, category: "Estrutura" },
  
  // ==================== ALVENARIAS ====================
  { name: "Alvenaria tijolo 30x20x7cm", unit: "m2", min_price: 18, avg_price: 24.0, max_price: 32.0, category: "Alvenarias" },
  { name: "Alvenaria tijolo 30x20x9cm", unit: "m2", min_price: 20, avg_price: 26.0, max_price: 35.0, category: "Alvenarias" },
  { name: "Alvenaria tijolo 30x20x11cm", unit: "m2", min_price: 22, avg_price: 28.0, max_price: 38.0, category: "Alvenarias" },
  { name: "Alvenaria tijolo 30x20x15cm", unit: "m2", min_price: 24, avg_price: 30.0, max_price: 42.0, category: "Alvenarias" },
  { name: "Alvenaria bloco térmico 30cm", unit: "m2", min_price: 35, avg_price: 48.0, max_price: 65.0, category: "Alvenarias" },
  { name: "Parede divisória em pladur simples", unit: "m2", min_price: 28, avg_price: 38.0, max_price: 52.0, category: "Alvenarias" },
  { name: "Parede divisória em pladur dupla", unit: "m2", min_price: 42, avg_price: 55.0, max_price: 72.0, category: "Alvenarias" },
  
  // ==================== REBOCOS E ESTUQUES ====================
  { name: "Reboco tradicional", unit: "m2", min_price: 8, avg_price: 12.0, max_price: 18.0, category: "Rebocos" },
  { name: "Reboco projetado", unit: "m2", min_price: 10, avg_price: 14.0, max_price: 20.0, category: "Rebocos" },
  { name: "Estuque interior", unit: "m2", min_price: 12, avg_price: 16.0, max_price: 24.0, category: "Rebocos" },
  { name: "Barramento de paredes", unit: "m2", min_price: 6, avg_price: 9.0, max_price: 14.0, category: "Rebocos" },
  { name: "Aplicação de primário", unit: "m2", min_price: 1.2, avg_price: 1.8, max_price: 2.8, category: "Rebocos" },
  
  // ==================== ISOLAMENTOS ====================
  { name: "Isolamento térmico ETICS/Cappotto", unit: "m2", min_price: 55, avg_price: 75.0, max_price: 100.0, category: "Isolamentos" },
  { name: "Isolamento térmico EPS 40mm", unit: "m2", min_price: 8, avg_price: 12.0, max_price: 18.0, category: "Isolamentos" },
  { name: "Isolamento térmico XPS 60mm", unit: "m2", min_price: 15, avg_price: 22.0, max_price: 32.0, category: "Isolamentos" },
  { name: "Isolamento acústico lã de rocha", unit: "m2", min_price: 12, avg_price: 18.0, max_price: 26.0, category: "Isolamentos" },
  { name: "Isolamento projetado poliuretano", unit: "m2", min_price: 20, avg_price: 28.0, max_price: 40.0, category: "Isolamentos" },
  
  // ==================== IMPERMEABILIZAÇÕES ====================
  { name: "Impermeabilização tela asfáltica", unit: "m2", min_price: 18, avg_price: 28.0, max_price: 42.0, category: "Impermeabilizações" },
  { name: "Impermeabilização membrana líquida", unit: "m2", min_price: 22, avg_price: 32.0, max_price: 48.0, category: "Impermeabilizações" },
  { name: "Impermeabilização casas de banho", unit: "m2", min_price: 25, avg_price: 35.0, max_price: 50.0, category: "Impermeabilizações" },
  
  // ==================== PAVIMENTOS ====================
  { name: "Pavimento cerâmico interior", unit: "m2", min_price: 30, avg_price: 42.0, max_price: 60.0, category: "Pavimentos" },
  { name: "Pavimento cerâmico exterior", unit: "m2", min_price: 35, avg_price: 48.0, max_price: 68.0, category: "Pavimentos" },
  { name: "Pavimento flutuante laminado", unit: "m2", min_price: 18, avg_price: 28.0, max_price: 42.0, category: "Pavimentos" },
  { name: "Pavimento flutuante madeira", unit: "m2", min_price: 45, avg_price: 65.0, max_price: 95.0, category: "Pavimentos" },
  { name: "Pavimento vinílico", unit: "m2", min_price: 22, avg_price: 32.0, max_price: 48.0, category: "Pavimentos" },
  { name: "Pavimento epóxi", unit: "m2", min_price: 35, avg_price: 50.0, max_price: 75.0, category: "Pavimentos" },
  { name: "Pavimento autonivelante", unit: "m2", min_price: 28, avg_price: 38.0, max_price: 55.0, category: "Pavimentos" },
  { name: "Rodapé cerâmico", unit: "ml", min_price: 8, avg_price: 12.0, max_price: 18.0, category: "Pavimentos" },
  { name: "Rodapé madeira/MDF", unit: "ml", min_price: 6, avg_price: 10.0, max_price: 16.0, category: "Pavimentos" },
  
  // ==================== REVESTIMENTOS PAREDES ====================
  { name: "Revestimento cerâmico paredes", unit: "m2", min_price: 28, avg_price: 38.0, max_price: 55.0, category: "Revestimentos" },
  { name: "Revestimento pedra natural", unit: "m2", min_price: 80, avg_price: 120.0, max_price: 180.0, category: "Revestimentos" },
  { name: "Revestimento vinílico paredes", unit: "m2", min_price: 18, avg_price: 26.0, max_price: 38.0, category: "Revestimentos" },
  
  // ==================== TETOS ====================
  { name: "Teto falso gesso cartonado liso", unit: "m2", min_price: 28, avg_price: 38.0, max_price: 52.0, category: "Tetos" },
  { name: "Teto falso gesso cartonado com sanca", unit: "m2", min_price: 38, avg_price: 52.0, max_price: 72.0, category: "Tetos" },
  { name: "Teto falso acústico", unit: "m2", min_price: 35, avg_price: 48.0, max_price: 68.0, category: "Tetos" },
  { name: "Teto em madeira", unit: "m2", min_price: 55, avg_price: 78.0, max_price: 110.0, category: "Tetos" },
  
  // ==================== PINTURAS ====================
  { name: "Pintura interior tinta plástica", unit: "m2", min_price: 6, avg_price: 10.0, max_price: 16.0, category: "Pinturas" },
  { name: "Pintura exterior tinta plástica", unit: "m2", min_price: 10, avg_price: 16.0, max_price: 24.0, category: "Pinturas" },
  { name: "Pintura esmalte portas/aros", unit: "m2", min_price: 18, avg_price: 28.0, max_price: 42.0, category: "Pinturas" },
  { name: "Pintura teto", unit: "m2", min_price: 6, avg_price: 9.0, max_price: 14.0, category: "Pinturas" },
  { name: "Verniz madeiras", unit: "m2", min_price: 12, avg_price: 18.0, max_price: 28.0, category: "Pinturas" },
  { name: "Pintura impermeabilizante fachada", unit: "m2", min_price: 14, avg_price: 22.0, max_price: 32.0, category: "Pinturas" },
  
  // ==================== CARPINTARIAS ====================
  { name: "Porta interior madeira completa", unit: "un", min_price: 280, avg_price: 420.0, max_price: 650.0, category: "Carpintarias" },
  { name: "Porta interior lacada", unit: "un", min_price: 350, avg_price: 520.0, max_price: 780.0, category: "Carpintarias" },
  { name: "Porta de segurança blindada", unit: "un", min_price: 850, avg_price: 1350.0, max_price: 2200.0, category: "Carpintarias" },
  { name: "Armário embutido roupeiro", unit: "ml", min_price: 380, avg_price: 550.0, max_price: 850.0, category: "Carpintarias" },
  { name: "Aro e guarnição porta", unit: "un", min_price: 85, avg_price: 130.0, max_price: 200.0, category: "Carpintarias" },
  
  // ==================== CAIXILHARIAS ====================
  { name: "Caixilharia alumínio com RPT", unit: "m2", min_price: 320, avg_price: 480.0, max_price: 720.0, category: "Caixilharias" },
  { name: "Caixilharia alumínio sem RPT", unit: "m2", min_price: 220, avg_price: 340.0, max_price: 500.0, category: "Caixilharias" },
  { name: "Caixilharia PVC", unit: "m2", min_price: 250, avg_price: 380.0, max_price: 550.0, category: "Caixilharias" },
  { name: "Vidro duplo 4+16+4mm", unit: "m2", min_price: 55, avg_price: 85.0, max_price: 125.0, category: "Caixilharias" },
  { name: "Vidro duplo baixa emissividade", unit: "m2", min_price: 85, avg_price: 125.0, max_price: 180.0, category: "Caixilharias" },
  { name: "Estore exterior alumínio", unit: "m2", min_price: 120, avg_price: 180.0, max_price: 280.0, category: "Caixilharias" },
  
  // ==================== INSTALAÇÕES ELÉTRICAS ====================
  { name: "Instalação elétrica completa apartamento T2", unit: "vg", min_price: 3500, avg_price: 5200.0, max_price: 7500.0, category: "Instalações Elétricas" },
  { name: "Instalação elétrica por m2", unit: "m2", min_price: 35, avg_price: 52.0, max_price: 78.0, category: "Instalações Elétricas" },
  { name: "Quadro elétrico completo", unit: "un", min_price: 450, avg_price: 680.0, max_price: 1000.0, category: "Instalações Elétricas" },
  { name: "Ponto de luz", unit: "un", min_price: 35, avg_price: 55.0, max_price: 85.0, category: "Instalações Elétricas" },
  { name: "Tomada elétrica", unit: "un", min_price: 28, avg_price: 45.0, max_price: 68.0, category: "Instalações Elétricas" },
  { name: "Interruptor", unit: "un", min_price: 22, avg_price: 38.0, max_price: 58.0, category: "Instalações Elétricas" },
  { name: "Cablagem e tubagem por ponto", unit: "un", min_price: 18, avg_price: 28.0, max_price: 42.0, category: "Instalações Elétricas" },
  
  // ==================== CANALIZAÇÕES ====================
  { name: "Instalação hidráulica completa apartamento T2", unit: "vg", min_price: 2800, avg_price: 4200.0, max_price: 6200.0, category: "Canalizações" },
  { name: "Instalação hidráulica por m2", unit: "m2", min_price: 28, avg_price: 42.0, max_price: 62.0, category: "Canalizações" },
  { name: "Tubagem água PPR", unit: "ml", min_price: 12, avg_price: 18.0, max_price: 28.0, category: "Canalizações" },
  { name: "Tubagem esgoto PVC", unit: "ml", min_price: 15, avg_price: 22.0, max_price: 35.0, category: "Canalizações" },
  { name: "Torneira misturadora lavatório", unit: "un", min_price: 65, avg_price: 120.0, max_price: 250.0, category: "Canalizações" },
  { name: "Torneira misturadora banheira/duche", unit: "un", min_price: 95, avg_price: 180.0, max_price: 380.0, category: "Canalizações" },
  { name: "Sanita completa com autoclismo", unit: "un", min_price: 180, avg_price: 320.0, max_price: 550.0, category: "Canalizações" },
  { name: "Lavatório com coluna", unit: "un", min_price: 120, avg_price: 220.0, max_price: 420.0, category: "Canalizações" },
  { name: "Base de duche", unit: "un", min_price: 150, avg_price: 280.0, max_price: 480.0, category: "Canalizações" },
  { name: "Banheira acrílica", unit: "un", min_price: 250, avg_price: 450.0, max_price: 850.0, category: "Canalizações" },
  { name: "Bidé completo", unit: "un", min_price: 120, avg_price: 200.0, max_price: 350.0, category: "Canalizações" },
  
  // ==================== CLIMATIZAÇÃO ====================
  { name: "Ar condicionado split 2.5kW", unit: "un", min_price: 850, avg_price: 1250.0, max_price: 1850.0, category: "Climatização" },
  { name: "Ar condicionado split 3.5kW", unit: "un", min_price: 1100, avg_price: 1550.0, max_price: 2200.0, category: "Climatização" },
  { name: "Piso radiante hidráulico", unit: "m2", min_price: 45, avg_price: 68.0, max_price: 95.0, category: "Climatização" },
  { name: "Piso radiante elétrico", unit: "m2", min_price: 55, avg_price: 82.0, max_price: 120.0, category: "Climatização" },
  { name: "Radiador alumínio", unit: "un", min_price: 180, avg_price: 280.0, max_price: 450.0, category: "Climatização" },
  { name: "Caldeira gás condensação", unit: "un", min_price: 1800, avg_price: 2800.0, max_price: 4200.0, category: "Climatização" },
  { name: "Bomba de calor", unit: "un", min_price: 3500, avg_price: 5500.0, max_price: 8500.0, category: "Climatização" },
  
  // ==================== COBERTURAS ====================
  { name: "Cobertura em telha cerâmica", unit: "m2", min_price: 45, avg_price: 68.0, max_price: 98.0, category: "Coberturas" },
  { name: "Cobertura em painel sandwich", unit: "m2", min_price: 35, avg_price: 52.0, max_price: 78.0, category: "Coberturas" },
  { name: "Cobertura plana transitável", unit: "m2", min_price: 85, avg_price: 125.0, max_price: 180.0, category: "Coberturas" },
  { name: "Cobertura plana não transitável", unit: "m2", min_price: 55, avg_price: 82.0, max_price: 120.0, category: "Coberturas" },
  { name: "Rufos e caleiras zinco", unit: "ml", min_price: 28, avg_price: 42.0, max_price: 65.0, category: "Coberturas" },
  
  // ==================== COZINHAS ====================
  { name: "Móveis cozinha base/parede", unit: "ml", min_price: 350, avg_price: 550.0, max_price: 850.0, category: "Cozinhas" },
  { name: "Bancada cozinha granito", unit: "ml", min_price: 180, avg_price: 280.0, max_price: 450.0, category: "Cozinhas" },
  { name: "Bancada cozinha Silestone/Dekton", unit: "ml", min_price: 280, avg_price: 420.0, max_price: 650.0, category: "Cozinhas" },
  { name: "Lava-louça inox 2 cubas", unit: "un", min_price: 150, avg_price: 250.0, max_price: 450.0, category: "Cozinhas" },
  { name: "Torneira cozinha", unit: "un", min_price: 85, avg_price: 150.0, max_price: 320.0, category: "Cozinhas" },
  { name: "Exaustor", unit: "un", min_price: 180, avg_price: 320.0, max_price: 580.0, category: "Cozinhas" },
  
  // ==================== SERRALHARIAS ====================
  { name: "Gradeamento ferro/inox", unit: "ml", min_price: 85, avg_price: 150.0, max_price: 280.0, category: "Serralharias" },
  { name: "Corrimão inox", unit: "ml", min_price: 120, avg_price: 200.0, max_price: 350.0, category: "Serralharias" },
  { name: "Guarda metálica escada", unit: "ml", min_price: 180, avg_price: 280.0, max_price: 450.0, category: "Serralharias" },
  { name: "Portão exterior metálico", unit: "m2", min_price: 250, avg_price: 380.0, max_price: 580.0, category: "Serralharias" },
  
  // ==================== ARRANJOS EXTERIORES ====================
  { name: "Pavê betão", unit: "m2", min_price: 25, avg_price: 38.0, max_price: 58.0, category: "Arranjos Exteriores" },
  { name: "Calçada portuguesa", unit: "m2", min_price: 45, avg_price: 68.0, max_price: 98.0, category: "Arranjos Exteriores" },
  { name: "Lancil betão", unit: "ml", min_price: 12, avg_price: 18.0, max_price: 28.0, category: "Arranjos Exteriores" },
  { name: "Muro betão armado", unit: "m3", min_price: 280, avg_price: 420.0, max_price: 620.0, category: "Arranjos Exteriores" },
  { name: "Vedação rede plastificada", unit: "ml", min_price: 35, avg_price: 52.0, max_price: 78.0, category: "Arranjos Exteriores" },
  
  // ==================== ESTALEIRO ====================
  { name: "Montagem estaleiro pequena obra", unit: "vg", min_price: 2500, avg_price: 4500.0, max_price: 8000.0, category: "Estaleiro" },
  { name: "Montagem estaleiro obra média", unit: "vg", min_price: 8000, avg_price: 15000.0, max_price: 25000.0, category: "Estaleiro" },
  { name: "Manutenção estaleiro mensal", unit: "mês", min_price: 800, avg_price: 1500.0, max_price: 2800.0, category: "Estaleiro" },
  { name: "Andaime fachada", unit: "m2", min_price: 8, avg_price: 14.0, max_price: 22.0, category: "Estaleiro" },
  { name: "Vedação estaleiro", unit: "ml", min_price: 15, avg_price: 25.0, max_price: 40.0, category: "Estaleiro" },
  
  // ==================== MOVIMENTO DE TERRAS ====================
  { name: "Escavação em terra", unit: "m3", min_price: 8, avg_price: 14.0, max_price: 22.0, category: "Movimento de Terras" },
  { name: "Escavação em rocha", unit: "m3", min_price: 35, avg_price: 55.0, max_price: 85.0, category: "Movimento de Terras" },
  { name: "Aterro compactado", unit: "m3", min_price: 12, avg_price: 20.0, max_price: 32.0, category: "Movimento de Terras" },
  { name: "Transporte de terras", unit: "m3", min_price: 8, avg_price: 14.0, max_price: 22.0, category: "Movimento de Terras" },
  { name: "Nivelamento terreno", unit: "m2", min_price: 3, avg_price: 5.0, max_price: 8.0, category: "Movimento de Terras" },
]

async function seedMaterials() {
  console.log("Starting materials seeding...")
  
  // First, clear existing materials
  const { error: deleteError } = await supabase
    .from("materials")
    .delete()
    .neq("id", "00000000-0000-0000-0000-000000000000")
  
  if (deleteError) {
    console.error("Error clearing materials:", deleteError)
  }
  
  // Insert all materials
  const materialsToInsert = materials.map(m => ({
    name: m.name,
    category: m.category,
    unit: m.unit,
    min_price: m.min_price,
    avg_price: m.avg_price,
    max_price: m.max_price,
    region: "Nacional",
    last_updated: new Date().toISOString(),
    keywords: m.name.toLowerCase().split(" ").filter(w => w.length > 2)
  }))
  
  const { data, error } = await supabase
    .from("materials")
    .insert(materialsToInsert)
    .select()
  
  if (error) {
    console.error("Error inserting materials:", error)
    return
  }
  
  console.log(`Successfully seeded ${data?.length || 0} materials!`)
}

seedMaterials().catch(console.error)
