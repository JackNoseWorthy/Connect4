import { Component, OnInit, Output, EventEmitter, Input, } from '@angular/core';

@Component({
  selector: 'app-games-list',
  templateUrl: './games-list.component.html',
  styleUrls: ['./games-list.component.css']
})
export class GamesListComponent implements OnInit {
  @Input() games = [];
  opponents = [];
  @Output()
  newGame = new EventEmitter<string>();

  @Output()
  playGame = new EventEmitter<number>();
  constructor() {  }

  onNewGame(){
    this.newGame.emit('complete');
  }

  onPlayGame(id: number){
    this.playGame.emit(id);
  }

  ngOnInit(): void {
  }

  getOpponents(){
    this.opponents = [];
    for(let game of this.games){
      this.opponents.push(game.opponent);
    }
    return this.opponents;
  }

  gamesNotEmpty(){
    if(this.games.length > 0){
      return true;
    }
    return false;
  }

}
