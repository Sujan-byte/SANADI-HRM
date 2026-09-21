import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DocumentTypeMasterComponent } from './document-type-master.component';

describe('DocumentTypeMasterComponent', () => {
  let component: DocumentTypeMasterComponent;
  let fixture: ComponentFixture<DocumentTypeMasterComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DocumentTypeMasterComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(DocumentTypeMasterComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
