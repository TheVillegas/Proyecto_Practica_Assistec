import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormColiformesPage } from './form-coliformes.page';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { ActivatedRoute } from '@angular/router';
import { CatalogosService } from '../../services/catalogos.service';
import { ColiformesApiService } from '../../services/coliformes-api.service';
import { IonicModule } from '@ionic/angular';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';

describe('FormColiformesPage', () => {
  let component: FormColiformesPage;
  let fixture: ComponentFixture<FormColiformesPage>;

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
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(FormColiformesPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
