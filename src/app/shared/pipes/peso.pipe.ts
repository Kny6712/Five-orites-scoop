// src/app/shared/pipes/peso.pipe.ts
// Five-orites Scoop — Philippine Peso Currency Formatter
// Author: [Developer Placeholder]

import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'peso',
  standalone: true,
})
export class PesoPipe implements PipeTransform {
  transform(value: number | null | undefined): string {
    if (value === null || value === undefined || isNaN(value)) return '₱0';
    return `₱${value.toLocaleString('en-PH', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    })}`;
  }
}
