import type { Category } from "./category.service";
import type { Bank } from "./bank.service";

export interface InitData {
  categories: Category[];
  banks: Bank[];
}

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `Request failed (${res.status})`);
  }
  return res.json();
}

export const initService = {
  async getAll(): Promise<InitData> {
    return handleResponse<InitData>(await fetch("/api/init"));
  },
};
