import { stub } from "jest-auto-stub";
import { Core } from "sc-game-base";
import { ProcessBetQueue } from "../../../src/crons";
import GameDefinition from "../../../src/game-definition";
import GameData from "../../../src/game-data";
import GameManagementApiClientFactory from "sc-game-base/src/core/game-management-api";

jest.mock("sc-common", () => ({
    helpers: { noticeHelper: { placeBetNextRound: "placeBetNextRound" } },
}));
describe("ProcessBetQueue tests", () => {
    beforeAll(() => {
        const mockDate = new Date(123456);
        jest.spyOn(global, "Date").mockImplementation(() => mockDate);
    });
    const definition = stub<GameDefinition>();
    const gameData = stub<GameData>();
    const placeBetPublisher = stub<Core.BaseEventPublishers.PlaceBetPublisher>();
    const placeBet = jest.fn();
    const gameManagementApiClientFactory = stub<GameManagementApiClientFactory>();
    let consumer: ProcessBetQueue;
    beforeEach(() => {
        consumer = new ProcessBetQueue({
            definition,
            gameData,
            placeBetPublisher,
            placeBet,
            logService: null as any,
            betsRepository: {} as any,
            betLogsRepository: {} as any,
            gameManagementApiClientFactory,
            baseMetrics: null as any,
        });
    });
    describe("formatApiBetInfo", () => {
        it("should return expected bet info", () => {
            // arrange
            consumer.definition.id = 1001;
            const payload = {
                amount: 10,
                drawId: 10,
                freeBet: false,
                mode: "1",
            };
            const expected = {
                amount: payload.amount,
                gameId: 1001,
                gameRoundId: payload.drawId,
                freeBet: payload.freeBet,
                clientSentTime: new Date(),
                metadata: {
                    mode: payload.mode,
                },
            };

            // act
            const actual = consumer.formatApiBetInfo(payload as any);

            // assert
            expect(actual).toEqual(expected);
        });
    });

    describe("composeValidationCriteria", () => {
        beforeEach(() => {
            (consumer.gameData as GameData).drawId = 8;
            (consumer.definition as GameDefinition).numberOfTurnsPerRound = 4;
            const durations = {
                wholeRound: 132,
                placingBets: 25,
                lockingBet: 3,
                showingResult: 5,
                wholeTurn: 33,
            };
            consumer.definition.durations = durations;
        });
        describe("when invalid", () => {
            it("should return expected when invalid drawId", async () => {
                // arrange
                const payload: any = { freeBet: false, drawId: 7 };
                consumer.gameData.remainingTime = 20;
                const expected = [
                    { failure: true, notice: { errorCode: "placeBetNextRound" } },
                    { failure: true, notice: { errorCode: "placeBetNextRound" } },
                ];

                // act
                const actual = await consumer.composeValidationCriteria({}, payload);

                // assert
                expect(actual).toEqual(expected);
            });

            it("should return expected when remaining time < lock time", async () => {
                // arrange
                const payload: any = { freeBet: false, drawId: 8 };
                consumer.gameData.remainingTime = 2;
                const expected = [
                    { failure: false, notice: { errorCode: "placeBetNextRound" } },
                    { failure: true, notice: { errorCode: "placeBetNextRound" } },
                ];

                // act
                const actual = await consumer.composeValidationCriteria({}, payload);

                // assert
                expect(actual).toEqual(expected);
            });

            it("should return expected when remaining time > place bet", async () => {
                // arrange
                const payload: any = { freeBet: false, drawId: 8 };
                consumer.gameData.remainingTime = 27;
                const expected = [
                    { failure: false, notice: { errorCode: "placeBetNextRound" } },
                    { failure: true, notice: { errorCode: "placeBetNextRound" } },
                ];

                // act
                const actual = await consumer.composeValidationCriteria({}, payload);

                // assert
                expect(actual).toEqual(expected);
            });
        });

        it("should return expected when valid bet", async () => {
            // arrange
            const payload: any = { freeBet: false, drawId: 8 };
            consumer.gameData.remainingTime = 20;
            const expected = [
                { failure: false, notice: { errorCode: "placeBetNextRound" } },
                { failure: false, notice: { errorCode: "placeBetNextRound" } },
            ];

            // act
            const actual = await consumer.composeValidationCriteria({}, payload);

            // assert
            expect(actual).toEqual(expected);
        });
    });

    describe("insertBetLog", () => {
        it("should insert correctly bet logs", async () => {
            // arrange
            const player = {
                UID: 1,
                profile: { name: "player" },
                session: { siteId: 123, currencyName: "UUS", operatorId: "OW", playerId: 1 },
            };
            const rate = 1;
            const drawId = 1;
            const bet = { betChoices: { choice1: 10, choice2: 20 }, freeBet: false };
            consumer.betLogsRepository = { create: jest.fn() };
            consumer.gameData.roundId = 1;
            const betTmp = {
                uid: player.UID,
                name: player.profile.name,
                time: new Date(),
                freeBet: bet.freeBet,
                roundId: 1,
                drawId,
                siteId: player.session.siteId,
                currency: player.session.currencyName,
                rate,
                operatorId: player.session.operatorId,
                playerId: player.session.playerId,
            };
            const betLog1 = { ...betTmp, choice: "choice1", amount: 10 };
            const betLog2 = { ...betTmp, choice: "choice2", amount: 20 };

            // act
            await consumer.insertBetLog(player, drawId, bet as any, rate);

            // assert
            expect(consumer.betLogsRepository.create).toHaveBeenCalledTimes(2);
            expect(consumer.betLogsRepository.create).toHaveBeenCalledWith(betLog1);
            expect(consumer.betLogsRepository.create).toHaveBeenCalledWith(betLog2);
        });
    });

    describe("upsertBet", () => {
        it("should update bet correctly", async () => {
            // arrange
            const player = {
                UID: 1,
                profile: { name: "player" },
                session: { siteId: 123, currencyName: "UUS", operatorId: "OW", playerId: 1 },
            };
            const rate = 1;
            const drawId = 1;
            const bet = { betChoices: { choice1: 10, choice2: 20 }, freeBet: false, amount: 30 };
            consumer.betsRepository = { updateOne: jest.fn() };
            consumer.gameData.roundId = 1;
            const odds = { choice1: 2, choice2: 10 };
            (consumer.gameData as GameData).odds = odds;
            const existingBetFilter = { uid: player.UID, roundId: 1, drawId, freeBet: bet.freeBet };
            const existingBetIncrement = {
                choice1: 10,
                choice2: 20,
                totalAmount: bet.amount,
            };
            const newBet: any = {
                uid: player.UID,
                name: player.profile.name,
                time: new Date(),
                odds: odds,
                freeBet: bet.freeBet,
                drawId,
                roundId: 1,
                siteId: player.session.siteId,
                currency: player.session.currencyName,
                rate,
                operatorId: player.session.operatorId,
                playerId: player.session.playerId,
            };

            // act
            await consumer.upsertBet(player, drawId, bet as any, rate);

            // assert
            expect(consumer.betsRepository.updateOne).toHaveBeenCalledWith(
                existingBetFilter,
                { $inc: existingBetIncrement, $setOnInsert: newBet },
                { upsert: true, setDefaultsOnInsert: true }
            );
        });
    });

    describe("adjustTotalBets", () => {
        it("should adjust correctly total bet in gameData", () => {
            // arrange
            consumer.gameData.totalBets = { choice2: 30, choice3: 10 };
            const bet = { betChoices: { choice1: 10, choice2: 20 } };

            // act
            consumer.adjustTotalBets({}, bet as any, 10);

            // assert
            expect(gameData.totalBets).toEqual({ choice1: 100, choice2: 230, choice3: 10 });
        });
    });

    describe("adjustOwnBets", () => {
        const playerName = "player";

        it("should adjust correctly ownBets in gameData when ownBets existed", () => {
            // arrange
            consumer.gameData.ingame = { [playerName]: { ownBets: { choice1: 10 } } };
            const payload = { betChoices: { choice1: 10, choice2: 50 } };

            // act
            consumer.adjustOwnBets(playerName, payload as any);

            // assert
            expect(gameData.ingame[playerName].ownBets).toEqual({ choice1: 20, choice2: 50 });
        });

        it("should create ownBets in gameData when ownBets of player not exist", () => {
            // arrange
            consumer.gameData.ingame = { [playerName]: {} };
            const payload = { betChoices: { choice1: 10, choice2: 20 } };

            // act
            consumer.adjustOwnBets(playerName, payload as any);

            // assert
            expect(gameData.ingame[playerName].ownBets).toEqual({ choice1: 10, choice2: 20 });
        });
    });

    describe("generatePlacingBetResult", () => {
        const player = { UID: 1, profile: { name: "player" } };
        const balance = { red: 2000 };
        const betChoices = { choice1: 10, choice2: 20 };
        const bet = { betChoices, amount: 30, freeBet: false };
        const rate = 1;
        beforeEach(() => {
            consumer.gameData.ingame = { [player.profile.name]: { ownBets: betChoices } };
        });

        it("should return expected", () => {
            // arrange
            (consumer.gameData as GameData).players = {};
            (consumer.gameData as GameData).chips = {};
            const expected = {
                ownBets: betChoices,
                endBet: 30,
                freeBet: false,
                user: { ...balance },
                ownChip: { betChoices, amount: 30 },
            };

            // act
            const actual = consumer.generatePlacingBetResult(player, balance, bet as any, rate);

            // assert
            expect(actual).toEqual(expected);
        });
    });

    describe("updateGameDataChips", () => {
        it("should update game data chips correctly when chips existed", () => {
            // arrange
            const rate = 1;
            (consumer.gameData as GameData).chips = { [rate]: { choice1: { 10: 1 }, choice2: { 1: 5 } } };
            const bet = { betChoices: { choice1: 10, choice2: 1 } };

            // act
            consumer.updateGameDataChips(bet as any, rate);

            // assert
            expect(gameData.chips[rate]).toEqual({ choice1: { 10: 2 }, choice2: { 1: 6 } });
        });

        it("should create game data chips when chips not exist", () => {
            // arrange
            const rate = 1;
            (consumer.gameData as GameData).chips = {};
            const bet = { betChoices: { choice1: 10, choice2: 1 } };

            // act
            consumer.updateGameDataChips(bet as any, rate);

            // assert
            expect(gameData.chips[rate]).toEqual({ choice1: { 10: 1 }, choice2: { 1: 1 } });
        });
    });

    describe("decreaseBetTracks", () => {
        it("should decrease bet tracks correctly", () => {
            // arrange
            const playerName = "player";
            consumer.gameData.ingame = { [playerName]: { betTracks: { choice1: 10, choice2: 20, choice3: 50 } } };
            const bet = { betChoices: { choice1: 10, choice2: 10 } };

            // act
            consumer.decreaseBetTracks(playerName, bet as any);

            // assert
            expect(gameData.ingame[playerName].betTracks).toEqual({ choice1: 0, choice2: 10, choice3: 50 });
        });
    });
});
