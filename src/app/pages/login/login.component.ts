import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css'
})
export class LoginComponent {
  username = '';
  password = '';

  constructor(private auth: AuthService, private router: Router) {}

  handleSubmit(): void {
    if (!this.username || !this.password) {
      Swal.fire({
        icon: 'warning',
        title: 'Empty Fields',
        text: 'Please enter both username and password.'
      });
      return;
    }

    this.auth.login(this.username, this.password).subscribe(success => {
      if (success) {
        this.router.navigate(['/dashboard']);
      } else {
        Swal.fire({
          icon: 'error',
          title: 'Login Failed',
          text: 'Invalid username or password.'
        });
      }
    });
  }

  handleSignUp(): void {
    Swal.fire({
      title: 'Create Account',
      text: 'Register a new staff account for the system.',
      html: `
        <div style="text-align: left; padding: 0 20px;">
          <label style="font-size: 0.9rem; color: #666;">Username</label>
          <input type="text" id="swal-username" class="swal2-input" placeholder="Choose a username" style="margin-top: 5px;">
          <label style="font-size: 0.9rem; color: #666; margin-top: 15px; display: block;">Password</label>
          <input type="password" id="swal-password" class="swal2-input" placeholder="Create a password" style="margin-top: 5px;">
        </div>
      `,
      confirmButtonText: 'Register Account',
      confirmButtonColor: '#0080a0',
      showCancelButton: true,
      cancelButtonColor: '#d33',
      preConfirm: () => {
        const user = (document.getElementById('swal-username') as HTMLInputElement).value;
        const pass = (document.getElementById('swal-password') as HTMLInputElement).value;
        if (!user || !pass) {
          Swal.showValidationMessage('Please fill in both fields');
        }
        return { user, pass };
      }
    }).then((result) => {
      if (result.isConfirmed) {
        this.auth.signUp(result.value.user, result.value.pass).subscribe(res => {
          if (res.success) {
            Swal.fire({
              icon: 'success',
              title: 'Registration Successful',
              text: 'Your account has been created. You can now log in.',
              confirmButtonColor: '#0080a0'
            });
          } else {
            Swal.fire({
              icon: 'error',
              title: 'Registration Error',
              text: res.error,
              confirmButtonColor: '#0080a0'
            });
          }
        });
      }
    });
  }

  handleForgotPassword(): void {
    Swal.fire({
      title: 'Reset Password',
      text: 'Please provide your account details to continue.',
      html: `
        <div style="text-align: left; padding: 0 20px;">
          <label style="font-size: 0.9rem; color: #666;">Username</label>
          <input type="text" id="swal-username-reset" class="swal2-input" placeholder="Enter username" style="margin-top: 5px;">
          <label style="font-size: 0.9rem; color: #666; margin-top: 15px; display: block;">New Password</label>
          <input type="password" id="swal-password-reset" class="swal2-input" placeholder="Enter new password" style="margin-top: 5px;">
        </div>
      `,
      confirmButtonText: 'Update Password',
      confirmButtonColor: '#0080a0',
      showCancelButton: true,
      cancelButtonColor: '#d33',
      preConfirm: () => {
        const user = (document.getElementById('swal-username-reset') as HTMLInputElement).value;
        const pass = (document.getElementById('swal-password-reset') as HTMLInputElement).value;
        if (!user || !pass) {
          Swal.showValidationMessage('Please fill in both fields');
        }
        return { user, pass };
      }
    }).then((result) => {
      if (result.isConfirmed) {
        this.auth.resetPassword(result.value.user, result.value.pass).subscribe(res => {
          if (res.success) {
            Swal.fire({
              icon: 'success',
              title: 'Password Updated',
              text: 'Your password has been changed successfully.',
              confirmButtonColor: '#0080a0'
            });
          } else {
            Swal.fire({
              icon: 'error',
              title: 'Reset Failed',
              text: res.error,
              confirmButtonColor: '#0080a0'
            });
          }
        });
      }
    });
  }
}
