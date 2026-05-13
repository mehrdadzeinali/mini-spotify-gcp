import { Injectable, inject } from '@angular/core';
import { Auth, signInWithEmailAndPassword, createUserWithEmailAndPassword, signInWithPopup, GoogleAuthProvider, signOut, user } from '@angular/fire/auth';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private auth = inject(Auth);
  
  user$ = user(this.auth);

  register(email: string, password: string) {
    return createUserWithEmailAndPassword(this.auth, email, password);
  }

  loginWithEmail(email: string, password: string) {
    return signInWithEmailAndPassword(this.auth, email, password);
  }

  loginWithGoogle() {
    return signInWithPopup(this.auth, new GoogleAuthProvider());
  }

  logout() {
    return signOut(this.auth);
  }
}