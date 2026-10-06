import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../environments/environment';

type Params = Record<string, string | number | boolean | null | undefined>;

/// Thin wrapper over the backend: unwraps `{ success, data }` and turns
/// errors into readable messages.
@Injectable({ providedIn: 'root' })
export class ApiService {
  private http = inject(HttpClient);
  readonly base = environment.apiUrl;

  get<T>(path: string, params?: Params) {
    return this.unwrap<T>(this.http.get(`${this.base}${path}`, { params: this.params(params) }));
  }
  post<T>(path: string, body?: unknown) {
    return this.unwrap<T>(this.http.post(`${this.base}${path}`, body ?? {}));
  }
  put<T>(path: string, body: unknown) {
    return this.unwrap<T>(this.http.put(`${this.base}${path}`, body));
  }
  patch<T>(path: string, body: unknown) {
    return this.unwrap<T>(this.http.patch(`${this.base}${path}`, body));
  }
  delete<T>(path: string, params?: Params) {
    return this.unwrap<T>(this.http.delete(`${this.base}${path}`, { params: this.params(params) }));
  }

  private params(params?: Params) {
    let p = new HttpParams();
    for (const [k, v] of Object.entries(params ?? {})) {
      if (v !== null && v !== undefined && v !== '') p = p.set(k, String(v));
    }
    return p;
  }

  private async unwrap<T>(req: import('rxjs').Observable<any>): Promise<T> {
    try {
      const res = await firstValueFrom(req);
      return res?.data as T;
    } catch (e) {
      throw new Error(errorMessage(e));
    }
  }
}

export function errorMessage(e: unknown): string {
  if (e instanceof HttpErrorResponse) {
    if (e.status === 0) return 'Cannot reach the server. Check your connection.';
    const body = e.error;
    const detail = Array.isArray(body?.meta?.errors) ? `: ${body.meta.errors.join(', ')}` : '';
    return (body?.message ?? e.message) + detail;
  }
  return e instanceof Error ? e.message : String(e);
}
