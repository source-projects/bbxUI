import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { NbEvaIconsModule } from '@nebular/eva-icons';
import { NbLayoutModule, NbCardModule, NbButtonModule, NbTreeGridModule, NbTabsetModule, NbButtonGroupModule, NbProgressBarModule, NbSpinnerModule, NbDatepickerModule, NbFormFieldModule, NbInputModule, NbContextMenuModule, NbActionsModule, NbPopoverModule, NbMenuModule, NbTagModule, NbCheckboxModule, NbTooltipModule, NbAutocompleteModule, NbRadioModule, NbToggleModule } from '@nebular/theme';
import { InputMaskModule } from '@ngneat/input-mask';
import { AngularSplitModule } from 'angular-split';
import { NgxMaskModule } from 'ngx-mask';
import { SharedModule } from '../shared/shared.module';
import { InvoiceModule } from '../invoice/invoice.module';
import { OfferNavComponent } from './offer-nav/offer-nav.component';
import { OfferCreatorComponent } from './offer-creator/offer-creator.component';
import { OfferEditorComponent } from './offer-editor/offer-editor.component';
import { AngularEditorModule } from '@kolkov/angular-editor';
import { HttpClientModule } from '@angular/common/http';
import { OfferUpdateDialogComponent } from './offer-update-dialog/offer-update-dialog.component';
import { BaseOfferEditorComponent } from './base-offer-editor/base-offer-editor.component';

@NgModule({
  declarations: [
    OfferNavComponent,
    OfferCreatorComponent,
    OfferEditorComponent,
    OfferUpdateDialogComponent,
    BaseOfferEditorComponent
  ],
  imports: [
    CommonModule,
    NbLayoutModule,
    NbCardModule,
    NbButtonModule,
    FormsModule,
    ReactiveFormsModule,
    NbTreeGridModule,
    NbTabsetModule,
    NbButtonGroupModule,
    NbProgressBarModule,
    NbSpinnerModule,
    NbDatepickerModule,
    NbFormFieldModule,
    NbInputModule,
    NgxMaskModule.forChild(),
    NbContextMenuModule,
    NbActionsModule,
    NbEvaIconsModule,
    NbPopoverModule,
    NbMenuModule,
    NbTagModule,
    NbCheckboxModule,
    NbTooltipModule,
    AngularSplitModule,
    NbAutocompleteModule,
    SharedModule,
    InputMaskModule,
    NbRadioModule,
    NbToggleModule,
    InvoiceModule,
    HttpClientModule,
    AngularEditorModule
  ],
  exports: [
    OfferNavComponent,
    OfferCreatorComponent,
    OfferEditorComponent
  ]
})
export class OfferModule { }