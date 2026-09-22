// map.component.ts
import { Component, Input, OnInit, ViewEncapsulation, inject } from '@angular/core';
import { UntypedFormGroup } from '@angular/forms';
import * as L from 'leaflet';
// import "leaflet-control-geocoder/dist/Control.Geocoder.css";
import "leaflet-control-geocoder/dist/Control.Geocoder.js";
import { SharedService } from 'src/app/modules/hrm-shared/core/shared/services/shared.service';


@Component({
  selector: 'map',
  templateUrl: './map.component.html',
  styleUrls: ['./map.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class MapComponent implements OnInit {
  @Input() field: any = {};
  @Input() form: UntypedFormGroup | any;

  map: L.Map;
  marker: L.Marker;
  displayAddress: any;

  private _sharedService = inject(SharedService)

  ngOnInit() {
    // setTimeout(() => {
      this.initMap();
    this.initGeocoder();
    // }, 2000);
    
  }

  private async initMap() {
    const lat = this.field.value?.lat || 0;
    const lng = this.field.value?.lng || 0;
    this.map = L.map('map').setView([lat, lng], 13);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
    }).addTo(this.map);
    this.marker = L.marker([lat, lng], {
      icon: L.icon({
        iconUrl: '../../../../../assets/images/custom-loc-icon.jpg',
        iconSize: [50, 50],
        iconAnchor: [16, 32],
        popupAnchor: [0, -32],
    }),
      draggable: true,
    }).addTo(this.map);
    // Attach drag events to the marker if not already attached
    //   if (!this.marker.hasEventListeners('drag')) {
    //    this.marker.on('drag', this.onMarkerDrag);
    //  }
    if (!this.marker.hasEventListeners('dragend')) {
      this.marker.on('dragend', this.onMarkerDragEnd);
    }
    await this.reverseGenCode(lat, lng);
  }


  findUserLocation() {
    // Listen for the 'locationfound' event only once
    this.map.locate({ setView: true, maxZoom: 16 });
    // Listen for the 'locationfound' event
    this.map.on('locationfound', async (event) => {
      const { lat, lng } = event.latlng;
      // Update the marker's position
      this.marker.setLatLng([lat, lng]);
      await this.updateForm(lat, lng);
      // Reverse geocode using Nominatim
      await this.reverseGenCode(lat, lng);
      // Remove the event listener if you only wfant to update the marker once
      this.map.off('locationfound');
    });
  }

  // map.component.ts
  initGeocoder() {
    const geocoder = L.Control.geocoder({
      collapsed: false,
      defaultMarkGeocode: false,
      placeholder: 'Search for a location...',
      showResultIcons: true
    }).addTo(this.map);

    // Handle the 'markgeocode' event
    geocoder.on('markgeocode', async (event) => {
      const { center } = event.geocode;
      const { lat, lng } = center;
      // Update the marker's position
      this.updateForm(lat, lng);
      this.marker.setLatLng([lat, lng]);
      // Reverse geocode using Nominatim
      await this.reverseGenCode(lat, lng);
      this.map.setView(center, this.map.getZoom());
    });
  }


  reverseGenCode(lat, lng) {
    this._sharedService.reverseGeocode(lat, lng).subscribe((address: any) => {
      this.displayAddress = address?.display_name;
    });
  }


  // Handle drag event
  private onMarkerDrag = async (event: L.LeafletEvent) => {
    const latlng = this.marker.getLatLng();
    await this.reverseGenCode(latlng.lat, latlng.lng);
  }

  // Handle dragend event
  private onMarkerDragEnd = async (event: L.LeafletEvent) => {
    const latlng = this.marker.getLatLng();
    await this.reverseGenCode(latlng.lat, latlng.lng);
    this.updateForm(latlng.lat, latlng.lng);
  }

  private updateForm(lat, lng) {
    const warehouseControl = this.form.get(this.field.name);
    if (warehouseControl) {
      warehouseControl.setValue({ lat, lng });
    }
  }
}





// var customIcon = L.Icon.extend({
//   options: {
//       iconSize: [40, 40],     
//       iconAnchor: [20, 40],   
//       popupAnchor: [0, -40]  
//   }
// });


// var iconUrl = '';


// var customMarkerIcon = new customIcon({iconUrl: iconUrl});


// var marker = L.marker([lat,lng], {icon: customMarkerIcon}).addTo(map);