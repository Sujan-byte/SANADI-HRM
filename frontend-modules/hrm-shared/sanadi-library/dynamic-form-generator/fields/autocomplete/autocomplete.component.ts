import { Component, Input, OnInit } from '@angular/core';
import { UntypedFormGroup } from '@angular/forms';

@Component({
  selector: 'autocomplete',
  templateUrl: './autocomplete.component.html',
  styleUrls: ['./autocomplete.component.scss']
})
export class AutocompleteComponent implements OnInit {
  @Input() field: any = {};
  @Input() form: UntypedFormGroup | any;
  filterlist: any[] = [];
  get isValid() { 
    return this.form?.controls[this.field.name].valid; 
  }
  get isDirty() { 
    return this.form?.controls[this.field.name].dirty; 
  }
  constructor() { }

  ngOnInit(): void {
    this.getListItems();
  }

  getListItems() {
    // this.countryService.getCountries().then(countries => {
    //   this.countries = countries;
    // });
  }

  filterListItems($event: any) {
    //in a real application, make a request to a remote url with the query and return filtered results, for demo we filter at client side
    // let filtered: any[] = [];
    // let query = event.query;
    // for (let i = 0; i < this.countries.length; i++) {
    //   let country = this.countries[i];
    //   if (country.name.toLowerCase().indexOf(query.toLowerCase()) == 0) {
    //     filtered.push(country);
    //   }
    // }

    // this.filteredCountries = filtered;
  }

}
