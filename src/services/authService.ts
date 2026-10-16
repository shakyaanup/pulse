import { User } from '../types';
import { DEMO_PASSWORD, mockCurrentUser } from './mockData';

const MOCK_LATENCY_MS = 700;

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// Pretends to be POST /auth/login. A real backend would check a hashed
// password and return a session token; here the demo account is hard-coded.
export const login = async (email: string, password: string): Promise<User> => {
  await delay(MOCK_LATENCY_MS);

  const emailMatches =
    email.trim().toLowerCase() === mockCurrentUser.email.toLowerCase();

  // One message for both cases, so the form doesn't reveal which emails exist
  if (!emailMatches || password !== DEMO_PASSWORD) {
    throw new Error('Incorrect email or password.');
  }

  return { ...mockCurrentUser };
};
