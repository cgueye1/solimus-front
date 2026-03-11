// currency-xof.pipe.ts
import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'currencyXof',
  standalone: true
})
export class CurrencyXofPipe implements PipeTransform {
  transform(value: number | string, symbol: boolean = true): string {
    if (value === null || value === undefined) return '';
    
    const numValue = typeof value === 'string' ? parseFloat(value) : value;
    
    if (isNaN(numValue)) return '';
    
    const formatter = new Intl.NumberFormat('fr-FR', {
      style: 'decimal',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    });
    
    return symbol ? `${formatter.format(numValue)} F CFA` : formatter.format(numValue);
  }
}