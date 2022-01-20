import { Component, OnDestroy, OnInit } from '@angular/core';
import { Subscription, interval } from 'rxjs';
import { Measure } from './models/measure.models';
import { MeasureService } from './services/Measure.service';
@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})

export class AppComponent implements OnInit, OnDestroy {
  
  subscription:Subscription = new Subscription()
  public measure:Measure = new Measure("","","","","","")
  public interval:Subscription = new Subscription()
  toogle:boolean = true
  constructor(private energyService:MeasureService){

  }
  ngOnInit(): void {
    this.subscription = this.energyService.measureSubject.subscribe(
      (measure:any)=>{
        this.measure = measure 
      }
    )
    this.interval = interval(5500).subscribe(
      ()=>{
        this.energyService.getMeasure()
      },
      (err)=>{
        console.log('Error:' + err)
      }
    )

    this.energyService.emitMeasure()

    // setInterval(()=>{
    //   console.log("1")
    //   this.energyService.getMeasure()
    //   console.log(this.measure)
    // }, 1000)
  
  }

  toggleCurrent(){
    if(this.toogle){
      this.energyService.post("on")
      this.toogle = !this.toogle
    }
    else{
      this.energyService.post("off")
      this.toogle = !this.toogle
    }
    
  }

  ngOnDestroy(): void {
      this.subscription.unsubscribe()
      this.interval.unsubscribe()
  }
}
