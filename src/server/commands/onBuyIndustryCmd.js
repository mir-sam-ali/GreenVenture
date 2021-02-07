const { Command } = require('@colyseus/command');
const { IndustryState } = require("../rooms/schema/gameRoomState");

module.exports.OnBuyIndustryCommand = class OnBuyIndustryCommand extends Command {

    execute({ sessionId, type, name }) {
        const playerIndex = this.state.playerStates.findIndex(player => player.id === sessionId);
        let playerState = this.state.playerStates[playerIndex];

        const industry = this.state.industryDetails.industries.find(industry => {
            console.log(name,industry.name);
            return industry.name == name
        });
        console.log(playerState, industry)
        playerState.currentIncome -= industry.baseCost;

        playerState.industriesOwned.push(new IndustryState(
            type,
            name,
            1,
            industry.baseIncome,
            industry.baseCC,
            playerState.piece.tilePosition,
            industry
        ));

        this.room.broadcast("NewIndustry", {
            index: playerIndex,
            id: playerState.id,
            position: playerState.piece.tilePosition
        });
    }

}