import { Injectable } from '@angular/core';
import { Subject } from 'rxjs/Subject';

@Injectable()
export class EventService {

    private hashMap: Map<string, any> = new Map();

    putEvent<T>(key: string) {
        this.hashMap.set(key, new Subject<T>());
    }

    getEvent(key: string) {
        return this.hashMap.get(key).asObservable();
    }

    emitEvent<T>(key: string, E?: T) {
        let emit$: Subject<T> = this.hashMap.get(key);
        if(emit$ === undefined || emit$ === null) return;
        emit$.next(E);
    }
}