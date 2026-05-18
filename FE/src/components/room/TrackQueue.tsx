import { Play, Repeat, Repeat1, Shuffle, SkipBack, SkipForward, Trash2 } from 'lucide-react';
import { Button } from '../ui/button';
import { JamendoTrack, formatDuration } from '@/lib/jamendo';

interface TrackQueueProps {
  queue: JamendoTrack[];
  history: JamendoTrack[];
  repeatMode: 'off' | 'all' | 'one';
  shuffleMode: boolean;
  canControl: boolean;
  onNext: () => void;
  onPrevious: () => void;
  onToggleRepeat: () => void;
  onToggleShuffle: () => void;
  onRemove: (trackId: string) => void;
  onClear: () => void;
}

export const TrackQueue = ({
  queue,
  history,
  repeatMode,
  shuffleMode,
  canControl,
  onNext,
  onPrevious,
  onToggleRepeat,
  onToggleShuffle,
  onRemove,
  onClear,
}: TrackQueueProps) => {
  const repeatLabel = repeatMode === 'one' ? 'Repeat one' : repeatMode === 'all' ? 'Repeat all' : 'Repeat off';

  return (
    <section className="space-y-4 rounded-3xl border border-border/50 bg-card/70 backdrop-blur-xl p-4 lg:p-5 shadow-2xl shadow-black/20">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">Queue</p>
          <h3 className="mt-1 text-lg font-semibold text-foreground">Room lineup</h3>
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span className="rounded-full border border-border/60 px-2.5 py-1">{queue.length} tracks</span>
          <span className="rounded-full border border-border/60 px-2.5 py-1">{history.length} played</span>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <Button size="sm" variant="secondary" onClick={onPrevious} disabled={!canControl || !history.length} className="rounded-full">
          <SkipBack className="h-4 w-4" />
          Prev
        </Button>
        <Button size="sm" variant="secondary" onClick={onNext} disabled={!canControl} className="rounded-full">
          <SkipForward className="h-4 w-4" />
          Next
        </Button>
        <Button size="sm" variant={repeatMode === 'off' ? 'secondary' : 'default'} onClick={onToggleRepeat} disabled={!canControl} className="rounded-full">
          {repeatMode === 'one' ? <Repeat1 className="h-4 w-4" /> : <Repeat className="h-4 w-4" />}
          {repeatLabel}
        </Button>
        <Button size="sm" variant={shuffleMode ? 'default' : 'secondary'} onClick={onToggleShuffle} disabled={!canControl} className="rounded-full">
          <Shuffle className="h-4 w-4" />
          Shuffle
        </Button>
      </div>

      <div className="rounded-2xl border border-border/50 bg-background/50 p-3">
        <div className="mb-3 flex items-center justify-between text-sm font-medium text-foreground">
          <span>Up next</span>
          <button
            type="button"
            onClick={onClear}
            disabled={!canControl || !queue.length}
            className="inline-flex items-center gap-2 text-xs text-muted-foreground transition hover:text-foreground disabled:opacity-40"
          >
            <Trash2 className="h-3.5 w-3.5" />
            Clear
          </button>
        </div>

        {queue.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border/60 px-4 py-8 text-center text-sm text-muted-foreground">
            Queue a track to keep the room moving automatically.
          </div>
        ) : (
          <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
            {queue.map((track, index) => (
              <div key={track.id} className="flex items-center gap-3 rounded-2xl border border-border/40 bg-card/60 p-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-500/10 text-xs font-semibold text-emerald-200">
                  {index + 1}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-foreground">{track.title}</p>
                  <p className="truncate text-xs text-muted-foreground">{track.artistName} · {formatDuration(track.duration)}</p>
                </div>
                <button
                  type="button"
                  onClick={() => onRemove(track.id)}
                  disabled={!canControl}
                  className="rounded-full p-2 text-muted-foreground transition hover:bg-destructive/10 hover:text-destructive disabled:opacity-40"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="rounded-2xl border border-border/50 bg-background/50 p-3">
        <p className="mb-2 text-sm font-medium text-foreground">Recently played</p>
        {history.length === 0 ? (
          <div className="rounded-xl px-3 py-5 text-sm text-muted-foreground">Nothing yet. The room history will appear here.</div>
        ) : (
          <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
            {history.slice(0, 5).map((track) => (
              <div key={track.id} className="flex items-center gap-3 rounded-2xl px-3 py-2 text-sm text-muted-foreground">
                <Play className="h-3.5 w-3.5" />
                <span className="truncate">{track.title} · {track.artistName}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
};