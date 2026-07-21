/**
 * Seed 130 curated construction materials into Neon.
 * Run: node --env-file-if-exists=/vercel/share/.env.project scripts/seed-neon.mjs
 */
import pg from "pg"

const pool = new pg.Pool({
  connectionString: process.env.POSTGRES_URL || process.env.DATABASE_URL || process.env.NEON_DATABASE_URL,
  ssl: { rejectUnauthorized: false },
})

const materials = [
  // ── Betão e Argamassas ──────────────────────────────────────────────────────
  { name: "Betão C20/25 em fundações", category: "Betão e Argamassas", unit: "m3", min_price: 105, avg_price: 120, max_price: 145, keywords: ["betao","fundacao","c20"] },
  { name: "Betão C25/30 em estruturas", category: "Betão e Argamassas", unit: "m3", min_price: 120, avg_price: 140, max_price: 165, keywords: ["betao","estrutura","c25"] },
  { name: "Betão C30/37 em lajes", category: "Betão e Argamassas", unit: "m3", min_price: 135, avg_price: 155, max_price: 185, keywords: ["betao","laje","c30"] },
  { name: "Argamassa de assentamento M5", category: "Betão e Argamassas", unit: "m3", min_price: 95, avg_price: 110, max_price: 130, keywords: ["argamassa","assentamento","m5"] },
  { name: "Argamassa de reboco tradicional", category: "Betão e Argamassas", unit: "m2", min_price: 8, avg_price: 12, max_price: 16, keywords: ["argamassa","reboco","tradicional"] },
  { name: "Betão leve para enchimentos", category: "Betão e Argamassas", unit: "m3", min_price: 80, avg_price: 95, max_price: 115, keywords: ["betao","leve","enchimento"] },
  { name: "Argamassa autonivelante para pavimento", category: "Betão e Argamassas", unit: "m2", min_price: 12, avg_price: 16, max_price: 22, keywords: ["argamassa","autonivelante","pavimento"] },
  // ── Alvenaria ───────────────────────────────────────────────────────────────
  { name: "Tijolo furado 30x20x11cm", category: "Alvenaria", unit: "m2", min_price: 18, avg_price: 24, max_price: 32, keywords: ["tijolo","furado","alvenaria"] },
  { name: "Tijolo furado 30x20x22cm", category: "Alvenaria", unit: "m2", min_price: 22, avg_price: 28, max_price: 38, keywords: ["tijolo","furado","22cm"] },
  { name: "Bloco de betão 20x20x40cm", category: "Alvenaria", unit: "m2", min_price: 20, avg_price: 26, max_price: 35, keywords: ["bloco","betao","20x20"] },
  { name: "Bloco de betão celular", category: "Alvenaria", unit: "m2", min_price: 28, avg_price: 35, max_price: 46, keywords: ["bloco","celular","ytong"] },
  { name: "Tijolo maciço de acabamento", category: "Alvenaria", unit: "m2", min_price: 35, avg_price: 45, max_price: 58, keywords: ["tijolo","macico","acabamento"] },
  // ── Coberturas ──────────────────────────────────────────────────────────────
  { name: "Telha cerâmica Lusa", category: "Coberturas", unit: "m2", min_price: 18, avg_price: 24, max_price: 35, keywords: ["telha","ceramica","lusa"] },
  { name: "Telha cerâmica marselha", category: "Coberturas", unit: "m2", min_price: 16, avg_price: 22, max_price: 30, keywords: ["telha","marselha"] },
  { name: "Telha de betão", category: "Coberturas", unit: "m2", min_price: 12, avg_price: 16, max_price: 22, keywords: ["telha","betao"] },
  { name: "Painel sandwich de cobertura", category: "Coberturas", unit: "m2", min_price: 28, avg_price: 38, max_price: 55, keywords: ["painel","sandwich","cobertura"] },
  { name: "Membrana impermeabilizante betuminosa", category: "Coberturas", unit: "m2", min_price: 12, avg_price: 18, max_price: 28, keywords: ["membrana","impermeabilizante","betuminosa"] },
  { name: "Isolamento térmico XPS 60mm", category: "Coberturas", unit: "m2", min_price: 9, avg_price: 14, max_price: 20, keywords: ["isolamento","xps","cobertura"] },
  // ── Isolamentos ─────────────────────────────────────────────────────────────
  { name: "Isolamento térmico lã de rocha 50mm", category: "Isolamentos", unit: "m2", min_price: 8, avg_price: 12, max_price: 18, keywords: ["la","rocha","isolamento","termico"] },
  { name: "Isolamento térmico EPS 80mm", category: "Isolamentos", unit: "m2", min_price: 7, avg_price: 10, max_price: 15, keywords: ["eps","isolamento","80mm"] },
  { name: "Isolamento acústico lã de vidro", category: "Isolamentos", unit: "m2", min_price: 6, avg_price: 9, max_price: 14, keywords: ["la","vidro","acustico","isolamento"] },
  { name: "Sistema ETICS com EPS 80mm", category: "Isolamentos", unit: "m2", min_price: 38, avg_price: 52, max_price: 70, keywords: ["etics","eps","capoto","fachada"] },
  { name: "Isolamento térmico XPS extrudido 60mm", category: "Isolamentos", unit: "m2", min_price: 11, avg_price: 16, max_price: 24, keywords: ["xps","extrudido","isolamento"] },
  // ── Pavimentos ──────────────────────────────────────────────────────────────
  { name: "Pavimento cerâmico 30x30cm", category: "Pavimentos", unit: "m2", min_price: 18, avg_price: 26, max_price: 38, keywords: ["ceramico","pavimento","30x30"] },
  { name: "Pavimento cerâmico 60x60cm", category: "Pavimentos", unit: "m2", min_price: 25, avg_price: 38, max_price: 56, keywords: ["ceramico","pavimento","60x60"] },
  { name: "Porcelânico rectificado 60x60cm", category: "Pavimentos", unit: "m2", min_price: 32, avg_price: 48, max_price: 72, keywords: ["porcelanico","rectificado","60x60"] },
  { name: "Parquet de madeira maciça carvalho", category: "Pavimentos", unit: "m2", min_price: 65, avg_price: 95, max_price: 145, keywords: ["parquet","madeira","carvalho"] },
  { name: "Flutuante de madeira laminada", category: "Pavimentos", unit: "m2", min_price: 18, avg_price: 26, max_price: 38, keywords: ["flutuante","laminado","madeira"] },
  { name: "Mosaico de pedra natural mármore", category: "Pavimentos", unit: "m2", min_price: 55, avg_price: 85, max_price: 140, keywords: ["marmore","pedra","natural"] },
  { name: "Microcimento em pavimento", category: "Pavimentos", unit: "m2", min_price: 35, avg_price: 55, max_price: 85, keywords: ["microcimento","pavimento"] },
  { name: "Vinílico LVT clique 5mm", category: "Pavimentos", unit: "m2", min_price: 18, avg_price: 28, max_price: 42, keywords: ["vinilico","lvt","clique"] },
  // ── Revestimentos ───────────────────────────────────────────────────────────
  { name: "Azulejo de parede 20x20cm", category: "Revestimentos", unit: "m2", min_price: 12, avg_price: 18, max_price: 28, keywords: ["azulejo","parede","20x20"] },
  { name: "Azulejo retificado 30x60cm", category: "Revestimentos", unit: "m2", min_price: 22, avg_price: 32, max_price: 50, keywords: ["azulejo","retificado","30x60"] },
  { name: "Revestimento cerâmico imitação betão", category: "Revestimentos", unit: "m2", min_price: 28, avg_price: 42, max_price: 65, keywords: ["ceramico","imitacao","betao","revestimento"] },
  { name: "Pedra natural calcário revestimento", category: "Revestimentos", unit: "m2", min_price: 42, avg_price: 65, max_price: 105, keywords: ["calcario","pedra","natural"] },
  { name: "Reboco monocamada exterior", category: "Revestimentos", unit: "m2", min_price: 14, avg_price: 20, max_price: 30, keywords: ["reboco","monocamada","exterior"] },
  // ── Pinturas ────────────────────────────────────────────────────────────────
  { name: "Pintura interior tinta plástica 2 demãos", category: "Pinturas", unit: "m2", min_price: 5, avg_price: 8, max_price: 13, keywords: ["pintura","tinta","plastica","interior"] },
  { name: "Pintura exterior tinta de siloxano", category: "Pinturas", unit: "m2", min_price: 9, avg_price: 14, max_price: 22, keywords: ["pintura","siloxano","exterior"] },
  { name: "Pintura betuminosa impermeabilizante", category: "Pinturas", unit: "m2", min_price: 8, avg_price: 12, max_price: 18, keywords: ["pintura","betuminosa","impermeabilizante"] },
  { name: "Primário de fundo para pintura", category: "Pinturas", unit: "m2", min_price: 3, avg_price: 5, max_price: 8, keywords: ["primario","fundo","primering"] },
  { name: "Esmalte sintético para madeiras", category: "Pinturas", unit: "m2", min_price: 7, avg_price: 11, max_price: 16, keywords: ["esmalte","madeira","sintetico"] },
  { name: "Tinta de epóxi para pavimentos", category: "Pinturas", unit: "m2", min_price: 14, avg_price: 22, max_price: 35, keywords: ["epoxi","pavimento","tinta"] },
  // ── Carpintaria ─────────────────────────────────────────────────────────────
  { name: "Porta de madeira maciça interior", category: "Carpintaria", unit: "un", min_price: 280, avg_price: 420, max_price: 680, keywords: ["porta","madeira","interior"] },
  { name: "Porta de madeira com aro e guarnição", category: "Carpintaria", unit: "un", min_price: 380, avg_price: 560, max_price: 850, keywords: ["porta","aro","guarnicao"] },
  { name: "Armário embutido de quarto", category: "Carpintaria", unit: "un", min_price: 850, avg_price: 1400, max_price: 2200, keywords: ["armario","embutido","quarto"] },
  { name: "Cozinha completa mobilada", category: "Carpintaria", unit: "vg", min_price: 3500, avg_price: 7500, max_price: 18000, keywords: ["cozinha","mobilada","moveis"] },
  { name: "Rodapé de madeira MDF 8cm", category: "Carpintaria", unit: "ml", min_price: 5, avg_price: 8, max_price: 14, keywords: ["rodape","mdf","madeira"] },
  { name: "Roupeiro deslizante espelhado", category: "Carpintaria", unit: "m2", min_price: 220, avg_price: 320, max_price: 480, keywords: ["roupeiro","deslizante","espelhado"] },
  { name: "Sancas de teto em gesso cartonado", category: "Carpintaria", unit: "ml", min_price: 28, avg_price: 45, max_price: 70, keywords: ["sancas","teto","gesso"] },
  // ── Caixilharia ─────────────────────────────────────────────────────────────
  { name: "Janela PVC duplo vidro", category: "Caixilharia", unit: "m2", min_price: 180, avg_price: 260, max_price: 380, keywords: ["janela","pvc","duplo","vidro"] },
  { name: "Janela de alumínio com corte térmico", category: "Caixilharia", unit: "m2", min_price: 220, avg_price: 320, max_price: 480, keywords: ["janela","aluminio","corte","termico"] },
  { name: "Porta exterior alumínio com vidro", category: "Caixilharia", unit: "un", min_price: 850, avg_price: 1400, max_price: 2500, keywords: ["porta","exterior","aluminio"] },
  { name: "Vidro duplo 4+12+4mm", category: "Caixilharia", unit: "m2", min_price: 45, avg_price: 65, max_price: 95, keywords: ["vidro","duplo","4+12+4"] },
  { name: "Portada de alumínio exterior", category: "Caixilharia", unit: "m2", min_price: 120, avg_price: 180, max_price: 280, keywords: ["portada","aluminio","exterior"] },
  { name: "Estores de rolo exteriores", category: "Caixilharia", unit: "un", min_price: 180, avg_price: 280, max_price: 450, keywords: ["estore","rolo","exterior"] },
  // ── Instalação Elétrica ──────────────────────────────────────────────────────
  { name: "Quadro elétrico monofásico 24 módulos", category: "Instalação Elétrica", unit: "un", min_price: 280, avg_price: 420, max_price: 650, keywords: ["quadro","eletrico","monofasico"] },
  { name: "Cabo elétrico 2.5mm² (por metro)", category: "Instalação Elétrica", unit: "ml", min_price: 1.2, avg_price: 1.8, max_price: 2.8, keywords: ["cabo","eletrico","2.5mm"] },
  { name: "Tomada dupla de encastrar", category: "Instalação Elétrica", unit: "un", min_price: 12, avg_price: 18, max_price: 28, keywords: ["tomada","dupla","encastrar"] },
  { name: "Interruptor simples de encastrar", category: "Instalação Elétrica", unit: "un", min_price: 8, avg_price: 13, max_price: 20, keywords: ["interruptor","simples","encastrar"] },
  { name: "Luminária LED de encastrar 12W", category: "Instalação Elétrica", unit: "un", min_price: 18, avg_price: 28, max_price: 45, keywords: ["luminaria","led","encastrar"] },
  { name: "Instalação elétrica completa T2", category: "Instalação Elétrica", unit: "vg", min_price: 2800, avg_price: 4200, max_price: 6500, keywords: ["instalacao","eletrica","t2","completa"] },
  // ── Canalização ─────────────────────────────────────────────────────────────
  { name: "Tubo PPR para água quente 20mm", category: "Canalização", unit: "ml", min_price: 3.5, avg_price: 5.5, max_price: 8.5, keywords: ["tubo","ppr","agua","quente"] },
  { name: "Tubo multicamada para radiadores", category: "Canalização", unit: "ml", min_price: 4, avg_price: 6.5, max_price: 10, keywords: ["multicamada","radiadores","tubo"] },
  { name: "Tubo PVC esgoto 110mm", category: "Canalização", unit: "ml", min_price: 5, avg_price: 8, max_price: 12, keywords: ["pvc","esgoto","110mm"] },
  { name: "Lavatório cerâmico com coluna", category: "Canalização", unit: "un", min_price: 95, avg_price: 145, max_price: 220, keywords: ["lavatorio","ceramico","coluna"] },
  { name: "Sanita com caixa de descarga", category: "Canalização", unit: "un", min_price: 120, avg_price: 185, max_price: 320, keywords: ["sanita","descarga","wc"] },
  { name: "Banheira acrílica 160x70cm", category: "Canalização", unit: "un", min_price: 280, avg_price: 420, max_price: 680, keywords: ["banheira","acrilica","160x70"] },
  { name: "Instalação hidráulica completa T2", category: "Canalização", unit: "vg", min_price: 2200, avg_price: 3500, max_price: 5500, keywords: ["hidraulica","instalacao","t2","completa"] },
  // ── AVAC ────────────────────────────────────────────────────────────────────
  { name: "Ar condicionado split 9000 BTU", category: "AVAC", unit: "un", min_price: 680, avg_price: 980, max_price: 1500, keywords: ["ar","condicionado","split","9000"] },
  { name: "Ar condicionado split 12000 BTU", category: "AVAC", unit: "un", min_price: 850, avg_price: 1250, max_price: 1900, keywords: ["ar","condicionado","split","12000"] },
  { name: "Bomba de calor ar-água monobloco", category: "AVAC", unit: "un", min_price: 3500, avg_price: 5800, max_price: 9500, keywords: ["bomba","calor","ar-agua","monobloco"] },
  { name: "Radiador de aço painel 500x600mm", category: "AVAC", unit: "un", min_price: 55, avg_price: 85, max_price: 130, keywords: ["radiador","aco","painel","500x600"] },
  { name: "Caldeira a gás de condensação", category: "AVAC", unit: "un", min_price: 1200, avg_price: 1900, max_price: 3200, keywords: ["caldeira","gas","condensacao"] },
  { name: "Ventilação mecânica controlada VMC", category: "AVAC", unit: "vg", min_price: 1800, avg_price: 3200, max_price: 5800, keywords: ["ventilacao","mecanica","vmc"] },
  // ── Estruturas Metálicas ─────────────────────────────────────────────────────
  { name: "Estrutura metálica IPE 200", category: "Estruturas Metálicas", unit: "kg", min_price: 2.2, avg_price: 3.0, max_price: 4.2, keywords: ["ipe","200","viga","metalica"] },
  { name: "Perfil metálico HEB 200", category: "Estruturas Metálicas", unit: "kg", min_price: 2.0, avg_price: 2.8, max_price: 3.8, keywords: ["heb","200","pilar","metalico"] },
  { name: "Chapa metálica galvanizada 2mm", category: "Estruturas Metálicas", unit: "m2", min_price: 22, avg_price: 32, max_price: 48, keywords: ["chapa","galvanizada","2mm"] },
  { name: "Armadura de aço A500 NR", category: "Estruturas Metálicas", unit: "kg", min_price: 0.95, avg_price: 1.25, max_price: 1.65, keywords: ["armadura","aco","a500","varoes"] },
  { name: "Rede electrossoldada malhasol", category: "Estruturas Metálicas", unit: "m2", min_price: 3.5, avg_price: 5.0, max_price: 7.5, keywords: ["rede","electrossoldada","malhasol"] },
  // ── Terraplanagem ─────────────────────────────────────────────────────────────
  { name: "Escavação de terras a máquina", category: "Terraplanagem", unit: "m3", min_price: 6, avg_price: 9, max_price: 14, keywords: ["escavacao","terras","maquina"] },
  { name: "Aterro compactado com brita", category: "Terraplanagem", unit: "m3", min_price: 18, avg_price: 26, max_price: 38, keywords: ["aterro","compactado","brita"] },
  { name: "Transporte de terras a vazadouro", category: "Terraplanagem", unit: "m3", min_price: 8, avg_price: 14, max_price: 22, keywords: ["transporte","terras","vazadouro"] },
  { name: "Brita calcária 20-40mm", category: "Terraplanagem", unit: "ton", min_price: 12, avg_price: 18, max_price: 26, keywords: ["brita","calcaria","20-40"] },
  // ── Fundações ───────────────────────────────────────────────────────────────
  { name: "Fundação directa em betão C25/30", category: "Fundações", unit: "m3", min_price: 160, avg_price: 210, max_price: 275, keywords: ["fundacao","directa","betao","c25"] },
  { name: "Estacas moldadas Ø600mm", category: "Fundações", unit: "ml", min_price: 85, avg_price: 120, max_price: 165, keywords: ["estacas","moldadas","600mm"] },
  { name: "Impermeabilização de fundações", category: "Fundações", unit: "m2", min_price: 15, avg_price: 22, max_price: 35, keywords: ["impermeabilizacao","fundacoes"] },
  { name: "Laje de betão em cave", category: "Fundações", unit: "m2", min_price: 55, avg_price: 80, max_price: 115, keywords: ["laje","cave","betao"] },
  // ── Demolições ──────────────────────────────────────────────────────────────
  { name: "Demolição de parede de alvenaria", category: "Demolições", unit: "m2", min_price: 14, avg_price: 22, max_price: 35, keywords: ["demolicao","parede","alvenaria"] },
  { name: "Demolição de laje de betão", category: "Demolições", unit: "m2", min_price: 28, avg_price: 42, max_price: 65, keywords: ["demolicao","laje","betao"] },
  { name: "Remoção e transporte de entulho", category: "Demolições", unit: "m3", min_price: 22, avg_price: 35, max_price: 55, keywords: ["remocao","entulho","transporte"] },
  { name: "Demolição de pavimento cerâmico", category: "Demolições", unit: "m2", min_price: 8, avg_price: 14, max_price: 22, keywords: ["demolicao","pavimento","ceramico"] },
  // ── Serralharia ─────────────────────────────────────────────────────────────
  { name: "Gradeamento metálico exterior", category: "Serralharia", unit: "ml", min_price: 95, avg_price: 150, max_price: 240, keywords: ["gradeamento","metalico","exterior"] },
  { name: "Portão automático de garagem", category: "Serralharia", unit: "un", min_price: 1800, avg_price: 2800, max_price: 4500, keywords: ["portao","automatico","garagem"] },
  { name: "Escada de aço inoxidável", category: "Serralharia", unit: "ml", min_price: 350, avg_price: 580, max_price: 950, keywords: ["escada","inoxidavel","aco"] },
  { name: "Guarda-corpos em inox", category: "Serralharia", unit: "ml", min_price: 180, avg_price: 280, max_price: 450, keywords: ["guarda","corpos","inox"] },
  // ── Gesso e Pladur ──────────────────────────────────────────────────────────
  { name: "Teto falso em gesso cartonado", category: "Gesso e Pladur", unit: "m2", min_price: 18, avg_price: 28, max_price: 42, keywords: ["teto","falso","gesso","cartonado"] },
  { name: "Divisória em pladur simples", category: "Gesso e Pladur", unit: "m2", min_price: 22, avg_price: 32, max_price: 48, keywords: ["divisoria","pladur","simples"] },
  { name: "Divisória em pladur dupla com isolamento", category: "Gesso e Pladur", unit: "m2", min_price: 35, avg_price: 52, max_price: 78, keywords: ["divisoria","pladur","dupla","acustico"] },
  { name: "Reparação de teto em gesso", category: "Gesso e Pladur", unit: "m2", min_price: 15, avg_price: 24, max_price: 36, keywords: ["reparacao","teto","gesso"] },
  // ── Impermeabilização ───────────────────────────────────────────────────────
  { name: "Impermeabilização de terraço com manta", category: "Impermeabilização", unit: "m2", min_price: 18, avg_price: 28, max_price: 45, keywords: ["impermeabilizacao","terraco","manta"] },
  { name: "Impermeabilização de casa de banho", category: "Impermeabilização", unit: "m2", min_price: 22, avg_price: 35, max_price: 55, keywords: ["impermeabilizacao","banho","wc"] },
  { name: "Reparação de infiltrações em cobertura", category: "Impermeabilização", unit: "vg", min_price: 450, avg_price: 850, max_price: 1800, keywords: ["infiltracao","reparacao","cobertura"] },
  // ── Arranjos Exteriores ──────────────────────────────────────────────────────
  { name: "Calçada portuguesa irregular", category: "Arranjos Exteriores", unit: "m2", min_price: 28, avg_price: 42, max_price: 68, keywords: ["calcada","portuguesa","irregular"] },
  { name: "Pavimento exterior em betão estampado", category: "Arranjos Exteriores", unit: "m2", min_price: 35, avg_price: 55, max_price: 85, keywords: ["betao","estampado","exterior"] },
  { name: "Muro de vedação em betão", category: "Arranjos Exteriores", unit: "ml", min_price: 95, avg_price: 145, max_price: 225, keywords: ["muro","vedacao","betao"] },
  { name: "Lancil de granito 20x10cm", category: "Arranjos Exteriores", unit: "ml", min_price: 18, avg_price: 28, max_price: 42, keywords: ["lancil","granito","20x10"] },
  // ── Energia Solar ────────────────────────────────────────────────────────────
  { name: "Painel solar fotovoltaico 400W", category: "Energia Solar", unit: "un", min_price: 180, avg_price: 260, max_price: 380, keywords: ["painel","solar","fotovoltaico","400w"] },
  { name: "Sistema fotovoltaico 3kWp completo", category: "Energia Solar", unit: "vg", min_price: 4200, avg_price: 6500, max_price: 9800, keywords: ["fotovoltaico","3kwp","sistema"] },
  { name: "Coletor solar térmico para AQS", category: "Energia Solar", unit: "un", min_price: 350, avg_price: 520, max_price: 800, keywords: ["coletor","solar","termico","aqs"] },
  // ── Segurança ────────────────────────────────────────────────────────────────
  { name: "Sistema de alarme intrusão básico", category: "Segurança", unit: "vg", min_price: 650, avg_price: 1100, max_price: 2200, keywords: ["alarme","intrusao","seguranca"] },
  { name: "Câmara de vigilância IP exterior", category: "Segurança", unit: "un", min_price: 120, avg_price: 200, max_price: 350, keywords: ["camera","vigilancia","ip","exterior"] },
  { name: "Controlo de acessos torniquete", category: "Segurança", unit: "un", min_price: 1800, avg_price: 3500, max_price: 7500, keywords: ["controlo","acesso","torniquete"] },
  // ── Serviços de Obra ────────────────────────────────────────────────────────
  { name: "Mão de obra de pedreiro (por dia)", category: "Mão de Obra", unit: "dia", min_price: 95, avg_price: 135, max_price: 185, keywords: ["mao","obra","pedreiro"] },
  { name: "Mão de obra de eletricista (por dia)", category: "Mão de Obra", unit: "dia", min_price: 110, avg_price: 155, max_price: 210, keywords: ["eletricista","mao","obra"] },
  { name: "Mão de obra de canalizador (por dia)", category: "Mão de Obra", unit: "dia", min_price: 105, avg_price: 150, max_price: 205, keywords: ["canalizador","mao","obra"] },
  { name: "Andaimes tubulares (por mês)", category: "Mão de Obra", unit: "m2", min_price: 3.5, avg_price: 5.5, max_price: 8.5, keywords: ["andaimes","tubulares","aluguer"] },
  { name: "Contentor de entulho (por semana)", category: "Mão de Obra", unit: "un", min_price: 85, avg_price: 130, max_price: 200, keywords: ["contentor","entulho","aluguer"] },
]

async function seed() {
  // Check existing count
  const { rows: [{ n }] } = await pool.query("SELECT count(*)::int n FROM materials")
  if (n >= materials.length) {
    console.log(`Already have ${n} materials in Neon — skipping seed.`)
    return
  }
  console.log(`Inserting ${materials.length} materials into Neon...`)

  let inserted = 0
  for (const m of materials) {
    await pool.query(
      `INSERT INTO materials (name, category, unit, min_price, avg_price, max_price, keywords, region)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
       ON CONFLICT DO NOTHING`,
      [m.name, m.category, m.unit, m.min_price, m.avg_price, m.max_price, m.keywords, "Portugal"]
    )
    inserted++
  }
  console.log(`Done: ${inserted} rows inserted.`)
}

seed()
  .then(() => pool.end())
  .catch((e) => { console.error("Seed failed:", e.message); process.exit(1) })
