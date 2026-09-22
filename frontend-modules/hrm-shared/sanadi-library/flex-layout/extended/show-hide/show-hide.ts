
import {
  Directive,
  ElementRef,
  OnChanges,
  SimpleChanges,
  Inject,
  PLATFORM_ID,
  Injectable,
  AfterViewInit,
} from '@angular/core';
import {isPlatformServer} from '@angular/common';
import {
  BaseDirective2,
  LAYOUT_CONFIG,
  LayoutConfigOptions,
  MediaMarshaller,
  SERVER_TOKEN,
  StyleUtils,
  StyleBuilder,
} from '../../core/public-api';
import {coerceBooleanProperty} from '@angular/cdk/coercion';
import {takeUntil} from 'rxjs/operators';

export interface ShowHideParent {
  display: string;
  isServer: boolean;
}

@Injectable({providedIn: 'root'})
export class ShowHideStyleBuilder extends StyleBuilder {
  buildStyles(show: string, parent: ShowHideParent) {
    const shouldShow = show === 'true';
    return {'display': shouldShow ? parent.display || (parent.isServer ? 'initial' : '') : 'none'};
  }
}

@Directive()
export class ShowHideDirective extends BaseDirective2 implements AfterViewInit, OnChanges {
  protected override DIRECTIVE_KEY = 'show-hide';

  /** Original DOM Element CSS display style */
  protected display: string = '';
  protected hasLayout = false;
  protected hasFlexChild = false;

  constructor(elementRef: ElementRef,
              styleBuilder: ShowHideStyleBuilder,
              styler: StyleUtils,
              marshal: MediaMarshaller,
              @Inject(LAYOUT_CONFIG) protected layoutConfig: LayoutConfigOptions,
              @Inject(PLATFORM_ID) protected platformId: Object,
              @Inject(SERVER_TOKEN) protected serverModuleLoaded: boolean) {
    super(elementRef, styleBuilder, styler, marshal);
  }

  // *********************************************
  // Lifecycle Methods
  // *********************************************

  ngAfterViewInit() {
    this.trackExtraTriggers();

    const children = Array.from(this.nativeElement.children);
    for (let i = 0; i < children.length; i++) {
      if (this.marshal.hasValue(children[i] as HTMLElement, 'flex')) {
        this.hasFlexChild = true;
        break;
      }
    }

    if (DISPLAY_MAP.has(this.nativeElement)) {
      this.display = DISPLAY_MAP.get(this.nativeElement)!;
    } else {
      this.display = this.getDisplayStyle();
      DISPLAY_MAP.set(this.nativeElement, this.display);
    }

    this.init();
    // set the default to show unless explicitly overridden
    const defaultValue = this.marshal.getValue(this.nativeElement, this.DIRECTIVE_KEY, '');
    if (defaultValue === undefined || defaultValue === '') {
      this.setValue(true, '');
    } else {
      this.triggerUpdate();
    }
  }

  /**
   * On changes to any @Input properties...
   * Default to use the non-responsive Input value ('snShow')
   * Then conditionally override with the mq-activated Input's current value
   */
  override ngOnChanges(changes: SimpleChanges) {
    Object.keys(changes).forEach(key => {
      if (this.inputs.indexOf(key) !== -1) {
        const inputKey = key.split('.');
        const bp = inputKey.slice(1).join('.');
        const inputValue = changes[key].currentValue;
        let shouldShow = inputValue !== '' ?
            inputValue !== 0 ? coerceBooleanProperty(inputValue) : false
            : true;
        if (inputKey[0] === 'snHide') {
          shouldShow = !shouldShow;
        }
        this.setValue(shouldShow, bp);
      }
    });
  }

  // *********************************************
  // Protected methods
  // *********************************************

  /**
   *  Watch for these extra triggers to update snShow, snHide stylings
   */
  protected trackExtraTriggers() {
    this.hasLayout = this.marshal.hasValue(this.nativeElement, 'layout');

    ['layout', 'layout-align'].forEach(key => {
      this.marshal
          .trackValue(this.nativeElement, key)
          .pipe(takeUntil(this.destroySubject))
          .subscribe(this.triggerUpdate.bind(this));
    });
  }

  /**
   * Override accessor to the current HTMLElement's `display` style
   * Note: Show/Hide will not change the display to 'flex' but will set it to 'block'
   * unless it was already explicitly specified inline or in a CSS stylesheet.
   */
  protected getDisplayStyle(): string {
    return (this.hasLayout || (this.hasFlexChild && this.layoutConfig.addFlexToParent)) ?
        'flex' : this.styler.lookupStyle(this.nativeElement, 'display', true);
  }

  /** Validate the visibility value and then update the host's inline display style */
  protected override updateWithValue(value: boolean | string = true) {
    if (value === '') {
      return;
    }
    const isServer = isPlatformServer(this.platformId);
    this.addStyles(value ? 'true' : 'false', {display: this.display, isServer});
    if (isServer && this.serverModuleLoaded) {
      this.nativeElement.style.setProperty('display', '');
    }
    this.marshal.triggerUpdate(this.parentElement!, 'layout-gap');
  }
}

const DISPLAY_MAP: WeakMap<HTMLElement, string> = new WeakMap();

const inputs = [
  'snShow', 'snShow.print',
  'snShow.xs', 'snShow.sm', 'snShow.md', 'snShow.lg', 'snShow.xl',
  'snShow.lt-sm', 'snShow.lt-md', 'snShow.lt-lg', 'snShow.lt-xl',
  'snShow.gt-xs', 'snShow.gt-sm', 'snShow.gt-md', 'snShow.gt-lg',
  'snHide', 'snHide.print',
  'snHide.xs', 'snHide.sm', 'snHide.md', 'snHide.lg', 'snHide.xl',
  'snHide.lt-sm', 'snHide.lt-md', 'snHide.lt-lg', 'snHide.lt-xl',
  'snHide.gt-xs', 'snHide.gt-sm', 'snHide.gt-md', 'snHide.gt-lg'
];

const selector = `
  [snShow], [snShow.print],
  [snShow.xs], [snShow.sm], [snShow.md], [snShow.lg], [snShow.xl],
  [snShow.lt-sm], [snShow.lt-md], [snShow.lt-lg], [snShow.lt-xl],
  [snShow.gt-xs], [snShow.gt-sm], [snShow.gt-md], [snShow.gt-lg],
  [snHide], [snHide.print],
  [snHide.xs], [snHide.sm], [snHide.md], [snHide.lg], [snHide.xl],
  [snHide.lt-sm], [snHide.lt-md], [snHide.lt-lg], [snHide.lt-xl],
  [snHide.gt-xs], [snHide.gt-sm], [snHide.gt-md], [snHide.gt-lg]
`;

/**
 * 'show' Layout API directive
 */
@Directive({selector, inputs})
export class DefaultShowHideDirective extends ShowHideDirective {
  protected override inputs = inputs;
}
