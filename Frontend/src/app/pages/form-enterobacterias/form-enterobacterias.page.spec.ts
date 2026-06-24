import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { FormEnterobacteriasPage } from './form-enterobacterias.page';
import { EnterobacteriasApiService } from '../../services/enterobacterias-api.service';
import { AuthService } from '../../services/auth-service';
import { AlertController, ToastController } from '@ionic/angular';
import { Router, ActivatedRoute } from '@angular/router';
import { of } from 'rxjs';

describe('FormEnterobacteriasPage', () => {
  let component: FormEnterobacteriasPage;
  let fixture: ComponentFixture<FormEnterobacteriasPage>;
  let apiServiceSpy: jasmine.SpyObj<EnterobacteriasApiService>;
  let authServiceSpy: jasmine.SpyObj<AuthService>;
  let routerSpy: jasmine.SpyObj<Router>;

  beforeEach(async () => {
    apiServiceSpy = jasmine.createSpyObj('EnterobacteriasApiService', ['obtener', 'guardarEtapa']);
    authServiceSpy = jasmine.createSpyObj('AuthService', ['getUsuario']);
    routerSpy = jasmine.createSpyObj('Router', ['navigate']);

    await TestBed.configureTestingModule({
      declarations: [FormEnterobacteriasPage],
      schemas: [NO_ERRORS_SCHEMA],
      providers: [
        { provide: EnterobacteriasApiService, useValue: apiServiceSpy },
        { provide: AuthService, useValue: authServiceSpy },
        { provide: Router, useValue: routerSpy },
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { paramMap: { get: () => '42' } } },
        },
        {
          provide: AlertController,
          useValue: { create: () => Promise.resolve({ present: () => Promise.resolve() } as any) },
        },
        {
          provide: ToastController,
          useValue: { create: () => Promise.resolve({ present: () => Promise.resolve() } as any) },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(FormEnterobacteriasPage);
    component = fixture.componentInstance;
  });

  function iniciarComoAnalista(): void {
    authServiceSpy.getUsuario.and.returnValue({ primaryRole: 0, roles: [0] });
    fixture.detectChanges();
  }

  it('should create', () => {
    iniciarComoAnalista();
    expect(component).toBeTruthy();
  });

  it('inicia en paso 1 y etapa 1', () => {
    iniciarComoAnalista();
    expect(component.pasoActual).toBe(1);
    expect(component.etapaActual).toBe(1);
  });

  it('avance local 1 → 2 no invoca guardarEtapa', () => {
    iniciarComoAnalista();
    component.form.get('pesado')?.patchValue({
      nActa: 'ACT-001',
      tipoMuestra: 'Mixta',
      fechaInicio: '2026-06-24',
      horaInicio: '08:00',
      analistaInicio: 'Ana',
    });
    component.onSiguiente();
    expect(component.pasoActual).toBe(2);
    expect(apiServiceSpy.guardarEtapa).not.toHaveBeenCalled();
  });

  it('avance local 2 → 3 no invoca guardarEtapa', () => {
    iniciarComoAnalista();
    component.pasoActual = 2;
    component.form.get('homogeneizacion')?.patchValue({
      fechaHomog: '2026-06-24',
      horaHomog: '08:00',
      analistaHomog: 'Ana',
    });
    component.onSiguiente();
    expect(component.pasoActual).toBe(3);
    expect(apiServiceSpy.guardarEtapa).not.toHaveBeenCalled();
  });

  it('paso 4 → 5 invoca guardarEtapa(1, true) y avanza en éxito', fakeAsync(() => {
    iniciarComoAnalista();
    apiServiceSpy.guardarEtapa.and.returnValue(of({ updatedAt: '2026-06-24T10:00:00.000Z' } as any));
    component.pasoActual = 4;
    component.form.get('incubacionPrep')?.patchValue({
      agarVRBGIncub: 'VRBG-001',
      estufaIncub: 'Estufa 73-M (35.0 +/- 0.5 °C)',
      fechaTermino: '2026-06-24',
      horaTermino: '08:00',
      analistaIncub: 'Ana',
    });
    component.onSiguiente();
    tick();
    expect(apiServiceSpy.guardarEtapa).toHaveBeenCalledOnceWith(42, 1, jasmine.any(Object), jasmine.any(String));
    expect(component.pasoActual).toBe(5);
  }));

  it('paso 5 → 6 invoca guardarEtapa(2, true) y avanza en éxito', fakeAsync(() => {
    iniciarComoAnalista();
    apiServiceSpy.guardarEtapa.and.returnValue(of({ updatedAt: '2026-06-24T10:00:00.000Z' } as any));
    component.pasoActual = 5;
    component.form.get('analisisLectura')?.patchValue({
      fechaLectura24h: '2026-06-24',
      horaLectura24h: '08:00',
      analistaLectura24h: 'Ana',
      nMuestraLectura: 1,
      dilucion: 1,
      colonias: 10,
      equipoCuentaColonias: 'ECC-001',
    });
    component.onSiguiente();
    tick();
    expect(apiServiceSpy.guardarEtapa).toHaveBeenCalledOnceWith(42, 2, jasmine.any(Object), jasmine.any(String));
    expect(component.pasoActual).toBe(6);
  }));

  it('paso 8 finaliza invocando guardarEtapa(3, true)', fakeAsync(() => {
    iniciarComoAnalista();
    apiServiceSpy.guardarEtapa.and.returnValue(of({ updatedAt: '2026-06-24T10:00:00.000Z' } as any));
    component.pasoActual = 8;
    component.form.get('resultados')?.patchValue({ observaciones: '' });
    component.onSiguiente();
    tick();
    expect(apiServiceSpy.guardarEtapa).toHaveBeenCalledOnceWith(42, 3, jasmine.any(Object), jasmine.any(String));
    expect(component.formularioCompletado).toBeTrue();
  }));

  it('guardar borrador invoca guardarEtapa con completada false', fakeAsync(() => {
    iniciarComoAnalista();
    apiServiceSpy.guardarEtapa.and.returnValue(of({ updatedAt: '2026-06-24T10:00:00.000Z' } as any));
    component.pasoActual = 3;
    component.form.get('sembrado')?.patchValue({
      agarVRBGSembrado: 'VRBG-001',
      estufaSembrado: 'Estufa 73-M (35.0 +/- 0.5 °C)',
      placasSembrado: 'PL-001',
      micropipeta1mlSembrado: '100',
      fechaSembrado: '2026-06-24',
      horaSembrado: '08:00',
      analistaSembrado: 'Ana',
    });
    component.onGuardarBorrador();
    tick();
    expect(apiServiceSpy.guardarEtapa).toHaveBeenCalledOnceWith(42, 1, jasmine.objectContaining({ completada: false }), jasmine.any(String));
  }));

  it('modoLectura es false para rol 0 (Analista)', () => {
    iniciarComoAnalista();
    expect(component.modoLectura).toBeFalse();
  });

  it('modoLectura es true para rol 1 (Coordinadora)', () => {
    authServiceSpy.getUsuario.and.returnValue({ primaryRole: 1, roles: [1] });
    fixture.detectChanges();
    expect(component.modoLectura).toBeTrue();
  });
});
