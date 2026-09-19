// src/app/shared/pipes/stock-status.pipe.ts
// Five-orites Scoop — Stock Status Display Pipe
// Author: [Developer Placeholder]

import { Pipe, PipeTransform } from '@angular/core';

export type StockStatus = 'in-stock' | 'low-stock' | 'out-of-stock';

export interface StockStatusInfo {
  status: StockStatus;
  label: string;
  color: 'success' | 'warning' | 'danger';
}

@Pipe({
  name: 'stockStatus',
  standalone: true,
})
export class StockStatusPipe implements PipeTransform {
  transform(stock: number): StockStatusInfo {
    if (stock === 0) {
      return { status: 'out-of-stock', label: 'Out of Stock', color: 'danger' };
    } else if (stock < 10) {
      return { status: 'low-stock', label: `Low Stock (${stock})`, color: 'warning' };
    } else {
      return { status: 'in-stock', label: 'In Stock', color: 'success' };
    }
  }
}
