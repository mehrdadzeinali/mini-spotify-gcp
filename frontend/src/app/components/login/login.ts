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
  isRegistering = false;

  get passwordChecks() {
    return {
      length:    this.password.length >= 8,
      uppercase: /[A-Z]/.test(this.password),
      lowercase: /[a-z]/.test(this.password),
      special:   /[^A-Za-z0-9]/.test(this.password),
    };
  }

  get passwordValid(): boolean {
    return Object.values(this.passwordChecks).every(Boolean);
  }

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
    if (!this.passwordValid) {
      this.error = 'Please meet all password requirements.';
      return;
    }
    try {
      await this.auth.register(this.email, this.password);
      this.router.navigate(['/home']);
    } catch (e: any) {
      this.error = e.message;
    }
  }
}