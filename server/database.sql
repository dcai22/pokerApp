CREATE DATABASE poker_app;

CREATE TABLE test(
    id SERIAL PRIMARY KEY,
    num_yes INT,
    num_no INT
);

CREATE TABLE Players (
    id SERIAL PRIMARY KEY,
    username VARCHAR(255) DEFAULT 'anonymous',
    stack DECIMAL(10, 2) DEFAULT 0,
    buyin DECIMAL(10, 2) DEFAULT 0,
    is_playing BOOLEAN DEFAULT FALSE
);

CREATE TABLE Tables (
    id SERIAL PRIMARY KEY,
    sb DECIMAL(10, 2),
    bb DECIMAL(10, 2),
    ante DECIMAL(10, 2) DEFAULT 0,
    num_hands INT DEFAULT 0,
    owner INT,
    FOREIGN KEY (owner) REFERENCES Players(id)
);

CREATE TABLE Table_Players (
    table_id INT,
    player_id INT,
    PRIMARY KEY (table_id, player_id),
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
