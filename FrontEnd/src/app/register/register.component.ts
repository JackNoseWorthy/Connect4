import { Component, OnInit, Output, EventEmitter, Input } from '@angular/core';

//Form Control
import { FormGroup, FormControl, Validators } from '@angular/forms';

@Component({
  selector: 'app-register',
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.css']
})
export class RegisterComponent implements OnInit {
  @Input() usernameTaken = false;
  username = '';
  password = '';

  @Output()
  register = new EventEmitter<any>();

  registerForm = new FormGroup({
    username: new FormControl('', [Validators.required, Validators.minLength(3)]),
    password: new FormControl('', [Validators.required, Validators.minLength(8)])
  });

  constructor() { }

  ngOnInit(): void {
  }

  onSubmit(){
    this.username = this.registerForm.get("username").value;
    this.password = this.registerForm.get("password").value;
    let credentials = {
      username: this.username,
      password: this.password
    }
    this.register.emit(credentials);
  }

}
