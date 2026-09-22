import { Component, Input } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import * as saveAs from 'file-saver';
import { NgxSpinnerService } from 'ngx-spinner';
import EditorJS from '@editorjs/editorjs';
import { ButtonModule } from 'primeng/button';

@Component({
  selector: 'sanadi-career-letter-print',
  standalone: true,
  imports: [ButtonModule],
  templateUrl: './career-letter-print.component.html',
  styleUrl: './career-letter-print.component.scss'
})
export class CareerLetterPrintComponent {
  @Input() field: any = {};
  sanitizedHTML: SafeHtml;
  editor: EditorJS = undefined;
  editerReadonly: boolean = false;
  editorHTML: string;
  constructor(private spinner: NgxSpinnerService, private sanitizer: DomSanitizer) {
  }

  ngOnInit(): void {
  setTimeout(() => {
    var redactorDivs = document.getElementsByClassName('codex-editor__redactor');
    for (var i = 0; i < redactorDivs.length; i++) {
      var redactorDiv = redactorDivs[i] as HTMLElement;;
      // console.log('addsdjjj', redactorDivs[i]);
      redactorDiv.style.padding = '0px';
    }
  }, 1000)
  
  this.convertToHTML(this.field.value.subject_template);

}

convertToHTML(editorData: any): SafeHtml {
  let htmlContent = '';
  try {
    // const parsedData = JSON.parse(editorData);
    const parsedData = editorData;
    parsedData.blocks.forEach(block => {
      switch (block.type) {
        case 'paragraph':
          htmlContent += `<p  style="text-align: justify; "  >${block.data.text}</p>`;
          break;
        case 'header':
          htmlContent += `<h${block.data.level}  style="font-weight: 600; ">${block.data.text}</h${block.data.level}>`;
          break;
        case 'list':
          const listType = block.data.style === 'ordered' ? 'ol' : 'ul';
          const items = block.data.items.map(item => `<li>${item}</li>`).join('');
          htmlContent += `<${listType}>${items}</${listType}>`;
          break;
        case 'table':
          htmlContent += '<table style="border-collapse: collapse; border: 1px solid black; width: 100%; ">';
          block.data.content.forEach((row, rowIndex) => {
            htmlContent += '<tr>';
            row.forEach((cell, cellIndex) => {
              const cellTag = block.data.withHeadings && rowIndex === 0 ? 'th' : 'td';
              const cellStyle = block.data.withHeadings && rowIndex === 0 ? 'font-weight: 600;' : 'text-align: justify;';
              htmlContent += `<${cellTag} style="border: 1px solid black; padding: 8px; ${cellStyle}">${cell}</${cellTag}>`;
            });
            htmlContent += '</tr>';
          });
          htmlContent += '</table>';
          break;
      }
    });
    return this.sanitizer.bypassSecurityTrustHtml(htmlContent);
  } catch (error) {
    console.error('Error converting to HTML:', error);
    return '';
  }
}

exportToWord() {
  if (this.field.value) {
    let combinedHTML = `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <title>Exported Document</title>
        </head>
        <body>
    `;
    const value = this.convertToHTML(this.field.value.subject_template);
    combinedHTML += `
        ${value}
    `;


    this.sanitizedHTML = this.sanitizer.bypassSecurityTrustHtml(combinedHTML);
    // Save the sanitized HTML content to a file (you can modify this part as needed)
    const blob = new Blob(['\ufeff', combinedHTML], { type: 'application/msword' });
    saveAs(blob, `${this.field.value.first_name}.doc`);
  } else {
    console.error('this.field.value is not defined or null');
  }
}
}
