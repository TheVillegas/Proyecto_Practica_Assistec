import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { IonicModule } from '@ionic/angular';
import { Step3AnalisisSolicitadoComponent } from './step3-analisis-solicitado.component';

describe('Step3AnalisisSolicitadoComponent', () => {
  let component: Step3AnalisisSolicitadoComponent;
  let fixture: ComponentFixture<Step3AnalisisSolicitadoComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ Step3AnalisisSolicitadoComponent ],
      imports: [IonicModule.forRoot()]
    }).compileComponents();

    fixture = TestBed.createComponent(Step3AnalisisSolicitadoComponent);
    component = fixture.componentInstance;
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
