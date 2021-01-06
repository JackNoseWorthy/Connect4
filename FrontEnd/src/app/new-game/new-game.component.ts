import { Component, OnInit, Inject } from '@angular/core';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';

export interface DialogData{
  friends: string[];
}

@Component({
  selector: 'app-new-game',
  templateUrl: './new-game.component.html',
  styleUrls: ['./new-game.component.css']
})
export class NewGameComponent implements OnInit {

  newGameForm = new FormGroup({
    opponent: new FormControl('', [Validators.required]),
    privacy: new FormControl('1', [Validators.required])
  });

  opponentType = 1;
  privacyType = 1;

  constructor(private dialogRef: MatDialogRef<NewGameComponent>, @Inject(MAT_DIALOG_DATA) public data: DialogData) {}

  ngOnInit(): void {
  }

  onSubmit(){
    this.dialogRef.close(this.newGameForm.value);
  }


}
