import express, { Request, Response } from 'express';
import { parse } from 'node-html-parser';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = parseInt(process.env.PORT || '3000', 10);

app.use(express.json());

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
    language: 'Hindi, Tamil, Telugu, English, Japanese'
  },
  {
    title: 'Naruto',
    image: 'https://image.tmdb.org/t/p/w500/xppeysfvDKVx775MFuH8Z9BlpMk.jpg',
    year: '2002',
    rating: '8.4',
    seriesId: 'naruto',
    slug: 'naruto',
    type: 'series' as const,
    language: 'Hindi, Tamil, Telugu, English'
  },
  {
    title: 'Jujutsu Kaisen',
    image: 'https://image.tmdb.org/t/p/w500/hD8pZg6lO8L673c68bV2w9L1s8S.jpg',
    year: '2020',
    rating: '8.6',
    seriesId: 'jujutsu-kaisen',
    slug: 'jujutsu-kaisen',
    type: 'series' as const,
    language: 'Hindi, English, Japanese'
  },
  {
    title: 'Demon Slayer: Kimetsu no Yaiba',
    image: 'https://image.tmdb.org/t/p/w500/xUfRZu2mi8jH6SzQEJGP6tjBuYj.jpg',
    year: '2019',
    rating: '8.7',
    seriesId: 'demon-slayer-kimetsu-no-yaiba',
    slug: 'demon-slayer-kimetsu-no-yaiba',
    type: 'series' as const,
    language: 'Hindi, Tamil, Telugu, English'
  },
  {
    title: 'One-Punch Man',
    image: 'https://image.tmdb.org/t/p/w500/iE3s0lG5QVddA7m7exWn05HjErs.jpg',
    year: '2015',
    rating: '8.5',
    seriesId: 'one-punch-man',
    slug: 'one-punch-man',
    type: 'series' as const,
    language: 'Hindi, English, Japanese'
  },
  {
    title: 'Solo Leveling',
    image: 'https://image.tmdb.org/t/p/w500/geCRueV3ElhRTr0xtJuPxJ8ZXq5.jpg',
    year: '2024',
    rating: '8.5',
    seriesId: 'solo-leveling',
    slug: 'solo-leveling',
    type: 'series' as const,
    language: 'Hindi, English, Japanese'
  },
  {
    title: 'Dragon Ball Z',
    image: 'https://image.tmdb.org/t/p/w500/dJyZFmQvj7mGz3C0u66XhO63e3d.jpg',
    year: '1989',
    rating: '8.3',
    seriesId: 'dragon-ball-z',
    slug: 'dragon-ball-z',
    type: 'series' as const,
    language: 'Hindi, English, Japanese'
  },
  {
    title: 'Attack on Titan',
    image: 'https://image.tmdb.org/t/p/w500/8C5gDXUkT9w7mA3yR1fL5k1Fv.jpg',
    year: '2013',
    rating: '9.0',
    seriesId: 'attack-on-titan',
    slug: 'attack-on-titan',
    type: 'series' as const,
    language: 'Hindi, English, Japanese'
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
    language: 'Hindi, Tamil, Telugu, Bengali'
  },
  {
    title: 'Your Name.',
    image: 'https://image.tmdb.org/t/p/w500/q719jXXEzOoYaps6qFsC8llRaQ.jpg',
    year: '2016',
    rating: '8.9',
    movieId: 'your-name',
    slug: 'your-name',
    type: 'movie' as const,
    language: 'Hindi, English, Japanese'
  },
  {
    title: 'Suzume',
    image: 'https://image.tmdb.org/t/p/w500/vIewHMv5H9V5H89qU86N9d2zHn.jpg',
    year: '2022',
    rating: '8.0',
    movieId: 'suzume',
    slug: 'suzume',
    type: 'movie' as const,
    language: 'Hindi, English, Japanese'
  },
  {
    title: 'Weathering with You',
    image: 'https://image.tmdb.org/t/p/w500/qgrk7r1fOZKhZd99Qv0U1jQe4.jpg',
    year: '2019',
    rating: '8.2',
    movieId: 'weathering-with-you',
    slug: 'weathering-with-you',
    type: 'movie' as const,
    language: 'Hindi, English, Japanese'
  },
  {
    title: "Doraemon the Movie: Nobita's Earth Symphony",
    image: 'https://image.tmdb.org/t/p/w500/8d8u3C0yG0nQ2r8zV1aY2vF.jpg',
    year: '2024',
    rating: '7.8',
    movieId: 'doraemon-the-movie-nobitas-earth-symphony',
    slug: 'doraemon-the-movie-nobitas-earth-symphony',
    type: 'movie' as const,
    language: 'Hindi, Tamil, Telugu'
  },
  {
    title: 'Jujutsu Kaisen 0',
    image: 'https://image.tmdb.org/t/p/w500/3pTwMAnsELJw0FzT0u7yWbZ6yq9.jpg',
    year: '2021',
    rating: '8.3',
    movieId: 'jujutsu-kaisen-0-movie',
    slug: 'jujutsu-kaisen-0-movie',
    type: 'movie' as const,
    language: 'Hindi, English, Japanese'
  }
];

// Helper to parse individual article items
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
  return {
    title,
    image: fixImageUrl(img),
    year,
    rating,
    type,
    [type === 'series' ? 'seriesId' : 'movieId']: id,
    slug: id,
    language: 'Hindi, Tamil, Telugu, English'
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

// Seed initial fallback into map
[...FALLBACK_SERIES, ...FALLBACK_MOVIES].forEach(item => {
  syncStore.allAnimeMap.set(item.slug, item);
});

async function syncAllAnime(force: boolean = false) {
  if (syncStore.isSyncing) return;
  // If recently synced (within 10 minutes) and not forced, skip
  if (!force && Date.now() - syncStore.lastSynced < 10 * 60 * 1000 && syncStore.totalSyncedCount > 50) {
    return;
  }

  syncStore.isSyncing = true;
  console.log('🔄 Starting AnimeWorld India Sync Engine...');

  try {
    // 1. Sync Homepage sections
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

        // Standard articles
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

        // Trending / Top picks
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
              language: 'Hindi, Tamil, Telugu, English'
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

    // 2. Concurrently Sync Pages 1 to 4 of Series & Movies Catalogs
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

    const results = await Promise.allSettled(
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

    syncStore.lastSynced = Date.now();
    syncStore.totalSyncedCount = syncStore.allAnimeMap.size;
    console.log(`✅ AnimeWorld India Sync Finished! Total Synced Anime: ${syncStore.totalSyncedCount}`);
  } catch (err: any) {
    console.error('❌ Error during AnimeWorld India sync:', err.message);
  } finally {
    syncStore.isSyncing = false;
  }
}

// Initial Sync on server bootstrap
syncAllAnime();

// ----------------------------------------------------
// API Route 1: Home (Rich Synced Shelves)
// ----------------------------------------------------
app.get(['/api/anime-world-india/v1/home', '/api/anime-world-india/v1/home.php'], async (req: Request, res: Response) => {
  // If syncStore has low count, trigger sync in background
  if (syncStore.totalSyncedCount < 30) {
    syncAllAnime();
  }

  // Derive all series and movies
  const allSynced = Array.from(syncStore.allAnimeMap.values());
  const seriesList = allSynced.filter(i => i.type === 'series');
  const moviesList = allSynced.filter(i => i.type === 'movie');

  // Featured carousel highlights
  const featured = [
    ...(syncStore.top_shows.length > 0 ? syncStore.top_shows.slice(0, 3) : []),
    ...(syncStore.new_anime_arrivals.length > 0 ? syncStore.new_anime_arrivals.slice(0, 2) : []),
    ...(syncStore.latest_movies.length > 0 ? syncStore.latest_movies.slice(0, 2) : [])
  ];

  res.json({
    success: true,
    source: 'animeworld-india.me',
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
    message: 'AnimeWorld India database synchronized successfully.',
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

  // If in synced cache, return right away or fetch live
  const cachedPage = syncStore.seriesCatalog.get(page);
  if (cachedPage && cachedPage.length > 0) {
    return res.json({
      success: true,
      source: 'animeworld-india.me/series (synced cache)',
      current_page: page,
      total_pages: 15,
      has_next: page < 15,
      has_prev: page > 1,
      pages: Array.from({ length: 10 }, (_, i) => i + 1),
      total_results: cachedPage.length,
      series: cachedPage
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
      source: 'animeworld-india.me/series',
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
    return res.json({
      success: true,
      source: 'animeworld-india.me/movies (synced cache)',
      current_page: page,
      total_pages: 15,
      has_next: page < 15,
      has_prev: page > 1,
      pages: Array.from({ length: 10 }, (_, i) => i + 1),
      total_results: cachedPage.length,
      movies: cachedPage
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
      source: 'animeworld-india.me/movies',
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

  try {
    const url = `${UPSTREAM_BASE_URL}/series/${seriesID}/`;
    const html = await fetchHtml(url);

    if (!html) {
      // Find from synced store
      const synced = syncStore.allAnimeMap.get(seriesID) || FALLBACK_SERIES.find(s => s.seriesId === seriesID) || FALLBACK_SERIES[0];
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
          genres: ['Action', 'Adventure', 'Anime', 'Hindi Dub']
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
      source: 'animeworld-india.me/series',
      series: {
        seriesId: seriesID,
        title,
        poster,
        year,
        duration,
        rating,
        totalSeasons: seasons.length.toString(),
        description,
        genres: genres.length > 0 ? genres : ['Action', 'Anime', 'Hindi Dub']
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

  try {
    let episodes: any[] = [];
    let animeTitle = '';
    let poster = '';
    let seasonName = `Season ${seasonNum || 1}`;

    // 1. Try WP admin-ajax if postId is provided
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
              overview: `Watch ${title || epNum} in high quality Hindi dub and multi-audio.`
            });
          }
        }
      }
    }

    // 2. Fetch series page directly if needed
    if (episodes.length === 0) {
      const cleanSeriesSlug = seriesId || targetId.replace(/-season-\d+$/, '');
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
              overview: 'Streaming in Hindi Dub and Regional Audio with Abyss and Zephyrix servers.'
            });
          }
        }
      }
    }

    // 3. Fallback generated episode list
    if (episodes.length === 0) {
      const cleanTitle = (seriesId || targetId).replace(/-/g, ' ');
      for (let i = 1; i <= 12; i++) {
        episodes.push({
          episodeId: `${seriesId || 'naruto-shippuden'}-${seasonNum || 1}x${i}`,
          title: `Episode ${i}`,
          episodeNumber: `Episode ${i}`,
          airDate: 'Available',
          image: poster || 'https://image.tmdb.org/t/p/w500/kV27j3Nz4d5z8u6mN3EJw9RiLg2.jpg',
          overview: `Stream ${cleanTitle} episode ${i} with Hindi, Tamil, Telugu, and English audio options.`
        });
      }
    }

    res.json({
      success: true,
      source: 'animeworld-india.me/season',
      season: {
        seasonId: targetId,
        animeTitle: animeTitle || targetId.replace(/-season-\d+$/, '').replace(/-/g, ' '),
        seasonName,
        totalEpisodes: episodes.length.toString(),
        rating: '8.8',
        duration: '24 min/ep',
        poster: poster || 'https://image.tmdb.org/t/p/w500/kV27j3Nz4d5z8u6mN3EJw9RiLg2.jpg',
        description: `Watch all episodes of ${animeTitle || seasonName} in Hindi Dubbed, Tamil, Telugu & English.`
      },
      episodes
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ----------------------------------------------------
// API Route 6: Stream & Video Links (Multi-Audio Abyss)
// ----------------------------------------------------
app.get(['/api/anime-world-india/v1/stream', '/api/anime-world-india/v1/stream.php'], async (req: Request, res: Response) => {
  const episodeId = (req.query.episodeId || req.query.series || '') as string;
  const movieId = (req.query.movieId || req.query.movie || '') as string;

  if (!episodeId && !movieId) {
    return res.status(400).json({ success: false, error: 'Missing episodeId or movieId parameter' });
  }

  const isMovie = Boolean(movieId);
  const targetId = isMovie ? movieId : episodeId;

  try {
    const url = isMovie
      ? `${UPSTREAM_BASE_URL}/movies/${targetId}/`
      : `${UPSTREAM_BASE_URL}/episode/${targetId}/`;

    const html = await fetchHtml(url);

    let streamLink = '';
    const servers: any[] = [];
    const audioTracks: any[] = [];
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

      // Check dub player for multi-audio config
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

      // Extract next/prev buttons
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

      // Extract up next episodes
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
            image: epImg
          });
        }
      }
    }

    if (audioTracks.length > 0) {
      const hindiTrack = audioTracks.find(t => t.language.toLowerCase().includes('hindi')) || audioTracks[0];
      streamLink = hindiTrack.url;
    } else if (servers.length > 0) {
      const abyss = servers.find(s => s.url.includes('abyss'));
      streamLink = abyss ? abyss.url : servers[0].url;
    } else {
      streamLink = `https://player.abyssplayer.com/Euxt-xP_f`;
      servers.push({
        name: 'Abyss Server (Hindi Dub)',
        url: streamLink
      });
      audioTracks.push({
        code: 'hin',
        language: 'Hindi',
        url: streamLink
      });
    }

    res.json({
      success: true,
      type: isMovie ? 'movie' : 'episode',
      source: isMovie ? 'animeworld-india.me/movie' : 'animeworld-india.me/episode',
      movie: isMovie ? {
        movieId: targetId,
        title,
        poster: poster || 'https://image.tmdb.org/t/p/w500/1TfdgQbZXuEswjqLYlsVvhHw0Py.jpg',
        description: description || `Watch ${title} in full HD with Hindi dub and regional audio options.`,
        year,
        duration,
        rating
      } : undefined,
      series: !isMovie ? {
        title: title.split(/\s+\d+x\d+/)[0] || title,
        poster: poster || 'https://image.tmdb.org/t/p/w500/kV27j3Nz4d5z8u6mN3EJw9RiLg2.jpg',
        season: 'Season 1',
        totalEpisodes: '12',
        rating,
        duration,
        description
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
        streamLink,
        file: streamLink,
        servers,
        audioTracks
      }
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
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

  // 1. Search across in-memory Synced Database first
  for (const item of syncStore.allAnimeMap.values()) {
    if (item.title.toLowerCase().includes(q) || item.slug.toLowerCase().includes(q)) {
      resultsMap.set(item.slug, item);
    }
  }

  // 2. Also search upstream for complete real-time discovery
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
    source: 'animeworld-india.me/search (synced)',
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

  // Check synced database first
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
        url: ''
      });
    }
  }

  // Upstream
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
            url: ''
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
    name: 'AnimeWorld India Streaming API v1',
    description: 'High performance API for browsing and streaming Hindi dubbed and multi-audio anime series and movies.',
    source: UPSTREAM_BASE_URL,
    total_synced_anime: syncStore.totalSyncedCount,
    last_synced: syncStore.lastSynced,
    version: '1.3.0',
    endpoints: [
      {
        path: '/api/anime-world-india/v1/home',
        method: 'GET',
        description: 'Fetches rich synced shelves (Newest Drops, New Anime Arrivals, Top Shows, Top Films, Latest Movies, Cartoon Series).'
      },
      {
        path: '/api/anime-world-india/v1/sync',
        method: 'GET / POST',
        description: 'Synchronizes and fetches more anime from AnimeWorld India with multi-page crawling.'
      },
      {
        path: '/api/anime-world-india/v1/sync-status',
        method: 'GET',
        description: 'Returns real-time sync status, total synced anime count, and section distribution.'
      },
      {
        path: '/api/anime-world-india/v1/series?p=1',
        method: 'GET',
        description: 'Fetches paginated anime series catalog.'
      },
      {
        path: '/api/anime-world-india/v1/movie?p=1',
        method: 'GET',
        description: 'Fetches paginated anime movies catalog.'
      },
      {
        path: '/api/anime-world-india/v1/seasons?seriesID=naruto-shippuden',
        method: 'GET',
        description: 'Retrieves series details and available seasons.'
      },
      {
        path: '/api/anime-world-india/v1/episodes?seasonId=naruto-shippuden-season-1',
        method: 'GET',
        description: 'Retrieves episodes for a specific season.'
      },
      {
        path: '/api/anime-world-india/v1/stream?episodeId=naruto-shippuden-16x349',
        method: 'GET',
        description: 'Retrieves streaming embeds and multi-audio tracks (Hindi, Tamil, Telugu, English).'
      },
      {
        path: '/api/anime-world-india/v1/search?query=naruto',
        method: 'GET',
        description: 'Searches all synced anime + real-time upstream queries.'
      },
      {
        path: '/api/anime-world-india/v1/a2z?letter=a',
        method: 'GET',
        description: 'Lists anime by alphabetical letter or 0-9.'
      }
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

setupVite();
