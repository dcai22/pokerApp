CREATE DATABASE poker_app;

DROP TABLE test;
DROP TABLE Hands;
DROP TABLE Table_Players;
DROP TABLE Tables;
DROP TABLE Players;

CREATE TABLE test(
    id SERIAL PRIMARY KEY,
    num_yes INT,
    num_no INT
);

INSERT INTO test(num_yes, num_no) VALUES(0, 0);

CREATE TABLE Players (
    id SERIAL PRIMARY KEY,
    username VARCHAR(255) UNIQUE,
    password VARCHAR(255)
);

CREATE TABLE Tables (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255),
    sb DECIMAL(10, 2),
    bb DECIMAL(10, 2),
    ante DECIMAL(10, 2) DEFAULT 0,
    num_hands INT DEFAULT 0,
    owner INT,
    has_started BOOLEAN DEFAULT FALSE,
    FOREIGN KEY (owner) REFERENCES Players(id)
);

CREATE TABLE Table_Players (
    table_id INT,
    player_id INT,
    PRIMARY KEY (table_id, player_id),
    stack DECIMAL(10, 2) DEFAULT 0,
    buyin DECIMAL(10, 2) DEFAULT 0,
    is_playing BOOLEAN DEFAULT FALSE,
    position INT,
    FOREIGN KEY (table_id) REFERENCES Tables(id),
    FOREIGN KEY (player_id) REFERENCES Players(id)
);

CREATE TABLE Hands (
    id SERIAL PRIMARY KEY,
    combination_id INT,
    player_id INT,
    table_id INT,
    vpip BOOLEAN,
    FOREIGN KEY (player_id) REFERENCES Players(id),
    FOREIGN KEY (table_id) REFERENCES Tables(id)
);

CREATE TABLE Tokens (
    hash varchar(255) PRIMARY KEY,
    player_id INT,
    FOREIGN KEY (player_id) REFERENCES Players(id)
);

CREATE TABLE Buyins {
    player_id INT,
    table_id INT,
    amount INT,
    time DATETIME,
    FOREIGN KEY (player_id) REFERENCES Players(id),
    FOREIGN KEY (table_id) REFERENCES Tables(id)
}
