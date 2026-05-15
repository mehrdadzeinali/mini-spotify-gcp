import { Routes } from '@angular/router';
import { LoginComponent } from './components/login/login';
import { HomeComponent } from './components/home/home';
import { SearchComponent } from './components/search/search';
import { LibraryComponent } from './components/library/library';
import { LayoutComponent } from './components/layout/layout';
import { authGuard } from './guards/auth-guard';
import { GenresComponent } from './components/genres/genres';

export const routes: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  { path: 'login', component: LoginComponent },
  {
    path: '',
    component: LayoutComponent,
    canActivate: [authGuard],
    children: [
      { path: 'home', component: HomeComponent },
      { path: 'search', component: SearchComponent },
      { path: 'library', component: LibraryComponent },
      { path: 'genres', component: GenresComponent },
      { path: 'genres/:genre', component: GenresComponent },
    ]
  }
];