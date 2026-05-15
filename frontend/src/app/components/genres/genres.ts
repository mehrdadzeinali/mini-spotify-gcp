import { Component, inject, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { SongsService } from '../../services/songs';
import { PlayerService, Song } from '../../services/player';
import { GENRE_COLORS, getGenreColor } from '../../utils/genre-colors';

@Component({
  selector: 'app-genres',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './genres.html',
  styleUrls: ['./genres.css']
})
export class GenresComponent implements OnInit {
  private songsService = inject(SongsService);
  private route = inject(ActivatedRoute);
  private cdr = inject(ChangeDetectorRef);
  player = inject(PlayerService);
  router = inject(Router);

  genres: string[] = [];
  selectedGenre: string | null = null;
  songs: Song[] = [];
  isLoading = false;

  ngOnInit() {
    this.songsService.getGenres().subscribe(genres => {
      this.genres = genres.filter(g => g !== 'Unknown').sort();
      this.cdr.detectChanges();
    });

    this.route.params.subscribe(params => {
      if (params['genre']) {
        this.selectedGenre = params['genre'];
        this.loadSongs(params['genre']);
      }
    });
  }

  loadSongs(genre: string) {
    this.isLoading = true;
    this.songsService.getSongs(undefined, genre, 50).subscribe(songs => {
      this.songs = songs;
      this.player.setQueue(songs);
      this.isLoading = false;
      this.cdr.detectChanges();
    });
  }

  selectGenre(genre: string) {
    this.selectedGenre = genre;
    this.router.navigate(['/genres', genre]);
  }

  getColor(genre: string): string {
    return GENRE_COLORS[genre.toLowerCase()] || GENRE_COLORS['default'];
  }

  play(song: Song) {
    this.player.setQueue(this.songs);
    this.player.playSong(song);
  }
}