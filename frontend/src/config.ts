// Toggle this flag to switch between cloud and local development.
// true  = https://molly-app.occachildcare.ca  (deployed server)
// false = http://localhost:8000               (local Django on Mac)
const USE_CLOUD = true;

const CLOUD_URL = 'https://molly-app.occachildcare.ca';
const LOCAL_URL = 'http://localhost:8000';

const BASE = USE_CLOUD ? CLOUD_URL : LOCAL_URL;

export const API_BASE_URL = `${BASE}/api`;
export const WS_BASE_URL = USE_CLOUD ? `wss://molly-app.occachildcare.ca` : `ws://localhost:8000`;
