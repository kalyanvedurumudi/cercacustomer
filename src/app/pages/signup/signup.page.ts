import { UtilService } from "./../../service/util.service";
import { ApiService } from "./../../service/api.service";
import { Component, OnInit } from "@angular/core";
import { NavController, MenuController } from "@ionic/angular";

@Component({
  selector: "app-signup",
  templateUrl: "./signup.page.html",
  styleUrls: ["./signup.page.scss"]
})
export class SignupPage implements OnInit {
  data: any = {};
  err: any = {};
  confirmpassword = null;
  areacode = null;
  mobileno = null;
  firstname = null;
  lastname = null;
  public showPassword: boolean = false;
  public showConfirmPassword: boolean = false;
  constructor(
    private ntrl: NavController,
    private menu: MenuController,
    private api: ApiService,
    private util: UtilService
  ) {
    this.menu.enable(false);
  }

  ngOnInit() { }
  signUp() {
    this.ntrl.navigateRoot(["login"]);
  }
  gotologin() {
    this.util.startLoad();
    console.log(this.data);
    const ph = this.areacode + this.mobileno;
    this.data.phoneNumber = ph;
    this.data.name = this.firstname + ' ' + this.lastname;
    // tslint:disable-next-line:curly
    if (this.firstname == null || this.lastname == null || this.data.email == undefined
      || this.areacode == null || this.mobileno == null
      || this.data.password == undefined) {
      this.util.presentToast('All the fields are mandatory');
      this.util.dismissLoader();
    } else if (this.data.password != this.confirmpassword) {
      this.util.presentToast('Password dosent matches');
      this.util.dismissLoader();
    } else {
      this.api.postData('auth/register', this.data).subscribe((res: any) => {
        if (res.code != 200) {
          alert(JSON.stringify(res.data.message));
          this.util.presentToast(res.data.message);

        } else {
          this.util.presentToast('Registration successful');
          this.ntrl.navigateForward('/login');
        }
        this.util.dismissLoader();
        this.err = {};
      },
        err => {
          this.util.presentToast(err.error.data.message);
          this.err = err.error.errors;
          this.util.dismissLoader();
        }
      );
    }
  }
}
