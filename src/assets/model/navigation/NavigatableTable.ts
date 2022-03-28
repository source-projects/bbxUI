import { ChangeDetectorRef } from "@angular/core";
import { FormGroup, FormControl } from "@angular/forms";
import { NbTreeGridDataSource, NbTreeGridDataSourceBuilder } from "@nebular/theme";
import { FooterService } from "src/app/services/footer.service";
import { PreferredSelectionMethod, KeyboardNavigationService, KeyboardModes } from "src/app/services/keyboard-navigation.service";
import { environment } from "src/environments/environment";
import { FooterCommandInfo } from "../FooterCommandInfo";
import { IEditable } from "../IEditable";
import { ModelFieldDescriptor } from "../ModelFieldDescriptor";
import { TreeGridNode } from "../TreeGridNode";
import { INavigatable, AttachDirection, TileCssClass } from "./Navigatable";


export class NavigatableTable<T extends IEditable> implements INavigatable {
    Matrix: string[][] = [[]];

    LastX?: number | undefined;
    LastY?: number | undefined;

    HasSubMapping: boolean = false;
    SubMapping?: { [id: string]: INavigatable; } = undefined;

    IsDialog: boolean = false;

    InnerJumpOnEnter: boolean = true;
    OuterJump: boolean = false;

    LeftNeighbour?: INavigatable;
    RightNeighbour?: INavigatable;
    DownNeighbour?: INavigatable;
    UpNeighbour?: INavigatable;

    TileSelectionMethod: PreferredSelectionMethod = PreferredSelectionMethod.focus;

    IsSubMapping: boolean = false;

    inlineForm: FormGroup;
    kbS: KeyboardNavigationService;
    cdref: ChangeDetectorRef;

    _data: any[];

    attachDirection: AttachDirection;

    tableId: string;

    data: TreeGridNode<T>[];
    dataSource: NbTreeGridDataSource<TreeGridNode<T>>;

    isUnfinishedRowDeletable: boolean = false;

    editedRow?: TreeGridNode<T>;
    editedProperty?: string;
    editedRowPos?: number;

    tableNavMap: string[][] = [];

    allColumns: string[];
    colDefs: ModelFieldDescriptor[];
    colsToIgnore: string[];

    productCreatorRow: TreeGridNode<T>;

    getBlankInstance: () => T;
    get GenerateCreatorRow(): TreeGridNode<T> {
        return {
            data: this.getBlankInstance()
        };
    }

    readonly commandsOnTable: FooterCommandInfo[] = [];
    readonly commandsOnTableEditMode: FooterCommandInfo[] = [];

    constructor(
        f: FormGroup,
        private dataSourceBuilder: NbTreeGridDataSourceBuilder<TreeGridNode<T>>,
        private kbs: KeyboardNavigationService,
        private fS: FooterService,
        cdr: ChangeDetectorRef,
        data: any[],
        tableId: string,
        attachDirection: AttachDirection = AttachDirection.DOWN,
        getBlankInstance: () => T
    ) {
        this.inlineForm = f;
        this.kbS = kbs;
        this.cdref = cdr;
        this._data = data;
        this.attachDirection = attachDirection;
        this.tableId = tableId;

        this.data = [];
        this.dataSource = this.dataSourceBuilder.create(this.data);
        this.allColumns = [];
        this.colDefs = [];
        this.colsToIgnore = [];
        this.inlineForm = new FormGroup({});

        this.getBlankInstance = getBlankInstance;
        this.productCreatorRow = this.GenerateCreatorRow;
    }

    public ClearNeighbours(): void {
        this.LeftNeighbour = undefined;
        this.RightNeighbour = undefined;
        this.DownNeighbour = undefined;
        this.UpNeighbour = undefined;
    }

    Attach(): void { }
    Detach(): void { }

    Setup(productsData: TreeGridNode<T>[], productsDataSource: NbTreeGridDataSource<TreeGridNode<T>>,
        allColumns: string[], colDefs: ModelFieldDescriptor[], cdref: ChangeDetectorRef, colsToIgnore: string[] = [], editedRow?: TreeGridNode<T>
    ): void {
        // Set
        this.data = productsData;
        this.dataSource = productsDataSource;
        this.allColumns = allColumns;
        this.colDefs = colDefs;
        this.colsToIgnore = colsToIgnore;
        this.editedRow = editedRow;
        this.cdref = cdref;

        // Init
        this.inlineForm = new FormGroup({});

        this.productCreatorRow = this.GenerateCreatorRow;
        this.data.push(this.productCreatorRow);

        this.dataSource.setData(this.data);

        this.ResetEdit();
    }

    PushFooterCommandList(): void {
        if (this.kbS.isEditModeActivated) {
            this.fS.pushCommands(this.commandsOnTableEditMode);
        } else {
            this.fS.pushCommands(this.commandsOnTable);
        }
    }

    fillCurrentlyEditedRow(newRowData: TreeGridNode<T>): void {
        if (!!newRowData && !!this.editedRow) {
            this.editedRow.data = newRowData.data;
        }
    }

    ResetEdit(): void {
        this.inlineForm = new FormGroup({});
        this.editedProperty = undefined;
        this.editedRow = undefined;
        this.editedRowPos = undefined;
    }

    Edit(row: TreeGridNode<T>, rowPos: number, col: string) {
        this.inlineForm = new FormGroup({
            edited: new FormControl((row.data as any)[col])
        });
        this.editedProperty = col;
        this.editedRow = row;
        this.editedRowPos = rowPos;
    }

    HandleGridEscape(row: TreeGridNode<T>, rowPos: number, col: string, colPos: number): void {
        this.kbS.setEditMode(KeyboardModes.NAVIGATION);
        this.ResetEdit();
        this.cdref!.detectChanges();
        this.kbS.SelectCurrentElement();
        this.PushFooterCommandList();
    }

    private LogMatrixGenerationCycle(cssClass: string, totalTiles: number, node: string, parent: any, grandParent: any): void {
        if (environment.debug) {
            console.log("\n\n+---- MATRIX GEN ----+");
            console.log(`Time: ${Date.now().toLocaleString()}`);

            console.log(`Current node: ${node}`);
            console.log(`Parent: ${parent}`);
            console.log(`Grandparent: ${grandParent}`);

            console.log(`CSS Class: ${cssClass}`);

            console.log(`Total tiles: ${totalTiles}`);

            console.log("+------------------+\n\n");
        }
    }

    GenerateAndSetNavMatrices(attach: boolean): void {
        // Get tiles
        const tiles = $('.' + TileCssClass, '#' + this.tableId);

        if (environment.debug) {
            console.log('[GenerateAndSetNavMatrices]', this.tableId, tiles, '.' + TileCssClass, '#' + this.tableId);
        }

        let currentParent!: HTMLElement;

        // Prepare matrix
        this.Matrix = [[]];
        let currentMatrixIndex = 0;

        // Getting tiles, rows for navigation matrix
        for (let i = 0; i < tiles.length; i++) {
            const next = tiles[i];

            this.LogMatrixGenerationCycle(
                TileCssClass, tiles.length, next.nodeName, next?.parentElement?.nodeName, next?.parentElement?.parentElement?.nodeName
            );

            // Usually all table cells are in a tr (parentElement here)
            if (!!next?.parentElement) {
                const pE = next?.parentElement;
                if (pE !== currentParent) {
                    // currentParent was already initailized,
                    // so this parent name change must mean the tile is in another row
                    if (!!currentParent) {
                        this.Matrix.push([]);
                        ++currentMatrixIndex;
                    }
                    currentParent = next.parentElement;
                }
            }

            next.id = TileCssClass + this.tableId + '-' + Math.floor(Date.now() * Math.random());
            this.Matrix[currentMatrixIndex].push(next.id);
        }

        if (environment.debug) {
            console.log('[GenerateAndSetNavMatrices]', this.Matrix);
        }

        if (attach) {
            this.kbS.Attach(this, this.attachDirection);
        }
    }

    HandleGridMovement(event: KeyboardEvent, row: TreeGridNode<T>, rowPos: number, col: string, colPos: number, upward: boolean): void {
        // Új sorokat generáló sort nem dobhatjuk el.
        if (rowPos !== this.data.length - 1) {
            // Csak befejezetlen sort dobhatunk el, amikor nincs szerkesztésmód.
            let _data = row.data;
            if (!!_data && _data.IsUnfinished() && !this.kbS.isEditModeActivated) {
                switch (event.key) {
                    case "ArrowUp":
                        if (!this.isUnfinishedRowDeletable) {
                            return;
                        }
                        this.isUnfinishedRowDeletable = false;

                        this.data.splice(rowPos, 1);
                        this.dataSource.setData(this.data);

                        // Ha felfelé navigálunk, akkor egyet kell lefelé navigálnunk, hogy korrigáljuk a mozgást.
                        this.kbS.MoveDown();
                        this.GenerateAndSetNavMatrices(false);
                        break;
                    case "ArrowDown":
                        if (!this.isUnfinishedRowDeletable) {
                            return;
                        }
                        this.isUnfinishedRowDeletable = false;

                        this.data.splice(rowPos, 1);
                        this.dataSource.setData(this.data);

                        // Ha lefelé navigálunk, akkor egyet kell felfelé navigálnunk, hogy korrigáljuk a mozgást.
                        this.kbS.MoveUp();
                        this.GenerateAndSetNavMatrices(false);
                        break;
                }
            }
        }
    }

    HandleGridEnter(row: TreeGridNode<T>, rowPos: number, col: string, colPos: number, inputId: string): void {
        //debugger;

        // Switch between nav and edit mode
        let wasEditActivatedPreviously = this.kbS.isEditModeActivated;
        this.kbS.toggleEdit();

        // Already in Edit mode
        if (!!this.editedRow) {

            // Creator row edited
            if (rowPos === this.data.length - 1 && col === this.colDefs[0].colKey) {
                this.productCreatorRow = this.GenerateCreatorRow;
                this.data.push(this.productCreatorRow);

                this.dataSource.setData(this.data);

                this.GenerateAndSetNavMatrices(false);

                this.isUnfinishedRowDeletable = true;
            }

            // this.kbS.toggleEdit();
            this.ResetEdit();
            this.cdref!.detectChanges();

            let newX = this.MoveNextInTable();
            if (wasEditActivatedPreviously) {
                if (newX < colPos) {
                    this.isUnfinishedRowDeletable = false;
                }
                let nextRowPost = newX < colPos ? rowPos + 1 : rowPos;
                let nextRow = newX < colPos ? this.data[nextRowPost] : row;
                this.HandleGridEnter(nextRow, nextRowPost, this.colDefs[newX].objectKey, newX, inputId);
            }
        } else {
            // Entering edit mode
            this.Edit(row, rowPos, col);
            this.cdref!.detectChanges();
            this.kbS.SelectElement(inputId);
            const _input = document.getElementById(inputId) as HTMLInputElement;
            if (!!_input && _input.type === "text") {
                window.setTimeout(function () {
                    const txtVal = ((row.data as any)[col] as string);
                    console.log(txtVal);
                    if (!!txtVal) {
                        _input.setSelectionRange(txtVal.length, txtVal.length);
                    } else {
                        _input.setSelectionRange(0, 0);
                    }
                }, 0);
            }
        }

        this.PushFooterCommandList();

        console.log((this.data[rowPos].data as any)[col]);
    }

    HandleGridDelete(event: Event, row: TreeGridNode<T>, rowPos: number, col: string): void {
        if (rowPos !== this.data.length - 1 && !this.kbS.isEditModeActivated) {
            this.data.splice(rowPos, 1);
            this.dataSource.setData(this.data);

            if (rowPos !== 0) {
                this.kbS.MoveUp();
            }
            this.GenerateAndSetNavMatrices(false);
        }

        console.log((this.data[rowPos].data as any)[col]);
    }

    isEditingCell(rowIndex: number, col: string): boolean {
        return this.kbS.isEditModeActivated && !!this.editedRow && this.editedRowPos == rowIndex && this.editedProperty == col;
    }

    ClearEdit(): void {
        this.editedRow = undefined;
        this.editedProperty = undefined;
        this.kbS.setEditMode(KeyboardModes.NAVIGATION);
    }

    MoveNextInTable(): number {
        let moveRes = this.kbS.MoveRight(true, false, false);
        if (!moveRes.moved) {
            moveRes = this.kbS.MoveDown(true, false, false);
            this.kbS.p.x = 0;
            this.kbS.SelectCurrentElement();
            return this.kbS.p.x;
        }
        return this.kbS.p.x;
    }
}