// Load environment variables FIRST before any other imports
import { config } from "dotenv";
config();

import { sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";

const { Pool } = pg;

if (!process.env.DATABASE_URL) {
  console.error("❌ DATABASE_URL must be set in .env file");
  process.exit(1);
}

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const db = drizzle(pool);

async function checkDatabase() {
  console.log("🔍 Checking database schema...\n");

  try {
    // Get all tables
    const tables = await db.execute(sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE'
      ORDER BY table_name;
    `);

    console.log("📊 Tables found in database:");
    const tableNames = tables.rows.map((row: any) => row.table_name);
    tableNames.forEach((name: string) => console.log(`  ✓ ${name}`));
    console.log();

    // Expected tables from schema.ts
    const expectedTables = [
      "students",
      "subscriptions", 
      "tickets",
      "logs",
      "eligibility_reports",
      "users",
      "sessions"
    ];

    console.log("📋 Expected tables (from schema.ts):");
    expectedTables.forEach(name => console.log(`  • ${name}`));
    console.log();

    // Check for missing tables
    const missing = expectedTables.filter(t => !tableNames.includes(t));
    const extra = tableNames.filter((t: string) => !expectedTables.includes(t));

    if (missing.length > 0) {
      console.log("⚠️  Missing tables:");
      missing.forEach(name => console.log(`  ✗ ${name}`));
      console.log();
    }

    if (extra.length > 0) {
      console.log("ℹ️  Extra tables (not in schema.ts):");
      extra.forEach((name: string) => console.log(`  + ${name}`));
      console.log();
    }

    // Check table structures
    console.log("🔎 Checking table structures...\n");
    
    for (const tableName of expectedTables) {
      if (tableNames.includes(tableName)) {
        const columns = await db.execute(sql`
          SELECT column_name, data_type, is_nullable, column_default
          FROM information_schema.columns
          WHERE table_schema = 'public' AND table_name = ${tableName}
          ORDER BY ordinal_position;
        `);
        
        console.log(`📐 ${tableName}:`);
        columns.rows.forEach((col: any) => {
          const nullable = col.is_nullable === 'YES' ? 'NULL' : 'NOT NULL';
          const defaultVal = col.column_default ? ` DEFAULT ${col.column_default}` : '';
          console.log(`    - ${col.column_name}: ${col.data_type} ${nullable}${defaultVal}`);
        });
        console.log();
      }
    }

    // Check foreign keys
    console.log("🔗 Checking foreign key relationships...\n");
    const fks = await db.execute(sql`
      SELECT
        tc.table_name, 
        kcu.column_name, 
        ccu.table_name AS foreign_table_name,
        ccu.column_name AS foreign_column_name 
      FROM information_schema.table_constraints AS tc 
      JOIN information_schema.key_column_usage AS kcu
        ON tc.constraint_name = kcu.constraint_name
        AND tc.table_schema = kcu.table_schema
      JOIN information_schema.constraint_column_usage AS ccu
        ON ccu.constraint_name = tc.constraint_name
        AND ccu.table_schema = tc.table_schema
      WHERE tc.constraint_type = 'FOREIGN KEY' 
        AND tc.table_schema = 'public'
      ORDER BY tc.table_name, kcu.column_name;
    `);

    if (fks.rows.length > 0) {
      fks.rows.forEach((fk: any) => {
        console.log(`  ${fk.table_name}.${fk.column_name} → ${fk.foreign_table_name}.${fk.foreign_column_name}`);
      });
    } else {
      console.log("  No foreign keys found (this might be expected if using Drizzle relations only)");
    }
    console.log();

    // Check indexes
    console.log("📇 Checking indexes...\n");
    const indexes = await db.execute(sql`
      SELECT
        tablename,
        indexname,
        indexdef
      FROM pg_indexes
      WHERE schemaname = 'public'
      ORDER BY tablename, indexname;
    `);

    if (indexes.rows.length > 0) {
      indexes.rows.forEach((idx: any) => {
        console.log(`  ${idx.tablename}: ${idx.indexname}`);
      });
    } else {
      console.log("  No custom indexes found");
    }
    console.log();

    // Summary
    console.log("✅ Database check complete!");
    if (missing.length === 0 && extra.length === 0) {
      console.log("✨ All expected tables are present!");
    } else if (missing.length > 0) {
      console.log(`\n⚠️  Action needed: Run 'npm run db:push' to create missing tables.`);
    }

  } catch (error: any) {
    console.error("❌ Error checking database:", error.message);
    if (error.code === 'ENOTFOUND') {
      console.error("\n💡 DNS resolution failed. Check your DATABASE_URL in .env");
      console.error("   The hostname might not exist or be accessible.");
    } else if (error.code === 'ECONNREFUSED') {
      console.error("\n💡 Connection refused. Check if database is running and accessible.");
    } else if (error.message?.includes('password authentication')) {
      console.error("\n💡 Authentication failed. Check your DATABASE_URL password.");
    } else if (error.code === 'ETIMEDOUT') {
      console.error("\n💡 Connection timeout. Check network connectivity and firewall settings.");
    }
    process.exit(1);
  } finally {
    await pool.end();
    process.exit(0);
  }
}

checkDatabase();
