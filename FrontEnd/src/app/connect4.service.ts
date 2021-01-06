import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { strict } from 'assert';
//import { request } from 'http';     //I have no idea what this is, where it came from, or what it does, but it's here, and it's throwing an error

@Injectable({
  providedIn: 'root'
})
export class Connect4Service {

  constructor(private http: HttpClient) { }

  public getProfile(username: string, requester: string){
    return this.http.get('/api/getProfile/' + username);
  }

  public login(loginRequest: object){
    return this.http.post('/api/login', JSON.stringify(loginRequest), {
      headers: {
        "Content-Type": "application/json"
      }
    });
  }

  public register(registerRequest: object){
    return this.http.post('/api/register', JSON.stringify(registerRequest), {
      headers: {
        "Content-Type": "application/json"
      }
    });
  }

  public updatePrivacy(privacyRequest: object){
    return this.http.put('/api/privacy', JSON.stringify(privacyRequest), {
      headers: {
        "Content-Type": "application/json"
      }
    });
  }

  public getFriends(){
    return this.http.get('/api/friends');
  }

  public makeFriendRequest(requestData: object){
    return this.http.post('/api/sendFriendRequest', JSON.stringify(requestData), {
      headers: {
        "Content-Type": "application/json"
      }
    });
  }

  public acceptFriendRequest(requestData: object){
    return this.http.post('/api/acceptFriendRequest', JSON.stringify(requestData), {
      headers: {
        "Content-Type": "application/json"
      }
    });
  }

  public rejectFriendRequest(requestData: object){
    return this.http.request('delete', '/api/rejectFriendRequest', {
      body: JSON.stringify(requestData),
      headers: {
        "Content-Type": "application/json"
      }
    });
  }

  public removeFriend(requestData: object){
    return this.http.request('delete', '/api/removeFriend', {
      body: JSON.stringify(requestData),
      headers: {
        "Content-Type": "application/json"
      }
    });
  }

  public searchUsers(searchString: string){
    return this.http.get('api/searchUsers/' + searchString);
  }

  public logout(username: string){
    return this.http.put('/api/logout', JSON.stringify({username: username}),{
      headers: {
        "Content-Type": "application/json"
      }
    })
  }

  public getGame(id: number){
    return this.http.get('/api/getGame/' + id.toString());
  }

  public move(putData: object){
    return this.http.put('/api/move', JSON.stringify(putData), {
      headers: {
        "Content-Type": "application/json"
      }
    })
  }

  public getGames(username: string){
    return this.http.get('/api/getActiveGames', {
      params: {
        username: username
      }
    });
  }

  public forfeit(requestBody: object){
    return this.http.put('/api/forfeit', requestBody);
  }

  public getOpponents(username: string){
    return this.http.get('/api/getOpponents', {
      params: {
        username: username
      }
    });
  }

  public newGame(requestData: object){
    return this.http.post('/api/newGame', requestData);
  }

  public sendMessage(requestData: object){
    return this.http.put('/api/sendMessage', JSON.stringify(requestData), {
      headers: {
        "Content-Type": "application/json"
      }
    })
  }

  public leaveRoom(id: number){
    return this.http.request('delete', '/api/leaveRoom', {
      body: JSON.stringify({"id": id}),
      headers: {
        "Content-Type": "application/json"
      }
    });
  }

}
