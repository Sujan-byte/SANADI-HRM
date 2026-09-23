import {
  Component,
  EventEmitter,
  Input,
  OnChanges,
  OnInit,
  Output,
  SimpleChanges,
  effect,
} from '@angular/core';
import {
  FormControl,
  FormGroup,
  UntypedFormControl,
  UntypedFormGroup,
  Validators,
} from '@angular/forms';
import {
  ConfirmEventType,
  ConfirmationService,
  MessageService,
} from 'primeng/api';
interface IFields {
  type: '';
  name: '';
  validation: any;
  fields?: [];
}
@Component({
  selector: 'dynamic-form-builder',
  templateUrl: './form-builder.component.html',
  styleUrls: ['./form-builder.component.scss'],
})
export class FormBuilderComponent implements OnInit, OnChanges {
  actionStatus: any;
  @Output() onSubmit = new EventEmitter();
  @Output() saveDialogue = new EventEmitter<any>();
  @Output() approvedEvent = new EventEmitter<any>();
  @Output() closeDialogueEvent = new EventEmitter<any>();
  @Output() externalLinkEvent = new EventEmitter<any>();
  @Output() onSuccessFormValue = new EventEmitter<any>();
  @Input() fields: IFields[] | any;
  @Input() fullScreen: boolean = true;
  @Input() buttonLabel: string = 'save';
  @Input() disabled: boolean = false;
  @Input() dialogueFields: any;
  @Input() dialogueHeaderText: any;
  @Input() showDialogueModifier: any;
  @Input() dialogueAttributes: any;
  @Input() approveButton: any;
  @Input() approvedButton: any;
  @Input() externalLinkObject: any;
  @Input() Options: any = [];
  @Input() progressValue: number = 0;
  @Input() successResponse: boolean;
  @Input() formDisabledObject: any;
  @Input() submitLabel: string = 'save_TC';

  @Input() form: UntypedFormGroup | any;
  @Input() isActionNeeded: boolean = false;
  approve: boolean = true;

  @Input() buttons: any = 'Proceed';

  @Output() onValueChange = new EventEmitter();
  @Output() onTabChange = new EventEmitter();

  position: string;

  gfg1: number = 0;
  constructor(
    private confirmationService: ConfirmationService,
    private messageService: MessageService
  ) {
    effect(() => {
      this.onValueChange.emit({
        data: {
          data: null,
          isFormValid: !this.form.valid || this.disabled,
          formFields: this.fields
        },
      });
    }, { allowSignalWrites: true });
  }

  ngOnInit() {
    this.setFormFields();
    this.form.valueChanges.subscribe((res) => {
      this.onValueChange.emit({
        data: {
          data: res,
          isFormValid: !this.form.valid || this.disabled,
          formFields: this.fields
        },
      });
    });
    // console.log("fields", this.fields);
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes && changes['fields'] && changes['fields']?.previousValue) {
      this.setFormFields();
    }
  }

  setFormFields() {
    // console.log('setFormFields', this.fields);
    let fieldsCtrls: any = {};
    for (let f of this.fields) {
      if (
        f?.type === 'fieldset' ||
        f?.type === 'card' ||
        f?.type === 'multi-blocks' ||
        f?.type === 'accordion'
      ) {
        for (let f1 of f?.fields) {
          // console.log("f1",f1)
          if (f1?.type === 'boolean' && f1?.type !== 'fieldset') {
            fieldsCtrls[f1?.name] = new UntypedFormControl(
              f1?.value || false,
              this.mapValidators(f1?.validation)
            );
          } else {
            if (f1?.type != 'checkbox' && f1?.type !== 'fieldset') {
              fieldsCtrls[f1?.name] = new UntypedFormControl(
                f1?.value || '',
                this.mapValidators(f1?.validation)
              );
            } else if (f1?.type === 'fieldset' || f1?.type === 'accordion') {
              for (let f2 of f1?.fields) {
                if (f2?.type === 'boolean') {
                  fieldsCtrls[f2?.name] = new UntypedFormControl(
                    f2?.value || false,
                    this.mapValidators(f2?.validation)
                  );
                } else {
                  if (f2?.type != 'checkbox') {
                    fieldsCtrls[f2?.name] = new UntypedFormControl(
                      f2?.value || '',
                      this.mapValidators(f2?.validation)
                    );
                  }
                }
              }
            }
          }
        }
      } else if (f?.type === 'boolean') {
        fieldsCtrls[f?.name] = new UntypedFormControl(
          f?.value || false,
          this.mapValidators(f?.validation)
        );
      } else {
        if (f?.name && f?.type != 'checkbox') {
          fieldsCtrls[f?.name] = new UntypedFormControl(
            f?.value || '',
            this.mapValidators(f?.validation)
          );
        }
      }
      if (f?.type === 'tab') {
        for (let f1 of f?.fields) {
          for (let f2 of f1?.fields) {
            if (f2?.type === 'dummy') {
              if (f2?.name) {
                fieldsCtrls[f2?.name] = new UntypedFormControl(
                  f2?.value,
                  this.mapValidators(f2?.validation)
                );
              }
            }
            else if (f2?.type === 'boolean' && f2?.type !== 'fieldset') {
              if (f2?.name) {
                fieldsCtrls[f2?.name] = new UntypedFormControl(
                  f2?.value || false,
                  this.mapValidators(f2?.validation)
                );
              }
            } else {
              if (f2?.name) {
                if (f2?.subForm) {
                  let subFieldsCtrls: any = {};
                  if (f2?.subForm?.length > 0) {
                    for (let sub of f2?.subForm) {
                      subFieldsCtrls[sub?.name] = new UntypedFormControl(
                        sub?.value || '',
                        this.mapValidators(sub?.validation)
                      );
                    }
                    fieldsCtrls[f2?.name] = new UntypedFormGroup(subFieldsCtrls);
                  }
                  fieldsCtrls[f2?.name] = new UntypedFormControl(
                    f2?.value || '',
                    this.mapValidators(f2?.validation)
                  );
                } else {
                  if (f2?.type != 'checkbox' && f2?.type !== 'fieldset') {
                    fieldsCtrls[f2?.name] = new UntypedFormControl(
                      f2?.value || '',
                      this.mapValidators(f2?.validation)
                    );
                  }
                }
              }
              if (f2?.type === 'multi-blocks') {
                for (let multiblock of f2?.fields) {
                  fieldsCtrls[multiblock?.name] = new UntypedFormControl(
                    multiblock?.value || '',
                    this.mapValidators(multiblock?.validation)
                  );
                }
              }
              if (f2?.type === 'accordion') {
                for (let sub of f2?.fields) {
                  for (let accord of sub?.fields) {
                    if (accord?.type === 'multi-blocks') {
                      for (let multiblock of accord?.fields) {
                        fieldsCtrls[multiblock?.name] = new UntypedFormControl(
                          multiblock?.value || '',
                          this.mapValidators(multiblock?.validation)
                        );
                      }
                    } else {
                      if (accord?.type === 'dummy') {
                        if (accord?.name) {
                          fieldsCtrls[accord?.name] = new UntypedFormControl(
                            accord?.value,
                            this.mapValidators(accord?.validation)
                          );
                        }
                      } else if (accord?.type === 'boolean') {
                          fieldsCtrls[accord?.name] = new UntypedFormControl(
                            accord?.value || false,
                            this.mapValidators(accord?.validation)
                          );
                      } else {
                        fieldsCtrls[accord?.name] = new UntypedFormControl(
                          accord?.value || '',
                          this.mapValidators(accord?.validation)
                        );
                      }
                    }

                  }
                }
              }
            }
          }
        }
      }
    }
    this.form = new UntypedFormGroup(fieldsCtrls);
    // console.log("this form", this.form);
    // console.log("this fields", this.fields);
  }

  mapValidators(validators: any) {
    const formValidators = [];
    if (validators) {
      for (const validation of Object.keys(validators)) {
        if (validation === 'required') {
          formValidators.push(Validators.required);
        } else if (validation === 'email') {
          formValidators.push(Validators.email);
        } else if (validation === 'minlength') {
          formValidators.push(Validators.minLength(validators[validation]));
        } else if (validation === 'maxlength') {
          formValidators.push(Validators.maxLength(validators[validation]));
        } else if (validation === 'pattern') {
          const patternValue = typeof validators[validation] === 'object' 
            ? validators[validation].value 
            : validators[validation];
          formValidators.push(Validators.pattern(patternValue));
        }
        else if (validation === 'warning') {
          console.log('warning validation added',validators[validation]);
          formValidators.push(() => ({ warning: true }));
        }
      }
    }
    return formValidators;
  }

  showDialog() {
    this.showDialogueModifier = true;
  }

  saveDialogueData(event: any) {
    console.log('form builder', event);
    this.saveDialogue.emit(event);
    this.showDialogueModifier = false;
  }

  handleDialogue(event) {
    this.closeDialogueEvent.emit(event);
    return event;
  }

  approveData() {
    console.log('form builder');
    this.confirmPosition('bottom');
  }

  confirmPosition(position: string) {
    this.position = position;
    console.log('position', position);
    this.confirmationService.confirm({
      message: this.externalLinkObject.message,
      header: this.externalLinkObject.header,
      icon: 'pi pi-info-circle',
      accept: () => {
        this.externalLinkEvent.emit(true);
        this.onSuccessFormValue.emit({
          bool: true,
          formValue: this.form.value,
        });
        this.messageService.add({
          severity: 'info',
          summary: 'Confirmed',
          detail: this.externalLinkObject.acceptDetail,
        });
      },
      reject: (type) => {
        switch (type) {
          case ConfirmEventType.REJECT:
            this.messageService.add({
              severity: 'error',
              summary: 'Rejected',
              detail: this.externalLinkObject.rejectDetail,
            });
            break;
          case ConfirmEventType.CANCEL:
            this.messageService.add({
              severity: 'warn',
              summary: 'Cancelled',
              detail: this.externalLinkObject.cancelDetail,
            });
            break;
        }
      },
      key: 'positionDialog',
    });
  }
}

// setFormFields() {
//   let fieldsCtrls: any = {};

//   for (let field of this.fields) {
//     this.processField(field, fieldsCtrls);
//   }

//   this.form = new UntypedFormGroup(fieldsCtrls);
// }

// processField(field: any, fieldsCtrls: any) {
//   if (this.isContainerField(field)) {
//     this.processContainerField(field, fieldsCtrls);
//   } else {
//     this.createFormControl(field, fieldsCtrls);
//   }
// }

// isContainerField(field: any): boolean {
//   return ['fieldset', 'card', 'multi-blocks', 'accordion', 'tab'].includes(field?.type);
// }

// processContainerField(containerField: any, fieldsCtrls: any) {
//   for (let nestedField of containerField?.fields) {
//     if (containerField?.type === 'tab') {
//       this.processTabField(nestedField, fieldsCtrls);
//     } else {
//       this.createFormControl(nestedField, fieldsCtrls);
//     }
//   }
// }

// processTabField(tabField: any, fieldsCtrls: any) {
//   for (let subTabField of tabField?.fields) {
//     for (let nestedField of subTabField?.fields) {
//       if (nestedField?.type === 'boolean' && nestedField?.type !== 'fieldset') {
//         if (nestedField?.name) {
//           fieldsCtrls[nestedField?.name] = this.createBooleanFormControl(nestedField);
//         }
//       } else {
//         this.processNestedField(nestedField, fieldsCtrls);
//       }
//     }
//   }
// }

// processNestedField(nestedField: any, fieldsCtrls: any) {
//   if (nestedField?.name) {
//     if (nestedField?.subForm) {
//       this.processSubForm(nestedField, fieldsCtrls);
//     } else if (nestedField?.type !== 'checkbox' && nestedField?.type !== 'fieldset') {
//       fieldsCtrls[nestedField?.name] = this.createTextFormControl(nestedField);
//     }
//   }
// }

// processSubForm(subFormField: any, fieldsCtrls: any) {
//   let subFieldsCtrls: any = {};
//   for (let subField of subFormField?.subForm) {
//     subFieldsCtrls[subField?.name] = this.createTextFormControl(subField);
//   }
//   fieldsCtrls[subFormField?.name] = new UntypedFormGroup(subFieldsCtrls);
// }

// createFormControl(field: any, fieldsCtrls: any) {
//   if (field?.type === 'boolean') {
//     fieldsCtrls[field?.name] = this.createBooleanFormControl(field);
//   } else if (field?.name && field?.type !== 'checkbox') {
//     fieldsCtrls[field?.name] = this.createTextFormControl(field);
//   }
// }

// createBooleanFormControl(field: any): UntypedFormControl {
//   return new UntypedFormControl(field?.value || false, this.mapValidators(field?.validation));
// }

// createTextFormControl(field: any): UntypedFormControl {
//   return new UntypedFormControl(field?.value || '', this.mapValidators(field?.validation));
// }
