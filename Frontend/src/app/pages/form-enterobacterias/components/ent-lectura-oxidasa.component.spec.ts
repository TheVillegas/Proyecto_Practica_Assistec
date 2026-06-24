import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormBuilder, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { By } from '@angular/platform-browser';
import { IonicModule } from '@ionic/angular';
import { EntLecturaOxidasaComponent } from './ent-lectura-oxidasa.component';
import { ModoLecturaPipe } from '../../../pipes/modo-lectura.pipe';

describe('EntLecturaOxidasaComponent', () => {
  let component: EntLecturaOxidasaComponent;
  let fixture: ComponentFixture<EntLecturaOxidasaComponent>;
  let fb: FormBuilder;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [EntLecturaOxidasaComponent, ModoLecturaPipe],
      imports: [ReactiveFormsModule, FormsModule, IonicModule],
    }).compileComponents();

    fb = TestBed.inject(FormBuilder);
  });

  function crearFixture(): void {
    fixture = TestBed.createComponent(EntLecturaOxidasaComponent);
    component = fixture.componentInstance;
    component.formGroup = fb.group({
      fechaLectConf: [''],
      horaLectConf: [''],
      analistaLectConf: [''],
      fechaOxidasa: [''],
      horaOxidasa: [''],
      analistaOxidasa: [''],
      reactivoOxidasa: [''],
      desaireadoAgarGlucosa: [''],
      agarGlucosa: [''],
      controlPosEcoli: [''],
      controlNegPaer: [''],
      blanco: [''],
    });
    fixture.detectChanges();
  }

  it('should create', () => {
    crearFixture();
    expect(component).toBeTruthy();
  });

  it('should render reactivoOxidasa bound to form control', () => {
    crearFixture();
    const input = fixture.debugElement.query(By.css('[formControlName="reactivoOxidasa"]'));
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
