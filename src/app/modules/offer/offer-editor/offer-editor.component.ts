import { AfterViewInit, ChangeDetectorRef, Component, HostListener, OnDestroy, OnInit, Optional, ViewChild } from '@angular/core';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import { NbTable, NbDialogService, NbTreeGridDataSourceBuilder, NbToastrService } from '@nebular/theme';
import { CommonService } from 'src/app/services/common.service';
import { FooterService } from 'src/app/services/footer.service';
import { KeyboardModes, KeyboardNavigationService } from 'src/app/services/keyboard-navigation.service';
import { StatusService } from 'src/app/services/status.service';
import { FooterCommandInfo } from 'src/assets/model/FooterCommandInfo';
import { IInlineManager } from 'src/assets/model/IInlineManager';
import { InlineEditableNavigatableTable } from 'src/assets/model/navigation/InlineEditableNavigatableTable';
import { AttachDirection, NavigatableForm as InlineTableNavigatableForm } from 'src/assets/model/navigation/Nav';
import { TreeGridNode } from 'src/assets/model/TreeGridNode';
import { todaysDate, validDate } from 'src/assets/model/Validators';
import { Constants } from 'src/assets/util/Constants';
import { Customer } from '../../customer/models/Customer';
import { GetCustomersParamListModel } from '../../customer/models/GetCustomersParamListModel';
import { CustomerService } from '../../customer/services/customer.service';
import { Product } from '../../product/models/Product';
import { ProductService } from '../../product/services/product.service';
import { HelperFunctions } from 'src/assets/util/HelperFunctions';
import { UtilityService } from 'src/app/services/utility.service';
import { InvoiceLine } from '../../invoice/models/InvoiceLine';
import { ProductSelectTableDialogComponent } from '../../invoice/product-select-table-dialog/product-select-table-dialog.component';
import { InvoiceService } from '../../invoice/services/invoice.service';
import { OfferLine, OfferLineFullData } from '../models/OfferLine';
import { OfferService } from '../services/offer.service';
import { ActivatedRoute, Router } from '@angular/router';
import { GetOfferParamsModel } from '../models/GetOfferParamsModel';
import { Offer } from '../models/Offer';
import { OfferUpdateDialogComponent } from '../offer-update-dialog/offer-update-dialog.component';
import { Actions, GetFooterCommandListFromKeySettings, KeyBindings, OfferEditorKeySettings } from 'src/assets/util/KeyBindings';
import { VatRateService } from '../../vat-rate/services/vat-rate.service';
import { GetVatRatesParamListModel } from '../../vat-rate/models/GetVatRatesParamListModel';
import { BbxToastrService } from 'src/app/services/bbx-toastr-service.service';
import { GetCustomerParamListModel } from '../../customer/models/GetCustomerParamListModel';
import { ProductDialogTableSettings } from 'src/assets/model/TableSettings';
import { OfferUtil } from '../models/OfferUtil';
import { BaseOfferEditorComponent } from '../base-offer-editor/base-offer-editor.component';

@Component({
  selector: 'app-offer-editor',
  templateUrl: './offer-editor.component.html',
  styleUrls: ['./offer-editor.component.scss']
})
export class OfferEditorComponent extends BaseOfferEditorComponent implements OnInit, AfterViewInit, OnDestroy, IInlineManager {
  @ViewChild('table') override table?: NbTable<any>;

  originalCustomerId: number = 0;

  public KeySetting: Constants.KeySettingsDct = OfferEditorKeySettings;
  override readonly commands: FooterCommandInfo[] = GetFooterCommandListFromKeySettings(this.KeySetting);

  offerData!: Offer;

  idFromPath?: number;

  constructor(
    @Optional() dialogService: NbDialogService,
    fS: FooterService,
    dataSourceBuilder: NbTreeGridDataSourceBuilder<TreeGridNode<OfferLine>>,
    seInv: InvoiceService,
    offerService: OfferService,
    seC: CustomerService,
    cdref: ChangeDetectorRef,
    kbS: KeyboardNavigationService,
    bbxToastrService: BbxToastrService,
    simpleToastrService: NbToastrService,
    cs: CommonService,
    sts: StatusService,
    productService: ProductService,
    vatRateService: VatRateService,
    utS: UtilityService,
    router: Router,
    route: ActivatedRoute,
  ) {
    super(
      dialogService, fS, dataSourceBuilder, seInv, offerService,
      seC, cdref, kbS, bbxToastrService, simpleToastrService, cs,
      sts, productService, utS, router, vatRateService, route
    );
    this.InitialSetup();
  }

  override InitialSetup(): void {
    this.dbDataTableId = "offers-inline-table-invoice-line";
    this.cellClass = "PRODUCT";

    // Init form and table content - empty
    this.buyerData = {} as Customer;

    this.offerData = {
      id: 0,
      offerNumber: '',
      customerName: '',
      customerBankAccountNumber: '',
      customerTaxpayerNumber: '',
      customerCountryCode: '',
      customerPostalCode: '',
      customerCity: '',
      customerAdditionalAddressDetail: '',
      offerNumberX: '',
      CustomerComment: '',
      offerVersion : -1,
      latestVersion: true,
      customerID: -1,
      offerIssueDate: '',
      offerVaidityDate: '',
      copies: 0,
      deleted: false,
      notice: '',
      newOffer: false,
      offerLines: [],
    } as Offer;

    this.dbData = [];
    this.dbDataDataSrc = this.dataSourceBuilder.create(this.dbData);

    if (this.buyerForm === undefined) {
      this.buyerForm = new FormGroup({
        customerSearch: new FormControl('', []),
        customerName: new FormControl('', [Validators.required]),
        customerAddress: new FormControl('', [Validators.required]),
        customerTaxNumber: new FormControl('', [Validators.required]),
        offerIssueDate: new FormControl('', [
          Validators.required,
          //this.validateOfferIssueDate.bind(this),
          todaysDate,
          validDate
        ]),
        offerVaidityDate: new FormControl('', [
          Validators.required,
          //this.validateOfferValidityDate.bind(this),
          validDate
        ]),
        notice: new FormControl('', []),
        offerNumberX: new FormControl('', []),
      });
    } else {
      this.buyerForm.reset(undefined);
    }

    this.buyerFormNav = new InlineTableNavigatableForm(
      this.buyerForm,
      this.kbS,
      this.cdref,
      this.buyersData,
      this.buyerFormId,
      AttachDirection.DOWN,
      this
    );

    this.buyerFormNav!.OuterJump = true;

    console.log('new InvoiceLine(): ', new InvoiceLine());

    this.dbDataTable = new InlineEditableNavigatableTable(
      this.dataSourceBuilder,
      this.kbS,
      this.fS,
      this.cdref,
      this.dbData,
      this.dbDataTableId,
      AttachDirection.DOWN,
      () => {
        return new OfferLine();
      },
      this
    );

    this.dbDataTable!.OuterJump = true;

    // Refresh data
    this.refresh();
  }

  private LoadAndSetDataForEdit(): void {
    this.idFromPath = parseInt(this.route.snapshot.params['id'], 10);
    console.log("ID for edit: ", this.idFromPath);

    this.isLoading = true;

    this.offerService.Get({
      ID: this.idFromPath, FullData: true
    } as GetOfferParamsModel).subscribe({
      next: res => {
        if (!!res) {
          this.buyerForm.controls['customerName'].setValue(res.customerName);
          this.buyerForm.controls['customerAddress'].setValue(res.customerPostalCode + ', ' + res.customerCity);
          this.buyerForm.controls['customerTaxNumber'].setValue(res.customerTaxpayerNumber);
          this.buyerForm.controls['offerIssueDate'].setValue(res.offerIssueDate);
          this.buyerForm.controls['offerVaidityDate'].setValue(res.offerVaidityDate);
          this.buyerForm.controls['notice'].setValue(res.notice);
          this.buyerForm.controls['offerNumberX'].setValue(res.offerNumberX);

          this.offerData = res;

          this.buyerData.id = this.offerData.customerID;
          this.originalCustomerId = this.offerData.customerID;
          this.seC.Get({ ID: this.buyerData.id } as GetCustomerParamListModel).subscribe({
            next: res => {
              if (!!res) {
                this.buyerData = res;
                this.buyerForm.controls['customerName'].setValue(res.customerName);
                this.buyerForm.controls['customerAddress'].setValue(res.postalCode + ', ' + res.city);
                this.buyerForm.controls['customerTaxNumber'].setValue(res.taxpayerNumber);
              } else {
                this.bbxToastrService.show(
                  `A szerkesztésre betöltött ajánlatban található ügyfélazonosítóhoz (${this.buyerData.id}) nem található ügyfél.`,
                  Constants.TITLE_ERROR,
                  Constants.TOASTR_ERROR
                );
              }
            },
            error: (err) => {
              this.cs.HandleError(err, `Hiba a ${this.buyerData.id} azonosítóval rendelkező ügyfél betöltése közben:\n`);
            },
            complete: () => {
              this.isLoading = false;
            }
          });

          this.dbData = this.offerData.offerLines!.map(x =>
            { return { data: OfferLine.FromOfferLineFullData(x) } as TreeGridNode<OfferLine> }
          ).concat(this.dbData);

          this.table?.renderRows();
        }
      },
      error: (err) => {
        this.cs.HandleError(err);
      },
      complete: () => {
        this.isLoading = false;
      },
    });
  }

  ngOnInit(): void {
    this.LoadAndSetDataForEdit();
    
    this.fS.pushCommands(this.commands);
  }
  ngAfterViewInit(): void {
    this.AfterViewInitSetup();
  }
  ngOnDestroy(): void {
    console.log("Detach");
    this.kbS.Detach();
  }

  private UpdateSaveData(): void {
    this.offerData.customerID = this.buyerData.id;

    this.offerData.notice = this.buyerForm.controls['notice'].value;

    this.offerData.offerIssueDate =
      HelperFunctions.FormFieldStringToDateTimeString(this.buyerForm.controls['offerIssueDate'].value);
    this.offerData.offerVaidityDate =
      HelperFunctions.FormFieldStringToDateTimeString(this.buyerForm.controls['offerVaidityDate'].value);

    this.offerData.offerLines = this.dbData.filter(x => !x.data.IsUnfinished()).map(x => 
      {
        return {
          productCode: x.data.productCode,
          lineDescription: x.data.lineDescription,
          vatRateCode: x.data.vatRateCode,
          unitPrice: x.data.UnitPriceForCalc,
          unitVat: this.ToFloat(x.data.unitVat),
          unitGross: this.ToFloat(x.data.unitGross),
          discount: x.data.DiscountForCalc,
          showDiscount: x.data.showDiscount,
          unitOfMeasure: x.data.unitOfMeasure,
          id: x.data.id,
          offerID: x.data.offerID,
          productID: x.data.productID,
          unitOfMeasureX: x.data.unitOfMeasureX,
          vatRateID: x.data.vatRateID,
          vatPercentage: x.data.vatPercentage
        } as OfferLineFullData
      }
    );

    for (let i = 0; i < this.offerData.offerLines.length; i++) {
      this.offerData.offerLines[i].unitPrice = HelperFunctions.ToFloat(this.offerData.offerLines[i].unitPrice);
      this.offerData.offerLines[i].lineNumber = HelperFunctions.ToInt(i + 1);
    }

    console.log('[UpdateSaveData] offerData: ', this.offerData, ', dbData: ', this.dbData);
  }

  override Save(): void {
    this.UpdateSaveData();

    console.log('Save: ', this.offerData);

    this.isLoading = true;
    this.kbS.setEditMode(KeyboardModes.NAVIGATION);

    const dialogRef = this.dialogService.open(OfferUpdateDialogComponent, {
      context: {}
    });
    dialogRef.onClose.subscribe((selectedSaveOption: number) => {
      console.log("Selected option: ", selectedSaveOption);

      this.isLoading = false;

      if (selectedSaveOption !== undefined && selectedSaveOption >= 0) {

        if (selectedSaveOption === OfferUtil.EditSaveModes.SAVE_WITH_VERSIONING) {
          this.offerData.offerVersion += 1;
        }
        else if (selectedSaveOption === OfferUtil.EditSaveModes.SAVE_NEW_VERSION) {
          this.offerData.newOffer = true;
        }

        this.isLoading = true;

        this.offerService.Update(this.offerData).subscribe({
          next: d => {
            if (!!d.data) {
              console.log('Save response: ', d);

              this.simpleToastrService.show(
                Constants.MSG_SAVE_SUCCESFUL,
                Constants.TITLE_INFO,
                Constants.TOASTR_SUCCESS_5_SEC
              );

              this.ExitToNav();
            } else {
              this.cs.HandleError(d.errors);
              this.isLoading = false;
            }
          },
          error: err => {
            this.cs.HandleError(err);
            this.isLoading = false;
            if (selectedSaveOption > 1) {
              this.offerData.offerVersion -= 1;
              this.offerData.newOffer = false;
            }
          },
          complete: () => {
            this.isLoading = false;
          }
        });
      }
    });
  }

  override ChooseDataForTableRow(rowIndex: number): void {
    console.log("Selecting InvoiceLine from avaiable data.");

    this.kbS.setEditMode(KeyboardModes.NAVIGATION);

    const dialogRef = this.dialogService.open(ProductSelectTableDialogComponent, {
      context: {
        searchString: this.dbDataTable.editedRow?.data.productCode ?? '',
        allColumns: ProductDialogTableSettings.ProductSelectorDialogAllColumns,
        colDefs: ProductDialogTableSettings.ProductSelectorDialogColDefs
      }
    });
    dialogRef.onClose.subscribe((res: Product) => {
      console.log("Selected item: ", res);
      if (!!res) {
        this.isLoading = true;

        this.vatRateService.GetAll({} as GetVatRatesParamListModel).subscribe({
          next: d => {
            if (!!d.data) {
              console.log('Vatrates: ', d.data);

              let vatRateFromProduct = d.data.find(x => x.vatRateCode === res.vatRateCode);

              if (vatRateFromProduct === undefined) {
                this.bbxToastrService.show(
                  `Áfa a kiválasztott termékben található áfakódhoz (${res.vatRateCode}) nem található.`,
                  Constants.TITLE_ERROR,
                  Constants.TOASTR_ERROR
                );
              }

              this.dbDataTable.FillCurrentlyEditedRow({ data: OfferLine.FromProduct(res, this.offerData.id, vatRateFromProduct?.id ?? 0)});
              this.kbS.setEditMode(KeyboardModes.NAVIGATION);
              this.dbDataTable.MoveNextInTable();
              setTimeout(() => {
                this.kbS.setEditMode(KeyboardModes.EDIT);
                this.kbS.ClickCurrentElement();
              }, 500);
            } else {
              this.cs.HandleError(d.errors);
              this.isLoading = false;

              this.dbDataTable.FillCurrentlyEditedRow({ data: OfferLine.FromProduct(res, this.offerData.id) });
              this.kbS.setEditMode(KeyboardModes.NAVIGATION);
              this.dbDataTable.MoveNextInTable();
              setTimeout(() => {
                this.kbS.setEditMode(KeyboardModes.EDIT);
                this.kbS.ClickCurrentElement();
              }, 500);
            }
          },
          error: err => {
            this.cs.HandleError(err);
            this.isLoading = false;

            this.dbDataTable.FillCurrentlyEditedRow({ data: OfferLine.FromProduct(res, this.offerData.id) });
            this.kbS.setEditMode(KeyboardModes.NAVIGATION);
            this.dbDataTable.MoveNextInTable();
            setTimeout(() => {
              this.kbS.setEditMode(KeyboardModes.EDIT);
              this.kbS.ClickCurrentElement();
            }, 500);
          },
          complete: () => {
            this.isLoading = false;
          }
        });
      }
    });
  }

  override FillFormWithFirstAvailableCustomer(event: any): void {
    if (!!this.Subscription_FillFormWithFirstAvailableCustomer && !this.Subscription_FillFormWithFirstAvailableCustomer.closed) {
      this.Subscription_FillFormWithFirstAvailableCustomer.unsubscribe();
    }

    this.customerInputFilterString = event.target.value ?? '';

    if (this.customerInputFilterString.replace(' ', '') === '') {
      this.isLoading = true;
      this.Subscription_FillFormWithFirstAvailableCustomer = this.seC.Get({ ID: this.originalCustomerId } as GetCustomerParamListModel).subscribe({
        next: res => {
          if (!!res) {
            this.buyerData = res;
            this.buyerForm.controls['customerName'].setValue(res.customerName);
            this.buyerForm.controls['customerAddress'].setValue(res.postalCode + ', ' + res.city);
            this.buyerForm.controls['customerTaxNumber'].setValue(res.taxpayerNumber);
          } else {
            this.bbxToastrService.show(
              `A szerkesztésre betöltött ajánlatban található ügyfélazonosítóhoz (${this.buyerData.id}) nem található ügyfél.`,
              Constants.TITLE_ERROR,
              Constants.TOASTR_ERROR
            );
          }
        },
        error: (err) => {
          this.cs.HandleError(err, `Hiba a ${this.buyerData.id} azonosítóval rendelkező ügyfél betöltése közben:\n`);
        },
        complete: () => {
          this.isLoading = false;
        }
      });
    } else {
      this.isLoading = true;
      this.Subscription_FillFormWithFirstAvailableCustomer = this.seC.GetAll({
        IsOwnData: false, PageNumber: '1', PageSize: '1', SearchString: this.customerInputFilterString
      } as GetCustomersParamListModel).subscribe({
        next: res => {
          if (!!res && res.data !== undefined && res.data.length > 0) {
            this.buyerData = res.data[0];
            this.cachedCustomerName = res.data[0].customerName;
            this.SetCustomerFormFields(res.data[0]);
            this.searchByTaxtNumber = false;
          } else {
            if (this.customerInputFilterString.length >= 8 &&
              this.IsNumber(this.customerInputFilterString)) {
              this.searchByTaxtNumber = true;
            } else {
              this.searchByTaxtNumber = false;
            }
            this.SetCustomerFormFields(undefined);
          }
        },
        error: (err) => {
          this.cs.HandleError(err); this.isLoading = false;
          this.searchByTaxtNumber = false;
        },
        complete: () => {
          this.isLoading = false;
        },
      });
    }
  }

  @HostListener('window:keydown', ['$event']) onFunctionKeyDown(event: KeyboardEvent) {
    if (event.ctrlKey && event.key == 'Enter' && this.KeySetting[Actions.CloseAndSave].KeyCode === KeyBindings.CtrlEnter) {
      this.CheckSaveConditionsAndSave();
      return;
    }
    switch(event.key) {
      case this.KeySetting[Actions.ToggleAllDiscounts].KeyCode: {
        event.preventDefault();
        this.ToggleAllShowDiscount();
        break;
      }
      case this.KeySetting[Actions.SetGlobalDiscount].KeyCode: {
        event.preventDefault();
        this.SetGlobalDiscount();
        break;
      }
      case this.KeySetting[Actions.EscapeEditor1].KeyCode: {
        event.preventDefault();
        this.ExitToNav();
        break;
      }
    }
  }
}
