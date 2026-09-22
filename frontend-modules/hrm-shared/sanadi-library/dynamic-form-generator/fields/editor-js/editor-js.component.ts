import { CommonModule } from '@angular/common';
import { Component, Input, OnInit } from '@angular/core';
import { FormsModule, UntypedFormGroup } from '@angular/forms';
import EditorJS from '@editorjs/editorjs';
import { OutputData } from '@editorjs/editorjs';
import Embed from "@editorjs/embed";
import Table from "@editorjs/table";
import List from "@editorjs/list";
import Warning from "@editorjs/warning";
import Code from "@editorjs/code";
import LinkTool from "@editorjs/link";
import Image from "@editorjs/image";
import Raw from "@editorjs/raw";
import Header from "@editorjs/header";
import Quote from "@editorjs/quote";
import Marker from "@editorjs/marker";
import CheckList from "@editorjs/checklist";
import Delimiter from "@editorjs/delimiter";
import InlineCode from "@editorjs/inline-code";
import SimpleImage from "@editorjs/simple-image";
import NestedList from "@editorjs/nested-list";
import editorjsNestedChecklist from "@calumk/editorjs-nested-checklist";
import { Observable, debounceTime, distinctUntilChanged, pairwise, startWith } from 'rxjs';

export const EDITOR_JS_TOOLS = {
  embed: Embed,
  table: Table,
  marker: Marker,
  list: NestedList,
  warning: Warning,
  code: Code,
  linkTool: LinkTool,
  image: Image,
  raw: Raw,
  header: Header,
  quote: Quote,
  checklist: CheckList,
  nestedchecklist: editorjsNestedChecklist,
  delimiter: Delimiter,
  inlineCode: InlineCode,
  simpleImage: SimpleImage,
};

@Component({
  selector: 'sanadi-editor-js',
  templateUrl: './editor-js.component.html',
  styleUrl: './editor-js.component.scss'
})
export class EditorJsComponent implements OnInit {
  @Input() field: any = {};
  @Input() form: UntypedFormGroup;
  @Input() formFields: any;

  editorREADONLY: EditorJS;
  editor: EditorJS = undefined;
  isDrawTable: boolean;

  async ngOnInit(): Promise<void> {
    this.onValueChanges();
    const initialData: OutputData = this.field.value ? this.field.value : {};
    await this.initEditorJS(initialData);
  }

  async initEditorJS(data) {
    if (this.editor) {
      await this.editor.destroy();
    }

    this.editor = new EditorJS({
      holder: 'editorjs',
      inlineToolbar: true,
      tools: EDITOR_JS_TOOLS,
      data: data,
      onChange: () => {
        // Save the content whenever it changes
        this.saveEditorContent();
      }
    });
    this.field['editor'] = this.editor;
  }

  async saveEditorContent() {
    const savedData: OutputData = await this.editor?.save();
    this.form?.get(this.field.name)?.setValue(savedData);
  }

  onValueChanges() {
    if (typeof (this.field?.onValueChange) === 'function') {
      this.form.get(this.field.name)
        .valueChanges
        .pipe(debounceTime(500), startWith(null), distinctUntilChanged(), pairwise())
        .subscribe(async ([prev, next]: [any, any]) => {
          const value = await this.field?.onValueChange(prev, next, this.form.value, this.formFields);
          console.log("out patch value dropdown", value)

          if (value) {
            const name = this.field.name;
            if (typeof value[name] == 'string') {
              value[name] = JSON.parse(value[name])
            }
            await this.initEditorJS(value[name]);
            // this.form.patchValue(value);
            // this.form?.get(this.field.name)?.setValue(value[name]);
          }
        });
    }
  }

  onDrawTable() {
    this.isDrawTable = true
  }

  async onRefresh(event: any) {
    if (typeof this.field?.onRefresh === 'function') {
      const result = await this.field?.onRefresh(event, this.form.value, this.field, this.formFields);
      if (result) {
        this.form.patchValue(result);
      }
    }
  }
}
