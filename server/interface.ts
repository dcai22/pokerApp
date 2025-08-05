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

    getVpip(): number {
        const len = this.vpips.length;
        if (len === 0) return 0;
        const count = this.vpips.filter(vpip => vpip).length;
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

    isNull(): boolean {
        return this.card1 === null || this.card2 === null;
    }

    isSuited(): boolean {
        if (this.isNull()) {
            return false;
        }
        const card1 = this.card1 as Card;
        const card2 = this.card2 as Card;
        return card1.suit === card2.suit;
    }

    isPaired(): boolean {
        if (this.isNull()) {
            return false;
        }
        const card1 = this.card1 as Card;
        const card2 = this.card2 as Card;
        return card1.rank === card2.rank;
    }

    isConnected(): boolean {
        if (this.isNull()) {
            return false;
        }
        const card1 = this.card1 as Card;
        const card2 = this.card2 as Card;
        return (card1.rank === 'A' && card2.rank === '2') ||
               (card1.rank === '2' && card2.rank === 'A') ||
               (Math.abs(card1.rankVal() - card2.rankVal()) === 1);
    }

    isSuitedConnector(): boolean {
        return this.isSuited() && this.isConnected();
    }

    displayName(): string {
        if (this.isNull()) return "unknown";
        const card1 = this.card1 as Card;
        const card2 = this.card2 as Card;
        return `${card1.rank}${card1.suit}${card2.rank}${card2.suit}`;
    }

    // to combination_id
    cid(): number {
        if (this.isNull()) {
            return -1;
        }
        const card1 = this.card1 as Card;
        const card2 = this.card2 as Card;
        const card1Id: number = 4 * card1.rankVal() + card1.suitVal();
        const card2Id: number = 4 * card2.rankVal() + card2.suitVal();
        return 52 * card1Id + card2Id;
    }

    // from combination_id
    static fromCid(cid: number): Hand {
        if (cid < 0) return new Hand(null, null);

        const card1Id: number = Math.floor(cid / 52);
        const card1Rank: number = Math.floor(card1Id / 4);
        const card1Suit: number = card1Id % 4;

        const card2Id: number = cid % 52;
        const card2Rank: number = Math.floor(card2Id / 4);
        const card2Suit: number = card2Id % 4;

        return new Hand(
            new Card(Card.ranks[card1Rank], Card.suits[card1Suit]),
            new Card(Card.ranks[card2Rank], Card.suits[card2Suit])
        );
    }
}

export class Card {
    rank: string;
    suit: string;

    static ranks: string[] = ['2', '3', '4', '5', '6', '7', '8', '9', 'T', 'J', 'Q', 'K', 'A'];
    static suits: string[] = ['d', 'c', 'h', 's'];

    constructor(rank: string, suit: string) {
        this.rank = rank;
        this.suit = suit;
    }

    rankVal(): number {
        return Card.ranks.indexOf(this.rank);
    }

    suitVal(): number {
        return Card.suits.indexOf(this.suit);
    }

    isLargerThan(other: Card): boolean {
        if (this.rankVal() > other.rankVal()) return true;
        if (this.rankVal() < other.rankVal()) return false;
        if (this.suitVal() > other.suitVal()) return true;
        return false;
    }

    static expandSuit(suitChar: string): string {
        switch (suitChar) {
            case "c":
                return "Clubs";
            case "d":
                return "Diamonds";
            case "h":
                return "Hearts";
            case "s":
                return "Spades";
            default:
                throw new Error(`Invalid suit ${suitChar}`);
        }
    }

    static prettySuit(suitChar: string): string {
        switch (suitChar) {
            case "c":
                return "♣";
            case "d":
                return "♦";
            case "h":
                return "♥";
            case "s":
                return "♠";
            default:
                throw new Error(`Invalid suit ${suitChar}`);
        }
    }

    static prettyPrint(card: Card): string {
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
    name: string;
    buyin: number;
    isActive: boolean;
    wantEndGame: boolean;
}

export interface LocalBuyinData {
    name: string;
    time: string;
    amount: number;
}

export interface LocalHandData {
    handNum: number;
    cid: number;
    vpip: boolean;
}

export interface HandData {
    name: string;
    handNum: number;
    cid: number;
    vpip: boolean;
}
