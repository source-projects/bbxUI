import { AfterViewInit, ChangeDetectorRef, Component, HostListener, OnInit, Optional, ViewChild } from '@angular/core';
import { NbTable, NbDialogService, NbTreeGridDataSourceBuilder, NbToastrService } from '@nebular/theme';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { BbxSidebarService } from 'src/app/services/bbx-sidebar.service';
import { BbxToastrService } from 'src/app/services/bbx-toastr-service.service';
import { CommonService } from 'src/app/services/common.service';
import { FooterService } from 'src/app/services/footer.service';
import { KeyboardNavigationService, KeyboardModes } from 'src/app/services/keyboard-navigation.service';
import { SideBarFormService } from 'src/app/services/side-bar-form.service';
import { StatusService } from 'src/app/services/status.service';
import { ModelFieldDescriptor } from 'src/assets/model/ModelFieldDescriptor';
import { TileCssClass, AttachDirection, TileCssColClass, NavMatrixOrientation } from 'src/assets/model/navigation/Navigatable';
import { TreeGridNode } from 'src/assets/model/TreeGridNode';
import { Constants } from 'src/assets/util/Constants';
import { FlatDesignNoFormNavigatableTable } from 'src/assets/model/navigation/FlatDesignNoFormNavigatableTable';
import { BaseNoFormManagerComponent } from '../../shared/base-no-form-manager/base-no-form-manager.component';
import { FlatDesignNoTableNavigatableForm } from 'src/assets/model/navigation/FlatDesignNoTableNavigatableForm';
import { HelperFunctions } from 'src/assets/util/HelperFunctions';
import { Customer } from '../../customer/models/Customer';
import { CustomerService } from '../../customer/services/customer.service';
import { IInlineManager } from 'src/assets/model/IInlineManager';
import { IFunctionHandler } from 'src/assets/model/navigation/IFunctionHandler';
import { Actions, KeyBindings, GetFooterCommandListFromKeySettings, InvRowNavKeySettings } from 'src/assets/util/KeyBindings';
import { FooterCommandInfo } from 'src/assets/model/FooterCommandInfo';
import { Router } from '@angular/router';
import { InfrastructureService } from '../../infrastructure/services/infrastructure.service';
import { UtilityService } from 'src/app/services/utility.service';
import { OneTextInputDialogComponent } from '../../shared/one-text-input-dialog/one-text-input-dialog.component';
import { BehaviorSubject, lastValueFrom, Subscription } from 'rxjs';
import { InvRow } from '../models/InvRow';
import { GetAllInvCtrlItemsParamListModel } from '../models/GetAllInvCtrlItemsParamListModel';
import { InvCtrlPeriod } from '../models/InvCtrlPeriod';
import { InventoryService } from '../services/inventory.service';
import { InventoryCtrlItemService } from '../services/inventory-ctrl-item.service';
import { InvCtrlItemForGet } from '../models/InvCtrlItem';
import { InvCtrlAbsent } from '../../stock/models/InvCtrlAbsent';
import { StockService } from '../../stock/services/stock.service';
import { GetAllInvCtrlAbsentParamsModel } from '../../stock/models/GetAllInvCtrlAbsentParamsModel';

@Component({
  selector: 'app-inv-ctrl-absent',
  templateUrl: './inv-ctrl-absent.component.html',
  styleUrls: ['./inv-ctrl-absent.component.scss']
})
export class InvCtrlAbsentComponent extends BaseNoFormManagerComponent<InvCtrlAbsent> implements IFunctionHandler, IInlineManager, OnInit, AfterViewInit {
  @ViewChild('table') table?: NbTable<any>;


  public get keyBindings(): typeof KeyBindings {
    return KeyBindings;
  }

  readonly SearchButtonId: string = 'invrow-button-search';
  IsTableFocused: boolean = false;

  TileCssClass = TileCssClass;
  TileCssColClass = TileCssColClass;

  customerInputFilterString: string = '';

  isDeleteDisabled: boolean = false;

  buyerData!: Customer;
  buyersData: Customer[] = [];

  override allColumns = [
    'productCode',
    'product',
    'avgCost',
    'latestIn',
    'latestOut'
  ];
  override colDefs: ModelFieldDescriptor[] = [
    {
      label: 'Termékkód',
      objectKey: 'productCode',
      colKey: 'productCode',
      defaultValue: '',
      type: 'string',
      fInputType: 'readonly',
      mask: '',
      colWidth: '20%',
      textAlign: 'left',
      navMatrixCssClass: TileCssClass,
    },
    {
      label: 'Termkéknév',
      objectKey: 'product',
      colKey: 'product',
      defaultValue: '',
      type: 'string',
      fInputType: 'text',
      mask: '',
      colWidth: '80%',
      textAlign: 'left',
      navMatrixCssClass: TileCssClass,
    },
    {
      label: 'ELÁBÉ',
      objectKey: 'avgCost',
      colKey: 'avgCost',
      defaultValue: '',
      type: 'formatted-number',
      fRequired: true,
      mask: '',
      colWidth: '130px',
      textAlign: 'right',
      navMatrixCssClass: TileCssClass,
    },
    {
      label: 'Ut. besz',
      objectKey: 'latestIn',
      colKey: 'latestIn',
      defaultValue: '',
      type: 'onlyDate',
      fInputType: 'text',
      fRequired: true,
      mask: '',
      colWidth: '130px',
      textAlign: 'left',
      navMatrixCssClass: TileCssClass,
    },
    {
      label: 'Ut. kiad',
      objectKey: 'latestOut',
      colKey: 'latestOut',
      defaultValue: '',
      type: 'onlyDate',
      fInputType: 'text',
      fRequired: true,
      mask: '',
      colWidth: '130px',
      textAlign: 'left',
      navMatrixCssClass: TileCssClass,
    }
  ];

  get CustomerId(): number | undefined {
    if (!!this.buyerData && this.buyerData.id > -1) {
      return this.buyerData.id;
    } else {
      return undefined
    }
  }

  invCtrlPeriods: string[] = [];
  invCtrlPeriodValues: { [key: string]: InvCtrlPeriod } = {};
  invCtrlPeriodComboData$: BehaviorSubject<string[]> = new BehaviorSubject<string[]>([]);

  get SelectedInvCtrlPeriod(): InvCtrlPeriod | undefined {
    return this.filterForm.controls['invCtrlPeriod'].value !== undefined ?
      this.invCtrlPeriodValues[this.filterForm.controls['invCtrlPeriod'].value ?? -1] : undefined;
  }

  get SelectedInvCtrlPeriodComboValue(): string | undefined {
    return this.filterForm.controls['invCtrlPeriod'].value;
  }

  override get getInputParams(): GetAllInvCtrlAbsentParamsModel {

    return {
      OrderBy: "ProductCode",
      PageNumber: this.dbDataTable.currentPage,
      PageSize: parseInt(this.dbDataTable.pageSize),
      InvCtrlPeriodID: this.SelectedInvCtrlPeriod?.id,
      SearchString: this.filterForm.controls['searchString'].value,
      IsInStock: this.filterForm.controls['isInStock'].value
    };
  }

  filterFormId = 'invrow-filter-form';
  filterForm!: FormGroup;
  filterFormNav!: FlatDesignNoTableNavigatableForm;

  get isEditModeOff() {
    return this.kbS.currentKeyboardMode !== KeyboardModes.EDIT;
  }

  public KeySetting: Constants.KeySettingsDct = InvRowNavKeySettings;
  override readonly commands: FooterCommandInfo[] = GetFooterCommandListFromKeySettings(this.KeySetting);

  get IsTableActive(): boolean {
    return this.kbS.IsCurrentNavigatable(this.dbDataTable);
  }

  isPageReady: boolean = false;

  constructor(
    @Optional() dialogService: NbDialogService,
    fS: FooterService,
    private dataSourceBuilder: NbTreeGridDataSourceBuilder<TreeGridNode<InvCtrlAbsent>>,
    private cdref: ChangeDetectorRef,
    kbS: KeyboardNavigationService,
    private bbxToastrService: BbxToastrService,
    private simpleToastrService: NbToastrService,
    sidebarService: BbxSidebarService,
    private sidebarFormService: SideBarFormService,
    private inventoryService: InventoryService,
    private inventoryCtrlItemService: InventoryCtrlItemService,
    private stockService: StockService,
    cs: CommonService,
    sts: StatusService,
    private utS: UtilityService,
  ) {
    super(dialogService, kbS, fS, sidebarService, cs, sts);

    this.searchInputId = 'active-prod-search';
    this.dbDataTableId = 'invrow-table';
    this.dbDataTableEditId = 'invrow-cell-edit-input';

    this.kbS.ResetToRoot();

    this.Setup();

    this.isLoading = false;
  }

  ToInt(p: any): number {
    return parseInt(p + '');
  }

  InitFormDefaultValues(): void { }

  private Setup(): void {
    this.dbData = [];

    this.dbDataDataSrc = this.dataSourceBuilder.create(this.dbData);

    this.dbDataTableForm = new FormGroup({});

    this.filterForm = new FormGroup({
      invCtrlPeriod: new FormControl(undefined, [Validators.required]),
      isInStock: new FormControl(false, []),
      searchString: new FormControl(undefined, [])
    });

    this.InitFormDefaultValues();

    this.filterFormNav = new FlatDesignNoTableNavigatableForm(
      this.filterForm,
      this.kbS,
      this.cdref, [], this.filterFormId,
      AttachDirection.DOWN,
      this.colDefs,
      this.sidebarService,
      this.fS,
      this.dbDataTable,
      this
    );

    this.dbDataTable = new FlatDesignNoFormNavigatableTable(
      this.dbDataTableForm,
      'InvCtrlAbsent',
      this.dataSourceBuilder,
      this.kbS,
      this.fS,
      this.cdref,
      this.dbData,
      this.dbDataTableId,
      AttachDirection.DOWN,
      'sideBarForm',
      AttachDirection.UP,
      this.sidebarService,
      this.sidebarFormService,
      this,
      () => {
        return {} as InvCtrlAbsent;
      }
    );
    this.dbDataTable.PushFooterCommandList();
    this.dbDataTable.NewPageSelected.subscribe({
      next: async () => {
        await this.Refresh(this.getInputParams);
      },
    });

    this.filterFormNav!.OuterJump = true;
    this.dbDataTable!.OuterJump = true;
  }

  public async RefreshAndJumpToTable(): Promise<void> {
    await this.Refresh(this.getInputParams, true);
  }

  JumpToFirstCellAndNav(): void {
    console.log("[JumpToFirstCellAndNav]");
    this.kbS.setEditMode(KeyboardModes.NAVIGATION);
    this.kbS.SetCurrentNavigatable(this.dbDataTable);
    this.kbS.SelectElementByCoordinate(0, 0);
    this.kbS.setEditMode(KeyboardModes.NAVIGATION);
    setTimeout(() => {
      this.kbS.MoveDown();
    }, 300);
  }

  private async refreshComboboxData(setIsLoad = false): Promise<void> {
    await lastValueFrom(this.inventoryService.GetAll({ PageSize: 10000 }))
      .then(data => {
        console.log("[refreshComboboxData]: ", data);
        this.invCtrlPeriods =
          data?.data?.filter(x => !x.closed).map(x => {
            let res =
              x.warehouse + ' ' +
              HelperFunctions.GetOnlyDateFromUtcDateString(x.dateFrom) + ' ' +
              HelperFunctions.GetOnlyDateFromUtcDateString(x.dateTo);
            this.invCtrlPeriodValues[res] = x;
            return res;
          }) ?? [];
        this.invCtrlPeriodComboData$.next(this.invCtrlPeriods);
        if (this.invCtrlPeriods.length > 0) {
          this.filterForm.controls['invCtrlPeriod'].setValue(this.invCtrlPeriods[0]);
        }
      })
      .catch(err => {
        this.cs.HandleError(err);
      })
      .finally(() => {})
  }

  private GetInvCtrlAbsentFromResponse(x: InvCtrlAbsent): InvCtrlAbsent {
    let res = x;

    x.latestIn = x.latestIn ?? "";
    x.LatestOut = x.LatestOut ?? ""

    return res;
  }

  override async Refresh(params?: GetAllInvCtrlAbsentParamsModel, jumpToFirstTableCell: boolean = false): Promise<void> {
    this.sts.pushProcessStatus(Constants.LoadDataStatuses[Constants.LoadDataPhases.LOADING]);

    console.log('Refreshing: ', params); // TODO: only for debug

    await this.refreshComboboxData();
    await lastValueFrom(this.stockService.GetAllAbsent(params ?? this.getInputParams))
      .then(d => {
        if (d.succeeded && !!d.data) {
          console.log('GetProducts response: ', d); // TODO: only for debug
          if (!!d) {
            const tempData = d.data.map((x) => {
              return { data: this.GetInvCtrlAbsentFromResponse(x), uid: this.nextUid() };
            });
            this.dbData = tempData;
            this.dbDataDataSrc.setData(this.dbData);
            this.dbDataTable.SetPaginatorData(d);
          }
          this.RefreshTable(undefined, this.isPageReady);
          if (!!d.data && d.data.length > 0) {
            this.JumpToFirstCellAndNav();
          }
        } else {
          this.bbxToastrService.show(
            d.errors!.join('\n'),
            Constants.TITLE_ERROR,
            Constants.TOASTR_ERROR
          );
        }
      })
      .catch(err => {
        this.cs.HandleError(err);
      })
      .finally(() => {
        if (!this.isPageReady) {
          this.isPageReady = true;
        }
      })

    this.sts.pushProcessStatus(Constants.BlankProcessStatus);
  }

  async ngOnInit(): Promise<void> {
    this.fS.pushCommands(this.commands);
    await this.Refresh();
  }
  ngAfterViewInit(): void {
    console.log("[ngAfterViewInit]");

    this.kbS.setEditMode(KeyboardModes.NAVIGATION);

    this.filterFormNav.GenerateAndSetNavMatrices(true, true, NavMatrixOrientation.ONLY_HORIZONTAL);
    this.AddSearchButtonToFormMatrix();
    console.log(this.filterFormNav.Matrix);

    this.dbDataTable.GenerateAndSetNavMatrices(true, undefined, false);
    this.dbDataTable.DisableFooter = true;

    setTimeout(() => {
      this.kbS.SetCurrentNavigatable(this.filterFormNav);
      this.kbS.SelectFirstTile();
      this.kbS.setEditMode(KeyboardModes.EDIT);
    }, 200);
  }
  ngOnDestroy(): void {
    console.log('Detach');
    this.kbS.Detach();
  }

  private AddSearchButtonToFormMatrix(): void {
    this.filterFormNav.Matrix[this.filterFormNav.Matrix.length - 1].push(this.SearchButtonId);
  }

  MoveToSaveButtons(event: any): void {
    if (this.isEditModeOff) {
      this.filterFormNav!.HandleFormEnter(event, true, true, true);
    } else {
      event.preventDefault();
      event.stopImmediatePropagation();
      event.stopPropagation();
      this.kbS.MoveRight();
      this.kbS.setEditMode(KeyboardModes.NAVIGATION);
    }
  }

  IsNumber(val: string): boolean {
    let val2 = val.replace(' ', '');
    return !isNaN(parseFloat(val2));
  }

  ChooseDataForTableRow(rowIndex: number): void { }

  ChooseDataForForm(): void { }

  RefreshData(): void { }
  TableRowDataChanged(changedData?: any, index?: number, col?: string): void { }
  RecalcNetAndVat(): void { }

  HandleFunctionKey(event: Event | KeyBindings): void {
    const val = event instanceof Event ? (event as KeyboardEvent).code : event;
    console.log(`[HandleFunctionKey]: ${val}`);
    switch (val) {
      // PRINT
      case this.KeySetting[Actions.Print].KeyCode:
        this.Print();
        break;
    }
  }

  Print(): void {
    if (this.SelectedInvCtrlPeriod?.id !== undefined) {
      const id = this.SelectedInvCtrlPeriod.id;
      const title = this.SelectedInvCtrlPeriodComboValue;

      this.kbS.setEditMode(KeyboardModes.NAVIGATION);

      const dialogRef = this.dialogService.open(OneTextInputDialogComponent, {
        context: {
          title: 'Leltári időszak Nyomtatása',
          inputLabel: 'Példányszám',
          defaultValue: 1
        }
      });
      dialogRef.onClose.subscribe({
        next: async res => {
          if (res.answer && HelperFunctions.ToInt(res.value) > 0) {
            this.isLoading = true;

            let commandEndedSubscription = this.utS.CommandEnded.subscribe({
              next: cmdEnded => {
                console.log(`CommandEnded received: ${cmdEnded?.ResultCmdType}`);

                if (cmdEnded?.ResultCmdType === Constants.CommandType.PRINT_REPORT) {
                  this.simpleToastrService.show(
                    `Az leltári időszak nyomtatása véget ért.`,
                    Constants.TITLE_INFO,
                    Constants.TOASTR_SUCCESS_5_SEC
                  );
                  this.isLoading = false;
                  commandEndedSubscription.unsubscribe();
                } else {
                  this.isLoading = false;
                }
              },
              error: cmdEnded => {
                console.log(`CommandEnded error received: ${cmdEnded?.CmdType}`);
                
                this.isLoading = false;
                commandEndedSubscription.unsubscribe();
                this.bbxToastrService.show(
                  `Az leltári időszak nyomtatása közben hiba történt.`,
                  Constants.TITLE_ERROR,
                  Constants.TOASTR_ERROR
                );
              }
            });
            await this.printReport(id, res.value, title!);
          } else {
            this.simpleToastrService.show(
              `Az leltári időszak nyomtatása nem történt meg.`,
              Constants.TITLE_INFO,
              Constants.TOASTR_SUCCESS_5_SEC
            );
            this.isLoading = false;
          }
        }
      });
    }
  }

  async printReport(id: any, copies: number, title: string): Promise<void> {
    this.sts.pushProcessStatus(Constants.PrintReportStatuses[Constants.PrintReportProcessPhases.PROC_CMD]);
    await this.utS.execute(
      Constants.CommandType.PRINT_GENERIC, Constants.FileExtensions.PDF,
      {
        "section": "Leltári időszak",
        "fileType": "pdf",
        "report_params": {},
        "copies": copies,
        "data_operation": Constants.DataOperation.PRINT_BLOB
      } as Constants.Dct,
      this.inventoryCtrlItemService.GetAbsentReport({
        "report_params": {
          "invCtrlPeriodID": id, "invPeriodTitle": title, "isInStock": this.getInputParams.IsInStock
        }
      })
    );
  }

  @HostListener('window:keydown', ['$event']) onFunctionKeyDown(event: KeyboardEvent) {
    if (event.shiftKey && event.key == 'Enter') {
      this.kbS.BalanceCheckboxAfterShiftEnter((event.target as any).id);
      this.filterFormNav?.HandleFormShiftEnter(event)
    }
    else if ((event.shiftKey && event.key == 'Tab') || event.key == 'Tab') {
      event.preventDefault();
      event.stopImmediatePropagation();
      event.stopPropagation();
      return;
    }
    switch (event.key) {
      case this.KeySetting[Actions.CSV].KeyCode:
      case this.KeySetting[Actions.Email].KeyCode:
      case this.KeySetting[Actions.Details].KeyCode:
      case this.KeySetting[Actions.Create].KeyCode:
      case this.KeySetting[Actions.Edit].KeyCode:
      case this.KeySetting[Actions.Reset].KeyCode:
      case this.KeySetting[Actions.Save].KeyCode:
      case this.KeySetting[Actions.Delete].KeyCode:
      case this.KeySetting[Actions.Delete].AlternativeKeyCode:
      case this.KeySetting[Actions.Print].KeyCode:
      case this.KeySetting[Actions.ToggleForm].KeyCode:
        event.preventDefault();
        event.stopImmediatePropagation();
        event.stopPropagation();
        this.HandleFunctionKey(event);
        break;
    }
  }
}