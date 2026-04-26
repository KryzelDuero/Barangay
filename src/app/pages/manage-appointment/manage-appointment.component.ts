import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BehaviorSubject, combineLatest, Observable } from 'rxjs';
import { map, startWith } from 'rxjs/operators';
import { AppointmentService, Appointment } from '../../services/appointment.service';
import { NotificationService } from '../../services/notification.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-manage-appointment',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './manage-appointment.component.html',
  styleUrls: ['./manage-appointment.component.css']
})
export class ManageAppointmentComponent implements OnInit {
  paginatedAppointments$: Observable<Appointment[]>;
  private searchSubject = new BehaviorSubject<string>('');
  private statusSubject = new BehaviorSubject<string>('All');
  private pageSubject = new BehaviorSubject<number>(1);
  
  searchTerm: string = '';
  statusFilter: string = 'All';
  today: Date = new Date();
  
  currentPage: number = 1;
  pageSize: number = 5;
  totalItems: number = 0;

  constructor(
    private appointmentService: AppointmentService,
    private notificationService: NotificationService
  ) {
    const filteredBase$ = combineLatest([
      this.appointmentService.getAppointments(),
      this.searchSubject.asObservable().pipe(startWith('')),
      this.statusSubject.asObservable().pipe(startWith('All'))
    ]).pipe(
      map(([apps, search, status]) => {
        let filtered = apps.filter(a => a.reviewed && a.status !== 'Rejected' && !a.archived && a.status !== 'Completed' && a.status !== 'Second dose');
        
        if (status !== 'All') {
          filtered = filtered.filter(a => a.status === status);
        }

        if (search) {
          const s = search.toLowerCase();
          filtered = filtered.filter(a => 
            a.babyName.toLowerCase().startsWith(s) || 
            a.guardianName.toLowerCase().startsWith(s)
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

  onStatusChange(value: string) {
    this.currentPage = 1;
    this.pageSubject.next(1);
    this.statusSubject.next(value);
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

  ngOnInit(): void {}

  getStatusClass(status: string): string {
    return status.toLowerCase().replace(' ', '-');
  }

  onStatusUpdate(id: string, event: Event) {
    const select = event.target as HTMLSelectElement;
    const newStatus = select.value as any;
    
    this.appointmentService.updateAppointmentStatus(id, newStatus);
    
    Swal.fire({
      icon: 'success',
      title: 'Status Updated',
      text: `Patient status has been changed to ${newStatus}.`,
      timer: 1500,
      showConfirmButton: false,
      position: 'top-end',
      toast: true
    });
  }

  allowOnlyNumbers(event: KeyboardEvent) {
    const charCode = event.which ? event.which : event.keyCode;
    if (charCode < 48 || charCode > 57) {
      event.preventDefault();
    }
  }

  isEditModalOpen = false;
  selectedAppointment: Appointment | null = null;

  onEdit(id: string) {
    this.appointmentService.getAppointments().subscribe(apps => {
      const found = apps.find(a => a.id === id);
      if (found) {
        this.selectedAppointment = { ...found };
        this.isEditModalOpen = true;
      }
    }).unsubscribe(); 
  }

  closeEditModal() {
    this.isEditModalOpen = false;
    this.selectedAppointment = null;
  }

  saveEdit() {
    if (this.selectedAppointment) {
      const hasDate = !!this.selectedAppointment.preferredDate;
      const hasTime = !!this.selectedAppointment.preferredTime;
      const hasClinic = !!this.selectedAppointment.preferredClinic;

      this.appointmentService.updateAppointmentDetails(this.selectedAppointment.id, this.selectedAppointment);

      if (hasDate && hasTime && hasClinic) {
        const dateFormatted = new Date(this.selectedAppointment.preferredDate).toLocaleDateString('en-US', { 
          month: 'long', day: 'numeric', year: 'numeric' 
        });
        
        this.notificationService.notifyAppointmentSchedule(
          this.selectedAppointment.guardianContact,
          this.selectedAppointment.babyName,
          dateFormatted,
          this.selectedAppointment.preferredTime,
          this.selectedAppointment.preferredClinic
        );
      }

      this.closeEditModal();
      
      Swal.fire({
        icon: 'success',
        title: 'Changes Saved',
        text: 'Patient details and schedule have been updated.',
        confirmButtonColor: '#0080a0'
      });
    }
  }

  onDelete(id: string) {
    Swal.fire({
      title: 'Archive Record?',
      text: 'Are you sure you want to remove this record from management? It will still be available in history.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#0080a0',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Yes, archive it!'
    }).then((result) => {
      if (result.isConfirmed) {
        this.appointmentService.archiveFromManagement(id);
        Swal.fire({
          icon: 'success',
          title: 'Archived',
          text: 'The record has been moved to history.',
          confirmButtonColor: '#0080a0'
        });
      }
    });
  }
}
