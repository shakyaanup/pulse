// Base API configuration
// All service files will import from here

const BASE_URL = process.env.REACT_APP_API_URL || 'https://api.pulse.dev';

export const apiClient = {
  get: async <T>(endpoint: string): Promise<T> => {
    const response = await fetch(`${BASE_URL}${endpoint}`);
    if (!response.ok) throw new Error(`API Error: ${response.status}`);
    return response.json();
  },
};
