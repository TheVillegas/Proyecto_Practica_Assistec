import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideRouter } from '@angular/router';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ReporteTPAPage } from './reporte-tpa.page';

describe('ReporteTPAPage', () => {
  let component: ReporteTPAPage;
  let fixture: ComponentFixture<ReporteTPAPage>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ReporteTPAPage],
      providers: [provideHttpClient(), provideRouter([])],
      schemas: [NO_ERRORS_SCHEMA]
    }).compileComponents();

    fixture = TestBed.createComponent(ReporteTPAPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
