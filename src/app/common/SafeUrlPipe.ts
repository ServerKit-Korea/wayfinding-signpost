import { Pipe } from '@angular/core';
import { DomSanitizer, SafeHtml, SafeStyle, SafeScript, SafeUrl, SafeResourceUrl } from '@angular/platform-browser';
import { Logger } from './common';

@Pipe({
    name: 'safe'
})
export class SafePipe {

    constructor(protected _sanitizer: DomSanitizer) {
    }

    public transform(value: string, type: string): SafeHtml | SafeStyle | SafeScript | SafeUrl | SafeResourceUrl {

        if (value != undefined && value.indexOf("./assets/") != -1) {
            return value;
        }

        switch (type) {
            case 'html':
                Logger(this._sanitizer.bypassSecurityTrustHtml(value));
                return this._sanitizer.bypassSecurityTrustHtml(value);
            case 'style':
                Logger(this._sanitizer.bypassSecurityTrustStyle(value));
                return this._sanitizer.bypassSecurityTrustStyle(value);
            case 'script':
                Logger(this._sanitizer.bypassSecurityTrustScript(value));
                return this._sanitizer.bypassSecurityTrustScript(value);
            case 'url':
                Logger(this._sanitizer.bypassSecurityTrustUrl(value));
                return this._sanitizer.bypassSecurityTrustUrl(value);
            case 'resourceUrl':
                Logger(this._sanitizer.bypassSecurityTrustResourceUrl(value));
                return this._sanitizer.bypassSecurityTrustResourceUrl(value);
            default:
                throw new Error(`Unable to bypass security for invalid type: ${type}`);
        }
    }

}