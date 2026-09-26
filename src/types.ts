export interface AnimeItem {
  title: string;
  image: string;
  year?: string;
  rating?: string;
  seriesId?: string;
  movieId?: string;
  slug?: string;
  type?: 'series' | 'movie';
  language?: string;
}

export interface SeasonInfo {
  seasonNumber: string;
  seasonName: string;
  episodes: string;
  seasonId: string;
  postId?: string;
  numericSeason?: number;
}

export interface SeriesDetails {
  seriesId: string;
  title: string;
  poster: string;
  year: string;
  duration: string;
  rating: string;
  totalSeasons: string;
  description: string;
  genres?: string[];
}

export interface EpisodeItem {
  episodeId: string;
  title: string;
  episodeNumber: string;
  airDate: string;
  image: string;
  overview?: string;
}

export interface AudioTrack {
  code?: string;
  language: string;
  url: string;
  server?: string;
}

export interface StreamServer {
  name: string;
  url: string;
  language?: string;
}

export interface StreamData {
  success: boolean;
  type: 'series' | 'episode' | 'movie';
  source: string;
  movie?: {
    movieId: string;
    title: string;
    poster: string;
    description: string;
    year: string;
    duration: string;
    rating: string;
  };
  series?: {
    title: string;
    poster: string;
    season: string;
    totalEpisodes: string;
    rating: string;
    duration: string;
    description: string;
  };
  current?: {
    episodeId: string;
    title: string;
    airDate: string;
    overview: string;
  };
  previous?: string | null;
  next?: string | null;
  episodes?: EpisodeItem[];
  stream: {
    streamLink: string;
    file?: string;
    servers: StreamServer[];
    audioTracks: AudioTrack[];
  };
}

export interface WatchHistoryItem {
  id: string;
  title: string;
  type: 'series' | 'movie';
  episodeTitle?: string;
  episodeNumber?: string;
  poster: string;
  timestamp: number;
}

export interface SyncStatus {
  isSyncing: boolean;
  lastSynced: number;
  lastSyncedFormatted: string;
  totalSyncedCount: number;
  seriesCount: number;
  moviesCount: number;
  sections: {
    newestDropsCount: number;
    newArrivalsCount: number;
    topShowsCount: number;
    topFilmsCount: number;
    latestMoviesCount: number;
    cartoonSeriesCount: number;
    cartoonFilmsCount: number;
    catalogCount: number;
  };
}

export interface HomeData {
  success: boolean;
  source: string;
  last_synced?: number;
  total_synced_count?: number;
  latest_series: AnimeItem[];
  latest_movies: AnimeItem[];
  newest_drops?: AnimeItem[];
  new_anime_arrivals?: AnimeItem[];
  cartoon_series?: AnimeItem[];
  cartoon_films?: AnimeItem[];
  top_shows?: AnimeItem[];
  top_films?: AnimeItem[];
  featured: AnimeItem[];
  all_synced?: AnimeItem[];
}

