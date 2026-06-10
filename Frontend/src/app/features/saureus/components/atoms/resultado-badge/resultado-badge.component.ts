/**
 * ResultadoBadge - Componente atómico para mostrar estado del resultado
 * 
 * Uso:
 * <app-resultado-badge
 *   [status]="'calculated'"
 *   [text]="'1,2 x 10³ UFC/g'">
 * </app-resultado-badge>
 * 
 * Status: 'pending' | 'calculated' | 'sd' | 'warning'
 */

import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-resultado-badge',
  standalone: true,
  imports: [CommonModule],
  template: `
    <span class="badge" [ngClass]="badgeClass">
      <span class="badge-icon" *ngIf="icon">{{ icon }}</span>
      {{ text }}
    </span>
  `,
  styles: [`
    .badge {
      display: inline-flex;
      align-items: center;
      gap: 0.25rem;
      padding: 0.25rem 0.5rem;
      border-radius: 9999px;
      font-size: 0.75rem;
      font-weight: 600;
    }
    
    .badge-pending {
      background-color: #f1f5f9;
      color: #64748b;
    }
    
    .badge-calculated {
      background-color: #dcfce7;
      color: #166534;
    }
    
    .badge-sd {
      background-color: #fef3c7;
      color: #92400e;
    }
    
    .badge-warning {
      background-color: #fee2e2;
      color: #991b1b;
    }
    
    .badge-icon {
      font-size: 0.875rem;
    }
  `]
})
export class ResultadoBadgeComponent {
  @Input() status: 'pending' | 'calculated' | 'sd' | 'warning' = 'pending';
  @Input() text: string = '';
  
  get badgeClass(): string {
    return `badge-${this.status}`;
  }
  
  get icon(): string {
    switch (this.status) {
      case 'calculated': return '✓';
      case 'sd': return '⚠';
      case 'warning': return '⚠';
      default: return '';
    }
  }
}
