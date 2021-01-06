import { Component, OnInit, HostListener } from '@angular/core';
import { NewGameComponent } from './new-game/new-game.component';
import { MatDialog, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { GamesListComponent } from './games-list/games-list.component';
import { Connect4Service } from './connect4.service';
import { SocketService } from './socket.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
})
export class AppComponent implements OnInit{

  @HostListener('window:beforeunload', ['$event'])
  leaveGameRoom($event){
    this.leave(true);
  }

  title = 'Connect4';
  sidebar = false;
  //newGame = {};

  //Passed to profile.component
  userForProfile = {};

  //Stored in app.component for reference
  thisUser = '';

  //Passed to games-list.component or profile.component
  activeGames = {};

  currentPage = 2;
  logIn = 1;
  
  //Passed to login.component
  invalidCredentials = false;

  //Passed to register.component
  usernameTaken = false;

  //Passed to friend-page.component
  userFriends = {};
  searchedUsers = [];

  //Passed to game-board.component
  openGame: any = {};

  constructor(public dialog: MatDialog, private connect4: Connect4Service, private socket: SocketService){}

  ngOnInit(){
    this.socket.listen("updateGame").subscribe((data: number) => {
      this.getGame(data);
    });
  }

  toggle(){
    this.sidebar = !this.sidebar
  }

  getSidebar(){
    return this.sidebar;
  }

  getOpponents(){
    let opponentList = ['Random Opponent'];
    this.connect4.getOpponents(this.thisUser).subscribe(
      res => {
        let temp: any
        temp = res;
        opponentList = opponentList.concat(temp.friends);
        this.openDialog(opponentList);
      },
      err => console.log('HTTP Error', err)
    );
  }

  openDialog(opponentList): void {
    const dialogRef = this.dialog.open(NewGameComponent, {
      data: {friends: opponentList}
    });

    dialogRef.afterClosed().subscribe(result => {
      let requestData = result;
      if (requestData){
        this.connect4.newGame(requestData).subscribe(
          res => {
            let temp: any
            temp = res;
            this.getGame(temp.id)
          },
          err => console.log('HTTP Error', err)
        );
      }
    });
  }

  setCurrentPage(pageNumber: number){
    this.currentPage = pageNumber;
  }

  viewProfile(username){
    this.connect4.getProfile(username, this.thisUser).subscribe((response) => {
      this.leave();
      this.userForProfile = response;
      this.currentPage = 1;
    });
  }

  setCurrentLogin(pageNumber: number){
    this.logIn = pageNumber;
  }

  login(credentials: any){
    this.connect4.login(credentials).subscribe(
      res => {
        this.invalidCredentials = false; 
        this.logIn = 3;
        this.thisUser = credentials.username;
        this.currentPage = 1;
        this.viewProfile(credentials.username);
      },
      err => {console.log('HTTP Error', err); this.invalidCredentials = true;},
    );
  }

  register(credentials: any){
    this.connect4.register(credentials).subscribe(
      res => {
        this.logIn = 3;
        this.thisUser = credentials.username;
        this.usernameTaken = false;
        this.viewProfile(credentials.username);
      },
      err => {console.log('HTTP Error', err); this.usernameTaken = true}
    );
  }

  updatePrivacy(privacy: string){
    this.connect4.updatePrivacy({username: this.thisUser, privacy: privacy}).subscribe();
  }

  getFriends(){
    this.connect4.getFriends().subscribe(
      res => {
        this.leave();
        this.userFriends = res;
        this.currentPage = 2;
        this.searchUsers("");
      },
      err => console.log('HTTP Error', err)
    );
  }

  makeFriendRequest(friend: string){
    this.connect4.makeFriendRequest({username: friend}).subscribe();
  }

  acceptFriendRequest(friend: any){
    this.connect4.acceptFriendRequest({friend: friend.name}).subscribe(
      res => this.getFriends(),
      err => console.log('HTTP Error', err)
    );
  }

  rejectFriendRequest(friend: any){
    this.connect4.rejectFriendRequest({"friend": friend.name}).subscribe(
      res => this.getFriends(),
      err => console.log('HTTP Error', err)
    );
  }

  removeFriend(friend: string){
    this.connect4.removeFriend({username: this.thisUser, friend: friend}).subscribe(
      res => this.getFriends(),
      err => console.log('HTTP Error', err)
    );
  }

  searchUsers(searchString: string){
    this.connect4.searchUsers(searchString).subscribe(
      res => this.searchedUsers = res["users"],
      err => console.log('HTTP Error', err)
    );
  }

  logout(){
    this.connect4.logout(this.thisUser).subscribe(
      res => {
        this.logIn = 1;
        this.leave();
      },
      err => console.log('HTTP Error', err)
    );
  }

  getGame(id: number){
    this.connect4.getGame(id).subscribe(
      res => {
        this.socket.emit("join", id);
        if(this.openGame === {} || this.openGame.id !== id){
          this.socket.emit("gameUpdate", id);
        }
        this.openGame = res;
        this.currentPage = 3;
        this.sidebar = false;
      },
      err => console.log('HTTP Error', err)
    );
  }

  move(putData: any){
    this.connect4.move(putData).subscribe(
      res => {
        this.socket.emit("gameUpdate", putData.id);
        this.getGame(putData.id);
      },
      err => console.log('HTTP Error', err)
    );
  }

  getGames(){
    this.connect4.getGames(this.thisUser).subscribe(
      res => {
        this.activeGames = res;
        this.sidebar = !this.sidebar
      },
      err => console.log('HTTP Error', err)
    );
  }

  forfeit(responseBody: any){
    this.connect4.forfeit(responseBody).subscribe(
    res => {
      this.getGame(responseBody.id);
      this.currentPage = 2;
    },
    err => console.log('HTTP Error', err)
    );
  }

  sendMessage(responseBody: any){
    this.connect4.sendMessage(responseBody).subscribe(
      res => {
        this.getGame(responseBody.id);
        this.socket.emit("gameUpdate", responseBody.id);
      },
      err => console.log('HTTP Error', err)
    );
  }

  leave(logout: boolean=false){
    this.connect4.leaveRoom(this.openGame.id).subscribe(
      res => {
        this.socket.emit("leaveGameRoom", this.openGame.id);
        this.socket.emit("gameUpdate", this.openGame.id);
        if(logout){
          this.logout()
          this.logIn = -1;
        }
        this.openGame = [];
      },
      err => console.log("HTTP Error", err)
    );
  }
}
