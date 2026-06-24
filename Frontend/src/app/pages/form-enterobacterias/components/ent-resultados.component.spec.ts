import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormBuilder, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { By } from '@angular/platform-browser';
import { EntResultadosComponent } from './ent-resultados.component';
import { ModoLecturaPipe } from '../../../pipes/modo-lectura.pipe';

describe('EntResultadosComponent', () => {
  let component: EntResultadosComponent;
  let fixture: ComponentFixture<EntResultadosComponent>;
  let fb: FormBuilder;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [EntResultadosComponent, ModoLecturaPipe],
      imports: [ReactiveFormsModule, FormsModule],
    }).compileComponents();

    fb = TestBed.inject(FormBuilder);
  });

  function crearFixture(): void {
    fixture = TestBed.createComponent(EntResultadosComponent);
    component = fixture.componentInstance;
    component.formGroup = fb.group({
      observaciones: [''],
    });
    fixture.detectChanges();
  }

  it('should create', () => {
    crearFixture();
    expect(component).toBeTruthy();
  });

  it('should render observaciones bound to form control', () => {
    crearFixture();
    const input = fixture.debugElement.query(By.css('[formControlName="observaciones"]'));
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
