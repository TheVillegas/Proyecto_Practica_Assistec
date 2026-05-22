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
  selector: 'app-dashboard-analista',
  templateUrl: './dashboard-analista.page.html',
  styleUrls: ['./dashboard-analista.page.scss'],
  standalone: false
})
export class DashboardAnalistaPage implements OnInit {
  private readonly router = inject(Router);
  private readonly solicitudService = inject(SolicitudIngresoService);

  summary: Partial<Record<DashboardFamily, number>> = {};
  queueItems: DashboardQueueItem[] = [];
  loading = true;

  private readonly ANALISTA_FILTERS = {
    family: 'post_validation' as DashboardFamily,
    assignedToMe: true
  };

  ngOnInit(): void {
    this.cargarDatos();
  }

  cargarDatos(): void {
    this.loading = true;
    this.solicitudService.obtenerResumenDashboard(this.ANALISTA_FILTERS).subscribe({
      next: (res: DashboardSummaryResponse) => {
        this.summary = res.summary;
      },
      error: () => {
        this.summary = {};
      }
    });
    this.solicitudService.obtenerBandejaDashboard(this.ANALISTA_FILTERS).subscribe({
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

  busquedaALI() {
    this.router.navigate(['/busqueda-ali']);
  }

}
