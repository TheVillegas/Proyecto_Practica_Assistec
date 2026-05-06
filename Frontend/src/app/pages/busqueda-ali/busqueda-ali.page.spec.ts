import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { BusquedaALIPage } from './busqueda-ali.page';

describe('BusquedaALIPage', () => {
  let component: BusquedaALIPage;
  let fixture: ComponentFixture<BusquedaALIPage>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [BusquedaALIPage],
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])],
      schemas: [NO_ERRORS_SCHEMA]
    }).compileComponents();

    fixture = TestBed.createComponent(BusquedaALIPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
