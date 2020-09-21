import { GrocerySuccessPage } from './../grocery-success/grocery-success.page';
import { SuccessModalPage } from './../success-modal/success-modal.page';
import { ModalController } from '@ionic/angular';
import { GroceryService } from './../../service/grocery.service';
import { UtilService } from './../../service/util.service';
import { ApiService } from './../../service/api.service';
import { Component, OnInit } from '@angular/core';
import {
  PayPal,
  PayPalPayment,
  PayPalConfiguration,
} from '@ionic-native/paypal/ngx';
import { TranslateService } from '@ngx-translate/core';
import { CodVerifyModalComponent } from '../cod-verify-modal/cod-verify-modal.component';
import { ActivatedRoute } from '@angular/router';
import * as _ from 'lodash';

declare var RazorpayCheckout: any;

@Component({
  selector: 'app-pay-method',
  templateUrl: './pay-method.page.html',
  styleUrls: ['./pay-method.page.scss'],
})
export class PayMethodPage implements OnInit {
  currencyType: any;
  data: any = {};
  online = 0;
  cash = 1;
  err: any;
  payment_type: any = 'LOCAL';
  apdata: any = {};
  public userInfo: any = {
    country: 'Panama'
  };
  cartData: any;

  totalPrice = 0;
  totalTaxPrice = 0;
  totalShippingPrice = 0;
  totalDiscountPrice = 0;
  productsNonCod = [];
  deliveryprice = 0;

  constructor(
    private api: ApiService,
    private util: UtilService,
    private gpi: GroceryService,
    private payPal: PayPal,
    private modalController: ModalController,
    private route: ActivatedRoute,
    private translate: TranslateService
  ) {
    this.cartData = this.gpi.info;

    this.currencyType = this.api.currencyType;
    const uInfo = this.cartData.Deafult_address;

    this.userInfo.lastName = uInfo.name.slice(uInfo.name.lastIndexOf(' ') + 1, uInfo.name.length);
    this.userInfo.firstName = uInfo.name.slice(0, uInfo.name.lastIndexOf(this.userInfo.lastName) - 1);
    this.userInfo.email = uInfo.email;
    this.userInfo.streetAddress = uInfo.address;
    this.userInfo.latitude = uInfo.location[0],
    this.userInfo.longitude = uInfo.location[1],
    this.userInfo.city = uInfo.city;
    this.userInfo.area = uInfo.area;
    this.userInfo.phoneNumber = uInfo.phoneNumber;

    // this.util.startLoad();
    // this.api.getDataWithToken('keySetting').subscribe((res: any) => {
    //   if (res.success) {
    //     this.data = res.data;
    //     this.util.dismissLoader();
    //   }
    // });
  }

  ngOnInit() {
    this.apdata = this.route.snapshot.data.cart;
    if (this.apdata && this.apdata.products.length) {
      this.updateTotalPrice();
      this.apdata.products.forEach(product => {
        if (this.cartData.delivery_type !== 'delivery') {
          product.isPickUpAtStore = true;
          product.userPickUpInfo = {
            pickUpBy: 'self'
          };
        } else {
          product.isPickUpAtStore = false;
          product.userPickUpInfo = {};
        }
      });
    }
    this.userInfo.userCurrency = this.apdata && this.apdata.userCurrency ? this.apdata.userCurrency : 'USD';
  }


  updateTotalPrice() {
    this.totalPrice = 0;
    this.totalTaxPrice = 0;
    this.totalShippingPrice = 0;
    this.totalDiscountPrice = 0;
    this.productsNonCod = [];
    this.deliveryprice = parseInt(this.apdata.products[0].product.shop.shopDelivery);
    if (!this.apdata.products.length) {
      return;
    }
    this.apdata.products.forEach((product) => {
      if (product.quantity < 1) {
        product.quantity = 1;
      }
      product.calculatedData = {
        product: product.userProductPrice * product.quantity,
        taxClass: product.taxClass,
        tax: 0,
        discount: 0,
        deliveryPrice: 0
      };
      if (product.deliveryZonePrice) {
        product.calculatedData.deliveryPrice = product.deliveryZonePrice;
      } else {
        product.deliveryZonePrice = 0;
        product.calculatedData.deliveryPrice = 0;
      }
      if (this.userInfo.paymentMethod === 'cod' && !product.product.shop.doCOD) {
        this.productsNonCod.push(product);
      }
      if (product.taxPercentage && product.taxClass) {
        product.calculatedData.taxClass = product.taxClass;
        product.calculatedData.tax = product.calculatedData.product * (product.taxPercentage / 100);
        this.totalTaxPrice += product.calculatedData.tax;
      }
      if (product && product.isDiscounted && product.discountPercentage) {
        product.calculatedData.discount = product.calculatedData.product * (product.discountPercentage / 100);
        this.totalDiscountPrice += product.calculatedData.discount;
      }
      product.calculatedData.total = product.calculatedData.product + product.calculatedData.tax - product.calculatedData.discount;
      this.totalShippingPrice = this.deliveryprice;
      this.totalPrice += product.calculatedData.total;
    });
    this.totalPrice += this.deliveryprice;
  }

  paymentMethod() {
    const phoneNumber = this.cartData.Deafult_address.phoneNumber;
    if (!phoneNumber || phoneNumber === 'undefined' || typeof (phoneNumber) === 'undefined') {
      return this.util.presentToast(this.translate.instant('Invalid phone number, please recheck again.'));
    }
    this.gpi.checkPhone(phoneNumber).subscribe(resp => {
      this.api.phoneNumber = phoneNumber;
      this.verifyPhone();
      }, (err) => this.util.presentToast(this.translate.instant('An error occurred, please recheck your phone number!')));
  }

  doPost() {
    const products = this.apdata.products.map(item => _.pick(item, ['productId', 'productVariantId', 'quantity',
      'userNote', 'couponCode', 'userPickUpInfo', 'pickUpAddress', 'deliveryCompanyId', 'deliveryZoneId', 'pickUpAddressObj']));
    this.userInfo.phoneNumber = this.cartData.Deafult_address.phoneNumber;

    console.log(this.apdata.products);
    this.gpi.checkout({
      products,
      firstName: this.userInfo.firstName,
      lastName: this.userInfo.lastName,
      email: this.userInfo.email,
      phoneNumber: this.userInfo.phoneNumber,
      streetAddress: this.userInfo.streetAddress,
      location: [this.userInfo.latitude, this.userInfo.longitude],
      city: this.userInfo.city,
      state: this.userInfo.area,
      country: this.userInfo.country,
      shippingAddress: this.userInfo.shippingAddress,
      userCurrency: this.userInfo.userCurrency,
      phoneVerifyCode: this.userInfo.phoneVerifyCode,
      paymentMethod: this.userInfo.paymentMethod,
      zipCode: this.userInfo.zipCode,
      shopId: this.apdata.products[0].shopId,
      deliveryPrice: this.deliveryprice,
      pickUpAddress: this.apdata.products[0].pickUpAddressObj,
      isPickupatStore: this.apdata.products[0].isPickUpAtStore

    }).subscribe((resp) => {
        if (resp && resp.code === 200) {
          this.gpi.cleanCart(resp);
          this.presentModal();
        }
        // else if (this.userInfo.paymentMethod === 'paypal') {
        //   this.transactionService.request({
        //     gateway: 'paypal',
        //     service: 'order',
        //     itemId: resp.data._id
        //   })
        //     .then(transactionResp => {
        //       window.location.href = transactionResp.data.redirectUrl;
        //     })
        //     .catch((err) => this.util.presentToast(err.data.message ||
        //       err.data.data.message || this.translate.instant('Something went wrong, please try again!')));
        // } else if (this.userInfo.paymentMethod === 'stripe') {
        //   this.transactionService.request({
        //     gateway: 'stripe',
        //     service: 'order',
        //     itemId: resp.data._id,
        //     stripeToken: this.stripeToken
        //   })
        //     .then(res => {
        //       window.location.href = '/cart/checkout/success';
        //     })
        //     .catch((err) => this.util.presentToast(err.data.message ||
        //       err.data.data.message || this.translate.instant('Something went wrong, please try again!')));
        // } else if (this.userInfo.paymentMethod === 'cybersource') {
        //   this.transactionService.request({
        //     gateway: 'cybersource',
        //     service: 'order',
        //     itemId: resp.data._id
        //   })
        //     .then(transactionResp => {
        //       this.transactionService.doSubmitCybersource(transactionResp.data);
        //     })
        //     .catch((err) => this.util.presentToast(err.data.message ||
        //       err.data.data.message || this.translate.instant('Something went wrong, please try again!')));
        // } else if (this.userInfo.paymentMethod === 'mtn') {
        //   // open box confirm phone number and do transaction
        //   const modalRef = this.modalService.open(MTNPhoneConfirmModalComponent, {
        //     backdrop: 'static',
        //     keyboard: false
        //   });
        //   modalRef.componentInstance.data = resp.data;
        // } else {
        //   window.location.href = '/cart/checkout/success';
        // }
      }, err => this.util.presentToast(err.data.message ||
        err.data.data.message || this.translate.instant('Something went wrong, please try again!')));

  }

  // doPost() {
  //   const rdata: any = {};
  //   rdata.items = [];
  //   rdata.itemData = [];
  //   rdata.shop_id = this.gpi.storeID;
  //   rdata.payment = this.gpi.info.toPay;
  //   rdata.discount = this.gpi.info.discount;
  //   rdata.delivery_charge = this.gpi.info.delivery_charge;
  //   rdata.delivery_type = this.gpi.info.delivery_type;
  //   if (this.gpi.promocode === undefined) {
  //   } else {
  //     rdata.coupon_id = this.gpi.promocode.id;
  //   }
  //   rdata.coupon_price = this.gpi.info.discount;

  //   if (typeof this.data.items === 'string') {
  //     rdata.items = [];
  //   }
  //   this.gpi.cartData.forEach((element) => {
  //     rdata.items.push(element.id);
  //     const pusher: any = {
  //       item_id: element.id,
  //       price: element.total * element.qty,
  //       quantity: element.qty,
  //     };
  //     rdata.itemData.push(pusher);
  //   });
  //   rdata.items = rdata.items.join();

  //   // if (this.online) {
  //   //   if (this.payment_type === 'RAZOR') {
  //   //     this.payWithRazor(rdata);
  //   //   } else {
  //   //     if (this.currencyType === 'INR') {
  //   //       this.util.presentToast('payment not possible');
  //   //     } else {
  //   //       this.paypalPay(rdata);
  //   //     }
  //   //   }
  //   // } else {
  //   rdata.payment_status = 0;
  //   rdata.payment_type = this.payment_type;
  //   this.util.startLoad();
  //   this.api.postDataWithToken('createGroceryOrder', rdata).subscribe(
  //     (res: any) => {
  //       if (res.success) {
  //         this.util.dismissLoader();
  //         this.gpi.promocode = {};
  //         this.gpi.orderId = res.data.id;
  //         this.presentModal();
  //       }
  //     },
  //     (err) => {
  //       this.err = err.error.errors;
  //       this.util.dismissLoader();
  //     }
  //   );
  //   // }
  // }

  payWithRazor(rdata) {
    var options = {
      description: 'Credits towards consultation',
      image: 'http://placehold.it/96x96.png',
      currency: this.currencyType,
      key: this.data.razorPublishKey,
      amount: this.gpi.info.toPay * 100,
      name: 'Foodlands',

      theme: {
        color: '#94b92d',
      },
      modal: {
        ondismiss: function () {
          alert('dismissed');
        },
      },
    };

    var successCallback = (payment_id) => {
      rdata.payment_token = payment_id;
      rdata.payment_status = 1;
      rdata.payment_type = 'RAZOR';
      this.util.startLoad();
      this.api.postDataWithToken('createGroceryOrder', rdata).subscribe(
        (res: any) => {
          if (res.success) {
            this.util.dismissLoader();
            this.gpi.promocode = {};
            this.gpi.orderId = res.data.id;
            this.presentModal();
          }
        },
        (err) => {
          this.err = err.error.errors;
          this.util.dismissLoader();
        }
      );
    };

    var cancelCallback = function (error) {
      alert(error.description + ' (Error ' + error.code + ')');
    };

    RazorpayCheckout.open(options, successCallback, cancelCallback);
  }
  paypalPay(rdata) {
    this.payPal

      .init({
        PayPalEnvironmentProduction: this.data.paypalProduction,
        PayPalEnvironmentSandbox: this.data.paypalSendbox,
      })

      .then(
        () => {
          this.payPal
            .prepareToRender(
              'PayPalEnvironmentSandbox',
              new PayPalConfiguration({})
            )
            .then(
              () => {
                let payment = new PayPalPayment(
                  this.gpi.info.toPay,
                  this.currencyType,
                  'Description',
                  'sale'
                );
                this.payPal.renderSinglePaymentUI(payment).then(
                  (result) => {
                    rdata.payment_token = result.response.id;
                    rdata.payment_status = 1;
                    rdata.payment_type = 'PAYPAL';
                    this.util.startLoad();
                    this.api
                      .postDataWithToken('createGroceryOrder', rdata)
                      .subscribe(
                        (res: any) => {
                          if (res.success) {
                            this.util.dismissLoader();
                            this.gpi.promocode = {};
                            this.gpi.orderId = res.data.id;
                            this.presentModal();
                          }
                        },
                        (err) => {
                          this.err = err.error.errors;
                          this.util.dismissLoader();
                        }
                      );
                  },
                  (e) => {}
                );
              },
              (e) => {}
            );
        },
        (e) => {}
      );
  }

  async verifyPhone() {
    const modal = await this.modalController.create({
      component: CodVerifyModalComponent
    });
    modal.onDidDismiss().then((res: any) => {
      const data = res && res.data;
      this.userInfo.phoneVerifyCode = data.verifyCode;
      if (!this.userInfo.phoneVerifyCode && data !== 'Cancel') {
        return this.util.presentToast(
          this.translate.instant('Look like you dont get any verify code, please click the link above to retry again.'));
      }
      this.doPost();
    });
    return await modal.present();
  }

  async presentModal() {
    const modal = await this.modalController.create({
      component: GrocerySuccessPage,
      backdropDismiss: false,
      cssClass: 'SuccessModal',
    });
    return await modal.present();
  }
}
