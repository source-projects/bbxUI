import { AfterContentInit, AfterViewChecked, ChangeDetectorRef, Component, Input, OnDestroy, OnInit } from '@angular/core';
import { NbDialogRef, NbTreeGridDataSourceBuilder } from '@nebular/theme';
import { BbxToastrService } from 'src/app/services/bbx-toastr-service.service';
import { CommonService } from 'src/app/services/common.service';
import { KeyboardModes, KeyboardNavigationService } from 'src/app/services/keyboard-navigation.service';
import { AttachDirection } from 'src/assets/model/navigation/Navigatable';
import { SelectedCell } from 'src/assets/model/navigation/SelectedCell';
import { SimpleNavigatableTable } from 'src/assets/model/navigation/SimpleNavigatableTable';
import { TreeGridNode } from 'src/assets/model/TreeGridNode';
import { Constants } from 'src/assets/util/Constants';
import { IsKeyFunctionKey, KeyBindings } from 'src/assets/util/KeyBindings';
import { GetProductsParamListModel } from '../../product/models/GetProductsParamListModel';
import { Product } from '../../product/models/Product';
import { ProductService } from '../../product/services/product.service';
import { SelectTableDialogComponent } from '../../shared/select-table-dialog/select-table-dialog.component';

const NavMap: string[][] = [
  ['active-prod-search', 'show-all', 'show-less']
];

@Component({
  selector: 'app-product-select-table-dialog',
  templateUrl: './product-select-table-dialog.component.html',
  styleUrls: ['./product-select-table-dialog.component.scss']
})
export class ProductSelectTableDialogComponent extends SelectTableDialogComponent<Product>
  implements AfterContentInit, OnDestroy, OnInit, AfterViewChecked {

  @Input() exchangeRate: number = 1;

  get srcString(): string {
    return (this.searchString ?? '').trim();
  }

  get getInputParams(): GetProductsParamListModel {
    return { SearchString: this.srcString, PageSize: '10', PageNumber: '1', OrderBy: 'ProductCode' };
  }

  get getInputParamsForAll(): GetProductsParamListModel {
    return { SearchString: this.srcString, PageSize: '999999', OrderBy: 'ProductCode' };
  }

  isLoaded: boolean = false;
  override isLoading: boolean = false;

  constructor(
    private simpleToastrService: BbxToastrService,
    private bbxToastrService: BbxToastrService,
    private cdref: ChangeDetectorRef,
    private cs: CommonService,
    dialogRef: NbDialogRef<SelectTableDialogComponent<Product>>,
    kbS: KeyboardNavigationService,
    dataSourceBuilder: NbTreeGridDataSourceBuilder<TreeGridNode<Product>>,
    private productService: ProductService
  ) {
    super(dialogRef, kbS, dataSourceBuilder);

    this.Matrix = NavMap;

    this.dbDataTable = new SimpleNavigatableTable<Product>(
      this.dataSourceBuilder, this.kbS, this.cdref, this.dbData, '', AttachDirection.DOWN, this
    );
    this.dbDataTable.InnerJumpOnEnter = true;
    this.dbDataTable.OuterJump = true;
  }

  override ngOnInit(): void {
    this.Refresh(this.getInputParams);
  }
  ngAfterContentInit(): void {
    this.kbS.SetWidgetNavigatable(this);
    this.kbS.SelectFirstTile();
  }
  ngAfterViewChecked(): void {
    if (!this.isLoaded) {
      $('#active-prod-search').val(this.searchString);
      this.isLoaded = true;
    }
    this.kbS.SelectCurrentElement();
  }
  ngOnDestroy(): void {
    if (!this.closedManually) {
      this.kbS.RemoveWidgetNavigatable();
    }
  }

  override refreshFilter(event: any): void {
    if ((event.key.length > 1 && event.key.toLowerCase() !== 'backspace') || event.ctrlKey || event.key == KeyBindings.F2 || IsKeyFunctionKey(event.key)) {
      return;
    }

    if (this.searchString.length !== 0 && event.target.value.length === 0) {
      this.searchString = event.target.value;
      this.Refresh(this.getInputParams);
    } else {
      this.searchString = event.target.value;
      this.Search(this.searchString);
    }
  }

  override showAll(): void {
    this.Refresh(this.getInputParamsForAll);
  }

  override showLess(): void {
    this.kbS.SelectFirstTile();
    this.Refresh(this.getInputParams);
  }

  RefreshTable(): void {
    this.dbDataTable.Setup(
      this.dbData,
      this.dbDataSource,
      this.allColumns,
      this.colDefs,
      [],
      'TABLE-CELL'
    );
    setTimeout(() => {
      this.dbDataTable.GenerateAndSetNavMatrices(this.DownNeighbour === undefined, false);
    }, 200);
  }

  override Refresh(params?: GetProductsParamListModel): void {
    if (!!this.Subscription_Search && !this.Subscription_Search.closed) {
      this.Subscription_Search.unsubscribe();
    }

    console.log('Refreshing'); // TODO: only for debug
    this.isLoading = true;

    this.Subscription_Search = this.productService.GetAll(params).subscribe({
      next: (d) => {
        if (d.succeeded && !!d.data) {
          console.log('GetProducts response: ', d); // TODO: only for debug
          if (!!d) {
            const tempData = d.data.map((x) => {
              return { data: x, uid: this.nextUid() };
            });
            tempData.forEach(x => {
              x.data.exhangedUnitPrice1 = x.data.unitPrice1;
              x.data.exhangedUnitPrice2 = x.data.unitPrice2;
              if (x.data.exhangedUnitPrice1) {
                x.data.exhangedUnitPrice1 = x.data.exhangedUnitPrice1 / this.exchangeRate;
              }
              if (x.data.exhangedUnitPrice2) {
                x.data.exhangedUnitPrice2 = x.data.exhangedUnitPrice2 / this.exchangeRate;
              }
            });
            this.dbData = tempData;
            this.dbDataSource.setData(this.dbData);
          }
          this.RefreshTable();
        } else {
          this.bbxToastrService.show(
            d.errors!.join('\n'),
            Constants.TITLE_ERROR,
            Constants.TOASTR_ERROR
          );
        }
        this.isLoading = false;
      },
      error: (err) => {
        { this.cs.HandleError(err); this.isLoading = false; };
        this.isLoading = false;
      },
      complete: () => {
        this.isLoading = false;
      },
    });
  }

  override Search(searchString: string): void {
    this.Refresh(this.getInputParams);
  }

  HandleItemChoice(item: SelectedCell): void {

  }

}
