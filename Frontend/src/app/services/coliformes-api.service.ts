import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError, delay, retry } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import {
  ColiFormulario,
  SaveFase1Payload,
  SaveFase2Payload,
  SaveFase3Payload,
  SaveFase35Payload,
  SaveFase4Payload,
  ColiFase3Submuestra,
} from '../interfaces/coliformes.interfaces';

@Injectable({
  providedIn: 'root',
})
export class ColiformesApiService {
  private http = inject(HttpClient);
  private apiUrl = environment.apiUrl + '/coliformes';

  mapPresencia(valor: string): boolean | null {
    if (valor === 'positivo') return true;
    if (valor === 'negativo') return false;
    return null;
  }
}
