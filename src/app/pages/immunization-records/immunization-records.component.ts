import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BehaviorSubject, combineLatest, Observable } from 'rxjs';
import { map, startWith } from 'rxjs/operators';
import { AppointmentService, Appointment } from '../../services/appointment.service';
import { NotificationService } from '../../services/notification.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-immunization-records',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './immunization-records.component.html',
  styleUrls: ['./immunization-records.component.css']
})
export class ImmunizationRecordsComponent implements OnInit {
  paginatedRecords$: Observable<Appointment[]>;
  private searchSubject = new BehaviorSubject<string>('');
  private statusSubject = new BehaviorSubject<string>('All');
  private pageSubject = new BehaviorSubject<number>(1);
  
  searchTerm: string = '';
  statusFilter: string = 'All';
  today: Date = new Date();
  
  currentPage: number = 1;
  pageSize: number = 5;
  totalItems: number = 0;

  // SMS Modal State
  isCreateModalOpen = false;
  isViewModalOpen = false;
  selectedRecord: Appointment | null = null;
  targetStatuses: string[] = ['First dose'];
  newNotification = {
    preferredDate: '',
    preferredTime: '',
    preferredClinic: 'Katipunan Clinic',
    targets: [] as string[]
  };

  constructor(private appointmentService: AppointmentService, private notificationService: NotificationService) {
    const filteredBase$ = combineLatest([
      this.appointmentService.getAppointments(),
      this.searchSubject.asObservable().pipe(startWith('')),
      this.statusSubject.asObservable().pipe(startWith('All'))
    ]).pipe(
      map(([apps, search, status]) => {
        let filtered = apps.filter(a => a.reviewed && a.status !== 'Rejected');

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

    this.paginatedRecords$ = combineLatest([
      filteredBase$,
      this.pageSubject.asObservable()
    ]).pipe(
      map(([filtered, page]) => {
        const startIndex = (page - 1) * this.pageSize;
        return filtered.slice(startIndex, startIndex + this.pageSize);
      })
    );
  }

  ngOnInit(): void {}

  onCreateNotification() {
    this.resetForms();
    this.isCreateModalOpen = true;
  }

  closeModals() {
    this.isCreateModalOpen = false;
    this.resetForms();
  }

  resetForms() {
    this.newNotification = {
      preferredDate: '',
      preferredTime: '',
      preferredClinic: 'Katipunan Clinic',
      targets: []
    };
  }

  toggleTarget(status: string) {
    const index = this.newNotification.targets.indexOf(status);
    if (index === -1) {
      this.newNotification.targets.push(status);
    } else {
      this.newNotification.targets.splice(index, 1);
    }
  }

  selectAllStatuses() {
    this.newNotification.targets = [...this.targetStatuses];
  }

  deselectAllStatuses() {
    this.newNotification.targets = [];
  }

  sendNotification() {
    if (!this.newNotification.preferredDate || !this.newNotification.preferredTime) {
      Swal.fire({
        icon: 'warning',
        title: 'Missing Details',
        text: 'Please fill in both the preferred date and time.',
        confirmButtonColor: '#0080a0'
      });
      return;
    }

    if (this.newNotification.targets.length === 0) {
      Swal.fire({
        icon: 'warning',
        title: 'No Target Selected',
        text: 'Please select at least one target status (e.g., First dose).',
        confirmButtonColor: '#0080a0'
      });
      return;
    }

    const dateFormatted = new Date(this.newNotification.preferredDate).toLocaleDateString('en-US', { 
      month: 'long', day: 'numeric', year: 'numeric' 
    });
    
    const statusText = this.newNotification.targets.includes('First dose') ? 'Second dose' : this.newNotification.targets.join(' and ');
    const generatedTitle = `Immunization Schedule: ${statusText}`;
    const generatedMessage = `Good day! Your next immunization (${statusText}) is scheduled on ${dateFormatted} at ${this.newNotification.preferredTime} at the ${this.newNotification.preferredClinic}. Please be on time. Thank you!`;

    this.appointmentService.getAppointments().subscribe(apps => {
      const matchingPatients = apps.filter(a => 
        a.reviewed && 
        a.status !== 'Rejected' && 
        this.newNotification.targets.includes(a.status)
      );

      if (matchingPatients.length === 0) {
        Swal.fire({
          icon: 'info',
          title: 'No Recipients',
          text: 'No patients found with the selected status.',
          confirmButtonColor: '#0080a0'
        });
        return;
      }

      Swal.fire({
        title: 'Send Notifications?',
        text: `This will send SMS alerts to ${matchingPatients.length} patient(s). Proceed?`,
        icon: 'question',
        showCancelButton: true,
        confirmButtonColor: '#0080a0',
        cancelButtonColor: '#d33',
        confirmButtonText: 'Yes, send now'
      }).then((result) => {
        if (result.isConfirmed) {
          this.closeModals();
          
          matchingPatients.forEach(patient => {
            if (patient.guardianContact) {
              const nextDose = patient.status === 'First dose' ? 'Second dose' : patient.status;
              const personalizedMessage = `Good day, ${patient.guardianName}! Your child ${patient.babyName}'s next immunization (${nextDose}) is scheduled on ${dateFormatted} at ${this.newNotification.preferredTime} at the ${this.newNotification.preferredClinic}. Please be on time. Thank you!`;
              this.notificationService.sendSms(patient.guardianContact, personalizedMessage).subscribe({
                next: (res) => console.log(`✅ SMS sent to ${patient.guardianName} (${patient.guardianContact}) [${patient.status}]:`, res),
                error: (err) => console.error(`❌ SMS failed for ${patient.guardianName} (${patient.guardianContact}):`, err)
              });
            }
          });

          // Log to SMS history
          const targetString = this.newNotification.targets.join(', ');
          const savedHistory = localStorage.getItem('sms_history');
          let history = savedHistory ? JSON.parse(savedHistory) : [];
          history.unshift({
            id: Math.random().toString(36).substr(2, 9),
            title: generatedTitle,
            message: generatedMessage,
            targetBarangays: targetString,
            recipients: matchingPatients.length,
            status: 'Sent',
            sentAt: new Date().toLocaleString('en-US', { hour12: true, month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' }),
            createdAt: new Date().toLocaleString('en-US', { hour12: true, month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })
          });
          localStorage.setItem('sms_history', JSON.stringify(history));

          Swal.fire({
            icon: 'success',
            title: 'Notifications Sent',
            text: `Successfully sent alerts to ${matchingPatients.length} recipient(s).`,
            confirmButtonColor: '#0080a0'
          });
        }
      });
    });
  }

  onSearch(value: string) {
    this.currentPage = 1;
    this.pageSubject.next(1);
    this.searchSubject.next(value);
  }

  onStatusChange(value: string) {
    this.currentPage = 1;
    this.pageSubject.next(1);
    this.statusFilter = value;
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

  onViewRecord(record: Appointment) {
    this.selectedRecord = record;
    this.isViewModalOpen = true;
  }

  closeViewModal() {
    this.isViewModalOpen = false;
    this.selectedRecord = null;
  }

  getStatusClass(status: string): string {
    return status.toLowerCase().replace(' ', '-');
  }
}
