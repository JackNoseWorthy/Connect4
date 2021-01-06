import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';

//Form Control
import { FormGroup, FormControl, Validators } from '@angular/forms';

@Component({
  selector: 'app-game-board',
  templateUrl: './game-board.component.html',
  styleUrls: ['./game-board.component.css']
})

export class GameBoardComponent implements OnInit {
  @Input() username = '';
  @Input() board = [];
  @Input() turn = '';
  @Input() chats = [];
  @Input() id = NaN;
  @Input() player1 = '';
  @Input() player2 = '';
  @Input() moveOrder = [];
  @Input() moveOrderIndex = 0;
  @Input() viewers = [];

  @Output() move = new EventEmitter<object>();
  @Output() forfeit = new EventEmitter<object>();
  @Output() message = new EventEmitter<object>();

  

  messageForm = new FormGroup({
    message: new FormControl('', [Validators.required]),
  });

  constructor() { }

  ngOnInit(): void {
  }

  play(col: number){
    if(this.turn === this.username && this.moveOrderIndex == this.moveOrder.length - 1){
      //The turn variable is set to empty string to avoid allowing players to make two moves before the request is processed
      this.turn = "";
      for(let i=0; i<8; i++){
        if(this.board[i][col] === 0){
          if(this.player1 === this.username){
            this.board[i][col] = 1;
          }else{
            this.board[i][col] = 2;
          }
          break;
        }
      }
      let winner = null;
      if(this.checkWin()){
        winner = this.username;
      }else if(this.checkTie()){
        winner = "Tie";
      }
      this.move.emit({
        id: this.id,
        board: this.board,
        winner: winner
      });
    }
  }

  getState(row: number, col: number){
    return(this.board[row][col]);
  }

  checkWin(){
    for(let i = 0; i<7; i++){
      for(let j = 0; j < 4; j++){
        if(this.board[i][j] !== 0 && this.board[i][j] === this.board[i][j+1] && this.board[i][j] === this.board[i][j+2] && this.board[i][j] === this.board[i][j+3]){
          this.removeButtons()
          return true;
        }
      }
    }
    for(let i = 0; i < 7; i++){
      for(let j = 0; j < 4; j++){
        if(this.board[j][i] !== 0 && this.board[j][i] === this.board[j+1][i] && this.board[j][i] === this.board[j+2][i] && this.board[j][i] === this.board[j+3][i]){
          this.removeButtons()
          return true;
        }
      }
    }
    for(let i = 0; i < 4; i++){
      for(let j = 0; j < 4; j++){
        if(this.board[i][j] !== 0 && this.board[i][j] === this.board[i+1][j+1] && this.board[i][j] === this.board[i+2][j+2] && this.board[i][j] === this.board[i+3][j+3]){
          this.removeButtons()
          return true;
        }
      }
    }
    for(let i = 0; i<4; i++){
      for(let j = 3; j<7; j++){
        if(this.board[i][j] !== 0 && this.board[i][j] === this.board[i+1][j-1] && this.board[i][j] === this.board[i+2][j-2] && this.board[i][j] === this.board[i+3][j-3]){
          this.removeButtons()
          return true;
        }
      }
    }
    return false;
  }

  checkTie(){
    for(let i = 0; i < 7; i++){
      if(this.board[6][i] !== 1 && this.board[6][i] !== 2){
        return false;
      }
    }
    return true;
  }

  removeButtons(){
    for(let i = 6; i >= 0; i--){
      for(let j = 6; j >= 0; j--){
        if(this.board[j][i] === 0){
          this.board[j][i] = 4;
        }else{
          break;
        }
      }
    }
  }

  forfeitGame(){
    this.forfeit.emit({
      id: this.id,
      username: this.username
    });
  }

  isPlaying(){
    return (this.username === this.player1 || this.username === this.player2) && this.turn !== null;
  }

  send(){
    let newMessage = this.messageForm.controls.message.value;
    this.message.emit({
      id: this.id,
      username: this.username,
      message: newMessage
    });
    this.messageForm.reset(this.messageForm);
  }

  previous(){

    for (let i = 6; i >= 0; i--){
      if(this.board[i][this.moveOrder[this.moveOrderIndex]]===1 || this.board[i][this.moveOrder[this.moveOrderIndex]]===2){
        this.board[i][this.moveOrder[this.moveOrderIndex]] = 4;
        this.moveOrderIndex --;
        break;
      }
    }
  }

  next(){
    this.moveOrderIndex ++;
    for(let i=0; i<7; i++){
      if(this.board[i][this.moveOrder[this.moveOrderIndex]] === 0 || this.board[i][this.moveOrder[this.moveOrderIndex]] === 4){
        this.board[i][this.moveOrder[this.moveOrderIndex]] = this.getColor();
        break;
      }
    }
  }

  getColor(){
    let oneCount = 0;
    let twoCount = 0;
    for(let i=0; i<7; i++){
      for(let j=0; j<7; j++){
        if(this.board[i][j]===1){
          oneCount++;
        }else if (this.board[i][j]===2){
          twoCount++;
        }
      }
    }
    if(oneCount > twoCount){
      return 2;
    }
    return 1;
  }

}
