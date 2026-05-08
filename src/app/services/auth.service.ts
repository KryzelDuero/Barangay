import { Injectable } from '@angular/core';
import { BehaviorSubject, from, Observable } from 'rxjs';
import { SupabaseService } from './supabase.service';
import { map, tap } from 'rxjs/operators';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private _isLoggedIn = new BehaviorSubject<boolean>(false);
  isLoggedIn$ = this._isLoggedIn.asObservable();

  constructor(private supabase: SupabaseService) {
    const savedSession = localStorage.getItem('auth_session');
    if (savedSession) this._isLoggedIn.next(true);
  }

  get isLoggedIn(): boolean {
    return this._isLoggedIn.getValue();
  }

  login(username: string, password: string): Observable<boolean> {
    return from(this.supabase.client
      .from('users')
      .select('*')
      .eq('username', username)
      .eq('password', password)
      .single()
    ).pipe(
      map(({ data, error }) => {
        if (data && !error) {
          this._isLoggedIn.next(true);
          localStorage.setItem('auth_session', JSON.stringify(data));
          return true;
        }
        return false;
      })
    );
  }

  signUp(username: string, password: string): Observable<{ success: boolean, error?: string }> {
    return from(this.supabase.client
      .from('users')
      .insert([{ username, password, role: 'staff' }])
    ).pipe(
      map(({ error }) => {
        if (error) {
          if (error.code === '23505') return { success: false, error: 'This username is already taken. Please choose another one.' };
          return { success: false, error: 'An unexpected error occurred. Please try again later.' };
        }
        return { success: true };
      })
    );
  }

  resetPassword(username: string, newPassword: string): Observable<{ success: boolean, error?: string }> {
    // 1. First fetch the user to check the current password
    return from(this.supabase.client
      .from('users')
      .select('password')
      .eq('username', username)
      .single()
    ).pipe(
      map(({ data, error }) => {
        if (error || !data) return { success: false, error: 'User not found.' };
        
        // 2. Check if the new password is the same as the current one
        if (data.password === newPassword) {
          return { success: false, error: 'The new password cannot be the same as your current password.' };
        }
        
        return { success: true };
      }),
      tap(res => {
        // 3. If everything is fine, proceed with the update
        if (res.success) {
          from(this.supabase.client
            .from('users')
            .update({ password: newPassword })
            .eq('username', username)
          ).subscribe();
        }
      })
    );
  }

  logout(): void {
    this._isLoggedIn.next(false);
    localStorage.removeItem('auth_session');
  }
}
