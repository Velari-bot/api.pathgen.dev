import pg from 'pg';
const { Pool } = pg;

let pool = null;

if (process.env.DATABASE_URL) {
    try {
        pool = new Pool({
            connectionString: process.env.DATABASE_URL,
            ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
        });
        pool.on('error', (err) => console.log('PG Pool error:', err.message));
    } catch(e) {
        console.log('Database not available:', e.message);
    }
}

export const db = {
    query: (text, params) => pool ? pool.query(text, params) : Promise.reject(new Error('No DB connection')),
    pool
};
