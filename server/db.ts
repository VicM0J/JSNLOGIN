import pg from "pg";
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from "@shared/schema";

const { Pool } = pg;

const connectionString = process.env.DATABASE_URL || "postgresql://postgres:12345@localhost:5432/jasanaordenes";

if (!connectionString) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

export const pool = new Pool({ 
  connectionString: connectionString,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  // Para Render, siempre usar SSL si está en la URL externa
  ...(connectionString.includes('render.com') && {
    ssl: { rejectUnauthorized: false }
  })
});

export const db = drizzle({ client: pool, schema });