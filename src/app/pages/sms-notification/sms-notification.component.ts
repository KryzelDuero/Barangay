import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NotificationService } from '../../services/notification.service';
import Swal from 'sweetalert2';

interface SMSHistory {
  id: string;
  title: string;
  message: string;
  targetBarangays: string;
  recipients: number;
  status: 'Sent' | 'Draft' | 'Failed';
  createdAt: string;
  sentAt?: string;
}

interface Contact {
  id: string;
  barangay: string;
  mobileNumber: string;
  dateAdded: string;
}

@Component({
  selector: 'app-sms-notification',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './sms-notification.component.html',
  styleUrls: ['./sms-notification.component.css']
})
export class SmsNotificationComponent implements OnInit {
  today: Date = new Date();
  
  isCreateModalOpen = false;
  isAddNumberModalOpen = false;
  isEditing = false;
  editingId: string | null = null;
  viewMode: 'history' | 'contacts' = 'history';
  contactBarangayFilter: string = 'All';

  // Pagination State
  pageSize: number = 5;
  currentPageHistory: number = 1;
  currentPageDrafts: number = 1;
  currentPageContacts: number = 1;

  barangays: string[] = [
    'Balacanas', 'Dayawan', 'Imelda', 'Katipunan', 'Kimaya', 
    'Looc', 'Poblacion 1', 'Poblacion 2', 'Poblacion 3', 
    'San Martin', 'Tambobong'
  ];

  newNotification = {
    title: '',
    message: '',
    targets: [] as string[]
  };

  newContact = {
    barangay: '',
    mobileNumber: ''
  };

  history: SMSHistory[] = [];
  contacts: Contact[] = [];

  // --- PAGINATED GETTERS ---

  get paginatedHistory(): SMSHistory[] {
    const start = (this.currentPageHistory - 1) * this.pageSize;
    return this.history.slice(start, start + this.pageSize);
  }

  get filteredContacts(): Contact[] {
    const base = this.contactBarangayFilter === 'All' 
      ? this.contacts 
      : this.contacts.filter(c => c.barangay === this.contactBarangayFilter);
    return base;
  }

  get paginatedContacts(): Contact[] {
    const start = (this.currentPageContacts - 1) * this.pageSize;
    return this.filteredContacts.slice(start, start + this.pageSize);
  }

  // --- TOTAL PAGES HELPERS ---

  get totalPagesHistory(): number {
    return Math.ceil(this.history.length / this.pageSize) || 1;
  }

  get totalPagesContacts(): number {
    return Math.ceil(this.filteredContacts.length / this.pageSize) || 1;
  }

  constructor(private notificationService: NotificationService, private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    this.loadHistory();
    this.loadContacts();
  }

  loadHistory() {
    this.notificationService.getSmsHistory().subscribe(data => {
      this.history = data.map(item => ({
        id: item.id,
        title: item.title,
        message: item.message,
        targetBarangays: item.target_statuses,
        recipients: item.recipients,
        status: item.status,
        createdAt: new Date(item.created_at).toLocaleString(),
        sentAt: item.sent_at ? new Date(item.sent_at).toLocaleString() : undefined
      }));
    });
  }

  loadContacts() {
    this.notificationService.getContacts().subscribe(data => {
      this.contacts = data.map(item => ({
        id: item.id,
        barangay: item.barangay,
        mobileNumber: item.mobile_number,
        dateAdded: new Date(item.created_at).toLocaleString()
      }));
    });
  }

  saveNumber() {
    if (!this.newContact.barangay || !this.newContact.mobileNumber) {
      Swal.fire({
        icon: 'warning',
        title: 'Incomplete Details',
        text: 'Please select a barangay and enter a mobile number.',
        confirmButtonColor: '#0080a0'
      });
      return;
    }

    if (this.newContact.mobileNumber.length !== 11) {
      Swal.fire({
        icon: 'warning',
        title: 'Invalid Number',
        text: 'Mobile number must be exactly 11 digits.',
        confirmButtonColor: '#0080a0'
      });
      return;
    }

    if (!this.newContact.mobileNumber.startsWith('09')) {
      Swal.fire({
        icon: 'warning',
        title: 'Invalid Number',
        text: 'Mobile number must start with 09.',
        confirmButtonColor: '#0080a0'
      });
      return;
    }

    this.notificationService.addContact({
      barangay: this.newContact.barangay,
      mobile_number: this.newContact.mobileNumber
    }).subscribe(({ error }) => {
      this.closeModals();
      this.cdr.detectChanges();
      if (error) {
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'Failed to add contact. Please try again.',
          confirmButtonColor: '#0080a0'
        });
      } else {
        this.loadContacts();
        Swal.fire({
          icon: 'success',
          title: 'Contact Added!',
          text: `Number ${this.newContact.mobileNumber} has been added to ${this.newContact.barangay}.`,
          timer: 1500,
          showConfirmButton: false,
          toast: true,
          position: 'top-end'
        });
      }
    });
  }

  onRemoveContact(id: string) {
    const contact = this.contacts.find(c => c.id === id);
    Swal.fire({
      title: 'Remove Contact?',
      text: `Are you sure you want to remove ${contact?.mobileNumber} from ${contact?.barangay}?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#0080a0',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Yes, remove it!'
    }).then((result) => {
      if (result.isConfirmed) {
        this.notificationService.deleteContact(id).subscribe(({ error }) => {
          if (error) {
            Swal.fire({
              icon: 'error',
              title: 'Error',
              text: 'Failed to remove contact.',
              confirmButtonColor: '#0080a0'
            });
          } else {
            this.loadContacts();
            Swal.fire({
              icon: 'success',
              title: 'Removed!',
              text: 'The contact has been removed successfully.',
              timer: 1500,
              showConfirmButton: false,
              toast: true,
              position: 'top-end'
            });
          }
        });
      }
    });
  }

  // --- PAGINATION ACTIONS ---

  nextPage(type: 'history' | 'contacts') {
    if (type === 'history' && this.currentPageHistory < this.totalPagesHistory) this.currentPageHistory++;
    if (type === 'contacts' && this.currentPageContacts < this.totalPagesContacts) this.currentPageContacts++;
  }

  prevPage(type: 'history' | 'contacts') {
    if (type === 'history' && this.currentPageHistory > 1) this.currentPageHistory--;
    if (type === 'contacts' && this.currentPageContacts > 1) this.currentPageContacts--;
  }

  mathMin(a: number, b: number): number {
    return Math.min(a, b);
  }

  onFilterChange(value: string) {
    this.contactBarangayFilter = value;
    this.currentPageContacts = 1;
  }

  onCreateNotification() {
    this.isEditing = false;
    this.editingId = null;
    this.resetForms();
    this.isCreateModalOpen = true;
  }

  onEdit(id: string) {
    const item = this.history.find(h => h.id === id);
    if (item) {
      this.isEditing = true;
      this.editingId = id;
      this.newNotification = {
        title: item.title,
        message: item.message,
        targets: item.targetBarangays === 'All Barangays' ? [...this.barangays] : (item.targetBarangays === 'None' ? [] : item.targetBarangays.split(', '))
      };
      this.isCreateModalOpen = true;
    }
  }

  onSend(id: string) {
    const item = this.history.find(h => h.id === id);
    if (!item) return;

    const targetBarangayList: string[] =
      item.targetBarangays === 'All Barangays'
        ? [...this.barangays]
        : item.targetBarangays === 'None'
          ? []
          : item.targetBarangays.split(', ');

    const matchingContacts = this.contacts.filter(c =>
      targetBarangayList.includes(c.barangay)
    );

    if (matchingContacts.length === 0) {
      Swal.fire({
        icon: 'warning',
        title: 'No Contacts Found',
        text: 'No registered contacts found for the selected barangay(s). Please add contact numbers in the "Barangay Contacts" tab first.',
        confirmButtonColor: '#0080a0'
      });
      return;
    }

    Swal.fire({
      title: 'Send Notification?',
      text: `Send "${item.title}" to ${matchingContacts.length} registered contact(s) in the selected barangay(s)?`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#0080a0',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Yes, send it!'
    }).then((result) => {
      if (result.isConfirmed) {
        matchingContacts.forEach(contact => {
          this.notificationService.sendSms(contact.mobileNumber, item.message)
            .subscribe({
              next: (res) => console.log(`✅ SMS sent to ${contact.mobileNumber} (${contact.barangay}):`, res),
              error: (err) => console.error(`❌ SMS failed for ${contact.mobileNumber} (${contact.barangay}):`, err)
            });
        });

        // Update status in Supabase
        this.notificationService.saveSmsHistory({
          id: item.id,
          title: item.title,
          message: item.message,
          target_statuses: item.targetBarangays,
          recipients: matchingContacts.length,
          status: 'Sent'
        }).subscribe(({ error }) => {
          if (error) {
            Swal.fire({
              icon: 'error',
              title: 'Error',
              text: 'Failed to update notification status.',
              confirmButtonColor: '#0080a0'
            });
          } else {
            this.loadHistory();
            Swal.fire({
              icon: 'success',
              title: 'Sent!',
              text: 'SMS notifications are being sent.',
              timer: 1500,
              showConfirmButton: false,
              toast: true,
              position: 'top-end'
            });
          }
        });
      }
    });
  }

  onAddNumber() {
    this.isAddNumberModalOpen = true;
  }

  onlyNumbers(event: any) {
    const pattern = /[0-9]/;
    const inputChar = String.fromCharCode(event.charCode);
    if (!pattern.test(inputChar)) {
      event.preventDefault();
    }
  }

  onViewChange(mode: 'history' | 'contacts') {
    this.viewMode = mode;
  }

  closeModals() {
    this.isCreateModalOpen = false;
    this.isAddNumberModalOpen = false;
    this.resetForms();
  }

  resetForms() {
    this.newNotification = { title: '', message: '', targets: [] };
    this.newContact = { barangay: '', mobileNumber: '' };
  }

  toggleTarget(barangay: string) {
    const index = this.newNotification.targets.indexOf(barangay);
    if (index === -1) {
      this.newNotification.targets.push(barangay);
    } else {
      this.newNotification.targets.splice(index, 1);
    }
  }

  selectAllBarangays() {
    this.newNotification.targets = [...this.barangays];
  }

  deselectAllBarangays() {
    this.newNotification.targets = [];
  }

  saveNotificationAsDraft() {
    if (!this.newNotification.title || !this.newNotification.message) {
      Swal.fire({
        icon: 'warning',
        title: 'Missing Information',
        text: 'Please fill in both the title and the message.',
        confirmButtonColor: '#0080a0'
      });
      return;
    }

    const targetString =
      this.newNotification.targets.length === this.barangays.length
        ? 'All Barangays'
        : this.newNotification.targets.join(', ') || 'None';

    const recipientCount = this.contacts.filter(c =>
      this.newNotification.targets.includes(c.barangay)
    ).length;

    const historyData: any = {
      title: this.newNotification.title,
      message: this.newNotification.message,
      target_statuses: targetString,
      recipients: recipientCount,
      status: 'Draft'
    };

    if (this.isEditing && this.editingId) {
      historyData.id = this.editingId;
    }

    this.notificationService.saveSmsHistory(historyData).subscribe(({ error }) => {
      this.closeModals();
      this.cdr.detectChanges();
      if (error) {
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'Failed to save notification. Please try again.',
          confirmButtonColor: '#0080a0'
        });
      } else {
        this.loadHistory();
        Swal.fire({
          icon: 'success',
          title: 'Saved',
          text: 'Notification draft has been saved successfully.',
          timer: 1500,
          showConfirmButton: false,
          toast: true,
          position: 'top-end'
        });
      }
    });
  }


  onDeleteHistory(id: string) {
    Swal.fire({
      title: 'Delete Log?',
      text: "Are you sure you want to delete this notification log?",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#0080a0',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Yes, delete it!'
    }).then((result) => {
      if (result.isConfirmed) {
        this.notificationService.deleteSmsHistory(id).subscribe(({ error }) => {
          if (error) {
            Swal.fire({
              icon: 'error',
              title: 'Error',
              text: 'Failed to delete notification log.',
              confirmButtonColor: '#0080a0'
            });
          } else {
            this.loadHistory();
            Swal.fire({
              icon: 'success',
              title: 'Deleted',
              text: 'The notification log has been deleted.',
              timer: 1500,
              showConfirmButton: false,
              toast: true,
              position: 'top-end'
            });
          }
        });
      }
    });
  }

}
