import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BehaviorSubject, combineLatest, Observable } from 'rxjs';
import { map, startWith } from 'rxjs/operators';
import { AppointmentService, Appointment } from '../../services/appointment.service';

@Component({
  selector: 'app-immunization-records',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './immunization-records.component.html',
  styleUrls: ['./immunization-records.component.css']
})
export class ImmunizationRecordsComponent implements OnInit {
  filteredRecords$: Observable<Appointment[]>;
  private searchSubject = new BehaviorSubject<string>('');
  searchTerm: string = '';
  today: Date = new Date();

  constructor(private appointmentService: AppointmentService) {
    this.filteredRecords$ = combineLatest([
      this.appointmentService.getAppointments(),
      this.searchSubject.asObservable().pipe(startWith(''))
    ]).pipe(
      map(([apps, search]) => {
        // Show all processed records (not rejected)
        let filtered = apps.filter(a => a.reviewed && a.status !== 'Rejected');

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

  ngOnInit(): void {}

  onSearch(value: string) {
    this.searchSubject.next(value);
  }

  getStatusClass(status: string): string {
    return status.toLowerCase().replace(' ', '-');
  }
}
