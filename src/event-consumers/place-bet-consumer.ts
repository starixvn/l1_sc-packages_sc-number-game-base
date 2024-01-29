import { helpers } from "sc-common";
import { BaseEventConsumers } from "sc-game-base/src/core";
import notices from "../constants/notices";
import GameDefinition, { Duration } from "../game-definition";
import GameData from "../game-data";

type BetPayload = {
    amount: number;
    betChoices: Record<string, number>;
    freeBet?: boolean;
    drawId: number;
    m?: string;
};

export default class PlaceBetConsumer extends BaseEventConsumers.PlaceBetConsumer {
    composeBettingTimeValidationCriteria(_: number) {
        const configs = this.gameData.gameConfigs;
        const numberOfTurnsPerRound = (this.definition as GameDefinition).numberOfTurnsPerRound;
        const turn = (this.gameData as GameData).drawId % numberOfTurnsPerRound || numberOfTurnsPerRound;
        const { placingBets, showingResult, wholeTurn, lockingBet } = this.definition.durations as Duration;
        const remainingTime = this.gameData.remainingTime - wholeTurn * (numberOfTurnsPerRound - turn);
        const showingResultTime = placingBets + showingResult;

        return [
            {
                failure: !configs.enabled,
                notice: this.getNoticeObj(helpers.noticeHelper.invalidBet),
            },
            {
                failure: remainingTime >= placingBets && remainingTime <= showingResultTime,
                notice: this.getNoticeObj(helpers.noticeHelper.cannotPlaceBet),
            },
            {
                failure: remainingTime < lockingBet || remainingTime > showingResultTime,
                notice: this.getNoticeObj(helpers.noticeHelper.placeBetNextRound),
            },
        ];
    }

    composeBetAmountValidationCriteria(player: any, betChoices: Record<string, number>, totalAmount: number, freeBet: boolean) {
        const settings = this.gameData.currencyGroupGames.find((x) => x.groupId.toString() === player.session.currencyGroupId);
        const configs = this.gameData.gameConfigs;
        const { betTracks }: { betTracks: Record<string, number> } = this.gameData.ingame[player.profile.name] || { betTracks: {} };
        const totalAmountOfExistingBets = Object.values(betTracks).reduce((total, value) => total + value, 0);
        const minBet = Math.max(player.profile.minBet, settings.minBet);
        const maxBet = Math.min(player.profile.maxBet, settings.maxBet);

        return [
            {
                failure: freeBet && !configs.enableFreeBet,
                notice: this.getNoticeObj(helpers.noticeHelper.invalidBet),
            },
            {
                failure: this.anyChoiceExceedItsMaxBet(betChoices, betTracks, settings, player.profile.maxBet),
                notice: this.getNoticeObj(notices.maxBetOfAnyChoiceReached),
            },
            {
                failure: this.anyChoiceBelowMinBet(betChoices, minBet),
                notice: this.getNoticeObj(notices.betAmountOfAnyChoiceIncorrect),
            },
            {
                failure: totalAmountOfExistingBets + totalAmount < minBet,
                notice: this.getNoticeObj(helpers.noticeHelper.minBet, { minBet }),
            },
            {
                failure: totalAmount > maxBet,
                notice: this.getNoticeObj(helpers.noticeHelper.maxBet, { maxBet }),
            },
            {
                failure: totalAmountOfExistingBets + totalAmount > maxBet,
                notice: this.getNoticeObj(helpers.noticeHelper.maxBet, { maxBet }),
            },
        ];
    }

    composeBetChoiceValidationCriteria(betChoices: Record<string, number>) {
        return [
            {
                failure: !Object.keys(betChoices).every((choice) => this.definition.choices.includes(choice)),
                notice: this.getNoticeObj(helpers.noticeHelper.invalidBet),
            },
        ];
    }

    composeHedgeBetValidationCriteria(betChoices: Record<string, number>, player: any) {
        const { betTracks } = this.gameData.ingame[player.profile.name] || { betTracks: {} };

        const betChoiceKeys = [...Object.keys(betChoices), ...Object.keys(betTracks)];

        const criteria = this.definition.hedgeBetGroups.reduce(
            (result, hedgeBetGroup: string[]) => {
                if (result.failure) {
                    return result;
                }
                result.failure = hedgeBetGroup.every((choice) => betChoiceKeys.includes(choice));
                result.hedgeBetGroup = hedgeBetGroup;
                return result;
            },
            { failure: false, hedgeBetGroup: [] }
        );

        if (criteria.failure) {
            return [
                {
                    failure: true,
                    notice: this.getNoticeObj(helpers.noticeHelper.disallowHedgeBet, { hedgeBetGroup: criteria.hedgeBetGroup }),
                },
            ];
        }
        return [];
    }

    consume(player: any, payload: BetPayload): void {
        Object.assign(payload, {
            amount: Object.values(payload.betChoices).reduce((total, value) => total + value, 0) >> 0,
            drawId: payload.drawId ?? (this.gameData as GameData).drawId,
            mode: payload.m ?? this.DisplayMode.Landscape,
            receivedTime: new Date(),
        });

        const { amount, betChoices, freeBet, drawId } = payload;

        if (!this.validateBetRequest(player, betChoices, amount, freeBet, drawId)) {
            return;
        }

        const name = player.profile.name;
        if (!this.gameData.ingame[name]) {
            const newPlayer = {
                name: player.profile.name,
                currency: player.session.currencyName,
                system: player.session.system,
                betTracks: {},
                betQueue: [],
                operatorId: player.session.operatorId,
            };

            this.gameData.ingame[name] = newPlayer;
        }

        this.adjustBetTracks(player.profile.name, payload);
        this.gameData.ingame[name].betQueue.push({ player, payload });
    }

    anyChoiceExceedItsMaxBet(betChoices: Record<string, number>, betTracks: Record<string, number>, configs: any, userMaxBet: number) {
        return Object.keys(betChoices).some((choice) => {
            const maxBetPerChoice = Math.min(userMaxBet, configs.maxBetPerChoices[choice] ?? 0);
            const amount = betChoices[choice];
            const currentBetAmount = betTracks[choice] ?? 0;
            return amount > maxBetPerChoice || currentBetAmount + amount > maxBetPerChoice;
        });
    }

    anyChoiceBelowMinBet(betChoices: Record<string, number>, minBet: number) {
        return Object.keys(betChoices).some((choice) => {
            const amount = betChoices[choice];
            return amount < minBet;
        });
    }
}
