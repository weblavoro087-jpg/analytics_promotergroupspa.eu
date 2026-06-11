import { API_BASE_URL } from './apiConfig';

// Funzione Keywords
export const getSearchConsoleData = async ({ siteUrl, startDate, endDate }) => {
  try {
    // Se siteUrl non arriva, usiamo madroom come fallback di sicurezza
    const finalUrl = siteUrl || 'sc-domain:madroom.it';
    
    const response = await fetch(
      `${API_BASE_URL}/api/search-analytics-legacy?siteUrl=${encodeURIComponent(finalUrl)}&startDate=${startDate}&endDate=${endDate}`,
      { method: 'GET' }
    );

    if (!response.ok) throw new Error(`Errore HTTP: ${response.status}`);
    const data = await response.json();
    return { data };
  } catch (error) {
    console.error('❌ Errore getSearchConsoleData:', error);
    throw error;
  }
};

// Funzione Timeline
export const getSearchConsoleTimeline = async ({ siteUrl, startDate, endDate }) => {
  try {
    const finalUrl = siteUrl || 'sc-domain:madroom.it';
    
    const response = await fetch(
      `${API_BASE_URL}/api/search-console-timeline?siteUrl=${encodeURIComponent(finalUrl)}&startDate=${startDate}&endDate=${endDate}`,
      { method: 'GET' }
    );

    if (!response.ok) throw new Error(`Errore HTTP: ${response.status}`);
    const data = await response.json();
    return { data };
  } catch (error) {
    console.error('❌ Errore getSearchConsoleTimeline:', error);
    throw error;
  }
};
