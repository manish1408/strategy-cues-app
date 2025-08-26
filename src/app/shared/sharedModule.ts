import { CommonModule } from "@angular/common";
import { CUSTOM_ELEMENTS_SCHEMA, NgModule } from "@angular/core";
import { FormsModule, ReactiveFormsModule } from "@angular/forms";
import { RouterModule } from "@angular/router";

import { ClickOutsideDirective } from "../_directives/click-outside.directive";

import { SelectDropDownModule } from "ngx-select-dropdown";
import { MultiFilterComponent } from "./component/multi-filter/multi-filter.component";

import { TypeaheadModule } from "ngx-bootstrap/typeahead";

import { MarkdownModule, MARKED_OPTIONS, MarkedRenderer } from "ngx-markdown";
import { NgxEditorModule } from "ngx-editor";
import { PhoneDropdownComponent } from "./component/phone-dropdown/phone-dropdown.component";
// import { PhoneDropdownMiloComponent } from "./component/phone-dropdown-milo/phone-dropdown-milo.component";

const renderer = new MarkedRenderer();
renderer.link = (href: string, title: string, text: string) => {
  return `<a href="${href}" target="_blank" rel="noopener noreferrer"${
    title ? ` title="${title}"` : ""
  }>${text}</a>`;
};

@NgModule({
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    ReactiveFormsModule,
    SelectDropDownModule,
    TypeaheadModule,
    MarkdownModule.forRoot({
      markedOptions: {
        provide: MARKED_OPTIONS,
        useValue: {
          renderer: renderer,
          gfm: true,
          breaks: false,
          pedantic: false,
          smartLists: true,
          smartypants: false,
        },
      },
    }),
    NgxEditorModule,
  ],
  declarations: [
    PhoneDropdownComponent,
    ClickOutsideDirective,
    MultiFilterComponent,
    // PhoneDropdownMiloComponent
  ],
  providers: [],
  exports: [
    PhoneDropdownComponent,
    ClickOutsideDirective,
    MultiFilterComponent,
    // PhoneDropdownMiloComponent,
   
  ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class SharedModule {}
