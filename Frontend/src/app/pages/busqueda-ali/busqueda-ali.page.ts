import { Component, OnInit, inject } from '@angular/core';
import { ALI } from '../../interfaces/ali';
import { AliService } from '../../services/ali-service';


@Component({
  selector: 'app-busqueda-ali',
  templateUrl: './busqueda-ali.page.html',
  styleUrls: ['./busqueda-ali.page.scss'],
  standalone: false
})
export class BusquedaALIPage implements OnInit {
  private aliService = inject(AliService);

  listaMuestras: ALI[] = [];

  listaFiltrada: ALI[] = [];

  ngOnInit() {
    this.cargarMuestras();
  }

  cargarMuestras() {
    this.aliService.getMuestras().subscribe({
      next: (muestras) => {
        console.log('Muestras Mapeadas:', muestras);
        this.listaMuestras = muestras;
        this.listaFiltrada = this.listaMuestras;
      },
      error: (err) => {
        console.error('Error al cargar muestras', err);
      }
    });
  }

  buscarALI(event: any) {
    const texto = event.target.value;
    if (texto && texto.trim() !== '') {
      this.listaFiltrada = this.listaMuestras.filter(muestra => muestra.ALIMuestra.toString().includes(texto));
    } else {
      this.listaFiltrada = this.listaMuestras;
    }
  }



}
