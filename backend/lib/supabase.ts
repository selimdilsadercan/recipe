import { createClient, SupabaseClient } from "@supabase/supabase-js";

// Type definitions
export interface Ingredient {
  name: string;
  amount?: string;
  unit?: string;
}

export interface Instruction {
  step: number;
  text: string;
}

export interface Recipe {
  id: string;
  title: string;
  image_url: string | null;
  created_at: string;
  created_user_id: string;
  ingredients: Ingredient[] | null;
  instructions: Instruction[] | null;
  servings: number | null;
  prep_time: number | null;
  cook_time: number | null;
}

export interface RecipeSummary {
  id: string;
  title: string;
  image_url: string | null;
  created_at: string;
  servings: number | null;
  prep_time: number | null;
  cook_time: number | null;
}

export interface User {
  id: string;
  clerk_id: string;
  created_at: string;
}

// Factory function to create Supabase client (called from services with secrets)
export function createSupabaseClient(url: string, anonKey: string): SupabaseClient {
  return createClient(url, anonKey);
}
