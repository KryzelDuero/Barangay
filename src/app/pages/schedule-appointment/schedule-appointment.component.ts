import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AppointmentService } from '../../services/appointment.service';

@Component({
  selector: 'app-schedule-appointment',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './schedule-appointment.component.html',
  styleUrls: ['./schedule-appointment.component.css']
})
export class ScheduleAppointmentComponent {
  appointmentForm: FormGroup;
  isSubmitted = false;

  constructor(
    private fb: FormBuilder,
    private appointmentService: AppointmentService,
    private router: Router
  ) {
    this.appointmentForm = this.fb.group({
      guardianName: ['', Validators.required],
      guardianContact: ['', [Validators.required, Validators.pattern(/^[0-9]{11}$/)]],
      guardianEmail: ['', [Validators.required, Validators.email]],
      relationship: ['', Validators.required],
      babyName: ['', Validators.required],
      babyAge: ['', Validators.required],
      babySex: ['', Validators.required],
      birthWeight: [''],
      vaccinesReceived: [''],
      immunizationRecordNumber: [''],
      allergies: [''],
      medicalConditions: [''],
      recentIllness: [''],
      prematureBirth: [false]
    });
  }

  allowOnlyNumbers(event: KeyboardEvent) {
    const charCode = event.which ? event.which : event.keyCode;
    // Allow only numbers (48-57)
    if (charCode < 48 || charCode > 57) {
      event.preventDefault();
    }
  }

  onSubmit() {
    this.isSubmitted = true;
    if (this.appointmentForm.valid) {
      const formValue = {
        ...this.appointmentForm.value,
        preferredDate: '',
        preferredTime: '',
        preferredClinic: ''
      };
      this.appointmentService.addAppointment(formValue);
      alert('Appointment request submitted successfully! It is now pending for assessment.');
      this.appointmentForm.reset();
      this.isSubmitted = false;
      this.router.navigate(['/']);
    }
  }
}
