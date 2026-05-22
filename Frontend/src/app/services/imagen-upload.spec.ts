import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { AlertController, LoadingController } from '@ionic/angular';
import { ImagenUploadService } from './imagen-upload';

describe('ImagenUploadService', () => {
  let service: ImagenUploadService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [AlertController, LoadingController]
    });
    service = TestBed.inject(ImagenUploadService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
