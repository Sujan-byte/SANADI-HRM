import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TicketMasterComponent } from './ticket-master.component';

describe('TicketMasterComponent', () => {
  let component: TicketMasterComponent;
  let fixture: ComponentFixture<TicketMasterComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TicketMasterComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(TicketMasterComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
