import { Component, inject, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { SongsService } from '../../services/songs';
import { PlayerService, Song } from '../../services/player';
import { getGenreColor } from '../../utils/genre-colors';
import { AuthService } from '../../services/auth';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './home.html',
  styleUrls: ['./home.css']
})
export class HomeComponent implements OnInit {
  private songsService = inject(SongsService);
  private router = inject(Router);
  private cdr = inject(ChangeDetectorRef);
  private auth = inject(AuthService);
  player = inject(PlayerService);

  currentQueue: 'trending' | 'forYou' | 'random' | 'recently' | null = null;
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
    const usedIds = new Set<string>();

    this.songsService.getTrending().subscribe(trending => {
      this.trending = trending;
      trending.forEach(s => usedIds.add(s.id));
      this.cdr.detectChanges();
    });

    this.auth.user$.subscribe(user => {
      if (!user) return;
      this.songsService.getRecommendations(user.uid).subscribe(recommendations => {
        this.forYou = recommendations.filter(s => !usedIds.has(s.id));
        this.forYou.forEach(s => usedIds.add(s.id));
        this.cdr.detectChanges();
      });
    });

    this.songsService.getSongs(undefined, undefined, 50, 0).subscribe(songs => {
      const shuffled = [...songs].sort(() => Math.random() - 0.5);

      this.random = shuffled.filter(s => !usedIds.has(s.id)).slice(0, 10);
      this.random.forEach(s => usedIds.add(s.id));

      this.recentlyAdded = songs.filter(s => !usedIds.has(s.id)).slice(0, 10);

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

  play(song: Song, queue: Song[], queueName: 'trending' | 'forYou' | 'random' | 'recently') {
    this.currentQueue = queueName;
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
