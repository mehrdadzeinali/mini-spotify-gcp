import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class SongsService {
  private http = inject(HttpClient);
  private apiUrl = environment.apiUrl;

  getSongs() {
    return this.http.get<any[]>(`${this.apiUrl}/songs`);
  }

  getPlaylists() {
    return this.http.get<any[]>(`${this.apiUrl}/playlists`);
  }
}