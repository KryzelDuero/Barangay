import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-contact',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './contact.component.html',
  styleUrls: ['./contact.component.css']
})
export class ContactComponent {
  contactForm: FormGroup;
  isSubmitted = false;

  constructor(private fb: FormBuilder) {
    this.contactForm = this.fb.group({
      name: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      subject: ['', Validators.required],
      message: ['', Validators.required]
    });
  }

  async onSubmit() {
    this.isSubmitted = true;
    
    if (this.contactForm.valid) {
      try {
        const response = await fetch("https://formsubmit.co/ajax/duero.kryzel99@gmail.com", {
          method: "POST",
          headers: { 
              'Content-Type': 'application/json',
              'Accept': 'application/json'
          },
          body: JSON.stringify({
              name: this.contactForm.value.name,
              email: this.contactForm.value.email,
              subject: this.contactForm.value.subject,
              message: this.contactForm.value.message
          })
        });

        if (response.ok) {
          Swal.fire({
            icon: 'success',
            title: 'Message Sent!',
            text: 'Thank you for reaching out! Your message has been sent successfully.',
            confirmButtonColor: '#0080a0'
          });
          this.contactForm.reset();
          this.isSubmitted = false;
        } else {
          Swal.fire({
            icon: 'error',
            title: 'Oops...',
            text: 'Something went wrong. Please try again.',
            confirmButtonColor: '#0080a0'
          });
        }
      } catch (error) {
        console.error('Error sending message:', error);
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'Failed to send message. Please check your connection.',
          confirmButtonColor: '#0080a0'
        });
      }
    } else {
      Swal.fire({
        icon: 'warning',
        title: 'Incomplete Form',
        text: 'Please fill out all required fields correctly before sending.',
        confirmButtonColor: '#0080a0'
      });
    }
  }
}
