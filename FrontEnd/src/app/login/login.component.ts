import { Component, OnInit, Output, EventEmitter, Input } from '@angular/core';

//Form Control
import { FormGroup, FormControl, Validators } from '@angular/forms';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent implements OnInit {
  username = '';
  password = '';
  @Input() invalidCredentials = false;

  loginForm = new FormGroup({
    username: new FormControl('', [Validators.required]),
    password: new FormControl('', [Validators.required])
  });

  @Output()
  login = new EventEmitter<any>();
  @Output()
  register = new EventEmitter<string>();

  onNewGame(){

  }

  constructor() { }

  ngOnInit(): void {
  }

  onSubmit(){
    this.username = this.loginForm.get("username").value;
    this.password = this.loginForm.get("password").value;
    let credentials = {
      username: this.username,
      password: this.password
    }
    this.login.emit(credentials);
  }

  onRegister(){
    this.register.emit('register');
  }

}
