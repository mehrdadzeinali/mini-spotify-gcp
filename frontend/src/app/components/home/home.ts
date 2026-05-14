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
  sidebarOpen = false;

  ngOnInit() {
    this.auth.user$.subscribe(user => {
      this.userEmail = user?.email || '';
    });

    this.songsService.getSongs().subscribe(songs => {
      this.songs = songs;
      this.cdr.detectChanges();
    });

    this.audio.ontimeupdate = () => {
      this.currentTime = Math.floor(this.audio.currentTime);
      this.cdr.detectChanges();
    };

    this.audio.onloadedmetadata = () => {
      this.duration = Math.floor(this.audio.duration);
      this.cdr.detectChanges();
    };

    this.audio.onended = () => {
      this.next();
    };
  }

  ngOnDestroy() {
    this.audio.pause();
  }

  playSong(song: Song) {
    this.currentSong = song;
    this.audio.src = song.url || '';
    this.audio.play();
    this.isPlaying = true;
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