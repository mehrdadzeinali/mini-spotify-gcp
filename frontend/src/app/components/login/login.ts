import { Component, inject } from '@angular/core';
import { AuthService } from '../../services/auth';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule, CommonModule],
  templateUrl: './login.html',
  styleUrl: './login.css'
})
export class LoginComponent {
  private auth = inject(AuthService);
  private router = inject(Router);

  email = '';
  password = '';
  error = '';

  async loginWithEmail() {
    try {
      await this.auth.loginWithEmail(this.email, this.password);
      this.router.navigate(['/home']);
    } catch (e: any) {
      this.error = e.message;
    }
  }

  async loginWithGoogle() {
    try {
      await this.auth.loginWithGoogle();
      this.router.navigate(['/home']);
    } catch (e: any) {
      this.error = e.message;
    }
  }

  async register() {
    try {
      await this.auth.register(this.email, this.password);
      this.router.navigate(['/home']);
    } catch (e: any) {
      this.error = e.message;
    }
  }
}