export interface Bank {
  id: string;
  name: string;
}

const BASE_URL = "/api/banks";

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `Request failed (${res.status})`);
  }
  return res.json();
}

export const bankService = {
  async getAll(): Promise<Bank[]> {
    return handleResponse<Bank[]>(await fetch(BASE_URL));
  },

  async create(name: string): Promise<Bank> {
    return handleResponse<Bank>(
      await fetch(BASE_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      })
    );
  },

  async delete(id: string): Promise<void> {
    await handleResponse<void>(
      await fetch(`${BASE_URL}?id=${id}`, { method: "DELETE" })
    );
  },
};
