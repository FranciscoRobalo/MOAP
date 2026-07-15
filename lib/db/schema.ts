import {
  boolean,
  date,
  decimal,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core"

// ============================================================
// Better Auth tables (column names must stay camelCase)
// ============================================================

export const user = pgTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("emailVerified").notNull().default(false),
  image: text("image"),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
  updatedAt: timestamp("updatedAt").notNull().defaultNow(),
})

export const session = pgTable("session", {
  id: text("id").primaryKey(),
  expiresAt: timestamp("expiresAt").notNull(),
  token: text("token").notNull().unique(),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
  updatedAt: timestamp("updatedAt").notNull().defaultNow(),
  ipAddress: text("ipAddress"),
  userAgent: text("userAgent"),
  userId: text("userId")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
})

export const account = pgTable("account", {
  id: text("id").primaryKey(),
  accountId: text("accountId").notNull(),
  providerId: text("providerId").notNull(),
  userId: text("userId")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  accessToken: text("accessToken"),
  refreshToken: text("refreshToken"),
  idToken: text("idToken"),
  accessTokenExpiresAt: timestamp("accessTokenExpiresAt"),
  refreshTokenExpiresAt: timestamp("refreshTokenExpiresAt"),
  scope: text("scope"),
  password: text("password"),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
  updatedAt: timestamp("updatedAt").notNull().defaultNow(),
})

export const verification = pgTable("verification", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: timestamp("expiresAt").notNull(),
  createdAt: timestamp("createdAt").defaultNow(),
  updatedAt: timestamp("updatedAt").defaultNow(),
})

// ============================================================
// App tables
// ============================================================

export const profiles = pgTable("profiles", {
  id: text("id").primaryKey(),
  email: text("email").notNull(),
  name: text("name").notNull(),
  role: text("role").notNull().default("cliente"),
  company: text("company"),
  phone: text("phone"),
  avatarUrl: text("avatar_url"),
  approved: boolean("approved").default(false),
  approvedBy: text("approved_by"),
  approvedAt: timestamp("approved_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
})

export const materials = pgTable("materials", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  category: text("category").notNull(),
  subcategory: text("subcategory"),
  unit: text("unit").notNull(),
  minPrice: decimal("min_price", { precision: 12, scale: 2 }),
  avgPrice: decimal("avg_price", { precision: 12, scale: 2 }).notNull(),
  maxPrice: decimal("max_price", { precision: 12, scale: 2 }),
  supplier: text("supplier"),
  region: text("region").default("Portugal"),
  description: text("description"),
  keywords: text("keywords").array(),
  lastUpdated: timestamp("last_updated", { withTimezone: true }).defaultNow(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  createdBy: text("created_by"),
})

export const obras = pgTable("obras", {
  id: uuid("id").primaryKey().defaultRandom(),
  title: text("title").notNull(),
  clientName: text("client_name"),
  clientId: text("client_id"),
  location: text("location"),
  category: text("category").default("Residencial"),
  description: text("description"),
  area: text("area"),
  type: text("type"),
  budget: decimal("budget", { precision: 14, scale: 2 }),
  startDate: date("start_date"),
  endDate: date("end_date"),
  timeline: text("timeline"),
  status: text("status").default("pending"),
  progress: integer("progress").default(0),
  contactName: text("contact_name"),
  contactEmail: text("contact_email"),
  contactPhone: text("contact_phone"),
  notes: text("notes"),
  createdBy: text("created_by"),
  assignedTo: text("assigned_to"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
})

export const budgets = pgTable("budgets", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  obraId: uuid("obra_id"),
  uploadedBy: text("uploaded_by"),
  status: text("status").default("rascunho"),
  totalValue: decimal("total_value", { precision: 14, scale: 2 }),
  totalItems: integer("total_items").default(0),
  analysisScore: decimal("analysis_score", { precision: 5, scale: 2 }),
  analysisDate: timestamp("analysis_date", { withTimezone: true }),
  analyzedBy: text("analyzed_by"),
  notes: text("notes"),
  fileUrl: text("file_url"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
})

export const budgetItems = pgTable("budget_items", {
  id: uuid("id").primaryKey().defaultRandom(),
  budgetId: uuid("budget_id"),
  originalName: text("original_name").notNull(),
  matchedMaterialId: uuid("matched_material_id"),
  matchedName: text("matched_name"),
  matchConfidence: decimal("match_confidence", { precision: 5, scale: 4 }).default("0"),
  quantity: decimal("quantity", { precision: 12, scale: 4 }),
  unit: text("unit"),
  unitPrice: decimal("unit_price", { precision: 12, scale: 2 }).notNull(),
  totalPrice: decimal("total_price", { precision: 14, scale: 2 }),
  referenceAvgPrice: decimal("reference_avg_price", { precision: 12, scale: 2 }),
  referenceMinPrice: decimal("reference_min_price", { precision: 12, scale: 2 }),
  referenceMaxPrice: decimal("reference_max_price", { precision: 12, scale: 2 }),
  variance: decimal("variance", { precision: 8, scale: 2 }),
  rating: text("rating"),
  category: text("category"),
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
})

export const visitas = pgTable("visitas", {
  id: uuid("id").primaryKey().defaultRandom(),
  obraId: uuid("obra_id"),
  date: date("date"),
  time: text("time"),
  type: text("type"),
  contactName: text("contact_name"),
  contactPhone: text("contact_phone"),
  notes: text("notes"),
  status: text("status").default("agendada"),
  createdBy: text("created_by"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
})

export const notifications = pgTable("notifications", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: text("user_id").notNull(),
  type: text("type").notNull(),
  title: text("title").notNull(),
  description: text("description"),
  read: boolean("read").default(false),
  link: text("link"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
})

export const analiseSaved = pgTable("analise_saved", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: text("user_id").notNull(),
  fileName: text("file_name"),
  region: text("region"),
  totalBudget: decimal("total_budget", { precision: 14, scale: 2 }),
  totalReference: decimal("total_reference", { precision: 14, scale: 2 }),
  overallVariance: decimal("overall_variance", { precision: 8, scale: 2 }),
  overallRating: text("overall_rating"),
  qualityScore: decimal("quality_score", { precision: 5, scale: 2 }),
  matchRate: decimal("match_rate", { precision: 5, scale: 2 }),
  potentialSavings: decimal("potential_savings", { precision: 14, scale: 2 }),
  riskItems: integer("risk_items"),
  stats: jsonb("stats"),
  categoryBreakdown: jsonb("category_breakdown"),
  recommendations: jsonb("recommendations"),
  items: jsonb("items"),
  submissionStatus: text("submission_status").default("draft"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
})

export const apiKeys = pgTable("api_keys", {
  id: uuid("id").primaryKey().defaultRandom(),
  key: text("key").notNull().unique(),
  name: text("name"),
  createdBy: text("created_by"),
  active: boolean("active").default(true),
  lastUsedAt: timestamp("last_used_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
})
