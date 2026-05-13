import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth';

interface Song {
  id: string;
  title: string;
  artist: string;
  url?: string;
}

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './home.html',
  styleUrl: './home.css'
})
export class HomeComponent implements OnInit {
  private auth = inject(AuthService);
  private router = inject(Router);

  userEmail = '';
  isPlaying = false;
  currentSong: Song | null = null;

  songs: Song[] = [
    { id: '1', title: 'Track One', artist: 'Artist A' },
    { id: '2', title: 'Track Two', artist: 'Artist B' },
    { id: '3', title: 'Track Three', artist: 'Artist C' },
    { id: '4', title: 'Track Four', artist: 'Artist D' },
    { id: '5', title: 'Track Five', artist: 'Artist E' },
    { id: '6', title: 'Track Six', artist: 'Artist F' },
  ];

  ngOnInit() {
    this.auth.user$.subscribe(user => {
      this.userEmail = user?.email || '';
    });
  }

  playSong(song: Song) {
    this.currentSong = song;
    this.isPlaying = true;
  }

  togglePlay() { this.isPlaying = !this.isPlaying; }
  previous() {}
  next() {}

  async logout() {
    await this.auth.logout();
    this.router.navigate(['/login']);
  }
}
