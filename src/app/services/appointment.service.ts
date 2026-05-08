import { Injectable } from '@angular/core';
import { BehaviorSubject, from, Observable } from 'rxjs';
import { map, tap } from 'rxjs/operators';
import { SupabaseService } from './supabase.service';

export interface Appointment {
  id: string;
  guardianName: string;
  guardianContact: string;
  guardianEmail: string;
  relationship: string;
  babyName: string;
  babyAge: string;
  babySex: string;
  birthWeight?: string;
  vaccinesReceived?: string;
  vaccineRequested?: string;
  nurseAssigned?: string;
  immunizationRecordNumber?: string;
  preferredDate: string;
  preferredTime: string;
  preferredClinic: string;
  allergies?: string;
  medicalConditions?: string;
  recentIllness?: string;
  prematureBirth?: boolean;
  status: 'Pending' | 'Approved' | 'Rejected' | 'First dose' | 'Second dose';
  reviewed: boolean;
  archived?: boolean;
  createdAt: Date;
}

@Injectable({
  providedIn: 'root'
})
export class AppointmentService {
  private appointmentsSubject = new BehaviorSubject<Appointment[]>([]);

  constructor(private supabase: SupabaseService) {
    this.refreshAppointments();
  }

  private refreshAppointments() {
    this.fetchAppointmentsFromSupabase().subscribe(apps => {
      this.appointmentsSubject.next(apps);
    });
  }

  private fetchAppointmentsFromSupabase(): Observable<Appointment[]> {
    return from(this.supabase.client
      .from('appointments')
      .select('*')
      .order('created_at', { ascending: false })
    ).pipe(
      map(({ data, error }) => {
        if (error) {
          console.error('Error fetching appointments:', error);
          return [];
        }
        return (data || []).map(app => this.mapFromDb(app));
      })
    );
  }

  private mapFromDb(app: any): Appointment {
    return {
      id: app.id,
      guardianName: app.guardian_name,
      guardianContact: app.guardian_contact,
      guardianEmail: app.guardian_email,
      relationship: app.relationship,
      babyName: app.baby_name,
      babyAge: app.baby_age,
      babySex: app.baby_sex,
      birthWeight: app.birth_weight,
      vaccinesReceived: app.vaccines_received,
      vaccineRequested: app.vaccine_requested,
      nurseAssigned: app.nurse_assigned,
      immunizationRecordNumber: app.immunization_record_number,
      preferredDate: app.preferred_date,
      preferredTime: app.preferred_time,
      preferredClinic: app.preferred_clinic,
      allergies: app.allergies,
      medicalConditions: app.medical_conditions,
      recentIllness: app.recent_illness,
      prematureBirth: app.premature_birth,
      status: app.status,
      reviewed: app.reviewed ?? false,
      archived: app.archived ?? false,
      createdAt: new Date(app.created_at)
    };
  }

  private mapToDb(app: Partial<Appointment>): any {
    const dbApp: any = {};
    if (app.guardianName !== undefined) dbApp.guardian_name = app.guardianName;
    if (app.guardianContact !== undefined) dbApp.guardian_contact = app.guardianContact;
    if (app.guardianEmail !== undefined) dbApp.guardian_email = app.guardianEmail;
    if (app.relationship !== undefined) dbApp.relationship = app.relationship;
    if (app.babyName !== undefined) dbApp.baby_name = app.babyName;
    if (app.babyAge !== undefined) dbApp.baby_age = app.babyAge;
    if (app.babySex !== undefined) dbApp.baby_sex = app.babySex;
    if (app.birthWeight !== undefined) dbApp.birth_weight = app.birthWeight;
    if (app.vaccinesReceived !== undefined) dbApp.vaccines_received = app.vaccinesReceived;
    if (app.vaccineRequested !== undefined) dbApp.vaccine_requested = app.vaccineRequested;
    if (app.nurseAssigned !== undefined) dbApp.nurse_assigned = app.nurseAssigned;
    if (app.immunizationRecordNumber !== undefined) dbApp.immunization_record_number = app.immunizationRecordNumber;
    if (app.preferredDate) dbApp.preferred_date = app.preferredDate;
    else if (app.preferredDate === '') dbApp.preferred_date = null;

    if (app.preferredTime) dbApp.preferred_time = app.preferredTime;
    else if (app.preferredTime === '') dbApp.preferred_time = null;

    if (app.preferredClinic) dbApp.preferred_clinic = app.preferredClinic;
    else if (app.preferredClinic === '') dbApp.preferred_clinic = null;
    if (app.allergies !== undefined) dbApp.allergies = app.allergies;
    if (app.medicalConditions !== undefined) dbApp.medical_conditions = app.medicalConditions;
    if (app.recentIllness !== undefined) dbApp.recent_illness = app.recentIllness;
    if (app.prematureBirth !== undefined) dbApp.premature_birth = app.prematureBirth;
    if (app.status !== undefined) dbApp.status = app.status;
    if (app.reviewed !== undefined) dbApp.reviewed = app.reviewed;
    if (app.archived !== undefined) dbApp.archived = app.archived;
    return dbApp;
  }

  getAppointments(): Observable<Appointment[]> {
    return this.appointmentsSubject.asObservable();
  }

  getAppointmentById(id: string): Observable<Appointment | undefined> {
    return from(this.supabase.client
      .from('appointments')
      .select('*')
      .eq('id', id)
      .single()
    ).pipe(
      map(({ data, error }) => {
        if (error) {
          console.error('Error fetching appointment:', error);
          return undefined;
        }
        return this.mapFromDb(data);
      })
    );
  }

  addAppointment(appointment: Omit<Appointment, 'id' | 'status' | 'createdAt' | 'reviewed' | 'archived'>) {
    const dbApp = this.mapToDb(appointment);
    console.log('Attempting to save to Supabase:', dbApp);
    
    return from(this.supabase.client
      .from('appointments')
      .insert([dbApp])
    ).pipe(
      tap(({ error, data }) => {
        if (error) {
          console.error('❌ Supabase Error:', error.message, error.details, error.hint);
        } else {
          console.log('✅ Successfully saved to Supabase');
          this.refreshAppointments();
        }
      })
    );
  }

  markAsReviewed(id: string) {
    return from(this.supabase.client
      .from('appointments')
      .update({ reviewed: true })
      .eq('id', id)
    ).pipe(
      tap(({ error }) => {
        if (error) console.error('Error marking as reviewed:', error);
        else this.refreshAppointments();
      })
    ).subscribe();
  }

  archiveFromManagement(id: string) {
    return from(this.supabase.client
      .from('appointments')
      .update({ archived: true })
      .eq('id', id)
    ).pipe(
      tap(({ error }) => {
        if (error) console.error('Error archiving appointment:', error);
        else this.refreshAppointments();
      })
    ).subscribe();
  }

  updateAppointmentStatus(id: string, status: 'Approved' | 'Rejected' | 'Pending' | 'First dose' | 'Second dose') {
    return from(this.supabase.client
      .from('appointments')
      .update({ status })
      .eq('id', id)
    ).pipe(
      tap(({ error }) => {
        if (error) console.error('Error updating status:', error);
        else this.refreshAppointments();
      })
    ).subscribe();
  }

  updateAppointmentDetails(id: string, updates: Partial<Appointment>) {
    const dbUpdates = this.mapToDb(updates);
    return from(this.supabase.client
      .from('appointments')
      .update(dbUpdates)
      .eq('id', id)
    ).pipe(
      tap(({ error }) => {
        if (error) console.error('Error updating details:', error);
        else this.refreshAppointments();
      })
    ).subscribe();
  }

  deleteAppointment(id: string) {
    return from(this.supabase.client
      .from('appointments')
      .delete()
      .eq('id', id)
    ).pipe(
      tap(({ error }) => {
        if (error) console.error('Error deleting appointment:', error);
        else this.refreshAppointments();
      })
    ).subscribe();
  }
}
