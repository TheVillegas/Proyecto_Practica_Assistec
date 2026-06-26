import { ComponentFixture, TestBed, fakeAsync, tick, flush } from '@angular/core/testing';
import { FormColiformesPage } from './form-coliformes.page';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { ActivatedRoute } from '@angular/router';
import { CatalogosService } from '../../services/catalogos.service';
import { ColiformesApiService } from '../../services/coliformes-api.service';
import { IonicModule } from '@ionic/angular';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

describe('FormColiformesPage', () => {
  let component: FormColiformesPage;
  let fixture: ComponentFixture<FormColiformesPage>;
  let httpMock: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HttpClientTestingModule, IonicModule, ReactiveFormsModule, FormsModule],
      declarations: [FormColiformesPage],
      providers: [
        CatalogosService,
        ColiformesApiService,
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              paramMap: {
                get: (key: string) => (key === 'idFormulario' ? '1' : null),
              },
              queryParamMap: {
                get: (key: string) => null,
              },
            },
          },
        },
        {
          provide: Router,
          useValue: { navigate: jasmine.createSpy('navigate') },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(FormColiformesPage);
    component = fixture.componentInstance;
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  function flushCatalogAndFormRequests(): void {
    httpMock.expectOne('http://localhost:3002/api/catalogo/equipos_incubacion').flush([]);
    httpMock.expectOne('http://localhost:3002/api/catalogo/micropipetas').flush([]);
    httpMock.expectOne('http://localhost:3002/api/catalogo/usuarios').flush([]);
    httpMock.expectOne('http://localhost:3002/api/coliformes/1').flush({
      idColiFormulario: 1,
      faseActual: 1,
      estado: 'BORRADOR',
      updatedAt: '2025-01-01T00:00:00Z',
      muestras: [],
    });
  }

  it('should create', fakeAsync(() => {
    fixture.detectChanges();
    flushCatalogAndFormRequests();
    tick(0);
    expect(component).toBeTruthy();
    flush();
  }));

  describe('ngOnInit', () => {
    it('should load catalogs via forkJoin and formulario from backend', fakeAsync(() => {
      fixture.detectChanges();

      const mockEquipos = [{ idIncubacion: 1, nombreEquipo: 'Estufa 1', temperaturaRef: '35°C' }];
      const mockPipetas = [{ idPipeta: 1, nombrePipeta: 'P1', capacidad: '1ml', codigoPipeta: 'P1' }];
      const mockResponsables = [{ rut: '1-1', nombreApellido: 'Ana Perez', correo: 'a@test.com', rol: 2 }];
      const mockFormulario = {
        idColiFormulario: 1,
        faseActual: 1,
        estado: 'BORRADOR',
        updatedAt: '2025-01-01T00:00:00Z',
        muestras: [{ idColiMuestra: 1, numeroMuestra: 'M1', esDuplicado: false, pesoMuestraTipo: '10g', orden: 1 }],
      };

      httpMock.expectOne('http://localhost:3002/api/catalogo/equipos_incubacion').flush(mockEquipos);
      httpMock.expectOne('http://localhost:3002/api/catalogo/micropipetas').flush(mockPipetas);
      httpMock.expectOne('http://localhost:3002/api/catalogo/usuarios').flush(mockResponsables);
      httpMock.expectOne('http://localhost:3002/api/coliformes/1').flush(mockFormulario);

      tick(0);

      expect(component.listaEquiposIncubacion.length).toBe(1);
      expect(component.listaPipetas.length).toBe(1);
      expect(component.listaResponsables.length).toBe(1);
      expect(component.muestras.length).toBe(1);
      flush();
    }));
  });

  describe('avanzarEtapa', () => {
    it('should advance stage without validation or save', () => {
      component.etapaActual = 1;
      component.avanzarEtapa();
      expect(component.etapaActual).toBe(2);
    });

    it('should not advance past TOTAL_ETAPAS', () => {
      component.etapaActual = 5;
      component.avanzarEtapa();
      expect(component.etapaActual).toBe(5);
    });
  });

  describe('guardarBorrador', () => {
    it('should send PUT with completada: false', async () => {
      fixture.detectChanges();
      flushCatalogAndFormRequests();

      component.etapaActual = 2;
      component.form.patchValue({
        caldoLauril: 'CL-01',
        estufas: [1],
        micropipeta1ml: { idPipeta: 1, nombrePipeta: 'P1', capacidad: '1ml', codigoPipeta: 'P1' },
        micropipeta10ml: { idPipeta: 2, nombrePipeta: 'P2', capacidad: '10ml', codigoPipeta: 'P2' },
      });

      const promise = component.guardarBorrador();

      const req = httpMock.expectOne('http://localhost:3002/api/coliformes/1/fase/2');
      expect(req.request.body.completada).toBeFalse();
      req.flush({ idColiFormulario: 1, faseActual: 2, estado: 'BORRADOR', updatedAt: '2025-01-01', muestras: [] });

      await promise;

      expect(component.etapaActual).toBe(2);
    });
  });
});
