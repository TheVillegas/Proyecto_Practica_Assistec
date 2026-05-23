import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormSalmonellaPage } from './form-salmonella.page';

describe('FormSalmonellaPage', () => {
  let component: FormSalmonellaPage;
  let fixture: ComponentFixture<FormSalmonellaPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(FormSalmonellaPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
