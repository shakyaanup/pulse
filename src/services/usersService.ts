import { User } from '../types';
import { mockUsers } from './mockData';

const MOCK_LATENCY_MS = 600;

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// Pretends to be a network request so the page handles loading like it would
// with a real backend. To switch over, replace the body with:
//   return apiClient.get<User[]>('/users');
export const fetchUsers = async (): Promise<User[]> => {
  await delay(MOCK_LATENCY_MS);
  // Return copies so the page can never mutate the shared mock array
  return mockUsers.map((user) => ({ ...user }));
};
