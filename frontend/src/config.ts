// Toggle this flag to switch between cloud and local development.
// true  = https://molly-app.occachildcare.ca  (deployed server)
// false = http://localhost:8000               (local Django on Mac)
// Set to 'cloud', 'local', or 'lan'
const MODE = 'lan';

const CLOUD_URL = 'https://molly-app.occachildcare.ca';
const LOCAL_URL = 'http://127.0.0.1:8000';
const LAN_URL = 'http://192.168.0.19:8000';

const BASE = MODE === 'cloud' ? CLOUD_URL : MODE === 'lan' ? LAN_URL : LOCAL_URL;

export const API_BASE_URL = `${BASE}/api`;
export const WS_BASE_URL = MODE === 'cloud' ? `wss://molly-app.occachildcare.ca` : MODE === 'lan' ? `ws://192.168.0.19:8000` : `ws://127.0.0.1:8000`;
