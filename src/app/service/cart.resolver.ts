
import { Injectable } from '@angular/core';
import { Resolve } from '@angular/router';
import { Observable } from 'rxjs/Observable';
import { ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import 'rxjs/add/observable/of';
import 'rxjs/add/operator/delay';
import { GroceryService } from './grocery.service';
import { UtilService } from './util.service';


@Injectable()
export class CartResolver implements Resolve<Observable<any>> {
  constructor(    private gpi: GroceryService, private util: UtilService)  {
    this.util.startLoad();
   }

  resolve(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Observable<any> | Promise<any> | any {
     return this.gpi.calculate().then((resp) => {
        this.util.dismissLoader();
        return resp.data;
    });
  }
}
