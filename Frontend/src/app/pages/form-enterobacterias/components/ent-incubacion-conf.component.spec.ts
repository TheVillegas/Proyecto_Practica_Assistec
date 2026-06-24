import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormBuilder, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { By } from '@angular/platform-browser';
import { IonicModule } from '@ionic/angular';
import { EntIncubacionConfComponent } from './ent-incubacion-conf.component';
import { ModoLecturaPipe } from '../../../pipes/modo-lectura.pipe';

describe('EntIncubacionConfComponent', () => {
  let component: EntIncubacionConfComponent;
  let fixture: ComponentFixture<EntIncubacionConfComponent>;
  let fb: FormBuilder;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [EntIncubacionConfComponent, ModoLecturaPipe],
      imports: [ReactiveFormsModule, FormsModule, IonicModule],
    }).compileComponents();

    fb = TestBed.inject(FormBuilder);
  });

  function crearFixture(): void {
    fixture = TestBed.createComponent(EntIncubacionConfComponent);
    component = fixture.componentInstance;
    component.formGroup = fb.group({
      fechaTraspaso: [''],
      horaTraspaso: [''],
      analistaTraspaso: [''],
      agarNutritivo: [''],
      estufaConfIncub: [''],
    });
    fixture.detectChanges();
  }

  it('should create', () => {
    crearFixture();
    expect(component).toBeTruthy();
  });

  it('should render fechaTraspaso bound to form control', () => {
    crearFixture();
    const input = fixture.debugElement.query(By.css('[formControlName="fechaTraspaso"]'));
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
