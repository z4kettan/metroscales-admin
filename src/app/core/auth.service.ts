import { Injectable, computed, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../environments/environment';
import { errorMessage } from './api.service';
import { User } from './models';

const TOKEN_KEY = 'ms_access_token';
const REFRESH_KEY = 'ms_refresh_token';
const USER_KEY = 'ms_user';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private http = inject(HttpClient);
  private router = inject(Router);

  private _user = signal<User | null>(this.loadUser());
  readonly user = this._user.asReadonly();
  readonly isLoggedIn = computed(() => !!this._user());

  private loadUser(): User | null {
    try {
      return JSON.parse(localStorage.getItem(USER_KEY) ?? 'null');
    } catch {
      return null;
    }
  }

  getToken() {
    return localStorage.getItem(TOKEN_KEY);
  }

  async login(username: string, password: string) {
    let res: any;
    try {
      res = await firstValueFrom(this.http.post<any>(`${environment.apiUrl}/auth/login`, { username: username.trim(), secret: password }));
    } catch (e) {
      throw new Error(errorMessage(e));
    }
    const { user, accessToken, refreshToken } = res.data;
    if (user.role !== 'DEALER_ADMIN') {
      throw new Error('This panel is for the dealer. Shop owners and staff sign in to the Metro Scales app.');
    }
    localStorage.setItem(TOKEN_KEY, accessToken);
    localStorage.setItem(REFRESH_KEY, refreshToken);
    localStorage.setItem(USER_KEY, JSON.stringify(user));
    this._user.set(user);
  }

  refresh() {
    return this.http.post<any>(`${environment.apiUrl}/auth/refresh`, { refreshToken: localStorage.getItem(REFRESH_KEY) });
  }

  storeTokens(accessToken: string, refreshToken: string) {
    localStorage.setItem(TOKEN_KEY, accessToken);
    localStorage.setItem(REFRESH_KEY, refreshToken);
  }

  logout() {
    const refreshToken = localStorage.getItem(REFRESH_KEY);
    if (refreshToken) this.http.post(`${environment.apiUrl}/auth/logout`, { refreshToken }).subscribe({ error: () => {} });
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(REFRESH_KEY);
    localStorage.removeItem(USER_KEY);
    this._user.set(null);
    this.router.navigate(['/login']);
  }
}
