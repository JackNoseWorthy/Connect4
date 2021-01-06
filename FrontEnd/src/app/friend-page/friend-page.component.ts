import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';


@Component({
  selector: 'app-friend-page',
  templateUrl: './friend-page.component.html',
  styleUrls: ['./friend-page.component.css']
})
export class FriendPageComponent implements OnInit {
  @Input() friends = [];
  @Input() friendRequests = [];
  @Input() searchedUsers = [];
  @Input() username = '';

  @Output() accept = new EventEmitter<string>();
  @Output() add = new EventEmitter<string>();
  @Output() reject = new EventEmitter<string>();
  @Output() remove = new EventEmitter<string>();
  @Output() search = new EventEmitter<string>();
  @Output() profile = new EventEmitter<string>();

  searchForm = new FormGroup({
    searchString: new FormControl('', [Validators.required])
  });


  acceptRequest(username: string){
    this.accept.emit(username);
  }

  rejectRequest(username: string){
    this.reject.emit(username);
  }

  addFriend(username: string){
    this.add.emit(username);
    this._snackBar.open('Friend Request Sent', "",{
      duration: 1000
    });
  }

  removeFriend(username: string){
    this.remove.emit(username);
  }

  searchUsers(){
    this.search.emit(this.searchForm.get("searchString").value);
  }

  getSearchedUsers(){
    return this.searchedUsers.filter(user => {
      return user !== this.username && !this.friends.some(e => e.username === user) && !this.friendRequests.includes(user);
    });
  }

  viewProfile(username: string){
    this.profile.emit(username);
  }

  constructor(private _snackBar: MatSnackBar) { }

  ngOnInit(): void {
  }

}
