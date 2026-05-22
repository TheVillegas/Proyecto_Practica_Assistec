import { Component, OnInit, inject } from '@angular/core';
import { Router } from '@angular/router';
import { SolicitudIngresoResponse, SolicitudIngresoService } from 'src/app/services/solicitud-ingreso.service';
import { resolveSolicitudStateMeta } from '../solicitud-ingreso/solicitud-estado-families';

@Component({
  selector: 'app-busqueda-solicitud-ingreso',
  templateUrl: './busqueda-solicitud-ingreso.page.html',
  styleUrls: ['./busqueda-solicitud-ingreso.page.scss'],
  standalone: false
})
export class BusquedaSolicitudIngresoPage implements OnInit {
  private router = inject(Router);
  private solicitudService = inject(SolicitudIngresoService);


  listaSolicitudes: SolicitudIngresoResponse[] = [];
  listaFiltrada: SolicitudIngresoResponse[] = [];
  cargando = false;
  error = false;

  ngOnInit() {
    this.cargarSolicitudes();
  }

  private cargarSolicitudes() {
    this.cargando = true;
    this.error = false;
    this.solicitudService.listar().subscribe({
      next: (lista) => {
        this.listaSolicitudes = lista;
        this.listaFiltrada = [...lista];
        this.cargando = false;
      },
      error: () => {
        this.error = true;
        this.cargando = false;
      }
    });
  }

  buscarSolicitud(event: any) {
    const texto = (event.target.value ?? '').toLowerCase().trim();
    if (texto) {
      this.listaFiltrada = this.listaSolicitudes.filter(sol =>
        String(sol.numero_ali).includes(texto) ||
        String(sol.numero_acta ?? '').toLowerCase().includes(texto) ||
        (sol.cliente?.nombre ?? '').toLowerCase().includes(texto)
      );
    } else {
      this.listaFiltrada = [...this.listaSolicitudes];
    }
  }

  verSolicitud(sol: SolicitudIngresoResponse) {
    this.router.navigate(['/solicitud-ingreso'], { queryParams: { id: sol.id_solicitud } });
  }

  estadoMeta(estado: string | null | undefined) {
    return resolveSolicitudStateMeta(estado);
  }
}
