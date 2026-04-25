import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AppointmentService } from '../../services/appointment.service';
import Swal from 'sweetalert2';

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

      relationship: ['', Validators.required],
      babyName: ['', Validators.required],
      babyAge: ['', Validators.required],
      babySex: ['', Validators.required],
      birthWeight: [''],
      vaccineRequested: ['', Validators.required],
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
      
      Swal.fire({
        icon: 'success',
        title: 'Registration Submitted!',
        text: 'Your registration has been submitted successfully and is pending assessment.',
        confirmButtonColor: '#0080a0'
      }).then(() => {
        this.appointmentForm.reset();
        this.isSubmitted = false;
        window.scrollTo(0, 0);
      });
    } else {
      Swal.fire({
        icon: 'warning',
        title: 'Incomplete Form',
        text: 'Please fill out all required fields correctly before submitting.',
        confirmButtonColor: '#0080a0'
      });
    }
  }
}
