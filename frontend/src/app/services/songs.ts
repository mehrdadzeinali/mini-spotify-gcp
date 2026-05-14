import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Auth } from '@angular/fire/auth';
import { from, switchMap } from 'rxjs';
import { environment } from '../../environments/environment';
import { Song } from './player';

@Injectable({ providedIn: 'root' })
export class SongsService {
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

  getSongs(search?: string, genre?: string, limit = 20, offset = 0) {
    let params = new HttpParams()
      .set('limit', limit.toString())
      .set('offset', offset.toString());
    if (search) params = params.set('search', search);
    if (genre) params = params.set('genre', genre);

    return this.getHeaders().pipe(
      switchMap(headers => this.http.get<Song[]>(`${this.apiUrl}/songs`, { headers, params }))
    );
  }

  getGenres() {
    return this.getHeaders().pipe(
      switchMap(headers => this.http.get<string[]>(`${this.apiUrl}/songs/genres`, { headers }))
    );
  }

  getPlaylists() {
    return this.getHeaders().pipe(
      switchMap(headers => this.http.get<any[]>(`${this.apiUrl}/playlists`, { headers }))
    );
  }
}