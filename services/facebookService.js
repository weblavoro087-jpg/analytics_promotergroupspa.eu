import { API_BASE_URL } from './apiConfig';

export const getFacebookReport = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/facebook/report`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });

    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.error || `Errore HTTP: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('❌ Errore getFacebookReport:', error);
    throw error;
  }
};
