import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormSAureusPage } from './form-s-aureus.page';

describe('FormSAureusPage', () => {
  let component: FormSAureusPage;
  let fixture: ComponentFixture<FormSAureusPage>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [FormSAureusPage]
    }).compileComponents();

    fixture = TestBed.createComponent(FormSAureusPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
