import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';

@Component({
  selector: 'app-profile',
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.css']
})
export class ProfileComponent implements OnInit {
  @Input() username = '';
  @Input() gamesPlayed = 0;
  @Input() gamesWon = 0;
  @Input() movesMade = 0;
  @Input() games = [];
  @Input() lastFive = [];
  @Input() privacy = '';

  @Output() onPrivacy = new EventEmitter<string>();
  @Output() playGame = new EventEmitter<number>();

  winPercentage = 0;

  constructor() { }

  ngOnInit(): void {
  }

  togglePrivacy(){
    if(this.privacy === 'Public'){
      this.privacy = 'Private';
    }else{
      this.privacy = 'Public';
    }
    this.onPrivacy.emit(this.privacy);
  }

  getWinPercentage(){
    this.winPercentage = Math.round((this.gamesWon/this.gamesPlayed + Number.EPSILON) * 10000)/100;
    
    if(this.gamesPlayed === 0){
      return 0;
    }
    return this.winPercentage;
  }

  onPlayGame(id: number){
    this.playGame.emit(id);
  }

}
