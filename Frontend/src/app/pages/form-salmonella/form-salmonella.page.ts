import { Component, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { AlertController, ToastController } from '@ionic/angular';
import { firstValueFrom, forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { SalmonellaApiService } from '../../services/salmonella-api.service';
import { CatalogosService } from '../../services/catalogos.service';
import { EquipoIncubacion, Responsable } from '../../interfaces/catalogo.interfaces';
import {
  SalFormularioCompleto,
  SalMuestra,
  SalFasePayload
} from '../../interfaces/salmonella.interfaces';

export type Cumple = 'cumple' | 'no_cumple' | '';

export interface MuestraEtapa3 {
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

export interface MuestraEtapa4 {
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

export interface MuestraEtapa5 {
  id: string;
  idSalMuestra: number;
  esDuplicado: boolean;
  label: string;
  resultadoFinal: string;
}

function crearMuestrasEtapa3(backend: SalMuestra[]): MuestraEtapa3[] {
  return backend.map((m) => ({
    id: m.numeroMuestra,
    idSalMuestra: m.idSalMuestra,
    esDuplicado: m.esDuplicado,
    label: m.esDuplicado ? 'Duplicado' : `Muestra ${m.numeroMuestra}`,
    caldoApt: false,
    selenito: false,
    rappaport: false,
    ctrlPositivoSEnteritidis: false,
    ctrlNegativoKPneumoniae: false,
    ctrlBlanco: false
  }));
}

function crearMuestrasEtapa4(backend: SalMuestra[]): MuestraEtapa4[] {
  return backend.map((m) => ({
    id: m.numeroMuestra,
    idSalMuestra: m.idSalMuestra,
    esDuplicado: m.esDuplicado,
    label: m.esDuplicado ? 'Duplicado' : `Muestra ${m.numeroMuestra}`,
    xld24hSel: '-',
    ss24hSel: '-',
    xld48hSel: '-',
    ss48hSel: '-',
    xld24hRap: '-',
    ss24hRap: '-',
    xld48hRap: '-',
    ss48hRap: '-',
    ctrlPositivoSEnteritidis: false,
    ctrlNegativoKPneumoniae: false,
    ctrlBlanco: false
  }));
}

function crearMuestrasEtapa5(
  backend: SalMuestra[],
  resultados?: Array<{ idSalMuestra: string; resultadoFinal: string }>
): MuestraEtapa5[] {
  const mapaResultados = new Map((resultados ?? []).map((r) => [String(r.idSalMuestra), r.resultadoFinal]));
  return backend.map((m) => ({
    id: m.numeroMuestra,
    idSalMuestra: m.idSalMuestra,
    esDuplicado: m.esDuplicado,
    label: m.esDuplicado ? 'Duplicado' : `Muestra ${m.numeroMuestra}`,
    resultadoFinal: mapaResultados.get(String(m.idSalMuestra)) ?? ''
  }));
}

@Component({
  selector: 'app-form-salmonella',
  templateUrl: './form-salmonella.page.html',
  styleUrls: ['./form-salmonella.page.scss'],
  standalone: false
})
export class FormSalmonellaPage implements OnInit {
  readonly TOTAL_PASOS = 5;
  pasoActual = signal<number>(1);

  readonly NOMBRES_ETAPAS = [
    'Inicio e Incubación',
    'Controles de Calidad',
    'Traspaso y Enriquecimiento Selectivo',
    'Aislamiento e Identificación',
    'Resultado Final'
  ];

  // Mapea fase frontend (1-5) a los pasos backend (1-10)
  private readonly FASE_A_PASOS_BACKEND: Record<number, number[]> = {
    1: [1, 2],
    2: [3, 4],
    3: [5, 6, 7],
    4: [8, 9],
    5: [10]
  };

  form!: FormGroup;
  formulario: SalFormularioCompleto | null = null;
  muestras: SalMuestra[] = [];
  cargando = signal<boolean>(false);
  idSolicitudAnalisis = 0;

  // ─── Colecciones de Muestras ───
  muestrasEtapa3: MuestraEtapa3[] = [];
  muestrasEtapa4: MuestraEtapa4[] = [];
  muestrasEtapa5: MuestraEtapa5[] = [];

  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly alertCtrl = inject(AlertController);
  private readonly toastCtrl = inject(ToastController);
  private readonly api = inject(SalmonellaApiService);
  private readonly catalogos = inject(CatalogosService);

  // ─── Catálogos dinámicos ───
  listaEstufas: EquipoIncubacion[] = [];
  listaResponsables: Responsable[] = [];

  get fase1Group(): FormGroup { return this.form.get('fase1') as FormGroup; }
  get fase2aGroup(): FormGroup { return this.form.get('fase2a') as FormGroup; }
  get fase2bGroup(): FormGroup { return this.form.get('fase2b') as FormGroup; }
  get fase2cGroup(): FormGroup { return this.form.get('fase2c') as FormGroup; }
  get fase3aGroup(): FormGroup { return this.form.get('fase3a') as FormGroup; }
  get fase3bGroup(): FormGroup { return this.form.get('fase3b') as FormGroup; }
  get fase4aGroup(): FormGroup { return this.form.get('fase4a') as FormGroup; }

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
      estufas: this.catalogos.getEquiposIncubacion().pipe(
        catchError(() => {
          console.warn('[Salmonella] Catálogo estufas no disponible');
          return of([] as EquipoIncubacion[]);
        })
      ),
      responsables: this.catalogos.getResponsables('analista').pipe(
        catchError(() => {
          console.warn('[Salmonella] Catálogo responsables no disponible');
          return of([] as Responsable[]);
        })
      ),
      formulario: this.idSolicitudAnalisis > 0
        ? this.api.obtenerPorAnalisis(this.idSolicitudAnalisis).pipe(
            catchError(() => of(null))
          )
        : of(null),
    }).subscribe({
      next: (res) => {
        this.listaEstufas = res.estufas;
        this.listaResponsables = res.responsables;
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
        caldoAPT: ['Caldo APT'],
        horaInicioHidratacion: [''],
        horaTerminoHidratacion: ['']
      }),
      fase2a: this.fb.group({
        fechaSiembra: [''],
        horaHomogeneizacion: [''],
        horaTerminoHomogeneizacion: [''],
        horaIngresoEstufa: [''],
        analistaResponsable: [''],
        fechaTerminoAnalisis: ['']
      }),
      fase2b: this.fb.group({
        loteCaldo: [''],
        tween80: [false],
        micropipetas: [false],
        estufaIncubacion: [null as number | null]
      }),
      fase2c: this.fb.group({
        analisisDescripcion: [''],
        resultadoAnalisis: [''],
        controlBlancoAli: [''],
        resultadoControlBlanco: [''],
        controlSiembraAli: [''],
        resultadoControlSiembra: [''],
        desfavorable: [''],
        tablaPagina: [''],
        limite: [''],
        fechaHoraEntrega: ['']
      }),
      fase3a: this.fb.group({
        fechaTraspaso: [''],
        horaLecturaAPT: [''],
        analistaLecturaAPT: [''],
        horaLecturaCaldos: [''],
        analistaLecturaCaldos: ['']
      }),
      fase3b: this.fb.group({
        selenitoEstufa: [null as number | null],
        puntas1ml: [false],
        micropipetasUtilizadas: [false],
        pipetasDesechables: [false],
        micropipetasExtra: [false]
      }),
      fase4a: this.fb.group({
        fechaTraspasoAgares: [''],
        horaTraspasoAgares: [''],
        analistaTraspasoAgares: [''],
        loteAgarXLD: [''],
        loteAgarSS: [''],
        estufaIncubacionAgares: [null as number | null],
        fechaLectura24h: [''],
        horaLectura24h: [''],
        analistaLectura24h: [''],
        fechaLectura48h: [''],
        horaLectura48h: [''],
        analistaLectura48h: ['']
      })
    });

    this.fase1Group.get('tipoMatriz')?.valueChanges.subscribe((val: string) => {
      if (val === 'Normal' || val === 'Polvo') {
        this.fase1Group.get('caldoAPT')?.setValue('Caldo APT');
      } else if (val === 'Chocolate') {
        this.fase1Group.get('caldoAPT')?.setValue('Leche descremada');
      }
    });
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
    this.muestrasEtapa3 = crearMuestrasEtapa3(mock);
    this.muestrasEtapa4 = crearMuestrasEtapa4(mock);
    this.muestrasEtapa5 = crearMuestrasEtapa5(mock);
  }

  private hidratarFormulario(f: SalFormularioCompleto): void {
    this.muestrasEtapa3 = crearMuestrasEtapa3(f.muestras);
    this.muestrasEtapa4 = crearMuestrasEtapa4(f.muestras);
    this.muestrasEtapa5 = crearMuestrasEtapa5(f.muestras, f.fase5Resultado);

    if (f.fase1) {
      this.fase1Group.patchValue({
        fechaIncubacion: f.fase1.fechaHoraInicioIncubacion.slice(0, 10),
        horaIncubacion: f.fase1.fechaHoraInicioIncubacion.slice(11, 16),
        tipoMatriz: f.fase1.tipoMatriz,
        pesoMuestra: f.fase1.pesoMuestra,
        caldoAPT: f.fase1.caldoHomogeneizacion,
        horaInicioHidratacion: f.fase1.horaInicioHidratacion ?? '',
        horaTerminoHidratacion: f.fase1.horaTerminoHidratacion ?? ''
      });
    }
    if (f.fase2a) {
      this.fase2aGroup.patchValue({
        fechaSiembra: f.fase2a.fechaSiembra,
        horaHomogeneizacion: f.fase2a.horaInicioHomo,
        horaTerminoHomogeneizacion: f.fase2a.horaTerminoHomo,
        horaIngresoEstufa: f.fase2a.horaIngresoEstufa,
        analistaResponsable: f.fase2a.rutAnalistaResponsable,
        fechaTerminoAnalisis: f.fase2a.fechaTerminoAnalisis ?? ''
      });
    }
    if (f.fase2b) {
      this.fase2bGroup.patchValue({
        loteCaldo: f.fase2b.codigoCaldoAptLeche,
        estufaIncubacion: f.fase2b.idEstufa
      });
    }
    if (f.fase2c) {
      this.fase2cGroup.patchValue({
        analisisDescripcion: f.fase2c.descripcionCtrlAnalisis ?? '',
        resultadoAnalisis: this.booleanoACumple(f.fase2c.resultadoCtrlAnalisis),
        controlBlancoAli: f.fase2c.ctrlPositivoBlancoAli ?? '',
        resultadoControlBlanco: this.booleanoACumple(f.fase2c.resultadoCtrlPositivo),
        controlSiembraAli: f.fase2c.ctrlSiembraAli ?? '',
        resultadoControlSiembra: this.booleanoACumple(f.fase2c.resultadoCtrlSiembra),
        desfavorable: f.fase2c.desfavorable === true ? 'si' : f.fase2c.desfavorable === false ? 'no' : '',
        tablaPagina: f.fase2c.tablaPagina ?? '',
        limite: f.fase2c.limite ?? '',
        fechaHoraEntrega: f.fase2c.fechaHoraEntrega ?? ''
      });
    }
    if (f.fase3a) {
      this.fase3aGroup.patchValue({
        fechaTraspaso: f.fase3a.fechaTraspaso,
        horaLecturaAPT: f.fase3a.horaLecturaCaldoApt,
        analistaLecturaAPT: f.fase3a.rutAnalistaCaldoApt,
        horaLecturaCaldos: f.fase3a.horaLecturaCaldosFinales ?? '',
        analistaLecturaCaldos: f.fase3a.rutAnalistaCaldosFinales ?? ''
      });
    }
    if (f.fase3b) {
      this.fase3bGroup.patchValue({
        selenitoEstufa: f.fase3b.idEstufaSelenito
      });
    }
    if (f.fase4a) {
      this.fase4aGroup.patchValue({
        fechaTraspasoAgares: f.fase4a.fechaHoraTraspasoAgares.slice(0, 10),
        horaTraspasoAgares: f.fase4a.fechaHoraTraspasoAgares.slice(11, 16),
        analistaTraspasoAgares: f.fase4a.rutAnalistaTraspaso,
        loteAgarXLD: f.fase4a.codigoAgarXld,
        loteAgarSS: f.fase4a.codigoAgarSs,
        estufaIncubacionAgares: f.fase4a.idEstufaAgares,
        fechaLectura24h: f.fase4a.fechaHoraLectura24h?.slice(0, 10) ?? '',
        horaLectura24h: f.fase4a.fechaHoraLectura24h?.slice(11, 16) ?? '',
        analistaLectura24h: f.fase4a.rutAnalistaLectura24h ?? '',
        fechaLectura48h: f.fase4a.fechaHoraLectura48h?.slice(0, 10) ?? '',
        horaLectura48h: f.fase4a.fechaHoraLectura48h?.slice(11, 16) ?? '',
        analistaLectura48h: f.fase4a.rutAnalistaLectura48h ?? ''
      });
    }

    const faseBackend = f.faseActual ?? 1;
    const faseFrontend = faseBackend <= 2 ? 1 : faseBackend <= 4 ? 2 : faseBackend <= 7 ? 3 : faseBackend <= 9 ? 4 : 5;
    this.pasoActual.set(faseFrontend);
  }

  get progresoPorcentaje(): number {
    return Math.round(((this.pasoActual() - 1) / (this.TOTAL_PASOS - 1)) * 100);
  }

  get etapaVisualActual(): number {
    return this.pasoActual();
  }

  get nombreEtapaVisualActual(): string {
    return this.NOMBRES_ETAPAS[this.pasoActual() - 1] ?? '';
  }

  /** True cuando la Etapa 5 ya tiene un resultado calculado por el backend. */
  get calculado(): boolean {
    return !!this.formulario?.fase5Resultado?.length;
  }

  avanzarPaso(): void {
    if (this.pasoActual() < this.TOTAL_PASOS) {
      this.pasoActual.update((p) => p + 1);
    }
  }

  retrocederPaso(): void {
    if (this.pasoActual() > 1) {
      this.pasoActual.update((p) => p - 1);
    }
  }

  irAPaso(n: number): void {
    if (n >= 1 && n <= this.TOTAL_PASOS) {
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

    const pasoActual = this.pasoActual();
    let formularioActual: SalFormularioCompleto = this.formulario;
    this.cargando.set(true);

    try {
      for (let fase = 1; fase <= pasoActual; fase++) {
        const subPasos = this.FASE_A_PASOS_BACKEND[fase] ?? [];
        for (const paso of subPasos) {
          const payload = this.construirPayload(paso, false);
          if (!payload) continue;
          formularioActual = await firstValueFrom(
            this.api.guardarFase(
              formularioActual.idSalFormulario,
              paso,
              payload as SalFasePayload,
              formularioActual.updatedAt
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
          { completada: true } as SalFasePayload,
          this.formulario.updatedAt
        )
      );
      this.formulario = actualizado;
      this.muestrasEtapa5 = crearMuestrasEtapa5(actualizado.muestras ?? this.muestras, actualizado.fase5Resultado);
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

  private construirPayload(paso: number, completada: boolean = true): unknown {
    switch (paso) {
      case 1: {
        const f1 = this.fase1Group.getRawValue();
        return {
          fechaHoraInicioIncubacion: `${f1.fechaIncubacion}T${f1.horaIncubacion}:00.000Z`,
          tipoMatriz: f1.tipoMatriz,
          pesoMuestra: f1.pesoMuestra,
          caldoHomogeneizacion: f1.caldoAPT,
          horaInicioHidratacion: f1.horaInicioHidratacion || undefined,
          horaTerminoHidratacion: f1.horaTerminoHidratacion || undefined,
          completada
        };
      }
      case 2: {
        const f2a = this.fase2aGroup.getRawValue();
        return {
          fechaSiembra: f2a.fechaSiembra,
          horaInicioHomo: f2a.horaHomogeneizacion,
          horaTerminoHomo: f2a.horaTerminoHomogeneizacion,
          horaIngresoEstufa: f2a.horaIngresoEstufa,
          rutAnalistaResponsable: f2a.analistaResponsable,
          fechaTerminoAnalisis: f2a.fechaTerminoAnalisis,
          completada
        };
      }
      case 3: {
        const f2b = this.fase2bGroup.getRawValue();
        return {
          codigoCaldoAptLeche: f2b.loteCaldo,
          idEstufa: Number(f2b.estufaIncubacion),
          completada
        };
      }
      case 4: {
        const f2c = this.fase2cGroup.getRawValue();
        return {
          descripcionCtrlAnalisis: f2c.analisisDescripcion || undefined,
          resultadoCtrlAnalisis: this.cumpleABooleano(f2c.resultadoAnalisis),
          ctrlPositivoBlancoAli: f2c.controlBlancoAli || undefined,
          resultadoCtrlPositivo: this.cumpleABooleano(f2c.resultadoControlBlanco),
          ctrlSiembraAli: f2c.controlSiembraAli || undefined,
          resultadoCtrlSiembra: this.cumpleABooleano(f2c.resultadoControlSiembra),
          desfavorable: f2c.desfavorable === 'si' ? true : f2c.desfavorable === 'no' ? false : undefined,
          tablaPagina: f2c.tablaPagina || undefined,
          limite: f2c.limite || undefined,
          fechaHoraEntrega: f2c.fechaHoraEntrega || undefined,
          completada
        };
      }
      case 5: {
        const f3a = this.fase3aGroup.getRawValue();
        return {
          fechaTraspaso: f3a.fechaTraspaso,
          horaLecturaCaldoApt: f3a.horaLecturaAPT,
          rutAnalistaCaldoApt: f3a.analistaLecturaAPT,
          horaLecturaCaldosFinales: f3a.horaLecturaCaldos || undefined,
          rutAnalistaCaldosFinales: f3a.analistaLecturaCaldos || undefined,
          completada
        };
      }
      case 6: {
        const f3b = this.fase3bGroup.getRawValue();
        return {
          idEstufaSelenito: Number(f3b.selenitoEstufa),
          completada
        };
      }
      case 7:
        return {
          lecturas: this.muestrasEtapa3.map((m) => ({
            idSalMuestra: m.idSalMuestra,
            resultadoCaldoApt: m.caldoApt,
            resultadoseLenito: m.selenito,
            resultadoRappaport: m.rappaport,
            ctrlPositivoSEnteritidis: m.ctrlPositivoSEnteritidis,
            ctrlNegativoKPneumoniae: m.ctrlNegativoKPneumoniae,
            ctrlBlanco: m.ctrlBlanco
          })),
          completada
        };
      case 8: {
        const f4a = this.fase4aGroup.getRawValue();
        return {
          fechaHoraTraspasoAgares: `${f4a.fechaTraspasoAgares}T${f4a.horaTraspasoAgares}:00.000Z`,
          rutAnalistaTraspaso: f4a.analistaTraspasoAgares,
          codigoAgarXld: f4a.loteAgarXLD,
          codigoAgarSs: f4a.loteAgarSS,
          idEstufaAgares: Number(f4a.estufaIncubacionAgares),
          fechaHoraLectura24h: f4a.fechaLectura24h && f4a.horaLectura24h
            ? `${f4a.fechaLectura24h}T${f4a.horaLectura24h}:00.000Z`
            : undefined,
          rutAnalistaLectura24h: f4a.analistaLectura24h || undefined,
          fechaHoraLectura48h: f4a.fechaLectura48h && f4a.horaLectura48h
            ? `${f4a.fechaLectura48h}T${f4a.horaLectura48h}:00.000Z`
            : undefined,
          rutAnalistaLectura48h: f4a.analistaLectura48h || undefined,
          completada
        };
      }
      case 9:
        return {
          lecturas: this.muestrasEtapa4.map((m) => ({
            idSalMuestra: m.idSalMuestra,
            // TODO: idSalFase4a no se puede completar hasta que el backend exponga el id en la respuesta de fase4a (bug preexistente, no introducido por este fix)
            resXld24hSelenito: this.mapResultadoAgarToBackend(m.xld24hSel),
            resSs24hSelenito: this.mapResultadoAgarToBackend(m.ss24hSel),
            resXld48hSelenito: this.mapResultadoAgarToBackend(m.xld48hSel),
            resSs48hSelenito: this.mapResultadoAgarToBackend(m.ss48hSel),
            resXld24hRappaport: this.mapResultadoAgarToBackend(m.xld24hRap),
            resSs24hRappaport: this.mapResultadoAgarToBackend(m.ss24hRap),
            resXld48hRappaport: this.mapResultadoAgarToBackend(m.xld48hRap),
            resSs48hRappaport: this.mapResultadoAgarToBackend(m.ss48hRap),
            ctrlPositivoSEnteritidis: m.ctrlPositivoSEnteritidis,
            ctrlNegativoKPneumoniae: m.ctrlNegativoKPneumoniae,
            ctrlBlanco: m.ctrlBlanco
          })),
          completada
        };
      case 10:
        return {
          completada
        };
      default:
        return null;
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
