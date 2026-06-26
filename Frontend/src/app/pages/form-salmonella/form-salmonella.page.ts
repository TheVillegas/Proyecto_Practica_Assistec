import { Component, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { AlertController, ToastController } from '@ionic/angular';
import { firstValueFrom, forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { SalmonellaApiService } from '../../services/salmonella-api.service';
import { CatalogosService } from '../../services/catalogos.service';
import { EquipoIncubacion, LoteReactivo } from '../../interfaces/catalogo.interfaces';
import {
  SalFormularioCompleto,
  SalMuestra,
  SalFasePayload
} from '../../interfaces/salmonella.interfaces';

type Cumple = 'cumple' | 'no_cumple' | 'sin_registrar';

interface MuestraEtapa3 {
  id: string;
  idSalMuestra: number;
  esDuplicado: boolean;
  label: string;
  caldoApt: boolean;
  selenito: boolean;
  rappaport: boolean;
}

interface MuestraEtapa4 {
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
}

interface MuestraEtapa5 {
  id: string;
  idSalMuestra: number;
  esDuplicado: boolean;
  label: string;
  resultadoFinal: string;
}

const N_MUESTRAS = 6;

function crearMuestrasEtapa3(backend: SalMuestra[]): MuestraEtapa3[] {
  return backend.map((m) => ({
    id: m.numeroMuestra,
    idSalMuestra: m.idSalMuestra,
    esDuplicado: m.esDuplicado,
    label: m.esDuplicado ? 'Duplicado' : `Muestra ${m.numeroMuestra}`,
    caldoApt: false,
    selenito: false,
    rappaport: false
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
    ss48hRap: '-'
  }));
}

function crearMuestrasEtapa5(backend: SalMuestra[]): MuestraEtapa5[] {
  return backend.map((m) => ({
    id: m.numeroMuestra,
    idSalMuestra: m.idSalMuestra,
    esDuplicado: m.esDuplicado,
    label: m.esDuplicado ? 'Duplicado' : `Muestra ${m.numeroMuestra}`,
    resultadoFinal: ''
  }));
}

@Component({
  selector: 'app-form-salmonella',
  templateUrl: './form-salmonella.page.html',
  styleUrls: ['./form-salmonella.page.scss'],
  standalone: false
})
export class FormSalmonellaPage implements OnInit {
  readonly TOTAL_PASOS = 4;
  pasoActual = signal<number>(1);

  readonly NOMBRES_ETAPAS = [
    'Inicio e Incubación',
    'Traspaso y Enriquecimiento',
    'Aislamiento e Identificación',
    'Resultado Final'
  ];

  readonly PASOS_POR_ETAPA = [1, 1, 1, 1];
  readonly ETIQUETAS_PASOS = [
    'Inicio e Incubación',
    'Traspaso y Enriquecimiento',
    'Aislamiento e Identificación',
    'Resultado Final'
  ];

  // Maps frontend fase (1-4) to backend paso numbers (1-10)
  private readonly FASE_A_PASOS_BACKEND: Record<number, number[]> = {
    1: [1, 2, 3, 4],
    2: [5, 6, 7],
    3: [8, 9],
    4: [10],
  };

  form!: FormGroup;
  formulario: SalFormularioCompleto | null = null;
  muestras: SalMuestra[] = [];
  cargando = signal<boolean>(false);
  idSolicitudAnalisis = 0;

  // ─── Variables Globales para Radios Personalizados ───
  e2_resultadoAnalisis: Cumple = 'sin_registrar';
  e2_resultadoControlBlanco: Cumple = 'sin_registrar';
  e2_resultadoControlSiembra: Cumple = 'sin_registrar';

  e3_controlPositivo: Cumple = 'sin_registrar';
  e3_controlNegativo: Cumple = 'sin_registrar';
  e3_blanco: Cumple = 'sin_registrar';

  e4_controlPositivo: Cumple = 'sin_registrar';
  e4_controlNegativo: Cumple = 'sin_registrar';
  e4_blanco: Cumple = 'sin_registrar';

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
  listaLotesReactivo: LoteReactivo[] = [];

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
      lotes: this.catalogos.getLotesReactivo('todos').pipe(
        catchError(() => {
          console.warn('[Salmonella] Catálogo lotes no disponible');
          return of([] as LoteReactivo[]);
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
        this.listaLotesReactivo = res.lotes;
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
      e1_fechaIncubacion: [''],
      e1_horaIncubacion: [''],
      e1_tipoMatriz: ['Normal'],
      e1_pesoMuestra: ['25g'],
      e1_caldoAPT: ['Caldo APT'],
      e1_horaInicioHidratacion: [''],
      e1_horaTerminoHidratacion: [''],
      e1_fechaSiembra: [''],
      e1_horaHomogeneizacion: [''],
      e1_horaTerminoHomogeneizacion: [''],
      e1_horaIngresoEstufa: [''],
      e1_analistaResponsable: [''],
      e1_fechaTerminoAnalisis: [''],

      e2_loteCaldo: [''],
      e2_tween80: [false],
      e2_micropipetas: [false],
      e2_estufaIncubacion: [null as number | null],
      e2_analisisDescripcion: [''],
      e2_controlBlancoAli: [''],
      e2_controlSiembraAli: [''],

      e3_fechaTraspaso: [''],
      e3_horaLecturaAPT: [''],
      e3_analistaLecturaAPT: [''],
      e3_horaLecturaCaldos: [''],
      e3_analistaLecturaCaldos: [''],
      e3_selenitoEstufa: [null as number | null],
      e3_puntas1ml: [false],
      e3_micropipetasUtilizadas: [false],
      e3_pipetasDesechables: [false],
      e3_micropipetasExtra: [false],

      e4_fechaTraspasoAgares: [''],
      e4_horaTraspasoAgares: [''],
      e4_analistaTraspasoAgares: [''],
      e4_loteAgarXLD: [''],
      e4_loteAgarSS: [''],
      e4_estufaIncubacionAgares: [null as number | null],
      e4_fechaLectura24h: [''],
      e4_horaLectura24h: [''],
      e4_analistaLectura24h: [''],
      e4_fechaLectura48h: [''],
      e4_horaLectura48h: [''],
      e4_analistaLectura48h: ['']
    });

    this.form.get('e1_tipoMatriz')?.valueChanges.subscribe((val: string) => {
      if (val === 'Normal' || val === 'Polvo') {
        this.form.get('e1_caldoAPT')?.setValue('Caldo APT');
      } else if (val === 'Chocolate') {
        this.form.get('e1_caldoAPT')?.setValue('Leche descremada');
      }
    });
  }

  private inicializarMuestrasMock(): void {
    const mock: SalMuestra[] = [];
    for (let i = 1; i <= N_MUESTRAS; i++) {
      mock.push({
        idSalMuestra: i,
        idSalFormulario: 0,
        idSolicitudMuestra: i,
        numeroMuestra: `M${i}`,
        esDuplicado: false,
        orden: i
      });
    }
    mock.push({
      idSalMuestra: 99,
      idSalFormulario: 0,
      idSolicitudMuestra: 99,
      numeroMuestra: 'DUP',
      esDuplicado: true,
      orden: 99
    });
    this.muestras = mock;
    this.muestrasEtapa3 = crearMuestrasEtapa3(mock);
    this.muestrasEtapa4 = crearMuestrasEtapa4(mock);
    this.muestrasEtapa5 = crearMuestrasEtapa5(mock);
  }

  private hidratarFormulario(f: SalFormularioCompleto): void {
    this.muestrasEtapa3 = crearMuestrasEtapa3(f.muestras);
    this.muestrasEtapa4 = crearMuestrasEtapa4(f.muestras);
    this.muestrasEtapa5 = crearMuestrasEtapa5(f.muestras);

    if (f.fase1) {
      this.form.patchValue({
        e1_fechaIncubacion: f.fase1.fechaHoraInicioIncubacion.slice(0, 10),
        e1_horaIncubacion: f.fase1.fechaHoraInicioIncubacion.slice(11, 16),
        e1_tipoMatriz: f.fase1.tipoMatriz,
        e1_pesoMuestra: f.fase1.pesoMuestra,
        e1_caldoAPT: f.fase1.caldoHomogeneizacion,
        e1_horaInicioHidratacion: f.fase1.horaInicioHidratacion ?? '',
        e1_horaTerminoHidratacion: f.fase1.horaTerminoHidratacion ?? ''
      });
    }
    if (f.fase2a) {
      this.form.patchValue({
        e1_fechaSiembra: f.fase2a.fechaSiembra,
        e1_horaHomogeneizacion: f.fase2a.horaInicioHomo,
        e1_horaTerminoHomogeneizacion: f.fase2a.horaTerminoHomo,
        e1_horaIngresoEstufa: f.fase2a.horaIngresoEstufa,
        e1_analistaResponsable: f.fase2a.rutAnalistaResponsable,
        e1_fechaTerminoAnalisis: f.fase2a.fechaTerminoAnalisis ?? ''
      });
    }
    if (f.fase2b) {
      this.form.patchValue({
        e2_loteCaldo: f.fase2b.codigoCaldoAptLeche,
        e2_estufaIncubacion: f.fase2b.idEstufa
      });
    }
    if (f.fase2c) {
      this.form.patchValue({
        e2_analisisDescripcion: f.fase2c.descripcionCtrlAnalisis ?? '',
        e2_controlBlancoAli: f.fase2c.ctrlPositivoBlancoAli ?? '',
        e2_controlSiembraAli: f.fase2c.ctrlSiembraAli ?? ''
      });
    }
    if (f.fase3a) {
      this.form.patchValue({
        e3_fechaTraspaso: f.fase3a.fechaTraspaso,
        e3_horaLecturaAPT: f.fase3a.horaLecturaCaldoApt,
        e3_analistaLecturaAPT: f.fase3a.rutAnalistaCaldoApt,
        e3_horaLecturaCaldos: f.fase3a.horaLecturaCaldosFinales ?? '',
        e3_analistaLecturaCaldos: f.fase3a.rutAnalistaCaldosFinales ?? ''
      });
    }
    if (f.fase3b) {
      this.form.patchValue({
        e3_selenitoEstufa: f.fase3b.idEstufaSelenito
      });
    }
    if (f.fase4a) {
      this.form.patchValue({
        e4_fechaTraspasoAgares: f.fase4a.fechaHoraTraspasoAgares.slice(0, 10),
        e4_horaTraspasoAgares: f.fase4a.fechaHoraTraspasoAgares.slice(11, 16),
        e4_analistaTraspasoAgares: f.fase4a.rutAnalistaTraspaso,
        e4_loteAgarXLD: f.fase4a.codigoAgarXld,
        e4_loteAgarSS: f.fase4a.codigoAgarSs,
        e4_estufaIncubacionAgares: f.fase4a.idEstufaAgares,
        e4_fechaLectura24h: f.fase4a.fechaHoraLectura24h?.slice(0, 10) ?? '',
        e4_horaLectura24h: f.fase4a.fechaHoraLectura24h?.slice(11, 16) ?? '',
        e4_analistaLectura24h: f.fase4a.rutAnalistaLectura24h ?? '',
        e4_fechaLectura48h: f.fase4a.fechaHoraLectura48h?.slice(0, 10) ?? '',
        e4_horaLectura48h: f.fase4a.fechaHoraLectura48h?.slice(11, 16) ?? '',
        e4_analistaLectura48h: f.fase4a.rutAnalistaLectura48h ?? ''
      });
    }

    const faseBackend = f.faseActual ?? 1;
    const faseFrontend = faseBackend <= 4 ? 1 : faseBackend <= 7 ? 2 : faseBackend <= 9 ? 3 : 4;
    this.pasoActual.set(faseFrontend);
  }

  get progresoPorcentaje(): number {
    return Math.round(((this.pasoActual() - 1) / (this.TOTAL_PASOS - 1)) * 100);
  }

  get etapaVisualActual(): number {
    return this.pasoActual();
  }

  get nombreEtapaVisualActual(): string {
    return this.ETIQUETAS_PASOS[this.pasoActual() - 1] ?? '';
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

  private construirPayload(paso: number, completada: boolean = true): unknown {
    const v = this.form.value;
    switch (paso) {
      case 1:
        return {
          fechaHoraInicioIncubacion: `${v.e1_fechaIncubacion}T${v.e1_horaIncubacion}:00.000Z`,
          tipoMatriz: v.e1_tipoMatriz,
          pesoMuestra: v.e1_pesoMuestra,
          caldoHomogeneizacion: v.e1_caldoAPT,
          horaInicioHidratacion: v.e1_horaInicioHidratacion || undefined,
          horaTerminoHidratacion: v.e1_horaTerminoHidratacion || undefined,
          completada
        };
      case 2:
        return {
          fechaSiembra: v.e1_fechaSiembra,
          horaInicioHomo: v.e1_horaHomogeneizacion,
          horaTerminoHomo: v.e1_horaTerminoHomogeneizacion,
          horaIngresoEstufa: v.e1_horaIngresoEstufa,
          rutAnalistaResponsable: v.e1_analistaResponsable,
          fechaTerminoAnalisis: v.e1_fechaTerminoAnalisis,
          completada
        };
      case 3:
        return {
          codigoCaldoAptLeche: v.e2_loteCaldo,
          idEstufa: Number(v.e2_estufaIncubacion),
          completada
        };
      case 4:
        return {
          descripcionCtrlAnalisis: v.e2_analisisDescripcion || undefined,
          resultadoCtrlAnalisis: this.cumpleABooleano(this.e2_resultadoAnalisis),
          ctrlPositivoBlancoAli: v.e2_controlBlancoAli || undefined,
          resultadoCtrlPositivo: this.cumpleABooleano(this.e2_resultadoControlBlanco),
          ctrlSiembraAli: v.e2_controlSiembraAli || undefined,
          resultadoCtrlSiembra: this.cumpleABooleano(this.e2_resultadoControlSiembra),
          completada
        };
      case 5:
        return {
          fechaTraspaso: v.e3_fechaTraspaso,
          horaLecturaCaldoApt: v.e3_horaLecturaAPT,
          rutAnalistaCaldoApt: v.e3_analistaLecturaAPT,
          horaLecturaCaldosFinales: v.e3_horaLecturaCaldos || undefined,
          rutAnalistaCaldosFinales: v.e3_analistaLecturaCaldos || undefined,
          completada
        };
      case 6:
        return {
          idEstufaSelenito: Number(v.e3_selenitoEstufa),
          completada
        };
      case 7:
        return {
          lecturas: this.muestrasEtapa3.map((m) => ({
            idSalMuestra: m.idSalMuestra,
            resultadoCaldoApt: m.caldoApt,
            resultadoseLenito: m.selenito,
            resultadoRappaport: m.rappaport
          })),
          completada
        };
      case 8:
        return {
          fechaHoraTraspasoAgares: `${v.e4_fechaTraspasoAgares}T${v.e4_horaTraspasoAgares}:00.000Z`,
          rutAnalistaTraspaso: v.e4_analistaTraspasoAgares,
          codigoAgarXld: v.e4_loteAgarXLD,
          codigoAgarSs: v.e4_loteAgarSS,
          idEstufaAgares: Number(v.e4_estufaIncubacionAgares),
          fechaHoraLectura24h: v.e4_fechaLectura24h && v.e4_horaLectura24h
            ? `${v.e4_fechaLectura24h}T${v.e4_horaLectura24h}:00.000Z`
            : undefined,
          rutAnalistaLectura24h: v.e4_analistaLectura24h || undefined,
          fechaHoraLectura48h: v.e4_fechaLectura48h && v.e4_horaLectura48h
            ? `${v.e4_fechaLectura48h}T${v.e4_horaLectura48h}:00.000Z`
            : undefined,
          rutAnalistaLectura48h: v.e4_analistaLectura48h || undefined,
          completada
        };
      case 9:
        return {
          lecturas: this.muestrasEtapa4.map((m) => ({
            idSalMuestra: m.idSalMuestra,
            resXld24hSelenito: this.mapResultadoAgarToBackend(m.xld24hSel),
            resSs24hSelenito: this.mapResultadoAgarToBackend(m.ss24hSel),
            resXld48hSelenito: this.mapResultadoAgarToBackend(m.xld48hSel),
            resSs48hSelenito: this.mapResultadoAgarToBackend(m.ss48hSel),
            resXld24hRappaport: this.mapResultadoAgarToBackend(m.xld24hRap),
            resSs24hRappaport: this.mapResultadoAgarToBackend(m.ss24hRap),
            resXld48hRappaport: this.mapResultadoAgarToBackend(m.xld48hRap),
            resSs48hRappaport: this.mapResultadoAgarToBackend(m.ss48hRap)
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
