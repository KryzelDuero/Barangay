import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BehaviorSubject, combineLatest, Observable } from 'rxjs';
import { map, startWith } from 'rxjs/operators';
import { ActivatedRoute } from '@angular/router';
import { AppointmentService, Appointment } from '../../services/appointment.service';

@Component({
  selector: 'app-pending-appointment',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './pending-appointment.component.html',
  styleUrls: ['./pending-appointment.component.css']
})
export class PendingAppointmentComponent implements OnInit {
  filteredAppointments$: Observable<Appointment[]>;
  private searchSubject = new BehaviorSubject<string>('');
  private viewFilterSubject = new BehaviorSubject<'pending' | 'history'>('pending');
  
  searchTerm: string = '';
  viewFilter: 'pending' | 'history' = 'pending';
  today: Date = new Date();

  pendingCount$: Observable<number>;
  approvedCount$: Observable<number>;
  rejectedCount$: Observable<number>;

  constructor(private appointmentService: AppointmentService, private route: ActivatedRoute) {
    const apps$ = this.appointmentService.getAppointments();
    
    this.pendingCount$ = apps$.pipe(map(apps => apps.filter(a => a.status === 'Pending').length));
    this.approvedCount$ = apps$.pipe(map(apps => apps.filter(a => a.status === 'Approved').length));
    this.rejectedCount$ = apps$.pipe(map(apps => apps.filter(a => a.status === 'Rejected').length));

    this.filteredAppointments$ = combineLatest([
      apps$,
      this.searchSubject.asObservable().pipe(startWith('')),
      this.viewFilterSubject.asObservable().pipe(startWith('pending'))
    ]).pipe(
      map(([apps, search, viewFilter]) => {
        const baseApps = apps.filter(a => viewFilter === 'pending' ? !a.reviewed : a.reviewed);
        if (!search) return baseApps;
        const s = search.toLowerCase();
        return baseApps.filter(a => 
          a.babyName.toLowerCase().includes(s) || 
          a.guardianName.toLowerCase().includes(s) ||
          a.vaccineRequested?.toLowerCase().includes(s)
        );
      })
    );
  }

  onSearch(value: string) {
    this.searchSubject.next(value);
  }

  onViewFilterChange(filter: 'pending' | 'history') {
    this.viewFilter = filter;
    this.viewFilterSubject.next(filter);
  }

  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      if (params['view'] === 'history') {
        this.onViewFilterChange('history');
      }
    });
  }

  onApprove(id: string) {
    if (confirm('Approve this request and move it to the management database?')) {
      this.appointmentService.updateAppointmentStatus(id, 'Pending');
      this.appointmentService.markAsReviewed(id);
    }
  }

  onReject(id: string) {
    if (confirm('Reject this request and move it to the records?')) {
      this.appointmentService.updateAppointmentStatus(id, 'Rejected');
      this.appointmentService.markAsReviewed(id);
    }
  }

  getStatusClass(status: string): string {
    return status.toLowerCase().replace(' ', '-');
  }

  onDelete(id: string) {
    if (confirm('Are you sure you want to delete this record?')) {
      this.appointmentService.deleteAppointment(id);
    }
  }
}
