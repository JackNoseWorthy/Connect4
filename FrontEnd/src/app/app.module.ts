import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';

import { AppComponent } from './app.component';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

//NG Material
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule, MatButton } from '@angular/material/button';
import { MatGridListModule } from '@angular/material/grid-list';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { MatDialogModule } from '@angular/material/dialog';
import { MatRadioModule } from '@angular/material/radio';
import { MatDividerModule } from '@angular/material/divider';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBarModule } from '@angular/material/snack-bar';


//Forms
import { ReactiveFormsModule } from '@angular/forms';

//Http requests
import { HttpClientModule } from '@angular/common/http';

//Components
import { LoginComponent } from './login/login.component';
import { RegisterComponent } from './register/register.component';
import { GamesListComponent } from './games-list/games-list.component';
import { GameCardComponent } from './game-card/game-card.component';
import { GameBoardComponent } from './game-board/game-board.component';
import { ProfileComponent } from './profile/profile.component';
import { FriendPageComponent } from './friend-page/friend-page.component';
import { NewGameComponent } from './new-game/new-game.component';


@NgModule({
  declarations: [
    AppComponent,
    LoginComponent,
    RegisterComponent,
    GamesListComponent,
    GameCardComponent,
    GameBoardComponent,
    ProfileComponent,
    FriendPageComponent,
    NewGameComponent
  ],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatGridListModule,
    MatSidenavModule,
    MatToolbarModule,
    MatListModule,
    MatIconModule,
    MatDialogModule,
    MatRadioModule,
    MatDividerModule,
    MatSelectModule,
    MatSnackBarModule,
    ReactiveFormsModule,
    HttpClientModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
