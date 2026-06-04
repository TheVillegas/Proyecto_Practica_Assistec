import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { IonicModule } from '@ionic/angular';
import { ReactiveFormsModule, FormGroup, FormControl } from '@angular/forms';

import { Step8AnalisisDerivadosComponent } from './step8-analisis-derivados.component';

describe('Step8AnalisisDerivadosComponent', () => {
  let component: Step8AnalisisDerivadosComponent;
  let fixture: ComponentFixture<Step8AnalisisDerivadosComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ Step8AnalisisDerivadosComponent ],
      imports: [IonicModule.forRoot(), ReactiveFormsModule]
    }).compileComponents();

    fixture = TestBed.createComponent(Step8AnalisisDerivadosComponent);
    component = fixture.componentInstance;
    component.parentForm = new FormGroup({
      analisisDerivadosSubcontratados: new FormControl('')
    });
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
