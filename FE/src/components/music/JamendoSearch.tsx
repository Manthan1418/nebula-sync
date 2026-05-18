import { useEffect, useMemo, useState } from 'react';
import { Search, Loader2, Play, Plus, Flame } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { JamendoTrack, formatDuration, getTrendingJamendoTracks, searchJamendoTracks } from '@/lib/jamendo';
import { toast } from 'sonner';

interface JamendoSearchProps {
  canControl: boolean;
  queueIds: Set<string>;
  onPlayNow: (track: JamendoTrack) => void;
  onQueue: (track: JamendoTrack) => void;
}

export const JamendoSearch = ({ canControl, queueIds, onPlayNow, onQueue }: JamendoSearchProps) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<JamendoTrack[]>([]);
  const [trending, setTrending] = useState<JamendoTrack[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingTrending, setLoadingTrending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    setLoadingTrending(true);
    getTrendingJamendoTracks()
      .then((items) => {
        if (!alive) return;
        setTrending(items);
      })
      .catch((err) => {
        if (!alive) return;
        setError(err.message || 'Unable to load trending tracks');
      })
      .finally(() => {
        if (alive) setLoadingTrending(false);
      });

    return () => { alive = false; };
  }, []);

  useEffect(() => {
    const term = query.trim();
    if (!term) {
      setResults([]);
      setError(null);
      return;
    }

    let cancelled = false;
    const handle = window.setTimeout(() => {
      setLoading(true);
      searchJamendoTracks(term)
        .then((items) => {
          if (cancelled) return;
          setResults(items);
          setError(items.length ? null : 'No tracks matched your search');
        })
        .catch((err) => {
          if (cancelled) return;
          setResults([]);
          setError(err.message || 'Search failed');
          toast.error(err.message || 'Search failed');
        })
        .finally(() => {
          if (!cancelled) setLoading(false);
        });
    }, 300);

    return () => {
      cancelled = true;
      window.clearTimeout(handle);
    };
  }, [query]);

  const activeResults = useMemo(() => (query.trim() ? results : trending), [query, results, trending]);
  const subtitle = query.trim()
    ? loading
      ? 'Searching the music library...'
      : `${activeResults.length} result${activeResults.length === 1 ? '' : 's'} from GaanaPy`
    : loadingTrending
      ? 'Loading trending tracks...'
      : 'Fresh GaanaPy picks for the room';

  return (
    <section className="space-y-4 rounded-3xl border border-border/50 bg-card/70 backdrop-blur-xl p-4 lg:p-5 shadow-2xl shadow-black/20">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">Search library</p>
          <h3 className="mt-1 text-lg font-semibold text-foreground">GaanaPy Music</h3>
        </div>
        <div className="flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-300">
          <Flame className="h-3.5 w-3.5" />
          Free streaming
        </div>
      </div>

      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search songs, artists, or albums"
          className="h-12 rounded-2xl border-border/60 bg-background/70 pl-10 pr-4 text-sm shadow-inner shadow-black/10"
        />
      </div>

      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>{subtitle}</span>
        {loading && <Loader2 className="h-4 w-4 animate-spin" />}
      </div>

      {error && !activeResults.length && (
        <div className="rounded-2xl border border-amber-500/20 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">
          {error}
        </div>
      )}

      <div className="space-y-3 max-h-[32rem] overflow-y-auto pr-1">
        {activeResults.length === 0 && !loading && !error ? (
          <div className="rounded-2xl border border-dashed border-border/60 bg-background/40 px-4 py-10 text-center text-sm text-muted-foreground">
            Search for a song to add it to the room, or pick one of GaanaPy’s trending tracks below.
          </div>
        ) : null}

        {activeResults.map((track) => {
          const isQueued = queueIds.has(track.id);
          return (
            <article key={track.id} className="relative flex items-center gap-3 rounded-2xl border border-border/50 bg-background/55 p-3 transition hover:border-emerald-500/30 hover:bg-background/70">
              <div className="h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-gradient-to-br from-emerald-500/25 via-cyan-500/20 to-teal-500/25 ring-1 ring-white/5">
                {track.thumbnail ? (
                  <img src={track.thumbnail} alt={track.title} className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-xs font-semibold text-foreground/70">GaanaPy</div>
                )}
              </div>

              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-foreground">{track.title}</p>
                <p className="truncate text-xs text-muted-foreground">{track.artistName}{track.albumName ? ` · ${track.albumName}` : ''}</p>
                <p className="mt-1 text-xs text-muted-foreground">{formatDuration(track.duration)}</p>
              </div>

              <div className="flex shrink-0 items-center gap-2">
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => onQueue(track)}
                  className="rounded-full bg-emerald-500/10 text-emerald-200 hover:bg-emerald-500/20"
                >
                  <Plus className="h-4 w-4" />
                  Queue
                </Button>
                <Button
                  size="sm"
                  onClick={() => onPlayNow(track)}
                  disabled={!canControl}
                  className="rounded-full bg-gradient-to-r from-emerald-500 to-cyan-500 text-white shadow-lg shadow-emerald-500/20 disabled:opacity-50"
                >
                  <Play className="h-4 w-4 fill-current" />
                  Play
                </Button>
              </div>

              {isQueued && <span className="absolute right-4 top-4 hidden text-[10px] font-semibold uppercase tracking-[0.18em] text-emerald-300 md:block">Queued</span>}
            </article>
          );
        })}
      </div>
    </section>
  );
};