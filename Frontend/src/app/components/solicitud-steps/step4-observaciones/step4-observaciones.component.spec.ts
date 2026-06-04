import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { IonicModule } from '@ionic/angular';
import { Step4ObservacionesComponent } from './step4-observaciones.component';

describe('Step4ObservacionesComponent', () => {
  let component: Step4ObservacionesComponent;
  let fixture: ComponentFixture<Step4ObservacionesComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ Step4ObservacionesComponent ],
      imports: [IonicModule.forRoot()]
    }).compileComponents();

    fixture = TestBed.createComponent(Step4ObservacionesComponent);
    component = fixture.componentInstance;
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
