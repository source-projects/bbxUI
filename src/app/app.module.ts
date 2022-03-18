import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { HttpClientModule } from '@angular/common/http';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { NbThemeModule, NbLayoutModule, NbDatepickerModule, NbDialogModule, NbMenuModule, NbSidebarModule, NbToastrModule, NbSidebarService } from '@nebular/theme';
import { CoreModule } from './modules/core/core.module';
import { NgxElectronModule } from 'ngx-electron';
import { IConfig, NgxMaskModule } from 'ngx-mask';
import { SharedModule } from './modules/shared/shared.module';
import { AuthModule } from './modules/auth/auth.module';
import { CustomerModule } from './modules/customer/customer.module';
import { OriginModule } from './modules/origin/origin.module';
import { ProductModule } from './modules/product/product.module';
import { ProductGroupModule } from './modules/product-group/product-group.module';
import { PocModule } from './modules/poc/poc.module';
import { WarehouseModule } from './modules/warehouse/warehouse.module';
import { InputMaskModule } from '@ngneat/input-mask';
import { CounterModule } from './modules/counter/counter.module';

import { registerLocaleData } from '@angular/common';
import localeFr from '@angular/common/locales/fr';
registerLocaleData(localeFr, 'fr');

const maskConfig: Partial<IConfig> = {
  validation: false,
};

@NgModule({
  declarations: [
    AppComponent
  ],
  imports: [
    // Default
    BrowserModule,
    AppRoutingModule,
    NgxElectronModule,
    BrowserAnimationsModule,
    HttpClientModule,
    // Misc
    NgxMaskModule.forRoot(maskConfig),
    // Nebular
    NbLayoutModule,
    NbMenuModule.forRoot(),
    NbDialogModule.forRoot(),
    NbSidebarModule.forRoot(),
    NbThemeModule.forRoot({ name: 'cosmic' }),
    NbToastrModule.forRoot(),
    NbDatepickerModule.forRoot(),
    NbSidebarModule.forRoot(),
    // Custom
    SharedModule,
    AuthModule,
    CustomerModule,
    OriginModule,
    ProductGroupModule,
    ProductModule,
    PocModule,
    WarehouseModule,
    CounterModule,
    InputMaskModule,
    CoreModule,
  ],
  exports: [
    NbLayoutModule,
    NgxMaskModule
  ],
  providers: [
    NbSidebarService
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
