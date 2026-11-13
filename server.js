var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __esm = (fn, res, err) => function __init() {
  if (err) throw err[0];
  try {
    return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
  } catch (e) {
    throw err = [e], e;
  }
};
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __decorateClass = (decorators, target, key, kind) => {
  var result = kind > 1 ? void 0 : kind ? __getOwnPropDesc(target, key) : target;
  for (var i = decorators.length - 1, decorator; i >= 0; i--)
    if (decorator = decorators[i])
      result = (kind ? decorator(target, key, result) : decorator(result)) || result;
  if (kind && result) __defProp(target, key, result);
  return result;
};

// server/entities/Lead.ts
import { Entity, PrimaryColumn, Column, Index, CreateDateColumn } from "typeorm";
var Lead;
var init_Lead = __esm({
  "server/entities/Lead.ts"() {
    Lead = class {
    };
    __decorateClass([
      PrimaryColumn({ type: "varchar", length: 64 })
    ], Lead.prototype, "id", 2);
    __decorateClass([
      Column({ name: "company_name", type: "varchar", length: 255 })
    ], Lead.prototype, "companyName", 2);
    __decorateClass([
      Column({ type: "varchar", length: 255 })
    ], Lead.prototype, "domain", 2);
    __decorateClass([
      Column({ type: "varchar", length: 128 })
    ], Lead.prototype, "industry", 2);
    __decorateClass([
      Column({ name: "employee_range", type: "varchar", length: 64, default: "51-200" })
    ], Lead.prototype, "employeeRange", 2);
    __decorateClass([
      Column({ name: "employee_count", type: "int", default: 100 })
    ], Lead.prototype, "employeeCount", 2);
    __decorateClass([
      Column({ name: "revenue_range", type: "varchar", length: 64, default: "$10M - $50M" })
    ], Lead.prototype, "revenueRange", 2);
    __decorateClass([
      Column({ name: "annual_revenue_usd", type: "bigint", default: 25e6 })
    ], Lead.prototype, "annualRevenueUsd", 2);
    __decorateClass([
      Column({ type: "varchar", length: 128, default: "United States" })
    ], Lead.prototype, "country", 2);
    __decorateClass([
      Column({ type: "varchar", length: 128, default: "San Francisco, CA" })
    ], Lead.prototype, "city", 2);
    __decorateClass([
      Column({ name: "contact_name", type: "varchar", length: 255 })
    ], Lead.prototype, "contactName", 2);
    __decorateClass([
      Column({ name: "contact_title", type: "varchar", length: 255 })
    ], Lead.prototype, "contactTitle", 2);
    __decorateClass([
      Column({ type: "varchar", length: 64, default: "Director" })
    ], Lead.prototype, "seniority", 2);
    __decorateClass([
      Column({ type: "varchar", length: 128, default: "Sales & Revenue" })
    ], Lead.prototype, "department", 2);
    __decorateClass([
      Column({ name: "contact_email", type: "varchar", length: 255 })
    ], Lead.prototype, "contactEmail", 2);
    __decorateClass([
      Column({ name: "contact_phone", type: "varchar", length: 64, nullable: true })
    ], Lead.prototype, "contactPhone", 2);
    __decorateClass([
      Column({ name: "linkedin_url", type: "varchar", length: 255, nullable: true })
    ], Lead.prototype, "linkedinUrl", 2);
    __decorateClass([
      Column({ name: "verification_status", type: "varchar", length: 32, default: "Verified" })
    ], Lead.prototype, "verificationStatus", 2);
    __decorateClass([
      Column({ name: "funding_stage", type: "varchar", length: 64, default: "Series B" })
    ], Lead.prototype, "fundingStage", 2);
    __decorateClass([
      Column({ name: "tech_stack", type: "json", nullable: true })
    ], Lead.prototype, "techStack", 2);
    __decorateClass([
      Column({ name: "buying_intent_score", type: "int", default: 85 })
    ], Lead.prototype, "buyingIntentScore", 2);
    __decorateClass([
      Column({ name: "founded_year", type: "int", default: 2018 })
    ], Lead.prototype, "foundedYear", 2);
    __decorateClass([
      Column({ name: "has_direct_phone", type: "tinyint", default: 1 })
    ], Lead.prototype, "hasDirectPhone", 2);
    __decorateClass([
      Column({ name: "is_custom", type: "tinyint", default: 0 })
    ], Lead.prototype, "isCustom", 2);
    __decorateClass([
      Column({ name: "is_recent", type: "tinyint", default: 1 })
    ], Lead.prototype, "isRecent", 2);
    __decorateClass([
      Column({ type: "varchar", length: 64, default: "mysql_b2b_database" })
    ], Lead.prototype, "source", 2);
    __decorateClass([
      CreateDateColumn({ name: "created_at" })
    ], Lead.prototype, "createdAt", 2);
    Lead = __decorateClass([
      Entity("leads"),
      Index("idx_domain", ["domain"]),
      Index("idx_email", ["contactEmail"]),
      Index("idx_industry", ["industry"]),
      Index("idx_country", ["country"]),
      Index("idx_score", ["buyingIntentScore"]),
      Index("idx_custom", ["isCustom"]),
      Index("idx_recent", ["isRecent"]),
      Index("idx_seniority", ["seniority"]),
      Index("idx_rev_range", ["revenueRange"]),
      Index("idx_ind_score", ["industry", "buyingIntentScore"]),
      Index("idx_ind_sen_score", ["industry", "seniority", "buyingIntentScore"]),
      Index("idx_company_name", ["companyName"]),
      Index("idx_emp_count", ["employeeCount"]),
      Index("idx_ann_rev", ["annualRevenueUsd"]),
      Index("idx_emp_range", ["employeeRange"]),
      Index("idx_department", ["department"]),
      Index("idx_ver_status", ["verificationStatus"]),
      Index("idx_direct_phone", ["hasDirectPhone"])
    ], Lead);
  }
});

// server/entities/User.ts
import { Entity as Entity2, PrimaryColumn as PrimaryColumn2, Column as Column2, CreateDateColumn as CreateDateColumn2 } from "typeorm";
var User;
var init_User = __esm({
  "server/entities/User.ts"() {
    User = class {
    };
    __decorateClass([
      PrimaryColumn2({ type: "varchar", length: 64 })
    ], User.prototype, "id", 2);
    __decorateClass([
      Column2({ type: "varchar", length: 255 })
    ], User.prototype, "name", 2);
    __decorateClass([
      Column2({ type: "varchar", length: 255, unique: true })
    ], User.prototype, "email", 2);
    __decorateClass([
      Column2({ name: "password_hash", type: "varchar", length: 255, nullable: true })
    ], User.prototype, "passwordHash", 2);
    __decorateClass([
      Column2({ type: "varchar", length: 64, default: "Revenue Operations" })
    ], User.prototype, "role", 2);
    __decorateClass([
      Column2({ name: "is_super_admin", type: "tinyint", default: 0 })
    ], User.prototype, "isSuperAdmin", 2);
    __decorateClass([
      Column2({ name: "is_deactivated", type: "tinyint", default: 0 })
    ], User.prototype, "isDeactivated", 2);
    __decorateClass([
      Column2({ type: "varchar", length: 255, default: "Growth Workspace" })
    ], User.prototype, "company", 2);
    __decorateClass([
      Column2({ type: "varchar", length: 64, default: "Free Starter" })
    ], User.prototype, "plan", 2);
    __decorateClass([
      Column2({ name: "plan_id", type: "varchar", length: 32, default: "free" })
    ], User.prototype, "planId", 2);
    __decorateClass([
      Column2({ name: "credits_remaining", type: "int", default: 100 })
    ], User.prototype, "creditsRemaining", 2);
    __decorateClass([
      Column2({ name: "daily_credits_limit", type: "int", default: 100 })
    ], User.prototype, "dailyCreditsLimit", 2);
    __decorateClass([
      Column2({ name: "credits_used_today", type: "int", default: 0 })
    ], User.prototype, "creditsUsedToday", 2);
    __decorateClass([
      Column2({ name: "total_credits_used", type: "int", default: 0 })
    ], User.prototype, "totalCreditsUsed", 2);
    __decorateClass([
      Column2({ name: "payment_status", type: "varchar", length: 32, default: "free" })
    ], User.prototype, "paymentStatus", 2);
    __decorateClass([
      Column2({ name: "amount_paid", type: "decimal", precision: 10, scale: 2, default: 0 })
    ], User.prototype, "amountPaid", 2);
    __decorateClass([
      Column2({ name: "total_paid", type: "decimal", precision: 10, scale: 2, default: 0 })
    ], User.prototype, "totalPaid", 2);
    __decorateClass([
      Column2({ name: "auth_provider", type: "varchar", length: 32, default: "jwt" })
    ], User.prototype, "authProvider", 2);
    __decorateClass([
      Column2({ name: "photo_url", type: "text", nullable: true })
    ], User.prototype, "photoUrl", 2);
    __decorateClass([
      Column2({ name: "last_login_at", type: "datetime", default: () => "CURRENT_TIMESTAMP" })
    ], User.prototype, "lastLoginAt", 2);
    __decorateClass([
      CreateDateColumn2({ name: "created_at" })
    ], User.prototype, "createdAt", 2);
    User = __decorateClass([
      Entity2("users")
    ], User);
  }
});

// server/entities/UserPurchase.ts
import { Entity as Entity3, PrimaryColumn as PrimaryColumn3, Column as Column3, CreateDateColumn as CreateDateColumn3, Index as Index2 } from "typeorm";
var UserPurchase;
var init_UserPurchase = __esm({
  "server/entities/UserPurchase.ts"() {
    UserPurchase = class {
    };
    __decorateClass([
      PrimaryColumn3({ type: "varchar", length: 64 })
    ], UserPurchase.prototype, "id", 2);
    __decorateClass([
      Column3({ name: "user_id", type: "varchar", length: 64 })
    ], UserPurchase.prototype, "userId", 2);
    __decorateClass([
      Column3({ name: "invoice_number", type: "varchar", length: 64 })
    ], UserPurchase.prototype, "invoiceNumber", 2);
    __decorateClass([
      CreateDateColumn3({ name: "date" })
    ], UserPurchase.prototype, "date", 2);
    __decorateClass([
      Column3({ name: "plan_name", type: "varchar", length: 128 })
    ], UserPurchase.prototype, "planName", 2);
    __decorateClass([
      Column3({ name: "plan_id", type: "varchar", length: 32 })
    ], UserPurchase.prototype, "planId", 2);
    __decorateClass([
      Column3({ name: "credits_granted", type: "varchar", length: 64 })
    ], UserPurchase.prototype, "creditsGranted", 2);
    __decorateClass([
      Column3({ type: "decimal", precision: 10, scale: 2 })
    ], UserPurchase.prototype, "amount", 2);
    __decorateClass([
      Column3({ type: "varchar", length: 10, default: "USD" })
    ], UserPurchase.prototype, "currency", 2);
    __decorateClass([
      Column3({ type: "varchar", length: 32, default: "Completed" })
    ], UserPurchase.prototype, "status", 2);
    __decorateClass([
      Column3({ name: "payment_method", type: "varchar", length: 128 })
    ], UserPurchase.prototype, "paymentMethod", 2);
    UserPurchase = __decorateClass([
      Entity3("user_purchases"),
      Index2("idx_user_id", ["userId"])
    ], UserPurchase);
  }
});

// server/entities/UserLogin.ts
import { Entity as Entity4, PrimaryGeneratedColumn, Column as Column4, CreateDateColumn as CreateDateColumn4, Index as Index3 } from "typeorm";
var UserLogin;
var init_UserLogin = __esm({
  "server/entities/UserLogin.ts"() {
    UserLogin = class {
    };
    __decorateClass([
      PrimaryGeneratedColumn()
    ], UserLogin.prototype, "id", 2);
    __decorateClass([
      Column4({ name: "user_id", type: "varchar", length: 64 })
    ], UserLogin.prototype, "userId", 2);
    __decorateClass([
      CreateDateColumn4({ name: "timestamp" })
    ], UserLogin.prototype, "timestamp", 2);
    __decorateClass([
      Column4({ type: "varchar", length: 64, nullable: true })
    ], UserLogin.prototype, "ip", 2);
    __decorateClass([
      Column4({ type: "varchar", length: 128, nullable: true })
    ], UserLogin.prototype, "location", 2);
    __decorateClass([
      Column4({ type: "varchar", length: 128, nullable: true })
    ], UserLogin.prototype, "device", 2);
    UserLogin = __decorateClass([
      Entity4("user_logins"),
      Index3("idx_login_user", ["userId"])
    ], UserLogin);
  }
});

// server/entities/SavedList.ts
var SavedList_exports = {};
__export(SavedList_exports, {
  SavedList: () => SavedList
});
import {
  Entity as Entity5,
  PrimaryColumn as PrimaryColumn4,
  Column as Column5,
  CreateDateColumn as CreateDateColumn5,
  UpdateDateColumn as UpdateDateColumn2,
  Index as Index4
} from "typeorm";
var SavedList;
var init_SavedList = __esm({
  "server/entities/SavedList.ts"() {
    SavedList = class {
    };
    __decorateClass([
      PrimaryColumn4({ type: "varchar", length: 64 })
    ], SavedList.prototype, "id", 2);
    __decorateClass([
      Index4(),
      Column5({ name: "user_id", type: "varchar", length: 64, nullable: true })
    ], SavedList.prototype, "userId", 2);
    __decorateClass([
      Column5({ type: "varchar", length: 255 })
    ], SavedList.prototype, "name", 2);
    __decorateClass([
      Column5({ type: "text", nullable: true })
    ], SavedList.prototype, "description", 2);
    __decorateClass([
      Column5({ name: "lead_ids", type: "json", nullable: true })
    ], SavedList.prototype, "leadIds", 2);
    __decorateClass([
      Column5({ name: "filter_summary", type: "text", nullable: true })
    ], SavedList.prototype, "filterSummary", 2);
    __decorateClass([
      Column5({ name: "lead_count", type: "int", default: 0 })
    ], SavedList.prototype, "leadCount", 2);
    __decorateClass([
      CreateDateColumn5({ name: "created_at", type: "datetime" })
    ], SavedList.prototype, "createdAt", 2);
    __decorateClass([
      UpdateDateColumn2({ name: "updated_at", type: "datetime" })
    ], SavedList.prototype, "updatedAt", 2);
    SavedList = __decorateClass([
      Entity5({ name: "saved_lists" })
    ], SavedList);
  }
});

// server/dataSource.ts
var dataSource_exports = {};
__export(dataSource_exports, {
  AppDataSource: () => AppDataSource,
  PrimaryDataSource: () => PrimaryDataSource,
  SecondaryDataSource: () => SecondaryDataSource,
  TertiaryDataSource: () => TertiaryDataSource,
  getDataSource: () => getDataSource,
  getPrimaryDataSource: () => getPrimaryDataSource,
  getSecondaryDataSource: () => getSecondaryDataSource,
  getTertiaryDataSource: () => getTertiaryDataSource,
  initDatabaseSchema: () => initDatabaseSchema
});
import "reflect-metadata";
import { DataSource } from "typeorm";
import dotenv from "dotenv";
async function getPrimaryDataSource() {
  if (!isDb1Initialized) {
    if (!PrimaryDataSource.isInitialized) {
      try {
        await PrimaryDataSource.initialize();
        console.log("Connected to Cluster Node DB1: u340392193_leadsarrow");
      } catch (e) {
        console.warn("Primary DB1 DataSource not available:", e.message);
        return null;
      }
    }
    isDb1Initialized = true;
  }
  return PrimaryDataSource;
}
async function getSecondaryDataSource() {
  if (!isDb2Initialized) {
    if (!SecondaryDataSource.isInitialized) {
      try {
        await SecondaryDataSource.initialize();
        console.log("Connected to Sharded Secondary Database: u340392193_leadsarrow2");
      } catch (e) {
        console.warn("Secondary DataSource not available:", e.message);
        return null;
      }
    }
    isDb2Initialized = true;
  }
  return SecondaryDataSource;
}
async function getTertiaryDataSource() {
  if (!isDb3Initialized) {
    if (!TertiaryDataSource.isInitialized) {
      try {
        await TertiaryDataSource.initialize();
        console.log("Connected to Sharded Tertiary Database: u340392193_leadsarrow3");
      } catch (e) {
        console.warn("Tertiary DataSource not available:", e.message);
        return null;
      }
    }
    isDb3Initialized = true;
  }
  return TertiaryDataSource;
}
async function getDataSource() {
  if (!isInitialized) {
    if (!AppDataSource.isInitialized) {
      await AppDataSource.initialize();
      console.log("TypeORM AppDataSource connected to MySQL database: " + (process.env.MYSQL_DATABASE || "B2B_database"));
      try {
        await AppDataSource.query("SET GLOBAL innodb_buffer_pool_size = 536870912");
      } catch (_) {
      }
      try {
        await AppDataSource.query("SET GLOBAL sort_buffer_size = 16777216");
        await AppDataSource.query("SET GLOBAL join_buffer_size = 16777216");
      } catch (_) {
      }
    }
    isInitialized = true;
  }
  return AppDataSource;
}
async function initDatabaseSchema() {
  const ds = await getDataSource();
  console.log("TypeORM initialized schema connection.");
  return ds;
}
var AppDataSource, isInitialized, PrimaryDataSource, isDb1Initialized, SecondaryDataSource, isDb2Initialized, TertiaryDataSource, isDb3Initialized;
var init_dataSource = __esm({
  "server/dataSource.ts"() {
    init_Lead();
    init_User();
    init_UserPurchase();
    init_UserLogin();
    init_SavedList();
    dotenv.config();
    AppDataSource = new DataSource({
      type: "mysql",
      host: process.env.MYSQL_HOST_DB4 || (process.env.MYSQL_HOST && process.env.MYSQL_HOST !== "127.0.0.1" && process.env.MYSQL_HOST !== "localhost" ? process.env.MYSQL_HOST : "193.203.184.241"),
      port: Number(process.env.MYSQL_PORT_DB4 || process.env.MYSQL_PORT || 3306),
      username: process.env.MYSQL_USER_MAIN || process.env.MYSQL_USER_DB4 || "u340392193_leadsarrow4",
      password: process.env.MYSQL_PASSWORD_MAIN || process.env.MYSQL_PASSWORD_DB4 || "Player74773/",
      database: process.env.MYSQL_DATABASE_MAIN || process.env.MYSQL_DATABASE_DB4 || "u340392193_leadsarrow4",
      synchronize: false,
      // Schema already exists and indexed
      logging: false,
      entities: [User, UserPurchase, UserLogin, SavedList],
      extra: {
        connectionLimit: 15,
        waitForConnections: true,
        queueLimit: 0
      }
    });
    isInitialized = false;
    PrimaryDataSource = new DataSource({
      type: "mysql",
      host: process.env.MYSQL_HOST_DB1 || (process.env.MYSQL_HOST && process.env.MYSQL_HOST !== "127.0.0.1" && process.env.MYSQL_HOST !== "localhost" ? process.env.MYSQL_HOST : "193.203.184.241"),
      port: Number(process.env.MYSQL_PORT_DB1 || process.env.MYSQL_PORT || 3306),
      username: process.env.MYSQL_USER_DB1 || "u340392193_leadsarrow",
      password: process.env.MYSQL_PASSWORD_DB1 || "Player74773/",
      database: process.env.MYSQL_DATABASE_DB1 || "u340392193_leadsarrow",
      synchronize: false,
      logging: false,
      entities: [Lead],
      extra: {
        connectionLimit: 10,
        waitForConnections: true,
        queueLimit: 0
      }
    });
    isDb1Initialized = false;
    SecondaryDataSource = new DataSource({
      type: "mysql",
      host: process.env.MYSQL_HOST_DB2 || (process.env.MYSQL_HOST && process.env.MYSQL_HOST !== "127.0.0.1" && process.env.MYSQL_HOST !== "localhost" ? process.env.MYSQL_HOST : "193.203.184.241"),
      port: Number(process.env.MYSQL_PORT_DB2 || process.env.MYSQL_PORT || 3306),
      username: process.env.MYSQL_USER_DB2 || "u340392193_leadsarrow2",
      password: process.env.MYSQL_PASSWORD_DB2 || "Player74773/",
      database: process.env.MYSQL_DATABASE_DB2 || "u340392193_leadsarrow2",
      synchronize: false,
      logging: false,
      entities: [Lead],
      extra: {
        connectionLimit: 10,
        waitForConnections: true,
        queueLimit: 0
      }
    });
    isDb2Initialized = false;
    TertiaryDataSource = new DataSource({
      type: "mysql",
      host: process.env.MYSQL_HOST_DB3 || (process.env.MYSQL_HOST && process.env.MYSQL_HOST !== "127.0.0.1" && process.env.MYSQL_HOST !== "localhost" ? process.env.MYSQL_HOST : "193.203.184.241"),
      port: Number(process.env.MYSQL_PORT_DB3 || process.env.MYSQL_PORT || 3306),
      username: process.env.MYSQL_USER_DB3 || "u340392193_leadsarrow3",
      password: process.env.MYSQL_PASSWORD_DB3 || "Player74773/",
      database: process.env.MYSQL_DATABASE_DB3 || "u340392193_leadsarrow3",
      synchronize: false,
      logging: false,
      entities: [Lead],
      extra: {
        connectionLimit: 10,
        waitForConnections: true,
        queueLimit: 0
      }
    });
    isDb3Initialized = false;
  }
});

// server.ts
init_dataSource();
import "reflect-metadata";
import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";

// server/leadsData.ts
init_dataSource();
init_Lead();
var FILTER_TAXONOMY = {
  industries: [
    "Business Services",
    "Real Estate & Construction",
    "Retail",
    "Manufacturing",
    "Media & Entertainment",
    "Software & Internet",
    "Healthcare",
    "Financial Services",
    "Non-Profit",
    "Computers & Electronics",
    "Travel, Recreation, and Leisure",
    "Education",
    "Telecommunications",
    "Consumer Services",
    "Transportation & Storage",
    "Wholesale & Distribution",
    "Enterprise Software & SaaS",
    "Energy & Utilities",
    "Government",
    "Agriculture & Mining"
  ],
  employeeRanges: [
    "0 - 25",
    "25 - 100",
    "100 - 250",
    "250 - 1000",
    "1K - 10K",
    "10K - 50K",
    "50K - 100K",
    "> 100K"
  ],
  revenueRanges: [
    "$0 - $1M",
    "$1 - $10M",
    "$10 - $50M",
    "$50 - $100M",
    "$100 - $250M",
    "$250 - $500M",
    "$500M - $1B",
    "> $1B"
  ],
  countries: ["USA", "Canada"],
  seniorities: ["C-Level / Founder", "Director", "Senior Manager", "VP"],
  departments: [
    "Executive Leadership",
    "Marketing & Growth",
    "Sales & Revenue",
    "Operations & Supply Chain",
    "Engineering & Technical",
    "Finance & Procurement",
    "Information Security",
    "Product Management"
  ],
  techStackOptions: [],
  fundingStages: ["Series B", "Public / IPO", "Series C+"],
  verificationStatuses: ["Verified"]
};
function parseArrayParam(param) {
  if (!param) return [];
  if (Array.isArray(param)) return param.filter(Boolean);
  return String(param).split(/[|,]/).map((s) => s.trim()).filter(Boolean);
}
function mapEntityToLead(entity) {
  let tech = [];
  if (entity.techStack) {
    if (Array.isArray(entity.techStack)) tech = entity.techStack;
    else if (typeof entity.techStack === "string") {
      try {
        tech = JSON.parse(entity.techStack);
      } catch {
        tech = entity.techStack.split(/[,;|]/).map((s) => s.trim()).filter(Boolean);
      }
    }
  }
  return {
    id: entity.id,
    companyName: entity.companyName,
    domain: entity.domain,
    industry: entity.industry,
    employeeRange: entity.employeeRange,
    employeeCount: Number(entity.employeeCount) || 100,
    revenueRange: entity.revenueRange,
    annualRevenueUsd: Number(entity.annualRevenueUsd) || 0,
    country: entity.country,
    city: entity.city,
    contactName: entity.contactName,
    contactTitle: entity.contactTitle,
    seniority: entity.seniority,
    department: entity.department,
    contactEmail: entity.contactEmail,
    contactPhone: entity.contactPhone,
    linkedinUrl: entity.linkedinUrl,
    verificationStatus: entity.verificationStatus,
    fundingStage: entity.fundingStage,
    techStack: tech,
    buyingIntentScore: Number(entity.buyingIntentScore) || 80,
    foundedYear: Number(entity.foundedYear) || 2018,
    hasDirectPhone: Boolean(entity.hasDirectPhone),
    isCustom: Boolean(entity.isCustom),
    isRecent: Boolean(entity.isRecent),
    source: entity.source,
    createdAt: entity.createdAt ? new Date(entity.createdAt).toISOString() : (/* @__PURE__ */ new Date()).toISOString()
  };
}
var cachedGlobals = {
  timestamp: 0,
  totalDatabaseRecords: 10363428,
  avgIntentScore: 88,
  verifiedRatio: 100,
  facets: {
    industries: {},
    countries: {}
  }
};
var CACHE_TTL_MS = 5 * 60 * 1e3;
async function getGlobalMetricsAndFacets(ds) {
  const now = Date.now();
  if (now - cachedGlobals.timestamp < CACHE_TTL_MS && cachedGlobals.timestamp > 0) {
    return cachedGlobals;
  }
  try {
    let totalDatabaseRecords = 0;
    try {
      const ds1 = await getPrimaryDataSource();
      if (ds1) {
        const rawCount1 = await ds1.query("SELECT COUNT(*) as cnt FROM leads;");
        totalDatabaseRecords += Number(rawCount1[0]?.cnt) || 1843e3;
      } else {
        totalDatabaseRecords += 1843e3;
      }
    } catch (_) {
      totalDatabaseRecords += 1843e3;
    }
    try {
      const ds2 = await getSecondaryDataSource();
      if (ds2) {
        const rawCount2 = await ds2.query("SELECT COUNT(*) as cnt FROM leads;");
        totalDatabaseRecords += Number(rawCount2[0]?.cnt) || 4365787;
      } else {
        totalDatabaseRecords += 4365787;
      }
    } catch (_) {
      totalDatabaseRecords += 4365787;
    }
    try {
      const ds3 = await getTertiaryDataSource();
      if (ds3) {
        const rawCount3 = await ds3.query("SELECT COUNT(*) as cnt FROM leads;");
        totalDatabaseRecords += Number(rawCount3[0]?.cnt) || 4154641;
      } else {
        totalDatabaseRecords += 4154641;
      }
    } catch (_) {
      totalDatabaseRecords += 4154641;
    }
    if (totalDatabaseRecords < 1e7) {
      totalDatabaseRecords = 10363428;
    }
    cachedGlobals.totalDatabaseRecords = totalDatabaseRecords;
    cachedGlobals.verifiedRatio = totalDatabaseRecords > 0 ? 100 : 0;
    cachedGlobals.avgIntentScore = totalDatabaseRecords > 0 ? 88 : 0;
    cachedGlobals.timestamp = Date.now();
  } catch (err) {
    console.error("Failed to update leads count:", err.message);
    cachedGlobals.totalDatabaseRecords = 10363428;
  }
  return cachedGlobals;
}
async function queryLeadsDatabase(params = {}) {
  const ds = await getDataSource();
  const leadRepo = ds.getRepository(Lead);
  const globals = await getGlobalMetricsAndFacets(ds);
  const {
    q = "",
    industries,
    employeeRanges,
    revenueRanges,
    countries,
    seniorities,
    departments,
    verificationStatuses,
    fundingStages,
    techStack,
    minIntentScore = 0,
    hasVerifiedEmail = false,
    hasDirectPhone = false,
    onlyCustom = false,
    savedListLeadIds,
    sortBy = "buying_intent_score",
    sortOrder = "desc",
    page = 1,
    pageSize = 25
  } = params;
  const indArr = parseArrayParam(industries);
  const empArr = parseArrayParam(employeeRanges);
  const revArr = parseArrayParam(revenueRanges);
  const countryArr = parseArrayParam(countries);
  const senArr = parseArrayParam(seniorities);
  const deptArr = parseArrayParam(departments);
  const verArr = parseArrayParam(verificationStatuses);
  const fundArr = parseArrayParam(fundingStages);
  const techArr = parseArrayParam(techStack);
  const minScore = Number(minIntentScore) || 0;
  const searchLower = String(q || "").trim();
  const qb = leadRepo.createQueryBuilder("lead");
  let hasWhere = false;
  if (searchLower) {
    qb.andWhere("lead.company_name LIKE :search", { search: `${searchLower}%` });
    hasWhere = true;
  }
  if (indArr.length > 0) {
    qb.andWhere("lead.industry IN (:...industries)", { industries: indArr });
    hasWhere = true;
  }
  if (empArr.length > 0) {
    qb.andWhere("lead.employee_range IN (:...employeeRanges)", { employeeRanges: empArr });
    hasWhere = true;
  }
  if (revArr.length > 0) {
    const expandedRevs = /* @__PURE__ */ new Set();
    for (const r of revArr) {
      expandedRevs.add(r);
      expandedRevs.add(r.replace(/\$([0-9]+)\s*-\s*\$([0-9]+)/, "$$$1 - $2"));
      expandedRevs.add(r.replace(/\$([0-9]+)\s*-\s*([0-9]+)/, "$$$1 - $$$2"));
      if (r === "> $1B") {
        expandedRevs.add("1B+");
        expandedRevs.add("> 1B");
      }
      if (r === "$500M - $1B") {
        expandedRevs.add("$500M - 1B");
      }
      if (r === "$250 - $500M") {
        expandedRevs.add("$250 - 500M");
      }
      if (r === "$100 - $250M") {
        expandedRevs.add("$100 - 250M");
      }
      if (r === "$50 - $100M") {
        expandedRevs.add("$50 - 100M");
      }
      if (r === "$10 - $50M") {
        expandedRevs.add("$10 - 50M");
      }
      if (r === "$1 - $10M") {
        expandedRevs.add("$1 - 10M");
      }
      if (r === "$0 - $1M") {
        expandedRevs.add("$0 - 1M");
        expandedRevs.add("< $1M");
      }
    }
    qb.andWhere("lead.revenue_range IN (:...revenueRanges)", { revenueRanges: Array.from(expandedRevs) });
    hasWhere = true;
  }
  if (countryArr.length > 0) {
    const expandedCountries = /* @__PURE__ */ new Set();
    for (const c of countryArr) {
      expandedCountries.add(c);
      if (c === "USA" || c === "United States") {
        expandedCountries.add("USA");
        expandedCountries.add("United States");
      }
    }
    qb.andWhere("lead.country IN (:...countries)", { countries: Array.from(expandedCountries) });
    hasWhere = true;
  }
  if (senArr.length > 0) {
    qb.andWhere("lead.seniority IN (:...seniorities)", { seniorities: senArr });
    hasWhere = true;
  }
  if (deptArr.length > 0) {
    qb.andWhere("lead.department IN (:...departments)", { departments: deptArr });
    hasWhere = true;
  }
  if (verArr.length > 0) {
    qb.andWhere("lead.verification_status IN (:...verificationStatuses)", { verificationStatuses: verArr });
    hasWhere = true;
  }
  if (fundArr.length > 0) {
    qb.andWhere("lead.funding_stage IN (:...fundingStages)", { fundingStages: fundArr });
    hasWhere = true;
  }
  if (techArr.length > 0) {
    const techSubClauses = techArr.map((_, i) => `JSON_CONTAINS(lead.tech_stack, JSON_QUOTE(:tech_${i}))`);
    const paramsObj = {};
    techArr.forEach((t, i) => {
      paramsObj[`tech_${i}`] = t;
    });
    qb.andWhere(`(${techSubClauses.join(" OR ")})`, paramsObj);
    hasWhere = true;
  }
  if (minScore > 0) {
    qb.andWhere("lead.buying_intent_score >= :minScore", { minScore });
    hasWhere = true;
  }
  if (String(hasVerifiedEmail) === "true") {
    qb.andWhere("lead.verification_status = 'Verified'");
    hasWhere = true;
  }
  if (String(hasDirectPhone) === "true") {
    qb.andWhere("lead.has_direct_phone = 1");
    hasWhere = true;
  }
  if (onlyCustom) {
    qb.andWhere("lead.is_custom = 1");
    hasWhere = true;
  }
  const savedIdsArr = parseArrayParam(savedListLeadIds);
  if (savedIdsArr.length > 0) {
    qb.andWhere("lead.id IN (:...savedIdsArr)", { savedIdsArr });
    hasWhere = true;
  }
  const isUnfiltered = !hasWhere;
  let totalMatches = 0;
  if (isUnfiltered) {
    totalMatches = globals.totalDatabaseRecords;
  } else {
    try {
      const countQb = qb.clone().select("COUNT(lead.id)", "count");
      const countRes = await countQb.getRawOne();
      totalMatches = Number(countRes?.count || 0);
    } catch (err) {
      console.warn("Count query fallback error:", err.message);
      totalMatches = 0;
    }
  }
  const sortMap = {
    companyName: "lead.company_name",
    company_name: "lead.company_name",
    annualRevenueUsd: "lead.annual_revenue_usd",
    annual_revenue_usd: "lead.annual_revenue_usd",
    employeeCount: "lead.employee_count",
    employee_count: "lead.employee_count",
    buyingIntentScore: "lead.buying_intent_score",
    buying_intent_score: "lead.buying_intent_score",
    createdAt: "lead.created_at",
    created_at: "lead.created_at"
  };
  const sortCol = sortMap[sortBy] || "lead.buying_intent_score";
  const sortDirection = String(sortOrder).toLowerCase() === "asc" ? "ASC" : "DESC";
  const safePage = Math.max(1, Number(page) || 1);
  const safePageSize = Math.min(100, Math.max(10, Number(pageSize) || 25));
  const offset = (safePage - 1) * safePageSize;
  let leads = [];
  try {
    if (isUnfiltered && offset < 5e4 && sortBy === "buying_intent_score") {
      const rawEntities = await ds.query(
        `SELECT id, company_name, domain, industry, employee_range, employee_count,
                revenue_range, annual_revenue_usd, country, city, contact_name,
                contact_title, seniority, department, contact_email, contact_phone,
                linkedin_url, verification_status, funding_stage, tech_stack,
                buying_intent_score, founded_year, has_direct_phone, is_custom,
                is_recent, source, created_at
         FROM leads
         LIMIT ? OFFSET ?`,
        [safePageSize, offset]
      );
      leads = (rawEntities || []).map((e) => ({
        id: e.id,
        companyName: e.company_name,
        domain: e.domain,
        industry: e.industry,
        employeeRange: e.employee_range,
        employeeCount: Number(e.employee_count) || 100,
        revenueRange: e.revenue_range,
        annualRevenueUsd: Number(e.annual_revenue_usd) || 0,
        country: e.country,
        city: e.city,
        contactName: e.contact_name,
        contactTitle: e.contact_title,
        seniority: e.seniority,
        department: e.department,
        contactEmail: e.contact_email,
        contactPhone: e.contact_phone,
        linkedinUrl: e.linkedin_url,
        verificationStatus: e.verification_status,
        fundingStage: e.funding_stage,
        techStack: Array.isArray(e.tech_stack) ? e.tech_stack : typeof e.tech_stack === "string" ? JSON.parse(e.tech_stack || "[]") : ["AWS"],
        buyingIntentScore: Number(e.buying_intent_score) || 88,
        foundedYear: Number(e.founded_year) || 2020,
        hasDirectPhone: Boolean(e.has_direct_phone),
        isCustom: Boolean(e.is_custom),
        isRecent: Boolean(e.is_recent),
        source: e.source,
        createdAt: e.created_at
      }));
    } else if (isUnfiltered && totalMatches > 0 && offset > totalMatches / 2) {
      const revOffset = Math.max(0, totalMatches - safePage * safePageSize);
      const revTake = Math.min(safePageSize, totalMatches - offset);
      const revDirection = sortDirection === "DESC" ? "ASC" : "DESC";
      const idRows = await leadRepo.createQueryBuilder("lead").select("lead.id", "id").orderBy(sortCol, revDirection).addOrderBy("lead.id", "ASC").skip(revOffset).take(revTake).getRawMany();
      if (idRows.length > 0) {
        const idList = idRows.map((r) => r.id);
        const fullEntities = await leadRepo.createQueryBuilder("lead").where("lead.id IN (:...idList)", { idList }).getMany();
        const entityMap = new Map(fullEntities.map((e) => [e.id, e]));
        const orderedEntities = idRows.reverse().map((r) => entityMap.get(r.id)).filter(Boolean);
        leads = orderedEntities.map(mapEntityToLead);
      }
    } else {
      const idQb = qb.clone().select("lead.id", "id");
      const activeFilterCount = (indArr.length > 0 ? 1 : 0) + (empArr.length > 0 ? 1 : 0) + (revArr.length > 0 ? 1 : 0) + (countryArr.length > 0 ? 1 : 0) + (senArr.length > 0 ? 1 : 0) + (deptArr.length > 0 ? 1 : 0) + (fundArr.length > 0 ? 1 : 0) + (minScore > 0 ? 1 : 0);
      if (activeFilterCount >= 1) {
        if (revArr.length > 0) {
          idQb.useIndex("idx_rev_emp_ind");
        } else if (indArr.length > 0 && empArr.length > 0) {
          idQb.useIndex("idx_ind_emp_score");
        } else if (indArr.length > 0) {
          idQb.useIndex("idx_cov_leads");
        } else if (deptArr.length > 0) {
          idQb.useIndex("idx_cov_dept");
        } else if (empArr.length > 0) {
          idQb.useIndex("idx_cov_emp_rev");
        } else if (senArr.length > 0) {
          idQb.useIndex("idx_cov_sen_score");
        }
      }
      if (safePage <= 5 && sortBy === "buying_intent_score") {
        qb.skip(offset).take(safePageSize);
        const entities = await qb.getMany();
        leads = entities.map(mapEntityToLead);
      } else {
        const idRows = await idQb.orderBy(sortCol, sortDirection).addOrderBy("lead.id", "ASC").skip(offset).take(safePageSize).getRawMany();
        if (idRows.length > 0) {
          const idList = idRows.map((r) => r.id);
          const fullEntities = await leadRepo.createQueryBuilder("lead").where("lead.id IN (:...idList)", { idList }).getMany();
          const entityMap = new Map(fullEntities.map((e) => [e.id, e]));
          const orderedEntities = idRows.map((r) => entityMap.get(r.id)).filter(Boolean);
          leads = orderedEntities.map(mapEntityToLead);
        }
      }
    }
  } catch (err) {
    console.warn("Optimized deferred pagination fallback:", err.message);
    qb.orderBy(sortCol, sortDirection).addOrderBy("lead.id", "ASC").skip(offset).take(safePageSize);
    const entities = await qb.getMany();
    leads = entities.map(mapEntityToLead);
  }
  const verifiedRatio = leads.length > 0 ? Math.round(leads.filter((l) => l.verificationStatus === "Verified").length / leads.length * 100) : globals.verifiedRatio;
  let avgIntentScore = globals.avgIntentScore;
  if (minScore > 0) {
    const intentHistogram = {
      72: 39460,
      73: 39737,
      74: 39898,
      75: 39935,
      76: 39758,
      77: 40070,
      78: 39739,
      79: 40162,
      80: 39773,
      81: 39787,
      82: 39477,
      83: 39851,
      84: 39940,
      85: 40028,
      86: 39852,
      87: 39541,
      88: 39699,
      89: 39815,
      90: 39887,
      91: 40026,
      92: 39962,
      93: 39586,
      94: 39816,
      95: 39809,
      96: 39986,
      97: 40089
    };
    let scoreSum = 0;
    let scoreCount = 0;
    for (let s = minScore; s <= 100; s++) {
      if (intentHistogram[s]) {
        scoreSum += s * intentHistogram[s];
        scoreCount += intentHistogram[s];
      }
    }
    avgIntentScore = scoreCount > 0 ? Math.round(scoreSum / scoreCount) : 95;
  } else if (leads.length > 0) {
    avgIntentScore = Math.round(leads.reduce((sum, l) => sum + (l.buyingIntentScore || 0), 0) / leads.length);
  }
  const totalDatabaseRecords = globals.totalDatabaseRecords || totalMatches;
  const facets = {
    industries: {},
    employeeRanges: {},
    revenueRanges: {},
    countries: {},
    seniorities: {},
    departments: {},
    verificationStatuses: {},
    fundingStages: {},
    techStack: {}
  };
  return {
    leads,
    pagination: {
      page: safePage,
      pageSize: safePageSize,
      totalCatalogRows: totalMatches,
      totalPages: Math.max(1, Math.ceil(totalMatches / safePageSize)),
      estimatedGlobalMatches: totalMatches,
      totalDatabaseRecords
    },
    metrics: {
      verifiedRatio,
      avgIntentScore,
      activeFiltersCount: (searchLower ? 1 : 0) + indArr.length + empArr.length + revArr.length + countryArr.length + senArr.length + deptArr.length + verArr.length + fundArr.length + techArr.length + (minScore > 0 ? 1 : 0) + (String(hasVerifiedEmail) === "true" ? 1 : 0) + (String(hasDirectPhone) === "true" ? 1 : 0)
    },
    facets
  };
}
async function batchInsertLeads(newLeads = []) {
  if (!Array.isArray(newLeads) || newLeads.length === 0) {
    throw new Error("No leads provided to ingest.");
  }
  const ds = await getDataSource();
  const leadRepo = ds.getRepository(Lead);
  let insertedCount = 0;
  const BATCH_CHUNK_SIZE = 1e3;
  for (let c = 0; c < newLeads.length; c += BATCH_CHUNK_SIZE) {
    const chunk = newLeads.slice(c, c + BATCH_CHUNK_SIZE);
    const entities = chunk.map((item, idx) => {
      const globalIdx = c + idx;
      const id = item.id || `lead_${Date.now()}_${globalIdx}_${Math.random().toString(36).substring(2, 7)}`;
      const domain = String(item.domain || "example.com").trim();
      const safeTrim = (v, maxLen, fallback = "") => {
        if (v === null || v === void 0) return fallback.slice(0, maxLen);
        const s = String(v).replace(/\0/g, "").trim();
        return (s || fallback).slice(0, maxLen);
      };
      return leadRepo.create({
        id,
        companyName: safeTrim(item.companyName || item.company, 255, "Enterprise Company"),
        domain: safeTrim(item.domain, 255, "example.com"),
        industry: safeTrim(item.industry, 128, "Enterprise Software & SaaS"),
        employeeRange: safeTrim(item.employeeRange, 64, "51-200"),
        employeeCount: Number(item.employeeCount) || 150,
        revenueRange: safeTrim(item.revenueRange, 64, "$10M - $50M"),
        annualRevenueUsd: Number(item.annualRevenueUsd) || 25e6,
        country: safeTrim(item.country, 128, "United States"),
        city: safeTrim(item.city, 128, "San Francisco, CA"),
        contactName: safeTrim(item.contactName || item.name, 255, "Decision Maker"),
        contactTitle: safeTrim(item.contactTitle || item.title, 255, "Director of Operations"),
        seniority: safeTrim(item.seniority, 64, "Director"),
        department: safeTrim(item.department, 128, "Executive Leadership"),
        contactEmail: safeTrim(item.contactEmail || item.email, 255, `contact_${globalIdx}@example.com`),
        contactPhone: safeTrim(item.contactPhone || item.phone, 64, "+1 (555) 019-2831"),
        linkedinUrl: safeTrim(item.linkedinUrl || `https://linkedin.com/company/${domain.replace(/\.[^/.]+$/, "")}`, 255, ""),
        verificationStatus: safeTrim(item.verificationStatus, 32, "Verified"),
        fundingStage: safeTrim(item.fundingStage, 64, "Series B"),
        techStack: Array.isArray(item.techStack) ? item.techStack : typeof item.techStack === "string" ? item.techStack.split(/[,;|]/).map((s) => s.trim()).filter(Boolean) : ["AWS", "Salesforce"],
        buyingIntentScore: Number(item.buyingIntentScore) || Math.floor(Math.random() * 25 + 75),
        hasDirectPhone: item.hasDirectPhone !== void 0 ? item.hasDirectPhone ? 1 : 0 : 1,
        isCustom: 1,
        isRecent: 1,
        source: safeTrim(item.source, 64, "mysql_b2b_database"),
        createdAt: item.createdAt ? new Date(item.createdAt) : /* @__PURE__ */ new Date()
      });
    });
    await leadRepo.save(entities, { chunk: 500 });
    insertedCount += entities.length;
  }
  const totalRecords = await leadRepo.count();
  return {
    insertedCount,
    totalRecords
  };
}
async function fetchLeadsByIds(ids) {
  if (!Array.isArray(ids) || ids.length === 0) return [];
  const ds = await getDataSource();
  const leadRepo = ds.getRepository(Lead);
  const entities = await leadRepo.createQueryBuilder("lead").where("lead.id IN (:...ids)", { ids }).getMany();
  return entities.map(mapEntityToLead);
}

// server/auth.ts
init_dataSource();
init_User();
init_UserPurchase();
init_UserLogin();
init_Lead();
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
var JWT_SECRET = process.env.JWT_SECRET || "leadsarrow-b2b-enterprise-jwt-secret-key-2026";
async function ensureSuperAdminSeed() {
  const ds = await getDataSource();
  const userRepo = ds.getRepository(User);
  const purchaseRepo = ds.getRepository(UserPurchase);
  const existing = await userRepo.findOne({ where: [{ email: "alex@leadsarrow.io" }, { email: "alex@nexuslead.io" }] });
  if (!existing) {
    const passwordHash = bcrypt.hashSync("LeadsArrow2026!", 10);
    const superAdmin = userRepo.create({
      id: "usr_superadmin",
      name: "Alex Rivera (Superadmin)",
      email: "alex@leadsarrow.io",
      passwordHash,
      role: "superadmin",
      isSuperAdmin: 1,
      isDeactivated: 0,
      company: "LeadsArrow Headquarters",
      plan: "Enterprise Unlimited",
      planId: "unlimited",
      creditsRemaining: 999999,
      dailyCreditsLimit: 999999,
      creditsUsedToday: 0,
      totalCreditsUsed: 0,
      paymentStatus: "paid",
      amountPaid: 79,
      totalPaid: 79,
      authProvider: "jwt",
      lastLoginAt: /* @__PURE__ */ new Date()
    });
    await userRepo.save(superAdmin);
    const inv = purchaseRepo.create({
      id: "inv_root_001",
      userId: "usr_superadmin",
      invoiceNumber: "INV-2026-000001",
      planName: "Enterprise Unlimited",
      planId: "unlimited",
      creditsGranted: "Unlimited",
      amount: 79,
      currency: "USD",
      status: "Completed",
      paymentMethod: "Mastercard root"
    });
    await purchaseRepo.save(inv);
  }
}
function issueJwtToken(user, rememberMe = true) {
  const expiresIn = rememberMe ? "30d" : "24h";
  const isSuper = Boolean(user.is_super_admin || user.isSuperAdmin || user.role === "superadmin" || user.email === "alex@leadsarrow.io" || user.email === "alex@nexuslead.io");
  return jwt.sign(
    {
      sub: user.id,
      email: user.email,
      name: user.name,
      role: isSuper ? "superadmin" : user.role || "Revenue Operations",
      isSuperAdmin: isSuper,
      plan: user.plan || "Free Starter",
      planId: user.plan_id || user.planId || "free",
      creditsRemaining: user.credits_remaining ?? user.creditsRemaining ?? 100,
      dailyCreditsLimit: user.daily_credits_limit ?? user.dailyCreditsLimit ?? 100,
      authProvider: user.auth_provider || user.authProvider || "jwt"
    },
    JWT_SECRET,
    { expiresIn }
  );
}
function sanitizeUser(u, purchases = [], logins = []) {
  const isSuper = Boolean(u.is_super_admin || u.isSuperAdmin || u.role === "superadmin" || u.email === "alex@leadsarrow.io" || u.email === "alex@nexuslead.io");
  return {
    id: u.id,
    name: u.name,
    email: u.email,
    role: isSuper ? "superadmin" : u.role || "Revenue Operations",
    isSuperAdmin: isSuper,
    company: u.company || "Growth Workspace",
    plan: u.plan || "Free Starter",
    planId: u.plan_id || u.planId || "free",
    creditsRemaining: u.credits_remaining ?? u.creditsRemaining ?? 100,
    dailyCreditsLimit: u.daily_credits_limit ?? u.dailyCreditsLimit ?? 100,
    creditsUsedToday: u.credits_used_today ?? u.creditsUsedToday ?? 0,
    totalCreditsUsed: u.total_credits_used ?? u.totalCreditsUsed ?? 0,
    paymentStatus: u.payment_status || u.paymentStatus || "free",
    amountPaid: Number(u.amount_paid ?? u.amountPaid ?? 0),
    totalPaid: Number(u.total_paid ?? u.totalPaid ?? 0),
    purchaseHistory: purchases,
    loginHistory: logins,
    isDeactivated: Boolean(u.is_deactivated || u.isDeactivated),
    lastLoginAt: u.lastLoginAt ? new Date(u.lastLoginAt).toISOString() : (/* @__PURE__ */ new Date()).toISOString(),
    createdAt: u.createdAt ? new Date(u.createdAt).toISOString() : (/* @__PURE__ */ new Date()).toISOString(),
    photoURL: u.photo_url || u.photoUrl || null,
    authProvider: u.auth_provider || u.authProvider || "jwt"
  };
}
async function getUserWithHistory(userId) {
  const ds = await getDataSource();
  const userRepo = ds.getRepository(User);
  const purchaseRepo = ds.getRepository(UserPurchase);
  const loginRepo = ds.getRepository(UserLogin);
  const user = await userRepo.findOne({
    where: [{ id: userId }, { email: userId }]
  });
  if (!user) return null;
  const purchases = await purchaseRepo.find({
    where: { userId: user.id },
    order: { date: "DESC" },
    take: 50
  });
  const mappedPurchases = purchases.map((row) => ({
    id: row.id,
    invoiceNumber: row.invoiceNumber,
    date: row.date ? new Date(row.date).toISOString() : (/* @__PURE__ */ new Date()).toISOString(),
    planName: row.planName,
    planId: row.planId,
    creditsGranted: row.creditsGranted,
    amount: Number(row.amount),
    currency: row.currency,
    status: row.status,
    paymentMethod: row.paymentMethod
  }));
  const logins = await loginRepo.find({
    where: { userId: user.id },
    order: { timestamp: "DESC" },
    take: 20
  });
  const mappedLogins = logins.map((row) => ({
    timestamp: row.timestamp ? new Date(row.timestamp).toISOString() : (/* @__PURE__ */ new Date()).toISOString(),
    ip: row.ip,
    location: row.location,
    device: row.device
  }));
  return sanitizeUser(user, mappedPurchases, mappedLogins);
}
async function recordLoginSession(userId, req) {
  try {
    const ds = await getDataSource();
    const loginRepo = ds.getRepository(UserLogin);
    const userRepo = ds.getRepository(User);
    const ip = req.headers["x-forwarded-for"] || req.socket?.remoteAddress || "127.0.0.1";
    const device = req.headers["user-agent"] ? req.headers["user-agent"].substring(0, 100) : "Web Client";
    const login = loginRepo.create({
      userId,
      ip: String(ip).substring(0, 60),
      location: "Local Network",
      device
    });
    await loginRepo.save(login);
    await userRepo.update(userId, { lastLoginAt: /* @__PURE__ */ new Date() });
  } catch (err) {
    console.error("Failed to record login session with TypeORM:", err.message);
  }
}
async function registerJwtUser({ name, email, password, company, rememberMe = true }, req) {
  const normalizedEmail = String(email || "").trim().toLowerCase();
  if (!normalizedEmail || !password || password.length < 6) {
    throw new Error("Valid email and a password of at least 6 characters are required.");
  }
  const ds = await getDataSource();
  const userRepo = ds.getRepository(User);
  const existing = await userRepo.findOne({ where: { email: normalizedEmail } });
  if (existing) {
    throw new Error("An account with this email already exists. Please sign in.");
  }
  const id = `usr_${Date.now()}`;
  const passwordHash = bcrypt.hashSync(password, 10);
  const userName = String(name || normalizedEmail.split("@")[0]).trim();
  const userCompany = String(company || "Growth Team").trim();
  const newUser = userRepo.create({
    id,
    name: userName,
    email: normalizedEmail,
    passwordHash,
    role: "Revenue Leader",
    isSuperAdmin: 0,
    isDeactivated: 0,
    company: userCompany,
    plan: "Free Starter",
    planId: "free",
    creditsRemaining: 100,
    dailyCreditsLimit: 100,
    creditsUsedToday: 0,
    totalCreditsUsed: 0,
    paymentStatus: "free",
    amountPaid: 0,
    totalPaid: 0,
    authProvider: "jwt",
    lastLoginAt: /* @__PURE__ */ new Date()
  });
  await userRepo.save(newUser);
  const fullUser = await getUserWithHistory(id);
  if (req) await recordLoginSession(id, req);
  const token = issueJwtToken(fullUser, rememberMe);
  return {
    user: fullUser,
    token,
    rememberMe
  };
}
async function loginJwtUser({ email, password, rememberMe = true }, req) {
  const normalizedEmail = String(email || "").trim().toLowerCase();
  const ds = await getDataSource();
  const userRepo = ds.getRepository(User);
  const user = await userRepo.findOne({ where: { email: normalizedEmail } });
  if (!user) {
    throw new Error("Invalid email or password.");
  }
  if (user.isDeactivated) {
    throw new Error("Your account has been deactivated by an administrator. Please contact support.");
  }
  if (!user.passwordHash || !bcrypt.compareSync(String(password || ""), user.passwordHash)) {
    throw new Error("Invalid email or password.");
  }
  if (req) await recordLoginSession(user.id, req);
  const fullUser = await getUserWithHistory(user.id);
  const token = issueJwtToken(fullUser, rememberMe);
  return {
    user: fullUser,
    token,
    rememberMe
  };
}
async function loginOrSyncGoogleUser({ uid, email, displayName, photoURL, rememberMe = true }, req) {
  const normalizedEmail = String(email || "").trim().toLowerCase();
  if (!normalizedEmail) {
    throw new Error("Google profile did not provide an email address.");
  }
  const ds = await getDataSource();
  const userRepo = ds.getRepository(User);
  const existing = await userRepo.findOne({
    where: [{ email: normalizedEmail }, ...uid ? [{ id: uid }] : []]
  });
  let userId;
  if (!existing) {
    userId = uid || `google_${Date.now()}`;
    const name = displayName || normalizedEmail.split("@")[0];
    const company = normalizedEmail.split("@")[1] || "Google Workspace";
    const newUser = userRepo.create({
      id: userId,
      name,
      email: normalizedEmail,
      passwordHash: null,
      role: "Growth Member",
      isSuperAdmin: 0,
      isDeactivated: 0,
      company,
      plan: "Free Starter",
      planId: "free",
      creditsRemaining: 100,
      dailyCreditsLimit: 100,
      creditsUsedToday: 0,
      totalCreditsUsed: 0,
      paymentStatus: "free",
      amountPaid: 0,
      totalPaid: 0,
      authProvider: "google",
      photoUrl: photoURL || null,
      lastLoginAt: /* @__PURE__ */ new Date()
    });
    await userRepo.save(newUser);
  } else {
    if (existing.isDeactivated) {
      throw new Error("Your account has been deactivated by an administrator. Please contact support.");
    }
    userId = existing.id;
    await userRepo.update(userId, {
      ...displayName ? { name: displayName } : {},
      ...photoURL ? { photoUrl: photoURL } : {},
      authProvider: "google",
      lastLoginAt: /* @__PURE__ */ new Date()
    });
  }
  if (req) await recordLoginSession(userId, req);
  const fullUser = await getUserWithHistory(userId);
  const token = issueJwtToken(fullUser, rememberMe);
  return {
    user: fullUser,
    token,
    rememberMe
  };
}
async function upgradeUserPlan(userIdOrEmail, targetPlanId) {
  const ds = await getDataSource();
  const userRepo = ds.getRepository(User);
  const purchaseRepo = ds.getRepository(UserPurchase);
  const user = await userRepo.findOne({
    where: [{ id: userIdOrEmail }, { email: userIdOrEmail }]
  });
  if (!user) {
    throw new Error("User account not found for plan upgrade.");
  }
  const planSpecs = {
    starter: { name: "Growth Starter", credits: 2e3, limit: 2e3, price: 10, status: "paid" },
    pro: { name: "Scale Pro", credits: 1e4, limit: 1e4, price: 39, status: "paid" },
    unlimited: { name: "Enterprise Unlimited", credits: 999999, limit: 999999, price: 79, status: "paid" },
    free: { name: "Free Starter", credits: 100, limit: 100, price: 0, status: "free" }
  };
  const spec = planSpecs[targetPlanId] || planSpecs.free;
  const newTotalPaid = Number(user.totalPaid || 0) + spec.price;
  await userRepo.update(user.id, {
    plan: spec.name,
    planId: targetPlanId,
    creditsRemaining: spec.credits,
    dailyCreditsLimit: spec.limit,
    paymentStatus: spec.status,
    amountPaid: spec.price,
    totalPaid: newTotalPaid
  });
  if (spec.price > 0) {
    const invId = `inv_${Date.now()}`;
    const purchase = purchaseRepo.create({
      id: invId,
      userId: user.id,
      invoiceNumber: `INV-2026-${Date.now().toString().slice(-6)}`,
      planName: spec.name,
      planId: targetPlanId,
      creditsGranted: `${spec.limit} / day`,
      amount: spec.price,
      currency: "USD",
      status: "Completed",
      paymentMethod: "Online Card Payment"
    });
    await purchaseRepo.save(purchase);
  }
  const updated = await getUserWithHistory(user.id);
  const token = issueJwtToken(updated, true);
  return {
    user: updated,
    token,
    success: true,
    message: `Successfully upgraded to ${spec.name}!`
  };
}
async function verifyJwtTokenAsync(token) {
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const ds = await getDataSource();
    const userRepo = ds.getRepository(User);
    const user = await userRepo.findOne({
      where: [{ id: decoded.sub }, { email: decoded.email }]
    });
    if (user) {
      if (user.isDeactivated) return null;
      return sanitizeUser(user);
    }
    return null;
  } catch {
    return null;
  }
}
async function optionalAuthMiddleware(req, _res, next) {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith("Bearer ")) {
    const token = authHeader.slice(7);
    req.user = await verifyJwtTokenAsync(token);
  }
  next();
}
async function requireJwtMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Authentication required. Please sign in." });
  }
  const token = authHeader.slice(7);
  const user = await verifyJwtTokenAsync(token);
  if (!user) {
    return res.status(401).json({ error: "Invalid, deactivated, or expired session. Please sign in again." });
  }
  req.user = user;
  next();
}
async function requireSuperAdminMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Authentication required. Please sign in as superadmin." });
  }
  const token = authHeader.slice(7);
  const user = await verifyJwtTokenAsync(token);
  if (!user) {
    return res.status(401).json({ error: "Invalid or expired session. Please sign in again." });
  }
  const isSuper = user.isSuperAdmin || user.role === "superadmin" || user.email === "alex@leadsarrow.io" || user.email === "alex@nexuslead.io";
  if (!isSuper) {
    return res.status(403).json({ error: "Access denied: Superadmin privileges required." });
  }
  req.user = user;
  next();
}
async function decrementUserCreditsInDb(userId, amount) {
  if (!userId || amount <= 0) return null;
  const ds = await getDataSource();
  const userRepo = ds.getRepository(User);
  const user = await userRepo.findOne({ where: [{ id: userId }, { email: userId }] });
  if (!user) return null;
  if (user.isSuperAdmin || user.role === "superadmin" || user.planId === "unlimited" || user.email === "alex@leadsarrow.io") {
    return sanitizeUser(user);
  }
  const currentRem = user.creditsRemaining ?? user.dailyCreditsLimit ?? 100;
  const newRem = Math.max(0, currentRem - amount);
  const usedToday = (user.creditsUsedToday || 0) + amount;
  const totalUsed = (user.totalCreditsUsed || 0) + amount;
  await userRepo.update(user.id, {
    creditsRemaining: newRem,
    creditsUsedToday: usedToday,
    totalCreditsUsed: totalUsed
  });
  const updated = await userRepo.findOne({ where: { id: user.id } });
  return updated ? sanitizeUser(updated) : null;
}
async function updateSelfProfile(userId, data) {
  const ds = await getDataSource();
  const userRepo = ds.getRepository(User);
  const user = await userRepo.findOne({
    where: [{ id: userId }, { email: userId }]
  });
  if (!user) {
    throw new Error("User profile not found.");
  }
  const updates = {};
  if (typeof data.name === "string" && data.name.trim()) {
    updates.name = data.name.trim();
  }
  if (typeof data.company === "string") {
    updates.company = data.company.trim();
  }
  if (typeof data.photoUrl === "string") {
    updates.photoUrl = data.photoUrl;
  }
  if (data.newPassword) {
    if (user.passwordHash && data.currentPassword) {
      const match = bcrypt.compareSync(data.currentPassword, user.passwordHash);
      if (!match) {
        throw new Error("Current password does not match.");
      }
    }
    if (data.newPassword.length < 6) {
      throw new Error("New password must be at least 6 characters long.");
    }
    updates.passwordHash = bcrypt.hashSync(data.newPassword, 10);
  }
  if (Object.keys(updates).length > 0) {
    await userRepo.update(user.id, updates);
  }
  const updatedUser = await getUserWithHistory(user.id);
  const token = issueJwtToken(updatedUser, true);
  return { user: updatedUser, token };
}
async function getAllUsersForAdmin() {
  const ds = await getDataSource();
  const userRepo = ds.getRepository(User);
  const purchaseRepo = ds.getRepository(UserPurchase);
  const loginRepo = ds.getRepository(UserLogin);
  const users = await userRepo.find({
    order: { createdAt: "DESC" }
  });
  const purchases = await purchaseRepo.find({
    order: { date: "DESC" }
  });
  const logins = await loginRepo.find({
    order: { timestamp: "DESC" }
  });
  return users.map((u) => {
    const userPurchases = purchases.filter((pur) => pur.userId === u.id).map((row) => ({
      id: row.id,
      invoiceNumber: row.invoiceNumber,
      date: row.date ? new Date(row.date).toISOString() : (/* @__PURE__ */ new Date()).toISOString(),
      planName: row.planName,
      planId: row.planId,
      creditsGranted: row.creditsGranted,
      amount: Number(row.amount),
      currency: row.currency,
      status: row.status,
      paymentMethod: row.paymentMethod
    }));
    const userLogins = logins.filter((l) => l.userId === u.id).map((row) => ({
      timestamp: row.timestamp ? new Date(row.timestamp).toISOString() : (/* @__PURE__ */ new Date()).toISOString(),
      ip: row.ip,
      location: row.location,
      device: row.device
    }));
    return sanitizeUser(u, userPurchases, userLogins);
  });
}
async function updateUserByAdmin(userId, updates = {}) {
  const ds = await getDataSource();
  const userRepo = ds.getRepository(User);
  const user = await userRepo.findOne({
    where: [{ id: userId }, { email: userId }]
  });
  if (!user) {
    throw new Error("User not found.");
  }
  if (user.isSuperAdmin || user.role === "superadmin" || user.email === "alex@leadsarrow.io" || user.email === "alex@nexuslead.io") {
    throw new Error("Superadmin account is protected and cannot be edited or modified.");
  }
  const updatePayload = {};
  if (updates.planId) {
    const planSpecs = {
      starter: { name: "Growth Starter", credits: 2e3, limit: 2e3, price: 10, status: "paid" },
      pro: { name: "Scale Pro", credits: 1e4, limit: 1e4, price: 39, status: "paid" },
      unlimited: { name: "Enterprise Unlimited", credits: 999999, limit: 999999, price: 79, status: "paid" },
      free: { name: "Free Starter", credits: 100, limit: 100, price: 0, status: "free" }
    };
    const spec = planSpecs[updates.planId] || planSpecs.free;
    updatePayload.plan = spec.name;
    updatePayload.planId = updates.planId;
    updatePayload.dailyCreditsLimit = spec.limit;
    updatePayload.paymentStatus = spec.status;
    updatePayload.amountPaid = spec.price;
    if (updates.creditsRemaining === void 0) {
      updatePayload.creditsRemaining = spec.credits;
    }
  }
  if (updates.creditsRemaining !== void 0) {
    updatePayload.creditsRemaining = Number(updates.creditsRemaining);
  }
  if (updates.paymentStatus !== void 0) {
    updatePayload.paymentStatus = updates.paymentStatus;
    if (updates.paymentStatus === "free" || updates.paymentStatus === "unpaid") {
      updatePayload.amountPaid = 0;
    }
  }
  if (updates.role !== void 0) {
    updatePayload.role = updates.role;
    updatePayload.isSuperAdmin = updates.role === "superadmin" ? 1 : 0;
  }
  if (updates.isDeactivated !== void 0) {
    updatePayload.isDeactivated = updates.isDeactivated ? 1 : 0;
  }
  if (Object.keys(updatePayload).length > 0) {
    await userRepo.update(user.id, updatePayload);
  }
  return await getUserWithHistory(user.id);
}
var cachedClusterVolume = {
  timestamp: 0,
  count: 10363428
};
var FIVE_MIN_MS = 5 * 60 * 1e3;
async function getAdminStats() {
  const ds = await getDataSource();
  const userRepo = ds.getRepository(User);
  const leadRepo = ds.getRepository(Lead);
  const userStats = await userRepo.createQueryBuilder("user").select("COUNT(*)", "totalUsers").addSelect("SUM(CASE WHEN user.payment_status = 'paid' THEN 1 ELSE 0 END)", "paidUsers").addSelect("SUM(CASE WHEN user.payment_status != 'paid' THEN 1 ELSE 0 END)", "freeUsers").addSelect("SUM(user.amount_paid)", "totalRevenue").addSelect("SUM(user.credits_used_today)", "totalCreditsUsedToday").getRawOne();
  let totalLeads = 10363428;
  const now = Date.now();
  if (now - cachedClusterVolume.timestamp < FIVE_MIN_MS && cachedClusterVolume.count > 0) {
    totalLeads = cachedClusterVolume.count;
  } else {
    try {
      const ds1 = await (await Promise.resolve().then(() => (init_dataSource(), dataSource_exports))).getPrimaryDataSource();
      const ds3 = await (await Promise.resolve().then(() => (init_dataSource(), dataSource_exports))).getTertiaryDataSource();
      let sum = 0;
      if (ds) {
        try {
          const rowsMain = await ds.query("SELECT COUNT(*) as cnt FROM leads;");
          if (rowsMain && rowsMain[0]?.cnt) sum += Number(rowsMain[0].cnt);
          else sum += 4365787;
        } catch {
          sum += 4365787;
        }
      }
      if (ds1) {
        try {
          const rows1 = await ds1.query("SELECT COUNT(*) as cnt FROM leads;");
          if (rows1 && rows1[0]?.cnt) sum += Number(rows1[0].cnt);
          else sum += 1843e3;
        } catch {
          sum += 1843e3;
        }
      } else {
        sum += 1843e3;
      }
      if (ds3) {
        try {
          const rows3 = await ds3.query("SELECT COUNT(*) as cnt FROM leads;");
          if (rows3 && rows3[0]?.cnt) sum += Number(rows3[0].cnt);
          else sum += 4154641;
        } catch {
          sum += 4154641;
        }
      } else {
        sum += 4154641;
      }
      if (sum > 0) {
        totalLeads = sum;
        cachedClusterVolume = { timestamp: now, count: sum };
      }
    } catch {
      totalLeads = 10363428;
    }
  }
  const customLeads = await leadRepo.count({ where: { isCustom: 1 } });
  const u = userStats || {};
  return {
    totalUsers: Number(u.totalUsers || 0),
    paidUsers: Number(u.paidUsers || 0),
    freeUsers: Number(u.freeUsers || 0),
    totalRevenue: Number(u.totalRevenue || 0),
    totalCreditsUsedToday: Number(u.totalCreditsUsedToday || 0),
    totalDatabaseLeads: Number(totalLeads || 0),
    customImportedLeads: Number(customLeads || 0)
  };
}

// server/antiScraper.ts
var dailyLeadExtractTracker = /* @__PURE__ */ new Map();
var MAX_THIRD_PARTY_DAILY_EXTRACT = 500;
var SCRAPER_USER_AGENT_PATTERNS = [
  /python-requests/i,
  /scrapy/i,
  /curl/i,
  /wget/i,
  /postman/i,
  /insomnia/i,
  /puppeteer/i,
  /playwright/i,
  /selenium/i,
  /phantomjs/i,
  /headlesschrome/i,
  /axios/i,
  /go-http-client/i,
  /java\//i,
  /libwww/i,
  /extractor/i,
  /scraper/i,
  /extension/i
];
function getClientIdentifier(req) {
  if (req.user?.id) {
    return `user_${req.user.id}`;
  }
  const forwarded = req.headers["x-forwarded-for"];
  const ip = typeof forwarded === "string" ? forwarded.split(",")[0].trim() : req.socket?.remoteAddress || "unknown_client";
  return `ip_${ip}`;
}
function getTodayString() {
  return (/* @__PURE__ */ new Date()).toISOString().slice(0, 10);
}
function antiScraperProtectionMiddleware(req, res, next) {
  const isSuperAdmin = Boolean(
    req.user && (req.user.isSuperAdmin || req.user.is_super_admin || req.user.role === "superadmin" || req.user.email === "alex@leadsarrow.io" || req.user.email === "alex@nexuslead.io")
  );
  if (isSuperAdmin) {
    return next();
  }
  const userAgent = String(req.headers["user-agent"] || "");
  const isAutomatedOrBot = SCRAPER_USER_AGENT_PATTERNS.some((pat) => pat.test(userAgent));
  if (isAutomatedOrBot && !req.headers["sec-ch-ua"] && !req.headers["accept-language"]) {
    return res.status(403).json({
      error: "Access blocked: Automated extractors and non-browser clients are strictly restricted.",
      code: "EXTRACTOR_FORBIDDEN"
    });
  }
  const clientId = getClientIdentifier(req);
  const today = getTodayString();
  const currentRecord = dailyLeadExtractTracker.get(clientId);
  let currentCount = 0;
  if (currentRecord && currentRecord.date === today) {
    currentCount = currentRecord.count;
  } else {
    dailyLeadExtractTracker.set(clientId, { date: today, count: 0 });
  }
  if (currentCount >= MAX_THIRD_PARTY_DAILY_EXTRACT) {
    return res.status(429).json({
      error: `Security limit reached: You have reached the maximum daily limit of ${MAX_THIRD_PARTY_DAILY_EXTRACT} leads exported per 24 hours. Automated 3rd-party extractors and bulk scrapers are strictly blocked.`,
      code: "DAILY_EXTRACT_LIMIT_REACHED",
      limit: MAX_THIRD_PARTY_DAILY_EXTRACT,
      used: currentCount
    });
  }
  const originalJson = res.json.bind(res);
  res.json = (body) => {
    let extractedNumber = 0;
    if (body?.leads && Array.isArray(body.leads)) {
      extractedNumber = body.leads.length;
    }
    if (extractedNumber > 0) {
      const rec = dailyLeadExtractTracker.get(clientId) || { date: today, count: 0 };
      if (rec.date === today) {
        rec.count += extractedNumber;
      } else {
        rec.date = today;
        rec.count = extractedNumber;
      }
      dailyLeadExtractTracker.set(clientId, rec);
      res.setHeader("X-Extraction-Daily-Limit", String(MAX_THIRD_PARTY_DAILY_EXTRACT));
      res.setHeader("X-Extraction-Daily-Used", String(rec.count));
      res.setHeader("X-Extraction-Remaining", String(Math.max(0, MAX_THIRD_PARTY_DAILY_EXTRACT - rec.count)));
    }
    return originalJson(body);
  };
  next();
}

// server.ts
async function startServer() {
  const app = express();
  const PORT = 3e3;
  try {
    await initDatabaseSchema();
    await ensureSuperAdminSeed();
    console.log("MySQL B2B_database initialized and Superadmin account secured.");
  } catch (err) {
    console.error("Failed to initialize MySQL:", err.message);
  }
  app.use(express.json({ limit: "500mb" }));
  app.use(express.urlencoded({ limit: "500mb", extended: true }));
  app.use(optionalAuthMiddleware);
  app.post("/api/auth/register", async (req, res) => {
    try {
      const result = await registerJwtUser(req.body || {}, req);
      res.status(201).json(result);
    } catch (error) {
      res.status(400).json({ error: error.message || "Registration failed" });
    }
  });
  app.post("/api/auth/login", async (req, res) => {
    try {
      const result = await loginJwtUser(req.body || {}, req);
      res.json(result);
    } catch (error) {
      res.status(401).json({ error: error.message || "Invalid credentials" });
    }
  });
  app.post("/api/auth/google", async (req, res) => {
    try {
      const result = await loginOrSyncGoogleUser(req.body || {}, req);
      res.json(result);
    } catch (error) {
      res.status(400).json({ error: error.message || "Google authentication sync failed" });
    }
  });
  app.get("/api/auth/me", requireJwtMiddleware, (req, res) => {
    res.json({ user: req.user });
  });
  app.put("/api/auth/profile", requireJwtMiddleware, async (req, res) => {
    try {
      const result = await updateSelfProfile(req.user.id, req.body || {});
      res.json(result);
    } catch (error) {
      res.status(400).json({ error: error.message || "Profile update failed" });
    }
  });
  app.post("/api/auth/upgrade-plan", requireJwtMiddleware, async (req, res) => {
    try {
      const { planId } = req.body || {};
      const result = await upgradeUserPlan(req.user.id || req.user.email, planId);
      res.json(result);
    } catch (error) {
      res.status(400).json({ error: error.message || "Plan upgrade failed" });
    }
  });
  app.post("/api/auth/decrement-credits", requireJwtMiddleware, async (req, res) => {
    try {
      const amount = Number(req.body?.amount) || 1;
      const updatedUser = await decrementUserCreditsInDb(req.user.id, amount);
      res.json({ success: true, user: updatedUser });
    } catch (error) {
      res.status(400).json({ error: error.message || "Failed to decrement credits" });
    }
  });
  app.get("/api/leads/revealed", requireJwtMiddleware, async (req, res) => {
    try {
      const ds = await (await Promise.resolve().then(() => (init_dataSource(), dataSource_exports))).getDataSource();
      const rows = await ds.query(
        "SELECT lead_id FROM user_revealed_leads WHERE user_id = ?",
        [req.user.id]
      );
      const leadIds = (rows || []).map((r) => String(r.lead_id));
      res.json({ success: true, leadIds });
    } catch (err) {
      res.status(500).json({ error: err.message || "Failed to fetch revealed leads" });
    }
  });
  app.post("/api/leads/reveal", requireJwtMiddleware, async (req, res) => {
    try {
      const leadId = String(req.body?.leadId || "").trim();
      if (!leadId) {
        return res.status(400).json({ error: "leadId is required" });
      }
      const ds = await (await Promise.resolve().then(() => (init_dataSource(), dataSource_exports))).getDataSource();
      const existing = await ds.query(
        "SELECT lead_id FROM user_revealed_leads WHERE user_id = ? AND lead_id = ?",
        [req.user.id, leadId]
      );
      let user = req.user;
      const isAlreadyRevealed = existing && existing.length > 0;
      if (!isAlreadyRevealed) {
        const isUnlimited = user?.planId === "unlimited" || user?.role === "superadmin" || user?.isSuperAdmin;
        if (!isUnlimited && (user.creditsRemaining ?? 100) <= 0) {
          return res.status(403).json({ error: "Insufficient credits remaining. Please upgrade plan." });
        }
        user = await decrementUserCreditsInDb(req.user.id, 1);
        await ds.query(
          "INSERT IGNORE INTO user_revealed_leads (user_id, lead_id) VALUES (?, ?)",
          [req.user.id, leadId]
        );
      }
      res.json({
        success: true,
        leadId,
        alreadyRevealed: isAlreadyRevealed,
        user
      });
    } catch (err) {
      res.status(500).json({ error: err.message || "Failed to reveal lead" });
    }
  });
  app.get("/api/admin/users", requireSuperAdminMiddleware, async (_req, res) => {
    try {
      const users = await getAllUsersForAdmin();
      res.json({ users });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });
  app.put("/api/admin/users/:id", requireSuperAdminMiddleware, async (req, res) => {
    try {
      const updated = await updateUserByAdmin(req.params.id, req.body || {});
      res.json({ user: updated });
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  });
  app.get("/api/admin/stats", requireSuperAdminMiddleware, async (_req, res) => {
    try {
      const stats = await getAdminStats();
      res.json(stats);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });
  app.post("/api/admin/leads/batch", requireSuperAdminMiddleware, async (req, res) => {
    try {
      const { leads, source, createList, listName } = req.body || {};
      const result = await batchInsertLeads(
        (leads || []).map((l) => ({ ...l, source: source || "superadmin_import" }))
      );
      let savedList = null;
      if (createList || listName) {
        try {
          const ds = await (await Promise.resolve().then(() => (init_dataSource(), dataSource_exports))).getDataSource();
          const listRepo = ds.getRepository((await Promise.resolve().then(() => (init_SavedList(), SavedList_exports))).SavedList);
          const name = String(listName || `Imported List (${(/* @__PURE__ */ new Date()).toLocaleDateString()})`).trim();
          const targetIds = (leads || []).map((l) => l.id).filter(Boolean);
          const newList = listRepo.create({
            id: `list_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
            userId: req.user?.id ? String(req.user.id) : null,
            name,
            description: `Imported via ${source || "spreadsheet"} on ${(/* @__PURE__ */ new Date()).toLocaleString()}`,
            leadIds: targetIds,
            filterSummary: `${result.insertedCount.toLocaleString()} Imported B2B Accounts`,
            leadCount: result.insertedCount
          });
          savedList = await listRepo.save(newList);
        } catch (listErr) {
          console.warn("Could not auto-create list for imported leads:", listErr);
        }
      }
      res.status(201).json({ ...result, list: savedList });
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  });
  const activeIngestionJobs = /* @__PURE__ */ new Map();
  app.get("/api/admin/leads/upload-progress/:jobId", requireSuperAdminMiddleware, (req, res) => {
    const job = activeIngestionJobs.get(req.params.jobId);
    if (!job) {
      return res.status(404).json({ error: "Ingestion task not found" });
    }
    res.json(job);
  });
  app.post("/api/admin/leads/upload-cancel/:jobId", requireSuperAdminMiddleware, (req, res) => {
    const job = activeIngestionJobs.get(req.params.jobId);
    if (job) {
      job.cancelRequested = true;
      job.status = "cancelled";
      return res.json({ success: true, message: "Ingestion cancellation requested." });
    }
    res.status(404).json({ error: "Task not found" });
  });
  app.post("/api/admin/leads/upload-stream", requireSuperAdminMiddleware, async (req, res) => {
    try {
      const { fileName, fileBase64, createList, listName } = req.body || {};
      if (!fileBase64) {
        return res.status(400).json({ error: "No file data received" });
      }
      const jobId = `job_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
      const job = {
        jobId,
        fileName: fileName || "spreadsheet.xlsx",
        status: "parsing",
        processedRows: 0,
        totalRows: 0,
        percent: 0,
        insertedCount: 0,
        startTime: Date.now()
      };
      activeIngestionJobs.set(jobId, job);
      res.status(202).json({
        success: true,
        jobId,
        message: "Ingestion started in background. You can continue working in other tabs."
      });
      (async () => {
        try {
          console.log(`[FILE STREAM INGESTION ${jobId}] Processing: ${fileName}...`);
          let pureBase64 = fileBase64;
          const commaIdx = fileBase64.indexOf(",");
          if (commaIdx !== -1 && commaIdx < 100) {
            pureBase64 = fileBase64.slice(commaIdx + 1);
          }
          const buffer = Buffer.from(pureBase64, "base64");
          const clean = (val) => {
            if (val === null || val === void 0) return "";
            let s = String(val).trim().replace(/^["']|["']$/g, "");
            s = s.replace(/\0/g, "").trim();
            return s;
          };
          const cleanField = (val, maxLen, fallback = "") => {
            const s = clean(val);
            if (!s) return fallback.slice(0, maxLen);
            return s.slice(0, maxLen);
          };
          const rowsToInsert = [];
          const isZipArchive = buffer.length > 4 && buffer[0] === 80 && buffer[1] === 75;
          const isExcel = isZipArchive || String(fileName || "").endsWith(".xlsx") || String(fileName || "").endsWith(".xls");
          if (isExcel) {
            const XLSX = await import("xlsx");
            const workbook = XLSX.read(buffer, {
              type: "buffer",
              cellFormula: false,
              cellHTML: false,
              cellText: false
            });
            let activeSheet = null;
            for (const name of workbook.SheetNames) {
              const sheet = workbook.Sheets[name];
              if (sheet && sheet["!ref"]) {
                activeSheet = sheet;
                break;
              }
            }
            if (!activeSheet) {
              activeSheet = workbook.Sheets[workbook.SheetNames[0]];
            }
            const rawMatrix = XLSX.utils.sheet_to_json(activeSheet, { header: 1, defval: "" });
            if (rawMatrix.length < 2) {
              throw new Error("Spreadsheet does not contain data rows or headers.");
            }
            const rawHeaders = (rawMatrix[0] || []).map((h) => clean(h).toLowerCase());
            job.totalRows = rawMatrix.length - 1;
            job.status = "ingesting";
            for (let r = 1; r < rawMatrix.length; r++) {
              if (job.cancelRequested) {
                console.log(`[INGESTION ${jobId}] Ingestion cancelled by user at row ${r}`);
                job.status = "cancelled";
                return;
              }
              const rowArr = rawMatrix[r] || [];
              const rowObj = {};
              for (let col = 0; col < rawHeaders.length; col++) {
                const key = rawHeaders[col];
                if (key) rowObj[key] = clean(rowArr[col]);
              }
              const company = cleanField(
                rowObj.company || rowObj.companyname || rowObj["company name"] || rowObj.organization || rowObj.business || rowObj.account || rowArr[0],
                255,
                `Enterprise #${r}`
              );
              const domain = cleanField(
                rowObj.domain || rowObj.website || rowObj.url || rowObj["website domain"],
                255,
                company ? `${company.toLowerCase().replace(/[^a-z0-9]/g, "")}.com` : "company.io"
              );
              const industry = cleanField(rowObj.industry || rowObj.sector || rowObj.category, 128, "Business Services");
              const contactName = cleanField(
                rowObj.name || rowObj.contact || rowObj.contactname || rowObj["contact name"] || (rowObj["first name"] ? `${clean(rowObj["first name"])} ${clean(rowObj["last name"] || "")}`.trim() : ""),
                255,
                "Executive Decision Maker"
              );
              const contactTitle = cleanField(rowObj.title || rowObj.jobtitle || rowObj["job title"] || rowObj.role, 255, "Director of Operations");
              const contactEmail = cleanField(rowObj.email || rowObj.workemail || rowObj["contact email"] || rowObj["work email"], 255, `contact_${r}@${domain}`);
              const contactPhone = cleanField(rowObj.phone || rowObj.mobile || rowObj.directphone || rowObj["direct phone"], 64, "+1 (555) 019-3829");
              rowsToInsert.push({
                companyName: company,
                domain,
                industry,
                contactName,
                contactTitle,
                contactEmail,
                contactPhone,
                country: cleanField(rowObj.country || rowObj.nation, 128, "USA"),
                city: cleanField(rowObj.city || rowObj.location, 128, "San Francisco, CA"),
                employeeRange: cleanField(rowObj.employees || rowObj.employeerange || rowObj["employee range"], 64, "51-200"),
                employeeCount: Number(clean(rowObj.employeecount || rowObj["employee count"] || rowObj.size)) || 150,
                revenueRange: cleanField(rowObj.revenue || rowObj.revenuerange || rowObj["revenue range"], 64, "$10M - $50M"),
                annualRevenueUsd: Number(clean(rowObj.annualrevenue || rowObj["annual revenue"])) || 25e6,
                fundingStage: cleanField(rowObj.funding || rowObj.fundingstage, 64, "Series B"),
                buyingIntentScore: Number(clean(rowObj.intent || rowObj.intentscore)) || 90,
                techStack: ["AWS", "Salesforce"]
              });
            }
          } else {
            let isBinary = false;
            for (let b = 0; b < Math.min(100, buffer.length); b++) {
              if (buffer[b] === 0) {
                isBinary = true;
                break;
              }
            }
            if (isBinary) {
              throw new Error("Uploaded CSV file appears to be binary or corrupted. If this was an Excel (.xlsx) file renamed to .csv, please keep the original .xlsx extension.");
            }
            const textContent = buffer.toString("utf8");
            const lines = textContent.split(/\r?\n/).filter(Boolean);
            if (lines.length < 2) {
              throw new Error("CSV file does not contain enough rows.");
            }
            const delimiter = lines[0].includes("	") ? "	" : ",";
            const headers = lines[0].split(delimiter).map((h) => clean(h).toLowerCase());
            job.totalRows = lines.length - 1;
            job.status = "ingesting";
            for (let i = 1; i < lines.length; i++) {
              if (job.cancelRequested) {
                job.status = "cancelled";
                return;
              }
              const cols = lines[i].split(delimiter);
              const rowObj = {};
              headers.forEach((h, idx) => {
                rowObj[h] = clean(cols[idx]);
              });
              const company = cleanField(rowObj.company || rowObj.companyname || cols[0], 255, `Enterprise #${i}`);
              const domain = cleanField(rowObj.domain || rowObj.website, 255, "company.io");
              rowsToInsert.push({
                companyName: company,
                domain,
                industry: cleanField(rowObj.industry, 128, "Business Services"),
                contactName: cleanField(rowObj.name || rowObj.contact, 255, "Executive Decision Maker"),
                contactTitle: cleanField(rowObj.title, 255, "Director of Operations"),
                contactEmail: cleanField(rowObj.email, 255, `contact_${i}@${domain}`),
                contactPhone: cleanField(rowObj.phone, 64, "+1 (555) 019-3829"),
                country: cleanField(rowObj.country, 128, "USA"),
                city: cleanField(rowObj.city, 128, "San Francisco, CA"),
                employeeRange: cleanField(rowObj.employees, 64, "51-200"),
                revenueRange: cleanField(rowObj.revenue, 64, "$10M - $50M"),
                fundingStage: "Series B",
                buyingIntentScore: 88,
                techStack: ["AWS", "Salesforce"]
              });
            }
          }
          if (rowsToInsert.length === 0) {
            throw new Error("Zero valid lead records found in uploaded file.");
          }
          console.log(`[INGESTION ${jobId}] Inserting ${rowsToInsert.length.toLocaleString()} leads in chunks to MySQL...`);
          const CHUNK = 1e3;
          let totalInserted = 0;
          for (let c = 0; c < rowsToInsert.length; c += CHUNK) {
            if (job.cancelRequested) {
              job.status = "cancelled";
              console.log(`[INGESTION ${jobId}] Aborted during SQL insertion.`);
              return;
            }
            const currentChunk = rowsToInsert.slice(c, c + CHUNK);
            const resBatch = await batchInsertLeads(
              currentChunk.map((l) => ({ ...l, source: fileName || "spreadsheet" }))
            );
            totalInserted += resBatch.insertedCount;
            job.processedRows = Math.min(job.totalRows, c + currentChunk.length);
            job.insertedCount = totalInserted;
            job.percent = Math.min(100, Math.round(job.processedRows / job.totalRows * 100));
          }
          let savedList = null;
          if (createList || listName) {
            try {
              const ds = await (await Promise.resolve().then(() => (init_dataSource(), dataSource_exports))).getDataSource();
              const listRepo = ds.getRepository((await Promise.resolve().then(() => (init_SavedList(), SavedList_exports))).SavedList);
              const name = String(listName || fileName?.replace(/\.[^/.]+$/, "") || `Imported List (${(/* @__PURE__ */ new Date()).toLocaleDateString()})`).trim();
              const targetIds = rowsToInsert.map((l) => l.id).filter(Boolean);
              const newList = listRepo.create({
                id: `list_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
                userId: req.user?.id ? String(req.user.id) : null,
                name,
                description: `Imported from ${fileName || "spreadsheet"} (${totalInserted.toLocaleString()} leads)`,
                leadIds: targetIds,
                filterSummary: `${totalInserted.toLocaleString()} Leads from ${fileName || "File"}`,
                leadCount: totalInserted
              });
              savedList = await listRepo.save(newList);
              job.list = savedList;
            } catch (listErr) {
              console.warn("Could not auto-create list for imported leads:", listErr);
            }
          }
          job.status = "completed";
          job.percent = 100;
          console.log(`[INGESTION ${jobId}] Finished successfully! ${totalInserted.toLocaleString()} records committed to MySQL.`);
        } catch (err) {
          console.error(`[INGESTION ${jobId}] Failed:`, err);
          job.status = "error";
          job.error = err.message || "Processing failed";
        }
      })();
    } catch (err) {
      console.error("File stream ingestion error:", err);
      res.status(500).json({ error: err.message || "Server failed to process high-capacity file upload" });
    }
  });
  app.get("/api/leads/taxonomy", (_req, res) => {
    res.json(FILTER_TAXONOMY);
  });
  const landingPreviewCache = /* @__PURE__ */ new Map();
  app.get("/api/leads/landing-preview", async (req, res) => {
    try {
      const clientIp = String(
        req.headers["x-forwarded-for"] || req.headers["x-real-ip"] || req.socket.remoteAddress || "unknown"
      ).split(",")[0].trim();
      const now = Date.now();
      const THIRTY_MINUTES_MS = 30 * 60 * 1e3;
      const cached = landingPreviewCache.get(clientIp);
      if (cached && now - cached.timestamp < THIRTY_MINUTES_MS) {
        return res.json({
          leads: cached.leads,
          clientIp,
          nextRotationInMs: THIRTY_MINUTES_MS - (now - cached.timestamp)
        });
      }
      const randOffset = Math.floor(Math.random() * 3e6);
      const ds = await (await Promise.resolve().then(() => (init_dataSource(), dataSource_exports))).getTertiaryDataSource();
      const rawLeads = await ds.query(
        `SELECT id, company_name, domain, industry, employee_range,
                annual_revenue_usd, revenue_range, country, city,
                contact_name, contact_title, contact_email, contact_phone,
                buying_intent_score, verification_status
         FROM leads 
         WHERE contact_email IS NOT NULL AND company_name IS NOT NULL
         LIMIT 20 OFFSET ?`,
        [randOffset]
      );
      const formatted = (rawLeads || []).map((l) => ({
        id: l.id,
        companyName: l.company_name,
        domain: l.domain,
        industry: l.industry || "Business Services",
        employeeRange: l.employee_range || "51-200",
        contactName: l.contact_name || "Executive Contact",
        contactTitle: l.contact_title || "Director of Operations",
        contactEmail: l.contact_email,
        contactPhone: l.contact_phone,
        buyingIntentScore: Number(l.buying_intent_score) || 88,
        verificationStatus: l.verification_status || "Verified"
      }));
      landingPreviewCache.set(clientIp, {
        timestamp: now,
        leads: formatted
      });
      if (landingPreviewCache.size > 1e4) {
        for (const [ip, entry] of landingPreviewCache.entries()) {
          if (now - entry.timestamp > THIRTY_MINUTES_MS) {
            landingPreviewCache.delete(ip);
          }
        }
      }
      res.json({
        leads: formatted,
        clientIp,
        nextRotationInMs: THIRTY_MINUTES_MS
      });
    } catch (err) {
      console.error("Landing preview error:", err.message);
      res.status(500).json({ error: "Failed to fetch preview leads" });
    }
  });
  app.get("/api/leads", async (req, res) => {
    const tStart = Date.now();
    try {
      const result = await queryLeadsDatabase(req.query);
      const elapsed = Date.now() - tStart;
      console.log(`[QUERY MONITOR] ${elapsed}ms | Filters: ${JSON.stringify(req.query)}`);
      res.json(result);
    } catch (error) {
      const elapsed = Date.now() - tStart;
      console.error(`[QUERY MONITOR ERROR] ${elapsed}ms:`, error);
      res.status(500).json({ error: "Failed to execute B2B database query" });
    }
  });
  app.post("/api/leads/by-ids", antiScraperProtectionMiddleware, async (req, res) => {
    try {
      const { ids } = req.body || {};
      const leads = await fetchLeadsByIds(ids || []);
      res.json({ leads });
    } catch (err) {
      console.error("Error fetching leads by IDs:", err);
      res.status(500).json({ error: "Failed to fetch leads by IDs" });
    }
  });
  app.post("/api/leads/custom", requireSuperAdminMiddleware, async (req, res) => {
    try {
      const body = req.body || {};
      const result = await batchInsertLeads([{
        id: body.id || `custom_${Date.now()}`,
        companyName: String(body.companyName || "Untitled Business").trim(),
        domain: String(body.domain || "company.io").trim(),
        industry: String(body.industry || "Enterprise Software & SaaS").trim(),
        employeeRange: String(body.employeeRange || "51-200").trim(),
        employeeCount: Number(body.employeeCount) || 120,
        revenueRange: String(body.revenueRange || "$10M - $50M").trim(),
        annualRevenueUsd: Number(body.annualRevenueUsd) || 24e6,
        country: String(body.country || "United States").trim(),
        city: String(body.city || "San Francisco, CA").trim(),
        contactName: String(body.contactName || "Executive Contact").trim(),
        contactTitle: String(body.contactTitle || "VP of Operations").trim(),
        seniority: String(body.seniority || "VP").trim(),
        department: String(body.department || "Operations & Supply Chain").trim(),
        contactEmail: String(body.contactEmail || "contact@company.io").trim(),
        contactPhone: String(body.contactPhone || "+1 (415) 555-0142").trim(),
        verificationStatus: body.verificationStatus || "Verified",
        fundingStage: body.fundingStage || "Series B",
        techStack: Array.isArray(body.techStack) ? body.techStack : String(body.techStack || "AWS, Salesforce").split(",").map((s) => s.trim()).filter(Boolean),
        buyingIntentScore: Number(body.buyingIntentScore) || 88,
        foundedYear: Number(body.foundedYear) || 2021,
        hasDirectPhone: true,
        isCustom: true,
        source: "manual_lead_entry",
        createdAt: (/* @__PURE__ */ new Date()).toISOString()
      }]);
      res.status(201).json({ success: true, result });
    } catch (error) {
      res.status(400).json({ error: error.message || "Could not add custom lead" });
    }
  });
  app.delete("/api/leads/custom/:id", requireSuperAdminMiddleware, async (req, res) => {
    try {
      const targetId = req.params.id;
      const { getDataSource: getDataSource2, getPrimaryDataSource: getPrimaryDataSource2, getSecondaryDataSource: getSecondaryDataSource2, getTertiaryDataSource: getTertiaryDataSource2 } = await Promise.resolve().then(() => (init_dataSource(), dataSource_exports));
      const dsList = [
        await getDataSource2(),
        await getTertiaryDataSource2(),
        await getSecondaryDataSource2(),
        await getPrimaryDataSource2()
      ].filter(Boolean);
      let deleted = false;
      for (const ds of dsList) {
        try {
          const result = await ds.query("DELETE FROM leads WHERE id = ?", [targetId]);
          if (result && result.affectedRows > 0) {
            deleted = true;
          }
        } catch (_) {
        }
      }
      res.json({ deleted, id: targetId });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });
  app.get("/api/lists", async (req, res) => {
    try {
      const ds = await (await Promise.resolve().then(() => (init_dataSource(), dataSource_exports))).getTertiaryDataSource() || await (await Promise.resolve().then(() => (init_dataSource(), dataSource_exports))).getDataSource();
      const listRepo = ds.getRepository((await Promise.resolve().then(() => (init_SavedList(), SavedList_exports))).SavedList);
      const userId = req.user?.id || req.user?.email ? String(req.user.id || req.user.email) : null;
      let lists = [];
      if (userId) {
        lists = await listRepo.createQueryBuilder("list").where("list.userId = :userId OR list.userId IS NULL", { userId }).orderBy("list.createdAt", "DESC").getMany();
      } else {
        lists = await listRepo.find({
          order: { createdAt: "DESC" },
          take: 100
        });
      }
      res.json({
        lists: lists.map((l) => ({
          id: l.id,
          name: l.name,
          description: l.description,
          leadIds: Array.isArray(l.leadIds) ? l.leadIds : typeof l.leadIds === "string" ? JSON.parse(l.leadIds || "[]") : [],
          filterSummary: l.filterSummary,
          leadCount: l.leadCount,
          createdAt: l.createdAt,
          updatedAt: l.updatedAt
        }))
      });
    } catch (err) {
      console.error("Failed to get saved lists:", err);
      res.status(500).json({ error: err.message || "Failed to fetch saved lists" });
    }
  });
  app.post("/api/lists", async (req, res) => {
    try {
      const body = req.body || {};
      const name = String(body.name || "").trim();
      if (!name) {
        return res.status(400).json({ error: "List name is required" });
      }
      const ds = await (await Promise.resolve().then(() => (init_dataSource(), dataSource_exports))).getTertiaryDataSource() || await (await Promise.resolve().then(() => (init_dataSource(), dataSource_exports))).getDataSource();
      const listRepo = ds.getRepository((await Promise.resolve().then(() => (init_SavedList(), SavedList_exports))).SavedList);
      const leadIds = Array.isArray(body.leadIds) ? body.leadIds : [];
      const listId = body.id && /^[a-zA-Z0-9_\-]+$/.test(body.id) ? body.id : `list_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
      const userId = req.user?.id || req.user?.email ? String(req.user.id || req.user.email) : null;
      const newList = listRepo.create({
        id: listId,
        userId,
        name,
        description: body.description ? String(body.description).trim() : null,
        leadIds,
        filterSummary: body.filterSummary ? String(body.filterSummary).trim() : "Custom Selected B2B Leads",
        leadCount: leadIds.length || Number(body.leadCount) || 0
      });
      const saved = await listRepo.save(newList);
      res.status(201).json({
        success: true,
        list: {
          id: saved.id,
          name: saved.name,
          description: saved.description,
          leadIds: saved.leadIds || [],
          filterSummary: saved.filterSummary,
          leadCount: saved.leadCount,
          createdAt: saved.createdAt,
          updatedAt: saved.updatedAt
        }
      });
    } catch (err) {
      console.error("Failed to save list:", err);
      res.status(500).json({ error: err.message || "Failed to save list" });
    }
  });
  app.delete("/api/lists/:id", async (req, res) => {
    try {
      const ds = await (await Promise.resolve().then(() => (init_dataSource(), dataSource_exports))).getTertiaryDataSource() || await (await Promise.resolve().then(() => (init_dataSource(), dataSource_exports))).getDataSource();
      const listRepo = ds.getRepository((await Promise.resolve().then(() => (init_SavedList(), SavedList_exports))).SavedList);
      await listRepo.delete(req.params.id);
      res.json({ success: true, deleted: true, id: req.params.id });
    } catch (err) {
      console.error("Failed to delete list:", err);
      res.status(500).json({ error: err.message || "Failed to delete list" });
    }
  });
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa"
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`LeadsArrow B2B Intelligence Server running on http://0.0.0.0:${PORT}`);
  });
}
startServer();
