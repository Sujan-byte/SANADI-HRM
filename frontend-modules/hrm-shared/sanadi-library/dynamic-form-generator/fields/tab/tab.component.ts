import {
  Component,
  EventEmitter,
  Input,
  OnChanges,
  Output,
  SimpleChanges,
  effect,
  input,
} from '@angular/core';

export class TabConfig {
  index: number = 0;
  tabsLength: number = 0;
}

@Component({
  selector: 'tab',
  templateUrl: './tab.component.html',
  styleUrls: ['./tab.component.scss'],
})
export class TabComponent implements OnChanges {
  @Input() fields: any;
  @Input() form: any;
  @Input() headerTextArray: any;

  @Output() onTabChange: EventEmitter<TabConfig> =
    new EventEmitter<TabConfig>();

  activeIndex: number = 0;

  constructor() {
    effect(
      () => {
        const config = new TabConfig();
        config.index = this.activeIndex;
        config.tabsLength = this.fields?.filter((f: any) => !f?.hidden).length;
        this.onTabChange.emit(config);
      },
      { allowSignalWrites: true }
    );
  }

  ngOnChanges(changes: SimpleChanges): void {
    addEventListener('nextTabChange', () => {
      this.activeIndex++;
      const config = new TabConfig();
      config.index = this.activeIndex;
      config.tabsLength = this.fields?.filter((f: any) => !f?.hidden).length;
      this.onTabChange.emit(config);
    });

    addEventListener('prevTabChange', () => {
      this.activeIndex--;
      const config = new TabConfig();
      config.index = this.activeIndex;
      config.tabsLength = this.fields?.filter((f: any) => !f?.hidden).length;
      this.onTabChange.emit(config);
    });
  }

  onTabChanged() {
    const config = new TabConfig();
    config.index = this.activeIndex;
    config.tabsLength = this.fields?.filter((f: any) => !f?.hidden).length;
    this.onTabChange.emit(config);
  }

  hideFields(val: Function) {
    // console.log('hidefiels', formValue, val(formValue))
    return val(this.form.value);
  }
}
