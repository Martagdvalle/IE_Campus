import { Injectable } from '@angular/core';
import { Observable, Subject } from 'rxjs';

import { Http, RequestOptions, Response } from '@angular/http';
import { HttpClient, HttpErrorResponse, HttpHeaders, HttpParams } from '@angular/common/http';
import { URLSearchParams } from '@angular/http';
import { isUndefined } from 'util';
import { forEach } from '@angular/router/src/utils/collection';


@Injectable()
export class SearchService {
  query: string;
  results: string;
  showSearchResults = false;
  headers = new HttpHeaders({ 'Authorization': 'NtaAUFoJaFbtcj5tuJWlOq3TjSUwRdPc' });

  constructor(private http: HttpClient) {
  }

  private static get_link(display: string, link: string) {
    return '<a href="' + link + '">' + display + '</a>';
  }

  search(query: string) {

    // this.heroes$ = this.searchTerms
    //   .debounceTime(300)        // wait for 300ms pause in events
    //   .distinctUntilChanged()   // ignore if next search term is same as previous
    //   .switchMap(term => Observable.create(term.toLowerCase());

    this.query = query.toLowerCase();

    this.searchBuilding();
    this.searchCourse();
    // this.searchFood();


    // unstable
    // if (this.query.length >= 5) {
    //   this.searchRoom();
    // }
  }

  private searchCourse() {
    if (this.query.length !== 6) {
      return;
    }
    this.http.get('https://cors-anywhere.herokuapp.com/' // use proxy to bypass CORS
      + `https://timetable.iit.artsci.utoronto.ca/api/20179/courses?org=&code=${this.query}`
      + '&section=&studyyear=&daytime=&weekday=&prof=&breadth=&online=&waitlist=&available=&title=')
      .subscribe(
        data => {
          if (this.query.startsWith('csc')) {
            let link;
            link = `https://markus.teach.cs.toronto.edu/${this.query}-2018-09/en/assignments`;
            this.results = SearchService.get_link('Markus', link);
          }
          const fall = data[Object.keys(data)[0]];
          if (isUndefined(fall)) {
            return;
          }
          const meetings = fall.meetings;
          const meeting = meetings[Object.keys(meetings)[0]];
          const instructor = meeting.instructors[Object.keys(meeting.instructors)[0]];
          // let location = meeting.schedule[Object.keys(meeting.schedule)[0]].assignedRoom1;
          // if (location == null) {
          //   location = meeting.schedule[Object.keys(meeting.schedule)[0]].assignedRoom2;
          // }
          this.results = this.results + '<h1>' + fall.courseTitle + '</h1>' + fall.courseDescription
            + '<br/>Instructor : ' + instructor.firstName + ' ' + instructor.lastName
            // + '<br/>Location : ' + location
            + '<br/>Waitlist : ' + meeting.actualWaitlist + '/' + meeting.actualEnrolment;


        },
        (err: HttpErrorResponse) => {
          this.results = '';
          if (err.error instanceof Error) {
            // A client-side or network error occurred. Handle it accordingly.
            console.log('An error occurred:', err.error.message);
          } else {
            // The backend returned an unsuccessful response code.
            // The response body may contain clues as to what went wrong,
            console.log(`Backend returned code ${err.status}, body was: ${err.error}`);
          }
        });
  }

  private searchBuilding() {
    if (this.query.length !== 2) {
      return;
    }
    this.http.get('https://cors-anywhere.herokuapp.com/'
      + 'https://cobalt.qas.im/api/1.0/buildings/search',
      {
        headers: this.headers,
        params: new HttpParams().set('q', this.query + ' ') // minimum query length is 3
      }
    )
      .subscribe(
        data => {
          const building = data[0];
          const link = 'https://www.google.com/maps/place/' + encodeURIComponent(building.name);
          this.results = SearchService.get_link(building.name, link);
          this.http.get('https://cors-anywhere.herokuapp.com/'
            + `http://uoftstudyspot.com/api/optimize?code=${this.query}`).subscribe(
              rooms => {
                let empty_rooms = '';

                for (const key in Object.keys(rooms)) {
                  empty_rooms += '</br> Room ' + rooms[key]['id'];
                }
                if (empty_rooms !== '') {
                  empty_rooms = '<h2>Free rooms</h2>' + empty_rooms;
                }

                this.results += empty_rooms;
              }
            );
        },
        (err: HttpErrorResponse) => {
          if (err.error instanceof Error) {
            // A client-side or network error occurred. Handle it accordingly.
            console.log('An error occurred:', err.error.message);
          } else {
            // The backend returned an unsuccessful response code.
            // The response body may contain clues as to what went wrong,
            console.log(`Backend returned code ${err.status}, body was: ${err.error}`);
          }
        });
  }


  private searchRoom() {
    // const match = this.query.match(/[a-z]+|\d+/ig);
    // const link = `http://www.osm.utoronto.ca/class_spec/f?p=210:1:::::P1_BLDG,P1_ROOM:${match[0].toUpperCase()},${match[1]}`;
    const link = `http://www.osm.utoronto.ca/i/Photos/Website/RoomPlansPDF/${this.query}.pdf`;
    this.http.get('https://cors-anywhere.herokuapp.com/' // use proxy to bypass CORS
      + link,
      { headers: this.headers })
      .subscribe(
        data => {
          this.results = SearchService.get_link('Room Info', link);
        },
        (err: HttpErrorResponse) => {
          if (err.error instanceof Error) {
            // A client-side or network error occurred. Handle it accordingly.
            console.log('An error occurred:', err.error.message);
          } else {
            // The backend returned an unsuccessful response code.
            // The response body may contain clues as to what went wrong,
            console.log(`Backend returned code ${err.status}, body was: ${err.error}`);
          }
        });
  }

  /*
  A function that searches for food places using the colbat.qas
  api and a specified food given by 'query'.
  When the function recieves the data it will call the call back function
  with the data.
  */
  public searchFood() {
    if (this.query.length < 5) {
      return;
    }
    const link = 'https://cobalt.qas.im/api/1.0/food/search';
    this.http.get('https://cors-anywhere.herokuapp.com/' + link,
      {
        headers: this.headers,
        params: new HttpParams().set('q', this.query)
      }
    ).subscribe(
      data => {
        //reset the results
        this.results = '';

        //Check if there is any data
        //Right now using the .length property
        //causes an error so this "work around" is used
        if (data[0] !== undefined) {
          this.results += '<h1> Places with: ' + this.query + ' </h1>';
        }
        for (let i in data) {
          let food_location = data[i];
          let google_maps_link = 'https://www.google.ca/maps/place/' + food_location['address'];
          this.results += '<a href=\'' + google_maps_link + '\'>'
            + food_location['name'] + '</a>' + '<br/>';
        }
      },
      (err: HttpErrorResponse) => {
        if (err.error instanceof Error) {
          console.log('An error occurred: ', err.error.message);
        } else {
          console.log(`Backend returned code ${err.status}, body was : ${err.error}`);
        }
      }
    );
  }
}
