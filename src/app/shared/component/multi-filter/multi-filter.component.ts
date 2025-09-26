import {
  Component,
  ViewEncapsulation,
  Input,
  Output,
  EventEmitter,
  ViewChild,
  ElementRef,
  Renderer2,
} from "@angular/core";

@Component({
  selector: 'app-multi-filter',
  templateUrl: './multi-filter.component.html',
  styleUrl: './multi-filter.component.scss'
})
export class MultiFilterComponent {
  @Input() topics: any;
  @Input() selectedTopic: any[]=[];
  // @Input() filterType: string = "";
  @Input() width?: any;
  @Output() filterApplied = new EventEmitter<any>();
  @Output() filterRemoved = new EventEmitter<any>();

  @ViewChild("dropdownBtnWrapper", { static: false })
  dropdownBtnWrapper!: ElementRef;
  @ViewChild("dropdownListContainer", { static: false })
  dropdownListContainer!: ElementRef;

  constructor(private renderer: Renderer2) {}

  // dropdownSettings = {
  //   singleSelection: false,
  //   idField: "slug",
  //   textField: "value",
  //   selectAllText: "Select All",
  //   unSelectAllText: "Select All",
  //   itemsShowLimit: 2,
  //   allowSearchFilter: false,
  //   enableCheckAll: false,
  // };
  dropdownSettings = {
    displayKey: "value", //if objects array passed which key to be displayed defaults to description
    search: false, //true/false for the search functionlity defaults to false,
    height: "500px", //height of the list so that if there are more no of items it can show a scroll defaults to auto. With auto height scroll will never appear
    placeholder: "All Topics", // text to be displayed when no item is selected defaults to Select,
    //customComparator: ()=>{} // a custom function using which user wants to sort the items. default is undefined and Array.sort() will be used in that case,
    // limitTo: 2, // a number thats limits the no of options displayed in the UI similar to angular's limitTo pipe
    //moreText: 'more' // text to be displayed whenmore than one items are selected like Option 1 + 5 more
    //noResultsFound: 'No results found!', // text to be displayed when no items are found while searching
    //searchPlaceholder:'Search' // label thats displayed in search input
  };
  applyFilter(): void {
    // Check if more than 3 topics are selected
    if (this.selectedTopic.length > 3) {
      // Truncate the selection to 3 topics
      this.selectedTopic = this.selectedTopic.slice(0, 3);
      
      // Show a warning to the user
      console.warn('You can only select up to 3 topics.');
    } else {
      // Emit the selected topics if within the limit
      this.filterApplied.emit(this.selectedTopic);
    }
  }
  

  removeFilter(): void {
    if (this.selectedTopic.length > 0) {
      this.filterApplied.emit(this.selectedTopic);
    } else {
      this.filterRemoved.emit([]);
    }
  }
  clearSelected(e: Event, selected: any): void {
    e.stopPropagation();
    this.selectedTopic = this.selectedTopic.filter(
      (ele: any) => ele.slug !== selected.slug
    );
    // this.selectedTopic = this.selectedTopic;
    this.filterApplied.emit(this.selectedTopic);
  }

  isSelected(item: any): boolean {
    return this.selectedTopic.some(
      (selectedItem: any) => selectedItem.slug === item.slug
    );
  }
}
