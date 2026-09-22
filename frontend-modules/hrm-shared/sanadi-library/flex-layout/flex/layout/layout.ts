
import {Directive, ElementRef, OnChanges, Injectable, Inject} from '@angular/core';
import {
  BaseDirective2,
  StyleBuilder,
  StyleDefinition,
  StyleUtils,
  MediaMarshaller,
  LAYOUT_CONFIG,
  LayoutConfigOptions,
} from '../../core/public-api';

import {buildLayoutCSS} from '../../_private-utils';

export interface LayoutStyleDisplay {
  readonly display: string;
}

@Injectable({providedIn: 'root'})
export class LayoutStyleBuilder extends StyleBuilder {
  buildStyles(input: string, {display}: LayoutStyleDisplay) {
    const css = buildLayoutCSS(input);
    return {
      ...css,
      display: display === 'none' ? display : css.display,
    };
  }
}

const inputs = [
  'snLayout', 'snLayout.xs', 'snLayout.sm', 'snLayout.md',
  'snLayout.lg', 'snLayout.xl', 'snLayout.lt-sm', 'snLayout.lt-md',
  'snLayout.lt-lg', 'snLayout.lt-xl', 'snLayout.gt-xs', 'snLayout.gt-sm',
  'snLayout.gt-md', 'snLayout.gt-lg'
];
const selector = `
  [snLayout], [snLayout.xs], [snLayout.sm], [snLayout.md],
  [snLayout.lg], [snLayout.xl], [snLayout.lt-sm], [snLayout.lt-md],
  [snLayout.lt-lg], [snLayout.lt-xl], [snLayout.gt-xs], [snLayout.gt-sm],
  [snLayout.gt-md], [snLayout.gt-lg]
`;

/**
 * 'layout' flexbox styling directive
 * Defines the positioning flow direction for the child elements: row or column
 * Optional values: column or row (default)
 * @see https://css-tricks.com/almanac/properties/f/flex-direction/
 *
 */
@Directive()
export class LayoutDirective extends BaseDirective2 implements OnChanges {

  protected override DIRECTIVE_KEY = 'layout';

  constructor(elRef: ElementRef,
              styleUtils: StyleUtils,
              styleBuilder: LayoutStyleBuilder,
              marshal: MediaMarshaller,
              @Inject(LAYOUT_CONFIG) private _config: LayoutConfigOptions) {
    super(elRef, styleBuilder, styleUtils, marshal);
    this.init();
  }

  protected override updateWithValue(input: string) {
    const detectLayoutDisplay = this._config.detectLayoutDisplay;
    const display = detectLayoutDisplay ? this.styler.lookupStyle(this.nativeElement, 'display') : '';
    this.styleCache = cacheMap.get(display) ?? new Map();
    cacheMap.set(display, this.styleCache);

    if (this.currentValue !== input) {
      this.addStyles(input, {display});
      this.currentValue = input;
    }
  }
}

@Directive({selector, inputs})
export class DefaultLayoutDirective extends LayoutDirective {
  protected override inputs = inputs;
}

type CacheMap = Map<string, StyleDefinition>;
const cacheMap = new Map<string, CacheMap>();
