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

    private apiUrl = environment.apiUrl + '/catalogo';
    private usuariosUrl = environment.apiUrl + '/catalogo/usuarios';

    constructor(private http: HttpClient) { }

    getMaterialesPesados(): Observable<MaterialPesado[]> {
        return this.http.get<MaterialPesado[]>(`${this.apiUrl}/instrumentos`);
    }

    getLugaresAlmacenamiento(): Observable<LugarAlmacenamiento[]> {
        return this.http.get<LugarAlmacenamiento[]>(`${this.apiUrl}/lugares`);
    }

    getResponsables(): Observable<Responsable[]> {
        return this.http.get<Responsable[]>(this.usuariosUrl);
    }

    getEquiposInstrumentos(): Observable<EquipoLaboratorio[]> {
        return this.http.get<EquipoLaboratorio[]>(`${this.apiUrl}/equipos_lab`);
    }

    getChecklistLimpieza(): Observable<ItemChecklistLimpieza[]> {
        return this.http.get<ItemChecklistLimpieza[]>(`${this.apiUrl}/checklist_limpieza`);
    }

    getMaterialSiembra(): Observable<MaterialSiembra[]> {
        return this.http.get<MaterialSiembra[]>(`${this.apiUrl}/material_siembra`);
    }

    getEquiposSiembra(): Observable<EquipoLaboratorio[]> {
        return this.http.get<EquipoLaboratorio[]>(`${this.apiUrl}/equipos_lab`);
    }

    getDiluyentes(): Observable<Diluyente[]> {
        return this.http.get<Diluyente[]>(`${this.apiUrl}/diluyentes`);
    }

    getEquiposIncubacion(): Observable<EquipoIncubacion[]> {
        return this.http.get<EquipoIncubacion[]>(`${this.apiUrl}/equipos_incubacion`);
    }

    getMicroPipetas(): Observable<Micropipeta[]> {
        return this.http.get<Micropipeta[]>(`${this.apiUrl}/micropipetas`);
    }

    getControlAnalisis(): Observable<TipoAnalisis[]> {
        return this.http.get<TipoAnalisis[]>(`${this.apiUrl}/tipos_analisis`);
    }

    getFormasCalculo(): Observable<FormaCalculo[]> {
        return this.http.get<FormaCalculo[]>(`${this.apiUrl}/formas_calculo`);
    }
}
