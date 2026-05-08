import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { from, Observable } from 'rxjs';
import { map, tap } from 'rxjs/operators';
import { SupabaseService } from './supabase.service';

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  // SMS CONFIG (SEMAPHORE)
  private readonly API_KEY = 'd1ff496846440d66f0f55f8dcd4fbaa5';
  private readonly SMS_URL = 'https://api.semaphore.co/api/v4/messages';

  constructor(private http: HttpClient, private supabase: SupabaseService) { }

  /**
   * Sends an SMS using Semaphore API (via Proxy to bypass CORS)
   */
  sendSms(mobileNumber: string, message: string): Observable<any> {
    const targetUrl = `https://api.semaphore.co/api/v4/messages`;
    const proxyUrl = `https://corsproxy.io/?${encodeURIComponent(targetUrl)}`;

    const body = new HttpParams()
      .set('apikey', this.API_KEY)
      .set('number', mobileNumber)
      .set('message', message);

    console.log(`🚀 Attempting to send Semaphore SMS to ${mobileNumber} (via Form Data)...`);
    
    return this.http.post(proxyUrl, body.toString(), {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
    });
  }

  /**
   * Saves or Updates SMS history/draft in Supabase
   */
  saveSmsHistory(history: { id?: string, title: string, message: string, target_statuses: string, recipients: number, status: string }) {
    const { id, ...dataToUpdate } = history;

    if (id) {
      // Update existing record
      return from(this.supabase.client
        .from('sms_history')
        .update(dataToUpdate)
        .eq('id', id)
      ).pipe(
        tap(({ error }) => {
          if (error) console.error('Error updating SMS history:', error);
        })
      );
    } else {
      // Insert new record
      return from(this.supabase.client
        .from('sms_history')
        .insert([dataToUpdate])
      ).pipe(
        tap(({ error }) => {
          if (error) console.error('Error logging SMS history:', error);
        })
      );
    }
  }

  /**
   * Fetches SMS history from Supabase
   */
  getSmsHistory(): Observable<any[]> {
    return from(this.supabase.client
      .from('sms_history')
      .select('*')
      .order('created_at', { ascending: false })
    ).pipe(
      map(({ data, error }) => {
        if (error) {
          console.error('Error fetching SMS history:', error);
          return [];
        }
        return data || [];
      })
    );
  }

  /**
   * Deletes an SMS history log from Supabase
   */
  deleteSmsHistory(id: string) {
    return from(this.supabase.client
      .from('sms_history')
      .delete()
      .eq('id', id)
    ).pipe(
      tap(({ error }) => {
        if (error) console.error('Error deleting SMS history:', error);
      })
    );
  }

  /**
   * Fetches Barangay Contacts from Supabase
   */
  getContacts(): Observable<any[]> {
    return from(this.supabase.client
      .from('barangay_contacts')
      .select('*')
      .order('created_at', { ascending: false })
    ).pipe(
      map(({ data, error }) => {
        if (error) {
          console.error('Error fetching contacts:', error);
          return [];
        }
        return data || [];
      })
    );
  }

  /**
   * Adds a Barangay Contact to Supabase
   */
  addContact(contact: { barangay: string, mobile_number: string }) {
    return from(this.supabase.client
      .from('barangay_contacts')
      .insert([contact])
    ).pipe(
      tap(({ error }) => {
        if (error) console.error('Error adding contact:', error);
      })
    );
  }

  /**
   * Deletes a Barangay Contact from Supabase
   */
  deleteContact(id: string) {
    return from(this.supabase.client
      .from('barangay_contacts')
      .delete()
      .eq('id', id)
    ).pipe(
      tap(({ error }) => {
        if (error) console.error('Error deleting contact:', error);
      })
    );
  }

  /**
   * Helper to send appointment status updates via SMS
   */
  notifyAppointmentStatus(contact: string, name: string, status: 'Approved' | 'Rejected') {
    const message = status === 'Approved'
      ? `Hi ${name}, your immunization appointment has been APPROVED. Please wait for the admin to schedule your date. Thank you!`
      : `Hi ${name}, your immunization appointment has been REJECTED. Please contact your Barangay Health Center for clarification. Thank you!`;

    this.sendSms(contact, message).subscribe({
      next: (res) => console.log('✅ Status SMS Sent:', res),
      error: (err) => console.error('❌ Status SMS Failed!', err)
    });
  }

  /**
   * Helper to send schedule confirmation via SMS
   */
  notifyAppointmentSchedule(contact: string, name: string, date: string, time: string, clinic: string) {
    const message = `Hi ${name}, your immunization appointment is scheduled on ${date} at ${time} (${clinic}). See you there!`;

    this.sendSms(contact, message).subscribe({
      next: (res) => console.log('✅ Schedule SMS Sent:', res),
      error: (err) => console.error('❌ Schedule SMS Failed!', err)
    });
  }
}
