import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { IonicModule } from '@ionic/angular';
import { ReactiveFormsModule, FormGroup, FormControl } from '@angular/forms';

import { Step7ObservacionesLaboratorioComponent } from './step7-observaciones-laboratorio.component';

describe('Step7ObservacionesLaboratorioComponent', () => {
  let component: Step7ObservacionesLaboratorioComponent;
  let fixture: ComponentFixture<Step7ObservacionesLaboratorioComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ Step7ObservacionesLaboratorioComponent ],
      imports: [IonicModule.forRoot(), ReactiveFormsModule]
    }).compileComponents();

    fixture = TestBed.createComponent(Step7ObservacionesLaboratorioComponent);
    component = fixture.componentInstance;
    component.parentForm = new FormGroup({
      observacionesLaboratorio: new FormControl('')
    });
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
