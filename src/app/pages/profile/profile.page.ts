import { UtilService } from './../../service/util.service';
import { Camera } from '@ionic-native/camera/ngx';
import { ApiService } from './../../service/api.service';
import { Component, OnInit } from '@angular/core';
import { NavController, ActionSheetController } from '@ionic/angular';
import * as moment from 'moment';
import { ActivatedRoute } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
@Component({
  selector: 'app-profile',
  templateUrl: './profile.page.html',
  styleUrls: ['./profile.page.scss'],
})
export class ProfilePage implements OnInit {
  public segment: number = 1;
  public subsegment: number = 1;
  userDetail: any = {};
  err: any = {};
  data: any = {};
  userSetting: any = {};
  imgProfile: any = 'http://placehold.it/96x96';
  changeAddressBtn: any = false;
  imageUri: any;
  isNewProfile: boolean = false;
  coverImage: any;
  changeImage: any = {};
  userName: any;
  userLocation: any;
  isfrom: any;
  passwordData: any = {};
  addressdata: any = {};
  public language: string = localStorage.getItem('app_language') ? localStorage.getItem('app_language') : 'en';
  constructor(
    private ntrl: NavController,
    private api: ApiService,
    private actionSheetCtrl: ActionSheetController,
    private camera: Camera,
    private util: UtilService,
    private route: ActivatedRoute,
    private translate: TranslateService
  ) {

    this.util.startLoad();
    /*this.api.getDataWithToken('viewReview').subscribe((res: any) => {
      if (res.success) {
        this.data = res.data;
        this.util.dismissLoader();
        this.data.review.forEach((element) => {
          element.created_at = moment(element.created_at).fromNow();
        });
        this.userName = res.data.userDetail.name;
        this.userLocation = res.data.userDetail.location;
        this.userDetail = this.data.userDetail;

        if (res.data.userDetail.cover_image == null) {
          this.coverImage = false;
        } else {
          this.coverImage = this.userDetail.imagePath + this.data.userDetail.cover_image;
        }

        this.imgProfile = this.userDetail.imagePath + this.userDetail.image;
        this.data.address = localStorage.getItem('address');

        if (this.userDetail.enable_notification == 1) {
          this.userSetting.enable_notification = true;
        } else {
          this.userSetting.enable_notification = false;
        }

        if (this.userDetail.enable_location == 1) {
          this.userSetting.enable_location = true;
        } else {
          this.userSetting.enable_location = false;
        }

        if (this.userDetail.enable_call == 1) {
          this.userSetting.enable_call = true;
        } else {
          this.userSetting.enable_call = false;
        }
      }
    });*/

    this.route.params.subscribe((params) => {
      this.isfrom = params['id'];
      if (this.isfrom == 'setting') {
        this.segment = 4;
      }
    });

    const addressdata: any = JSON.parse(localStorage.getItem('address'));
    //  alert(addressdata.address);
    this.userDetail = addressdata;

  }

  ionViewWillEnter() {
    const data: any = JSON.parse(localStorage.getItem('address'));
    if (this.changeAddressBtn) {
      this.data.userAddress.soc_name = data.address;
      this.data.userAddress.street = data.area;
      this.data.userAddress.city = data.city;
      //this.data.userAddress.zipcode = res.data.zipcode;
      /* this.api.getDataWithToken('getAddress/' + localStorage.getItem('isaddress'))
         .subscribe((res: any) => {
           if (res.success) {
             this.data.userAddress.soc_name = res.data.soc_name;
             this.data.userAddress.street = res.data.street;
             this.data.userAddress.city = res.data.city;
             this.data.userAddress.zipcode = res.data.zipcode;
           }
         });*/
    }
  }

  ngOnInit() { }

  back() {
    this.ntrl.back();
  }

  editProfile() {
    if (this.segment == 3) {
      this.util.startLoad();
      const userdata: any = {
        location: [
          0,
          0
        ],
        role: 'user',
        provider: 'local',
        type: 'user',
        isActive: true,
        emailVerified: true,
        phoneNumber: this.userDetail.phoneNumber,
        phoneVerified: false,
        address: this.userDetail.address,
        city: this.userDetail.city,
        area: this.userDetail.area,
        isShop: false,
        _id: this.userDetail._id,
        email: this.userDetail.email,
        name: this.userDetail.name,
        createdAt: this.userDetail.createdAt,
        updatedAt: this.userDetail.updatedAt,
        __v: 1,
      }

      this.api.putDataWithToken('users', userdata).subscribe(
        (res: any) => {
          this.util.dismissLoader();
          if (res.code == 200) {
            this.util.presentToast('Profile updated successfully');
          } else {
            this.util.presentToast('Failed to update profile ,Please try after some time');
          }

        },
        (err) => {
          if (err.error.msg) {
            this.util.dismissLoader();
            this.util.presentToast(err.error.msg);
          }
          this.err = err.error.errors;
          this.util.dismissLoader();
        }
      );
    } else if (this.segment == 5) {
      this.util.startLoad();
      this.api.postDataWithToken('changePassword', this.passwordData).subscribe(
        (res: any) => {
          if (res.success) {
            this.util.dismissLoader();
            this.passwordData.password = '';
            this.passwordData.confirmPassword = '';
            this.err = {};
            this.util.presentToast(res.msg);
          }
        },
        (err) => {
          this.util.dismissLoader();
          this.err = err.error.errors;
        }
      );
    } else {
      if (this.userSetting.enable_notification) {
        this.userSetting.enable_notification = 1;
      } else {
        this.userSetting.enable_notification = 0;
      }
      if (this.userSetting.enable_location) {
        this.userSetting.enable_location = 1;
      } else {
        this.userSetting.enable_location = 0;
      }
      if (this.userSetting.enable_call) {
        this.userSetting.enable_call = 1;
      } else {
        this.userSetting.enable_call = 0;
      }

      this.userSetting.address_id = localStorage.getItem('isaddress');
      this.util.startLoad();
      this.api
        .postDataWithToken('saveSetting', this.userSetting)
        .subscribe((res: any) => {
          if (res.success) {
            this.util.dismissLoader();
            this.translate.get('toasts').subscribe(async val => {
              this.util.presentToast(val.setting_set_success);
            })
          }
        });
    }
  }

  changeAddress() {
    this.changeAddressBtn = true;
    this.ntrl.navigateForward('/select-address');
  }

  async chageProfileOption() {
    const actionSheet = await this.actionSheetCtrl.create({
      header: 'Select method',
      buttons: [
        {
          text: 'Camera',
          role: 'destructive',
          icon: 'camera',
          handler: () => {
            this.getCamera();
          },
        },
        {
          text: 'Gallary',
          icon: 'photos',
          handler: () => {
            this.getGallery();
          },
        },
        {
          text: 'Cancel',
          icon: 'close',
          handler: () => { },
        },
      ],
    });
    await actionSheet.present();
  }

  getGallery() {
    const cameraOptions = {
      sourceType: this.camera.PictureSourceType.PHOTOLIBRARY,
      destinationType: this.camera.DestinationType.DATA_URL,
      encodingType: this.camera.EncodingType.JPEG,
      correctOrientation: true,
    };
    this.camera.getPicture(cameraOptions).then(
      (fileUri) => {
        this.imgProfile = 'data:image/jpg;base64,' + fileUri;
        this.imageUri = fileUri;
        this.isNewProfile = true;

        this.changeImage.image = this.imageUri;
        this.changeImage.image_type = 'profile';
        this.api
          .postDataWithToken('changeImage', this.changeImage)
          .subscribe((res: any) => {
            if (res.success) {

            }
          });
      },
      (err) => { }
    );
  }

  getCamera() {
    const cameraOptions = {
      destinationType: this.camera.DestinationType.DATA_URL,
      encodingType: this.camera.EncodingType.JPEG,
      correctOrientation: true,
    };
    this.camera.getPicture(cameraOptions).then(
      (fileUri) => {
        this.imgProfile = 'data:image/jpg;base64,' + fileUri;
        this.imageUri = fileUri;
        this.isNewProfile = true;
      },
      (err) => { }
    );
  }

  editCoverimg() {
    const cameraOptions = {
      sourceType: this.camera.PictureSourceType.PHOTOLIBRARY,
      destinationType: this.camera.DestinationType.DATA_URL,
      encodingType: this.camera.EncodingType.JPEG,
      correctOrientation: true,
    };
    this.camera.getPicture(cameraOptions).then(
      (fileUri) => {
        this.coverImage = 'data:image/jpg;base64,' + fileUri;
        this.imageUri = fileUri;
        this.changeImage.image = this.imageUri;
        this.changeImage.image_type = 'cover';
        this.api
          .postDataWithToken('changeImage', this.changeImage)
          .subscribe((res: any) => {
            if (res.success) {

            }
          });
      },
      (err) => { }
    );
  }

  uploadGalleryimg() {
    const cameraOptions = {
      sourceType: this.camera.PictureSourceType.PHOTOLIBRARY,
      destinationType: this.camera.DestinationType.DATA_URL,
      encodingType: this.camera.EncodingType.JPEG,
      correctOrientation: true,
    };
    this.camera.getPicture(cameraOptions).then(
      (fileUri) => {
        this.imageUri = fileUri;
        this.changeImage.image = this.imageUri;
        this.api
          .postDataWithToken('addPhoto', this.changeImage)
          .subscribe((res: any) => {
            if (res.success) {
              this.api.getDataWithToken('viewReview').subscribe((res: any) => {
                if (res.success) {
                  this.data = res.data;
                  this.data.review.forEach((element) => {
                    element.created_at = moment(element.created_at).fromNow();
                  });

                  this.userDetail = this.data.userDetail;
                  this.coverImage =
                    this.userDetail.imagePath +
                    this.data.userDetail.cover_image;
                  this.imgProfile =
                    this.userDetail.imagePath + this.userDetail.image;
                  this.data.address = localStorage.getItem('address');
                  if (this.userDetail.enable_notification == 1) {
                    this.userSetting.enable_notification = true;
                  } else {
                    this.userSetting.enable_notification = false;
                  }
                  if (this.userDetail.enable_location == 1) {
                    this.userSetting.enable_location = true;
                  } else {
                    this.userSetting.enable_location = false;
                  }
                  if (this.userDetail.enable_call == 1) {
                    this.userSetting.enable_call = true;
                  } else {
                    this.userSetting.enable_call = false;
                  }
                }
              });
            }
          });
      },
      (err) => { }
    );
  }

  async onLanguageChange() {
    localStorage.setItem('app_language', this.language);
    document.documentElement.dir = this.language == 'ar' ? 'rtl' : 'ltr';
    this.translate.setDefaultLang(this.language);
  }
}
