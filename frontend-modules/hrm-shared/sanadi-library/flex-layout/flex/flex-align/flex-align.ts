
import {Directive, ElementRef, Injectable} from '@angular/core';
import {
  MediaMarshaller,
  BaseDirective2,
  StyleBuilder,
  StyleDefinition,
  StyleUtils,
} from '../../core/public-api';

@Injectable({providedIn: 'root'})
export class FlexAlignStyleBuilder extends StyleBuilder {
  buildStyles(input: string) {
    input = input || 'stretch';
    const styles: StyleDefinition = {};

    // Cross-axis
    switch (input) {
      case 'start':
        styles['align-self'] = 'flex-start';
        break;
      case 'end':
        styles['align-self'] = 'flex-end';
        break;
      default:
        styles['align-self'] = input;
        break;
    }

    return styles;
  }
}

const inputs = [
  'snFlexAlign', 'snFlexAlign.xs', 'snFlexAlign.sm', 'snFlexAlign.md',
  'snFlexAlign.lg', 'snFlexAlign.xl', 'snFlexAlign.lt-sm', 'snFlexAlign.lt-md',
  'snFlexAlign.lt-lg', 'snFlexAlign.lt-xl', 'snFlexAlign.gt-xs', 'snFlexAlign.gt-sm',
  'snFlexAlign.gt-md', 'snFlexAlign.gt-lg'
];
const selector = `
  [snFlexAlign], [snFlexAlign.xs], [snFlexAlign.sm], [snFlexAlign.md],
  [snFlexAlign.lg], [snFlexAlign.xl], [snFlexAlign.lt-sm], [snFlexAlign.lt-md],
  [snFlexAlign.lt-lg], [snFlexAlign.lt-xl], [snFlexAlign.gt-xs], [snFlexAlign.gt-sm],
  [snFlexAlign.gt-md], [snFlexAlign.gt-lg]
`;

/**
 * 'flex-align' flexbox styling directive
 * Allows element-specific overrides for cross-axis alignments in a layout container
 * @see https://css-tricks.com/almanac/properties/a/align-self/
 */
@Directive()
export class FlexAlignDirective extends BaseDirective2 {

  protected override DIRECTIVE_KEY = 'flex-align';

  constructor(elRef: ElementRef,
              styleUtils: StyleUtils,
              styleBuilder: FlexAlignStyleBuilder,
              marshal: MediaMarshaller) {
    super(elRef, styleBuilder, styleUtils, marshal);
    this.init();
  }

  protected override styleCache = flexAlignCache;
}

const flexAlignCache: Map<string, StyleDefinition> = new Map();

@Directive({selector, inputs})
export class DefaultFlexAlignDirective extends FlexAlignDirective {
  protected override inputs = inputs;
}
