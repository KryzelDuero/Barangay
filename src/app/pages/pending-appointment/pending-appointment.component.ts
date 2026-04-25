import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BehaviorSubject, combineLatest, Observable } from 'rxjs';
import { map, startWith } from 'rxjs/operators';
import { ActivatedRoute } from '@angular/router';
import { AppointmentService, Appointment } from '../../services/appointment.service';
import { NotificationService } from '../../services/notification.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-pending-appointment',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './pending-appointment.component.html',
  styleUrls: ['./pending-appointment.component.css']
})
export class PendingAppointmentComponent implements OnInit {
  paginatedAppointments$: Observable<Appointment[]>;
  private searchSubject = new BehaviorSubject<string>('');
  private viewFilterSubject = new BehaviorSubject<'pending' | 'history'>('pending');
  private historyStatusSubject = new BehaviorSubject<string>('All');
  private pageSubject = new BehaviorSubject<number>(1);
  
  searchTerm: string = '';
  viewFilter: 'pending' | 'history' = 'pending';
  historyStatusFilter: string = 'All';
  today: Date = new Date();
  
  currentPage: number = 1;
  pageSize: number = 5;
  totalItems: number = 0;

  pendingCount$: Observable<number>;
  approvedCount$: Observable<number>;
  rejectedCount$: Observable<number>;

  constructor(
    private appointmentService: AppointmentService, 
    private route: ActivatedRoute,
    private notificationService: NotificationService
  ) {
    const apps$ = this.appointmentService.getAppointments();
    
    this.pendingCount$ = apps$.pipe(map(apps => apps.filter(a => a.status === 'Pending').length));
    this.approvedCount$ = apps$.pipe(map(apps => apps.filter(a => a.status === 'Approved').length));
    this.rejectedCount$ = apps$.pipe(map(apps => apps.filter(a => a.status === 'Rejected').length));

    const filteredBase$ = combineLatest([
      apps$,
      this.searchSubject.asObservable().pipe(startWith('')),
      this.viewFilterSubject.asObservable().pipe(startWith('pending')),
      this.historyStatusSubject.asObservable().pipe(startWith('All'))
    ]).pipe(
      map(([apps, search, viewFilter, historyStatus]) => {
        let filtered = apps.filter(a => viewFilter === 'pending' ? !a.reviewed : a.reviewed);
        
        // Apply status filter for history mode
        if (viewFilter === 'history' && historyStatus !== 'All') {
          filtered = filtered.filter(a => {
            // Check for Approved (which might be Pending/Doses once reviewed) vs Rejected
            if (historyStatus === 'Approved') return a.status !== 'Rejected';
            if (historyStatus === 'Rejected') return a.status === 'Rejected';
            return true;
          });
        }

        if (search) {
          const s = search.toLowerCase();
          filtered = filtered.filter(a => 
            a.babyName.toLowerCase().startsWith(s) || 
            a.guardianName.toLowerCase().startsWith(s) ||
            a.vaccineRequested?.toLowerCase().startsWith(s)
          );
        }
        this.totalItems = filtered.length;
        return filtered;
      })
    );

    this.paginatedAppointments$ = combineLatest([
      filteredBase$,
      this.pageSubject.asObservable()
    ]).pipe(
      map(([filtered, page]) => {
        const startIndex = (page - 1) * this.pageSize;
        return filtered.slice(startIndex, startIndex + this.pageSize);
      })
    );
  }

  onSearch(value: string) {
    this.currentPage = 1;
    this.pageSubject.next(1);
    this.searchSubject.next(value);
  }

  onHistoryStatusChange(value: string) {
    this.currentPage = 1;
    this.pageSubject.next(1);
    this.historyStatusFilter = value;
    this.historyStatusSubject.next(value);
  }

  onViewFilterChange(filter: 'pending' | 'history') {
    this.currentPage = 1;
    this.pageSubject.next(1);
    this.viewFilter = filter;
    this.viewFilterSubject.next(filter);
  }

  get totalPages(): number {
    return Math.ceil(this.totalItems / this.pageSize) || 1;
  }

  nextPage() {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
      this.pageSubject.next(this.currentPage);
    }
  }

  prevPage() {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.pageSubject.next(this.currentPage);
    }
  }

  mathMin(a: number, b: number): number {
    return Math.min(a, b);
  }

  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      if (params['view'] === 'history') {
        this.onViewFilterChange('history');
      }
    });
  }

  onApprove(id: string) {
    Swal.fire({
      title: 'Approve Request?',
      text: 'Move this request to the management database?',
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#0080a0',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Yes, approve it!'
    }).then((result) => {
      if (result.isConfirmed) {
        const app = this.appointmentService.getAppointmentById(id);
        if (app) {
          this.appointmentService.updateAppointmentStatus(id, 'Pending');
          this.appointmentService.markAsReviewed(id);
          
          this.notificationService.notifyAppointmentStatus(
            app.guardianContact,
            app.babyName,
            'Approved'
          );
          
          Swal.fire({
            icon: 'success',
            title: 'Approved!',
            text: 'The request has been moved to management.',
            confirmButtonColor: '#0080a0'
          });
        }
      }
    });
  }

  onReject(id: string) {
    Swal.fire({
      title: 'Reject Request?',
      text: 'Move this request to the records as rejected?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#0080a0',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Yes, reject it!'
    }).then((result) => {
      if (result.isConfirmed) {
        const app = this.appointmentService.getAppointmentById(id);
        if (app) {
          this.appointmentService.updateAppointmentStatus(id, 'Rejected');
          this.appointmentService.markAsReviewed(id);

          this.notificationService.notifyAppointmentStatus(
            app.guardianContact,
            app.babyName,
            'Rejected'
          );
          
          Swal.fire({
            icon: 'success',
            title: 'Rejected',
            text: 'The request has been moved to records.',
            confirmButtonColor: '#0080a0'
          });
        }
      }
    });
  }

  getStatusClass(status: string): string {
    return status.toLowerCase().replace(' ', '-');
  }

  onDelete(id: string) {
    Swal.fire({
      title: 'Delete Record?',
      text: 'Are you sure you want to delete this record permanently?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#0080a0',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Yes, delete it!'
    }).then((result) => {
      if (result.isConfirmed) {
        this.appointmentService.deleteAppointment(id);
        Swal.fire({
          icon: 'success',
          title: 'Deleted',
          text: 'The record has been deleted.',
          confirmButtonColor: '#0080a0'
        });
      }
    });
  }
}
