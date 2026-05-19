import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AppointmentService } from '../../services/appointment.service';
import Swal from 'sweetalert2';
import { take } from 'rxjs/operators';

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
      vaccineRequested: [''],
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
      this.appointmentService.getAppointments().pipe(take(1)).subscribe(appointments => {
        const duplicateGuardianApp = appointments.find(app => {
          const dbG = app.guardianName ? app.guardianName.toLowerCase().trim() : '';
          const formG = formValue.guardianName ? formValue.guardianName.toLowerCase().trim() : '';
          return dbG !== '' && dbG === formG;
        });

        const duplicateBabyApp = appointments.find(app => {
          const dbB = app.babyName ? app.babyName.toLowerCase().trim() : '';
          const formB = formValue.babyName ? formValue.babyName.toLowerCase().trim() : '';
          return dbB !== '' && dbB === formB;
        });

        if (duplicateGuardianApp || duplicateBabyApp) {
          let errorMessage = '';
          if (duplicateGuardianApp && duplicateBabyApp) {
            errorMessage = "Both the guardian's name and baby's name are already registered.";
          } else if (duplicateGuardianApp) {
            errorMessage = "This guardian's name is already registered.";
          } else if (duplicateBabyApp) {
            errorMessage = "This baby's name is already registered.";
          }

          Swal.fire({
            icon: 'error',
            title: 'Duplicate Registration',
            text: errorMessage,
            confirmButtonColor: '#d33'
          });
          return;
        }

        this.appointmentService.addAppointment(formValue).subscribe(({ error }) => {
          if (!error) {
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
              icon: 'error',
              title: 'Submission Failed',
              text: 'There was an error saving your data. Please try again or contact support.',
              confirmButtonColor: '#d33'
            });
          }
        });
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
