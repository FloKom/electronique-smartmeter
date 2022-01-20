import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import {Subject} from 'rxjs'
import { Measure } from '../models/measure.models'

@Injectable()
export class MeasureService{
    measure:Measure = new Measure("","","","","","");
    measureSubject = new Subject<any>()
    constructor(private httpClient:HttpClient){}

    emitMeasure(){
        this.measureSubject.next(this.measure)
    }
    post(value:String){
      let a = {
        mega:2
      }
      this.httpClient
      .post<any>('http://localhost:3000/api', value )
      .subscribe(
        (reponse) => {
          console.log(reponse);
        },
        (error) => {
          console.log('Erreur ! : ' + error);
        }
      )

    }
    getMeasure(){
        this.httpClient
        .get<Measure>('http://localhost:3000/api')
        .subscribe(
          (response) => {
            this.measure = response;
            this.emitMeasure();
          },
          (error) => {
            console.log('Erreur ! : ' + error);
          }
        );
    }
}