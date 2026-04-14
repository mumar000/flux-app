export interface Bank {
  id: string;
  name: string;
  balance: number;
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

  async create(input: string | { name: string; initialBalance?: number }): Promise<Bank> {
    const payload =
      typeof input === "string"
        ? { name: input }
        : { name: input.name, initialBalance: input.initialBalance ?? 0 };

    return handleResponse<Bank>(
      await fetch(BASE_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
    );
  },

  async delete(id: string): Promise<void> {
    await handleResponse<void>(
      await fetch(`${BASE_URL}?id=${id}`, { method: "DELETE" })
    );
  },
};
