import { Routes } from '@angular/router';
import { authGuard } from './guards/auth.guard';

export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () => import('./pages/login/login.component').then(m => m.LoginComponent)
  },
  {
    path: '',
    pathMatch: 'full',
    loadComponent: () => import('./pages/public-home/public-home.component').then(m => m.PublicHomeComponent)
  },
  {
    path: 'dashboard',
    canActivate: [authGuard],
    loadComponent: () => import('./pages/home/home.component').then(m => m.HomeComponent)
  },
  {
    path: 'about',
    loadComponent: () => import('./pages/about/about.component').then(m => m.AboutComponent)
  },
  {
    path: 'schedule-appointment',
    loadComponent: () => import('./pages/schedule-appointment/schedule-appointment.component').then(m => m.ScheduleAppointmentComponent)
  },
  {
    path: 'contact',
    loadComponent: () => import('./pages/contact/contact.component').then(m => m.ContactComponent)
  },
  {
    path: 'manage-appointment',
    loadComponent: () => import('./pages/manage-appointment/manage-appointment.component').then(m => m.ManageAppointmentComponent)
  },
  {
    path: 'pending-appointment',
    loadComponent: () => import('./pages/pending-appointment/pending-appointment.component').then(m => m.PendingAppointmentComponent)
  },
  {
    path: 'immunization-records',
    canActivate: [authGuard],
    loadComponent: () => import('./pages/immunization-records/immunization-records.component').then(m => m.ImmunizationRecordsComponent)
  },
  {
    path: 'sms-notification',
    canActivate: [authGuard],
    loadComponent: () => import('./pages/sms-notification/sms-notification.component').then(m => m.SmsNotificationComponent)
  },
  { path: '**', redirectTo: '' }
];
