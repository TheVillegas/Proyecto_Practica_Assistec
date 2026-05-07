export type SolicitudStateFamily = 'editable' | 'resubmittable' | 'under_review' | 'post_validation';

export interface SolicitudStateMeta {
  family: SolicitudStateFamily;
  label: string;
  css: string;
}

const STATE_META: Record<string, SolicitudStateMeta> = {
  borrador: { family: 'editable', label: 'Borrador', css: 'badge-draft' },
  rechazado: { family: 'resubmittable', label: 'Rechazada', css: 'badge-danger' },
  devuelta: { family: 'resubmittable', label: 'Devuelta', css: 'badge-danger' },
  enviado: { family: 'under_review', label: 'En validación', css: 'badge-pending' },
  enviada: { family: 'under_review', label: 'En validación', css: 'badge-pending' },
  en_validacion_jefa: { family: 'under_review', label: 'En validación', css: 'badge-pending' },
  en_validacion_coordinadora: { family: 'under_review', label: 'En validación', css: 'badge-pending' },
  validado: { family: 'post_validation', label: 'Validada', css: 'badge-success' },
  validada: { family: 'post_validation', label: 'Validada', css: 'badge-success' },
  convertido_muestras: { family: 'post_validation', label: 'Convertida a muestras', css: 'badge-success' },
  reportes_generados: { family: 'post_validation', label: 'Reportes generados', css: 'badge-success' }
};

export function resolveSolicitudStateMeta(estado: string | null | undefined): SolicitudStateMeta {
  return STATE_META[String(estado ?? 'borrador').trim().toLowerCase()] ?? STATE_META['borrador'];
}

export function canSendToValidationStateFamily(estado: string | null | undefined): boolean {
  const family = resolveSolicitudStateMeta(estado).family;
  return family === 'editable' || family === 'resubmittable';
}
