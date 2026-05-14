import { Component, inject, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth';
import { SongsService } from '../../services/songs';

interface Song {
  id: string;
  title: string;
  artist: string;
  album?: string;
  genre?: string;
  duration?: number;
  url?: string;
  cover?: string;
}

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './home.html',
  styleUrl: './home.css'
})
export class HomeComponent implements OnInit, OnDestroy {
  private auth = inject(AuthService);
  private router = inject(Router);
  private songsService = inject(SongsService);
  private cdr = inject(ChangeDetectorRef);

  private audio = new Audio();

  userEmail = '';
  isPlaying = false;
  currentSong: Song | null = null;
  songs: Song[] = [];
  currentTime = 0;
  duration = 0;
  volume = 1;
  sidebarOpen = false;
  searchQuery = '';
  selectedGenre = '';
  genres = ['Unknown', 'jazz', 'electronic', 'pop', 'hiphop', 'classical', 'rock'];
  isLoading = false;

  ngOnInit() {
    this.auth.user$.subscribe(user => {
      this.userEmail = user?.email || '';
    });
  
    this.loadSongs();
  }

  ngOnDestroy() {
    this.audio.pause();
  }

  loadSongs() {
    this.isLoading = true;
    this.songsService.getSongs(this.searchQuery, this.selectedGenre).subscribe(songs => {
      this.songs = songs;
      this.isLoading = false;
      this.cdr.detectChanges();
    });
  }

  onSearch(event: any) {
    this.searchQuery = event.target.value;
    this.loadSongs();
  }

  onGenreFilter(genre: string) {
    this.selectedGenre = this.selectedGenre === genre ? '' : genre;
    this.loadSongs();
  }

  playSong(song: Song) {
    this.currentSong = song;
    this.audio.src = song.url || '';
    this.audio.volume = this.volume;
    this.audio.play();
    this.isPlaying = true;
    this.setupMediaSession(song);
    this.cdr.detectChanges();
  }

  setupMediaSession(song: Song) {
    if (!('mediaSession' in navigator)) return;

    navigator.mediaSession.metadata = new MediaMetadata({
      title: song.title,
      artist: song.artist,
      album: song.album || '',
      artwork: song.cover ? [{ src: song.cover, sizes: '300x300', type: 'image/jpeg' }] : []
    });

    navigator.mediaSession.setActionHandler('play', () => {
      this.audio.play();
      this.isPlaying = true;
      this.cdr.detectChanges();
    });

    navigator.mediaSession.setActionHandler('pause', () => {
      this.audio.pause();
      this.isPlaying = false;
      this.cdr.detectChanges();
    });

    navigator.mediaSession.setActionHandler('nexttrack', () => this.next());
    navigator.mediaSession.setActionHandler('previoustrack', () => this.previous());
  }

  togglePlay() {
    if (this.isPlaying) {
      this.audio.pause();
    } else {
      this.audio.play();
    }
    this.isPlaying = !this.isPlaying;
  }

  next() {
    const index = this.songs.indexOf(this.currentSong!);
    const nextSong = this.songs[index + 1] || this.songs[0];
    this.playSong(nextSong);
  }

  previous() {
    const index = this.songs.indexOf(this.currentSong!);
    const prevSong = this.songs[index - 1] || this.songs[this.songs.length - 1];
    this.playSong(prevSong);
  }

  seek(event: any) {
    this.audio.currentTime = event.target.value;
  }

  setVolume(event: any) {
    this.volume = event.target.value;
    this.audio.volume = this.volume;
  }

  formatTime(seconds: number): string {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  }

  toggleSidebar() {
    this.sidebarOpen = !this.sidebarOpen;
  }

  async logout() {
    await this.auth.logout();
    this.router.navigate(['/login']);
  }
}