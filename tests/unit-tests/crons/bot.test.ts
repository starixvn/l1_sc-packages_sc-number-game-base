import { stub } from "jest-auto-stub";
import { GameData, GameDefinition } from "../../../src";
import { BaseEventPublisher } from "sc-game-base/src/core/event-publishers";
import { ProvablyFairConsumer } from "../../../src/event-consumers";
import GameManagementApiClientFactory from "sc-game-base/src/core/game-management-api";
import { Bot } from "../../../src/crons";
import { TableGameBot } from "sc-game-base/src/table/crons";
import { helpers } from "sc-common";

describe("Bot tests", () => {
    // arrange
    const definition = stub<GameDefinition>();
    const gameData = stub<GameData>();
    const publisher = stub<BaseEventPublisher>();
    const gameManagementApiClientFactory = stub<GameManagementApiClientFactory>();
    const provablyFairConsumer = stub<ProvablyFairConsumer>();
    const durations = {
        wholeRound: 142,
        placingBets: 25,
        lockingBet: 3,
        showingResult: 5,
        wholeTurn: 35,
        startingRound: 2,
    };
    const numberOfTurnsPerRound = 4;
    let bot: Bot;
    beforeEach(() => {
        bot = new Bot(definition, gameData, publisher, gameManagementApiClientFactory, {} as any, provablyFairConsumer);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe("run", () => {
        it("should run correctly when during bet time", async () => {
            // arrange
            bot.gameData.gameConfigs = { botenabled: true } as any;
            bot.isDuringBetTime = jest.fn().mockReturnValue(true);
            bot.shouldAddBot = jest.fn().mockReturnValue(false);
            bot.shouldRemoveBot = jest.fn().mockReturnValue(false);
            const botsToBet = [{ id: "1", name: "bot" }];
            bot.getBotsToBet = jest.fn().mockReturnValue(botsToBet);
            bot.placeBets = jest.fn();

            // act
            await bot.run();

            // assert
            expect(bot.placeBets).toHaveBeenCalledWith(botsToBet);
        });
    });

    describe("isDuringBetTime", () => {
        beforeAll(() => {
            bot.definition.durations = { lockingBet: 3, wholeTurn: 35 } as any;
            bot.definition.numberOfTurnsPerRound = 4;
        });
        const testCasesLockBet = [1, 2, 3, 36, 37, 38, 71, 72, 73, 106, 107, 108];
        const testCasesPlaceBet = [4, 5, 24, 25, 39, 40, 59, 60, 74, 75, 94, 95, 109, 110, 129, 130];
        it.each(testCasesPlaceBet)("should return true when time > locking bet", (remainingTime) => {
            // arrange
            bot.gameData.remainingTime = remainingTime;

            // act
            const actual = bot.isDuringBetTime();

            // assert
            expect(actual).toBeTruthy();
        });

        it.each(testCasesLockBet)("should return false when time <= locking bet", (remainingTime) => {
            // arrange
            bot.gameData.remainingTime = remainingTime;

            // act
            const actual = bot.isDuringBetTime();

            // assert
            expect(actual).toBeFalsy();
        });
    });

    describe("updateBalanceAndPublishBetPayload", () => {
        it("should call updatePlayerBetCount", () => {
            // arrange
            bot.updatePlayerBetCount = jest.fn();
            bot.gameData.players = {};

            // act
            bot.updateBalanceAndPublishBetPayload("1", "choice1", 10, 2000);

            // assert
            expect(bot.updatePlayerBetCount).toHaveBeenCalledWith("1", "choice1");
        });

        it("should update players into game data", () => {
            // arrange
            bot.updatePlayerBetCount = jest.fn();
            bot.gameData.players = { bot1: { red: 2010 } };

            // act
            bot.updateBalanceAndPublishBetPayload("bot1", "choice1", 10, 2000);

            // assert
            expect(bot.gameData.players["bot1"]?.red).toBe(2000);
        });
    });

    describe("updatePlayerBetCount", () => {
        beforeAll(() => {
            bot.definition.choices = ["choice1", "choice2", "choice3"];
        });
        it("should update correctly player bet count when not exist player in bet count", () => {
            // arrange
            const choice = "choice1";
            const playerId = "123";
            bot.gameData.playerBetCount = { choice1: ["321"], choice2: ["123"] };

            // act
            bot.updatePlayerBetCount(playerId, choice);

            // assert
            expect(gameData.playerBetCount).toEqual({ choice1: ["321", "123"], choice2: ["123"] });
        });
        it("should update correctly player bet count when exist player in bet count", () => {
            // arrange
            const choice = "choice1";
            const playerId = "123";
            bot.gameData.playerBetCount = { choice1: ["123"], choice2: ["333"] };

            // act
            bot.updatePlayerBetCount(playerId, choice);

            // assert
            expect(gameData.playerBetCount).toEqual({ choice1: ["123"], choice2: ["333"] });
        });
    });

    describe("resetAllBotData", () => {
        it("should run correctly", () => {
            // arrange
            TableGameBot.prototype.resetAllBotData = jest.fn();
            bot.resetAllBets = jest.fn();

            // act
            bot.resetAllBotData();

            // assert
            expect(bot.resetAllBets).toHaveBeenCalled();
        });
    });

    describe("resetAllBets", () => {
        it("should reset all bets", () => {
            // arrange
            bot.betOptions = ["choice1", "choice2", "choice3"];
            bot.allBets = {
                choice1: 10,
                choice2: 20,
                choice3: 50,
            };
            bot.smallTickets = 10;

            // act
            bot.resetAllBets();

            // assert
            expect(bot.allBets).toEqual({ choice1: 0, choice2: 0, choice3: 0 });
            expect(bot.smallTickets).toEqual(0);
        });
    });

    describe("updateBotInRoomData", () => {
        beforeEach(() => {
            TableGameBot.prototype.updateBotInRoomData = jest.fn();
            bot.getMinBet = jest.fn().mockReturnValue(1);
            bot.smallTickets = 0;
        });
        const choice = "choice1";
        const amount = 10;
        const balance = 200;
        it("should call super.updateBotInRoomData", () => {
            // act
            bot.updateBotInRoomData({}, choice, amount, balance);

            // assert
            expect(TableGameBot.prototype.updateBotInRoomData).toHaveBeenCalledWith({}, "choice1", 10, 200);
        });

        it("should increase all bets", () => {
            // arrange
            bot.allBets = { [choice]: 10 };

            // act
            bot.updateBotInRoomData({}, choice, amount, balance);

            // assert
            expect(bot.allBets[choice]).toEqual(20);
        });

        it("should adjust small tickets", () => {
            // arrange
            bot.smallTickets = 0;

            // act
            bot.updateBotInRoomData({}, choice, amount, balance);

            // assert
            expect(bot.smallTickets).toBe(1);
        });
    });

    describe("calculateBet", () => {
        const botInfo = { red: 5000, id: "32" };
        const choice = "choice1";
        const amount = 10;
        beforeEach(() => {
            bot.getBetChoice = jest.fn().mockReturnValue(choice);
            bot.getMaxBet = jest.fn().mockReturnValue(1000);
            bot.getMinBet = jest.fn().mockReturnValue(1);
            bot.convertAmountToChip = jest.fn().mockReturnValue(amount);
            helpers.numberHelper = { getRandomNumberStep5: jest.fn().mockReturnValue(10) } as any;
            bot.gameData.gameConfigs = { bot_maxbet: 2000 } as any;
            bot.gameData.drawId = 44;
            bot.tempBetsRepository = {
                findOne: jest
                    .fn()
                    .mockReturnValue({ lean: jest.fn().mockReturnValue({ exec: jest.fn().mockReturnValue({ drawId: 44 }) }) }),
            };
            bot.getTotalBetAmount = jest.fn().mockReturnValue(100);
        });

        it("should query bet by drawId", async () => {
            // act
            await bot.calculateBet(botInfo);

            // assert
            expect(bot.tempBetsRepository.findOne).toHaveBeenCalledWith({ uid: "32", drawId: 44 });
        });

        it("should return expected when bot bet valid amount", async () => {
            // arrange
            const expected = { id: botInfo.id, choice, amount, currentBet: { drawId: 44 }, bot: botInfo };

            // act
            const actual = await bot.calculateBet(botInfo);

            // assert
            expect(actual).toEqual(expected);
        });

        it("should return null when bot bet invalid amount", async () => {
            // arrange
            const botInfo2 = { ...botInfo, red: 0 };

            // act
            const actual = await bot.calculateBet(botInfo2);

            // assert
            expect(actual).toBeNull();
        });
    });

    describe("getBetChoice", () => {
        beforeEach(() => {
            bot.chance = {
                pickone: jest.fn(),
            };
            helpers.arrayHelper = { shuffle: jest.fn() };
        });
        describe("when hedgeBetGroup not include choice", () => {
            beforeEach(() => {
                bot.betOptions = ["choice3", "choice4"];
                bot.hedgeBetGroups = [];
                helpers.arrayHelper = { shuffle: jest.fn() };
            });
            describe("when getBetChoicesRatios return any group with underBetRatio = true", () => {
                it("should return one choice in group", () => {
                    // arrange
                    const betChoiceRatios = [{ underBetRatio: true, group: ["choice1", "choice2"] }];
                    bot.getBetChoicesRatios = jest.fn().mockReturnValue(betChoiceRatios);
                    (helpers.arrayHelper.shuffle as jest.Mock).mockReturnValue(betChoiceRatios);
                    (bot.chance.pickone as jest.Mock).mockReturnValueOnce(betChoiceRatios[0].group[0]);

                    // act
                    const actual = bot.getBetChoice({});

                    // assert
                    expect(bot.chance.pickone).toHaveBeenCalledWith(betChoiceRatios[0].group);
                    expect(actual).toBe(betChoiceRatios[0].group[0]);
                });
            });

            describe("when getBetChoicesRatios not return any group with underBetRatio = true", () => {
                it("should return one choice in betOptions", () => {
                    // arrange
                    const betChoiceRatios = [{ underBetRatio: false, group: ["choice1", "choice2"] }];
                    bot.getBetChoicesRatios = jest.fn().mockReturnValue(betChoiceRatios);
                    (helpers.arrayHelper.shuffle as jest.Mock).mockReturnValue([]);
                    (bot.chance.pickone as jest.Mock).mockReturnValueOnce("choice3");

                    // act
                    const actual = bot.getBetChoice({});

                    // assert
                    expect(helpers.arrayHelper.shuffle).toHaveBeenCalledWith([]);
                    expect(bot.chance.pickone).toHaveBeenCalledWith(bot.betOptions);
                    expect(actual).toBe("choice3");
                });
            });
        });

        describe("when hedgeBetGroup include choice", () => {
            it("should return opposite choice if bot has bet opposite choice", () => {
                // arrange
                bot.getBetChoicesRatios = jest.fn().mockReturnValue([]);
                bot.betOptions = ["choice1", "choice2"];
                bot.hedgeBetGroups = [["choice1", "choice2"]];
                (helpers.arrayHelper.shuffle as jest.Mock).mockReturnValue([]);
                (bot.chance.pickone as jest.Mock).mockReturnValueOnce("choice1");
                const botInfo = { choices: ["choice2"] };

                // act
                const actual = bot.getBetChoice(botInfo);

                // assert
                expect(actual).toBe("choice2");
            });
        });
    });

    describe("getBetChoicesRatios", () => {
        it("should return expected bet choices ratios from bot settings", () => {
            // arrange
            bot.getAllBetAmountOnChoices = jest.fn().mockReturnValueOnce(10).mockReturnValueOnce(0).mockReturnValueOnce(10);
            bot.botSettings = { ratio: { mainOpts: 99, rareOpts: 1 }, mainOpts: ["choice1", "choice2"], rareOpts: ["choice3"] };
            const expected = [
                { group: ["choice1", "choice2"], underBetRatio: true },
                { group: ["choice3"], underBetRatio: false },
            ];

            // act
            const actual = bot.getBetChoicesRatios();

            // assert
            expect(actual).toEqual(expected);
        });
    });

    describe("getAllBetAmountOnChoices", () => {
        it("should return total bet amount on choices", () => {
            // arrange
            const choices = ["choice1", "choice2", "choice3"];
            bot.allBets = { choice1: 10, choice2: 5, choice3: 1 };
            const expected = 16;

            // act
            const actual = bot.getAllBetAmountOnChoices(choices);

            // assert
            expect(actual).toBe(expected);
        });
    });

    describe("getMaxBet", () => {
        const choice = "choice1";

        beforeEach(() => {
            bot.gameData.gameConfigs = { choices_maxbet: { [choice]: 1000 }, bot_maxbet: 2000 } as any;
            bot.getMinBet = jest.fn().mockReturnValue(1);
        });
        it("should return max bet when total tickets = 0", () => {
            // arrange
            bot.totalTickets = 0;

            // act
            const actual = bot.getMaxBet({}, choice);

            // assert
            expect(actual).toBe(50);
        });

        it("should return max bet when total tickets != 0", () => {
            // arrange
            bot.totalTickets = 1;
            bot.smallTickets = 1;

            // act
            const actual = bot.getMaxBet({}, choice);

            // assert
            expect(actual).toBe(1000);
        });
    });

    describe("convertAmountToChip", () => {
        it("should return expected when amount is not less than chip list amount", () => {
            // arrange
            const amount = 400_000;

            // act
            const actual = bot.convertAmountToChip(amount);

            // assert
            expect(actual).toBe(200_000);
        });

        it("should return min bet when amount is < chip list amount", () => {
            // arrange
            const amount = 0.5;
            bot.getMinBet = jest.fn().mockReturnValue(1);

            // act
            const actual = bot.convertAmountToChip(amount);

            // assert
            expect(actual).toBe(1);
        });
    });

    describe("insertOrUpdateBet", () => {
        beforeAll(() => {
            const mockDate = new Date(123456);
            jest.spyOn(global, "Date").mockImplementation(() => mockDate);
        });
        it("should create drawId field", async () => {
            // arrange
            const choice = "choice1";
            const botInfo = { id: "bot1", name: "bot", clientSeed: "9999" };
            const currentBet = { choice1: 10 };
            const amount = 10;
            const currentAmount = currentBet[choice];
            const update = { [choice]: amount + currentAmount };
            bot.gameData.drawId = 2;
            bot.gameData.roundId = 1;
            bot.gameData.odds = { player: 2, banker: 2, tie: 30 };
            const create = {
                uid: botInfo.id,
                name: botInfo.name,
                drawId: bot.gameData.drawId,
                roundId: bot.gameData.roundId,
                odds: { player: 2, banker: 2, tie: 30 },
                time: new Date(123456),
                currency: " ",
                operatorId: " ",
                clientSeed: botInfo.clientSeed,
            };
            bot.tempBetsRepository = { updateOne: jest.fn() };

            // act
            await bot.insertOrUpdateBet(botInfo, choice, amount, currentBet);

            // assert
            expect(bot.tempBetsRepository.updateOne).toHaveBeenCalledWith(
                { uid: botInfo.id, drawId: bot.gameData.drawId },
                { $set: update, $setOnInsert: create },
                { upsert: true, setDefaultsOnInsert: true }
            );
        });
    });

    describe("getNumberOfBotsToJoin", () => {
        const testCases = [...Array(10).keys()];
        beforeEach(() => {
            // Arrange
            bot.maxNumberOfBots = 10;
            bot.botsInRoom = { 1: "bot1", 2: "bot2", 3: "bot3", 4: "bot4" };
            bot.getCurrentTimeOfTurn = jest.fn().mockReturnValue(2);
        });

        it.each(testCases)("should return correct", () => {
            // Act
            const actual = bot.getNumberOfBotsToJoin();

            // Assert
            expect(actual).toBeLessThanOrEqual(5);
            expect(actual).toBeGreaterThanOrEqual(1);
        });
    });

    describe("leaveRoom", () => {
        beforeEach(() => {
            // Arrange
            bot.maxNumberOfBots = 10;
            bot.botsInRoom = { 1: "bot1", 2: "bot2", 3: "bot3", 4: "bot4" };
            bot.getCurrentTimeOfTurn = jest.fn().mockReturnValue(2);
        });

        it("should return correct", async () => {
            // Arrange
            const mockFunction = jest.fn();
            bot.getRemovalBotIds = mockFunction;
            bot.removeBots = jest.fn();

            // Act
            await bot.leaveRoom();

            // Assert
            expect(mockFunction.mock.calls[0][0]).toBeGreaterThanOrEqual(1);
        });
    });

    describe("getBotsToBet", () => {
        beforeEach(() => {
            gameData.gameConfigs.bot_maxbet = 5;
            bot.maxNumberOfBots = 10;
            bot.botsInRoom = {
                1: {
                    name: "bot1",
                    totalBet: 15,
                    remainTickets: 1,
                },
                2: {
                    name: "bot2",
                    totalBet: 4,
                    remainTickets: 0,
                },
                3: {
                    name: "bot3",
                    totalBet: 3,
                    remainTickets: 1,
                },
                4: {
                    name: "bot4",
                    totalBet: 4,
                    remainTickets: 1,
                },
            };
            bot.getCurrentTimeOfTurn = jest.fn().mockReturnValue(2);
        });

        it("should return correct", () => {
            // Act
            const actual = bot.getBotsToBet();

            // Assert
            expect(actual.length).toEqual(1);
        });
    });

    describe("getRemovalBotIds", () => {
        const totalRemoval = 1;

        beforeEach(() => {
            bot.botsInRoom = { 1: "bot1", 2: "bot2", 3: "bot3", 4: "bot4" };
            bot.removeBotAtTheTableRoundFrequency = 4;
            bot.removeBotAtTheTable = false;
        });

        describe("When drawId % bot.removeBotAtTheTableRoundFrequency === 0", () => {
            it("should set bot.removeBotAtTheTable = true", () => {
                // Arrange
                gameData.drawId = 8;

                // Act
                bot.getRemovalBotIds(totalRemoval);

                // Assert
                expect(bot.removeBotAtTheTable).toBe(true);
            });
        });

        describe("When drawId % bot.removeBotAtTheTableRoundFrequency !== 0", () => {
            it("should bot.removeBotAtTheTable = false", () => {
                // Arrange
                gameData.drawId = 7;

                // Act
                bot.getRemovalBotIds(totalRemoval);

                // Assert
                expect(bot.removeBotAtTheTable).toBe(false);
            });
        });
    });
});
