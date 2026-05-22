import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { of } from 'rxjs';
import { SolicitudIngresoPage } from './solicitud-ingreso.page';
import { CatalogosService } from 'src/app/services/catalogos.service';
import { SolicitudIngresoService } from 'src/app/services/solicitud-ingreso.service';
import { AlertController, ToastController } from '@ionic/angular';
import { resolveSolicitudStateMeta } from './solicitud-estado-families';
import { AuthService } from 'src/app/services/auth-service';

describe('SolicitudIngresoPage', () => {
  let fixture: ComponentFixture<SolicitudIngresoPage>;
  let component: SolicitudIngresoPage;
  let solicitudService: jasmine.SpyObj<SolicitudIngresoService>;
  let alertController: jasmine.SpyObj<AlertController>;
  let routeId: string | null;
  let authServiceStub: { canAccess: jasmine.Spy; getUsuario: jasmine.Spy };

  beforeEach(async () => {
    solicitudService = jasmine.createSpyObj<SolicitudIngresoService>('SolicitudIngresoService', [
      'resolverAnalisis',
      'obtenerPlazoEstimado',
      'crear',
      'actualizar',
      'obtener',
      'enviarValidacion',
      'validar',
      'rechazar'
    ]);

    solicitudService.resolverAnalisis.and.returnValue(of({
      id_formulario_analisis: '10',
      codigo_formulario: 'SALMONELLA_ISO',
      nombre_formulario: 'Salmonella ISO',
      id_alcance_acreditacion: 1,
      codigo_le: 'LE 261',
      acreditado: true,
      metodologia_norma: 'ISO 6579-1:2017',
      dias_negativo: 3,
      dias_confirmacion: 6
    }));
    solicitudService.obtenerPlazoEstimado.and.returnValue(of({
      dias_negativo: 4,
      dias_confirmacion: 6,
      fecha_entrega_neg: '2026-05-09T00:00:00.000Z',
      fecha_entrega_pos: '2026-05-11T00:00:00.000Z'
    }));
    solicitudService.validar.and.returnValue(of({
      id_solicitud: '123',
      numero_ali: 1001,
      numero_acta: '15',
      codigo_externo: 'EXT-1',
      estado: 'enviado',
      updated_at: '2026-05-07T10:00:00.000Z',
      validacion_coordinadora: { aprobada: true, rut: '1-1', fecha: '2026-05-07T10:00:00.000Z' },
      validacion_jefa: { aprobada: false, rut: null, fecha: null },
      formularios_seleccionados: [{ codigo: 'TPA', nombre: 'TPA', genera_tpa_default: true }]
    } as any));
    solicitudService.rechazar.and.returnValue(of({
      id_solicitud: '123',
      numero_ali: 1001,
      numero_acta: '15',
      codigo_externo: 'EXT-1',
      estado: 'rechazado',
      updated_at: '2026-05-07T10:00:00.000Z',
      formularios_seleccionados: [{ codigo: 'TPA', nombre: 'TPA', genera_tpa_default: true }]
    } as any));

    alertController = jasmine.createSpyObj<AlertController>('AlertController', ['create']);
    alertController.create.and.returnValue(Promise.resolve({ present: () => Promise.resolve() } as any));
    routeId = null;
    authServiceStub = {
      canAccess: jasmine.createSpy('canAccess').and.returnValue(false),
      getUsuario: jasmine.createSpy('getUsuario').and.returnValue({ roles: [3], primaryRole: 3, activeRole: 3 })
    };

    await TestBed.configureTestingModule({
      declarations: [SolicitudIngresoPage],
      imports: [ReactiveFormsModule],
      schemas: [NO_ERRORS_SCHEMA],
      providers: [
        {
          provide: CatalogosService,
          useValue: {
            getCategorias: () => of([
              { idCategoria: '1', nombre: 'Productos Hidrobiologicos' },
              { idCategoria: '2', nombre: 'Conservas' }
            ]),
            getFormulariosAnalisis: () => of([
              { idFormularioAnalisis: '2', codigo: 'RAM35', nombreAnalisis: 'RAM 35C', area: 'Microbiologia', generaTpaDefault: false },
              { idFormularioAnalisis: '10', codigo: 'SALMONELLA_ISO', nombreAnalisis: 'Salmonella ISO', area: 'Microbiologia', generaTpaDefault: false },
              { idFormularioAnalisis: '1', codigo: 'TPA', nombreAnalisis: 'TPA', area: 'Microbiologia', generaTpaDefault: true },
              { idFormularioAnalisis: '99', codigo: 'HIERRO', nombreAnalisis: 'Hierro', area: 'Quimica', generaTpaDefault: false }
            ]),
            getEquiposInstrumentos: () => of([
              { idEquipo: 1, nombreEquipo: 'Balanza 74-M', codigoEquipo: '74-M' },
              { idEquipo: 2, nombreEquipo: 'Termometro', codigoEquipo: '10-T-I' },
              { idEquipo: 3, nombreEquipo: 'Refrigerador 2-I', codigoEquipo: '2-I' }
            ]),
            getLugaresAlmacenamiento: () => of([{ idLugar: 1, nombreLugar: 'Freezer 33-M', codigoLugar: 'FR-33M' }]),
            getSubcategorias: () => of([
              { idSubcategoria: '11', nombre: 'Pescado Fresco', idCategoria: '1' },
              { idSubcategoria: '12', nombre: 'Atun en conserva', idCategoria: '2' }
            ]),
            getResponsables: () => of([
              { rut: '0-0', nombreApellido: 'Analista', correo: '', rol: 0 },
              { rut: '1-1', nombreApellido: 'Coordinadora', correo: '', rol: 1 },
              { rut: '2-2', nombreApellido: 'Jefa', correo: '', rol: 2 }
            ])
          }
        },
        { provide: SolicitudIngresoService, useValue: solicitudService },
        { provide: Router, useValue: { navigate: jasmine.createSpy('navigate') } },
        { provide: ActivatedRoute, useValue: { snapshot: { queryParamMap: { get: (key: string) => key === 'id' ? routeId : null } } } },
        { provide: AlertController, useValue: alertController },
        { provide: ToastController, useValue: { create: () => Promise.resolve({ present: () => Promise.resolve() }) } },
        { provide: AuthService, useValue: authServiceStub }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(SolicitudIngresoPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('habilita codigo ALI y Numero como campos manuales obligatorios', () => {
    expect(component.form.get('codigoALI')?.disabled).toBeFalse();
    expect(component.form.get('numeroActa')?.disabled).toBeFalse();
    expect(component.form.get('anioIngreso')?.disabled).toBeTrue();
    expect(component.form.get('codigoALI')?.hasError('required')).toBeTrue();
    expect(component.form.get('numeroActa')?.hasError('required')).toBeTrue();
  });

  it('bloquea Siguiente cuando falta un campo requerido de la etapa 1', () => {
    component.etapaActual = 1;
    component.form.patchValue({ codigoALI: null, numeroActa: '' });

    component.avanzarEtapa();

    expect(component.etapaActual).toBe(1);
    expect(component.campoInvalido('codigoALI')).toBeTrue();
    expect(component.campoInvalido('numeroActa')).toBeTrue();
  });

  it('muestra detalle informativo de acreditacion, norma y dias por formulario', () => {
    component.form.patchValue({ categoria: 'Productos Hidrobiologicos' });
    const formulario = component.formulariosCatalogo.find((item) => item.codigo === 'SALMONELLA_ISO')!;

    component.toggleFormulario(formulario);

    expect(solicitudService.resolverAnalisis).toHaveBeenCalledWith('1', '10');
    expect(formulario.codigoLe).toBe('LE 261');
    expect(formulario.metodologiaNorma).toBe('ISO 6579-1:2017');
    expect(formulario.diasNegativo).toBe(3);
    expect(formulario.diasConfirmacion).toBe(6);
  });

  it('calcula plazo local como MAX dias + 1', () => {
    component.form.patchValue({ categoria: 'Productos Hidrobiologicos' });
    const formulario = component.formulariosCatalogo.find((item) => item.codigo === 'SALMONELLA_ISO')!;

    component.toggleFormulario(formulario);

    expect(component.tiempoEntregaNegativoDias).toBe(4);
    expect(component.tiempoEntregaConfirmacionDias).toBe(6);
  });

  it('muestra todas las categorias del catalogo y filtra subcategorias por categoria seleccionada', () => {
    expect(component.categorias.map((categoria) => categoria.nombre)).toEqual(['Productos Hidrobiologicos', 'Conservas']);

    component.form.patchValue({ categoria: 'Conservas' });

    expect(component.subcategorias.map((subcategoria) => subcategoria.nombre)).toEqual(['Atun en conserva']);
  });

  it('usa un solo NO APLICA para deshabilitar fechas y asigna analista por defecto', () => {
    component.form.patchValue({ analistaResponsable: '', noAplicaMuestreo: true });

    expect(component.form.get('fechaInicioMuestreo')?.disabled).toBeTrue();
    expect(component.form.get('fechaTerminoMuestreo')?.disabled).toBeTrue();
    expect(component.form.get('analistaResponsable')?.value).toBe('Analista');
  });

  it('usa equipos_lab tambien para lugar de almacenamiento', () => {
    expect(component.equiposAlmacenamiento.map((equipo) => equipo.codigoEquipo)).toContain('2-I');
  });

  it('resuelve familias de estado legadas y canónicas para el resumen', () => {
    expect(resolveSolicitudStateMeta('enviada')).toEqual({ label: 'En validación', css: 'badge-pending', family: 'under_review' });
    expect(resolveSolicitudStateMeta('devuelta')).toEqual({ label: 'Devuelta', css: 'badge-danger', family: 'resubmittable' });
    expect(resolveSolicitudStateMeta('validada')).toEqual({ label: 'Validada', css: 'badge-success', family: 'post_validation' });
  });

  it('habilita enviar a validacion solo con formulario completo, formularios consolidados y estado reenviable', () => {
    component.form.patchValue({
      codigoALI: 1001,
      numeroActa: '15',
      categoria: 'Productos Hidrobiologicos',
      nombreCliente: 'Cliente prueba',
      direccion: 'Direccion prueba',
      nombreSolicitante: 'Solicitante prueba',
      fechaRecepcion: '2026-05-06T12:00',
      temperatura: 4,
      idTermometro: 2,
      codigoEquipoManual: '10-T-I',
      fechaInicioMuestreo: '2026-05-06T12:00',
      fechaTerminoMuestreo: '2026-05-06T13:00',
      numeroMuestras: 1,
      numeroEnvases: 1,
      analistaResponsable: 'Analista',
      lugarMuestreo: 'Planta',
      instructivoMuestreo: 'No informado',
      subcategoria: '11',
      idLugar: 3,
      envasesSuministradosPor: 'Cliente',
      rutCoordinadoraRecepcion: '1-1',
      rutJefaArea: '2-2'
    });

    const formulario = component.formulariosCatalogo.find((item) => item.codigo === 'SALMONELLA_ISO')!;
    component.toggleFormulario(formulario);

    component.estadoFlujo = 'borrador';
    component.solicitudId = '123';
    component.updatedAt = '2026-05-06T12:30:00.000Z';

    expect(component.requiredFieldsComplete).toBeTrue();
    expect(component.hasConsolidatedForms).toBeTrue();
    expect(component.canSendToValidation).toBeTrue();
  });

  it('bloquea enviar a validacion cuando la solicitud ya esta en revision aunque el formulario este completo', () => {
    component.form.patchValue({
      codigoALI: 1001,
      numeroActa: '15',
      categoria: 'Productos Hidrobiologicos',
      nombreCliente: 'Cliente prueba',
      direccion: 'Direccion prueba',
      nombreSolicitante: 'Solicitante prueba',
      fechaRecepcion: '2026-05-06T12:00',
      temperatura: 4,
      idTermometro: 2,
      codigoEquipoManual: '10-T-I',
      fechaInicioMuestreo: '2026-05-06T12:00',
      fechaTerminoMuestreo: '2026-05-06T13:00',
      numeroMuestras: 1,
      numeroEnvases: 1,
      analistaResponsable: 'Analista',
      lugarMuestreo: 'Planta',
      instructivoMuestreo: 'No informado',
      subcategoria: '11',
      idLugar: 3,
      envasesSuministradosPor: 'Cliente',
      rutCoordinadoraRecepcion: '1-1',
      rutJefaArea: '2-2'
    });

    const formulario = component.formulariosCatalogo.find((item) => item.codigo === 'SALMONELLA_ISO')!;
    component.toggleFormulario(formulario);

    component.estadoFlujo = 'enviado';
    component.solicitudId = '123';
    component.updatedAt = '2026-05-06T12:30:00.000Z';

    expect(component.canSendToValidation).toBeFalse();
  });

  it('bloquea ejecutar el envio cuando faltan prerequisitos tecnicos', async () => {
    component.form.patchValue({
      codigoALI: 1001,
      numeroActa: '15',
      categoria: 'Productos Hidrobiologicos',
      nombreCliente: 'Cliente prueba',
      direccion: 'Direccion prueba',
      nombreSolicitante: 'Solicitante prueba',
      fechaRecepcion: '2026-05-06T12:00',
      temperatura: 4,
      idTermometro: 2,
      codigoEquipoManual: '10-T-I',
      fechaInicioMuestreo: '2026-05-06T12:00',
      fechaTerminoMuestreo: '2026-05-06T13:00',
      numeroMuestras: 1,
      numeroEnvases: 1,
      analistaResponsable: 'Analista',
      lugarMuestreo: 'Planta',
      instructivoMuestreo: 'No informado',
      subcategoria: '11',
      idLugar: 3,
      envasesSuministradosPor: 'Cliente',
      rutCoordinadoraRecepcion: '1-1',
      rutJefaArea: '2-2'
    });

    const formulario = component.formulariosCatalogo.find((item) => item.codigo === 'SALMONELLA_ISO')!;
    component.toggleFormulario(formulario);

    component.solicitudId = null;
    component.updatedAt = null;

    await component.enviarAValidacion();

    expect(alertController.create).toHaveBeenCalled();
    expect(solicitudService.enviarValidacion).not.toHaveBeenCalled();
  });

  it('filtra formularios al alcance digitalizado e incluye RAM existente', () => {
    const codigos = component.formulariosCatalogo.map((formulario) => formulario.codigo);

    expect(codigos).toContain('TPA');
    expect(codigos).toContain('RAM35');
    expect(codigos).toContain('SALMONELLA_ISO');
    expect(codigos).not.toContain('HIERRO');
  });

  it('muestra boton Nueva solicitud cuando existe una solicitud guardada', () => {
    component.solicitudId = '123';
    fixture.detectChanges();

    const texto = fixture.nativeElement.textContent;

    expect(texto).toContain('Nueva solicitud');
  });

  it('limpia la solicitud actual y rehidrata TPA/catalogos al crear una nueva', () => {
    component.solicitudId = '123';
    component.updatedAt = '2026-05-05T14:00:00.000Z';
    component.estadoFlujo = 'enviado';
    component.fechaEnvioValidacion = '2026-05-05T14:00:00.000Z';
    component.plazoEstimado = {
      dias_negativo: 4,
      dias_confirmacion: 7,
      fecha_entrega_neg: '2026-05-09T00:00:00.000Z',
      fecha_entrega_pos: '2026-05-12T00:00:00.000Z'
    };
    component.etapaActual = 8;
    component.form.patchValue({
      codigoALI: 1001,
      numeroActa: '15',
      categoria: 'Productos Hidrobiologicos',
      nombreCliente: 'Cliente prueba',
      direccion: 'Direccion prueba',
      numeroMuestras: 3,
      numeroEnvases: 4,
      idTermometro: 2,
      idLugar: 3
    });

    component.nuevaSolicitud();

    expect(component.solicitudId).toBeNull();
    expect(component.updatedAt).toBeNull();
    expect(component.estadoFlujo).toBe('borrador');
    expect(component.fechaEnvioValidacion).toBeNull();
    expect(component.plazoEstimado).toBeNull();
    expect(component.etapaActual).toBe(1);
    expect(component.form.get('codigoALI')?.value).toBe('');
    expect(component.form.get('numeroActa')?.value).toBe('');
    expect(component.form.get('categoria')?.value).toBe('');
    expect(component.form.get('numeroMuestras')?.value).toBe(1);
    expect(component.form.get('numeroEnvases')?.value).toBe(1);
    expect(component.form.get('anioIngreso')?.disabled).toBeTrue();
    expect(component.formulariosCatalogo.find((formulario) => formulario.codigo === 'TPA')?.seleccionado).toBeTrue();
    expect(component.equiposLaboratorio.map((equipo) => equipo.codigoEquipo)).toContain('10-T-I');
    expect(component.equiposAlmacenamiento.map((equipo) => equipo.codigoEquipo)).toContain('2-I');
  });

  it('muestra estado legible para envio y validacion en el resumen', () => {
    component.estadoFlujo = 'enviada';

    expect(component.badgeEstado).toEqual({ label: 'En validación', css: 'badge-pending', family: 'under_review' });
  });

  it('abre una solicitud existente en modo solo lectura para revisión', () => {
    routeId = '123';
    authServiceStub.canAccess.and.returnValue(true);
    authServiceStub.getUsuario.and.returnValue({ roles: [1], primaryRole: 1, activeRole: 1 });
    solicitudService.obtener.and.returnValue(of({
      id_solicitud: '123',
      numero_ali: 1001,
      numero_acta: '15',
      codigo_externo: 'EXT-1',
      estado: 'enviado',
      updated_at: '2026-05-06T12:30:00.000Z',
      validacion_coordinadora: { aprobada: false, rut: null, fecha: null },
      validacion_jefa: { aprobada: false, rut: null, fecha: null },
      formularios_seleccionados: [{ codigo: 'TPA', nombre: 'TPA', genera_tpa_default: true }]
    } as any));

    fixture = TestBed.createComponent(SolicitudIngresoPage);
    component = fixture.componentInstance;
    fixture.detectChanges();

    expect(component.reviewMode).toBeTrue();
    expect(component.form.disabled).toBeTrue();
    expect(component.canReviewCurrentSolicitud).toBeTrue();
  });

  it('valida la solicitud desde la vista de revisión y actualiza el estado', async () => {
    component.reviewMode = true;
    authServiceStub.getUsuario.and.returnValue({ roles: [1], primaryRole: 1, activeRole: 1 });
    component.solicitudId = '123';
    component.updatedAt = '2026-05-06T12:30:00.000Z';
    component.estadoFlujo = 'enviado';
    component.validacionCoordinadora = { aprobada: false, rut: null, fecha: null };
    component.validacionJefa = { aprobada: false, rut: null, fecha: null };

    await component.validarSolicitudRevision();

    expect(solicitudService.validar).toHaveBeenCalledWith('123', '2026-05-06T12:30:00.000Z');
    expect(component.estadoFlujo).toBe('enviado');
    expect(component.validacionCoordinadora.aprobada).toBeTrue();
    expect(component.canTakeReviewAction).toBeFalse();
  });

  it('oculta la segunda validación para coordinadora cuando su aprobación ya existe', () => {
    component.reviewMode = true;
    authServiceStub.getUsuario.and.returnValue({ roles: [1], primaryRole: 1, activeRole: 1 });
    component.solicitudId = '123';
    component.updatedAt = '2026-05-06T12:30:00.000Z';
    component.estadoFlujo = 'enviado';
    component.validacionCoordinadora = { aprobada: true, rut: '1-1', fecha: '2026-05-06T12:35:00.000Z' };
    component.validacionJefa = { aprobada: false, rut: null, fecha: null };

    expect(component.canReviewCurrentSolicitud).toBeTrue();
    expect(component.canTakeReviewAction).toBeFalse();
    expect(component.reviewAlreadyCompletedMessage).toContain('ya fue registrada');
  });

  it('mantiene visible la validación para jefatura cuando sólo validó coordinadora', () => {
    component.reviewMode = true;
    authServiceStub.getUsuario.and.returnValue({ roles: [2], primaryRole: 2, activeRole: 2 });
    component.solicitudId = '123';
    component.updatedAt = '2026-05-06T12:30:00.000Z';
    component.estadoFlujo = 'enviado';
    component.validacionCoordinadora = { aprobada: true, rut: '1-1', fecha: '2026-05-06T12:35:00.000Z' };
    component.validacionJefa = { aprobada: false, rut: null, fecha: null };

    expect(component.canTakeReviewAction).toBeTrue();
    expect(component.reviewAlreadyCompletedMessage).toBeNull();
  });
});
