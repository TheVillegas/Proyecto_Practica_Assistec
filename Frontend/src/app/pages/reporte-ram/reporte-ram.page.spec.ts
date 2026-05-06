import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideRouter } from '@angular/router';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ReporteRamPage } from './reporte-ram.page';

describe('ReporteRamPage', () => {
  let component: ReporteRamPage;
  let fixture: ComponentFixture<ReporteRamPage>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ReporteRamPage],
      providers: [provideHttpClient(), provideRouter([])],
      schemas: [NO_ERRORS_SCHEMA]
    }).compileComponents();

    fixture = TestBed.createComponent(ReporteRamPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
