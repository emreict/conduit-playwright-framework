import { APIRequestContext, APIResponse, request } from "@playwright/test";
import { config } from "../config/env";
import { NewArticle, NewUser } from "../data/factory";

export interface ApiUser {
  email: string;
  username: string;
  token: string;
  bio: string | null;
  image: string | null;
}

export interface ApiArticle {
  slug: string;
  title: string;
  description: string;
  body: string;
  tagList: string[];
  favorited: boolean;
  favoritesCount: number;
  author: { username: string; following: boolean };
}

export interface ApiComment {
  id: number;
  body: string;
  author: { username: string };
}

/**
 * Thin wrapper over the Conduit REST API. Every method returns the parsed
 * body; use `raw` helpers when a test needs the status code or error payload.
 */
export class ApiClient {
  private constructor(
    private readonly ctx: APIRequestContext,
    private token?: string,
  ) {}

  static async create(token?: string): Promise<ApiClient> {
    return new ApiClient(await request.newContext(), token);
  }

  async dispose(): Promise<void> {
    await this.ctx.dispose();
  }

  // --- low level -----------------------------------------------------------

  /** Sends a request and returns the raw response (status, headers, body). */
  async send(
    method: "GET" | "POST" | "PUT" | "DELETE",
    path: string,
    data?: unknown,
  ): Promise<APIResponse> {
    return this.ctx.fetch(`${config.apiURL}${path}`, {
      method,
      data,
      headers: this.token ? { Authorization: `Token ${this.token}` } : {},
    });
  }

  private async json<T>(response: APIResponse): Promise<T> {
    if (!response.ok()) {
      throw new Error(
        `${response.url()} -> ${response.status()} ${await response.text()}`,
      );
    }
    return (await response.json()) as T;
  }

  // --- users ---------------------------------------------------------------

  async register(user: NewUser): Promise<ApiUser> {
    const body = await this.json<{ user: ApiUser }>(
      await this.send("POST", "/users", { user }),
    );
    this.token = body.user.token;
    return body.user;
  }

  async login(email: string, password: string): Promise<ApiUser> {
    const body = await this.json<{ user: ApiUser }>(
      await this.send("POST", "/users/login", { user: { email, password } }),
    );
    this.token = body.user.token;
    return body.user;
  }

  async currentUser(): Promise<ApiUser> {
    return (await this.json<{ user: ApiUser }>(await this.send("GET", "/user")))
      .user;
  }

  // --- articles ------------------------------------------------------------

  async createArticle(article: NewArticle): Promise<ApiArticle> {
    return (
      await this.json<{ article: ApiArticle }>(
        await this.send("POST", "/articles", { article }),
      )
    ).article;
  }

  async getArticle(slug: string): Promise<ApiArticle> {
    return (
      await this.json<{ article: ApiArticle }>(
        await this.send("GET", `/articles/${slug}`),
      )
    ).article;
  }

  async listArticles(query = ""): Promise<{
    articles: ApiArticle[];
    articlesCount: number;
  }> {
    return this.json(await this.send("GET", `/articles${query}`));
  }

  async updateArticle(
    slug: string,
    changes: Partial<NewArticle>,
  ): Promise<ApiArticle> {
    return (
      await this.json<{ article: ApiArticle }>(
        await this.send("PUT", `/articles/${slug}`, { article: changes }),
      )
    ).article;
  }

  /** Deletes an article; a missing article is fine so cleanup is idempotent. */
  async deleteArticle(slug: string): Promise<void> {
    const response = await this.send("DELETE", `/articles/${slug}`);
    if (!response.ok() && response.status() !== 404) {
      throw new Error(`DELETE article ${slug} -> ${response.status()}`);
    }
  }

  // --- comments ------------------------------------------------------------

  async addComment(slug: string, body: string): Promise<ApiComment> {
    return (
      await this.json<{ comment: ApiComment }>(
        await this.send("POST", `/articles/${slug}/comments`, {
          comment: { body },
        }),
      )
    ).comment;
  }

  async listComments(slug: string): Promise<ApiComment[]> {
    return (
      await this.json<{ comments: ApiComment[] }>(
        await this.send("GET", `/articles/${slug}/comments`),
      )
    ).comments;
  }

  async deleteComment(slug: string, id: number): Promise<void> {
    await this.send("DELETE", `/articles/${slug}/comments/${id}`);
  }

  // --- favorites, tags -----------------------------------------------------

  async favorite(slug: string): Promise<ApiArticle> {
    return (
      await this.json<{ article: ApiArticle }>(
        await this.send("POST", `/articles/${slug}/favorite`),
      )
    ).article;
  }

  async unfavorite(slug: string): Promise<void> {
    await this.send("DELETE", `/articles/${slug}/favorite`);
  }

  async tags(): Promise<string[]> {
    return (
      await this.json<{ tags: string[] }>(await this.send("GET", "/tags"))
    ).tags;
  }
}
