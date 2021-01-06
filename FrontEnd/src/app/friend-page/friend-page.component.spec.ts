import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { FriendPageComponent } from './friend-page.component';

describe('FriendPageComponent', () => {
  let component: FriendPageComponent;
  let fixture: ComponentFixture<FriendPageComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ FriendPageComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(FriendPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
