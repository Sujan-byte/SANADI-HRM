
import {NgModule} from '@angular/core';
import {CoreModule} from '../core/public-api';

import {DefaultImgSrcDirective} from './img-src/img-src';
import {DefaultClassDirective} from './class/class';
import {DefaultShowHideDirective} from './show-hide/show-hide';
import {DefaultStyleDirective} from './style/style';


const ALL_DIRECTIVES = [
  DefaultShowHideDirective,
  DefaultClassDirective,
  DefaultStyleDirective,
  DefaultImgSrcDirective,
];

/**
 * *****************************************************************
 * Define module for the Extended API
 * *****************************************************************
 */

@NgModule({
  imports: [CoreModule],
  declarations: [...ALL_DIRECTIVES],
  exports: [...ALL_DIRECTIVES]
})
export class ExtendedModule {
}
