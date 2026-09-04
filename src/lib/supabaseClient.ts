import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://eorbgqrrjoojwikqgeek.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVvcmJncXJyam9vandpa3FnZWVrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODYzNDcyNDgsImV4cCI6MjEwMTkyMzI0OH0.L9BoqgMev-Lk_VYAPHPVF-aRMwSB1sfOUVeo-BLq36s';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
