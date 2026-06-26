import { Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, FormGroup, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { AlertController, ToastController } from '@ionic/angular';
import { firstValueFrom, forkJoin } from 'rxjs';
import { EnterobacteriasApiService } from '../../services/enterobacterias-api.service';
import { AuthService } from '../../services/auth-service';
import { CatalogosService } from '../../services/catalogos.service';
import { EntEtapaPayload, EntFormularioCompleto, EntMuestraLectura } from '../../interfaces/enterobacterias.interfaces';
import { crearMuestraVacia } from './components/ent-analisis-lectura.component';
import {
  EquipoIncubacion,
  Micropipeta,
  Responsable,
  LoteReactivo
} from '../../interfaces/catalogo.interfaces';

function reactivoOxidasaValidator(control: AbstractControl): ValidationErrors | null {
  if (!control.value) return null;
  const patron = /^R69-(\d{2})-(0[12])$/;
  if (!patron.test(control.value)) {
    return {
      reactivoInvalido: 'El formato del Reactivo de Oxidasa debe ser R69-AA-NN donde AA es el año en 2 dígitos y NN es 01 o 02. Ejemplo: R69-25-01.'
    };
  }
  return null;
}

@Component({
  selector: 'app-form-enterobacterias',
  templateUrl: './form-enterobacterias.page.html',
  styleUrls: ['./form-enterobacterias.page.scss'],
  standalone: false,
})
export class FormEnterobacteriasPage implements OnInit {
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private alertCtrl = inject(AlertController);
  private toastCtrl = inject(ToastController);
  private apiService = inject(EnterobacteriasApiService);
  private authService = inject(AuthService);
  private catalogosService = inject(CatalogosService);

  readonly TOTAL_ETAPAS = 4;
  readonly NOMBRES_ETAPAS = [
    'Pesado y Siembra',
    'Incubación',
    'Lectura 24h',
    'Traspaso',
  ];

  idFormulario = 0;
  etapaActual = signal<number>(1);
  form!: FormGroup;
  formularioCompletado = false;
  updatedAt = '';
  cargando = signal(true);

  muestrasLectura: EntMuestraLectura[] = [
    crearMuestraVacia('M1'),
    crearMuestraVacia('Duplicado'),
  ];

  get pesadoGroup(): FormGroup { return this.form.get('pesado') as FormGroup; }
  get homogeneizacionGroup(): FormGroup { return this.form.get('homogeneizacion') as FormGroup; }
  get sembradoGroup(): FormGroup { return this.form.get('sembrado') as FormGroup; }
  get incubacionPrepGroup(): FormGroup { return this.form.get('incubacionPrep') as FormGroup; }
  get analisisLecturaGroup(): FormGroup { return this.form.get('analisisLectura') as FormGroup; }
  get incubacionConfGroup(): FormGroup { return this.form.get('incubacionConf') as FormGroup; }

  catalogos = {
    equiposIncubacion: signal<EquipoIncubacion[]>([]),
    responsables: signal<Responsable[]>([]),
    micropipetas: signal<Micropipeta[]>([]),
    lotesAgarVRBG: signal<LoteReactivo[]>([]),
    lotesTween80: signal<LoteReactivo[]>([]),
  };

  ngOnInit(): void {
    const idParam = this.route.parent?.snapshot.paramMap.get('id')
      || this.route.snapshot.paramMap.get('id');
    this.idFormulario = idParam ? Number(idParam) : 0;
    this.inicializarFormulario();

    if (this.idFormulario <= 0) {
      this.cargando.set(false);
      return;
    }

    forkJoin({
      formularioResp: this.apiService.obtenerPorAnalisis(this.idFormulario),
      equiposIncubacion: this.catalogosService.getEquiposIncubacion(),
      responsables: this.catalogosService.getResponsables('analista'),
      micropipetas: this.catalogosService.getMicroPipetas(),
      lotesAgarVRBG: this.catalogosService.getLotesReactivo('agar_vrbg'),
      lotesTween80: this.catalogosService.getLotesReactivo('tween_80'),
    }).subscribe({
      next: (res) => {
        this.catalogos.equiposIncubacion.set(res.equiposIncubacion);
        this.catalogos.responsables.set(res.responsables);
        this.catalogos.micropipetas.set(res.micropipetas);
        this.catalogos.lotesAgarVRBG.set(res.lotesAgarVRBG);
        this.catalogos.lotesTween80.set(res.lotesTween80);
        if (res.formularioResp.existe && res.formularioResp.formulario) {
          this.idFormulario = Number(res.formularioResp.formulario.idEntFormulario) || this.idFormulario;
          this.cargarFormulario(res.formularioResp.formulario);
        }
        this.cargando.set(false);
      },
      error: () => {
        this.cargando.set(false);
        this.mostrarToast('Error al cargar datos del formulario.', 'danger');
      },
    });
  }

  private inicializarFormulario(): void {
    this.form = this.fb.group({
      pesado: this.fb.group({
        tipoMuestra: [''],
        nMuestra10g90ml: [null, [Validators.min(0)]],
        nMuestra50g450ml: [null, [Validators.min(0)]],
        fechaInicio: [''],
        horaInicio: [''],
        analistaInicio: [''],
      }),
      homogeneizacion: this.fb.group({
        fechaHomog: [''],
        horaHomog: [''],
        analistaHomog: [''],
      }),
      sembrado: this.fb.group({
        agarVRBGSembrado: [''],
        estufaSembrado: [null],
        placasSembrado: [null],
        micropipeta1mlSembrado: [null],
        fechaSembrado: [''],
        horaSembrado: [''],
        analistaSembrado: [''],
      }),
      incubacionPrep: this.fb.group({
        agarVRBGIncub: [''],
        estufaIncub: [null],
        fechaTermino: [''],
        horaTermino: [''],
        analistaIncub: [''],
      }),
      analisisLectura: this.fb.group({
        fechaLectura24h: [''],
        horaLectura24h: [''],
        analistaLectura24h: [''],
        equipoCuentaColonias: [''],
        controlPosEcoli: [''],
        controlNegPaer: [''],
        blanco: [''],
        observaciones: [''],
      }),
      incubacionConf: this.fb.group({
        fechaTraspaso: [''],
        horaTraspaso: [''],
        analistaTraspaso: [''],
        agarNutritivo: [''],
        estufaConfIncub: [null],
      }),
    });
  }

  private cargarFormulario(formulario: EntFormularioCompleto): void {
    this.updatedAt = formulario.updatedAt ?? '';
    this.etapaActual.set(this.uiEtapaFromFormulario(formulario));

    const e1 = formulario.etapa1;
    if (e1) {
      this.form.get('pesado')?.patchValue({
        tipoMuestra: e1.tipoMuestra,
        nMuestra10g90ml: e1.nMuestra10g90ml,
        nMuestra50g450ml: e1.nMuestra50g450ml,
        fechaInicio: e1.fechaInicio,
        horaInicio: e1.horaInicio,
        analistaInicio: e1.rutAnalistaInicio,
      });
      this.form.get('homogeneizacion')?.patchValue({
        fechaHomog: e1.fechaHomog,
        horaHomog: e1.horaHomog,
        analistaHomog: e1.rutAnalistaHomog,
      });
      this.form.get('sembrado')?.patchValue({
        agarVRBGSembrado: e1.idLoteAgarVrbgSembrado ? String(e1.idLoteAgarVrbgSembrado) : '',
        estufaSembrado: e1.idEstufaSembrado,
        placasSembrado: e1.placasSembrado,
        micropipeta1mlSembrado: e1.idMicropipeta,
        fechaSembrado: e1.fechaSembrado,
        horaSembrado: e1.horaSembrado,
        analistaSembrado: e1.rutAnalistaSembrado,
      });
      this.form.get('incubacionPrep')?.patchValue({
        estufaIncub: e1.idEstufaIncub,
        fechaTermino: e1.fechaFinIncubacion ? e1.fechaFinIncubacion.split('T')[0] : '',
        horaTermino: e1.fechaFinIncubacion ? e1.fechaFinIncubacion.split('T')[1]?.substring(0, 5) : '',
        analistaIncub: e1.rutAnalistaIncub,
      });
    }

    const e2 = formulario.etapa2;
    if (e2) {
      this.form.get('analisisLectura')?.patchValue({
        fechaLectura24h: e2.fechaLectura24h ? e2.fechaLectura24h.split('T')[0] : '',
        horaLectura24h: e2.horaLectura24h,
        analistaLectura24h: e2.rutAnalistaLectura,
        equipoCuentaColonias: e2.idEquipoCuentaColonias ? String(e2.idEquipoCuentaColonias) : '',
      });
      if ((e2 as unknown as { muestras?: EntMuestraLectura[] }).muestras?.length) {
        this.muestrasLectura = (e2 as unknown as { muestras: EntMuestraLectura[] }).muestras;
      }
    }

    const e3 = formulario.etapa3;
    if (e3) {
      this.form.get('incubacionConf')?.patchValue({
        fechaTraspaso: e3.fechaTraspaso,
        horaTraspaso: e3.horaTraspaso,
        analistaTraspaso: e3.rutAnalistaTraspaso,
        agarNutritivo: e3.idAgarNutritivo ? String(e3.idAgarNutritivo) : '',
        estufaConfIncub: e3.idEstufaConf,
      });
      // Controls and observaciones were previously stored in e3; keep loading them
      this.form.get('analisisLectura')?.patchValue({
        controlPosEcoli: e3.controlPosEcoli ?? '',
        controlNegPaer: e3.controlNegPaer ?? '',
        blanco: e3.blanco ?? '',
        observaciones: e3.observaciones ?? '',
      });
    }
  }

  private uiEtapaFromFormulario(formulario: EntFormularioCompleto): number {
    const e1 = formulario.etapa1;
    const e2 = formulario.etapa2;
    const e3 = formulario.etapa3;
    if (!e1) return 1;
    if (!e1.completada) return 2;
    if (!e2 || !e2.completada) return 3;
    if (!e3 || !e3.completada) return 4;
    return 4;
  }

  get progresoPorcentaje(): number {
    return Math.round(((this.etapaActual() - 1) / (this.TOTAL_ETAPAS - 1)) * 100);
  }

  get rol(): number {
    return this.authService.getUsuario()?.primaryRole ?? 0;
  }

  get modoLectura(): boolean {
    return ![0, 4].includes(this.rol);
  }

  get muestrasConResultado(): EntMuestraLectura[] {
    return this.muestrasLectura.filter(m => m.resultado !== undefined);
  }

  onSiguiente(): void {
    if (this.etapaActual() < this.TOTAL_ETAPAS) {
      this.etapaActual.update(e => e + 1);
    }
  }

  onAnterior(): void {
    if (this.etapaActual() > 1) this.etapaActual.update(e => e - 1);
  }

  async finalizarFormulario(): Promise<void> {
    // Save all API etapas in order so completada flags are correct
    let ok = await this.guardarEtapa(1, true);
    if (!ok) return;
    ok = await this.guardarEtapa(2, true);
    if (!ok) return;
    ok = await this.guardarEtapa(3, true);
    if (ok) {
      this.formularioCompletado = true;
      this.mostrarToast('Registro de análisis completado correctamente.', 'success');
    }
  }

  async guardarFormularioBorrador(): Promise<void> {
    if (this.modoLectura) return;
    const ui = this.etapaActual();
    // Mark prior API etapas as completed so backend stage-progression check passes
    let ok = await this.guardarEtapa(1, ui > 2);
    if (!ok) return;
    if (ui >= 3) {
      ok = await this.guardarEtapa(2, ui > 3);
      if (!ok) return;
    }
    if (ui >= 4) {
      ok = await this.guardarEtapa(3, false);
      if (!ok) return;
    }
    this.mostrarToast('Borrador guardado correctamente.', 'success');
  }

  private async guardarEtapa(etapa: 1 | 2 | 3, completada: boolean): Promise<boolean> {
    try {
      const payload = this.construirPayloadEtapa(etapa, completada);
      const respuesta = await firstValueFrom(
        this.apiService.guardarEtapa(this.idFormulario, etapa, payload, this.updatedAt)
      );
      this.updatedAt = respuesta.updatedAt;
      return true;
    } catch (err: unknown) {
      const httpErr = err as { status?: number; error?: { codigo?: string; detalles?: { horas_restantes?: number } } };
      if (httpErr.status === 409) {
        await this.mostrarAlerta('Conflicto de concurrencia', 'El formulario fue modificado por otro usuario. Recargue y vuelva a intentar.');
      } else if (httpErr.status === 422 && httpErr.error?.codigo === 'INCUBATION_LOCKOUT') {
        const horas = httpErr.error.detalles?.horas_restantes ?? 0;
        await this.mostrarAlerta('Bloqueo de incubación', `Deben transcurrir 24 horas. Faltan aproximadamente ${horas} horas.`);
      } else {
        this.mostrarToast('Error al guardar. Intente nuevamente.', 'danger');
      }
      return false;
    }
  }

  private construirPayloadEtapa(etapa: 1 | 2 | 3, completada: boolean): EntEtapaPayload {
    switch (etapa) {
      case 1:
        return { completada, etapa: { ...this.form.value.pesado, ...this.form.value.homogeneizacion, ...this.form.value.sembrado, ...this.form.value.incubacionPrep } };
      case 2:
        return { completada, etapa: { ...this.form.value.analisisLectura, muestras: this.muestrasLectura } };
      case 3:
        return { completada, etapa: { ...this.form.value.incubacionConf } };
    }
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
          handler: () => this.router.navigate(['/home']),
        },
      ],
    });
    await alert.present();
  }

  campoInvalido(grupo: string, nombre: string): boolean {
    const ctrl = this.form.get(`${grupo}.${nombre}`);
    return !!(ctrl && ctrl.invalid && (ctrl.dirty || ctrl.touched));
  }

  hoy(): string {
    return new Date().toISOString().split('T')[0];
  }

  private async mostrarAlerta(header: string, message: string): Promise<void> {
    const alert = await this.alertCtrl.create({ header, message, buttons: ['Entendido'] });
    await alert.present();
  }

  private async mostrarToast(message: string, color: 'success' | 'warning' | 'danger'): Promise<void> {
    const toast = await this.toastCtrl.create({ message, duration: 3500, color, position: 'top' });
    await toast.present();
  }
}
