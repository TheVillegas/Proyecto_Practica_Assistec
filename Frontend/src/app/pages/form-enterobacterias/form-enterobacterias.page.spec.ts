import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { FormEnterobacteriasPage } from './form-enterobacterias.page';
import { EnterobacteriasApiService } from '../../services/enterobacterias-api.service';
import { AuthService } from '../../services/auth-service';
import { CatalogosService } from '../../services/catalogos.service';
import { AlertController, ToastController } from '@ionic/angular';
import { Router, ActivatedRoute } from '@angular/router';
import { of } from 'rxjs';

describe('FormEnterobacteriasPage', () => {
  let component: FormEnterobacteriasPage;
  let fixture: ComponentFixture<FormEnterobacteriasPage>;
  let apiServiceSpy: jasmine.SpyObj<EnterobacteriasApiService>;
  let catalogosServiceSpy: jasmine.SpyObj<CatalogosService>;
  let authServiceSpy: jasmine.SpyObj<AuthService>;
  let routerSpy: jasmine.SpyObj<Router>;

  const mockEquipoIncubacion = [{ idIncubacion: 1, nombreEquipo: 'Estufa 73-M', temperaturaRef: '35.0' }];
  const mockResponsable = [{ rut: '1-9', nombreApellido: 'Ana Pérez', correo: '', rol: 0 }];
  const mockMicropipeta = [{ idPipeta: 10, nombrePipeta: 'P100', codigoPipeta: 'P100', capacidad: '100' }];
  const mockLoteAgar = [{ idLoteReactivo: '100', tipo: 'agar_vrbg' as const, codigoLote: 'VRBG-2025-A', activo: true }];
  const mockLoteTween = [{ idLoteReactivo: '200', tipo: 'tween_80' as const, codigoLote: 'TW80-2025-01', activo: true }];

  beforeEach(async () => {
    apiServiceSpy = jasmine.createSpyObj('EnterobacteriasApiService', ['obtener', 'obtenerPorAnalisis', 'guardarEtapa']);
    catalogosServiceSpy = jasmine.createSpyObj('CatalogosService', [
      'getEquiposIncubacion',
      'getResponsables',
      'getMicroPipetas',
      'getLotesReactivo'
    ]);
    authServiceSpy = jasmine.createSpyObj('AuthService', ['getUsuario']);
    routerSpy = jasmine.createSpyObj('Router', ['navigate']);

    apiServiceSpy.obtener.and.returnValue(of({
      idEntFormulario: '42',
      idSolicitudAnalisis: '99',
      etapaActual: 1,
      subetapaActual: 1,
      estado: 'en_proceso',
      createdAt: '2026-06-24T00:00:00.000Z',
      updatedAt: '2026-06-24T00:00:00.000Z',
      muestras: []
    } as any));

    catalogosServiceSpy.getEquiposIncubacion.and.returnValue(of(mockEquipoIncubacion));
    catalogosServiceSpy.getResponsables.and.returnValue(of(mockResponsable));
    catalogosServiceSpy.getMicroPipetas.and.returnValue(of(mockMicropipeta));
    catalogosServiceSpy.getLotesReactivo.withArgs('agar_vrbg').and.returnValue(of(mockLoteAgar));
    catalogosServiceSpy.getLotesReactivo.withArgs('tween_80').and.returnValue(of(mockLoteTween));

    await TestBed.configureTestingModule({
      declarations: [FormEnterobacteriasPage],
      schemas: [NO_ERRORS_SCHEMA],
      providers: [
        { provide: EnterobacteriasApiService, useValue: apiServiceSpy },
        { provide: CatalogosService, useValue: catalogosServiceSpy },
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

  it('carga catálogos y formulario en ngOnInit via forkJoin', () => {
    iniciarComoAnalista();
    expect(catalogosServiceSpy.getEquiposIncubacion).toHaveBeenCalled();
    expect(catalogosServiceSpy.getResponsables).toHaveBeenCalled();
    expect(catalogosServiceSpy.getMicroPipetas).toHaveBeenCalled();
    expect(catalogosServiceSpy.getLotesReactivo).toHaveBeenCalledWith('agar_vrbg');
    expect(catalogosServiceSpy.getLotesReactivo).toHaveBeenCalledWith('tween_80');
    expect(apiServiceSpy.obtener).toHaveBeenCalledWith(42);
    expect(component.catalogos.equiposIncubacion()).toEqual(mockEquipoIncubacion);
    expect(component.catalogos.responsables()).toEqual(mockResponsable);
    expect(component.catalogos.micropipetas()).toEqual(mockMicropipeta);
    expect(component.catalogos.lotesAgarVRBG()).toEqual(mockLoteAgar);
    expect(component.catalogos.lotesTween80()).toEqual(mockLoteTween);
  });

  it('inicia en paso 1 y etapa 1', () => {
    iniciarComoAnalista();
    expect(component.pasoActual).toBe(1);
    expect(component.etapaActual).toBe(1);
  });

  it('avance local 1 → 2 no invoca guardarEtapa', () => {
    iniciarComoAnalista();
    component.form.get('pesado')?.patchValue({
      codigoALI: 'ALI-2025-00421',
      nActa: 'ACT-001',
      tipoMuestra: 'Mixta',
      fechaInicio: '2026-06-24',
      horaInicio: '08:00',
      analistaInicio: '1-9',
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
      analistaHomog: '1-9',
    });
    component.onSiguiente();
    expect(component.pasoActual).toBe(3);
    expect(apiServiceSpy.guardarEtapa).not.toHaveBeenCalled();
  });

  it('paso 4 → 5 invoca guardarEtapa(1, true) con payload aplanado y avanza en éxito', fakeAsync(() => {
    iniciarComoAnalista();
    apiServiceSpy.guardarEtapa.and.returnValue(of({ updatedAt: '2026-06-24T10:00:00.000Z' } as any));
    component.pasoActual = 4;
    component.form.get('incubacionPrep')?.patchValue({
      agarVRBGIncub: '100',
      estufaIncub: 1,
      fechaTermino: '2026-06-24',
      horaTermino: '08:00',
      analistaIncub: '1-9',
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
      analistaLectura24h: '1-9',
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
      agarVRBGSembrado: '100',
      estufaSembrado: 1,
      placasSembrado: 2,
      micropipeta1mlSembrado: 10,
      fechaSembrado: '2026-06-24',
      horaSembrado: '08:00',
      analistaSembrado: '1-9',
    });
    component.onGuardarBorrador();
    tick();
    expect(apiServiceSpy.guardarEtapa).toHaveBeenCalledOnceWith(42, 1, jasmine.objectContaining({ completada: false }), jasmine.any(String));
  }));

  it('actualiza updatedAt tras guardar etapa', fakeAsync(() => {
    iniciarComoAnalista();
    apiServiceSpy.guardarEtapa.and.returnValue(of({ updatedAt: '2026-06-24T11:00:00.000Z' } as any));
    component.pasoActual = 4;
    component.form.get('incubacionPrep')?.patchValue({
      estufaIncub: 1,
      fechaTermino: '2026-06-24',
      horaTermino: '08:00',
      analistaIncub: '1-9',
    });
    component.onSiguiente();
    tick();
    expect(component.updatedAt).toBe('2026-06-24T11:00:00.000Z');
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
