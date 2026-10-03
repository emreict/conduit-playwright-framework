/** Short unique suffix so parallel workers and repeated runs never collide. */
export function uniqueId(): string {
  return `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`;
}

export interface NewUser {
  username: string;
  email: string;
  password: string;
}

export interface NewArticle {
  title: string;
  description: string;
  body: string;
  tagList: string[];
}

export function buildUser(overrides: Partial<NewUser> = {}): NewUser {
  const id = uniqueId();
  return {
    username: `pw_${id}`,
    email: `pw_${id}@example.com`,
    password: "Passw0rd!123",
    ...overrides,
  };
}

export function buildArticle(overrides: Partial<NewArticle> = {}): NewArticle {
  const id = uniqueId();
  return {
    title: `PW article ${id}`,
    description: `Description ${id}`,
    body: `Body of article ${id}`,
    tagList: ["playwright"],
    ...overrides,
  };
}
