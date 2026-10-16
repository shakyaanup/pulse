import { User } from '../types';
import { mockUsers } from './mockData';
import { readStorage, writeStorage } from './storage';

const MOCK_LATENCY_MS = 600;
const MOCK_SAVE_LATENCY_MS = 400;
const USERS_KEY = 'users';

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// The fake "database": saved users if there are any, otherwise the seed data.
// Always returns copies so callers can never mutate the stored objects.
const loadUsers = (): User[] =>
  (readStorage<User[]>(USERS_KEY) ?? mockUsers).map((user) => ({ ...user }));

export type UserChanges = Partial<Omit<User, 'id' | 'createdAt'>>;

// Pretends to be a network request so the page handles loading like it would
// with a real backend. To switch over, replace the body with:
//   return apiClient.get<User[]>('/users');
export const fetchUsers = async (): Promise<User[]> => {
  await delay(MOCK_LATENCY_MS);
  return loadUsers();
};

// Like a PATCH /users/:id request: applies the changes, saves, and returns the
// updated user. Rejects the way a server would if the data isn't allowed.
export const updateUser = async (
  id: string,
  changes: UserChanges
): Promise<User> => {
  await delay(MOCK_SAVE_LATENCY_MS);
  const users = loadUsers();
  const existing = users.find((user) => user.id === id);

  if (!existing) {
    throw new Error('This user no longer exists.');
  }

  // Server-side rule: emails must be unique. The form can't check this
  // itself reliably, because only the "server" sees every user.
  const email = changes.email?.trim().toLowerCase();
  if (
    email &&
    users.some((user) => user.id !== id && user.email.toLowerCase() === email)
  ) {
    throw new Error('Another user already has that email address.');
  }

  const updated: User = { ...existing, ...changes };
  writeStorage(
    USERS_KEY,
    users.map((user) => (user.id === id ? updated : user))
  );
  return { ...updated };
};
