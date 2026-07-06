import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://rgammtunqygtcsoiizmb.supabase.co";
const supabaseAnonKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJnYW1tdHVucXlndGNzb2lpem1iIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODMxMjI3NzAsImV4cCI6MjA5ODY5ODc3MH0.rlXsR-ZiexNR-D4_hjnNaWhtcIfNE4wkvHwcodTGVfU";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
