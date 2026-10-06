import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { BehaviorSubject, throwError } from 'rxjs';
import { catchError, filter, switchMap, take, tap } from 'rxjs/operators';
import { AuthService } from './auth.service';

const refreshing$ = new BehaviorSubject<boolean>(false);

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);
  const withToken = (r: typeof req) => {
    const token = auth.getToken();
    return token && !r.url.includes('/auth/') ? r.clone({ setHeaders: { Authorization: `Bearer ${token}` } }) : r;
  };

  return next(withToken(req)).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status !== 401 || req.url.includes('/auth/')) return throwError(() => error);

      if (!refreshing$.value) {
        refreshing$.next(true);
        return auth.refresh().pipe(
          tap((res) => auth.storeTokens(res.data.accessToken, res.data.refreshToken)),
          switchMap(() => {
            refreshing$.next(false);
            return next(withToken(req));
          }),
          catchError((e) => {
            refreshing$.next(false);
            auth.logout();
            return throwError(() => e);
          }),
        );
      }
      // Another request is already refreshing; retry once it is done
      return refreshing$.pipe(
        filter((r) => !r),
        take(1),
        switchMap(() => next(withToken(req))),
      );
    }),
  );
};
