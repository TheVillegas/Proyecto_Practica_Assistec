import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { IonicModule } from '@ionic/angular';
import { Step2DatosAlimentoComponent } from './step2-datos-alimento.component';

describe('Step2DatosAlimentoComponent', () => {
  let component: Step2DatosAlimentoComponent;
  let fixture: ComponentFixture<Step2DatosAlimentoComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ Step2DatosAlimentoComponent ],
      imports: [IonicModule.forRoot()]
    }).compileComponents();

    fixture = TestBed.createComponent(Step2DatosAlimentoComponent);
    component = fixture.componentInstance;
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
