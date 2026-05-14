import { Component, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SongsService } from '../../services/songs';
import { PlayerService, Song } from '../../services/player';

@Component({
  selector: 'app-search',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './search.html',
  styleUrls: ['./search.css']
})
export class SearchComponent {
  private songsService = inject(SongsService);
  player = inject(PlayerService);
  private cdr = inject(ChangeDetectorRef);

  searchQuery = '';
  results: Song[] = [];
  isLoading = false;
  hasSearched = false;

  onSearch() {
    if (!this.searchQuery.trim()) {
      this.results = [];
      this.hasSearched = false;
      return;
    }

    this.isLoading = true;
    this.hasSearched = true;

    this.songsService.getSongs(this.searchQuery, undefined, 50).subscribe(songs => {
      this.results = songs;
      this.player.setQueue(songs);
      this.isLoading = false;
      this.cdr.detectChanges();
    });
  }

  play(song: Song) {
    this.player.setQueue(this.results);
    this.player.playSong(song);
  }
}