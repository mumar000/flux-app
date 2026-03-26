export interface Goal {
  id: string;
  userId: string;
  title: string;
  target_amount: number;
  current_amount: number;
  emoji: string;
  deadline: string | null;
  completed: boolean;
  createdAt: string;
}

export interface CreateGoalInput {
  title: string;
  target_amount: number;
  emoji: string;
  deadline?: string;
}

const BASE_URL = "/api/goals";

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `Request failed (${res.status})`);
  }
  return res.json();
}

export const goalService = {
  async getAll(): Promise<Goal[]> {
    return handleResponse<Goal[]>(await fetch(BASE_URL));
  },

  async create(input: CreateGoalInput): Promise<Goal> {
    return handleResponse<Goal>(
      await fetch(BASE_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      })
    );
  },

  async contribute(id: string, add_amount: number): Promise<Goal> {
    return handleResponse<Goal>(
      await fetch(BASE_URL, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, add_amount }),
      })
    );
  },

  async delete(id: string): Promise<void> {
    await handleResponse<void>(
      await fetch(`${BASE_URL}?id=${id}`, { method: "DELETE" })
    );
  },
};
