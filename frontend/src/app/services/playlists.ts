import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Auth } from '@angular/fire/auth';
import { from, switchMap } from 'rxjs';
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
      switchMap(headers => this.http.get<Playlist[]>(`${this.apiUrl}/playlists`, { headers }))
    );
  }

  createPlaylist(name: string) {
    return this.getHeaders().pipe(
      switchMap(headers => this.http.post<Playlist>(`${this.apiUrl}/playlists`, { name }, { headers }))
    );
  }

  addSongToPlaylist(playlistId: string, songId: string) {
    return this.getHeaders().pipe(
      switchMap(headers => this.http.post(`${this.apiUrl}/playlists/${playlistId}/songs`, { songId }, { headers }))
    );
  }

  deletePlaylist(playlistId: string) {
    return this.getHeaders().pipe(
      switchMap(headers => this.http.delete(`${this.apiUrl}/playlists/${playlistId}`, { headers }))
    );
  }
}
