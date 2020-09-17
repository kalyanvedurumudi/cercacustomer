import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Routes, RouterModule } from '@angular/router';

import { IonicModule } from '@ionic/angular';

import { PayMethodPage } from './pay-method.page';
import { TranslateModule } from '@ngx-translate/core';
import { CodVerifyModalComponent } from '../cod-verify-modal/cod-verify-modal.component';
import { CartResolver } from 'src/app/service/cart.resolver';

const routes: Routes = [
  {
    path: '',
    component: PayMethodPage,
    resolve: {
      cart: CartResolver
    }
  }
];

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    TranslateModule,
    RouterModule.forChild(routes)
  ],
  declarations: [PayMethodPage, CodVerifyModalComponent],
  entryComponents: [CodVerifyModalComponent],
  providers: [CartResolver]
})
export class PayMethodPageModule { }
