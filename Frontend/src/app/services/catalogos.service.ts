import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import {
    Diluyente,
    EquipoIncubacion,
    EquipoLaboratorio,
    FormaCalculo,
    ItemChecklistLimpieza,
    LugarAlmacenamiento,
    MaterialPesado,
    MaterialSiembra,
    Micropipeta,
    Responsable,
    TipoAnalisis
} from '../interfaces/catalogo.interfaces';

@Injectable({
    providedIn: 'root',
})
export class CatalogosService {

    private apiUrl = environment.apiUrl + '/Catalogos';
    private usuariosUrl = environment.apiUrl + '/Usuarios';

    constructor(private http: HttpClient) { }

    getMaterialesPesados(): Observable<MaterialPesado[]> {
        return this.http.get<MaterialPesado[]>(`${this.apiUrl}/materiales-pesado`);
    }

    getLugaresAlmacenamiento(): Observable<LugarAlmacenamiento[]> {
        return this.http.get<LugarAlmacenamiento[]>(`${this.apiUrl}/lugares-almacenamiento`);
    }

    getResponsables(): Observable<Responsable[]> {
        return this.http.get<Responsable[]>(`${this.usuariosUrl}/analistas`);
    }

    getEquiposInstrumentos(): Observable<EquipoLaboratorio[]> {
        // En el backend 'instrumentos' y 'equipos-lab' están separados.
        // Basado en los datos estáticos (Balanzas), esto parece ser 'equipos-lab'.
        return this.http.get<EquipoLaboratorio[]>(`${this.apiUrl}/equipos-lab`);
    }

    getChecklistLimpieza(): Observable<ItemChecklistLimpieza[]> {
        return this.http.get<ItemChecklistLimpieza[]>(`${this.apiUrl}/checklist-limpieza`);
    }

    getMaterialSiembra(): Observable<MaterialSiembra[]> {
        return this.http.get<MaterialSiembra[]>(`${this.apiUrl}/material-siembra`);
    }

    getEquiposSiembra(): Observable<EquipoLaboratorio[]> {
        // Asumiendo que también son equipos de laboratorio, o si hay un endpoint específico.
        // Por ahora obtendremos equipos-lab. Considerar filtrar en el componente o backend si es necesario.
        return this.http.get<EquipoLaboratorio[]>(`${this.apiUrl}/equipos-lab`);
    }

    getDiluyentes(): Observable<Diluyente[]> {
        return this.http.get<Diluyente[]>(`${this.apiUrl}/diluyentes`);
    }

    getEquiposIncubacion(): Observable<EquipoIncubacion[]> {
        return this.http.get<EquipoIncubacion[]>(`${this.apiUrl}/equipos-incubacion`);
    }

    getMicroPipetas(): Observable<Micropipeta[]> {
        return this.http.get<Micropipeta[]>(`${this.apiUrl}/micropipetas`);
    }

    getControlAnalisis(): Observable<TipoAnalisis[]> {
        return this.http.get<TipoAnalisis[]>(`${this.apiUrl}/tipos-analisis`);
    }

    getFormasCalculo(): Observable<FormaCalculo[]> {
        return this.http.get<FormaCalculo[]>(`${this.apiUrl}/formas-calculo`);
    }
}
