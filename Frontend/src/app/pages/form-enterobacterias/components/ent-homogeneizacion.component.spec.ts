import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormBuilder, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { By } from '@angular/platform-browser';
import { IonicModule } from '@ionic/angular';
import { EntHomogeneizacionComponent } from './ent-homogeneizacion.component';
import { ModoLecturaPipe } from '../../../pipes/modo-lectura.pipe';

describe('EntHomogeneizacionComponent', () => {
  let component: EntHomogeneizacionComponent;
  let fixture: ComponentFixture<EntHomogeneizacionComponent>;
  let fb: FormBuilder;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [EntHomogeneizacionComponent, ModoLecturaPipe],
      imports: [ReactiveFormsModule, FormsModule, IonicModule],
    }).compileComponents();

    fb = TestBed.inject(FormBuilder);
  });

  function crearFixture(): void {
    fixture = TestBed.createComponent(EntHomogeneizacionComponent);
    component = fixture.componentInstance;
    component.formGroup = fb.group({
      fechaHomog: [''],
      horaHomog: [''],
      analistaHomog: [''],
    });
    fixture.detectChanges();
  }

  it('should create', () => {
    crearFixture();
    expect(component).toBeTruthy();
  });

  it('should render fechaHomog bound to form control', () => {
    crearFixture();
    const input = fixture.debugElement.query(By.css('[formControlName="fechaHomog"]'));
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
