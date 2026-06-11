import { NextResponse } from 'next/server';
import { dataClient, capDateRange } from '@/lib/ga';

export const revalidate = 300;

const knownCoords = {
  // Italia
  'Milan': [45.4642, 9.1899], 'Rome': [41.9028, 12.4964], 'Naples': [40.8518, 14.2681],
  'Turin': [45.0703, 7.6869], 'Palermo': [38.1157, 13.3615], 'Catania': [37.5079, 15.0830],
  'Florence': [43.7696, 11.2558], 'Bologna': [44.4949, 11.3426], 'Bari': [41.1171, 16.8719],
  'Genoa': [44.4056, 8.9463], 'Venice': [45.4408, 12.3155], 'Verona': [45.4384, 10.9916],
  'Padua': [45.4064, 11.8768], 'Trieste': [45.6495, 13.7768], 'Brescia': [45.5416, 10.2118],
  'Parma': [44.8015, 10.3280], 'Modena': [44.6471, 10.9252], 'Reggio Emilia': [44.6983, 10.6278],
  'Perugia': [43.1107, 12.3908], 'Ancona': [43.6158, 13.5189], 'Pescara': [42.4618, 14.2161],
  "L'Aquila": [42.3506, 13.3995], 'Cagliari': [39.2238, 9.1217], 'Sassari': [40.7259, 8.5583],
  'Cosenza': [39.2983, 16.2538], 'Reggio Calabria': [38.1145, 15.6479], 'Lecce': [40.3515, 18.1718],
  'Taranto': [40.4764, 17.2296], 'Foggia': [41.4619, 15.5446], 'Salerno': [40.6825, 14.7681],
  'Rimini': [44.0594, 12.5653], 'Udine': [46.0690, 13.2372], 'Como': [45.8080, 9.0852],
  'Bergamo': [45.6983, 9.6773], 'Trento': [46.0748, 11.1217], 'Bolzano': [46.4983, 11.3548],
  'Siena': [43.3187, 11.3305], 'Pisa': [43.7228, 10.4017], 'Lucca': [43.8440, 10.5026],
  'Matera': [40.6665, 16.6042], 'Ferrara': [44.8381, 11.6199], 'Aosta': [45.7375, 7.3154],
  'Campobasso': [41.5601, 14.6640], 'Potenza': [40.6390, 15.8054], 'Catanzaro': [38.9065, 16.5973],
  'Vibo Valentia': [38.6764, 16.1015], 'Trapani': [38.0184, 12.5447], 'Ragusa': [36.9280, 14.7304],
  'Varese': [45.8206, 8.8251], 'Monza': [45.5845, 9.2744], 'Novara': [45.4469, 8.6209],
  'Alessandria': [44.9132, 8.6199], 'Livorno': [43.5485, 10.3106], 'Arezzo': [43.4662, 11.8822],
  'Pistoia': [43.9336, 10.9170], 'Prato': [43.8798, 11.0963], 'Massa': [44.0354, 10.1393],
  'Pordenone': [45.9636, 12.6556], 'Gorizia': [45.9415, 13.6195], 'Belluno': [46.1425, 12.2186],
  'Sondrio': [46.1698, 9.8698], 'Cremona': [45.1333, 10.0200], 'Mantua': [45.1563, 10.7902],
  'Rovigo': [45.0711, 11.7900], 'Vicenza': [45.5476, 11.5440], 'Treviso': [45.6668, 12.2450],
  'La Spezia': [44.1105, 9.8433], 'Savona': [44.3081, 8.4802], 'Imperia': [43.8874, 8.0278],
  'Lodi': [45.3133, 9.5035], 'Lecco': [45.8558, 9.4016], 'Biella': [45.5630, 8.0540],
  'Vercelli': [45.3228, 8.4212], 'Cuneo': [44.3904, 7.5479], 'Asti': [44.9005, 8.2068],
  'Grosseto': [42.7620, 11.1139], 'Massa Carrara': [44.0354, 10.1393],
  'Fermo': [43.1628, 13.7246], 'Macerata': [43.3001, 13.4542], 'Ascoli Piceno': [42.8550, 13.5733],
  'Viterbo': [42.4190, 12.1041], 'Rieti': [42.4040, 12.8560], 'Frosinone': [41.6396, 13.3519],
  'Latina': [41.4679, 12.9040], 'Benevento': [41.1297, 14.7830], 'Avellino': [40.9165, 14.7905],
  'Caserta': [41.0725, 14.3348], 'Sassuolo': [44.5432, 10.7862],
  'Olbia': [40.9237, 9.4980], 'Nuoro': [40.3226, 9.3260], 'Oristano': [39.9038, 8.5913],
  'Enna': [37.5673, 14.2743], 'Caltanissetta': [37.4885, 14.0628], 'Agrigento': [37.3115, 13.5766],
  'Siracusa': [37.0755, 15.2866], 'Messina': [38.1938, 15.5540],
  // Europa
  'Paris': [48.8566, 2.3522], 'London': [51.5074, -0.1278], 'Berlin': [52.5200, 13.4050],
  'Madrid': [40.4168, -3.7038], 'Barcelona': [41.3874, 2.1686], 'Zurich': [47.3769, 8.5417],
  'Munich': [48.1351, 11.5820], 'Vienna': [48.2082, 16.3738], 'Prague': [50.0755, 14.4378],
  'Amsterdam': [52.3676, 4.9041], 'Brussels': [50.8503, 4.3517], 'Lisbon': [38.7223, -9.1393],
  'Dublin': [53.3498, -6.2603], 'Stockholm': [59.3293, 18.0686], 'Copenhagen': [55.6761, 12.5683],
  'Warsaw': [52.2297, 21.0122], 'Budapest': [47.4979, 19.0402], 'Athens': [37.9838, 23.7275],
  'Helsinki': [60.1699, 24.9384], 'Oslo': [59.9139, 10.7522], 'Reykjavik': [64.1466, -21.9426],
  'Marseille': [43.2965, 5.3698], 'Lyon': [45.7640, 4.8357], 'Nice': [43.7102, 7.2620],
  'Toulouse': [43.6047, 1.4442], 'Bordeaux': [44.8378, -0.5792], 'Lille': [50.6292, 3.0573],
  'Hamburg': [53.5511, 9.9937], 'Frankfurt': [50.1109, 8.6821], 'Stuttgart': [48.7758, 9.1829],
  'Dusseldorf': [51.2277, 6.7735], 'Cologne': [50.9375, 6.9603], 'Hannover': [52.3759, 9.7320],
  'Valencia': [39.4699, -0.3763], 'Seville': [37.3891, -5.9845], 'Malaga': [36.7213, -4.4214],
  'Porto': [41.1579, -8.6291], 'Luxembourg': [49.6117, 6.1300], 'Strasbourg': [48.5734, 7.7521],
  'Antwerp': [51.2194, 4.4025], 'Ghent': [51.0543, 3.7199], 'Rotterdam': [51.9244, 4.4777],
  'The Hague': [52.0705, 4.3007], 'Utrecht': [52.0907, 5.1214],
  'Moscow': [55.7558, 37.6173], 'Saint Petersburg': [59.9343, 30.3351],
  'Istanbul': [41.0082, 28.9784], 'Ankara': [39.9334, 32.8597], 'Doha': [25.2854, 51.5310],
  'Tel Aviv': [32.0853, 34.7818], 'Jerusalem': [31.7683, 35.2137],
  'Monaco': [43.7384, 7.4246], 'Zagreb': [45.8150, 15.9819], 'Belgrade': [44.7866, 20.4489],
  'Sarajevo': [43.8563, 18.4131], 'Sofia': [42.6977, 23.3219], 'Bucharest': [44.4268, 26.1025],
  'Ljubljana': [46.0569, 14.5058], 'Bratislava': [48.1486, 17.1077],
  'Tallinn': [59.4370, 24.7536], 'Riga': [56.9496, 24.1052], 'Vilnius': [54.6872, 25.2797],
  'Skopje': [41.9973, 21.4280], 'Tirana': [41.3275, 19.8187],
  'Kiev': [50.4501, 30.5234], 'Minsk': [53.9045, 27.5615],
  'Chișinău': [47.0105, 28.8638], 'Tbilisi': [41.7151, 44.8271],
  // UK extra
  'Manchester': [53.4808, -2.2426], 'Birmingham': [52.4862, -1.8904],
  'Liverpool': [53.4084, -2.9916], 'Edinburgh': [55.9533, -3.1883],
  'Glasgow': [55.8642, -4.2518], 'Bristol': [51.4545, -2.5879],
  // Nord America
  'New York': [40.7128, -74.0060], 'Los Angeles': [34.0522, -118.2437],
  'Chicago': [41.8781, -87.6298], 'Miami': [25.7617, -80.1918],
  'San Francisco': [37.7749, -122.4194], 'Seattle': [47.6062, -122.3321],
  'Boston': [42.3601, -71.0589], 'Washington': [38.9072, -77.0369],
  'Dallas': [32.7767, -96.7970], 'Houston': [29.7604, -95.3698],
  'Atlanta': [33.7490, -84.3880], 'Denver': [39.7392, -104.9903],
  'Phoenix': [33.4484, -112.0740], 'Philadelphia': [39.9526, -75.1652],
  'Toronto': [43.6532, -79.3832], 'Montreal': [45.5017, -73.5673],
  'Vancouver': [49.2827, -123.1207], 'Mexico City': [19.4326, -99.1332],
  'Sao Paulo': [-23.5505, -46.6333], 'Rio de Janeiro': [-22.9068, -43.1729],
  'Buenos Aires': [-34.6037, -58.3816], 'Santiago': [-33.4489, -70.6693],
  'Lima': [-12.0464, -77.0428], 'Bogota': [4.7110, -74.0721],
  // Asia & Middle East
  'Dubai': [25.2048, 55.2708], 'Abu Dhabi': [24.4539, 54.3773],
  'Tokyo': [35.6762, 139.6503], 'Osaka': [34.6937, 135.5023],
  'Seoul': [37.5665, 126.9780], 'Beijing': [39.9042, 116.4074],
  'Shanghai': [31.2304, 121.4737], 'Hong Kong': [22.3193, 114.1694],
  'Singapore': [1.3521, 103.8198], 'Bangkok': [13.7563, 100.5018],
  'Mumbai': [19.0760, 72.8777], 'New Delhi': [28.7041, 77.1025],
  'Bangalore': [12.9716, 77.5946], 'Kolkata': [22.5726, 88.3639],
  'Taipei': [25.0330, 121.5654], 'Manila': [14.5995, 120.9842],
  'Jakarta': [-6.2088, 106.8456], 'Kuala Lumpur': [3.1390, 101.6869],
  'Riyadh': [24.7136, 46.6753], 'Jeddah': [21.4858, 39.1925],
  'Tehran': [35.6892, 51.3890], 'Baghdad': [33.3152, 44.3661],
  'Kuwait City': [29.3759, 47.9774], 'Muscat': [23.5880, 58.3829],
  // Oceania
  'Sydney': [-33.8688, 151.2093], 'Melbourne': [-37.8136, 144.9631],
  'Brisbane': [-27.4698, 153.0251], 'Auckland': [-36.8485, 174.7633],
  // Africa
  'Cairo': [30.0444, 31.2357], 'Johannesburg': [-26.2041, 28.0473],
  'Cape Town': [-33.9249, 18.4241], 'Lagos': [6.5244, 3.3792],
  'Nairobi': [-1.2921, 36.8219], 'Casablanca': [33.5731, -7.5898],
  'Tunis': [36.8065, 10.1815], 'Algiers': [36.7538, 3.0588],
};

const geoCache = globalThis.__geoCache || (globalThis.__geoCache = new Map());
let lastNominatimCall = 0;

async function geocodeCity(city) {
  if (!city || city === '(not set)') return [41.8719, 12.5674];

  if (geoCache.has(city)) return geoCache.get(city);

  const cached = knownCoords[city];
  if (cached) {
    geoCache.set(city, cached);
    return cached;
  }

  const now = Date.now();
  const minInterval = 1100;
  if (now - lastNominatimCall < minInterval) {
    await new Promise(r => setTimeout(r, minInterval - (now - lastNominatimCall)));
  }
  lastNominatimCall = Date.now();

  try {
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(city)}&limit=1&accept-language=it`;
    const res = await fetch(url, {
      headers: { 'User-Agent': 'PromoterGroupAnalytics/1.0' },
    });
    if (!res.ok) throw new Error(`Nominatim HTTP ${res.status}`);

    const data = await res.json();
    if (data && data.length > 0) {
      const coords = [parseFloat(data[0].lat), parseFloat(data[0].lon)];
      geoCache.set(city, coords);
      return coords;
    }
  } catch (e) {
    console.error(`Geocoding fallito per "${city}":`, e.message);
  }

  const fallback = [41.8719, 12.5674];
  geoCache.set(city, fallback);
  return fallback;
}

async function queryGeo(propertyId, startDate, endDate) {
  if (!startDate || !endDate) return [];
  try {
    const [response] = await dataClient.runReport({
      property: `properties/${propertyId}`,
      dateRanges: [{ startDate, endDate }],
      dimensions: [{ name: 'city' }],
      metrics: [
        { name: 'totalUsers' },
        { name: 'sessions' },
        { name: 'averageSessionDuration' },
      ],
      limit: 50,
    });

    const cityRows = (response?.rows || []).map(row => ({
      city: row.dimensionValues[0].value,
      users: parseInt(row.metricValues[0].value) || 0,
      sessions: parseInt(row.metricValues[1].value) || 0,
      avgDuration: row.metricValues[2].value
        ? formatCityTime(row.metricValues[2].value) : '00:00',
    }));

    const enriched = await Promise.all(
      cityRows.map(async (item) => ({
        ...item,
        position: await geocodeCity(item.city),
      }))
    );

    return enriched;
  } catch (e) {
    console.error('GA4 geo error:', e.message);
    return [];
  }
}

function formatCityTime(s) {
  const sec = Math.floor(Number(s) || 0);
  const mins = Math.floor(sec / 60);
  const rs = sec % 60;
  return `${mins.toString().padStart(2, '0')}:${rs.toString().padStart(2, '0')}`;
}

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const propertyId = searchParams.get('propertyId');
  const startDate = searchParams.get('startDate');
  const endDate = searchParams.get('endDate');
  const prevStartDate = searchParams.get('prevStartDate');
  const prevEndDate = searchParams.get('prevEndDate');

  if (!propertyId || !startDate || !endDate) {
    return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
  }

  const cappedEnd = capDateRange(startDate, endDate);

  const [current, previous] = await Promise.all([
    queryGeo(propertyId, startDate, cappedEnd),
    prevStartDate && prevEndDate
      ? queryGeo(propertyId, prevStartDate, prevEndDate)
      : Promise.resolve(null),
  ]);

  return NextResponse.json({ current, previous });
}
