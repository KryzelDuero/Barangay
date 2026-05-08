import { Injectable } from '@angular/core';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

@Injectable({
  providedIn: 'root'
})
export class SupabaseService {
  private supabaseUrl = "https://lmebsrelwvzkldhqywtj.supabase.co"; // Replace with your project URL
  private supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxtZWJzcmVsd3Z6a2xkaHF5d3RqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgyNDM1NDAsImV4cCI6MjA5MzgxOTU0MH0.eca5zc288pJbW8qhmALge3zyeTDl_-Axw5Ljx3zBQT8"; // Replace with your anon key
  public client: SupabaseClient;

  constructor() {
    this.client = createClient(this.supabaseUrl, this.supabaseKey);
  }
}
