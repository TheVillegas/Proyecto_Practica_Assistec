import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { IonicModule } from '@ionic/angular';
import { ReactiveFormsModule, FormGroup, FormControl } from '@angular/forms';
import { CommonModule } from '@angular/common';

import { Step9FlujoValidacionComponent } from './step9-flujo-validacion.component';

describe('Step9FlujoValidacionComponent', () => {
  let component: Step9FlujoValidacionComponent;
  let fixture: ComponentFixture<Step9FlujoValidacionComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ Step9FlujoValidacionComponent ],
      imports: [IonicModule.forRoot(), ReactiveFormsModule, CommonModule]
    }).compileComponents();

    fixture = TestBed.createComponent(Step9FlujoValidacionComponent);
    component = fixture.componentInstance;
    component.parentForm = new FormGroup({
      rutCoordinadoraRecepcion: new FormControl(''),
      rutJefaArea: new FormControl('')
    });
    component.badgeEstado = { css: 'badge-borrador', label: 'Borrador' };
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
