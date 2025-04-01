export interface DataStore {
    Players: number[],
    Tables: number[]
}

export class Table {
    id: number;
    players: number[] = [];                 // sorted by position
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
    username: string;
    hands: Hand[] = [];
    vpips: boolean[] = [];
    isPlaying: boolean = false;
    stack: number = 0;
    buyin: number = 0;

    constructor(id: number, username: string) {
        this.id = id;
        this.username = username;
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
    // card1 > card2
    card1: Card;
    card2: Card;

    constructor(card1: Card, card2: Card) {
        if (card1.isLargerThan(card2)) {
            this.card1 = card1;
            this.card2 = card2;
        } else {
            this.card1 = card2;
            this.card2 = card1;
        }
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

    // to combination_id
    cid() {
        const card1_id = 4 * this.card1.rankVal() + this.card1.suitVal();
        const card2_id = 4 * this.card2.rankVal() + this.card2.suitVal();
        return 52 * card1_id + card2_id;
    }

    // from combination_id
    static fromCid(cid: number) {
        const card1_id = cid / 52;
        const card1_rank = card1_id / 4;
        const card1_suit = card1_id % 4;

        const card2_id = cid / 52;
        const card2_rank = card2_id / 4;
        const card2_suit = card2_id % 4;

        return new Hand(
            new Card(Card.ranks[card1_rank], Card.suits[card1_suit]),
            new Card(Card.ranks[card2_rank], Card.suits[card2_suit])
        );
    }
}

export class Card {
    rank: string;
    suit: string;

    static ranks = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];
    static suits = ['d', 'c', 'h', 's'];

    constructor(rank: string, suit: string) {
        this.rank = rank;
        this.suit = suit;
    }

    rankVal() {
        return Card.ranks.indexOf(this.rank);
    }

    suitVal() {
        return Card.suits.indexOf(this.suit);
    }

    isLargerThan(other: Card) {
        if (this.rankVal() > other.rankVal()) return true;
        if (this.rankVal() < other.rankVal()) return false;
        if (this.suitVal() > other.suitVal()) return true;
        return false;
    }
}
