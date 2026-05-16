import { Component, inject, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SongsService } from '../../services/songs';
import { PlaylistsService, Playlist } from '../../services/playlists';
import { PlayerService, Song } from '../../services/player';
import { AuthService } from '../../services/auth';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-library',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './library.html',
  styleUrls: ['./library.css']
})
export class LibraryComponent implements OnInit {
  private songsService = inject(SongsService);
  private playlistsService = inject(PlaylistsService);
  private auth = inject(AuthService);
  private http = inject(HttpClient);
  private cdr = inject(ChangeDetectorRef);
  player = inject(PlayerService);

  likedSongs: Song[] = [];
  playlists: Playlist[] = [];
  allSongs: Song[] = [];
  selectedPlaylist: Playlist | null = null;
  activeTab: 'liked' | 'playlists' = 'liked';
  isLoading = true;
  showCreatePlaylist = false;
  newPlaylistName = '';
  showAddToPlaylist: Song | null = null;
  toast: string | null = null;

  ngOnInit() {
    this.loadData();
    this.playlistsService.playlists$.subscribe(playlists => {
      this.playlists = playlists;
      this.cdr.detectChanges();
    });

    this.playlistsService.likedIds$.subscribe(ids => {
      if (ids.length > 0 || this.likedSongs.length > 0) {
        this.likedSongs = this.allSongs.filter(s => ids.includes(s.id));
        this.cdr.detectChanges();
      }
    });
  }

  loadData() {
    this.isLoading = true;
    this.auth.user$.subscribe(user => {
      if (!user) return;
      user.getIdToken().then(token => {
        this.http.get<string[]>(`${environment.apiUrl}/streaming/likes`, {
          headers: new HttpHeaders({ Authorization: `Bearer ${token}` })
        }).subscribe(likedIds => {
          this.songsService.getSongs(undefined, undefined, 100).subscribe(songs => {
            this.allSongs = songs;
            this.likedSongs = songs.filter(s => likedIds.includes(s.id));
            this.isLoading = false;
            this.cdr.detectChanges();
          });
        });
      });
    });
  }

  play(song: Song, queue: Song[]) {
    this.player.setQueue(queue);
    this.player.playSong(song);
  }

  unlikeSong(song: Song) {
    this.auth.user$.subscribe(user => {
      if (!user) return;
      user.getIdToken().then(token => {
        this.http.delete(`${environment.apiUrl}/streaming/like/${song.id}`, {
          headers: new HttpHeaders({ Authorization: `Bearer ${token}` })
        }).subscribe(() => {
          this.likedSongs = this.likedSongs.filter(s => s.id !== song.id);
          this.playlistsService.likedIds$.next(
            this.playlistsService.likedIds$.value.filter(id => id !== song.id)
          );
          this.showToast('Removed from liked songs');
          this.cdr.detectChanges();
        });
      });
    });
  }

  createPlaylist() {
    if (!this.newPlaylistName.trim()) return;
    this.playlistsService.createPlaylist(this.newPlaylistName).subscribe(() => {
      this.newPlaylistName = '';
      this.showCreatePlaylist = false;
      this.showToast('Playlist created');
      this.cdr.detectChanges();
    });
  }

  deletePlaylist(playlist: Playlist) {
    if (!playlist.id) return;
    this.playlistsService.deletePlaylist(playlist.id).subscribe(() => {
      this.playlists = this.playlists.filter(p => p.id !== playlist.id);
      if (this.selectedPlaylist?.id === playlist.id) this.selectedPlaylist = null;
      this.showToast('Playlist deleted');
      this.cdr.detectChanges();
    });
  }

  addToPlaylist(playlistId: string, songId: string) {
    this.playlistsService.addSongToPlaylist(playlistId, songId).subscribe(() => {
      const playlist = this.playlists.find(p => p.id === playlistId);
      if (playlist && !playlist.songs.includes(songId)) {
        playlist.songs = [...playlist.songs, songId];
      }
      // Reload all songs to ensure the new song is in allSongs
      this.songsService.getSongs(undefined, undefined, 1000).subscribe(songs => {
        this.allSongs = songs;
        this.showAddToPlaylist = null;
        this.showToast('Added to playlist ✓');
        this.cdr.detectChanges();
      });
    });
  }

  removeSongFromPlaylist(playlist: Playlist, songId: string) {
    if (!playlist.id) return;
    this.playlistsService.removeSongFromPlaylist(playlist.id, songId).subscribe(() => {
      playlist.songs = playlist.songs.filter(s => s !== songId);
      this.showToast('Removed from playlist');
      this.cdr.detectChanges();
    });
  }

  getPlaylistSongs(playlist: Playlist): Song[] {
    return this.allSongs.filter(s => playlist.songs.includes(s.id));
  }

  isLiked(song: Song): boolean {
    return this.likedSongs.some(s => s.id === song.id);
  }

  showToast(message: string) {
    this.toast = message;
    setTimeout(() => {
      this.toast = null;
      this.cdr.detectChanges();
    }, 2500);
  }
}
