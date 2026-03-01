import { Pool } from 'pg';
import dotenv from 'dotenv';
dotenv.config();

// admin pool — full access, used for schema introspection
export const adminPool = new Pool({
  connectionString: process.env.PG_URL || 'postgresql://admin:password@localhost:5432/ciphersqlstudio_app',
});

// student pool — restricted SELECT-only role
export const studentPool = new Pool({
  connectionString: process.env.PG_STUDENT_URL || 'postgresql://student_user:student_password@localhost:5432/ciphersqlstudio_app',
});
