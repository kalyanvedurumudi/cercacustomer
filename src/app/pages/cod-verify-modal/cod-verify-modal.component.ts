import { Component, Input, OnInit } from '@angular/core';
import { ModalController } from '@ionic/angular';
import { TranslateService } from '@ngx-translate/core';
import { ApiService } from 'src/app/service/api.service';
import { GroceryService } from 'src/app/service/grocery.service';
import { UtilService } from 'src/app/service/util.service';

@Component({
  templateUrl: './form.html'
})
export class CodVerifyModalComponent implements OnInit {
  phoneNumber: any;
  public verifyCode: string;

  constructor(
    private translate: TranslateService,
    private util: UtilService,
    private modalController: ModalController,
    private api: ApiService,
    private gpi: GroceryService
  ) {}

  ngOnInit(): void {
    this.phoneNumber = this.api.phoneNumber;
  }

  confirm() {
    if (!this.verifyCode) {
      return this.util.presentToast(this.translate.instant('Please enter verify code!'));
    }
    this.verifyCode = this.verifyCode.toUpperCase();
    this.modalController.dismiss({
      verifyCode: this.verifyCode
    });
  }

  reSendVerifyNumber() {
    if (!this.phoneNumber || this.phoneNumber === 'undefined' || typeof (this.phoneNumber) === 'undefined') {
      return this.util.presentToast(this.translate.instant('Invalid phone number, please recheck again.'));
    }
    this.gpi.checkPhone(this.phoneNumber)
      .subscribe(resp => {
        this.util.presentToast(this.translate.instant('A verify code was sent to your phone number, please check.'));
      }, (err) => this.util.presentToast(this.translate.instant('An error occurred, please recheck your phone number!')));
  }
}
