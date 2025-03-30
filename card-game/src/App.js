import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import io from 'socket.io-client'; // import socket.io client

const socket = io("http://localhost:5000"); // connect to your backend server

// HomeScreen Component
function HomeScreen() {
  const navigate = useNavigate();
  const [name, setName] = useState("");

  const handleStart = () => {
    if (name.trim() === "") {
      alert("Please enter your name before starting.");
      return;
    }
    navigate("/menu", { state: { playerName: name } });
  };

  return (
    <div style={{ textAlign: "center", marginTop: "50px" }}>
      <h1>Welcome to the Card Game</h1>
      <input
        type="text"
        placeholder="Enter your name"
        value={name}
        onChange={(e) => setName(e.target.value)}
      />
      <br /><br />
      <button onClick={handleStart}>Start</button>
    </div>
  );
}

// Lobby Component
function Lobby() {
  const navigate = useNavigate();
  const location = useLocation();
  const playerName = location.state?.playerName || "Anonymous";
  const [players, setPlayers] = useState([]);
  const [lobbyCode, setLobbyCode] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    // Listen for updated player list from server
    socket.on("lobby_update", (updatedPlayers) => {
      setPlayers(updatedPlayers); // Update the list of players
    });

    // Listen for lobby code from server
    socket.on("lobby_code", (code) => {
      setLobbyCode(code); // Update lobby code
    });

    // Listen for any error message from server
    socket.on("error_message", (message) => {
      setErrorMessage(message); // Display error message
    });

    // Cleanup event listeners when the component unmounts
    return () => {
      socket.off("lobby_update");
      socket.off("lobby_code");
      socket.off("error_message");
    };
  }, []);

  const createLobby = () => {
    socket.emit("create_lobby", playerName); // Send event to create lobby
  };

  const joinLobby = () => {
    if (lobbyCode && playerName) {
      socket.emit("join_lobby", lobbyCode, playerName); // Join a lobby
      navigate(`/host/${lobbyCode}`, { state: { players: [...players, playerName], gameCode: lobbyCode } });
    } else {
      alert("Please enter a valid lobby code.");
    }
  };

  return (
    <div style={{ textAlign: "center", marginTop: "50px" }}>
      <h1>Game Lobby</h1>
      {errorMessage && <p style={{ color: "red" }}>{errorMessage}</p>}
      <button onClick={createLobby}>Create Lobby</button>
      <br />
      <input
        type="text"
        placeholder="Enter Lobby Code"
        value={lobbyCode}
        onChange={(e) => setLobbyCode(e.target.value)} // Allows user to enter a lobby code
      />
      <button onClick={joinLobby}>Join Lobby</button>

      {lobbyCode && <p>Lobby Code: {lobbyCode}</p>}

      <h2>Players in Lobby:</h2>
      <ul>
        {players.map((p, index) => (
          <li key={index}>{p}</li>
        ))}
      </ul>
    </div>
  );
}

// HostGame Component
function HostGame() {
  const location = useLocation();
  const { players, gameCode } = location.state || {};
  if (!players || !gameCode) return <div>No game found.</div>;

  return (
    <div style={{ textAlign: "center", marginTop: "50px" }}>
      <h1>Hosting Game</h1>
      <p>Game Code: <strong>{gameCode}</strong></p>
      <h3>Players in Lobby:</h3>
      <ul>
        {players.map((player, index) => (
          <li key={index}>{player}</li>
        ))}
      </ul>
    </div>
  );
}

// Main App Component
function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<HomeScreen />} />
        <Route path="/menu" element={<Lobby />} />
        <Route path="/host/:gameCode" element={<HostGame />} />
      </Routes>
    </Router>
  );
}

export default App;
