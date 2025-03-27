export interface DataStore {
    Players: number[],
    Tables: number[]
}

export class Table {
    id: number;
    players: number[] = [];         // sorted by position
    sb: number;
    bb: number;
    owner: number;                          // playerId
    ante = 0;
    numHands = 0;

    constructor(id: number, sb: number, bb: number, owner: number, ante?: number) {
        this.id = id;
        this.sb = sb;
        this.bb = bb;
        this.owner = owner;
        if (typeof ante !== "undefined") this.ante = ante;
    }
}

export class Player {
    id: number;
    username: string = 'anonymous';
    hands: Hand[] = [];
    vpips: boolean[] = [];
    isPlaying: boolean = false;
    stack: number = 0;
    buyin: number = 0;

    constructor(id: number, username?: string) {
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

type Hand = [Card, Card];

export class Card {
    rank: string;
    suit: string;

    constructor(rank: string, suit: string) {
        this.rank = rank;
        this.suit = suit;
    }
}
