import { Injectable, inject } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { AuthService } from './auth';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { environment } from '../../environments/environment';

export interface Song {
  id: string;
  title: string;
  artist: string;
  album?: string;
  genre?: string;
  duration?: number;
  url?: string;
  cover?: string;
}

@Injectable({ providedIn: 'root' })
export class PlayerService {
  private audio = new Audio();
  private auth = inject(AuthService);
  private http = inject(HttpClient);
  private apiUrl = environment.apiUrl;

  currentSong$ = new BehaviorSubject<Song | null>(null);
  isPlaying$ = new BehaviorSubject<boolean>(false);
  currentTime$ = new BehaviorSubject<number>(0);
  duration$ = new BehaviorSubject<number>(0);
  volume$ = new BehaviorSubject<number>(1);
  queue$ = new BehaviorSubject<Song[]>([]);

  constructor() {
    this.audio.ontimeupdate = () => {
      this.currentTime$.next(Math.floor(this.audio.currentTime));
    };

    this.audio.onloadedmetadata = () => {
      this.duration$.next(Math.floor(this.audio.duration));
    };

    this.audio.onended = () => {
      this.next();
    };
  }

  playSong(song: Song) {
    this.currentSong$.next(song);
    this.audio.src = song.url || '';
    this.audio.volume = this.volume$.value;
    this.audio.play();
    this.isPlaying$.next(true);
    this.setupMediaSession(song);
    this.trackPlayEvent(song);
  }

  togglePlay() {
    if (this.isPlaying$.value) {
      this.audio.pause();
      this.isPlaying$.next(false);
    } else {
      this.audio.play();
      this.isPlaying$.next(true);
    }
  }

  next() {
    const queue = this.queue$.value;
    const current = this.currentSong$.value;
    if (!queue.length || !current) return;
    const index = queue.findIndex(s => s.id === current.id);
    const nextSong = queue[index + 1] || queue[0];
    this.playSong(nextSong);
  }

  previous() {
    const queue = this.queue$.value;
    const current = this.currentSong$.value;
    if (!queue.length || !current) return;
    const index = queue.findIndex(s => s.id === current.id);
    const prevSong = queue[index - 1] || queue[queue.length - 1];
    this.playSong(prevSong);
  }

  seek(seconds: number) {
    this.audio.currentTime = seconds;
  }

  skipForward() {
    this.audio.currentTime = Math.min(this.audio.currentTime + 15, this.audio.duration);
  }

  skipBackward() {
    this.audio.currentTime = Math.max(this.audio.currentTime - 15, 0);
  }

  setVolume(value: number) {
    this.audio.volume = value;
    this.volume$.next(value);
  }

  setQueue(songs: Song[]) {
    this.queue$.next(songs);
  }

  private setupMediaSession(song: Song) {
    if (!('mediaSession' in navigator)) return;
    navigator.mediaSession.metadata = new MediaMetadata({
      title: song.title,
      artist: song.artist,
      album: song.album || '',
      artwork: song.cover ? [{ src: song.cover, sizes: '300x300', type: 'image/jpeg' }] : []
    });
    navigator.mediaSession.setActionHandler('play', () => { this.audio.play(); this.isPlaying$.next(true); });
    navigator.mediaSession.setActionHandler('pause', () => { this.audio.pause(); this.isPlaying$.next(false); });
    navigator.mediaSession.setActionHandler('nexttrack', () => this.next());
    navigator.mediaSession.setActionHandler('previoustrack', () => this.previous());
    navigator.mediaSession.setActionHandler('seekforward', () => this.skipForward());
    navigator.mediaSession.setActionHandler('seekbackward', () => this.skipBackward());
  }

  private trackPlayEvent(song: Song) {
    this.auth.user$.subscribe(user => {
      if (!user) return;
      user.getIdToken().then(token => {
        this.http.post(`${this.apiUrl}/streaming/play`, {
          songId: song.id,
          title: song.title,
          artist: song.artist,
          genre: song.genre
        }, {
          headers: new HttpHeaders({ Authorization: `Bearer ${token}` })
        }).subscribe();
      });
    });
  }

  formatTime(seconds: number | null): string {
    if (!seconds) return '0:00';
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  }
}
