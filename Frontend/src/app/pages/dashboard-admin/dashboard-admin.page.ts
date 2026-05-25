import { Component, inject, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import {
  SolicitudIngresoService,
  DashboardFamily,
  DashboardSummaryResponse,
  DashboardQueueResponse,
  DashboardQueueItem
} from 'src/app/services/solicitud-ingreso.service';

@Component({
  selector: 'app-dashboard-admin',
  templateUrl: './dashboard-admin.page.html',
  styleUrls: ['./dashboard-admin.page.scss'],
  standalone: false
})
export class DashboardAdminPage implements OnInit {
  private readonly router = inject(Router);
  private readonly solicitudService = inject(SolicitudIngresoService);

  summary: Partial<Record<DashboardFamily, number>> = {};
  queueItems: DashboardQueueItem[] = [];
  loading = true;

  ngOnInit(): void {
    this.cargarDatos();
  }

  cargarDatos(): void {
    this.loading = true;
    this.solicitudService.obtenerResumenDashboard({}).subscribe({
      next: (res: DashboardSummaryResponse) => {
        this.summary = res.summary;
      },
      error: () => {
        this.summary = {};
      }
    });
    this.solicitudService.obtenerBandejaDashboard({}).subscribe({
      next: (res: DashboardQueueResponse) => {
        this.queueItems = res.items ?? [];
        this.loading = false;
      },
      error: () => {
        this.queueItems = [];
        this.loading = false;
      }
    });
  }

  getCounter(family: DashboardFamily): number {
    return this.summary[family] ?? 0;
  }

  irADashboardIngreso(): void {
    this.router.navigate(['/dashboard-ingreso']);
  }

  irABandejaRevision(): void {
    this.router.navigate(['/busqueda-solicitud-ingreso']);
  }

  irABusquedaAli(): void {
    this.router.navigate(['/busqueda-ali']);
  }
}
