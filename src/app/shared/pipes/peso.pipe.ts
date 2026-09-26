// src/app/shared/pipes/peso.pipe.ts
// Five-orites Scoop — Philippine Peso Currency Formatter
// Author: [Developer Placeholder]

import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'peso',
  standalone: true,
})
export class PesoPipe implements PipeTransform {
  private formatter = new Intl.NumberFormat('en-PH', {
    style: 'currency',
    currency: 'PHP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });

  transform(value: number | null | undefined): string {
    if (value === null || value === undefined || !Number.isFinite(Number(value))) return '₱0';
    try {
      return this.formatter.format(Number(value)).replace('PHP', '₱');
    } catch {
      return `₱${Number(value).toLocaleString('en-PH', { maximumFractionDigits: 0 })}`;
    }
  }
}
