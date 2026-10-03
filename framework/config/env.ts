import { existsSync } from "node:fs";

// Load a local .env file if present (Node 20.12+). Real environment variables win.
if (existsSync(".env")) {
  process.loadEnvFile(".env");
}

const env = process.env;

export const config = {
  /** The Angular app under test. */
  baseURL: env["BASE_URL"] ?? "http://localhost:4200",
  /** The REST API the app talks to (no trailing slash). */
  apiURL: (
    env["API_URL"] ?? "https://conduit-api.bondaracademy.com/api"
  ).replace(/\/$/, ""),
  /**
   * Optional existing account. When both are set, tests sign in with it.
   * Otherwise each worker registers its own throwaway user through the API.
   */
  user: {
    email: env["TEST_USER_EMAIL"],
    password: env["TEST_USER_PASSWORD"],
  },
};
