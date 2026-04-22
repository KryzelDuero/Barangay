import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BehaviorSubject, combineLatest, Observable } from 'rxjs';
import { map, startWith } from 'rxjs/operators';
import { AppointmentService, Appointment } from '../../services/appointment.service';

@Component({
  selector: 'app-manage-appointment',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './manage-appointment.component.html',
  styleUrls: ['./manage-appointment.component.css']
})
export class ManageAppointmentComponent implements OnInit {
  filteredAppointments$: Observable<Appointment[]>;
  private searchSubject = new BehaviorSubject<string>('');
  private statusSubject = new BehaviorSubject<string>('All');
  
  searchTerm: string = '';
  statusFilter: string = 'All';
  today: Date = new Date();

  constructor(private appointmentService: AppointmentService) {
    this.filteredAppointments$ = combineLatest([
      this.appointmentService.getAppointments(),
      this.searchSubject.asObservable().pipe(startWith('')),
      this.statusSubject.asObservable().pipe(startWith('All'))
    ]).pipe(
      map(([apps, search, status]) => {
        let filtered = apps.filter(a => a.reviewed && a.status !== 'Rejected' && !a.archived && a.status !== 'Completed');
        
        // Status Filter
        if (status !== 'All') {
          filtered = filtered.filter(a => a.status === status);
        }

        // Search Filter
        if (search) {
          const s = search.toLowerCase();
          filtered = filtered.filter(a => 
            a.babyName.toLowerCase().includes(s) || 
            a.guardianName.toLowerCase().includes(s)
          );
        }
        
        return filtered;
      })
    );
  }

  onSearch(value: string) {
    this.searchSubject.next(value);
  }

  onStatusChange(value: string) {
    this.statusSubject.next(value);
  }

  ngOnInit(): void {}

  getStatusClass(status: string): string {
    return status.toLowerCase().replace(' ', '-');
  }

  onStatusUpdate(id: string, event: Event) {
    const select = event.target as HTMLSelectElement;
    this.appointmentService.updateAppointmentStatus(id, select.value as any);
  }



  allowOnlyNumbers(event: KeyboardEvent) {
    const charCode = event.which ? event.which : event.keyCode;
    // Allow only numbers (48-57)
    if (charCode < 48 || charCode > 57) {
      event.preventDefault();
    }
  }

  isEditModalOpen = false;
  selectedAppointment: Appointment | null = null;

  onEdit(id: string) {
    // Find the exact appointment by ID from local storage (or service)
    this.appointmentService.getAppointments().subscribe(apps => {
      const found = apps.find(a => a.id === id);
      if (found) {
        // Create a copy to edit without mutating the original list immediately
        this.selectedAppointment = { ...found };
        this.isEditModalOpen = true;
      }
    }).unsubscribe(); // Immediately unsubscribe after getting current value since BehaviorSubject is synchronous
  }

  closeEditModal() {
    this.isEditModalOpen = false;
    this.selectedAppointment = null;
  }

  saveEdit() {
    if (this.selectedAppointment) {
      this.appointmentService.updateAppointmentDetails(this.selectedAppointment.id, this.selectedAppointment);
      this.closeEditModal();
    }
  }

  onDelete(id: string) {
    if (confirm('Are you sure you want to remove this record from management? It will still be available in history.')) {
      this.appointmentService.archiveFromManagement(id);
    }
  }
}
