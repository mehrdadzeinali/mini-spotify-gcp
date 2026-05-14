import { Component, inject, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SongsService } from '../../services/songs';
import { PlayerService, Song } from '../../services/player';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './home.html',
  styleUrls: ['./home.css']
})
export class HomeComponent implements OnInit {
  private songsService = inject(SongsService);
  player = inject(PlayerService);
  private cdr = inject(ChangeDetectorRef);

  trending: Song[] = [];
  recentlyAdded: Song[] = [];
  random: Song[] = [];
  genres: string[] = [];
  songsByGenre: { [genre: string]: Song[] } = {};
  isLoading = true;

  ngOnInit() {
    this.loadAll();
  }

  async loadAll() {
    this.isLoading = true;

    this.songsService.getSongs(undefined, undefined, 20, 0).subscribe(songs => {
      this.trending = this.shuffle(songs).slice(0, 10);
      this.recentlyAdded = songs.slice(0, 10);
      this.random = this.shuffle(songs).slice(0, 10);
      this.player.setQueue(songs);
      this.isLoading = false;
      this.cdr.detectChanges();
    });

    this.songsService.getGenres().subscribe(genres => {
      this.genres = genres.slice(0, 6);
      this.genres.forEach(genre => {
        this.songsService.getSongs(undefined, genre, 10).subscribe(songs => {
          this.songsByGenre[genre] = songs;
          this.cdr.detectChanges();
        });
      });
    });
  }

  shuffle(arr: Song[]): Song[] {
    return [...arr].sort(() => Math.random() - 0.5);
  }

  play(song: Song, queue: Song[]) {
    this.player.setQueue(queue);
    this.player.playSong(song);
  }
}