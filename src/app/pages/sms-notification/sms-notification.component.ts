import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

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

  get filteredContacts(): Contact[] {
    if (this.contactBarangayFilter === 'All') {
      return this.contacts;
    }
    return this.contacts.filter(c => c.barangay === this.contactBarangayFilter);
  }

  constructor() {}

  ngOnInit(): void {
    this.loadFromLocalStorage();
  }

  saveToLocalStorage() {
    localStorage.setItem('sms_history', JSON.stringify(this.history));
    localStorage.setItem('sms_contacts', JSON.stringify(this.contacts));
  }

  loadFromLocalStorage() {
    const savedHistory = localStorage.getItem('sms_history');
    const savedContacts = localStorage.getItem('sms_contacts');
    if (savedHistory) this.history = JSON.parse(savedHistory);
    if (savedContacts) this.contacts = JSON.parse(savedContacts);
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
    if (item) {
      if (item.recipients === 0) {
        alert('Please add at least one target barangay before sending.');
        return;
      }
      if (confirm(`Are you sure you want to send "${item.title}" to ${item.recipients} recipients?`)) {
        item.status = 'Sent';
        item.sentAt = new Date().toLocaleString('en-US', { hour12: true, month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' });
        this.saveToLocalStorage();
      }
    }
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
      alert('Please fill in title and message.');
      return;
    }

    const targetString = this.newNotification.targets.length === this.barangays.length ? 'All Barangays' : this.newNotification.targets.join(', ') || 'None';
    
    if (this.isEditing && this.editingId) {
      const index = this.history.findIndex(h => h.id === this.editingId);
      if (index !== -1) {
        this.history[index] = {
          ...this.history[index],
          title: this.newNotification.title,
          message: this.newNotification.message,
          targetBarangays: targetString,
          recipients: this.newNotification.targets.length
        };
      }
    } else {
      const record: SMSHistory = {
        id: Math.random().toString(36).substr(2, 9),
        title: this.newNotification.title,
        message: this.newNotification.message,
        targetBarangays: targetString,
        recipients: this.newNotification.targets.length,
        status: 'Draft',
        createdAt: new Date().toLocaleString('en-US', { hour12: true, month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })
      };
      this.history.unshift(record);
    }
    this.saveToLocalStorage();
    this.closeModals();
  }

  saveNumber() {
    if (!this.newContact.barangay || !this.newContact.mobileNumber) {
      alert('Please fill in all fields.');
      return;
    }

    if (this.newContact.mobileNumber.length !== 11) {
      alert('Mobile number must be exactly 11 digits.');
      return;
    }

    if (!this.newContact.mobileNumber.startsWith('09')) {
      alert('Mobile number must start with 09.');
      return;
    }

    const record: Contact = {
      id: Math.random().toString(36).substr(2, 9),
      barangay: this.newContact.barangay,
      mobileNumber: this.newContact.mobileNumber,
      dateAdded: new Date().toLocaleString('en-US', { hour12: true, month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })
    };
    this.contacts.unshift(record);
    this.saveToLocalStorage();
    this.closeModals();
  }

  onDeleteHistory(id: string) {
    if (confirm('Are you sure you want to delete this notification log?')) {
      this.history = this.history.filter(h => h.id !== id);
      this.saveToLocalStorage();
    }
  }

  onRemoveContact(id: string) {
    if (confirm('Are you sure you want to remove this contact?')) {
      this.contacts = this.contacts.filter(c => c.id !== id);
      this.saveToLocalStorage();
    }
  }
}
