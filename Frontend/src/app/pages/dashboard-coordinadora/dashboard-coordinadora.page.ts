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
  selector: 'app-dashboard-coordinadora',
  templateUrl: './dashboard-coordinadora.page.html',
  styleUrls: ['./dashboard-coordinadora.page.scss'],
  standalone: false
})
export class DashboardCoordinadoraPage implements OnInit {
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

  verDetalle(item: DashboardQueueItem): void {
    this.router.navigate(['/solicitud-ingreso'], {
      queryParams: { id: item.id_solicitud }
    });
  }

  busquedaSolicitud() {
    this.router.navigate(['/busqueda-solicitud-ingreso']);
  }

  busquedaALI() {
    this.router.navigate(['/busqueda-ali']);
  }

}
