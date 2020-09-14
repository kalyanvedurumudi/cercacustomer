import {
  NativeGeocoder,
  NativeGeocoderResult,
  NativeGeocoderOptions,
} from '@ionic-native/native-geocoder/ngx';
import { environment } from './../../../environments/environment.prod';
import { UtilService } from './../../service/util.service';
import { ApiService } from './../../service/api.service';
import { GroceryService } from './../../service/grocery.service';
import { NavController } from '@ionic/angular';
import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { mapStyle } from './../../../environments/environment.prod';

@Component({
  selector: 'app-grocery-cart',
  templateUrl: './grocery-cart.page.html',
  styleUrls: ['./grocery-cart.page.scss'],
})
export class GroceryCartPage implements OnInit {
  event = 'delivery';
  cartData: any = [];
  data: any = {};
  shop: any = {};
  store: any = {};
  cuurecy: any;
  chaneAddress = false;
  icons: any = {};
  FindAddress: any;
  radius: any;
  charge: any;
  totalItem: any = 0;
  toPay: any = 0;
  public agmMap: any = {};
  public origin: any = {};
  public destination: any = {};
  saving: any = 0;
  delivery_charge: any = 0;
  delivery_type: any;
  public renderOptions = {
    suppressMarkers: true,
  };
  public styles = mapStyle;
  public markerOptions = {
    origin: {
      icon: '../../../assets/image/map_start.png',
    },
    destination: {
      icon: '../../../assets/image/map.png',
    },
    draggable: true,
  };
  constructor(
    private nav: NavController,
    private gpi: GroceryService,
    private api: ApiService,
    private util: UtilService,
    private nativeGeocoder: NativeGeocoder
  ) {
    this.cuurecy = this.api.currency;
    this.cartData = this.gpi.cartData;
    this.data = JSON.parse(localStorage.getItem('store-detail'));
    this.store = this.data[0].shop;
    this.data.forEach((element) => {
      this.totalItem += element.salePrice * element.qty;
    });

    this.toPay =
      this.totalItem +
      (parseFloat(this.store.shopDelivery) || 0) -
      (this.data.discount || 0);

    this.data.toPay = this.toPay;

    this.util.startLoad();

    //this.store = res.data;
    this.charge = parseFloat(this.store.shopDelivery);
    if (this.store.delivery_type == 'Shop') {
      this.event = 'pickup';
      this.store.shopDelivery = 0;
    } else if (this.store.delivery_type == 'Home') {
      this.event = 'delivery';
    } else {
      this.event = 'delivery';
    }
    this.toPay =
      this.totalItem +
      (parseFloat(this.store.shopDelivery) || 0) -
      (this.data.discount || 0);
    this.data.toPay = this.toPay;
    const addressdata: any = JSON.parse(localStorage.getItem('address'));
    //  alert(addressdata.address);
    this.data.Deafult_address = addressdata;
    this.mapData();
    this.data.userlat = addressdata.location[0];
    this.data.userlang = addressdata.location[1];

  }
  ionViewWillEnter() {
    if (this.gpi.promocode) {
      this.countDiscount();
    }
    if (this.chaneAddress) {
      this.util.startLoad();
      this.api
        .getDataWithToken('getAddress/' + localStorage.getItem('isaddress'))
        .subscribe(
          (res: any) => {
            if (res.success) {
              this.data.Deafult_address = res.data;
              this.mapData();
            }
            this.util.dismissLoader();
          },
          (err) => {
            this.util.dismissLoader();
          }
        );
    }
  }
  initMap() { }
  ngOnInit() { }
  paymentMethod() {
    if (this.data.length) {
      if (this.event == 'delivery') {
        this.delivery_type = 'Home';
      } else {
        this.delivery_type = 'Shop';
      }
      if (this.delivery_type == 'Home') {
        this.radius = this.distance(
          this.data.userlat,
          this.data.userlang,
          this.store.latitude,
          this.store.longitude,
          'k'
        );
        if (this.radius <= this.store.radius) {
          this.gpi.cartData = this.data;

          this.delivery_type = this.event;
          this.data.delivery_type = this.delivery_type;
          this.delivery_charge = this.store.delivery_charge;
          this.data.delivery_charge = this.delivery_charge;
          this.gpi.info = this.data;

          this.nav.navigateForward('/pay-method');
        } else {
          this.gpi.cartData = this.data;

          this.delivery_type = this.event;
          this.data.delivery_type = this.delivery_type;
          this.delivery_charge = this.store.delivery_charge;
          this.data.delivery_charge = this.delivery_charge;
          this.gpi.info = this.data;

          this.nav.navigateForward('/pay-method');
        }
      } else {
        this.gpi.cartData = this.data;

        this.data.delivery_type = this.event;
        this.delivery_charge = this.store.delivery_charge;
        this.data.delivery_charge = this.delivery_charge;
        this.gpi.info = this.data;
        this.nav.navigateForward('/pay-method');
      }
    } else {
      this.gpi.promocode = {};
      this.nav.back();
    }
  }

  applyCoupon() {
    if (this.data.length) {
      this.nav.navigateForward('grocery-promocode');
    } else {
      this.nav.back();
    }
  }

  countDiscount() {
    if (this.gpi.promocode.type == 'amount') {
      this.data.discount = this.gpi.promocode.discount;
    } else {
      this.data.discount = this.totalItem * this.gpi.promocode.discount;
      this.data.discount = this.data.discount / 100;
    }

    this.saving = this.data.discount;
    this.toPay =
      this.totalItem + this.store.delivery_charge - this.data.discount;
    this.data.toPay = this.toPay;
  }
  addtocart(item) {
    item.qty = item.qty + 1;
    item.total = item.qty * item.salePrice;

    this.cartData = JSON.parse(localStorage.getItem('store-detail')) || [];

    if (this.cartData.length > 0) {
      this.cartData.forEach((element, index) => {
        if (element.id === item.id) {
          this.cartData.splice(index, 1);
        }
      });
      this.cartData.push(item);
    } else {
      this.cartData.push(item);
    }

    localStorage.setItem('store-detail', JSON.stringify(this.cartData));

    this.totalItem += item.salePrice;
    item.total = item.salePrice * item.qty;
    if (this.gpi.promocode) {
      this.countDiscount();
    }
    this.toPay =
      this.totalItem +
      (parseFloat(this.store.shopDelivery) || 0) -
      (this.data.discount || 0);
    this.data.toPay = this.toPay;
  }

  minusQty(item) {
    let equalIndex;
    if (item.qty != 1) {
      item.qty--;
      this.totalItem -= item.salePrice;
      this.toPay =
        this.totalItem +
        (parseFloat(this.store.shopDelivery) || 0) -
        (this.data.discount || 0);
      this.data.toPay = this.toPay;
      item.total = item.qty * item.salePrice;

      localStorage.setItem('store-detail', JSON.stringify(this.cartData));
    } else {
      let equalIndex;
      this.cartData.forEach((element, ind) => {
        if (element.id == item.id) {
          equalIndex = ind;
        }
      });
      if (equalIndex >= 0) {
        if (item.qty == 0) {
          item.qty = 0;
          this.cartData.splice(equalIndex, 1);
          this.totalItem -= item.salePrice;
          item.total = item.qty * item.salePrice;
          this.toPay =
            this.totalItem +
            (parseFloat(this.store.shopDelivery) || 0) -
            (this.data.discount || 0);
          this.data.toPay = this.toPay;
          localStorage.setItem('store-detail', JSON.stringify(this.cartData));
        } else {
          this.cartData[equalIndex] = item;
          item.total = item.qty * item.salePrice;
          item.total = item.qty * item.salePrice;
          this.toPay =
            this.totalItem +
            (parseFloat(this.store.shopDelivery) || 0) -
            (this.data.discount || 0);
          this.data.toPay = this.toPay;
        }
      }
    }
    if (this.gpi.promocode) {
      this.countDiscount();
    }
  }

  change_Address() {
    this.chaneAddress = true;
    this.nav.navigateForward('/select-address');
  }
  distance(lat1, lon1, lat2, lon2, unit) {
    if (lat1 == lat2 && lon1 == lon2) {
      return 0;
    } else {
      let radlat1 = (Math.PI * lat1) / 180;
      let radlat2 = (Math.PI * lat2) / 180;
      let theta = lon1 - lon2;
      let radtheta = (Math.PI * theta) / 180;
      let dist =
        Math.sin(radlat1) * Math.sin(radlat2) +
        Math.cos(radlat1) * Math.cos(radlat2) * Math.cos(radtheta);
      if (dist > 1) {
        dist = 1;
      }
      dist = Math.acos(dist);
      dist = (dist * 180) / Math.PI;
      dist = dist * 60 * 1.1515;
      if (unit == 'K') {
        dist = dist * 1.609344;
      }
      if (unit == 'N') {
        dist = dist * 0.8684;
      }
      return dist;
    }
  }
  segmentChanged() {
    if (this.event == 'pickup') {
      this.store.shopDelivery = 0;

      this.toPay =
        this.totalItem +
        (parseFloat(this.store.shopDelivery) || 0) -
        (this.data.discount || 0);
      this.data.toPay = this.toPay;

      if (this.gpi.promocode) {
        this.countDiscount();
      }
    } else {
      this.store.shopDelivery = this.charge;

      this.toPay =
        this.totalItem +
        (parseFloat(this.store.shopDelivery) || 0) -
        (this.data.discount || 0);
      this.data.toPay = this.toPay;
      if (this.gpi.promocode) {
        this.countDiscount();
      }
    }
  }
  mapData() {
    this.FindAddress =
      this.data.Deafult_address.address +
      ' ' +
      this.data.Deafult_address.area +
      ' ' +
      this.data.Deafult_address.city ;
    let options: NativeGeocoderOptions = {
      useLocale: true,
      maxResults: 5,
    };
    this.nativeGeocoder
      .forwardGeocode(this.FindAddress, options)
      .then((result: NativeGeocoderResult[]) => {
     
        this.agmMap = {
          lat: parseFloat(result[0].latitude),
          lng: parseFloat(result[0].longitude),
        };
        this.destination = {
          lat: parseFloat(this.store.latitude),
          lng: parseFloat(this.store.longitude),
        };
        this.origin = {
          lat: parseFloat(result[0].latitude),
          lng: parseFloat(result[0].longitude),
        };
      })
      .catch((error: any) => console.log(error));
  }
}
