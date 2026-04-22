import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AppointmentService, Appointment } from '../../services/appointment.service';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './home.component.html',
  styleUrl: './home.component.css'
})
export class HomeComponent {
  pendingCount$: Observable<number>;
  approvedCount$: Observable<number>;
  rejectedCount$: Observable<number>;
  totalCount$: Observable<number>;
  recentRecords$: Observable<Appointment[]>;
  today: Date = new Date();

  constructor(private appointmentService: AppointmentService) {
    const apps$ = this.appointmentService.getAppointments();

    this.pendingCount$ = apps$.pipe(
      map(apps => apps.filter(a => !a.reviewed).length)
    );
    this.approvedCount$ = apps$.pipe(
      map(apps => apps.filter(a => a.reviewed && a.status !== 'Rejected').length)
    );
    this.rejectedCount$ = apps$.pipe(
      map(apps => apps.filter(a => a.status === 'Rejected').length)
    );
    this.totalCount$ = apps$.pipe(
      map(apps => apps.length)
    );

    this.recentRecords$ = apps$.pipe(
      map(apps => {
        return apps
          .filter(a => a.reviewed && a.status !== 'Rejected')
          .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
          .slice(0, 5);
      })
    );
  }

  getStatusClass(status: string): string {
    return status.toLowerCase().replace(' ', '-');
  }
}
