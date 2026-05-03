import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SolicitudIngresoPage } from './solicitud-ingreso.page';

describe('SolicitudIngresoPage', () => {
  let component: SolicitudIngresoPage;
  let fixture: ComponentFixture<SolicitudIngresoPage>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [SolicitudIngresoPage]
    }).compileComponents();

    fixture = TestBed.createComponent(SolicitudIngresoPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
