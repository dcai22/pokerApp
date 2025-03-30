import type { ObjectId } from "mongodb";

export interface DataStore {
    Players: number[],
    Tables: number[]
}

export class Table {
    id: ObjectId;
    players: ObjectId[] = [];         // sorted by position
    sb: number;
    bb: number;
    owner: number;                          // playerId
    ante = 0;
    numHands = 0;

    constructor(id: ObjectId, sb: number, bb: number, owner: number, ante?: number) {
        this.id = id;
        this.sb = sb;
        this.bb = bb;
        this.owner = owner;
        if (typeof ante !== "undefined") this.ante = ante;
    }
}

export class Player {
    id: ObjectId;
    username: string = 'anonymous';
    hands: Hand[] = [];
    vpips: boolean[] = [];
    isPlaying: boolean = false;
    stack: number = 0;
    buyin: number = 0;

    constructor(id: ObjectId, username?: string) {
        this.id = id;
        if (typeof username !== "undefined") this.username = username;
    }

    getVpip() {
        let len = this.vpips.length;
        if (!len) return 0;

        let count = 0;
        for (let i = 0; i < len; i++) {
            if (this.vpips[i]) count++;
        }
        return count / len;
    }
}

export class Hand {
    card1: Card;
    card2: Card;

    constructor(card1: Card, card2: Card) {
        this.card1 = card1;
        this.card2 = card2;
    }

    isSuited() {
        return this.card1.suit === this.card2.suit;
    }

    isPaired() {
        return this.card1.rank === this.card2.rank;
    }

    isConnected() {
        return (this.card1.rank === 'A' && this.card2.rank === '2') ||
               (this.card1.rank === '2' && this.card2.rank === 'A') ||
               (Math.abs(this.card1.rankVal() - this.card2.rankVal()) === 1);
    }

    isSuitedConnector() {
        return this.isSuited() && this.isConnected();
    }
}

export class Card {
    rank: string;
    suit: string;

    constructor(rank: string, suit: string) {
        this.rank = rank;
        this.suit = suit;
    }

    rankVal() {
        const ranks = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];
        return ranks.indexOf(this.rank);
    }
}
