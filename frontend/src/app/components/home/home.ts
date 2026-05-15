import { Component, inject, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { SongsService } from '../../services/songs';
import { PlayerService, Song } from '../../services/player';
import { getGenreColor } from '../../utils/genre-colors';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './home.html',
  styleUrls : ['./home.css']
})
export class HomeComponent implements OnInit {
  private songsService = inject(SongsService);
  private router = inject(Router);
  private cdr = inject(ChangeDetectorRef);
  player = inject(PlayerService);

  trending: Song[] = [];
  forYou: Song[] = [];
  random: Song[] = [];
  recentlyAdded: Song[] = [];
  genres: string[] = [];
  isLoading = true;

  greeting = this.getGreeting();

  ngOnInit() {
    this.loadAll();
  }

  getGreeting(): string {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 18) return 'Good afternoon';
    return 'Good evening';
  }

  loadAll() {
    this.isLoading = true;
    this.songsService.getSongs(undefined, undefined, 50, 0).subscribe(songs => {
      const shuffled = [...songs].sort(() => Math.random() - 0.5);
      this.trending = shuffled.slice(0, 10);
      this.forYou = shuffled.slice(10, 20);
      this.random = shuffled.slice(20, 30);
      this.recentlyAdded = songs.slice(0, 10);
      this.player.setQueue(songs);
      this.isLoading = false;
      this.cdr.detectChanges();
    });

    this.songsService.getGenres().subscribe(genres => {
      this.genres = genres.filter(g => g !== 'Unknown').sort().slice(0, 10);
      this.cdr.detectChanges();
    });
  }

  getColor(genre: string): string {
    return getGenreColor(genre);
  }

  play(song: Song, queue: Song[]) {
    this.player.setQueue(queue);
    this.player.playSong(song);
  }

  navigateToGenre(genre: string) {
    this.router.navigate(['/genres', genre]);
  }

  navigateToGenres() {
    this.router.navigate(['/genres']);
  }
}