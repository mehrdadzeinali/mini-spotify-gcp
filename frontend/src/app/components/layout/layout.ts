import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import { PlayerService } from '../../services/player';
import { AuthService } from '../../services/auth';
import { PlaylistsService, Playlist } from '../../services/playlists';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './layout.html',
  styleUrls: ['./layout.css']
})
export class LayoutComponent implements OnInit {
  private router = inject(Router);
  private auth = inject(AuthService);
  private playlistsService = inject(PlaylistsService);
  private http = inject(HttpClient);
  player = inject(PlayerService);

  sidebarOpen = false;
  currentRoute = '';
  isLiked = false;
  showPlaylistModal = false;
  playlists: Playlist[] = [];
  likedIds: string[] = [];
  toast: string | null = null;

  constructor() {
    this.router.events.pipe(
      filter(e => e instanceof NavigationEnd)
    ).subscribe((e: any) => {
      this.currentRoute = e.url;
      this.sidebarOpen = false;
    });

    this.player.currentSong$.subscribe(song => {
      if (song) {
        this.isLiked = this.likedIds.includes(song.id);
      } else {
        this.isLiked = false;
      }
    });
  }

  ngOnInit() {
    this.auth.user$.subscribe(user => {
      if (user) {
        this.loadLikes();
        this.loadPlaylists();
      } else {
        this.player.stop();
        this.likedIds = [];
        this.playlists = [];
        this.isLiked = false;
      }
    });
  }

  loadLikes() {
    this.auth.user$.subscribe(user => {
      if (!user) return;
      user.getIdToken().then(token => {
        this.http.get<string[]>(`${environment.apiUrl}/streaming/likes`, {
          headers: new HttpHeaders({ Authorization: `Bearer ${token}` })
        }).subscribe(ids => {
          this.likedIds = ids;
          const current = this.player.currentSong$.value;
          if (current) this.isLiked = ids.includes(current.id);
        });
      });
    });
  }

  loadPlaylists() {
    this.playlistsService.getPlaylists().subscribe();
    // Subscribe to shared state
    this.playlistsService.playlists$.subscribe(p => {
      this.playlists = p;
    });
  }

  toggleLike() {
    const song = this.player.currentSong$.value;
    if (!song) return;
    this.auth.user$.subscribe(user => {
      if (!user) return;
      user.getIdToken().then(token => {
        if (this.isLiked) {
          // Unlike
          this.http.delete(`${environment.apiUrl}/streaming/like/${song.id}`, {
            headers: new HttpHeaders({ Authorization: `Bearer ${token}` })
          }).subscribe(() => {
            this.likedIds = this.likedIds.filter(id => id !== song.id);
            this.isLiked = false;
            this.showToast('Removed from liked songs');
          });
        } else {
          // Like
          this.http.post(`${environment.apiUrl}/streaming/like`, { songId: song.id }, {
            headers: new HttpHeaders({ Authorization: `Bearer ${token}` })
          }).subscribe(() => {
            this.likedIds.push(song.id);
            this.isLiked = true;
            this.showToast('Added to liked songs ❤️');
          });
        }
      });
    });
  }

  addToPlaylist(playlistId: string) {
    const song = this.player.currentSong$.value;
    if (!song) return;
    this.playlistsService.addSongToPlaylist(playlistId, song.id).subscribe(() => {
      this.showPlaylistModal = false;
      this.showToast('Added to playlist ✓');
    });
  }

  showToast(message: string) {
    this.toast = message;
    setTimeout(() => { this.toast = null; }, 2500);
  }

  toggleSidebar() { this.sidebarOpen = !this.sidebarOpen; }
  navigate(path: string) { this.router.navigate([path]); }
  seek(event: any) { this.player.seek(event.target.value); }
  setVolume(event: any) { this.player.setVolume(parseFloat(event.target.value)); }

  async logout() {
    this.player.stop();
    await this.auth.logout();
    this.router.navigate(['/login']);
  }
}