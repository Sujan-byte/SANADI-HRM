
import {NgModule} from '@angular/core';
import {BidiModule} from '@angular/cdk/bidi';
import {CoreModule} from '../core/module';

import {DefaultLayoutDirective} from './layout/layout';
import {DefaultLayoutGapDirective} from './layout-gap/layout-gap';
import {DefaultFlexDirective} from './flex/flex';
import {DefaultFlexOrderDirective} from './flex-order/flex-order';
import {DefaultFlexOffsetDirective} from './flex-offset/flex-offset';
import {DefaultFlexAlignDirective} from './flex-align/flex-align';
import {FlexFillDirective} from './flex-fill/flex-fill';
import {DefaultLayoutAlignDirective} from './layout-align/layout-align';


const ALL_DIRECTIVES = [
  DefaultLayoutDirective,
  DefaultLayoutGapDirective,
  DefaultLayoutAlignDirective,
  DefaultFlexOrderDirective,
  DefaultFlexOffsetDirective,
  FlexFillDirective,
  DefaultFlexAlignDirective,
  DefaultFlexDirective,
];

/**
 * *****************************************************************
 * Define module for the Flex API
 * *****************************************************************
 */

@NgModule({
  imports: [CoreModule, BidiModule],
  declarations: [...ALL_DIRECTIVES],
  exports: [...ALL_DIRECTIVES]
})
export class FlexModule {
}
