import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Auth } from '@angular/fire/auth';
import { from, switchMap, tap } from 'rxjs';
import { BehaviorSubject } from 'rxjs';
import { environment } from '../../environments/environment';

export interface Playlist {
  id?: string;
  name: string;
  userId?: string;
  songs: string[];
  createdAt?: string;
}

@Injectable({ providedIn: 'root' })
export class PlaylistsService {
  private http = inject(HttpClient);
  private auth = inject(Auth);
  private apiUrl = environment.apiUrl;

  // Shared state — both Layout and Library subscribe to this
  playlists$ = new BehaviorSubject<Playlist[]>([]);
  likedIds$ = new BehaviorSubject<string[]>([]);

  private getHeaders() {
    return from(this.auth.currentUser!.getIdToken()).pipe(
      switchMap(token => {
        const headers = new HttpHeaders({ Authorization: `Bearer ${token}` });
        return [headers];
      })
    );
  }

  getPlaylists() {
    return this.getHeaders().pipe(
      switchMap(headers => this.http.get<Playlist[]>(`${this.apiUrl}/playlists`, { headers })),
      tap(playlists => this.playlists$.next(playlists))
    );
  }

  createPlaylist(name: string) {
    return this.getHeaders().pipe(
      switchMap(headers => this.http.post<Playlist>(`${this.apiUrl}/playlists`, { name }, { headers })),
      tap(playlist => this.playlists$.next([...this.playlists$.value, playlist]))
    );
  }

  addSongToPlaylist(playlistId: string, songId: string) {
    return this.getHeaders().pipe(
      switchMap(headers => this.http.post(`${this.apiUrl}/playlists/${playlistId}/songs`, { songId }, { headers })),
      tap(() => {
        const updated = this.playlists$.value.map(p => {
          if (p.id === playlistId && !p.songs.includes(songId)) {
            return { ...p, songs: [...p.songs, songId] };
          }
          return p;
        });
        this.playlists$.next(updated);
      })
    );
  }

  removeSongFromPlaylist(playlistId: string, songId: string) {
    return this.getHeaders().pipe(
      switchMap(headers => this.http.delete(`${this.apiUrl}/playlists/${playlistId}/songs/${songId}`, { headers })),
      tap(() => {
        const updated = this.playlists$.value.map(p => {
          if (p.id === playlistId) {
            return { ...p, songs: p.songs.filter(s => s !== songId) };
          }
          return p;
        });
        this.playlists$.next(updated);
      })
    );
  }

  deletePlaylist(playlistId: string) {
    return this.getHeaders().pipe(
      switchMap(headers => this.http.delete(`${this.apiUrl}/playlists/${playlistId}`, { headers })),
      tap(() => this.playlists$.next(this.playlists$.value.filter(p => p.id !== playlistId)))
    );
  }
}