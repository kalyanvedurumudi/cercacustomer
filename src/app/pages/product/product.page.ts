import { GroceryService } from './../../service/grocery.service';
import { UtilService } from './../../service/util.service';
import { ApiService } from './../../service/api.service';
import { ProductFilterPage } from './../product-filter/product-filter.page';
import { NavController, PopoverController } from '@ionic/angular';
import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-product',
  templateUrl: './product.page.html',
  styleUrls: ['./product.page.scss'],
})
export class ProductPage implements OnInit {
  Store: any = [];
  currency: any;
  data: any = [];
  cartData: any = [];
  sortType: any = 'lowtohigh';
  constructor(
    private nav: NavController,
    private popoverController: PopoverController,
    private api: ApiService,
    private util: UtilService,
    private gpi: GroceryService
  ) {
    this.currency = this.api.currency;

    this.data = JSON.parse(localStorage.getItem('store-detail'));
  }

  ngOnInit() { }
  ionViewWillEnter() {
    this.util.startLoad();
    //alert(localStorage.getItem('store-detail'));
    //alert(this.gpi.storeID);
    if (localStorage.getItem('allitems') == 'N') {
      this.api.getDataWithToken('products/search?shopId=' + this.gpi.storeID + '&page=1&take=1000&q=&categoryId=').subscribe(
        (res: any) => {
          if (res) {
            this.util.dismissLoader();
            this.Store = res.data.items;
            console.log(this.Store);

            this.cartData = this.gpi.cartData;
            this.getdata();
          }
        },
        (err) => {
          this.util.dismissLoader();
        }
      );
    } else {
      if (this.gpi.catId) {

        this.api.getDataWithToken('products/search?page=1&take=1000' +
          '&sort=&sortType=&q=&categoryId=' + this.gpi.catId + '&shopId=&featured=&hot=&bestSell=' +
          '&dailyDeal=&soldOut=&discounted=').subscribe(
            (res: any) => {
              if (res) {
                this.util.dismissLoader();
                this.Store = res.data.items;
                // alert(this.Store.length);
                console.log(this.Store);

                this.cartData = this.gpi.cartData;
                this.getdata();
              }
            },
            (err) => {
              this.util.dismissLoader();
            }
          );

      } else {
        this.api.getDataWithToken('products/search?page=1&take=1000' +
          '&sort=&sortType=&q=&categoryId=&shopId=&featured=&hot=&bestSell=' +
          '&dailyDeal=&soldOut=&discounted=').subscribe(
            (res: any) => {
              if (res) {
                this.util.dismissLoader();
                this.Store = res.data.items;
                // alert(this.Store.length);
                console.log(this.Store);

                this.cartData = this.gpi.cartData;
                this.getdata();
              }
            },
            (err) => {
              this.util.dismissLoader();
            }
          );
      }
    }
  }
  storeDetail(item) {
    this.gpi.itemId = item.id;
    localStorage.removeItem('productname');
    localStorage.setItem('productname', item.alias);
    this.nav.navigateForward('/product-detail');
  }
  async presentPopover(ev: any) {
    const popover = await this.popoverController.create({
      component: ProductFilterPage,
      componentProps: {
        sortType: this.sortType,
      },
      cssClass: 'product_filter',
      event: ev,
      backdropDismiss: false,
      translucent: true,
    });
    popover.onWillDismiss().then((res) => {
      if (res.data) {
        if (res.data == 'hightolow') {
          this.Store.sort((a, b) => (a.salePrice < b.salePrice ? 1 : -1));
          this.sortType = 'hightolow';
        } else {
          this.Store.sort((a, b) => (a.salePrice > b.salePrice ? 1 : -1));
          this.sortType = 'lowtohigh';
        }
      }
    });
    return await popover.present();
  }
  getdata() {
    if (this.gpi.cartData) {
      if (this.gpi.cartData.length >= 0) {
        if (this.Store) {
          this.cartData =
            JSON.parse(localStorage.getItem('store-detail')) || [];
          this.Store.forEach((el1) => {
            el1.qty = 0;
            const fCart = this.cartData.find((x) => x.id == el1.id);
            if (fCart) {
              el1.qty = fCart.qty;
            }
          });
        }
      } else {
        this.Store.forEach((el1) => {
          el1.qty = 0;
        });
      }
    } else {
      this.Store.forEach((element) => {
        element.qty = 0;
      });
    }
  }
  AddCart(item) {

    item.qty = item.qty + 1;
    item.total = item.qty * item.salePrice;
    this.cartData = JSON.parse(localStorage.getItem('store-detail')) || [];
    let itemfromsamestore: any = 0;
    if (this.cartData.length == 0) {
      itemfromsamestore = 1;
    } else {
      this.cartData.forEach((element) => {
        if (element.shop.id != item.shop.id) {
          itemfromsamestore = -1;
        }

      });
    }
    if (itemfromsamestore == 1) {
      const fCart = this.cartData.find((x) => x.id == item.id);

      if (fCart) {
        fCart.qty = item.qty;
      } else {
        this.cartData.push(item);
      }
      localStorage.setItem('store-detail', JSON.stringify(this.cartData));
    } else {
      this.util.presentToast('You cannot checkout products from different stores');
    }
  }
  remove(item) {
    let equalIndex;
    if (item.qty == 0) return;
    item.qty = item.qty - 1;

    if (item.qty == 0) {
      const i = this.cartData.findIndex((x) => x.id == item.id);

      this.cartData.splice(i, 1);
    } else {
      item.total = item.qty * item.salePrice;
      this.cartData = JSON.parse(localStorage.getItem('store-detail')) || [];
      const fCart = this.cartData.find((x) => x.id == item.id);
      if (fCart) {
        fCart.qty = item.qty;
      }
    }

    localStorage.setItem('store-detail', JSON.stringify(this.cartData));
  }
  cart() {
    if (this.cartData.length == 0) {
      this.util.presentToast('cart is empty');
    } else {
      this.gpi.cartData = this.cartData;
      this.nav.navigateForward('/grocery-cart');
    }
  }
}
