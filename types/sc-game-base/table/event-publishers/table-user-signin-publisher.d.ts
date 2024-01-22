export default class TableUserSignInPublisher extends UserSignInPublisher {
    publishToGameMessage(socketClient: any, toGameName: any): void;
    publishUmNotice(socketClient: any, umMessages: any): void;
}
import UserSignInPublisher from "./../../core/event-publishers/user-signin-publisher";
