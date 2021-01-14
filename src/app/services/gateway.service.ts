import { Injectable, Inject } from '@angular/core';
import { Http, Headers, Jsonp, } from '@angular/http';
import { HttpClient, } from '@angular/common/http';

// RxJS & operator
import { Observable, } from 'rxjs';
import { map, tap, filter, scan, last, timeout, timeoutWith, catchError } from 'rxjs/operators';

// socket.io for client
import * as io from 'socket.io-client';
import { EventService } from './event.service';

// SSL : https://opentutorials.org/course/228/4894
@Injectable()
export class GatewayService {

  private _server_ip: string = "";
  get serverIP(): string { return this._server_ip; }
  set serverIP(ip: string) {
    if (this._server_ip.substring(0, this._server_ip.indexOf('/') + 1) != "http://") {
      this._server_ip = "http://" + this._server_ip;
    }
    this._server_ip = ip;
  }

  // Header
  private _standard_header: Headers;  // standard header
  private _headers: Headers;          // now header
  public get headers() { return this._headers; }
  public set headers(header: Headers) { this._headers = header; }
  public revertHeaders() {
    this._headers = Object.assign(this._standard_header);
  }

  // timeout
  private _timeout: number = 4000;
  public get timeout() { return this._timeout; }
  public set timeout(timeout: number) { this._timeout = timeout; }

  constructor(@Inject(Http) private http: Http, @Inject(HttpClient) private httpClient: HttpClient, private jsonp: Jsonp, private event: EventService) {

    this._standard_header = new Headers();
    this._standard_header.append('content-type', 'application/json;charset=UTF-8');
    this._standard_header.append('Access-Control-Allow-Credentials', 'true');
    this.revertHeaders();

  }

  // Get
  get(url: string): Observable<Response | any> {
    return this.http.get(this._server_ip + url, { headers: this._headers }).pipe(timeout(this.timeout));
  }

  async getAwait(url: string): Promise<any> {
    // let _await_header: Headers = new Headers();
    // _await_header.append('Content-Type', 'application/json');
    // const res = await this.http.get(url, { headers: _await_header }).toPromise();
    const res = await this.http.get(url).toPromise();
    return res.json();
  }

  // Put
  put(url: string, body: any, importHeader?: boolean): Observable<Response | any> {
    if (importHeader != undefined && importHeader) {
      return this.http.put(this._server_ip + url, body, { headers: this._headers }).pipe(timeout(this.timeout));
    }
    return this.http.put(this._server_ip + url, body).pipe(timeout(this.timeout));
  }

  // Post
  post(url: string, body: any, importHeader?: boolean): Observable<Response | any> {
    if (importHeader != undefined && importHeader) {
      return this.http.post(this._server_ip + url, body, { headers: this._headers, withCredentials: true }).pipe(timeout(this.timeout));
    }
    return this.http.post(this._server_ip + url, body).pipe(timeout(this._timeout));
  }

  // Delete
  delete(url: string, importHeader?: boolean): Observable<Response | any> {
    if (importHeader != undefined && importHeader) {
      return this.http.delete(this._server_ip + url, { headers: this._headers }).pipe(timeout(this.timeout));
    }
    return this.http.delete(this._server_ip + url).pipe(timeout(this.timeout));
  }

  // save storage
  saveLocalstorage(key: string, body: any) {
    localStorage.setItem(key, body);
  }

  // load storage
  callLocalStorage(key: string): string {
    return localStorage.getItem(key);
  }
}





