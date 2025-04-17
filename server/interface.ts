export interface DataStore {
    Players: number[],
    Tables: number[]
}

export class Table {
    id: number;
    name: string;
    players: number[] = [];                 // sorted by position
    sb: number;
    bb: number;
    owner: number;                          // playerId
    ante = 0;
    numHands = 0;

    constructor(id: number, name: string, sb: number, bb: number, owner: number, ante?: number) {
        this.id = id;
        this.name = name;
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
    card1: Card | null;
    card2: Card | null;

    constructor(card1: Card | null, card2: Card | null) {
        if (card1 === null || card2 === null) {
            this.card1 = null;
            this.card2 = null;
        } else if (card1.isLargerThan(card2)) {
            this.card1 = card1;
            this.card2 = card2;
        } else {
            this.card1 = card2;
            this.card2 = card1;
        }
    }

    isNull() {
        return this.card1 === null || this.card2 === null;
    }

    isSuited() {
        if (this.isNull()) {
            return false;
        }
        const card1 = this.card1 as Card;
        const card2 = this.card2 as Card;
        return card1.suit === card2.suit;
    }

    isPaired() {
        if (this.isNull()) {
            return false;
        }
        const card1 = this.card1 as Card;
        const card2 = this.card2 as Card;
        return card1.rank === card2.rank;
    }

    isConnected() {
        if (this.isNull()) {
            return false;
        }
        const card1 = this.card1 as Card;
        const card2 = this.card2 as Card;
        return (card1.rank === 'A' && card2.rank === '2') ||
               (card1.rank === '2' && card2.rank === 'A') ||
               (Math.abs(card1.rankVal() - card2.rankVal()) === 1);
    }

    isSuitedConnector() {
        return this.isSuited() && this.isConnected();
    }

    displayName() {
        if (this.isNull()) return "unknown";
        const card1 = this.card1 as Card;
        const card2 = this.card2 as Card;
        return `${card1.rank}${card1.suit}${card2.rank}${card2.suit}`;
    }

    // to combination_id
    cid() {
        if (this.isNull()) {
            return -1;
        }
        const card1 = this.card1 as Card;
        const card2 = this.card2 as Card;
        const card1_id = 4 * card1.rankVal() + card1.suitVal();
        const card2_id = 4 * card2.rankVal() + card2.suitVal();
        return 52 * card1_id + card2_id;
    }

    // from combination_id
    static fromCid(cid: number) {
        if (cid < 0) return new Hand(null, null);

        const card1_id = Math.floor(cid / 52);
        const card1_rank = Math.floor(card1_id / 4);
        const card1_suit = card1_id % 4;

        const card2_id = cid % 52;
        const card2_rank = Math.floor(card2_id / 4);
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

    static ranks = ['2', '3', '4', '5', '6', '7', '8', '9', 'T', 'J', 'Q', 'K', 'A'];
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

    static expandSuit(suitChar: string) {
        if (suitChar === "c") {
            return "Clubs";
        }
        if (suitChar === "d") {
            return "Diamonds";
        }
        if (suitChar === "h") {
            return "Hearts";
        }
        if (suitChar === "s") {
            return "Spades";
        }
    }

    static prettySuit(suitChar: string) {
        if (suitChar === "c") {
            return "♣";
        }
        if (suitChar === "d") {
            return "♦";
        }
        if (suitChar === "h") {
            return "♥";
        }
        if (suitChar === "s") {
            return "♠";
        }
    }

    static prettyPrint(card: Card) {
        return `${card.rank}${card.suit}`.toUpperCase();
    }
}

export class Buyin {
    playerId: number;
    tableId: number;
    time: string;
    amount: number;

    constructor(playerId: number, tableId: number, time: Date, amount: number) {
        this.playerId = playerId;
        this.tableId = tableId;
        this.time = time.toISOString();
        this.amount = amount;
    }
}

export interface LocalPlayerData {
    name: string,
    buyin: number,
    isActive: boolean,
    wantEndGame: boolean,
}

export interface LocalBuyinData {
    name: string,
    time: string,
    amount: number,
}

export interface LocalHandData {
    handNum: number,
    cid: number,
    vpip: boolean,
}
