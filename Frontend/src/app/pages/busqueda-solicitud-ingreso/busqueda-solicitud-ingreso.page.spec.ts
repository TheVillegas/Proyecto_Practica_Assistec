import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideRouter } from '@angular/router';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { BusquedaSolicitudIngresoPage } from './busqueda-solicitud-ingreso.page';

describe('BusquedaSolicitudIngresoPage', () => {
  let component: BusquedaSolicitudIngresoPage;
  let fixture: ComponentFixture<BusquedaSolicitudIngresoPage>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [BusquedaSolicitudIngresoPage],
      providers: [provideHttpClient(), provideRouter([])],
      schemas: [NO_ERRORS_SCHEMA]
    }).compileComponents();

    fixture = TestBed.createComponent(BusquedaSolicitudIngresoPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
