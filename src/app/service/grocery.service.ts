import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';

@Injectable({
  providedIn: 'root',
})
export class GroceryService {
  storeID: any;
  catId: any;
  itemId: any;
  orderId: any;
  cartData: any = [];
  promocode: any;
  info: any;
  lastOrder: any;
  constructor(private api: ApiService) {}

  checkPhone(phoneNumber: string): Observable<any> {
    return this.api.postDataWithToken('orders/phone/check', { phoneNumber });
  }

  checkout(params: any): Observable<any> {
    return this.api.postDataWithToken('orders', params);
  }

  cleanCart(res: any): void {
    this.lastOrder = res;
    this.info = [];
    localStorage.setItem('store-detail', JSON.stringify([]));
  }

  calculate(): Promise<any> {
      if (!this.info || !this.info.length) {
        return Promise.resolve({
          products: []
        });
      }
      return this.api.postDataWithToken('cart/calculate', {
        products: this.info.map(product => {
          return {
            productId: product.id, productVariantId: null, quantity: product.qty
          };
        }),
      }).toPromise();
  }
}
