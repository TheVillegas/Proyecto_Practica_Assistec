import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface MedioCultivo {
  idMedioCultivo: number;
  nombre: string;
  descripcion?: string;
  temperaturaUso?: number;
  normaRelacionada?: string;
}

@Injectable({ providedIn: 'root' })
export class MediosCultivosService {
  private http = inject(HttpClient);
  private baseUrl = `${environment.apiUrl}/maestras/medios-cultivos`;

  getAll(): Observable<MedioCultivo[]> {
    return this.http.get<MedioCultivo[]>(this.baseUrl);
  }
}
