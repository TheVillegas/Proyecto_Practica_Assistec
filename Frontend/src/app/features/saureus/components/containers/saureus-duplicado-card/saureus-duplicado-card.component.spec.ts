import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { SaureusDuplicadoCardComponent, DuplicadoData } from './saureus-duplicado-card.component';
import { AliOption } from '../../atoms/ali-selector/ali-selector.component';

describe('SaureusDuplicadoCardComponent', () => {
  let component: SaureusDuplicadoCardComponent;
  let fixture: ComponentFixture<SaureusDuplicadoCardComponent>;

  const createDuplicadoData = (overrides: Partial<DuplicadoData> = {}): DuplicadoData => ({
    aliReferencia: null,
    diluciones: [
      { dil: -2, colonias: [null, null] },
      { dil: -3, colonias: [null, null] }
    ],
    coloniasPosibles: [null, null],
    colConfirmar: [null, null],
    coagulasa4h: [null, null],
    coagulasa24h: [null, null],
    ...overrides
  });

  const aliList: AliOption[] = [
    { id: 421, codigo: 'ALI-2025-00421', fechaCreacion: new Date('2025-05-15') },
    { id: 420, codigo: 'ALI-2025-00420', fechaCreacion: new Date('2025-05-14') }
  ];

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SaureusDuplicadoCardComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(SaureusDuplicadoCardComponent);
    component = fixture.componentInstance;
    component.duplicadoData = createDuplicadoData();
    component.aliList = aliList;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('renderizado inicial', () => {
    it('muestra título "DUPLICADO (Referencia a ALI anterior)"', () => {
      const titulo = fixture.debugElement.query(By.css('.card-title'));
      expect(titulo.nativeElement.textContent).toContain('DUPLICADO');
    });

    it('no muestra sección "Datos importados" si no hay ALI seleccionado', () => {
      component.duplicadoData = createDuplicadoData({ aliReferencia: null });
      fixture.detectChanges();

      const datosImportados = fixture.debugElement.query(By.css('.datos-importados'));
      expect(datosImportados).toBeNull();
    });
  });

  describe('importación desde ALI', () => {
    it('muestra "Datos importados" si aliReferencia está seteada', () => {
      component.duplicadoData = createDuplicadoData({ aliReferencia: 421 });
      fixture.detectChanges();

      const datosImportados = fixture.debugElement.query(By.css('.datos-importados'));
      expect(datosImportados).toBeTruthy();
      expect(datosImportados.nativeElement.textContent).toContain('ALI-421');
    });

    it('muestra advertencia si existe advertencia y NO muestra datos importados', () => {
      component.duplicadoData = createDuplicadoData({
        aliReferencia: 421,
        advertencia: 'El ALI seleccionado no tiene datos S. aureus'
      });
      fixture.detectChanges();

      const advertencia = fixture.debugElement.query(By.css('.advertencia'));
      expect(advertencia).toBeTruthy();
      expect(advertencia.nativeElement.textContent).toContain('no tiene datos S. aureus');

      const datosImportados = fixture.debugElement.query(By.css('.datos-importados'));
      expect(datosImportados).toBeNull();
    });
  });

  describe('eventos (importar ALI / re-importar / editar)', () => {
    it('emite aliChange al seleccionar ALI', () => {
      spyOn(component.aliChange, 'emit');

      component.onAliChange(421);

      expect(component.aliChange.emit).toHaveBeenCalledWith(421);
    });

    it('emite reimportar con el aliReferencia al click en "Re-importar"', () => {
      component.duplicadoData = createDuplicadoData({ aliReferencia: 421 });
      spyOn(component.reimportar, 'emit');
      fixture.detectChanges();

      const btnReimportar = fixture.debugElement.query(By.css('.btn-secondary'));
      btnReimportar.nativeElement.click();

      expect(component.reimportar.emit).toHaveBeenCalledWith(421);
    });

    it('emite editar al click en "Editar manualmente"', () => {
      spyOn(component.editar, 'emit');
      fixture.detectChanges();

      const btnEditar = fixture.debugElement.query(By.css('.btn-outline'));
      btnEditar.nativeElement.click();

      expect(component.editar.emit).toHaveBeenCalled();
    });
  });

  describe('estado de botones según isLoading', () => {
    it('deshabilita botones cuando isLoading=true', () => {
      component.isLoading = true;
      fixture.detectChanges();

      const btnReimportar = fixture.debugElement.query(By.css('.btn-secondary'));
      const btnEditar = fixture.debugElement.query(By.css('.btn-outline'));

      expect(btnReimportar.nativeElement.disabled).toBeTrue();
      expect(btnEditar.nativeElement.disabled).toBeTrue();
    });

    it('habilita "Re-importar" solo si hay aliReferencia', () => {
      component.duplicadoData = createDuplicadoData({ aliReferencia: null });
      component.isLoading = false;
      fixture.detectChanges();

      const btnReimportar = fixture.debugElement.query(By.css('.btn-secondary'));
      expect(btnReimportar.nativeElement.disabled).toBeTrue();
    });
  });
});
