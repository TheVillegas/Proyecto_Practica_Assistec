import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormColiformesPage } from './form-coliformes.page';

describe('FormColiformesPage', () => {
  let component: FormColiformesPage;
  let fixture: ComponentFixture<FormColiformesPage>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [FormColiformesPage]
    }).compileComponents();

    fixture = TestBed.createComponent(FormColiformesPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
