import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { IonicModule } from '@ionic/angular';
import { ReactiveFormsModule, FormGroup } from '@angular/forms';
import { CommonModule } from '@angular/common';

import { Step10TiemposEntregaComponent } from './step10-tiempos-entrega.component';

describe('Step10TiemposEntregaComponent', () => {
  let component: Step10TiemposEntregaComponent;
  let fixture: ComponentFixture<Step10TiemposEntregaComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ Step10TiemposEntregaComponent ],
      imports: [IonicModule.forRoot(), ReactiveFormsModule, CommonModule]
    }).compileComponents();

    fixture = TestBed.createComponent(Step10TiemposEntregaComponent);
    component = fixture.componentInstance;
    component.parentForm = new FormGroup({});
    component.tiempoEntregaNegativoDias = 5;
    component.fechaEstimadaEntregaNegativa = new Date();
    component.tiempoEntregaConfirmacionDias = 7;
    component.fechaEstimadaEntregaConfirmacion = new Date();
    component.fechaEnvioInformePositivo = new Date();
    component.fechaEnvioInformeNegativo = new Date();
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
