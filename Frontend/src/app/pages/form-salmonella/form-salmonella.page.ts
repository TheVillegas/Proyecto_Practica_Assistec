import { Component, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { AlertController, ToastController } from '@ionic/angular';
import { firstValueFrom, forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { SalmonellaApiService } from '../../services/salmonella-api.service';
import { CatalogosService } from '../../services/catalogos.service';
import { AuthService } from '../../services/auth-service';
import { MediosCultivosService, MedioCultivo } from '../../services/medios-cultivos.service';
import {
  BanoTermico,
  EquipoIncubacion,
  MaterialSiembra,
  Micropipeta,
  Responsable,
} from '../../interfaces/catalogo.interfaces';
import {
  SalFormularioCompleto,
  SalMuestra,
  SalFasePayload,
  SalFase1Payload,
  SalFase2aPayload,
  SalFase2bPayload,
  SalFase2cPayload,
  SalFase3aPayload,
  SalFase3bPayload,
  SalFase3cPayload,
  SalFase4aPayload,
  SalFase4bPayload,
  SalFase5Payload,
} from '../../interfaces/salmonella.interfaces';

export type Cumple = 'cumple' | 'no_cumple' | '';

export interface MuestraResEnriquecimiento {
  id: string;
  idSalMuestra: number;
  esDuplicado: boolean;
  label: string;
  caldoApt: boolean;
  selenito: boolean;
  rappaport: boolean;
  ctrlPositivoSEnteritidis: boolean;
  ctrlNegativoKPneumoniae: boolean;
  ctrlBlanco: boolean;
}

export interface MuestraResAislamiento {
  id: string;
  idSalMuestra: number;
  esDuplicado: boolean;
  label: string;
  xld24hSel: string;
  ss24hSel: string;
  xld48hSel: string;
  ss48hSel: string;
  xld24hRap: string;
  ss24hRap: string;
  xld48hRap: string;
  ss48hRap: string;
  ctrlPositivoSEnteritidis: boolean;
  ctrlNegativoKPneumoniae: boolean;
  ctrlBlanco: boolean;
}

export interface MuestraResultadoFinal {
  id: string;
  idSalMuestra: number;
  esDuplicado: boolean;
  label: string;
  resultadoFinal: string;
}

function crearMuestrasResEnriquecimiento(backend: SalMuestra[]): MuestraResEnriquecimiento[] {
  return backend.map((m) => {
    const lectura = m.fase3cLecturas?.[0];
    return {
      id: m.numeroMuestra,
      idSalMuestra: m.idSalMuestra,
      esDuplicado: m.esDuplicado,
      label: m.esDuplicado ? 'Duplicado' : `Muestra ${m.numeroMuestra}`,
      caldoApt: lectura?.resultadoCaldoApt ?? false,
      selenito: lectura?.resultadoseLenito ?? false,
      rappaport: lectura?.resultadoRappaport ?? false,
      ctrlPositivoSEnteritidis: lectura?.ctrlPositivoSEnteritidis ?? false,
      ctrlNegativoKPneumoniae: lectura?.ctrlNegativoKPneumoniae ?? false,
      ctrlBlanco: lectura?.ctrlBlanco ?? false,
    };
  });
}

function agarBackendASigno(valor: string | undefined): string {
  if (valor === 'tipico') return '+';
  if (valor === 'atipico') return '-';
  return '-';
}

function crearMuestrasResAislamiento(backend: SalMuestra[]): MuestraResAislamiento[] {
  return backend.map((m) => {
    const lectura = m.fase4bLecturas?.[0];
    return {
      id: m.numeroMuestra,
      idSalMuestra: m.idSalMuestra,
      esDuplicado: m.esDuplicado,
      label: m.esDuplicado ? 'Duplicado' : `Muestra ${m.numeroMuestra}`,
      xld24hSel: agarBackendASigno(lectura?.resXld24hSelenito),
      ss24hSel: agarBackendASigno(lectura?.resSs24hSelenito),
      xld48hSel: agarBackendASigno(lectura?.resXld48hSelenito),
      ss48hSel: agarBackendASigno(lectura?.resSs48hSelenito),
      xld24hRap: agarBackendASigno(lectura?.resXld24hRappaport),
      ss24hRap: agarBackendASigno(lectura?.resSs24hRappaport),
      xld48hRap: agarBackendASigno(lectura?.resXld48hRappaport),
      ss48hRap: agarBackendASigno(lectura?.resSs48hRappaport),
      ctrlPositivoSEnteritidis: lectura?.ctrlPositivoSEnteritidis === 'tipico',
      ctrlNegativoKPneumoniae: lectura?.ctrlNegativoKPneumoniae === 'tipico',
      ctrlBlanco: lectura?.ctrlBlanco === 'tipico',
    };
  });
}

function crearMuestrasResultadoFinal(
  backend: SalMuestra[],
  resultados?: Array<{ idSalMuestra: string; resultadoFinal: string }>
): MuestraResultadoFinal[] {
  const mapaResultados = new Map((resultados ?? []).map((r) => [String(r.idSalMuestra), r.resultadoFinal]));
  return backend.map((m) => ({
    id: m.numeroMuestra,
    idSalMuestra: m.idSalMuestra,
    esDuplicado: m.esDuplicado,
    label: m.esDuplicado ? 'Duplicado' : `Muestra ${m.numeroMuestra}`,
    resultadoFinal: mapaResultados.get(String(m.idSalMuestra)) ?? '',
  }));
}

@Component({
  selector: 'app-form-salmonella',
  templateUrl: './form-salmonella.page.html',
  styleUrls: ['./form-salmonella.page.scss'],
  standalone: false
})
export class FormSalmonellaPage implements OnInit {
  readonly TOTAL_ETAPAS = 8;
  pasoActual = signal<number>(1);

  readonly NOMBRES_ETAPAS = [
    'Inicio, Hidratación y Homogeneización',
    'Siembra e Insumos',
    'Controles de Calidad en ALI',
    'Traspaso a Enriquecimiento Selectivo',
    'Resultados de Enriquecimiento',
    'Aislamiento en Agares',
    'Resultados de Aislamiento',
    'Resultado Final y Conclusión'
  ];

  // Mapea etapa UI (1-8) a los pasos backend (URL fase 1-10). La fase 4
  // (SalFase2c) aparece en dos etapas: 3 (guardado parcial) y 8 (cierre).
  private readonly FASE_A_PASOS_BACKEND: Record<number, number[]> = {
    1: [1, 2],
    2: [3],
    3: [4],
    4: [5, 6],
    5: [7],
    6: [8],
    7: [9],
    8: [4]
  };

  // Mapea faseActual del backend (1-10) a la etapa UI (1-8) para reanudar
  // el wizard en el punto correcto al recargar el formulario.
  private readonly FASE_BACKEND_A_ETAPA: Record<number, number> = {
    1: 1, 2: 1, 3: 2, 4: 3, 5: 4, 6: 4, 7: 5, 8: 6, 9: 7, 10: 8
  };

  form!: FormGroup;
  formulario: SalFormularioCompleto | null = null;
  muestras: SalMuestra[] = [];
  cargando = signal<boolean>(false);
  idSolicitudAnalisis = 0;

  // ─── Colecciones de Muestras (tablas de resultados) ───
  muestrasResEnriquecimiento: MuestraResEnriquecimiento[] = [];
  muestrasResAislamiento: MuestraResAislamiento[] = [];
  muestrasResultadoFinal: MuestraResultadoFinal[] = [];

  // ─── Insumos multi-selección (fuera del FormGroup: son arreglos, no controles) ───
  tweenSeleccionados: number[] = [];
  micropipetasEtapa2: number[] = [];
  puntasSeleccionadas: number[] = [];
  pipetasDesechablesSeleccionadas: number[] = [];
  micropipetasEtapa4: number[] = [];

  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly alertCtrl = inject(AlertController);
  private readonly toastCtrl = inject(ToastController);
  private readonly api = inject(SalmonellaApiService);
  private readonly catalogos = inject(CatalogosService);
  private readonly mediosCultivosService = inject(MediosCultivosService);
  private readonly authService = inject(AuthService);

  // ─── Catálogos dinámicos ───
  listaEquiposIncubacion: EquipoIncubacion[] = [];
  listaBanos: BanoTermico[] = [];
  listaResponsables: Responsable[] = [];
  listaMediosCultivo: MedioCultivo[] = [];
  listaMaterialSiembra: MaterialSiembra[] = [];
  listaPipetas: Micropipeta[] = [];

  get fase1Group(): FormGroup { return this.form.get('fase1') as FormGroup; }
  get fase2aGroup(): FormGroup { return this.form.get('fase2a') as FormGroup; }
  get fase2bGroup(): FormGroup { return this.form.get('fase2b') as FormGroup; }
  get fase2cGroup(): FormGroup { return this.form.get('fase2c') as FormGroup; }
  get fase3aGroup(): FormGroup { return this.form.get('fase3a') as FormGroup; }
  get fase3bGroup(): FormGroup { return this.form.get('fase3b') as FormGroup; }
  get fase4aGroup(): FormGroup { return this.form.get('fase4a') as FormGroup; }

  get rol(): number {
    return this.authService.getUsuario()?.primaryRole ?? 0;
  }

  get modoLectura(): boolean {
    return ![0, 4].includes(this.rol);
  }

  ngOnInit(): void {
    this.construirFormulario();

    const idParam = this.route.parent?.snapshot.paramMap.get('id')
      || this.route.snapshot.paramMap.get('id');
    this.idSolicitudAnalisis = idParam ? Number(idParam) : 0;

    this.cargarFormulario();
  }

  cargarFormulario(): void {
    this.cargando.set(true);

    forkJoin({
      equipos: this.catalogos.getEquiposIncubacion().pipe(
        catchError(() => {
          console.warn('[Salmonella] Catálogo equipos de incubación no disponible');
          return of([] as EquipoIncubacion[]);
        })
      ),
      banos: this.catalogos.getBanosTermicos().pipe(
        catchError(() => {
          console.warn('[Salmonella] Catálogo baños térmicos no disponible');
          return of([] as BanoTermico[]);
        })
      ),
      responsables: this.catalogos.getResponsables('analista').pipe(
        catchError(() => {
          console.warn('[Salmonella] Catálogo responsables no disponible');
          return of([] as Responsable[]);
        })
      ),
      mediosCultivo: this.mediosCultivosService.getAll().pipe(
        catchError(() => {
          console.warn('[Salmonella] Catálogo medios de cultivo no disponible');
          return of([] as MedioCultivo[]);
        })
      ),
      materialSiembra: this.catalogos.getMaterialSiembra().pipe(
        catchError(() => {
          console.warn('[Salmonella] Catálogo material de siembra no disponible');
          return of([] as MaterialSiembra[]);
        })
      ),
      pipetas: this.catalogos.getMicroPipetas().pipe(
        catchError(() => {
          console.warn('[Salmonella] Catálogo micropipetas no disponible');
          return of([] as Micropipeta[]);
        })
      ),
      formulario: this.idSolicitudAnalisis > 0
        ? this.api.obtenerPorAnalisis(this.idSolicitudAnalisis).pipe(
            catchError(() => of(null))
          )
        : of(null),
    }).subscribe({
      next: (res) => {
        this.listaEquiposIncubacion = res.equipos;
        this.listaBanos = res.banos;
        this.listaResponsables = res.responsables;
        this.listaMediosCultivo = res.mediosCultivo;
        this.listaMaterialSiembra = res.materialSiembra;
        this.listaPipetas = res.pipetas;
        this.cargando.set(false);
        if (res.formulario?.existe && res.formulario.formulario) {
          this.formulario = res.formulario.formulario;
          this.muestras = res.formulario.formulario.muestras ?? [];
          this.hidratarFormulario(res.formulario.formulario);
        } else {
          this.inicializarMuestrasMock();
        }
      },
      error: () => {
        this.cargando.set(false);
        this.mostrarToast('Error al cargar el formulario', 'danger');
        this.inicializarMuestrasMock();
      },
    });
  }

  private construirFormulario(): void {
    this.form = this.fb.group({
      fase1: this.fb.group({
        fechaIncubacion: [''],
        horaIncubacion: [''],
        tipoMatriz: ['Normal'],
        pesoMuestra: ['25g'],
        idMedioCaldoHomogeneizacion: [null as number | null],
        horaInicioHidratacion: [''],
        horaTerminoHidratacion: ['']
      }),
      fase2a: this.fb.group({
        fechaSiembra: [''],
        horaInicioHomo: [''],
        horaTerminoHomo: [''],
        horaIngresoEstufa: [''],
        rutAnalistaResponsable: [''],
        fechaTerminoAnalisis: ['']
      }),
      fase2b: this.fb.group({
        idMedioCaldo: [null as number | null],
        volumenCaldo: ['225ml'],
        idEstufa: [null as number | null],
        idBano: [null as number | null]
      }),
      fase2c: this.fb.group({
        descripcionCtrlAnalisis: [''],
        resultadoCtrlAnalisis: [''],
        ctrlPositivoBlancoAli: [''],
        resultadoCtrlPositivo: [''],
        ctrlSiembraAli: [''],
        resultadoCtrlSiembra: [''],
        desfavorable: [''],
        tablaPagina: [''],
        limite: [''],
        fechaHoraEntrega: ['']
      }),
      fase3a: this.fb.group({
        fechaTraspaso: [''],
        horaLecturaCaldoApt: [''],
        rutAnalistaCaldoApt: [''],
        horaLecturaCaldosFinales: [''],
        rutAnalistaCaldosFinales: ['']
      }),
      fase3b: this.fb.group({
        idEstufaSelenito: [null as number | null],
        idBanoSelenito: [null as number | null],
        idEstufaRappaport: [null as number | null],
        idBanoRappaport: [null as number | null]
      }),
      fase4a: this.fb.group({
        fechaTraspasoAgares: [''],
        horaTraspasoAgares: [''],
        rutAnalistaTraspaso: [''],
        idMedioAgarXld: [null as number | null],
        idMedioAgarSs: [null as number | null],
        idEstufaAgares: [null as number | null],
        idBanoAgares: [null as number | null],
        fechaLectura24h: [''],
        horaLectura24h: [''],
        rutAnalistaLectura24h: [''],
        fechaLectura48h: [''],
        horaLectura48h: [''],
        rutAnalistaLectura48h: ['']
      })
    });

    this.fase1Group.get('tipoMatriz')?.valueChanges.subscribe((val: string) => {
      this.autoAsignarCaldo(val);
    });
  }

  /** Auto-asigna el medio de cultivo de homogeneización según el tipo de matriz
   *  (Chocolate -> Leche descremada; Normal/Polvo -> Caldo APT), buscando por
   *  nombre en la maestra `listaMediosCultivo`. El usuario puede sobreescribirlo. */
  private autoAsignarCaldo(tipoMatriz: string): void {
    if (!this.listaMediosCultivo.length) return;
    const nombreBuscado = tipoMatriz === 'Chocolate' ? 'leche' : 'caldo apt';
    const medio = this.listaMediosCultivo.find((m) => m.nombre?.toLowerCase().includes(nombreBuscado));
    if (medio) {
      this.fase1Group.get('idMedioCaldoHomogeneizacion')?.setValue(medio.idMedioCultivo);
    }
  }

  /** Fallback SOLO para desarrollo roto (sin idSolicitudAnalisis válido). En producción
   *  el backend autocrea el formulario con las muestras reales desde el primer
   *  GET /por-analisis/:id, por lo que este mock nunca debería ejecutarse. */
  private inicializarMuestrasMock(): void {
    const mock: SalMuestra[] = [{
      idSalMuestra: 1,
      idSalFormulario: 0,
      idSolicitudMuestra: 1,
      numeroMuestra: '1',
      esDuplicado: false,
      orden: 1
    }];
    this.muestras = mock;
    this.muestrasResEnriquecimiento = crearMuestrasResEnriquecimiento(mock);
    this.muestrasResAislamiento = crearMuestrasResAislamiento(mock);
    this.muestrasResultadoFinal = crearMuestrasResultadoFinal(mock);
  }

  private hidratarFormulario(f: SalFormularioCompleto): void {
    this.muestrasResEnriquecimiento = crearMuestrasResEnriquecimiento(f.muestras);
    this.muestrasResAislamiento = crearMuestrasResAislamiento(f.muestras);
    this.muestrasResultadoFinal = crearMuestrasResultadoFinal(f.muestras, f.fase5Resultado);

    if (f.fase1) {
      this.fase1Group.patchValue({
        fechaIncubacion: f.fase1.fechaHoraInicioIncubacion?.slice(0, 10) ?? '',
        horaIncubacion: f.fase1.fechaHoraInicioIncubacion?.slice(11, 16) ?? '',
        tipoMatriz: f.fase1.tipoMatriz,
        pesoMuestra: f.fase1.pesoMuestra,
        idMedioCaldoHomogeneizacion: f.fase1.idMedioCaldoHomogeneizacion ?? null,
        horaInicioHidratacion: f.fase1.horaInicioHidratacion?.slice(11, 16) ?? '',
        horaTerminoHidratacion: f.fase1.horaTerminoHidratacion?.slice(11, 16) ?? ''
      });
    }
    if (f.fase2a) {
      this.fase2aGroup.patchValue({
        fechaSiembra: f.fase2a.fechaSiembra?.slice(0, 10) ?? '',
        horaInicioHomo: f.fase2a.horaInicioHomo?.slice(11, 16) ?? '',
        horaTerminoHomo: f.fase2a.horaTerminoHomo?.slice(11, 16) ?? '',
        horaIngresoEstufa: f.fase2a.horaIngresoEstufa?.slice(11, 16) ?? '',
        rutAnalistaResponsable: f.fase2a.rutAnalistaResponsable,
        fechaTerminoAnalisis: f.fase2a.fechaTerminoAnalisis?.slice(0, 10) ?? ''
      });
    }
    if (f.fase2b) {
      this.fase2bGroup.patchValue({
        idMedioCaldo: f.fase2b.idMedioCaldo,
        volumenCaldo: f.fase2b.volumenCaldo ?? '225ml',
        idEstufa: f.fase2b.idEstufa,
        idBano: f.fase2b.idBano ?? null
      });
      this.tweenSeleccionados = (f.fase2b.tweenPipetas ?? []).map((t) => t.idMaterial);
      this.micropipetasEtapa2 = (f.fase2b.micropipetas ?? []).map((m) => m.idPipeta);
    }
    if (f.fase2c) {
      this.fase2cGroup.patchValue({
        descripcionCtrlAnalisis: f.fase2c.descripcionCtrlAnalisis ?? '',
        resultadoCtrlAnalisis: this.booleanoACumple(f.fase2c.resultadoCtrlAnalisis),
        ctrlPositivoBlancoAli: f.fase2c.ctrlPositivoBlancoAli ?? '',
        resultadoCtrlPositivo: this.booleanoACumple(f.fase2c.resultadoCtrlPositivo),
        ctrlSiembraAli: f.fase2c.ctrlSiembraAli ?? '',
        resultadoCtrlSiembra: this.booleanoACumple(f.fase2c.resultadoCtrlSiembra),
        desfavorable: f.fase2c.desfavorable === true ? 'si' : f.fase2c.desfavorable === false ? 'no' : '',
        tablaPagina: f.fase2c.tablaPagina ?? '',
        limite: f.fase2c.limite ?? '',
        fechaHoraEntrega: f.fase2c.fechaHoraEntrega ?? ''
      });
    }
    if (f.fase3a) {
      this.fase3aGroup.patchValue({
        fechaTraspaso: f.fase3a.fechaTraspaso?.slice(0, 10) ?? '',
        horaLecturaCaldoApt: f.fase3a.horaLecturaCaldoApt?.slice(11, 16) ?? '',
        rutAnalistaCaldoApt: f.fase3a.rutAnalistaCaldoApt,
        horaLecturaCaldosFinales: f.fase3a.horaLecturaCaldosFinales?.slice(11, 16) ?? '',
        rutAnalistaCaldosFinales: f.fase3a.rutAnalistaCaldosFinales ?? ''
      });
    }
    if (f.fase3b) {
      this.fase3bGroup.patchValue({
        idEstufaSelenito: f.fase3b.idEstufaSelenito ?? null,
        idBanoSelenito: f.fase3b.idBanoSelenito ?? null,
        idEstufaRappaport: f.fase3b.idEstufaRappaport ?? null,
        idBanoRappaport: f.fase3b.idBanoRappaport ?? null
      });
      this.puntasSeleccionadas = (f.fase3b.pipetas ?? [])
        .filter((p) => p.tipoMaterial === 'puntas')
        .map((p) => p.idMaterial);
      this.pipetasDesechablesSeleccionadas = (f.fase3b.pipetas ?? [])
        .filter((p) => p.tipoMaterial === 'pipeta_desechable')
        .map((p) => p.idMaterial);
      this.micropipetasEtapa4 = (f.fase3b.micropipetas ?? []).map((m) => m.idPipeta);
    }
    if (f.fase4a) {
      this.fase4aGroup.patchValue({
        fechaTraspasoAgares: f.fase4a.fechaHoraTraspasoAgares?.slice(0, 10) ?? '',
        horaTraspasoAgares: f.fase4a.fechaHoraTraspasoAgares?.slice(11, 16) ?? '',
        rutAnalistaTraspaso: f.fase4a.rutAnalistaTraspaso,
        idMedioAgarXld: f.fase4a.idMedioAgarXld,
        idMedioAgarSs: f.fase4a.idMedioAgarSs,
        idEstufaAgares: f.fase4a.idEstufaAgares,
        idBanoAgares: f.fase4a.idBanoAgares ?? null,
        fechaLectura24h: f.fase4a.fechaHoraLectura24h?.slice(0, 10) ?? '',
        horaLectura24h: f.fase4a.fechaHoraLectura24h?.slice(11, 16) ?? '',
        rutAnalistaLectura24h: f.fase4a.rutAnalistaLectura24h ?? '',
        fechaLectura48h: f.fase4a.fechaHoraLectura48h?.slice(0, 10) ?? '',
        horaLectura48h: f.fase4a.fechaHoraLectura48h?.slice(11, 16) ?? '',
        rutAnalistaLectura48h: f.fase4a.rutAnalistaLectura48h ?? ''
      });
    }

    const faseBackend = f.faseActual ?? 1;
    this.pasoActual.set(this.FASE_BACKEND_A_ETAPA[faseBackend] ?? 1);
  }

  get progresoPorcentaje(): number {
    return Math.round(((this.pasoActual() - 1) / (this.TOTAL_ETAPAS - 1)) * 100);
  }

  /** True cuando la última etapa ya tiene un resultado calculado por el backend. */
  get calculado(): boolean {
    return !!this.formulario?.fase5Resultado?.length;
  }

  avanzarEtapa(): void {
    if (this.pasoActual() < this.TOTAL_ETAPAS) {
      this.pasoActual.update((p) => p + 1);
    }
  }

  retrocederEtapa(): void {
    if (this.pasoActual() > 1) {
      this.pasoActual.update((p) => p - 1);
    }
  }

  irAEtapa(n: number): void {
    if (n >= 1 && n <= this.TOTAL_ETAPAS) {
      this.pasoActual.set(n);
    }
  }

  /** Guarda todo el formulario hasta la etapa actual (borrador) */
  async guardarFormularioBorrador(): Promise<void> {
    const ok = await this.guardarBorradorCompleto();
    if (ok) {
      this.mostrarToast('Borrador guardado correctamente', 'success');
    }
  }

  private async guardarBorradorCompleto(): Promise<boolean> {
    if (!this.formulario) {
      await this.mostrarAlerta('Error', 'No existe formulario asociado para guardar.');
      return false;
    }

    const etapaActual = this.pasoActual();
    let formularioActual: SalFormularioCompleto = this.formulario;
    this.cargando.set(true);

    try {
      for (let etapa = 1; etapa <= etapaActual; etapa++) {
        const subPasos = this.FASE_A_PASOS_BACKEND[etapa] ?? [];
        for (const paso of subPasos) {
          // La fase 4 (SalFase2c) se guarda parcial en la etapa 3 y se cierra
          // (completada: true) al llegar a la última etapa (Resultado Final).
          const completada = paso === 4 ? etapa === this.TOTAL_ETAPAS : false;
          const { payload, extra } = this.construirPayload(paso, completada);
          if (!payload) continue;
          formularioActual = await firstValueFrom(
            this.api.guardarFase(
              formularioActual.idSalFormulario,
              paso,
              payload as SalFasePayload,
              formularioActual.updatedAt,
              extra
            )
          );
          this.formulario = formularioActual;
        }
      }

      this.cargando.set(false);
      return true;
    } catch (err: unknown) {
      this.cargando.set(false);
      const httpErr = err as { status?: number };
      if (httpErr.status === 409) {
        this.mostrarToast(
          'El formulario fue modificado por otro usuario. Recargue y vuelva a intentar.',
          'warning'
        );
        this.cargarFormulario();
      } else {
        this.mostrarToast('Error al guardar el borrador completo', 'danger');
      }
      return false;
    }
  }

  /** Dispara el cálculo final de Presencia/Ausencia (fase backend 10). El backend
   *  recalcula desde las lecturas de Fase 4B ya guardadas e ignora cualquier dato
   *  que envíe el frontend. */
  async calcularResultadoFinal(): Promise<void> {
    if (!this.formulario) return;
    this.cargando.set(true);

    try {
      const actualizado = await firstValueFrom(
        this.api.guardarFase(
          this.formulario.idSalFormulario,
          10,
          { completada: true } as SalFase5Payload,
          this.formulario.updatedAt
        )
      );
      this.formulario = actualizado;
      this.muestrasResultadoFinal = crearMuestrasResultadoFinal(actualizado.muestras ?? this.muestras, actualizado.fase5Resultado);
      this.cargando.set(false);
      this.mostrarToast('Resultado final calculado correctamente', 'success');
    } catch (err: unknown) {
      this.cargando.set(false);
      const httpErr = err as { status?: number };
      if (httpErr.status === 409) {
        this.mostrarToast(
          'El formulario fue modificado por otro usuario. Recargue y vuelva a intentar.',
          'warning'
        );
        this.cargarFormulario();
      } else {
        this.mostrarToast('Error al calcular el resultado final', 'danger');
      }
    }
  }

  private construirPayload(
    paso: number,
    completada: boolean
  ): { payload: unknown; extra?: Record<string, unknown> } {
    switch (paso) {
      case 1: {
        const f1 = this.fase1Group.getRawValue();
        const esPolvo = f1.tipoMatriz === 'Polvo';
        const payload: SalFase1Payload = {
          fecha_hora_inicio_incubacion: this.toIso(f1.fechaIncubacion, f1.horaIncubacion) ?? '',
          tipo_matriz: f1.tipoMatriz,
          peso_muestra: f1.pesoMuestra,
          id_medio_caldo_homogeneizacion: Number(f1.idMedioCaldoHomogeneizacion),
          hora_inicio_hidratacion: esPolvo ? this.toIso(f1.fechaIncubacion, f1.horaInicioHidratacion) : undefined,
          hora_termino_hidratacion: esPolvo ? this.toIso(f1.fechaIncubacion, f1.horaTerminoHidratacion) : undefined,
          completada
        };
        return { payload };
      }
      case 2: {
        const f2a = this.fase2aGroup.getRawValue();
        const payload: SalFase2aPayload = {
          fecha_siembra: this.toIso(f2a.fechaSiembra) ?? '',
          hora_inicio_homo: this.toIso(f2a.fechaSiembra, f2a.horaInicioHomo) ?? '',
          hora_termino_homo: this.toIso(f2a.fechaSiembra, f2a.horaTerminoHomo) ?? '',
          hora_ingreso_estufa: this.toIso(f2a.fechaSiembra, f2a.horaIngresoEstufa) ?? '',
          rut_analista_responsable: f2a.rutAnalistaResponsable,
          fecha_termino_analisis: this.toIso(f2a.fechaTerminoAnalisis),
          completada
        };
        return { payload };
      }
      case 3: {
        const f2b = this.fase2bGroup.getRawValue();
        const payload: SalFase2bPayload = {
          id_medio_caldo: Number(f2b.idMedioCaldo),
          volumen_caldo: f2b.volumenCaldo || undefined,
          id_estufa: Number(f2b.idEstufa),
          id_bano: f2b.idBano ? Number(f2b.idBano) : undefined,
          completada
        };
        return {
          payload,
          extra: {
            tween_pipetas: this.tweenSeleccionados.map((id) => ({ id_material: id })),
            micropipetas: this.micropipetasEtapa2.map((id) => ({ id_pipeta: id }))
          }
        };
      }
      case 4: {
        const f2c = this.fase2cGroup.getRawValue();
        const payload: SalFase2cPayload = {
          descripcion_ctrl_analisis: f2c.descripcionCtrlAnalisis || undefined,
          resultado_ctrl_analisis: this.cumpleABooleano(f2c.resultadoCtrlAnalisis),
          ctrl_positivo_blanco_ali: f2c.ctrlPositivoBlancoAli || undefined,
          resultado_ctrl_positivo: this.cumpleABooleano(f2c.resultadoCtrlPositivo),
          ctrl_siembra_ali: f2c.ctrlSiembraAli || undefined,
          resultado_ctrl_siembra: this.cumpleABooleano(f2c.resultadoCtrlSiembra),
          desfavorable: f2c.desfavorable === 'si' ? true : f2c.desfavorable === 'no' ? false : undefined,
          tabla_pagina: f2c.tablaPagina || undefined,
          limite: f2c.limite || undefined,
          fecha_hora_entrega: this.toIsoLocal(f2c.fechaHoraEntrega),
          completada
        };
        return { payload };
      }
      case 5: {
        const f3a = this.fase3aGroup.getRawValue();
        const payload: SalFase3aPayload = {
          fecha_traspaso: this.toIso(f3a.fechaTraspaso) ?? '',
          hora_lectura_caldo_apt: this.toIso(f3a.fechaTraspaso, f3a.horaLecturaCaldoApt) ?? '',
          rut_analista_caldo_apt: f3a.rutAnalistaCaldoApt,
          hora_lectura_caldos_finales: this.toIso(f3a.fechaTraspaso, f3a.horaLecturaCaldosFinales),
          rut_analista_caldos_finales: f3a.rutAnalistaCaldosFinales || undefined,
          completada
        };
        return { payload };
      }
      case 6: {
        const f3b = this.fase3bGroup.getRawValue();
        const payload: SalFase3bPayload = {
          id_estufa_selenito: f3b.idEstufaSelenito ? Number(f3b.idEstufaSelenito) : undefined,
          id_bano_selenito: f3b.idBanoSelenito ? Number(f3b.idBanoSelenito) : undefined,
          id_estufa_rappaport: f3b.idEstufaRappaport ? Number(f3b.idEstufaRappaport) : undefined,
          id_bano_rappaport: f3b.idBanoRappaport ? Number(f3b.idBanoRappaport) : undefined,
          completada
        };
        return {
          payload,
          extra: {
            pipetas: [
              ...this.puntasSeleccionadas.map((id) => ({ id_material: id, tipo_material: 'puntas' })),
              ...this.pipetasDesechablesSeleccionadas.map((id) => ({ id_material: id, tipo_material: 'pipeta_desechable' }))
            ],
            micropipetas: this.micropipetasEtapa4.map((id) => ({ id_pipeta: id }))
          }
        };
      }
      case 7: {
        const payload: SalFase3cPayload = {
          lecturas: this.muestrasResEnriquecimiento.map((m) => ({
            id_sal_muestra: m.idSalMuestra,
            resultado_caldo_apt: m.caldoApt,
            resultado_selenito: m.selenito,
            resultado_rappaport: m.rappaport,
            ctrl_positivo_s_enteritidis: m.ctrlPositivoSEnteritidis,
            ctrl_negativo_k_pneumoniae: m.ctrlNegativoKPneumoniae,
            ctrl_blanco: m.ctrlBlanco
          })),
          completada
        };
        return { payload };
      }
      case 8: {
        const f4a = this.fase4aGroup.getRawValue();
        const payload: SalFase4aPayload = {
          fecha_hora_traspaso_agares: this.toIso(f4a.fechaTraspasoAgares, f4a.horaTraspasoAgares) ?? '',
          rut_analista_traspaso: f4a.rutAnalistaTraspaso,
          id_medio_agar_xld: Number(f4a.idMedioAgarXld),
          id_medio_agar_ss: Number(f4a.idMedioAgarSs),
          id_estufa_agares: Number(f4a.idEstufaAgares),
          id_bano_agares: f4a.idBanoAgares ? Number(f4a.idBanoAgares) : undefined,
          fecha_hora_lectura_24h: this.toIso(f4a.fechaLectura24h, f4a.horaLectura24h),
          rut_analista_lectura_24h: f4a.rutAnalistaLectura24h || undefined,
          fecha_hora_lectura_48h: this.toIso(f4a.fechaLectura48h, f4a.horaLectura48h),
          rut_analista_lectura_48h: f4a.rutAnalistaLectura48h || undefined,
          completada
        };
        return { payload };
      }
      case 9: {
        const idSalFase4a = this.formulario?.fase4a ? Number((this.formulario.fase4a as { idSalFase4a?: number }).idSalFase4a) : undefined;
        const payload: SalFase4bPayload = {
          lecturas: this.muestrasResAislamiento.map((m) => ({
            id_sal_muestra: m.idSalMuestra,
            id_sal_fase4a: idSalFase4a ?? 0,
            res_xld_24h_selenito: this.mapResultadoAgarToBackend(m.xld24hSel),
            res_ss_24h_selenito: this.mapResultadoAgarToBackend(m.ss24hSel),
            res_xld_48h_selenito: this.mapResultadoAgarToBackend(m.xld48hSel),
            res_ss_48h_selenito: this.mapResultadoAgarToBackend(m.ss48hSel),
            res_xld_24h_rappaport: this.mapResultadoAgarToBackend(m.xld24hRap),
            res_ss_24h_rappaport: this.mapResultadoAgarToBackend(m.ss24hRap),
            res_xld_48h_rappaport: this.mapResultadoAgarToBackend(m.xld48hRap),
            res_ss_48h_rappaport: this.mapResultadoAgarToBackend(m.ss48hRap),
            ctrl_positivo_s_enteritidis: m.ctrlPositivoSEnteritidis,
            ctrl_negativo_k_pneumoniae: m.ctrlNegativoKPneumoniae,
            ctrl_blanco: m.ctrlBlanco
          })),
          completada
        };
        return { payload };
      }
      default:
        return { payload: null };
    }
  }

  private cumpleABooleano(valor: Cumple): boolean | undefined {
    if (valor === 'cumple') return true;
    if (valor === 'no_cumple') return false;
    return undefined;
  }

  private booleanoACumple(valor: boolean | undefined): Cumple {
    if (valor === true) return 'cumple';
    if (valor === false) return 'no_cumple';
    return '';
  }

  private mapResultadoAgarToBackend(valor: string): string | undefined {
    if (valor === '+') return 'tipico';
    if (valor === '-') return 'atipico';
    return undefined;
  }

  /** Combina fecha (YYYY-MM-DD) + hora (HH:mm) en un ISO-8601 completo (con Z),
   *  formato exigido por el validador Zod del backend (`z.string().datetime()`)
   *  incluso para campos que en Prisma son solo Date o solo Time. */
  private toIso(fecha?: string, hora?: string): string | undefined {
    if (!fecha) return undefined;
    const horaResuelta = hora || '00:00';
    const fechaObj = new Date(`${fecha}T${horaResuelta}:00`);
    return Number.isNaN(fechaObj.getTime()) ? undefined : fechaObj.toISOString();
  }

  /** Convierte el valor de un input `datetime-local` (`YYYY-MM-DDTHH:mm`) a ISO-8601. */
  private toIsoLocal(valor?: string): string | undefined {
    if (!valor) return undefined;
    const fechaObj = new Date(valor);
    return Number.isNaN(fechaObj.getTime()) ? undefined : fechaObj.toISOString();
  }

  async enviarFormulario(): Promise<void> {
    if (!this.formulario) {
      await this.mostrarAlerta('Éxito', 'Registro de análisis de Salmonella enviado correctamente.');
      this.router.navigate(['/home']);
      return;
    }
    await this.guardarBorradorCompleto();
    this.router.navigate(['/home']);
  }

  async confirmarCancelar(): Promise<void> {
    const alert = await this.alertCtrl.create({
      header: 'Cancelar registro',
      message: '¿Deseas cancelar el registro? Los datos ingresados se perderán.',
      buttons: [
        { text: 'Quedarme', role: 'cancel' },
        {
          text: 'Sí, cancelar',
          role: 'destructive',
          handler: () => this.router.navigate(['/home'])
        }
      ]
    });
    await alert.present();
  }

  campoInvalido(campo: string): boolean {
    const ctrl = this.form.get(campo);
    return !!(ctrl && ctrl.invalid && (ctrl.dirty || ctrl.touched));
  }

  private async mostrarAlerta(header: string, message: string): Promise<void> {
    const alert = await this.alertCtrl.create({ header, message, buttons: ['Entendido'] });
    await alert.present();
  }

  private async mostrarToast(message: string, color: 'success' | 'warning' | 'danger'): Promise<void> {
    const toast = await this.toastCtrl.create({ message, duration: 3000, color, position: 'top' });
    await toast.present();
  }
}
