import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { of } from 'rxjs';
import { SolicitudIngresoPage } from './solicitud-ingreso.page';
import { CatalogosService } from 'src/app/services/catalogos.service';
import { SolicitudIngresoService } from 'src/app/services/solicitud-ingreso.service';
import { AlertController, ToastController } from '@ionic/angular';

describe('SolicitudIngresoPage', () => {
  let fixture: ComponentFixture<SolicitudIngresoPage>;
  let component: SolicitudIngresoPage;
  let solicitudService: jasmine.SpyObj<SolicitudIngresoService>;

  beforeEach(async () => {
    solicitudService = jasmine.createSpyObj<SolicitudIngresoService>('SolicitudIngresoService', [
      'resolverAnalisis',
      'obtenerPlazoEstimado',
      'crear',
      'actualizar',
      'obtener',
      'enviarValidacion'
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
      dias_confirmacion: 7,
      fecha_entrega_neg: '2026-05-09T00:00:00.000Z',
      fecha_entrega_pos: '2026-05-12T00:00:00.000Z'
    }));

    await TestBed.configureTestingModule({
      declarations: [SolicitudIngresoPage],
      imports: [ReactiveFormsModule],
      schemas: [NO_ERRORS_SCHEMA],
      providers: [
        {
          provide: CatalogosService,
          useValue: {
            getCategorias: () => of([{ idCategoria: '1', nombre: 'Productos Hidrobiologicos' }]),
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
            getResponsables: () => of([
              { rut: '0-0', nombreApellido: 'Analista', correo: '', rol: 0 },
              { rut: '1-1', nombreApellido: 'Coordinadora', correo: '', rol: 1 },
              { rut: '2-2', nombreApellido: 'Jefa', correo: '', rol: 2 }
            ])
          }
        },
        { provide: SolicitudIngresoService, useValue: solicitudService },
        { provide: Router, useValue: { navigate: jasmine.createSpy('navigate') } },
        { provide: ActivatedRoute, useValue: { snapshot: { queryParamMap: { get: () => null } } } },
        { provide: AlertController, useValue: { create: () => Promise.resolve({ present: () => Promise.resolve() }) } },
        { provide: ToastController, useValue: { create: () => Promise.resolve({ present: () => Promise.resolve() }) } }
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

  it('bloquea Siguiente cuando falta un campo requerido de la etapa', () => {
    component.etapaActual = 1;
    component.form.patchValue({ codigoALI: 1001, numeroActa: '15', categoria: '' });

    component.avanzarEtapa();

    expect(component.etapaActual).toBe(1);
    expect(component.campoInvalido('categoria')).toBeTrue();
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
    expect(component.tiempoEntregaConfirmacionDias).toBe(7);
  });

  it('usa equipos_lab tambien para lugar de almacenamiento', () => {
    expect(component.equiposAlmacenamiento.map((equipo) => equipo.codigoEquipo)).toContain('2-I');
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
});
