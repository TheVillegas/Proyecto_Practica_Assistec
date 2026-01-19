import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
    providedIn: 'root',
})
export class CatalogosService {

    private apiUrl = environment.apiUrl + '/Catalogos';
    private usuariosUrl = environment.apiUrl + '/Usuarios';

    constructor(private http: HttpClient) { }

    getMaterialesPesados(): Observable<any[]> {
        return this.http.get<any[]>(`${this.apiUrl}/materiales-pesado`);
    }

    getLugaresAlmacenamiento(): Observable<any[]> {
        return this.http.get<any[]>(`${this.apiUrl}/lugares-almacenamiento`);
    }

    getResponsables(): Observable<any[]> {
        return this.http.get<any[]>(`${this.usuariosUrl}/analistas`);
    }

    getEquiposInstrumentos(): Observable<any[]> {
        // En el backend 'instrumentos' y 'equipos-lab' están separados.
        // Basado en los datos estáticos (Balanzas), esto parece ser 'equipos-lab'.
        return this.http.get<any[]>(`${this.apiUrl}/equipos-lab`);
    }

    getChecklistLimpieza(): Observable<any[]> {
        return this.http.get<any[]>(`${this.apiUrl}/checklist-limpieza`);
    }

    getMaterialSiembra(): Observable<any[]> {
        return this.http.get<any[]>(`${this.apiUrl}/material-siembra`);
    }

    getEquiposSiembra(): Observable<any[]> {
        // Asumiendo que también son equipos de laboratorio, o si hay un endpoint específico.
        // Por ahora obtendremos equipos-lab. Considerar filtrar en el componente o backend si es necesario.
        return this.http.get<any[]>(`${this.apiUrl}/equipos-lab`);
    }

    getDiluyentes(): Observable<any[]> {
        return this.http.get<any[]>(`${this.apiUrl}/diluyentes`);
    }

    getEquiposIncubacion(): Observable<any[]> {
        return this.http.get<any[]>(`${this.apiUrl}/equipos-incubacion`);
    }

    getMicroPipetas(): Observable<any[]> {
        return this.http.get<any[]>(`${this.apiUrl}/micropipetas`);
    }

    getControlAnalisis(): Observable<any[]> {
        return this.http.get<any[]>(`${this.apiUrl}/tipos-analisis`);
    }

    getFormasCalculo(): Observable<any[]> {
        return this.http.get<any[]>(`${this.apiUrl}/formas-calculo`);
    }
}
