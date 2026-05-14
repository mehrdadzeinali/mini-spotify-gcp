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

  ngOnInit() {
    this.loadData();
  }

  loadData() {
    this.isLoading = true;

    this.auth.user$.subscribe(user => {
      if (!user) return;
      user.getIdToken().then(token => {
        // Load liked songs
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

    // Load playlists
    this.playlistsService.getPlaylists().subscribe(playlists => {
      this.playlists = playlists;
      this.cdr.detectChanges();
    });
  }

  play(song: Song, queue: Song[]) {
    this.player.setQueue(queue);
    this.player.playSong(song);
  }

  createPlaylist() {
    if (!this.newPlaylistName.trim()) return;
    this.playlistsService.createPlaylist(this.newPlaylistName).subscribe(playlist => {
      this.playlists.push(playlist);
      this.newPlaylistName = '';
      this.showCreatePlaylist = false;
      this.cdr.detectChanges();
    });
  }

  deletePlaylist(playlist: Playlist) {
    if (!playlist.id) return;
    this.playlistsService.deletePlaylist(playlist.id).subscribe(() => {
      this.playlists = this.playlists.filter(p => p.id !== playlist.id);
      if (this.selectedPlaylist?.id === playlist.id) this.selectedPlaylist = null;
      this.cdr.detectChanges();
    });
  }

  addToPlaylist(playlistId: string, songId: string) {
    this.playlistsService.addSongToPlaylist(playlistId, songId).subscribe(() => {
      this.showAddToPlaylist = null;
      this.cdr.detectChanges();
    });
  }

  getPlaylistSongs(playlist: Playlist): Song[] {
    return this.allSongs.filter(s => playlist.songs.includes(s.id));
  }

  likeSong(song: Song) {
    this.auth.user$.subscribe(user => {
      if (!user) return;
      user.getIdToken().then(token => {
        this.http.post(`${environment.apiUrl}/streaming/like`, { songId: song.id }, {
          headers: new HttpHeaders({ Authorization: `Bearer ${token}` })
        }).subscribe(() => {
          if (!this.likedSongs.find(s => s.id === song.id)) {
            this.likedSongs.push(song);
          }
          this.cdr.detectChanges();
        });
      });
    });
  }

  isLiked(song: Song): boolean {
    return this.likedSongs.some(s => s.id === song.id);
  }
}