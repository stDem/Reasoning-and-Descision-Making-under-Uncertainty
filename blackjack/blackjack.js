// Include the Deck, Hand, QLearningAgent, and trainAgent classes here
const actions = ["hit", "stay", "double down", "split"];

class Deck {
  constructor() {
    this.cards = [];
    const suits = ["hearts", "diamonds", "clubs", "spades"];
    const values = [
      "2",
      "3",
      "4",
      "5",
      "6",
      "7",
      "8",
      "9",
      "10",
      "J",
      "Q",
      "K",
      "A",
    ];

    for (let suit of suits) {
      for (let value of values) {
        this.cards.push({ suit, value });
      }
    }
    this.shuffle();
  }

  shuffle() {
    for (let i = this.cards.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [this.cards[i], this.cards[j]] = [this.cards[j], this.cards[i]];
    }
  }

  draw() {
    return this.cards.pop();
  }
}

class Hand {
  constructor() {
    this.cards = [];
  }

  addCard(card) {
    this.cards.push(card);
  }

  getPoints() {
    let points = 0;
    let aces = 0;

    for (let card of this.cards) {
      if (["J", "Q", "K"].includes(card.value)) {
        points += 10;
      } else if (card.value === "A") {
        aces += 1;
        points += 11;
      } else {
        points += parseInt(card.value);
      }
    }

    while (points > 21 && aces > 0) {
      points -= 10;
      aces -= 1;
    }

    return points;
  }
}

class QLearningAgent {
  constructor(alpha = 0.1, gamma = 0.9, epsilon = 0.1) {
    this.alpha = alpha;
    this.gamma = gamma;
    this.epsilon = epsilon;
    this.qTable = {};
  }

  getQValue(state, action) {
    return this.qTable[state] && this.qTable[state][action]
      ? this.qTable[state][action]
      : 0;
  }

  setQValue(state, action, value) {
    if (!this.qTable[state]) {
      this.qTable[state] = {};
    }
    this.qTable[state][action] = value;
  }

  chooseAction(state, actions) {
    if (Math.random() < this.epsilon) {
      return actions[Math.floor(Math.random() * actions.length)];
    }

    let maxQ = -Infinity;
    let bestAction = null;
    for (let action of actions) {
      const qValue = this.getQValue(state, action);
      if (qValue > maxQ) {
        maxQ = qValue;
        bestAction = action;
      }
    }

    return bestAction;
  }

  update(state, action, reward, nextState, nextActions) {
    const oldQ = this.getQValue(state, action);
    const nextMaxQ = Math.max(
      ...nextActions.map((a) => this.getQValue(nextState, a))
    );
    const newQ =
      oldQ + this.alpha * (reward + this.gamma * nextMaxQ - oldQ);
    this.setQValue(state, action, newQ);
  }
}

function trainAgent(iterations = 5000) {
  const agent = new QLearningAgent();

  for (let i = 0; i < iterations; i++) {
    const deck = new Deck();
    const playerHand = new Hand();
    const dealerHand = new Hand();

    playerHand.addCard(deck.draw());
    playerHand.addCard(deck.draw());
    dealerHand.addCard(deck.draw());
    dealerHand.addCard(deck.draw());

    let state = `${playerHand.getPoints()}-${dealerHand.cards[0].value}`;
    let done = false;
    let doubleDown = false;

    while (!done) {
      const action = agent.chooseAction(state, actions);
      let reward = 0;

      if (action === "hit") {
        playerHand.addCard(deck.draw());
        if (playerHand.getPoints() > 21) {
          reward = -1;
          done = true;
        }
      } else if (action === "stay") {
        while (dealerHand.getPoints() < 17) {
          dealerHand.addCard(deck.draw());
        }
        if (
          dealerHand.getPoints() > 21 ||
          playerHand.getPoints() > dealerHand.getPoints()
        ) {
          reward = 1;
        } else if (playerHand.getPoints() < dealerHand.getPoints()) {
          reward = -1;
        }
        done = true;
      } else if (action === "double down") {
        playerHand.addCard(deck.draw());
        doubleDown = true;
        if (playerHand.getPoints() > 21) {
          reward = -2;
          done = true;
        }
      } else if (
        action === "split" &&
        playerHand.cards[0].value === playerHand.cards[1].value
      ) {
        // Handle splitting logic, for simplicity, we won't implement full split mechanics
        reward = 0;
      }
      if (doubleDown) {
          reward *= 2;
        }
      const nextState = `${playerHand.getPoints()}-${
        dealerHand.cards[0].value
      }`;
      agent.update(state, action, reward, nextState, actions);
      state = nextState;
    }

    
  }

  return agent;
}

const trainedAgent = trainAgent();

function simulateGames(agent, numGames = 1000) {
  let totalWins = 0;
  let totalProfit = 0;

  for (let i = 0; i < numGames; i++) {
    const deck = new Deck();
    const playerHand = new Hand();
    const dealerHand = new Hand();

    playerHand.addCard(deck.draw());
    playerHand.addCard(deck.draw());
    dealerHand.addCard(deck.draw());
    dealerHand.addCard(deck.draw());

    let state = `${playerHand.getPoints()}-${dealerHand.cards[0].value}`;
    let done = false;
    let doubleDown = false;

    while (!done) {
      const action = agent.chooseAction(state, actions);
      let reward = 0;

      if (action === "hit") {
        playerHand.addCard(deck.draw());
        if (playerHand.getPoints() > 21) {
          reward = -1;
          done = true;
        }
      } else if (action === "stay") {
        while (dealerHand.getPoints() < 17) {
          dealerHand.addCard(deck.draw());
        }
        if (
          dealerHand.getPoints() > 21 ||
          playerHand.getPoints() > dealerHand.getPoints()
        ) {
          reward = 1;
        } else if (playerHand.getPoints() < dealerHand.getPoints()) {
          reward = -1;
        }
        done = true;
      } else if (action === "double down") {
        playerHand.addCard(deck.draw());
        doubleDown = true;
        if (playerHand.getPoints() > 21) {
          reward = -2;
          done = true;
        }
      } else if (
        action === "split" &&
        playerHand.cards[0].value === playerHand.cards[1].value
      ) {
        // Handle splitting logic
        reward = 0;
      }

      const nextState = `${playerHand.getPoints()}-${
        dealerHand.cards[0].value
      }`;
      agent.update(state, action, reward, nextState, actions);
      state = nextState;
    

    if (doubleDown) {
      reward *= 2;
    }

    totalProfit += reward;
    if (reward > 0) {
      totalWins++;
    }
  }
  }

  const winRate = (totalWins / numGames) * 100;
  const averageProfit = totalProfit / numGames;

  console.log(`Win Rate: ${winRate.toFixed(2)}%`);
  console.log(`Average Profit per Game: ${averageProfit.toFixed(2)}`);
}

// Run simulations with trained agent
simulateGames(trainedAgent);

let deck, playerHand, dealerHand, currentState;

function initializeGame() {
  deck = new Deck();
  playerHand = new Hand();
  dealerHand = new Hand();

  playerHand.addCard(deck.draw());
  playerHand.addCard(deck.draw());
  dealerHand.addCard(deck.draw());
  dealerHand.addCard(deck.draw());

  currentState = `${playerHand.getPoints()}-${dealerHand.cards[0].value}`;
  updateUI();
}

function updateUI() {
  document.getElementById("game-info").innerHTML = `
  Player's Hand: ${JSON.stringify(
    playerHand.cards
  )} (${playerHand.getPoints()})
  <br>
  Dealer's Hand: ${JSON.stringify(dealerHand.cards[0])}, Hidden
`;
}

document.getElementById("hit").addEventListener("click", () => {
  playerHand.addCard(deck.draw());
  if (playerHand.getPoints() > 21) {
    document.getElementById("results").innerText = "Bust! You lose.";
    initializeGame();
  } else {
    currentState = `${playerHand.getPoints()}-${
      dealerHand.cards[0].value
    }`;
    updateUI();
  }
});

document.getElementById("stay").addEventListener("click", () => {
  while (dealerHand.getPoints() < 17) {
    dealerHand.addCard(deck.draw());
  }
  let result = "";
  if (
    dealerHand.getPoints() > 21 ||
    playerHand.getPoints() > dealerHand.getPoints()
  ) {
    result = "You win!";
  } else if (playerHand.getPoints() < dealerHand.getPoints()) {
    result = "You lose.";
  } else {
    result = "It's a tie.";
  }
  document.getElementById("results").innerText = result;
  initializeGame();
});

document.getElementById("doubleDown").addEventListener("click", () => {
  playerHand.addCard(deck.draw());
  if (playerHand.getPoints() > 21) {
    document.getElementById("results").innerText = "Bust! You lose.";
  } else {
    while (dealerHand.getPoints() < 17) {
      dealerHand.addCard(deck.draw());
    }
    let result = "";
    if (
      dealerHand.getPoints() > 21 ||
      playerHand.getPoints() > dealerHand.getPoints()
    ) {
      result = "You win!";
    } else if (playerHand.getPoints() < dealerHand.getPoints()) {
      result = "You lose.";
    } else {
      result = "It's a tie.";
    }
    document.getElementById("results").innerText = result;
  }
  initializeGame();
});

document.getElementById("split").addEventListener("click", () => {
  if (playerHand.cards[0].value === playerHand.cards[1].value) {
    // Implement split logic
    document.getElementById("results").innerText =
      "Split implemented. Continue game logic.";
  } else {
    document.getElementById("results").innerText =
      "Cannot split. Cards are not the same.";
  }
});

initializeGame();

// Plot Q-values and policies using Chart.js
function plotQValues() {
  const qValues = Object.entries(agent.qTable).map(([state, actions]) => {
    return {
      state,
      actions,
    };
  });

  const ctx = document.getElementById("qValueChart").getContext("2d");
  const data = {
    labels: qValues.map((q) => q.state),
    datasets: actions.map((action) => ({
      label: action,
      data: qValues.map((q) => q.actions[action] || 0),
      backgroundColor: getColor(action),
      borderColor: getColor(action),
      borderWidth: 1,
      fill: false,
    })),
  };

  const options = {
    scales: {
      yAxes: [
        {
          ticks: {
            beginAtZero: true,
          },
        },
      ],
    },
  };

  const qValueChart = new Chart(ctx, {
    type: "bar",
    data: data,
    options: options,
  });
}

function getColor(action) {
  switch (action) {
    case "hit":
      return "rgba(255, 99, 132, 0.5)";
    case "stay":
      return "rgba(54, 162, 235, 0.5)";
    case "double down":
      return "rgba(255, 206, 86, 0.5)";
    case "split":
      return "rgba(75, 192, 192, 0.5)";
    default:
      return "rgba(153, 102, 255, 0.5)";
  }
}

plotQValues();