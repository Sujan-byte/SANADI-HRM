import { Component, Inject, OnInit } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { KnobModule } from 'primeng/knob';
import { SharedService } from '../../services/shared.service';


@Component({
  selector: 'sanadi-progress-knob',
  standalone: true,
  imports: [KnobModule,ReactiveFormsModule,FormsModule],
  templateUrl: './progress-knob.component.html',
  styleUrl: './progress-knob.component.scss'
})
export class ProgressKnobComponent implements OnInit {

  constructor(private sharedService:SharedService ) {
    this.sharedService.myObservable$.subscribe(value => {
      console.log("suck2",value); // Ensure this is being called
      // Update your component with the new value
    });
  }
  value: number = 60;
  async ngOnInit(): Promise<void> {
    // this.sharedService.updateProgress(50);


  }
}
