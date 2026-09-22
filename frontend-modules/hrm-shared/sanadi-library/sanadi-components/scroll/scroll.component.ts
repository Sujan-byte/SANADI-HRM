import { Component, Input } from '@angular/core';
import { CardModule } from 'primeng/card';
import { ScrollerModule } from 'primeng/scroller';
import { ScrollPanelModule } from 'primeng/scrollpanel';
@Component({
  selector: 'sanadi-scroll',
  standalone: true,
  imports: [ScrollPanelModule, ScrollerModule, CardModule],
  templateUrl: './scroll.component.html',
  styleUrl: './scroll.component.scss',
})
export class ScrollComponent {
  itemsScroll = [
    1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20,
  ];

  @Input() scrollVariant: string = '1';
}
