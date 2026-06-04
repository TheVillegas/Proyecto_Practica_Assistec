import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { IonicModule } from '@ionic/angular';
import { ReactiveFormsModule, FormGroup, FormControl } from '@angular/forms';
import { CommonModule } from '@angular/common';

import { Step11ResumenInformesComponent } from './step11-resumen-informes.component';

describe('Step11ResumenInformesComponent', () => {
  let component: Step11ResumenInformesComponent;
  let fixture: ComponentFixture<Step11ResumenInformesComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ Step11ResumenInformesComponent ],
      imports: [IonicModule.forRoot(), ReactiveFormsModule, CommonModule]
    }).compileComponents();

    fixture = TestBed.createComponent(Step11ResumenInformesComponent);
    component = fixture.componentInstance;
    component.parentForm = new FormGroup({
      nombreCliente: new FormControl(''),
      categoria: new FormControl('')
    });
    component.codigoALI = 'ALI-123';
    component.badgeEstado = { css: 'badge-borrador', label: 'Borrador' };
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
