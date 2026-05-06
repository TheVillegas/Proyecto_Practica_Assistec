import { ComponentFixture, TestBed } from '@angular/core/testing';
import { BusquedaSolicitudIngresoPage } from './busqueda-solicitud-ingreso.page';

describe('BusquedaSolicitudIngresoPage', () => {
  let component: BusquedaSolicitudIngresoPage;
  let fixture: ComponentFixture<BusquedaSolicitudIngresoPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(BusquedaSolicitudIngresoPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
