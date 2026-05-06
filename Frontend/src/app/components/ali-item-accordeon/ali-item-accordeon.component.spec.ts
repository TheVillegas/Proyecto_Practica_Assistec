import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ALIItemAccordeonComponent } from './ali-item-accordeon.component';

describe('ALIItemAccordeonComponent', () => {
  let component: ALIItemAccordeonComponent;
  let fixture: ComponentFixture<ALIItemAccordeonComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ALIItemAccordeonComponent],
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])],
      schemas: [NO_ERRORS_SCHEMA]
    }).compileComponents();

    fixture = TestBed.createComponent(ALIItemAccordeonComponent);
    component = fixture.componentInstance;
    component.muestra = { ALIMuestra: 'TEST-001' } as any;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
