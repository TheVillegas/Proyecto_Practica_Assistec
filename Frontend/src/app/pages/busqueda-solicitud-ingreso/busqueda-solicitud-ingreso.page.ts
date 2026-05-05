import { Component, OnInit } from '@angular/core';

interface MockSolicitud {
  id: string;
  cliente: string;
  fecha: string;
  estado: string;
  muestras: number;
}

@Component({
  selector: 'app-busqueda-solicitud-ingreso',
  templateUrl: './busqueda-solicitud-ingreso.page.html',
  styleUrls: ['./busqueda-solicitud-ingreso.page.scss'],
  standalone: false
})
export class BusquedaSolicitudIngresoPage implements OnInit {

  listaMuestras: MockSolicitud[] = [
    { id: 'SOL-2023-001', cliente: 'Laboratorio Andes', fecha: '2023-10-01', estado: 'Pendiente', muestras: 5 },
    { id: 'SOL-2023-002', cliente: 'Clínica Santa María', fecha: '2023-10-02', estado: 'Validado', muestras: 2 },
    { id: 'SOL-2023-003', cliente: 'Hospital San José', fecha: '2023-10-05', estado: 'En Revisión', muestras: 10 },
    { id: 'SOL-2023-004', cliente: 'Consultorio Central', fecha: '2023-10-10', estado: 'Rechazado', muestras: 1 }
  ];

  listaFiltrada: MockSolicitud[] = [];

  constructor() { }

  ngOnInit() {
    this.listaFiltrada = [...this.listaMuestras];
  }

  buscarSolicitud(event: any) {
    const texto = event.target.value.toLowerCase();
    if (texto && texto.trim() !== '') {
      this.listaFiltrada = this.listaMuestras.filter(sol => 
        sol.id.toLowerCase().includes(texto) || sol.cliente.toLowerCase().includes(texto)
      );
    } else {
      this.listaFiltrada = [...this.listaMuestras];
    }
  }
}
