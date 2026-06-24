import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormBuilder, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { By } from '@angular/platform-browser';
import { EntIncubacionPrepComponent } from './ent-incubacion-prep.component';
import { ModoLecturaPipe } from '../../../pipes/modo-lectura.pipe';

describe('EntIncubacionPrepComponent', () => {
  let component: EntIncubacionPrepComponent;
  let fixture: ComponentFixture<EntIncubacionPrepComponent>;
  let fb: FormBuilder;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [EntIncubacionPrepComponent, ModoLecturaPipe],
      imports: [ReactiveFormsModule, FormsModule],
    }).compileComponents();

    fb = TestBed.inject(FormBuilder);
  });

  function crearFixture(): void {
    fixture = TestBed.createComponent(EntIncubacionPrepComponent);
    component = fixture.componentInstance;
    component.formGroup = fb.group({
      agarVRBGIncub: [''],
      estufaIncub: [''],
      fechaTermino: [''],
      horaTermino: [''],
      analistaIncub: [''],
    });
    fixture.detectChanges();
  }

  it('should create', () => {
    crearFixture();
    expect(component).toBeTruthy();
  });

  it('should render agarVRBGIncub bound to form control', () => {
    crearFixture();
    const input = fixture.debugElement.query(By.css('[formControlName="agarVRBGIncub"]'));
    expect(input).toBeTruthy();
  });

  it('should emit subetapaCompleta', () => {
    crearFixture();
    const spy = jasmine.createSpy('subetapaCompleta');
    component.subetapaCompleta.subscribe(spy);
    component.onSubetapaCompleta();
    expect(spy).toHaveBeenCalledTimes(1);
  });
});
