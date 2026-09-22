
import {Directive, ElementRef, OnChanges, Injectable} from '@angular/core';
import {
  BaseDirective2,
  StyleBuilder,
  StyleDefinition,
  StyleUtils,
  MediaMarshaller,
} from '../../core/public-api';

@Injectable({providedIn: 'root'})
export class FlexOrderStyleBuilder extends StyleBuilder {
  buildStyles(value: string) {
    return {order: (value && parseInt(value, 10)) || ''};
  }
}

const inputs = [
  'snFlexOrder', 'snFlexOrder.xs', 'snFlexOrder.sm', 'snFlexOrder.md',
  'snFlexOrder.lg', 'snFlexOrder.xl', 'snFlexOrder.lt-sm', 'snFlexOrder.lt-md',
  'snFlexOrder.lt-lg', 'snFlexOrder.lt-xl', 'snFlexOrder.gt-xs', 'snFlexOrder.gt-sm',
  'snFlexOrder.gt-md', 'snFlexOrder.gt-lg'
];
const selector = `
  [snFlexOrder], [snFlexOrder.xs], [snFlexOrder.sm], [snFlexOrder.md],
  [snFlexOrder.lg], [snFlexOrder.xl], [snFlexOrder.lt-sm], [snFlexOrder.lt-md],
  [snFlexOrder.lt-lg], [snFlexOrder.lt-xl], [snFlexOrder.gt-xs], [snFlexOrder.gt-sm],
  [snFlexOrder.gt-md], [snFlexOrder.gt-lg]
`;

/**
 * 'flex-order' flexbox styling directive
 * Configures the positional ordering of the element in a sorted layout container
 * @see https://css-tricks.com/almanac/properties/o/order/
 */
@Directive()
export class FlexOrderDirective extends BaseDirective2 implements OnChanges {

  protected override DIRECTIVE_KEY = 'flex-order';

  constructor(elRef: ElementRef,
              styleUtils: StyleUtils,
              styleBuilder: FlexOrderStyleBuilder,
              marshal: MediaMarshaller) {
    super(elRef, styleBuilder, styleUtils, marshal);
    this.init();
  }

  protected override styleCache = flexOrderCache;
}

const flexOrderCache: Map<string, StyleDefinition> = new Map();

@Directive({selector, inputs})
export class DefaultFlexOrderDirective extends FlexOrderDirective {
  protected override inputs = inputs;
}
