import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';

@Component({
    selector: 'app-footer-acciones',
    templateUrl: './footer-acciones.component.html',
    styleUrls: ['./footer-acciones.component.scss'],
    standalone: false
})
export class FooterAccionesComponent implements OnInit {

    @Input() formularioBloqueado: boolean = false;
    @Input() cargando: boolean = false;
    @Input() showRevertButton: boolean = false;

    @Output() cancelar = new EventEmitter<void>();
    @Output() guardarBorrador = new EventEmitter<void>();
    @Output() confirmar = new EventEmitter<void>();
    @Output() salir = new EventEmitter<void>();
    @Output() revertir = new EventEmitter<void>();

    constructor() { }

    ngOnInit() { }

    onCancelar() {
        this.cancelar.emit();
    }

    onGuardarBorrador() {
        this.guardarBorrador.emit();
    }

    onConfirmar() {
        this.confirmar.emit();
    }

    onSalir() {
        this.salir.emit();
    }

    onRevertir() {
        this.revertir.emit();
    }

}
