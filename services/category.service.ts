export interface Category {
  id: string;
  name: string;
  emoji: string;
  color: string | null;
  is_default: boolean;
}

export interface CreateCategoryInput {
  name: string;
  emoji: string;
  color?: string;
}

const BASE_URL = "/api/categories";

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `Request failed (${res.status})`);
  }
  return res.json();
}

export const categoryService = {
  async getAll(): Promise<Category[]> {
    return handleResponse<Category[]>(await fetch(BASE_URL));
  },

  async create(input: CreateCategoryInput): Promise<Category> {
    return handleResponse<Category>(
      await fetch(BASE_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      })
    );
  },

  async delete(id: string): Promise<void> {
    await handleResponse<void>(
      await fetch(`${BASE_URL}?id=${id}`, { method: "DELETE" })
    );
  },
};
