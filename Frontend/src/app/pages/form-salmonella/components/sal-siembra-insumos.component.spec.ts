import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormBuilder, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { By } from '@angular/platform-browser';
import { IonicModule } from '@ionic/angular';
import { SalSiembraInsumosComponent } from './sal-siembra-insumos.component';
import { ModoLecturaPipe } from '../../../pipes/modo-lectura.pipe';

describe('SalSiembraInsumosComponent', () => {
  let component: SalSiembraInsumosComponent;
  let fixture: ComponentFixture<SalSiembraInsumosComponent>;
  let fb: FormBuilder;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [SalSiembraInsumosComponent, ModoLecturaPipe],
      imports: [ReactiveFormsModule, FormsModule, IonicModule],
    }).compileComponents();

    fb = TestBed.inject(FormBuilder);
  });

  function crearFixture(): void {
    fixture = TestBed.createComponent(SalSiembraInsumosComponent);
    component = fixture.componentInstance;
    component.formGroup = fb.group({
      idMedioCaldo: [null],
      volumenCaldo: ['225ml'],
      idEstufa: [null],
      idBano: [null],
    });
    fixture.detectChanges();
  }

  it('should create', () => {
    crearFixture();
    expect(component).toBeTruthy();
  });

  it('should render idMedioCaldo bound to form control', () => {
    crearFixture();
    const select = fixture.debugElement.query(By.css('[formControlName="idMedioCaldo"]'));
    expect(select).toBeTruthy();
  });

  it('should add an idMaterial to tweenSeleccionados on toggle', () => {
    crearFixture();
    const spy = jasmine.createSpy('tweenSeleccionadosChange');
    component.tweenSeleccionadosChange.subscribe(spy);
    component.tweenSeleccionados = [];
    component.toggleTween(1);
    expect(spy).toHaveBeenCalledWith([1]);
  });

  it('should remove an idMaterial from tweenSeleccionados when already selected', () => {
    crearFixture();
    const spy = jasmine.createSpy('tweenSeleccionadosChange');
    component.tweenSeleccionadosChange.subscribe(spy);
    component.tweenSeleccionados = [1, 2];
    component.toggleTween(1);
    expect(spy).toHaveBeenCalledWith([2]);
  });

  it('should emit micropipetasSeleccionadasChange on toggleMicropipeta', () => {
    crearFixture();
    const spy = jasmine.createSpy('micropipetasSeleccionadasChange');
    component.micropipetasSeleccionadasChange.subscribe(spy);
    component.micropipetasSeleccionadas = [];
    component.toggleMicropipeta(5);
    expect(spy).toHaveBeenCalledWith([5]);
  });
});
