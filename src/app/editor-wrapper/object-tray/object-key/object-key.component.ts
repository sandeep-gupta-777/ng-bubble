import {ChangeDetectorRef, Component, EventEmitter, Input, OnInit, Output} from '@angular/core';
import {UtilityService} from '../../../utility.service';

@Component({
  selector: 'app-object-key',
  templateUrl: './object-key.component.html',
  styleUrls: ['./object-key.component.scss']
})
export class ObjectKeyComponent implements OnInit {

  @Input() obj: object;
  @Input() val: object;
  @Input() key: string;
  @Output() pin$ = new EventEmitter();
  @Input() shouldFoldCode:boolean;
  type;
  keys:string[];
  constructor(private utilityService: UtilityService, private changeDetectorRef:ChangeDetectorRef) {}

  ngOnInit() {
    this.type = typeof this.val;
    if(this.type === 'object'){
      this.keys = Object.keys(this.val);
    }
  }

  shouldFoldCodeHandler(){
    this.shouldFoldCode=!this.shouldFoldCode;
    this.changeDetectorRef.detectChanges();

  }

  test(key:string){
    // console.log(key + this.key);

    // return key + this.key;
    this.pin$.emit(this.key + " " + key);
  }

  trigger(key, $event){
    this.pin$.emit(key);
    // console.log(key);
    $event.stopPropagation();
  }

}