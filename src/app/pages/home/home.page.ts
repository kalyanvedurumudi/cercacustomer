import { GroceryService } from './../../service/grocery.service';
import { UtilService } from '../../service/util.service';
import { ApiService } from '../../service/api.service';
import { Component } from '@angular/core';
import * as moment from 'moment';
import {
  NativeGeocoder,
  NativeGeocoderResult,
  NativeGeocoderOptions,
} from '@ionic-native/native-geocoder/ngx';
import { ModalController, NavController, MenuController } from '@ionic/angular';
import { FilterPage } from '../filter/filter.page';
import { Geolocation } from '@ionic-native/geolocation/ngx';
@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
})
export class HomePage {
  term: string;
  userAddress: any = {};
  err: any = {};
  currentTime: any;
  isfood = false;
  sellProduct = 0;
  public staticData: any = {
    feature: [
      {
        image: 'assets/image/diamond.svg',
        text: 'Most Popular',
        type: 'popular',
      },
      {
        image: 'assets/image/near.svg',
        text: 'Great Offers',
      },
      {
        image: 'assets/image/express.svg',
        text: 'Pure Veg Places',
        type: 'pureveg',
      },
      {
        image: 'assets/image/pocket.svg',
        text: 'Pocket Friendly',
        type: 'lowcost',
      },
      {
        image: 'assets/image/shop.svg',
        text: 'Nearest Me',
        type: 'nearest',
      },
    ],
  };
  public slideOpts: any = {
    slidesPerView: 'auto',
    centeredSlides: true,
    centeredSlidesBounds: true,
    spaceBetween: 20,
    initialSlide: 1,
    autoplay: {
      delay: 3000,
    },
    slideNextClass: 'swiper-slide-next',
    slidePrevClass: 'swiper-slide-next',
    slideActiveClass: 'swiper-slide-active',
    pagination: {
      el: '.swiper-pagination',
      clickable: true,
    },
  };
  data: any = {};
  grocery: any = {};
  btnType = 'Exclusive';
  currency: any;
  Address: any;

  trending = [
    {
      name: 'Real Fruit Juice ,Litchi, (Pack of 2)',
      img: '../../../assets/image/real_juice.png',
      qty: '1Ltr',
      price: '$15.50',
    },
    {
      name: 'Real Fruit Juice ,Litchi, (Pack of 2)',
      img: '../../../assets/image/real_juice.png',
      qty: '1Ltr',
      price: '$15.50',
    },
    {
      name: 'Real Fruit Juice ,Litchi, (Pack of 2)',
      img: '../../../assets/image/real_juice.png',
      qty: '1Ltr',
      price: '$15.50',
    },
  ];

  public innerWidth: any = window.innerWidth;
  public banners: any = Array();
  public featured: any = Array();
  public dailydeals: any = Array();
  constructor(
    private menu: MenuController,
    private modalController: ModalController,
    private navCtrl: NavController,
    private nativeGeocoder: NativeGeocoder,
    private api: ApiService,
    private util: UtilService,
    private gpi: GroceryService,
    private geolocation: Geolocation
  ) {
    this.menu.enable(true);
    this.isfood = false;
    /*this.api.getData('keySetting').subscribe(
      (res: any) => {
        this.sellProduct = res.data.sell_product;
        if (this.sellProduct == 2) {
          this.isfood = false;
        }
        this.initData();
      },
      (err) => {
        console.log('err', err);
      }
    );*/

    this.initData();
  }

  private initData() {
    this.getAdvertisingBanner();
    this.getGrocery();
    this.getfeatureddeals();
    this.getDailyDeals();

    this.util.startLoad();
    /* this.api.getDataWithToken('home').subscribe(
       (res: any) => {
         if (res.success) {
           this.data = res.data;
           this.currency = this.api.currency;
 
           this.getGrocery();
         }
       },
       (err) => {
         this.util.dismissLoader();
         this.err = err;
       }
     );*/
  }

  getAdvertisingBanner(): void {
    this.api.getData('banners/random?take=5&position=default').subscribe((res: any) => {
      if (res) {
        this.banners = res.data;
      }
    });
  }

  ionViewWillEnter() {
    if (localStorage.getItem('isaddress') != 'false') {
      const addressdata: any = JSON.parse(localStorage.getItem('address'));
      if (!(this.data && this.data.userAddress)) {
        this.data = this.data || {};
        this.data.userAddress = this.data.userAddress || {};
      }
      this.data.userAddress.soc_name = addressdata.address;
      this.data.userAddress.street = addressdata.area;
      this.data.userAddress.city = addressdata.city;
    } else {
      this.util.startLoad();
      this.geolocation
        .getCurrentPosition()
        .then((resp) => {
          resp.coords.latitude;
          resp.coords.longitude;
          this.userAddress.lat = resp.coords.latitude;
          this.userAddress.lang = resp.coords.longitude;

          const options: NativeGeocoderOptions = {
            useLocale: true,
            maxResults: 5,
          };
          this.nativeGeocoder
            .reverseGeocode(
              resp.coords.latitude,
              resp.coords.longitude,
              options
            )
            .then((result: NativeGeocoderResult[]) => {
              this.util.dismissLoader();
              this.userAddress.address_type = 'Current Location';
              this.userAddress.soc_name = result[0].subLocality;
              this.userAddress.street = result[0].thoroughfare;
              this.userAddress.city = result[0].locality;
             // this.userAddress.zipcode = result[0].postalCode;
            })
            .catch((error: any) => console.log(error));
        })
        .catch((error) => {
          this.util.dismissLoader();
        });
    }
  }

  async presentModal() {
    const modal = await this.modalController.create({
      component: FilterPage,
      cssClass: 'filterModal',
      backdropDismiss: true,
    });
    modal.onDidDismiss().then((res) => {
      if (res['data'] != undefined) {
        let filetype;
        res.data.forEach((element) => {
          if (element.checked == true) {
            filetype = element.name;
          }
        });
        if (filetype == 'Cost High to Low') {
          this.data.shop.sort((a, b) => {
            if (a.avarage_plate_price > b.avarage_plate_price) {
              return -1;
            }
            if (a.avarage_plate_price < b.avarage_plate_price) {
              return 1;
            }
            return 0;
          });
        } else if (filetype == 'Top Rated' || filetype == 'Most Popular') {
          this.data.shop.sort((a, b) => {
            if (a.rate > b.rate) {
              return -1;
            }
            if (a.rate < b.rate) {
              return 1;
            }
            return 0;
          });
        } else if (filetype == 'Cost Low to High') {
          this.data.shop.sort((a, b) => {
            if (a.avarage_plate_price < b.avarage_plate_price) {
              return -1;
            }
            if (a.avarage_plate_price > b.avarage_plate_price) {
              return 1;
            }
            return 0;
          });
        } else if (filetype == 'Open Now') {
          this.currentTime = moment().format('HH:mm');
          this.data.shop = this.data.shop.filter((a) => {
            a.open_time = moment('2019-07-19 ' + a.open_time).format('HH:mm');
            a.close_time = moment('2019-07-19 ' + a.close_time).format('HH:mm');
            if (
              this.currentTime >= a.open_time &&
              this.currentTime <= a.close_time
            ) {
              return a;
            }
          });
        } else {
          if (localStorage.getItem('isaddress') != 'false') {
            this.api
              .getDataWithToken(
                'getAddress/' + localStorage.getItem('isaddress')
              )
              .subscribe((res: any) => {
                if (res.success) {
                  this.Address =
                    res.data.soc_name +
                    ' ' +
                    res.data.street +
                    ' ' +
                    res.data.city +
                    ' ' +
                    res.data.zipcode;

                  const options: NativeGeocoderOptions = {
                    useLocale: true,
                    maxResults: 5,
                  };

                  this.nativeGeocoder
                    .forwardGeocode(this.Address, options)
                    .then((result: NativeGeocoderResult[]) => {
                      this.data.shop.forEach((element) => {
                        element.distance = this.distance(
                          result[0].latitude,
                          result[0].longitude,
                          element.latitude,
                          element.longitude,
                          'K'
                        );
                      });

                      this.data.shop.sort((a, b) => {
                        if (a.distance < b.distance) {
                          return -1;
                        }
                        if (a.distance > b.distance) {
                          return 1;
                        }
                      });
                    })
                    .catch((error: any) => console.log(error));
                }
              });
          } else {
            const options: NativeGeocoderOptions = {
              useLocale: true,
              maxResults: 5,
            };

            this.nativeGeocoder
              .forwardGeocode(this.userAddress, options)
              .then((result: NativeGeocoderResult[]) => {
                this.data.shop.forEach((element) => {
                  element.distance = this.distance(
                    result[0].latitude,
                    result[0].longitude,
                    element.latitude,
                    element.longitude,
                    'K'
                  );
                });

                this.data.shop.sort((a, b) => {
                  if (a.distance < b.distance) {
                    return -1;
                  }
                  if (a.distance > b.distance) {
                    return 1;
                  }
                });
              })
              .catch((error: any) => console.log(error));
          }
        }
      }
    });
    return await modal.present();
  }

  detail() {
    this.navCtrl.navigateForward(['restaurant-detail']);
  }

  getfeatureddeals() {

    this.api.getDataWithToken('products/search?page=1&take=8&sort=random&sortType=&featured=1').subscribe(
      (res: any) => {
        if (res) {
          this.featured = res.data.items;
          // this.grocery.coupon = res.data.coupon;
          this.api.getDataWithToken('products/search?page=1&take=8&sort=random&sortType=&dailyDeal=1&showDeal=1').subscribe(
            (res: any) => {

              this.util.dismissLoader();
              this.dailydeals = res.data.items;
             
            },
            (err) => {
              this.util.dismissLoader();
              this.err = err;
            }
          );
          this.util.dismissLoader();
        }
      },
      (err) => {
        this.util.dismissLoader();
        this.err = err;
      }
    );

  }

  getDailyDeals() {

  }

  resturantDetail(id) {
    this.api.detailId = id;
    this.navCtrl.navigateForward(['restaurant-detail']);
  }

  distance(lat1, lon1, lat2, lon2, unit) {
    if (lat1 == lat2 && lon1 == lon2) {
      return 0;
    } else {
      const radlat1 = (Math.PI * lat1) / 180;
      const radlat2 = (Math.PI * lat2) / 180;
      const theta = lon1 - lon2;
      const radtheta = (Math.PI * theta) / 180;
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

  feature(type) {
    if (type) {
      this.api.filterType = type;
      this.navCtrl.navigateForward('/category');
    } else {
      this.navCtrl.navigateForward('/promocode/menu');
    }
  }
  
  categoryData(id) {
    this.navCtrl.navigateForward('/category/' + id);
  }
  getGrocery() {
    this.api.getDataWithToken('shops/search?take=4').subscribe(
      (res: any) => {
        if (res) {
          this.grocery.Store = res.data.items;
          // this.grocery.coupon = res.data.coupon;
          this.api.getDataWithToken('products/categories/tree').subscribe(
            (res: any) => {

              this.util.dismissLoader();
              this.grocery.category = res.data;
              console.log(this.grocery.Store);
              this.grocery.Store.forEach((element) => {
                // console.log(element);
                // alert(element.location[0]);
                element.away = Number(
                  this.distance(
                    this.userAddress.lat,
                    this.userAddress.lang,
                    element.location[0],
                    element.location[1],
                    'K'
                  ).toFixed(2)
                );
              });

            },
            (err) => {
              this.util.dismissLoader();
              this.err = err;
            }
          );
          this.util.dismissLoader();
        }
      },
      (err) => {
        this.util.dismissLoader();
        this.err = err;
      }
    );
  }
  storeList() {
    this.navCtrl.navigateForward('store');
  }
  storeDetail(item) {
    this.gpi.storeID = item.id;
    localStorage.removeItem('storename');
    localStorage.setItem('storename', item.alias);
    this.navCtrl.navigateForward('/store-detail');
  }
  subcategory(item) {
    localStorage.removeItem('categories');
    localStorage.setItem('categories', JSON.stringify(item));
    this.navCtrl.navigateForward('grocery-category');
  }
  getCategory() {
    this.navCtrl.navigateForward('/grocery-category');
  }
  productdetails(item){
    this.gpi.itemId = item.id;
    localStorage.removeItem('productname');
    localStorage.setItem('productname', item.alias);
    
    this.navCtrl.navigateForward('/product-detail');
  }
  featuredList(){
    localStorage.removeItem('allitems');
    localStorage.setItem('allitems', 'Y');
    this.navCtrl.navigateForward('/product');
  }
}
