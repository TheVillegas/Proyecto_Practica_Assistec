import { Component, Input, Output, EventEmitter } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { CategoriaProducto, SubcategoriaProducto } from 'src/app/interfaces/catalogo.interfaces';

interface FormularioUI {
  id: string | null;
  codigo: string;
  nombre: string;
  area: string;
  seleccionado: boolean;
  obligatorio: boolean;
  acreditado?: boolean;
  codigoLe?: string | null;
  metodologiaNorma?: string | null;
  diasNegativo?: number | null;
  diasConfirmacion?: number | null;
  cargandoDetalle?: boolean;
}

interface Muestra {
  id: number;
  nombre: string;
  formularios: FormularioUI[];
}

@Component({
  selector: 'app-step5-resolucion',
  templateUrl: './step5-resolucion.component.html',
  styleUrls: ['./step5-resolucion.component.scss'],
  standalone: false
})
export class Step5ResolucionComponent {
  @Input() parentForm!: FormGroup;
  @Input() reviewMode = false;
  @Input() categorias: CategoriaProducto[] = [];
  @Input() subcategorias: SubcategoriaProducto[] = [];
  @Input() formulariosCatalogo: FormularioUI[] = [];
  @Input() muestras: Muestra[] = [];

  @Output() toggleFormularioEvent = new EventEmitter<FormularioUI>();
  @Output() agregarMuestraEvent = new EventEmitter<void>();
  @Output() eliminarMuestraEvent = new EventEmitter<number>();
  @Output() toggleFormularioMuestraEvent = new EventEmitter<{muestra: Muestra, formulario: FormularioUI}>();

  campoInvalido(campo: string): boolean {
    const control = this.parentForm?.get(campo);
    return !!(control && control.invalid && (control.dirty || control.touched));
  }

  toggleFormulario(formulario: FormularioUI): void {
    this.toggleFormularioEvent.emit(formulario);
  }

  agregarMuestra(): void {
    this.agregarMuestraEvent.emit();
  }

  eliminarMuestra(id: number): void {
    this.eliminarMuestraEvent.emit(id);
  }

  toggleFormularioMuestra(muestra: Muestra, formulario: FormularioUI): void {
    this.toggleFormularioMuestraEvent.emit({ muestra, formulario });
  }
}
