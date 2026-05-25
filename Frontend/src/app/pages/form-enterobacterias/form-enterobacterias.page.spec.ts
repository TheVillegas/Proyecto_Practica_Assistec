import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormEnterobacteriasPage } from './form-enterobacterias.page';

describe('FormEnterobacteriasPage', () => {
  let component: FormEnterobacteriasPage;
  let fixture: ComponentFixture<FormEnterobacteriasPage>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [FormEnterobacteriasPage],
    }).compileComponents();

    fixture = TestBed.createComponent(FormEnterobacteriasPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
