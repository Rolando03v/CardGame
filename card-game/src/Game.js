import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";

// UNO Card Setup (excluding Wild and Wild +4 cards)
const createDeck = () => {
  const colors = ['Red', 'Green', 'Blue', 'Yellow'];
  const values = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', 'Skip', 'Reverse', 'Draw2'];
  let deck = [];

  // Create the deck of UNO cards (no Wild or Wild+4 cards)
  colors.forEach(color => {
    values.forEach(value => {
      // Add two cards per color for each value (except 0, which only appears once per color)
      deck.push({ color, value });
      if (value !== '0') deck.push({ color, value });
    });
  });

  // Shuffle the deck
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }

  return deck;
};

function Game() {
  const navigate = useNavigate();
  const location = useLocation();
  const playerName = location.state?.playerName || "Anonymous";
  const [players, setPlayers] = useState([playerName]);
  const [gameCode, setGameCode] = useState("");
  const [gameStarted, setGameStarted] = useState(false);
  const [deck, setDeck] = useState([]);
  const [playerHands, setPlayerHands] = useState({});
  const [centerCard, setCenterCard] = useState(null);
  const [isHost, setIsHost] = useState(false); // Track if this player is the host
  const [activeGames, setActiveGames] = useState({}); // Stores active games by gameCode
  const [errorMessage, setErrorMessage] = useState("");

  const handleHostGame = () => {
    const gameCode = Math.floor(1000 + Math.random() * 9000);
    setGameCode(gameCode);

    // Host the game and mark as host
    setIsHost(true);

    // Save the game as active
    setActiveGames(prevGames => ({
      ...prevGames,
      [gameCode]: {
        host: playerName,
        players: [playerName],
        gameStarted: false,
      },
    }));
  };

  const handleJoinGame = () => {
    if (gameCode.trim() === "") {
      alert("Please enter a game code.");
      return;
    }

    // Check if the game code exists in the active games
    if (activeGames[gameCode]) {
      const game = activeGames[gameCode];
      if (!game.gameStarted) {
        // Add the player to the game
        setPlayers([...game.players, playerName]);

        // Update the active games list with the new player
        setActiveGames(prevGames => ({
          ...prevGames,
          [gameCode]: {
            ...game,
            players: [...game.players, playerName],
          },
        }));

        // Navigate to the game's lobby
        navigate(`/game/${gameCode}`, { state: { playerName } });
      } else {
        setErrorMessage("This game has already started.");
      }
    } else {
      setErrorMessage("No Lobby with this code exists.");
    }
  };

  const startGame = () => {
    const deck = createDeck();
    setDeck(deck);
    // Deal 10 cards to each player
    let hands = {};
    players.forEach(player => {
      hands[player] = deck.splice(0, 10); // Deal 10 cards
    });
    setPlayerHands(hands);
    // Set the first card face up from the deck
    setCenterCard(deck.pop());
    setDeck(deck); // Update deck with remaining cards
    setGameStarted(true); // Mark the game as started

    // Mark the game as started in the activeGames
    setActiveGames(prevGames => ({
      ...prevGames,
      [gameCode]: {
        ...prevGames[gameCode],
        gameStarted: true,
      },
    }));
  };

  const playCard = (player, cardIndex) => {
    const newHands = { ...playerHands };
    const cardToPlay = newHands[player].splice(cardIndex, 1)[0]; // Remove the card from player's hand
    setPlayerHands(newHands);
    setCenterCard(cardToPlay); // Set the card played to the center
  };

  return (
    <div style={{ textAlign: "center", marginTop: "50px" }}>
      <h1>UNO Game</h1>
      {!gameStarted ? (
        <>
          <h3>Lobby</h3>
          <div>
            <h4>Players in Lobby:</h4>
            {players.map((player, index) => (
              <p key={index}>{player}</p>
            ))}
          </div>
          {!isHost ? (
            <>
              <input
                type="text"
                placeholder="Enter game code"
                value={gameCode}
                onChange={(e) => setGameCode(e.target.value)}
              />
              <button onClick={handleJoinGame}>Join Game</button>
            </>
          ) : (
            <>
              {/* Show the Start Game button only when there's at least one other player */}
              {players.length > 1 ? (
                <button onClick={startGame}>Start Game</button>
              ) : (
                <p>Waiting for another player to join...</p>
              )}
            </>
          )}

          {/* Error message */}
          {errorMessage && <p style={{ color: "red" }}>{errorMessage}</p>}
        </>
      ) : (
        <>
          <h3>Current Card: {centerCard.color} {centerCard.value}</h3>
          <div>
            <h4>Your Cards:</h4>
            {playerHands[playerName]?.map((card, index) => (
              <button key={index} onClick={() => playCard(playerName, index)}>
                {card.color} {card.value}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

export default Game;
