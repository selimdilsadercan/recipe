/**
 * Encore API Client Helper
 * Server-side Encore client oluşturmak için kullanılır
 */

import Client, { Environment, Local } from "./client";

// Environment'a göre doğru baseURL seçimi
function getBaseURL() {
  const environment = process.env.ENCORE_ENVIRONMENT || "local";
  
  if (environment === "local") {
    return Local;
  }
  
  // Production veya staging environment
  return Environment(environment);
}

/**
 * Server tarafında Encore client oluşturur
 * "use server" actions içinde kullanılır
 */
export async function createServerClient(): Promise<Client> {
  const baseURL = getBaseURL();
  return new Client(baseURL);
}

/**
 * Client tarafında Encore client oluşturur
 * Client component'lerde kullanılır (not recommended, use server actions instead)
 */
export function createBrowserClient(): Client {
  const baseURL = getBaseURL();
  return new Client(baseURL);
}

// Re-export types from client
export type { ClientOptions, BaseURL } from "./client";
