// src/utils/utmTracker.js

export const saveUTMParams = () => {
  const urlParams = new URLSearchParams(window.location.search);
  const utmKeys = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content'];
  
  let utmData = {};
  let hasUtm = false;

  utmKeys.forEach(key => {
    const value = urlParams.get(key);
    if (value) {
      utmData[key] = value;
      hasUtm = true;
    }
  });

  if (hasUtm) {
    // Salva nel localStorage per recuperarlo quando l'utente compila il form lead
    localStorage.setItem('user_utm_data', JSON.stringify(utmData));
  }
};

export const getUTMParams = () => {
  const data = localStorage.getItem('user_utm_data');
  return data ? JSON.parse(data) : {};
};