export default class AdminPublisher extends BaseEventPublisher {
    publishToAdmin(socketClient: any, payload: any): void;
    publishUnauthorizedMessage(socketClient: any): void;
    publishAuthorizedMessage(socketClient: any): void;
}
import BaseEventPublisher from "./base-event-publisher";
