import { Subject } from 'rxjs';

export class EventService<T> {
    protected eventSubject = new Subject();
    public events = this.eventSubject.asObservable();

    dispatchEvent(event: any) {
        console.log('EventService: Dispatching event:', event);
        this.eventSubject.next(event);
    }
}