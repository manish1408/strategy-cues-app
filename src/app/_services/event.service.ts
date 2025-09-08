import { Subject } from 'rxjs';

export class EventService<T> {
    protected eventSubject = new Subject();
    public events = this.eventSubject.asObservable();

    dispatchEvent(event: any) {
        this.eventSubject.next(event);
    }
}