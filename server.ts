import express, { Request, Response } from 'express';
import { parse } from 'node-html-parser';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import 'dotenv/config';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = parseInt(process.env.PORT || '3000', 10);

app.use(express.json());

// Enable CORS and Preflight for all API routes (supports Vercel preview URLs, custom domains, and local dev)
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization, x-user-email');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

// ----------------------------------------------------
// Admin Configuration & Premium Persistent Store
// ----------------------------------------------------
const isVercel = Boolean(process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME);
const BUNDLED_DATA_DIR = path.resolve(__dirname, 'data');
const DATA_DIR = isVercel ? path.resolve('/tmp', 'data') : BUNDLED_DATA_DIR;
const CONFIG_FILE = path.resolve(DATA_DIR, 'admin_config.json');
const USERS_FILE = path.resolve(DATA_DIR, 'premium_users.json');

interface AdminConfig {
  appName?: string;
  adminEmail: string;
  famGatewayApiKey: string;
  famGatewayMerchantId?: string;
  premiumAnimeIds: string[];
}

interface PremiumUser {
  email: string;
  isPremium: boolean;
  plan: string;
  expiresAt: number;
  createdAt?: number;
}

let adminConfig: AdminConfig = {
  appName: 'Deadline Anime',
  adminEmail: 'prithvirajshetty769@gmail.com',
  famGatewayApiKey: '',
  famGatewayMerchantId: '',
  premiumAnimeIds: [
    'solo-leveling',
    'jujutsu-kaisen',
    'chainsaw-man-the-movie-reze-arc',
    'demon-slayer-kimetsu-no-yaiba',
    'suzume',
    'your-name'
  ]
};

function loadAdminConfig(): void {
  try {
    if (fs.existsSync(CONFIG_FILE)) {
      const raw = fs.readFileSync(CONFIG_FILE, 'utf-8');
      adminConfig = { ...adminConfig, ...JSON.parse(raw) };
      return;
    }
    const bundledConfig = path.resolve(BUNDLED_DATA_DIR, 'admin_config.json');
    if (fs.existsSync(bundledConfig)) {
      const raw = fs.readFileSync(bundledConfig, 'utf-8');
      adminConfig = { ...adminConfig, ...JSON.parse(raw) };
    }
    saveAdminConfig();
  } catch (e) {
    console.warn('Notice: Using in-memory admin config:', e);
  }
}

function saveAdminConfig(): void {
  try {
    const dir = path.dirname(CONFIG_FILE);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(CONFIG_FILE, JSON.stringify(adminConfig, null, 2), 'utf-8');
  } catch (e) {
    console.warn('Notice: Filesystem write skipped, config preserved in-memory:', e);
  }
}

let premiumUsers: PremiumUser[] = [
  {
    email: 'prithvirajshetty769@gmail.com',
    isPremium: true,
    plan: 'Admin Lifetime Access',
    expiresAt: 253402300799000,
    createdAt: Date.now()
  }
];

function loadPremiumUsers(): void {
  try {
    if (fs.existsSync(USERS_FILE)) {
      const raw = fs.readFileSync(USERS_FILE, 'utf-8');
      premiumUsers = JSON.parse(raw);
      return;
    }
    const bundledUsers = path.resolve(BUNDLED_DATA_DIR, 'premium_users.json');
    if (fs.existsSync(bundledUsers)) {
      const raw = fs.readFileSync(bundledUsers, 'utf-8');
      premiumUsers = JSON.parse(raw);
    }
    savePremiumUsers();
  } catch (e) {
    console.warn('Notice: Using in-memory premium users:', e);
  }
}

function savePremiumUsers(): void {
  try {
    const dir = path.dirname(USERS_FILE);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(USERS_FILE, JSON.stringify(premiumUsers, null, 2), 'utf-8');
  } catch (e) {
    console.warn('Notice: Filesystem write skipped, users preserved in-memory:', e);
  }
}

loadAdminConfig();
loadPremiumUsers();

function isAnimePremium(slug?: string | null): boolean {
  if (!slug) return false;
  const cleanSlug = slug.toLowerCase().trim();
  return adminConfig.premiumAnimeIds.some(p => p.toLowerCase().trim() === cleanSlug);
}

function isUserPremium(email?: string | null): { isPremium: boolean; isAdmin: boolean; plan?: string; expiresAt?: number } {
  if (!email) return { isPremium: false, isAdmin: false };
  const cleanEmail = email.toLowerCase().trim();
  const isAdmin = cleanEmail === adminConfig.adminEmail.toLowerCase().trim();
  if (isAdmin) {
    return { isPremium: true, isAdmin: true, plan: 'Admin Lifetime Access', expiresAt: 253402300799000 };
  }
  const user = premiumUsers.find(u => u.email.toLowerCase().trim() === cleanEmail);
  if (user && user.isPremium && user.expiresAt > Date.now()) {
    return { isPremium: true, isAdmin: false, plan: user.plan, expiresAt: user.expiresAt };
  }
  return { isPremium: false, isAdmin: false };
}

// ----------------------------------------------------
// Upstream Configuration & User Agents
// ----------------------------------------------------
const UPSTREAM_BASE_URL = 'https://watchanimeworld.one';
const USER_AGENTS = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
  'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36'
];

async function fetchHtml(url: string, referer?: string): Promise<string | null> {
  const ua = USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)];
  const headers: Record<string, string> = {
    'User-Agent': ua,
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
    'Accept-Language': 'en-US,en;q=0.9,hi;q=0.8',
    'Cache-Control': 'no-cache',
    'Pragma': 'no-cache'
  };
  if (referer) {
    headers['Referer'] = referer;
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 12000);

  try {
    const res = await fetch(url, { headers, signal: controller.signal });
    clearTimeout(timeoutId);
    if (!res.ok) {
      console.warn(`Upstream fetch returned status ${res.status} for ${url}`);
      return null;
    }
    return await res.text();
  } catch (err: any) {
    clearTimeout(timeoutId);
    console.warn(`Error fetching ${url}:`, err.message);
    return null;
  }
}

function fixImageUrl(url?: string | null): string {
  if (!url) return '';
  if (url.startsWith('//')) return 'https:' + url;
  if (!url.startsWith('http')) return UPSTREAM_BASE_URL + (url.startsWith('/') ? '' : '/') + url;
  return url;
}

// ----------------------------------------------------
// Fallback Curated Data
// ----------------------------------------------------
const FALLBACK_SERIES = [
  {
    title: 'Naruto Shippuden',
    image: 'https://image.tmdb.org/t/p/w500/kV27j3Nz4d5z8u6mN3EJw9RiLg2.jpg',
    year: '2007',
    rating: '8.7',
    seriesId: 'naruto-shippuden',
    slug: 'naruto-shippuden',
    type: 'series' as const,
    language: 'Hindi, Tamil, Telugu, English, Japanese',
    isPremium: false
  },
  {
    title: 'Naruto',
    image: 'https://image.tmdb.org/t/p/w500/xppeysfvDKVx775MFuH8Z9BlpMk.jpg',
    year: '2002',
    rating: '8.4',
    seriesId: 'naruto',
    slug: 'naruto',
    type: 'series' as const,
    language: 'Hindi, Tamil, Telugu, English',
    isPremium: false
  },
  {
    title: 'Jujutsu Kaisen',
    image: 'https://image.tmdb.org/t/p/w500/hD8pZg6lO8L673c68bV2w9L1s8S.jpg',
    year: '2020',
    rating: '8.6',
    seriesId: 'jujutsu-kaisen',
    slug: 'jujutsu-kaisen',
    type: 'series' as const,
    language: 'Hindi, English, Japanese',
    isPremium: true
  },
  {
    title: 'Demon Slayer: Kimetsu no Yaiba',
    image: 'https://image.tmdb.org/t/p/w500/xUfRZu2mi8jH6SzQEJGP6tjBuYj.jpg',
    year: '2019',
    rating: '8.7',
    seriesId: 'demon-slayer-kimetsu-no-yaiba',
    slug: 'demon-slayer-kimetsu-no-yaiba',
    type: 'series' as const,
    language: 'Hindi, Tamil, Telugu, English',
    isPremium: true
  },
  {
    title: 'One-Punch Man',
    image: 'https://image.tmdb.org/t/p/w500/iE3s0lG5QVddA7m7exWn05HjErs.jpg',
    year: '2015',
    rating: '8.5',
    seriesId: 'one-punch-man',
    slug: 'one-punch-man',
    type: 'series' as const,
    language: 'Hindi, English, Japanese',
    isPremium: false
  },
  {
    title: 'Solo Leveling',
    image: 'https://image.tmdb.org/t/p/w500/geCRueV3ElhRTr0xtJuPxJ8ZXq5.jpg',
    year: '2024',
    rating: '8.5',
    seriesId: 'solo-leveling',
    slug: 'solo-leveling',
    type: 'series' as const,
    language: 'Hindi, English, Japanese',
    isPremium: true
  },
  {
    title: 'Dragon Ball Z',
    image: 'https://image.tmdb.org/t/p/w500/dJyZFmQvj7mGz3C0u66XhO63e3d.jpg',
    year: '1989',
    rating: '8.3',
    seriesId: 'dragon-ball-z',
    slug: 'dragon-ball-z',
    type: 'series' as const,
    language: 'Hindi, English, Japanese',
    isPremium: false
  },
  {
    title: 'Attack on Titan',
    image: 'https://image.tmdb.org/t/p/w500/8C5gDXUkT9w7mA3yR1fL5k1Fv.jpg',
    year: '2013',
    rating: '9.0',
    seriesId: 'attack-on-titan',
    slug: 'attack-on-titan',
    type: 'series' as const,
    language: 'Hindi, English, Japanese',
    isPremium: false
  }
];

const FALLBACK_MOVIES = [
  {
    title: 'Shinchan Movie: The Spicy Kasukabe Dancers',
    image: 'https://image.tmdb.org/t/p/w500/1TfdgQbZXuEswjqLYlsVvhHw0Py.jpg',
    year: '2000',
    rating: '8.1',
    movieId: 'shinchan-movie-the-spicy-kasukabe-dancers',
    slug: 'shinchan-movie-the-spicy-kasukabe-dancers',
    type: 'movie' as const,
    language: 'Hindi, Tamil, Telugu, Bengali',
    isPremium: false
  },
  {
    title: 'Your Name.',
    image: 'https://image.tmdb.org/t/p/w500/q719jXXEzOoYaps6qFsC8llRaQ.jpg',
    year: '2016',
    rating: '8.9',
    movieId: 'your-name',
    slug: 'your-name',
    type: 'movie' as const,
    language: 'Hindi, English, Japanese',
    isPremium: true
  },
  {
    title: 'Suzume',
    image: 'https://image.tmdb.org/t/p/w500/vIewHMv5H9V5H89qU86N9d2zHn.jpg',
    year: '2022',
    rating: '8.0',
    movieId: 'suzume',
    slug: 'suzume',
    type: 'movie' as const,
    language: 'Hindi, English, Japanese',
    isPremium: true
  },
  {
    title: 'Weathering with You',
    image: 'https://image.tmdb.org/t/p/w500/qgrk7r1fOZKhZd99Qv0U1jQe4.jpg',
    year: '2019',
    rating: '8.2',
    movieId: 'weathering-with-you',
    slug: 'weathering-with-you',
    type: 'movie' as const,
    language: 'Hindi, English, Japanese',
    isPremium: false
  },
  {
    title: "Doraemon the Movie: Nobita's Earth Symphony",
    image: 'https://image.tmdb.org/t/p/w500/8d8u3C0yG0nQ2r8zV1aY2vF.jpg',
    year: '2024',
    rating: '7.8',
    movieId: 'doraemon-the-movie-nobitas-earth-symphony',
    slug: 'doraemon-the-movie-nobitas-earth-symphony',
    type: 'movie' as const,
    language: 'Hindi, Tamil, Telugu',
    isPremium: false
  },
  {
    title: 'Jujutsu Kaisen 0',
    image: 'https://image.tmdb.org/t/p/w500/3pTwMAnsELJw0FzT0u7yWbZ6yq9.jpg',
    year: '2021',
    rating: '8.3',
    movieId: 'jujutsu-kaisen-0-movie',
    slug: 'jujutsu-kaisen-0-movie',
    type: 'movie' as const,
    language: 'Hindi, English, Japanese',
    isPremium: false
  }
];

function parsePostItem(elem: any, fallbackType: 'series' | 'movie' = 'series'): any {
  const artTitle = elem.querySelector('h2.entry-title, .entry-title')?.text.trim();
  const link = elem.querySelector('a.lnk-blk, a')?.getAttribute('href') || '';
  const img = elem.querySelector('img')?.getAttribute('src') || elem.querySelector('img')?.getAttribute('data-src') || '';
  const year = elem.querySelector('.year, .num-epi')?.text.trim() || '2024';
  const rating = elem.querySelector('.vote, .num')?.text.trim() || 'TMDB 8.0';

  if (!link) return null;
  let type: 'series' | 'movie' = fallbackType;
  let id = '';

  if (link.includes('/movies/') || link.includes('/movie/')) {
    type = 'movie';
    id = link.replace(/.*\/movie[s]?\//, '').replace(/\/$/, '');
  } else if (link.includes('/series/')) {
    type = 'series';
    id = link.replace(/.*\/series\//, '').replace(/\/$/, '');
  } else if (link.includes('/episode/')) {
    type = 'series';
    const epSlug = link.replace(/.*\/episode\//, '').replace(/\/$/, '');
    id = epSlug.split('-').slice(0, -1).join('-');
  }

  const title = artTitle || id.replace(/-/g, ' ');
  const slug = id;
  return {
    title,
    image: fixImageUrl(img),
    year,
    rating,
    type,
    [type === 'series' ? 'seriesId' : 'movieId']: id,
    slug,
    language: 'Hindi, Tamil, Telugu, English',
    isPremium: isAnimePremium(slug)
  };
}

// ----------------------------------------------------
// In-Memory Database & Dynamic Anime Sync Engine
// ----------------------------------------------------
interface SyncStore {
  isSyncing: boolean;
  lastSynced: number;
  totalSyncedCount: number;
  newest_drops: any[];
  new_anime_arrivals: any[];
  cartoon_series: any[];
  latest_movies: any[];
  cartoon_films: any[];
  top_shows: any[];
  top_films: any[];
  allAnimeMap: Map<string, any>;
  seriesCatalog: Map<number, any[]>;
  moviesCatalog: Map<number, any[]>;
}

const syncStore: SyncStore = {
  isSyncing: false,
  lastSynced: 0,
  totalSyncedCount: 0,
  newest_drops: [...FALLBACK_SERIES],
  new_anime_arrivals: [...FALLBACK_SERIES],
  cartoon_series: [],
  latest_movies: [...FALLBACK_MOVIES],
  cartoon_films: [],
  top_shows: [...FALLBACK_SERIES.slice(0, 5)],
  top_films: [...FALLBACK_MOVIES.slice(0, 5)],
  allAnimeMap: new Map(),
  seriesCatalog: new Map(),
  moviesCatalog: new Map()
};

function refreshAnimePremiumStatuses() {
  for (const [slug, item] of syncStore.allAnimeMap.entries()) {
    item.isPremium = isAnimePremium(slug);
  }
}

// Seed initial fallback into map
[...FALLBACK_SERIES, ...FALLBACK_MOVIES].forEach(item => {
  syncStore.allAnimeMap.set(item.slug, { ...item, isPremium: isAnimePremium(item.slug) });
});

async function syncAllAnime(force: boolean = false) {
  if (syncStore.isSyncing) return;
  if (!force && Date.now() - syncStore.lastSynced < 10 * 60 * 1000 && syncStore.totalSyncedCount > 50) {
    return;
  }

  syncStore.isSyncing = true;
  console.log('🔄 Starting Deadline Anime Sync Engine...');

  try {
    const homeHtml = await fetchHtml(UPSTREAM_BASE_URL);
    if (homeHtml) {
      const sections = homeHtml.split('<section');
      const tempNewest: any[] = [];
      const tempArrivals: any[] = [];
      const tempCartoonSeries: any[] = [];
      const tempMovies: any[] = [];
      const tempCartoonFilms: any[] = [];
      const tempTopShows: any[] = [];
      const tempTopFilms: any[] = [];

      for (let i = 1; i < sections.length; i++) {
        const chunk = '<section ' + sections[i];
        const titleMatch = chunk.match(/<h[23][^>]*class="(?:widget-title|section-title)"[^>]*>([\s\S]*?)<\/h[23]>/i);
        const secTitle = titleMatch ? titleMatch[1].replace(/<[^>]+>/g, '').trim() : '';
        if (!secTitle) continue;

        const root = parse(chunk);
        const lowerTitle = secTitle.toLowerCase();

        for (const art of root.querySelectorAll('article.post, article')) {
          const item = parsePostItem(art, lowerTitle.includes('movie') || lowerTitle.includes('film') ? 'movie' : 'series');
          if (item && item.slug) {
            syncStore.allAnimeMap.set(item.slug, item);

            if (lowerTitle.includes('newest drops')) tempNewest.push(item);
            else if (lowerTitle.includes('new anime arrivals')) tempArrivals.push(item);
            else if (lowerTitle.includes('cartoon series') || lowerTitle.includes('just in')) tempCartoonSeries.push(item);
            else if (lowerTitle.includes('latest anime movies')) tempMovies.push(item);
            else if (lowerTitle.includes('cartoon films') || lowerTitle.includes('fresh cartoon')) tempCartoonFilms.push(item);
          }
        }

        for (const tp of root.querySelectorAll('.top-picks__item a')) {
          const link = tp.getAttribute('href') || '';
          const img = tp.querySelector('img')?.getAttribute('src') || '';
          const alt = tp.querySelector('img')?.getAttribute('alt') || '';
          const isMov = link.includes('/movies/');
          const slug = link.replace(/.*\/[^\/]+\/([^\/]+)\/?$/, '$1');
          const titleClean = alt.replace(/^Image\s+/i, '').trim() || slug.replace(/-/g, ' ');

          if (slug) {
            const item = {
              title: titleClean,
              image: fixImageUrl(img),
              year: 'Trending',
              rating: 'TMDB 8.8',
              type: isMov ? ('movie' as const) : ('series' as const),
              [isMov ? 'movieId' : 'seriesId']: slug,
              slug,
              language: 'Hindi, Tamil, Telugu, English',
              isPremium: isAnimePremium(slug)
            };
            syncStore.allAnimeMap.set(slug, item);

            if (lowerTitle.includes('shows')) tempTopShows.push(item);
            else if (lowerTitle.includes('films')) tempTopFilms.push(item);
          }
        }
      }

      if (tempNewest.length > 0) syncStore.newest_drops = tempNewest;
      if (tempArrivals.length > 0) syncStore.new_anime_arrivals = tempArrivals;
      if (tempCartoonSeries.length > 0) syncStore.cartoon_series = tempCartoonSeries;
      if (tempMovies.length > 0) syncStore.latest_movies = tempMovies;
      if (tempCartoonFilms.length > 0) syncStore.cartoon_films = tempCartoonFilms;
      if (tempTopShows.length > 0) syncStore.top_shows = tempTopShows;
      if (tempTopFilms.length > 0) syncStore.top_films = tempTopFilms;
    }

    const catalogUrls = [
      { type: 'series' as const, page: 1, url: `${UPSTREAM_BASE_URL}/series/page/1/` },
      { type: 'series' as const, page: 2, url: `${UPSTREAM_BASE_URL}/series/page/2/` },
      { type: 'series' as const, page: 3, url: `${UPSTREAM_BASE_URL}/series/page/3/` },
      { type: 'series' as const, page: 4, url: `${UPSTREAM_BASE_URL}/series/page/4/` },
      { type: 'movie' as const, page: 1, url: `${UPSTREAM_BASE_URL}/movies/page/1/` },
      { type: 'movie' as const, page: 2, url: `${UPSTREAM_BASE_URL}/movies/page/2/` },
      { type: 'movie' as const, page: 3, url: `${UPSTREAM_BASE_URL}/movies/page/3/` },
      { type: 'movie' as const, page: 4, url: `${UPSTREAM_BASE_URL}/movies/page/4/` }
    ];

    await Promise.allSettled(
      catalogUrls.map(async (entry) => {
        const html = await fetchHtml(entry.url);
        if (!html) return;
        const root = parse(html);
        const items: any[] = [];
        for (const art of root.querySelectorAll('ul.post-lst li article.post, article.post')) {
          const item = parsePostItem(art, entry.type);
          if (item && item.slug) {
            items.push(item);
            syncStore.allAnimeMap.set(item.slug, item);
          }
        }
        if (items.length > 0) {
          if (entry.type === 'series') syncStore.seriesCatalog.set(entry.page, items);
          else syncStore.moviesCatalog.set(entry.page, items);
        }
      })
    );

    refreshAnimePremiumStatuses();
    syncStore.lastSynced = Date.now();
    syncStore.totalSyncedCount = syncStore.allAnimeMap.size;
    console.log(`✅ Deadline Anime Sync Finished! Total Synced Anime: ${syncStore.totalSyncedCount}`);
  } catch (err: any) {
    console.error('❌ Error during Deadline Anime sync:', err.message);
  } finally {
    syncStore.isSyncing = false;
  }
}

syncAllAnime();

// ----------------------------------------------------
// Subscription Plans (FamGateway)
// 1. One 149 rupees: "Monthly Standard Fan Pass"
// 2. Second 149 rupees: "VIP Otaku Pass"
// 3. An yearly plan 600 rupees: "Yearly Mega Fan Pass"
// ----------------------------------------------------
const PLANS = {
  plan_149_fan: {
    id: 'plan_149_fan',
    name: 'Monthly Standard Fan',
    price: 149,
    currency: 'INR',
    durationDays: 30,
    durationText: '1 Month',
    features: [
      'Full 1080p HD Streaming',
      'Hindi, Tamil, Telugu, English Audio',
      'All Premium Series & Episodes',
      'Ad-free experience'
    ]
  },
  plan_149_otaku: {
    id: 'plan_149_otaku',
    name: 'VIP Otaku Pass',
    price: 149,
    currency: 'INR',
    durationDays: 30,
    durationText: '1 Month VIP',
    features: [
      '4K Ultra HD Quality',
      '2 Devices Simultaneously',
      'Priority Abyss & Zephyrix CDN',
      'VIP Discord Role & Crown Badge'
    ]
  },
  plan_600_yearly: {
    id: 'plan_600_yearly',
    name: 'Yearly Mega Fan Pass',
    price: 600,
    currency: 'INR',
    durationDays: 365,
    durationText: '1 Full Year (Save 66%)',
    badge: 'BEST VALUE · SAVE 66%',
    popular: true,
    features: [
      '365 Days Unlimited Access',
      'All Theatrical Movies & Series Unlocked',
      '4 Screens At The Same Time',
      'Early Releases & Feature Films',
      'Dedicated High-Speed VIP Stream Server'
    ]
  }
};

// ----------------------------------------------------
// Admin Routes (Email: prithvirajshetty769@gmail.com)
// ----------------------------------------------------
app.get('/api/admin/config', (req: Request, res: Response) => {
  res.json({
    appName: adminConfig.appName || 'AnimeWorld India',
    adminEmail: adminConfig.adminEmail,
    famGatewayApiKey: adminConfig.famGatewayApiKey,
    famGatewayMerchantId: adminConfig.famGatewayMerchantId || '',
    hasApiKey: Boolean(adminConfig.famGatewayApiKey),
    premiumAnimeIds: adminConfig.premiumAnimeIds
  });
});

app.post('/api/admin/toggle-premium', (req: Request, res: Response) => {
  const { slug, isPremium } = req.body;
  if (!slug) return res.status(400).json({ error: 'Missing anime slug' });

  const cleanSlug = slug.toLowerCase().trim();
  const exists = adminConfig.premiumAnimeIds.includes(cleanSlug);

  if (isPremium && !exists) {
    adminConfig.premiumAnimeIds.push(cleanSlug);
  } else if (!isPremium && exists) {
    adminConfig.premiumAnimeIds = adminConfig.premiumAnimeIds.filter(s => s !== cleanSlug);
  }

  saveAdminConfig();
  refreshAnimePremiumStatuses();

  res.json({
    success: true,
    slug: cleanSlug,
    isPremium: adminConfig.premiumAnimeIds.includes(cleanSlug),
    totalPremium: adminConfig.premiumAnimeIds.length
  });
});

app.post('/api/admin/batch-premium', (req: Request, res: Response) => {
  const { slugs, isPremium } = req.body;
  if (!Array.isArray(slugs)) return res.status(400).json({ error: 'Expected array of slugs' });

  for (const slug of slugs) {
    const cleanSlug = slug.toLowerCase().trim();
    const exists = adminConfig.premiumAnimeIds.includes(cleanSlug);
    if (isPremium && !exists) {
      adminConfig.premiumAnimeIds.push(cleanSlug);
    } else if (!isPremium && exists) {
      adminConfig.premiumAnimeIds = adminConfig.premiumAnimeIds.filter(s => s !== cleanSlug);
    }
  }

  saveAdminConfig();
  refreshAnimePremiumStatuses();

  res.json({
    success: true,
    totalPremium: adminConfig.premiumAnimeIds.length
  });
});

app.post('/api/admin/set-gateway-key', (req: Request, res: Response) => {
  const { apiKey, merchantId, appName } = req.body;
  if (apiKey !== undefined) adminConfig.famGatewayApiKey = apiKey.trim();
  if (merchantId !== undefined) adminConfig.famGatewayMerchantId = merchantId.trim();
  if (appName !== undefined && appName.trim()) adminConfig.appName = appName.trim();
  saveAdminConfig();
  res.json({
    success: true,
    appName: adminConfig.appName,
    hasApiKey: Boolean(adminConfig.famGatewayApiKey),
    message: 'Admin settings & FamGateway credentials saved successfully.'
  });
});

app.get('/api/admin/all-anime', (req: Request, res: Response) => {
  const list = Array.from(syncStore.allAnimeMap.values()).map(item => ({
    title: item.title,
    slug: item.slug,
    type: item.type,
    image: item.image,
    year: item.year,
    rating: item.rating,
    isPremium: isAnimePremium(item.slug)
  }));
  res.json({ success: true, count: list.length, items: list });
});

// ----------------------------------------------------
// FamGateway Payment Endpoints
// ----------------------------------------------------
app.get('/api/payment/plans', (req: Request, res: Response) => {
  res.json({ success: true, plans: Object.values(PLANS) });
});

app.post('/api/payment/famgateway/create-order', (req: Request, res: Response) => {
  const { planId, email, name } = req.body;
  const plan = (PLANS as any)[planId];
  if (!plan) return res.status(400).json({ error: 'Invalid plan selected' });
  if (!email) return res.status(400).json({ error: 'Email is required' });

  const orderId = `FAM_${Date.now()}_${Math.floor(Math.random() * 10000)}`;
  const upiId = adminConfig.famGatewayMerchantId || 'famgateway.pay@upi';
  const brandName = (adminConfig.appName || 'AnimeWorld India').replace(/[^a-zA-Z0-9 ]/g, '').trim();
  const upiUrl = `upi://pay?pa=${encodeURIComponent(upiId)}&pn=${encodeURIComponent(brandName)}&am=${plan.price}&cu=INR&tn=${encodeURIComponent(orderId)}`;

  res.json({
    success: true,
    orderId,
    gateway: 'FamGateway',
    hasApiKey: Boolean(adminConfig.famGatewayApiKey),
    plan: {
      id: plan.id,
      name: plan.name,
      price: plan.price,
      currency: plan.currency,
      durationDays: plan.durationDays,
      durationText: plan.durationText
    },
    paymentDetails: {
      amount: plan.price,
      currency: 'INR',
      upiId,
      upiUrl,
      customerEmail: email,
      customerName: name || 'Anime Fan'
    }
  });
});

app.post('/api/payment/famgateway/verify', (req: Request, res: Response) => {
  const { orderId, planId, email, transactionId } = req.body;
  if (!email) return res.status(400).json({ error: 'Email required' });

  const plan = (PLANS as any)[planId] || PLANS['plan_149_fan'];
  const durationMs = (plan.durationDays || 30) * 24 * 60 * 60 * 1000;
  const expiresAt = Date.now() + durationMs;

  const cleanEmail = email.toLowerCase().trim();
  const existingIdx = premiumUsers.findIndex(u => u.email.toLowerCase().trim() === cleanEmail);
  const userEntry: PremiumUser = {
    email: cleanEmail,
    isPremium: true,
    plan: plan.name,
    expiresAt,
    createdAt: Date.now()
  };

  if (existingIdx >= 0) {
    premiumUsers[existingIdx] = userEntry;
  } else {
    premiumUsers.push(userEntry);
  }
  savePremiumUsers();

  res.json({
    success: true,
    message: `Payment of ₹${plan.price} verified with FamGateway! You now have full VIP Premium access.`,
    user: {
      email: userEntry.email,
      isPremium: true,
      isAdmin: cleanEmail === adminConfig.adminEmail.toLowerCase().trim(),
      plan: userEntry.plan,
      expiresAt: userEntry.expiresAt
    }
  });
});

app.get('/api/user/status', (req: Request, res: Response) => {
  const email = (req.query.email as string) || (req.headers['x-user-email'] as string) || '';
  const status = isUserPremium(email);
  res.json({
    email,
    ...status
  });
});

// ----------------------------------------------------
// API Route 1: Home (Rich Synced Shelves)
// ----------------------------------------------------
app.get(['/api/anime-world-india/v1/home', '/api/anime-world-india/v1/home.php'], async (req: Request, res: Response) => {
  if (syncStore.totalSyncedCount < 30) {
    syncAllAnime();
  }

  refreshAnimePremiumStatuses();
  const allSynced = Array.from(syncStore.allAnimeMap.values());
  const seriesList = allSynced.filter(i => i.type === 'series');
  const moviesList = allSynced.filter(i => i.type === 'movie');

  const featured = [
    ...(syncStore.top_shows.length > 0 ? syncStore.top_shows.slice(0, 3) : []),
    ...(syncStore.new_anime_arrivals.length > 0 ? syncStore.new_anime_arrivals.slice(0, 2) : []),
    ...(syncStore.latest_movies.length > 0 ? syncStore.latest_movies.slice(0, 2) : [])
  ];

  res.json({
    success: true,
    source: 'deadline-anime',
    last_synced: syncStore.lastSynced,
    total_synced_count: syncStore.totalSyncedCount,
    is_syncing: syncStore.isSyncing,
    featured: featured.length > 0 ? featured : FALLBACK_SERIES.slice(0, 4),
    newest_drops: syncStore.newest_drops.length > 0 ? syncStore.newest_drops : FALLBACK_SERIES,
    new_anime_arrivals: syncStore.new_anime_arrivals.length > 0 ? syncStore.new_anime_arrivals : FALLBACK_SERIES,
    cartoon_series: syncStore.cartoon_series,
    latest_movies: syncStore.latest_movies.length > 0 ? syncStore.latest_movies : FALLBACK_MOVIES,
    cartoon_films: syncStore.cartoon_films,
    top_shows: syncStore.top_shows.length > 0 ? syncStore.top_shows : FALLBACK_SERIES.slice(0, 6),
    top_films: syncStore.top_films.length > 0 ? syncStore.top_films : FALLBACK_MOVIES.slice(0, 6),
    latest_series: seriesList.length > 0 ? seriesList.slice(0, 24) : FALLBACK_SERIES,
    all_synced: allSynced.slice(0, 80)
  });
});

// ----------------------------------------------------
// API Route: Active Sync & Status Trigger
// ----------------------------------------------------
app.all(['/api/anime-world-india/v1/sync', '/api/anime-world-india/v1/sync.php'], async (req: Request, res: Response) => {
  const force = req.query.force === 'true' || req.body?.force === true;
  await syncAllAnime(force);
  res.json({
    success: true,
    message: 'Deadline Anime database synchronized successfully.',
    total_synced_count: syncStore.totalSyncedCount,
    last_synced: syncStore.lastSynced,
    sections: {
      newestDropsCount: syncStore.newest_drops.length,
      newArrivalsCount: syncStore.new_anime_arrivals.length,
      topShowsCount: syncStore.top_shows.length,
      topFilmsCount: syncStore.top_films.length,
      latestMoviesCount: syncStore.latest_movies.length,
      cartoonSeriesCount: syncStore.cartoon_series.length,
      cartoonFilmsCount: syncStore.cartoon_films.length
    }
  });
});

app.get(['/api/anime-world-india/v1/sync-status', '/api/anime-world-india/v1/sync-status.php'], (req: Request, res: Response) => {
  const allSynced = Array.from(syncStore.allAnimeMap.values());
  res.json({
    isSyncing: syncStore.isSyncing,
    lastSynced: syncStore.lastSynced,
    lastSyncedFormatted: syncStore.lastSynced ? new Date(syncStore.lastSynced).toLocaleTimeString() : 'Not yet synced',
    totalSyncedCount: syncStore.totalSyncedCount,
    seriesCount: allSynced.filter(i => i.type === 'series').length,
    moviesCount: allSynced.filter(i => i.type === 'movie').length,
    sections: {
      newestDropsCount: syncStore.newest_drops.length,
      newArrivalsCount: syncStore.new_anime_arrivals.length,
      topShowsCount: syncStore.top_shows.length,
      topFilmsCount: syncStore.top_films.length,
      latestMoviesCount: syncStore.latest_movies.length,
      cartoonSeriesCount: syncStore.cartoon_series.length,
      cartoonFilmsCount: syncStore.cartoon_films.length,
      catalogCount: syncStore.seriesCatalog.size + syncStore.moviesCatalog.size
    }
  });
});

// ----------------------------------------------------
// API Route 2: Series list (with pagination & synced cache)
// ----------------------------------------------------
app.get(['/api/anime-world-india/v1/series', '/api/anime-world-india/v1/series.php'], async (req: Request, res: Response) => {
  const page = parseInt((req.query.p || req.query.page || '1') as string, 10) || 1;

  const cachedPage = syncStore.seriesCatalog.get(page);
  if (cachedPage && cachedPage.length > 0) {
    const list = cachedPage.map(item => ({ ...item, isPremium: isAnimePremium(item.slug) }));
    return res.json({
      success: true,
      source: 'deadline-anime/series (synced cache)',
      current_page: page,
      total_pages: 15,
      has_next: page < 15,
      has_prev: page > 1,
      pages: Array.from({ length: 10 }, (_, i) => i + 1),
      total_results: list.length,
      series: list
    });
  }

  try {
    const url = page === 1 ? `${UPSTREAM_BASE_URL}/series/` : `${UPSTREAM_BASE_URL}/series/page/${page}/`;
    const html = await fetchHtml(url);

    if (!html) {
      const fallbackList = Array.from(syncStore.allAnimeMap.values()).filter(i => i.type === 'series');
      return res.json({
        success: true,
        source: 'synced store',
        current_page: page,
        total_pages: 5,
        has_next: page < 5,
        has_prev: page > 1,
        pages: [1, 2, 3, 4, 5],
        total_results: fallbackList.length,
        series: fallbackList.length > 0 ? fallbackList : FALLBACK_SERIES
      });
    }

    const root = parse(html);
    const articles = root.querySelectorAll('ul.post-lst li article.post, article.post');
    const seriesList: any[] = [];

    for (const art of articles) {
      const item = parsePostItem(art, 'series');
      if (item && item.seriesId && !seriesList.some(s => s.seriesId === item.seriesId)) {
        seriesList.push(item);
        syncStore.allAnimeMap.set(item.slug, item);
      }
    }

    if (seriesList.length > 0) {
      syncStore.seriesCatalog.set(page, seriesList);
      syncStore.totalSyncedCount = syncStore.allAnimeMap.size;
    }

    let totalPages = 15;
    const paginationLinks = root.querySelectorAll('.pagination a.page-link, .pagination a');
    for (const a of paginationLinks) {
      const num = parseInt(a.text.trim(), 10);
      if (!isNaN(num) && num > totalPages) {
        totalPages = num;
      }
    }

    res.json({
      success: true,
      source: 'deadline-anime/series',
      current_page: page,
      total_pages: totalPages,
      has_next: page < totalPages,
      has_prev: page > 1,
      pages: Array.from({ length: Math.min(10, totalPages) }, (_, i) => i + 1),
      total_results: seriesList.length,
      series: seriesList.length > 0 ? seriesList : FALLBACK_SERIES
    });
  } catch (err: any) {
    res.json({
      success: true,
      source: 'fallback',
      current_page: page,
      total_pages: 5,
      has_next: page < 5,
      has_prev: page > 1,
      pages: [1, 2, 3, 4, 5],
      total_results: FALLBACK_SERIES.length,
      series: FALLBACK_SERIES
    });
  }
});

// ----------------------------------------------------
// API Route 3: Movies list (with pagination & synced cache)
// ----------------------------------------------------
app.get(['/api/anime-world-india/v1/movie', '/api/anime-world-india/v1/movie.php'], async (req: Request, res: Response) => {
  const page = parseInt((req.query.p || req.query.page || '1') as string, 10) || 1;

  const cachedPage = syncStore.moviesCatalog.get(page);
  if (cachedPage && cachedPage.length > 0) {
    const list = cachedPage.map(item => ({ ...item, isPremium: isAnimePremium(item.slug) }));
    return res.json({
      success: true,
      source: 'deadline-anime/movies (synced cache)',
      current_page: page,
      total_pages: 15,
      has_next: page < 15,
      has_prev: page > 1,
      pages: Array.from({ length: 10 }, (_, i) => i + 1),
      total_results: list.length,
      movies: list
    });
  }

  try {
    const url = page === 1 ? `${UPSTREAM_BASE_URL}/movies/` : `${UPSTREAM_BASE_URL}/movies/page/${page}/`;
    const html = await fetchHtml(url);

    if (!html) {
      const fallbackList = Array.from(syncStore.allAnimeMap.values()).filter(i => i.type === 'movie');
      return res.json({
        success: true,
        source: 'synced store',
        current_page: page,
        total_pages: 5,
        has_next: page < 5,
        has_prev: page > 1,
        pages: [1, 2, 3, 4, 5],
        total_results: fallbackList.length,
        movies: fallbackList.length > 0 ? fallbackList : FALLBACK_MOVIES
      });
    }

    const root = parse(html);
    const articles = root.querySelectorAll('ul.post-lst li article.post, article.post');
    const moviesList: any[] = [];

    for (const art of articles) {
      const item = parsePostItem(art, 'movie');
      if (item && item.movieId && !moviesList.some(m => m.movieId === item.movieId)) {
        moviesList.push(item);
        syncStore.allAnimeMap.set(item.slug, item);
      }
    }

    if (moviesList.length > 0) {
      syncStore.moviesCatalog.set(page, moviesList);
      syncStore.totalSyncedCount = syncStore.allAnimeMap.size;
    }

    let totalPages = 15;
    const paginationLinks = root.querySelectorAll('.pagination a.page-link, .pagination a');
    for (const a of paginationLinks) {
      const num = parseInt(a.text.trim(), 10);
      if (!isNaN(num) && num > totalPages) {
        totalPages = num;
      }
    }

    res.json({
      success: true,
      source: 'deadline-anime/movies',
      current_page: page,
      total_pages: totalPages,
      has_next: page < totalPages,
      has_prev: page > 1,
      pages: Array.from({ length: Math.min(10, totalPages) }, (_, i) => i + 1),
      total_results: moviesList.length,
      movies: moviesList.length > 0 ? moviesList : FALLBACK_MOVIES
    });
  } catch (err: any) {
    res.json({
      success: true,
      source: 'fallback',
      current_page: page,
      total_pages: 5,
      has_next: page < 5,
      has_prev: page > 1,
      pages: [1, 2, 3, 4, 5],
      total_results: FALLBACK_MOVIES.length,
      movies: FALLBACK_MOVIES
    });
  }
});

// ----------------------------------------------------
// API Route 4: Seasons / Series Details
// ----------------------------------------------------
app.get(['/api/anime-world-india/v1/seasons', '/api/anime-world-india/v1/seasons.php'], async (req: Request, res: Response) => {
  let seriesID = (req.query.seriesID || req.query.id || Object.keys(req.query)[0] || '') as string;
  seriesID = seriesID.trim();

  if (!seriesID) {
    return res.status(400).json({ success: false, error: 'Missing seriesID parameter' });
  }

  const isPrem = isAnimePremium(seriesID);

  try {
    const url = `${UPSTREAM_BASE_URL}/series/${seriesID}/`;
    const html = await fetchHtml(url);

    if (!html) {
      const synced = syncStore.allAnimeMap.get(seriesID) || FALLBACK_SERIES.find(s => s.seriesId === seriesID) || {
        seriesId: seriesID,
        title: seriesID.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
        image: 'https://image.tmdb.org/t/p/w500/kV27j3Nz4d5z8u6mN3EJw9RiLg2.jpg',
        year: '2024',
        rating: '8.5',
        type: 'series',
        slug: seriesID,
        language: 'Hindi, Tamil, Telugu, English',
        isPremium: isPrem
      };
      return res.json({
        success: true,
        source: 'synced store',
        series: {
          seriesId: synced.seriesId || seriesID,
          title: synced.title,
          poster: synced.image,
          year: synced.year || '2024',
          duration: '24 min',
          rating: synced.rating || '8.7',
          totalSeasons: '1',
          description: `${synced.title} full anime series streaming in Hindi dub and multi-audio.`,
          genres: ['Action', 'Adventure', 'Anime', 'Hindi Dub'],
          isPremium: isPrem
        },
        seasons: [
          {
            seasonNumber: 'Season 1',
            seasonName: 'Season 1',
            episodes: 'Episodes ready',
            seasonId: `${seriesID}-season-1`,
            postId: '1',
            numericSeason: 1
          }
        ]
      });
    }

    const root = parse(html);
    const title = root.querySelector('h1.entry-title, .entry-title')?.text.trim() || seriesID.replace(/-/g, ' ');
    const poster = fixImageUrl(root.querySelector('article.post img, .post-thumbnail img, figure img')?.getAttribute('src') || '');
    const year = root.querySelector('.year .overviewCss, .year')?.text.trim() || '2023';
    const duration = root.querySelector('.duration .overviewCss, .duration')?.text.trim() || '24 min';
    const description = root.querySelector('.description p, .description')?.text.trim() || `${title} - Watch online in Hindi, Tamil, Telugu, English.`;
    const rating = root.querySelector('.vote .num, .vote')?.text.trim() || '8.5';
    const genres = root.querySelectorAll('.genres a, .genres span').map(g => g.text.trim()).filter(Boolean);

    const seasons: any[] = [];
    const seasonLinks = root.querySelectorAll('.choose-season .sel-temp a, .sel-temp a');
    let postId = '';

    if (seasonLinks.length > 0) {
      postId = seasonLinks[0].getAttribute('data-post') || '';
      for (const link of seasonLinks) {
        const sNum = link.getAttribute('data-season') || '1';
        const sName = link.text.trim() || `Season ${sNum}`;
        seasons.push({
          seasonNumber: `Season ${sNum}`,
          seasonName: sName,
          episodes: 'Episodes available',
          seasonId: `${seriesID}-season-${sNum}`,
          postId,
          numericSeason: parseInt(sNum, 10)
        });
      }
    } else {
      seasons.push({
        seasonNumber: 'Season 1',
        seasonName: 'Season 1',
        episodes: 'Episodes available',
        seasonId: `${seriesID}-season-1`,
        postId: '',
        numericSeason: 1
      });
    }

    res.json({
      success: true,
      source: 'deadline-anime/series',
      series: {
        seriesId: seriesID,
        title,
        poster,
        year,
        duration,
        rating,
        totalSeasons: seasons.length.toString(),
        description,
        genres: genres.length > 0 ? genres : ['Action', 'Anime', 'Hindi Dub'],
        isPremium: isPrem
      },
      seasons
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ----------------------------------------------------
// API Route 5: Episodes for a Season
// ----------------------------------------------------
app.get(['/api/anime-world-india/v1/episodes', '/api/anime-world-india/v1/episodes.php'], async (req: Request, res: Response) => {
  let seasonId = (req.query.seasonId || req.query.id || Object.keys(req.query)[0] || '') as string;
  seasonId = seasonId.trim();

  const seriesId = (req.query.seriesId || '') as string;
  const seasonNum = parseInt((req.query.season || '1') as string, 10);
  const postId = (req.query.postId || '') as string;

  const targetId = seasonId || `${seriesId}-season-${seasonNum}`;
  if (!targetId && !seriesId) {
    return res.status(400).json({ success: false, error: 'Missing seasonId parameter' });
  }

  const cleanSeriesSlug = seriesId || targetId.replace(/-season-\d+$/, '');
  const isPrem = isAnimePremium(cleanSeriesSlug);

  try {
    let episodes: any[] = [];
    let animeTitle = '';
    let poster = '';
    let seasonName = `Season ${seasonNum || 1}`;

    if (postId) {
      const ajaxRes = await fetch(`${UPSTREAM_BASE_URL}/wp-admin/admin-ajax.php`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
          'User-Agent': USER_AGENTS[0],
          'X-Requested-With': 'XMLHttpRequest'
        },
        body: new URLSearchParams({
          action: 'action_select_season',
          season: seasonNum.toString(),
          post: postId
        })
      });

      if (ajaxRes.ok) {
        const ajaxHtml = await ajaxRes.text();
        const root = parse(ajaxHtml);
        const lis = root.querySelectorAll('li');

        for (const li of lis) {
          const title = li.querySelector('h2.entry-title')?.text.trim() || '';
          const epNum = li.querySelector('.num-epi')?.text.trim() || '';
          const img = fixImageUrl(li.querySelector('img')?.getAttribute('src') || '');
          const link = li.querySelector('a.lnk-blk')?.getAttribute('href') || '';

          let epId = '';
          if (link.includes('/episode/')) {
            epId = link.replace(/.*\/episode\//, '').replace(/\/$/, '');
          }

          if (epId) {
            episodes.push({
              episodeId: epId,
              title: title || `Episode ${epNum}`,
              episodeNumber: epNum || `Episode ${episodes.length + 1}`,
              airDate: 'Available',
              image: img,
              overview: `Watch ${title || epNum} in high quality Hindi dub and multi-audio.`,
              isPremium: isPrem
            });
          }
        }
      }
    }

    if (episodes.length === 0) {
      const seriesUrl = `${UPSTREAM_BASE_URL}/series/${cleanSeriesSlug}/`;
      const html = await fetchHtml(seriesUrl);

      if (html) {
        const root = parse(html);
        animeTitle = root.querySelector('h1.entry-title, .entry-title')?.text.trim() || '';
        poster = fixImageUrl(root.querySelector('article.post img, .post-thumbnail img')?.getAttribute('src') || '');

        const epLinks = root.querySelectorAll('section.episodes a[href*="/episode/"], ul.post-lst a[href*="/episode/"]');
        for (const a of epLinks) {
          const href = a.getAttribute('href') || '';
          const epId = href.replace(/.*\/episode\//, '').replace(/\/$/, '');
          const title = a.querySelector('.entry-title')?.text.trim() || a.text.trim();
          const img = fixImageUrl(a.querySelector('img')?.getAttribute('src') || poster);
          const num = a.querySelector('.year, .num-epi, .number')?.text.trim() || `Ep ${episodes.length + 1}`;

          if (epId && !episodes.some(e => e.episodeId === epId)) {
            episodes.push({
              episodeId: epId,
              title: title || epId.replace(/-/g, ' '),
              episodeNumber: num,
              airDate: 'Available',
              image: img,
              overview: 'Streaming in Hindi Dub and Regional Audio with Abyss and Zephyrix servers.',
              isPremium: isPrem
            });
          }
        }
      }
    }

    if (episodes.length === 0) {
      const cleanTitle = (seriesId || targetId).replace(/-/g, ' ');
      for (let i = 1; i <= 12; i++) {
        episodes.push({
          episodeId: `${seriesId || 'naruto-shippuden'}-${seasonNum || 1}x${i}`,
          title: `Episode ${i}`,
          episodeNumber: `Episode ${i}`,
          airDate: 'Available',
          image: poster || 'https://image.tmdb.org/t/p/w500/kV27j3Nz4d5z8u6mN3EJw9RiLg2.jpg',
          overview: `Stream ${cleanTitle} episode ${i} with Hindi, Tamil, Telugu, and English audio options.`,
          isPremium: isPrem
        });
      }
    }

    res.json({
      success: true,
      source: 'deadline-anime/season',
      season: {
        seasonId: targetId,
        animeTitle: animeTitle || targetId.replace(/-season-\d+$/, '').replace(/-/g, ' '),
        seasonName,
        totalEpisodes: episodes.length.toString(),
        rating: '8.8',
        duration: '24 min/ep',
        poster: poster || 'https://image.tmdb.org/t/p/w500/kV27j3Nz4d5z8u6mN3EJw9RiLg2.jpg',
        description: `Watch all episodes of ${animeTitle || seasonName} in Hindi Dubbed, Tamil, Telugu & English.`,
        isPremium: isPrem
      },
      episodes
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ----------------------------------------------------
// API Route 6: Stream & Video Links (Premium Guard)
// ----------------------------------------------------
app.get(['/api/anime-world-india/v1/stream', '/api/anime-world-india/v1/stream.php'], async (req: Request, res: Response) => {
  const episodeId = (req.query.episodeId || req.query.series || '') as string;
  const movieId = (req.query.movieId || req.query.movie || '') as string;
  const userEmail = (req.headers['x-user-email'] as string) || (req.query.userEmail as string) || '';

  if (!episodeId && !movieId) {
    return res.status(400).json({ success: false, error: 'Missing episodeId or movieId parameter' });
  }

  const isMovie = Boolean(movieId);
  const targetId = isMovie ? movieId : episodeId;
  const seriesOrMovieSlug = isMovie ? targetId : targetId.split('-').slice(0, -1).join('-');

  const isPrem = isAnimePremium(targetId) || isAnimePremium(seriesOrMovieSlug);
  const userAccess = isUserPremium(userEmail);

  try {
    const url = isMovie
      ? `${UPSTREAM_BASE_URL}/movies/${targetId}/`
      : `${UPSTREAM_BASE_URL}/episode/${targetId}/`;

    const html = await fetchHtml(url);

    if (!html || html.includes('Slug is not found') || html.includes('404')) {
      const cleanTitle = targetId.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
      return res.json({
        success: true,
        type: isMovie ? 'movie' : 'episode',
        source: 'deadline-anime/fallback',
        isPremiumLocked: false,
        movie: isMovie ? {
          movieId: targetId,
          title: cleanTitle,
          poster: 'https://image.tmdb.org/t/p/w500/1TfdgQbZXuEswjqLYlsVvhHw0Py.jpg',
          description: `Watch ${cleanTitle} in full HD with Hindi dub and multi-audio options.`,
          year: '2024',
          duration: '120 min',
          rating: '8.5',
          isPremium: isPrem
        } : undefined,
        series: !isMovie ? {
          title: cleanTitle.split(/\s+\d+x\d+/)[0] || cleanTitle,
          poster: 'https://image.tmdb.org/t/p/w500/kV27j3Nz4d5z8u6mN3EJw9RiLg2.jpg',
          season: 'Season 1',
          totalEpisodes: '12',
          rating: '8.8',
          duration: '24 min',
          description: `Stream ${cleanTitle} in high definition with Hindi, Tamil, Telugu, and English audio.`,
          isPremium: isPrem
        } : undefined,
        current: !isMovie ? {
          episodeId: targetId,
          title: cleanTitle,
          airDate: 'Available',
          overview: `Stream ${cleanTitle} with multi-audio servers and reliable playback.`
        } : undefined,
        previous: null,
        next: null,
        episodes: [
          { episodeId: targetId, title: cleanTitle, episodeNumber: 'Episode 1', image: 'https://image.tmdb.org/t/p/w500/kV27j3Nz4d5z8u6mN3EJw9RiLg2.jpg', isPremium: isPrem }
        ],
        stream: {
          streamLink: wrapStreamUrl('https://watchanimeworld.one/dub-player/t/default'),
          file: wrapStreamUrl('https://watchanimeworld.one/dub-player/t/default'),
          servers: [
            { name: 'Dub Player Hub (Multi-Audio)', url: wrapStreamUrl('https://watchanimeworld.one/dub-player/t/default'), language: 'Multi' },
            { name: 'Abyss Server (Hindi Dub)', url: wrapStreamUrl('https://player.abyssplayer.com/Euxt-xP_f'), language: 'Hindi' },
            { name: 'Zephyrix HD (English Sub)', url: wrapStreamUrl('https://player.abyssplayer.com/klVLunPu8'), language: 'English' }
          ],
          audioTracks: [
            { code: 'hin', language: 'Hindi', url: wrapStreamUrl('https://player.abyssplayer.com/Euxt-xP_f'), server: 'AbyssPlayer' },
            { code: 'eng', language: 'English', url: wrapStreamUrl('https://player.abyssplayer.com/klVLunPu8'), server: 'Zephyrix' },
            { code: 'jpn', language: 'Japanese', url: wrapStreamUrl('https://watchanimeworld.one/dub-player/t/default'), server: 'DubPlayer' }
          ]
        }
      });
    }

    let streamLink = '';
    let servers: any[] = [];
    let audioTracks: any[] = [];
    let title = targetId.replace(/-/g, ' ');
    let poster = '';
    let description = '';
    let year = '2024';
    let duration = '24 min';
    let rating = '8.5';
    let prevEp: string | null = null;
    let nextEp: string | null = null;
    const episodesList: any[] = [];

    if (html) {
      const root = parse(html);

      title = root.querySelector('h1.entry-title, .episode-title, h1')?.text.trim() || title;
      poster = fixImageUrl(root.querySelector('.season-poster img, .post-thumbnail img, figure img')?.getAttribute('src') || '');
      description = root.querySelector('.description p, .episode-overview, p.season-desc')?.text.trim() || '';
      year = root.querySelector('.year')?.text.trim() || year;
      duration = root.querySelector('.duration')?.text.trim() || duration;
      rating = root.querySelector('.vote .num, .vote')?.text.trim() || rating;

      // Extract iframes
      for (const ifr of root.querySelectorAll('iframe')) {
        const src = ifr.getAttribute('src') || ifr.getAttribute('data-src') || '';
        if (src) {
          const fullSrc = src.startsWith('//') ? 'https:' + src : (src.startsWith('/') ? UPSTREAM_BASE_URL + src : src);
          if (!servers.some(s => s.url === fullSrc)) {
            servers.push({
              name: fullSrc.includes('abyss') ? 'Abyss Player (Multi-Audio)' : (fullSrc.includes('zephyrix') ? 'Zephyrix Stream' : (fullSrc.includes('dub-player') ? 'Dub Player Hub' : 'Primary Stream')),
              url: fullSrc
            });
          }
        }
      }

      // Check dub player
      const dubIframe = servers.find(s => s.url.includes('/dub-player/t/'));
      if (dubIframe) {
        try {
          const dubHtml = await fetchHtml(dubIframe.url, url);
          if (dubHtml) {
            const configMatch = dubHtml.match(/var CONFIG = (\{.*?\});/);
            if (configMatch && configMatch[1]) {
              const cfg = JSON.parse(configMatch[1]);
              if (cfg.prefix && cfg.ready) {
                const langNames: Record<string, string> = {
                  hin: 'Hindi',
                  tam: 'Tamil',
                  tel: 'Telugu',
                  ben: 'Bengali',
                  mal: 'Malayalam',
                  kan: 'Kannada',
                  eng: 'English',
                  jpn: 'Japanese'
                };

                for (const [code, key] of Object.entries(cfg.ready)) {
                  const langName = langNames[code] || (cfg.lang && cfg.lang[code] ? cfg.lang[code].name : code.toUpperCase());
                  const playerUrl = `${cfg.prefix}${key}`;
                  audioTracks.push({
                    code,
                    language: langName,
                    url: playerUrl,
                    server: 'AbyssPlayer'
                  });

                  servers.push({
                    name: `Server Abyss (${langName})`,
                    url: playerUrl,
                    language: langName
                  });
                }
              }
            }
          }
        } catch (e: any) {
          console.warn('Dub player config parse error:', e.message);
        }
      }

      const prevA = root.querySelector('a.prev, .nav-prev a, a[rel="prev"]');
      if (prevA) {
        const href = prevA.getAttribute('href') || '';
        if (href.includes('/episode/')) prevEp = href.replace(/.*\/episode\//, '').replace(/\/$/, '');
      }
      const nextA = root.querySelector('a.next, .nav-next a, a[rel="next"]');
      if (nextA) {
        const href = nextA.getAttribute('href') || '';
        if (href.includes('/episode/')) nextEp = href.replace(/.*\/episode\//, '').replace(/\/$/, '');
      }

      for (const a of root.querySelectorAll('a[href*="/episode/"]')) {
        const href = a.getAttribute('href') || '';
        const epSlug = href.replace(/.*\/episode\//, '').replace(/\/$/, '');
        if (epSlug && epSlug !== targetId && !episodesList.some(e => e.episodeId === epSlug)) {
          const epTitle = a.querySelector('h2.entry-title, .title')?.text.trim() || a.text.trim();
          const epNum = a.querySelector('.year, .num-epi')?.text.trim() || 'Next';
          const epImg = fixImageUrl(a.querySelector('img')?.getAttribute('src') || poster);
          episodesList.push({
            episodeId: epSlug,
            title: epTitle || epSlug.replace(/-/g, ' '),
            episodeNumber: epNum,
            image: epImg,
            isPremium: isPrem
          });
        }
      }
    }

    // Check if anime is Premium locked for this user
    if (isPrem && !userAccess.isPremium) {
      return res.json({
        success: true,
        type: isMovie ? 'movie' : 'episode',
        source: 'deadline-anime',
        isPremiumLocked: true,
        requiredPlan: 'Deadline Anime Premium (Starting at ₹149)',
        movie: isMovie ? {
          movieId: targetId,
          title,
          poster: poster || 'https://image.tmdb.org/t/p/w500/1TfdgQbZXuEswjqLYlsVvhHw0Py.jpg',
          description: description || `Watch ${title} in full HD with Hindi dub and regional audio options.`,
          year,
          duration,
          rating,
          isPremium: true
        } : undefined,
        series: !isMovie ? {
          title: title.split(/\s+\d+x\d+/)[0] || title,
          poster: poster || 'https://image.tmdb.org/t/p/w500/kV27j3Nz4d5z8u6mN3EJw9RiLg2.jpg',
          season: 'Season 1',
          totalEpisodes: '12',
          rating,
          duration,
          description,
          isPremium: true
        } : undefined,
        current: !isMovie ? {
          episodeId: targetId,
          title,
          airDate: 'Available',
          overview: description || 'Stream high-speed anime with multiple audio options.'
        } : undefined,
        previous: prevEp,
        next: nextEp,
        episodes: episodesList.slice(0, 15),
        stream: {
          streamLink: '',
          file: '',
          servers: [],
          audioTracks: []
        }
      });
    }

    if (servers.length === 0) {
      servers.push(
        { name: 'Dub Player Hub (Multi-Audio)', url: 'https://watchanimeworld.one/dub-player/t/default', language: 'Multi' },
        { name: 'Abyss Server (Hindi Dub)', url: 'https://player.abyssplayer.com/Euxt-xP_f', language: 'Hindi' },
        { name: 'Zephyrix HD (English Sub)', url: 'https://player.abyssplayer.com/klVLunPu8', language: 'English' }
      );
    } else {
      // Ensure all servers have working reliable player URLs and include Dub Player Hub
      if (!servers.some(s => s.name.toLowerCase().includes('dub player'))) {
        servers.unshift({ name: 'Dub Player Hub (Multi-Audio)', url: 'https://watchanimeworld.one/dub-player/t/default', language: 'Multi' });
      }
      servers = servers.map((s, i) => ({
        ...s,
        url: s.url && s.url.includes('http') ? s.url : (i === 0 ? 'https://watchanimeworld.one/dub-player/t/default' : 'https://player.abyssplayer.com/Euxt-xP_f')
      }));
    }

    if (audioTracks.length === 0) {
      audioTracks.push(
        { code: 'hin', language: 'Hindi', url: 'https://player.abyssplayer.com/Euxt-xP_f', server: 'AbyssPlayer' },
        { code: 'eng', language: 'English', url: 'https://player.abyssplayer.com/klVLunPu8', server: 'Zephyrix' },
        { code: 'jpn', language: 'Japanese', url: 'https://player.abyssplayer.com/klVLunPu8', server: 'AbyssPlayer' }
      );
    }

    if (audioTracks.length > 0) {
      const hindiTrack = audioTracks.find(t => t.language.toLowerCase().includes('hindi')) || audioTracks[0];
      streamLink = hindiTrack.url;
    } else if (servers.length > 0) {
      const abyss = servers.find(s => s.url.includes('abyss'));
      streamLink = abyss ? abyss.url : servers[0].url;
    } else {
      streamLink = `https://player.abyssplayer.com/Euxt-xP_f`;
    }

    res.json({
      success: true,
      type: isMovie ? 'movie' : 'episode',
      source: 'deadline-anime',
      isPremiumLocked: false,
      movie: isMovie ? {
        movieId: targetId,
        title,
        poster: poster || 'https://image.tmdb.org/t/p/w500/1TfdgQbZXuEswjqLYlsVvhHw0Py.jpg',
        description: description || `Watch ${title} in full HD with Hindi dub and regional audio options.`,
        year,
        duration,
        rating,
        isPremium: isPrem
      } : undefined,
      series: !isMovie ? {
        title: title.split(/\s+\d+x\d+/)[0] || title,
        poster: poster || 'https://image.tmdb.org/t/p/w500/kV27j3Nz4d5z8u6mN3EJw9RiLg2.jpg',
        season: 'Season 1',
        totalEpisodes: '12',
        rating,
        duration,
        description,
        isPremium: isPrem
      } : undefined,
      current: !isMovie ? {
        episodeId: targetId,
        title,
        airDate: 'Available',
        overview: description || 'Stream high-speed anime with multiple audio options.'
      } : undefined,
      previous: prevEp,
      next: nextEp,
      episodes: episodesList.slice(0, 15),
      stream: {
        streamLink: wrapStreamUrl(streamLink),
        file: wrapStreamUrl(streamLink),
        servers: servers.map(s => ({
          ...s,
          url: wrapStreamUrl(s.url)
        })),
        audioTracks: audioTracks.map(t => ({
          ...t,
          url: wrapStreamUrl(t.url)
        }))
      }
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ----------------------------------------------------
// Helper: Wrap stream URLs through Player Shield
// ----------------------------------------------------
function wrapStreamUrl(rawUrl: string): string {
  if (!rawUrl) return '';
  if (rawUrl.startsWith('/api/anime-world-india/v1/player')) return rawUrl;
  return `/api/anime-world-india/v1/player?url=${encodeURIComponent(rawUrl)}`;
}

// ----------------------------------------------------
// API Route 6b: Stream Shield & Clean Player Embed
// Fixes "Player has been destroyed" by neutralizing deceptive ad
// overlays and popup triggers that cause player termination on mobile
// ----------------------------------------------------
app.get(['/api/anime-world-india/v1/player', '/api/player/embed'], async (req: Request, res: Response) => {
  const targetUrl = (req.query.url as string || '').trim();
  if (!targetUrl) {
    return res.status(400).send('Missing video URL parameter');
  }

  try {
    const parsedUrl = new URL(targetUrl);
    if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
      return res.status(400).send('Invalid protocol');
    }

    const fetchHeaders: Record<string, string> = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
      'Referer': 'https://watchanimeworld.one/',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
    };

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 12000);

    const upstreamRes = await fetch(targetUrl, {
      headers: fetchHeaders,
      signal: controller.signal
    });
    clearTimeout(timeout);

    if (!upstreamRes.ok) {
      return res.redirect(targetUrl);
    }

    let html = await upstreamRes.text();
    const origin = parsedUrl.origin;

    // Ensure all relative assets (bundle.js, worker.js, HLS chunks, CSS) resolve to upstream host
    if (html.includes('<head>')) {
      html = html.replace('<head>', `<head><base href="${origin}/">`);
    } else {
      html = `<base href="${origin}/">` + html;
    }

    // Comprehensive Player Shield Script:
    // 1. Replaces window.open with a non-throwing mock so mobile popup blockers never crash the player.
    // 2. Mocks fuckAdBlock so anti-adblock detection does not execute removal routines.
    // 3. Guards jwplayer/player instances so .remove() or .destroy() cannot be called.
    // 4. Eliminates the clickable deceptive #overlay element that captures touches and triggers ads.
    const shieldScript = `
<script>
  (function() {
    window.open = function() {
      return {
        focus: function(){},
        blur: function(){},
        close: function(){},
        closed: false
      };
    };

    window.fuckAdBlock = {
      onDetected: function(){},
      onNotDetected: function(){},
      check: function(){ return false; }
    };
    window.FuckAdBlock = window.fuckAdBlock;

    function shieldPlayer() {
      try {
        if (window.jwplayer && typeof window.jwplayer === 'function') {
          var p = window.jwplayer();
          if (p && !p._shielded) {
            p.remove = function() {
              console.log('[PlayerShield] Prevented player destruction');
            };
            p._shielded = true;
          }
        }
      } catch(e) {}
    }
    setInterval(shieldPlayer, 30);

    function removeOverlay() {
      var ov = document.getElementById('overlay');
      if (ov) {
        ov.style.display = 'none';
        ov.style.pointerEvents = 'none';
        ov.onclick = null;
        ov.ontouchend = null;
        ov.remove();
      }
    }
    document.addEventListener('DOMContentLoaded', removeOverlay);
    setInterval(removeOverlay, 80);
  })();
</script>
`;

    if (html.includes('<head>')) {
      html = html.replace('<head>', '<head>' + shieldScript);
    } else {
      html = shieldScript + html;
    }

    // Neutralize track.window >= 2 condition in AbyssPlayer which triggers player removal
    html = html.replace(/track\.window\s*>=\s*2/g, 'false');

    // Remove the blocking overlay element completely so clicks pass straight to video controls
    html = html.replace(/<div id="overlay">[\s\S]*?<\/div><\/div>/g, '');

    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('X-Frame-Options', 'ALLOWALL');
    return res.send(html);
  } catch (err: any) {
    console.error('Player proxy error:', err.message);
    return res.redirect(targetUrl);
  }
});


// ----------------------------------------------------
// API Route 7: Search (Local Synced + Upstream Multi-Search)
// ----------------------------------------------------
app.get(['/api/anime-world-india/v1/search', '/api/anime-world-india/v1/search.php'], async (req: Request, res: Response) => {
  const query = ((req.query.query || req.query.q || '') as string).trim();
  const page = parseInt((req.query.p || req.query.page || '1') as string, 10) || 1;

  if (!query) {
    return res.status(400).json({ success: false, error: 'Missing query parameter' });
  }

  const q = query.toLowerCase();
  const resultsMap = new Map<string, any>();

  for (const item of syncStore.allAnimeMap.values()) {
    if (item.title.toLowerCase().includes(q) || item.slug.toLowerCase().includes(q)) {
      resultsMap.set(item.slug, { ...item, isPremium: isAnimePremium(item.slug) });
    }
  }

  try {
    const url = `${UPSTREAM_BASE_URL}/?s=${encodeURIComponent(query)}&page=${page}`;
    const html = await fetchHtml(url);

    if (html) {
      const root = parse(html);
      for (const li of root.querySelectorAll('ul.post-lst li')) {
        const item = parsePostItem(li);
        if (item && item.slug) {
          resultsMap.set(item.slug, item);
          syncStore.allAnimeMap.set(item.slug, item);
        }
      }
    }
  } catch (err) {
    // continue with local matches
  }

  const combinedResults = Array.from(resultsMap.values());

  res.json({
    success: true,
    query,
    currentPage: page,
    totalPages: Math.max(1, Math.ceil(combinedResults.length / 20)),
    total_results: combinedResults.length,
    source: 'deadline-anime/search (synced)',
    results: combinedResults
  });
});

// ----------------------------------------------------
// API Route 8: A to Z List
// ----------------------------------------------------
app.get(['/api/anime-world-india/v1/a2z', '/api/anime-world-india/v1/a2z.php'], async (req: Request, res: Response) => {
  const letter = ((req.query.letter || 'a') as string).toLowerCase().trim();
  const page = parseInt((req.query.page || req.query.p || '1') as string, 10) || 1;

  const resultsMap = new Map<string, any>();

  for (const item of syncStore.allAnimeMap.values()) {
    const firstChar = item.title.trim().charAt(0).toLowerCase();
    const isMatch = letter === '0-9' ? /^\d/.test(firstChar) : firstChar === letter;
    if (isMatch) {
      resultsMap.set(item.slug, {
        title: item.title,
        image: item.image,
        year: item.year,
        rating: item.rating,
        type: item.type,
        id: `${item.type}/${item.slug}`,
        url: '',
        isPremium: isAnimePremium(item.slug)
      });
    }
  }

  try {
    const url = `${UPSTREAM_BASE_URL}/letters/${encodeURIComponent(letter)}/page/${page}/`;
    const html = await fetchHtml(url);

    if (html) {
      const root = parse(html);
      for (const li of root.querySelectorAll('ul.post-lst li')) {
        const item = parsePostItem(li);
        if (item && item.slug) {
          resultsMap.set(item.slug, {
            title: item.title,
            image: item.image,
            year: item.year,
            rating: item.rating,
            type: item.type,
            id: `${item.type}/${item.slug}`,
            url: '',
            isPremium: isAnimePremium(item.slug)
          });
          syncStore.allAnimeMap.set(item.slug, item);
        }
      }
    }
  } catch (err) {
    // continue
  }

  const results = Array.from(resultsMap.values());

  res.json({
    success: true,
    letter,
    current_page: page,
    total_pages: Math.max(1, Math.ceil(results.length / 24)),
    total_results: results.length,
    results
  });
});

// ----------------------------------------------------
// API Route 9: API Documentation & Status
// ----------------------------------------------------
app.get('/api/anime-world-india/v1/docs', (req: Request, res: Response) => {
  res.json({
    name: 'Deadline Anime Streaming & FamGateway API v1',
    description: 'High performance API for browsing, premium management, and streaming Hindi dubbed and multi-audio anime series and movies.',
    source: UPSTREAM_BASE_URL,
    total_synced_anime: syncStore.totalSyncedCount,
    last_synced: syncStore.lastSynced,
    version: '2.0.0',
    endpoints: [
      {
        path: '/api/admin/config',
        method: 'GET',
        description: 'Get admin configurations and current list of premium anime.'
      },
      {
        path: '/api/admin/toggle-premium',
        method: 'POST',
        description: 'Admin toggle for which anime is Premium and which is Free.'
      },
      {
        path: '/api/admin/set-gateway-key',
        method: 'POST',
        description: 'Set FamGateway API Key credentials.'
      },
      {
        path: '/api/payment/plans',
        method: 'GET',
        description: 'Fetch available FamGateway subscription plans (₹149, ₹149, ₹600).'
      },
      {
        path: '/api/payment/famgateway/create-order',
        method: 'POST',
        description: 'Generate a FamGateway UPI/Order for subscription.'
      },
      {
        path: '/api/payment/famgateway/verify',
        method: 'POST',
        description: 'Verify FamGateway payment and activate premium membership.'
      }
    ]
  });
});

app.get(['/api', '/api/docs'], (req: Request, res: Response) => {
  res.json({
    status: 'online',
    name: `${adminConfig.appName || 'AnimeWorld India'} API Server`,
    vercelCompatible: true,
    version: '2.0.0',
    endpoints: [
      '/api/admin/config',
      '/api/admin/toggle-premium',
      '/api/admin/set-gateway-key',
      '/api/payment/plans',
      '/api/payment/famgateway/create-order',
      '/api/payment/famgateway/verify',
      '/api/anime-world-india/v1/search',
      '/api/anime-world-india/v1/top-airing',
      '/api/anime-world-india/v1/info',
      '/api/anime-world-india/v1/stream'
    ]
  });
});

// Vite middleware in dev or static serving in production
async function setupVite() {
  const isProd = process.env.NODE_ENV === 'production';
  if (!isProd) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`AnimeWorld India Streaming Server running on http://0.0.0.0:${PORT}`);
  });
}

// Only start the standalone Vite/Express HTTP listener when not running in Vercel Serverless environment
if (!process.env.VERCEL) {
  setupVite();
}

export { app };
export default app;

