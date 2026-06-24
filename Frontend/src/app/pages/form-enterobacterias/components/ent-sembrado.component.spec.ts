import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormBuilder, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { By } from '@angular/platform-browser';
import { EntSembradoComponent } from './ent-sembrado.component';
import { ModoLecturaPipe } from '../../../pipes/modo-lectura.pipe';

describe('EntSembradoComponent', () => {
  let component: EntSembradoComponent;
  let fixture: ComponentFixture<EntSembradoComponent>;
  let fb: FormBuilder;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [EntSembradoComponent, ModoLecturaPipe],
      imports: [ReactiveFormsModule, FormsModule],
    }).compileComponents();

    fb = TestBed.inject(FormBuilder);
  });

  function crearFixture(): void {
    fixture = TestBed.createComponent(EntSembradoComponent);
    component = fixture.componentInstance;
    component.formGroup = fb.group({
      agarVRBGSembrado: [''],
      estufaSembrado: [''],
      placasSembrado: [''],
      micropipeta1mlSembrado: [''],
      fechaSembrado: [''],
      horaSembrado: [''],
      analistaSembrado: [''],
    });
    fixture.detectChanges();
  }

  it('should create', () => {
    crearFixture();
    expect(component).toBeTruthy();
  });

  it('should render agarVRBGSembrado bound to form control', () => {
    crearFixture();
    const input = fixture.debugElement.query(By.css('[formControlName="agarVRBGSembrado"]'));
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
