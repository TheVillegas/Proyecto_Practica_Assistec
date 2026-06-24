import { Pipe, PipeTransform } from '@angular/core';

/**
 * Pipe puro que indica si la UI debe mostrarse en modo solo lectura.
 * Retorna `true` cuando el rol NO tiene permisos de edición (solo 0 y 4 editan).
 */
@Pipe({
  name: 'modoLectura',
  standalone: false,
})
export class ModoLecturaPipe implements PipeTransform {
  private readonly ROLES_EDICION = [0, 4];

  transform(rol: number | undefined | null): boolean {
    if (rol === undefined || rol === null) {
      return true;
    }
    return !this.ROLES_EDICION.includes(Number(rol));
  }
}
