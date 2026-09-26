// src/app/features/about/about.page.ts
// Five-orites Scoop — About the App
// Author: Five-orites Scoop team (see README)

import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import {
  IonHeader, IonToolbar, IonTitle, IonContent,
  IonButtons, IonMenuButton,
  IonIcon, IonButton, IonChip, IonLabel,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  iceCreamOutline, phonePortraitOutline, flashOutline,
  shieldCheckmarkOutline, cartOutline, layersOutline,
  logoFirebase, logoAngular, phonePortraitSharp,
} from 'ionicons/icons';

interface Feature { icon: string; title: string; description: string; }
interface Step { number: string; title: string; description: string; }

@Component({
  selector: 'app-about',
  standalone: true,
  imports: [
    CommonModule, RouterLink,
    IonHeader, IonToolbar, IonTitle, IonContent,
    IonButtons, IonMenuButton,
    IonIcon, IonButton, IonChip, IonLabel,
  ],
  templateUrl: './about.page.html',
  styleUrls: ['./about.page.scss'],
})
export class AboutPage {
  readonly customerFeatures: Feature[] = [
    { icon: 'ice-cream-outline', title: 'Browse 64 Flavors', description: 'Explore 8 categories, each with 8 premium variants.' },
    { icon: 'cart-outline', title: 'Easy Ordering', description: 'Add to cart, pick your size, and checkout in minutes.' },
    { icon: 'phone-portrait-outline', title: 'Live Order Tracking', description: 'Follow your scoops from kitchen to doorstep, in real time.' },
    { icon: 'shield-checkmark-outline', title: 'Secure Payments', description: 'Powered by PayMongo or Paymaya — your payment is always safe.' },
  ];

  readonly adminFeatures: Feature[] = [
    { icon: 'layers-outline', title: 'Inventory Management', description: 'Update stock per size variant with race-condition protection.' },
    { icon: 'flash-outline', title: 'Real-Time Fulfillment', description: 'Track, advance, and manage every order from a single dashboard.' },
  ];

  readonly howItWorks: Step[] = [
    { number: '01', title: 'Browse & Choose', description: 'Pick your favourite flavor and size from our full catalog.' },
    { number: '02', title: 'Place Your Order', description: 'Add to cart, enter your address, and confirm your order securely.' },
    { number: '03', title: 'Track & Enjoy', description: 'Watch your scoops travel to you live, then savour every bite.' },
  ];

  readonly techStack = [
    'Ionic 7', 'Angular 17', 'Capacitor 5',
    'Firebase Firestore', 'Firebase Auth',
    'TypeScript 5', 'RxJS', 'SCSS',
  ];

  constructor() {
    addIcons({
      iceCreamOutline, phonePortraitOutline, flashOutline,
      shieldCheckmarkOutline, cartOutline, layersOutline,
      logoFirebase, logoAngular, phonePortraitSharp,
    });
  }
}
