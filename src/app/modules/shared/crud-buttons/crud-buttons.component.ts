import { Component, Input, OnInit } from '@angular/core';
import { IFunctionHandler } from 'src/assets/model/navigation/IFunctionHandler';
import { Constants } from 'src/assets/util/Constants';
import { Actions, DefaultKeySettings, KeyBindings } from 'src/assets/util/KeyBindings';

@Component({
  selector: 'app-crud-buttons',
  templateUrl: './crud-buttons.component.html',
  styleUrls: ['./crud-buttons.component.scss']
})
export class CrudButtonsComponent implements OnInit {
  @Input() TileCssClass: string = '';
  @Input() currentForm?: IFunctionHandler;

  @Input() newButton: boolean = true;
  @Input() editButton: boolean = false;
  @Input() saveButton: boolean = true;
  @Input() resetButton: boolean = true;
  @Input() deleteButton: boolean = true;
  @Input() printButton: boolean = false;
  @Input() emailButton: boolean = false;
  @Input() csvButton: boolean = false;
  @Input() lockButton: boolean = false;

  @Input() KeySetting: Constants.KeySettingsDct = DefaultKeySettings;

  newButtonKey: KeyBindings = DefaultKeySettings[Actions.Create].KeyCode;
  editButtonKey: KeyBindings = DefaultKeySettings[Actions.Edit].KeyCode;
  saveButtonKey: KeyBindings = DefaultKeySettings[Actions.Save].KeyCode;
  resetButtonKey: KeyBindings = DefaultKeySettings[Actions.Reset].KeyCode;
  deleteButtonKey: KeyBindings = DefaultKeySettings[Actions.Delete].KeyCode;
  printButtonKey: KeyBindings = DefaultKeySettings[Actions.Print].KeyCode;
  emailButtonKey: KeyBindings = DefaultKeySettings[Actions.Email].KeyCode;
  csvButtonKey: KeyBindings = DefaultKeySettings[Actions.CSV].KeyCode;
  lockButtonKey: KeyBindings = DefaultKeySettings[Actions.Lock].KeyCode;

  @Input() newButtonDisabled: boolean = false;
  @Input() editButtonDisabled: boolean = false;
  @Input() saveButtonDisabled: boolean = false;
  @Input() resetButtonDisabled: boolean = false;
  @Input() deleteButtonDisabled: boolean = false;
  @Input() printButtonDisabled: boolean = false;
  @Input() emailButtonDisabled: boolean = false;
  @Input() csvButtonDisabled: boolean = false;
  @Input() lockButtonDisabled: boolean = false;

  @Input() wrapperClass: string = 'bbx-fd-sidebar-functions-center';

  public get keyBindings(): typeof KeyBindings {
    return KeyBindings;
  }

  constructor() { }

  ngOnInit(): void {
    console.log('KeySetting: ', this.KeySetting);
  }

}
