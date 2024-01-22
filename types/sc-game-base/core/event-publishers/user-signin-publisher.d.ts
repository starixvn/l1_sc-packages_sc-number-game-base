export default class UserSignInPublisher {
    publishUnauthorizedMessage(socketClient: any): void;
    publishNotPermittedToPlayMessage(socketClient: any, gameId: any): void;
}
