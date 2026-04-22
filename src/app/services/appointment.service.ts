import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

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
  status: 'Pending' | 'Approved' | 'Rejected' | 'First dose' | 'Second dose' | 'Completed';
  reviewed: boolean;
  archived?: boolean;
  createdAt: Date;
}

@Injectable({
  providedIn: 'root'
})
export class AppointmentService {
  private appointmentsKey = 'barangay_appointments';
  private appointmentsSubject = new BehaviorSubject<Appointment[]>(this.loadAppointments());

  constructor() {}

  private loadAppointments(): Appointment[] {
    const saved = localStorage.getItem(this.appointmentsKey);
    if (!saved) return [];
    
    let apps: any[] = JSON.parse(saved);
    
    // Data Migration: Ensure legacy records use babyAge instead of babyDob
    let migrated = false;
    apps = apps.map(app => {
      if (app.babyDob && !app.babyAge) {
        app.babyAge = app.babyDob;
        delete app.babyDob;
        migrated = true;
      }
      if (app.reviewed === undefined) {
        app.reviewed = (app.status === 'Approved' || app.status as string === 'Rejected');
        migrated = true;
      }
      if (app.archived === undefined) {
        app.archived = false;
        migrated = true;
      }
      return app;
    });

    if (migrated) {
      this.saveAppointments(apps);
    }
    
    return apps;
  }

  private saveAppointments(appointments: Appointment[]) {
    localStorage.setItem(this.appointmentsKey, JSON.stringify(appointments));
    this.appointmentsSubject.next(appointments);
  }

  getAppointments(): Observable<Appointment[]> {
    return this.appointmentsSubject.asObservable();
  }

  addAppointment(appointment: Omit<Appointment, 'id' | 'status' | 'createdAt'>) {
    const appointments = this.loadAppointments();
    const newAppointment: Appointment = {
      ...appointment,
      id: Math.random().toString(36).substr(2, 9),
      status: 'Pending',
      reviewed: false,
      archived: false,
      createdAt: new Date()
    };
    appointments.push(newAppointment);
    this.saveAppointments(appointments);
  }

  markAsReviewed(id: string) {
    const appointments = this.loadAppointments();
    const index = appointments.findIndex(a => a.id === id);
    if (index !== -1) {
      appointments[index].reviewed = true;
      this.saveAppointments(appointments);
    }
  }

  archiveFromManagement(id: string) {
    const appointments = this.loadAppointments();
    const index = appointments.findIndex(a => a.id === id);
    if (index !== -1) {
      appointments[index].archived = true;
      this.saveAppointments(appointments);
    }
  }

  updateAppointmentStatus(id: string, status: 'Approved' | 'Rejected' | 'Pending' | 'First dose' | 'Second dose' | 'Completed') {
    const appointments = this.loadAppointments();
    const index = appointments.findIndex(a => a.id === id);
    if (index !== -1) {
      appointments[index].status = status;
      this.saveAppointments(appointments);
    }
  }

  updateAppointmentDetails(id: string, updates: Partial<Appointment>) {
    const appointments = this.loadAppointments();
    const index = appointments.findIndex(a => a.id === id);
    if (index !== -1) {
      appointments[index] = { ...appointments[index], ...updates };
      this.saveAppointments(appointments);
    }
  }

  deleteAppointment(id: string) {
    const appointments = this.loadAppointments();
    const filtered = appointments.filter(a => a.id !== id);
    this.saveAppointments(filtered);
  }
}
