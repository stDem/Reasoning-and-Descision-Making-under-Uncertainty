const canvas = document.getElementById('simulationCanvas');
const ctx = canvas.getContext('2d');
const chartCanvas = document.getElementById('chartCanvas').getContext('2d');
const width = canvas.width;
const height = canvas.height;

const gravity = 9.8; // Gravity acceleration in m/s^2
const dt = 0.1; // Time step in seconds
const noiseLevel = 10; // Noise level for observations
// const dropOutRate = 0.1;

// Initial state
let state = {
    ball1: { x: 0, y: 0, vx: 50, vy: 45 },
    ball2: { x: 0, y: 50, vx: 50, vy: 45 }
};
const numParticles = 70;
let particles = [];

// Initialize particles
function initializeParticles() {
    particles = [];
    for (let i = 0; i < numParticles; i++) {
        particles.push({
            ball1: { x: state.ball1.x, y: state.ball1.y, vx: state.ball1.vx, vy: state.ball1.vy },
            ball2: { x: state.ball2.x, y: state.ball2.y, vx: state.ball2.vx, vy: state.ball2.vy },
            weight: 1 / numParticles
        });
    }
}

// Add Gaussian noise
function addNoise(value, noiseLevel) {
    return value + noiseLevel * (Math.random() * 2 - 1);
}

// Simulate ball motion
function simulate(state) {
    state.ball1.x += state.ball1.vx * dt;
    state.ball1.y += state.ball1.vy * dt - 0.5 * gravity * dt ** 2;
    state.ball1.vy -= gravity * dt;

    state.ball2.x += state.ball2.vx * dt;
    state.ball2.y += state.ball2.vy * dt - 0.5 * gravity * dt ** 2;
    state.ball2.vy -= gravity * dt;
}

// Generate noisy observations
function generateNoisyObservations(state) {
    return {
        ball1: { x: addNoise(state.ball1.x, noiseLevel), y: addNoise(state.ball1.y, noiseLevel) },
        ball2: { x: addNoise(state.ball2.x, noiseLevel), y: addNoise(state.ball2.y, noiseLevel) }
    };
}

// Update particles
function updateParticles(observations) {
    particles.forEach(particle => {
        simulate(particle);

        // Calculate weight based on observation likelihood
        const errorBall1 = Math.sqrt(Math.pow(particle.ball1.x - observations.ball1.x, 2) + Math.pow(particle.ball1.y - observations.ball1.y, 2));
        const errorBall2 = Math.sqrt(Math.pow(particle.ball2.x - observations.ball2.x, 2) + Math.pow(particle.ball2.y - observations.ball2.y, 2));

        particle.weight = Math.exp(-errorBall1 / (2 * noiseLevel * noiseLevel)) * Math.exp(-errorBall2 / (2 * noiseLevel * noiseLevel));
    });

    // Normalize weights
    const totalWeight = particles.reduce((sum, p) => sum + p.weight, 0);
    particles.forEach(particle => {
        particle.weight /= totalWeight;
    });

    // Resample particles
    resampleParticles();
}

// Resample particles based on their weights
function resampleParticles() {
    const newParticles = [];
    for (let i = 0; i < numParticles; i++) {
        const index = weightedRandomChoice(particles);
        newParticles.push(JSON.parse(JSON.stringify(particles[index])));
    }
    particles = newParticles;
}

// Weighted random choice
function weightedRandomChoice(particles) {
    let sum = 0;
    const r = Math.random();
    for (let i = 0; i < particles.length; i++) {
        sum += particles[i].weight;
        if (r <= sum) {
            return i;
        }
    }
    return particles.length - 1;
}

// Estimate state from particles
function estimateState() {
    let estimate = {
        ball1: { x: 0, y: 0, vx: 0, vy: 0 },
        ball2: { x: 0, y: 0, vx: 0, vy: 0 }
    };

    particles.forEach(particle => {
        estimate.ball1.x += particle.ball1.x * particle.weight;
        estimate.ball1.y += particle.ball1.y * particle.weight;
        estimate.ball1.vx += particle.ball1.vx * particle.weight;
        estimate.ball1.vy += particle.ball1.vy * particle.weight;

        estimate.ball2.x += particle.ball2.x * particle.weight;
        estimate.ball2.y += particle.ball2.y * particle.weight;
        estimate.ball2.vx += particle.ball2.vx * particle.weight;
        estimate.ball2.vy += particle.ball2.vy * particle.weight;
    });

    return estimate;
}

// Draw the simulation
// function draw(state, observations, estimate) {
//     // ctx.clearRect(0, 0, width, height);

//     // // Draw true positions
//     ctx.fillStyle = 'blue';
//     ctx.beginPath();
//     ctx.arc(state.ball1.x, state.ball1.y, 1, 0, 2 * Math.PI);
//     ctx.arc(state.ball2.x, state.ball2.y, 1, 0, 2 * Math.PI);
//     ctx.fill();


//     // Draw noisy observations
//     ctx.fillStyle = 'red';
//     ctx.beginPath();
//     ctx.arc(observations.ball1.x, observations.ball1.y, 1, 0, 2 * Math.PI);
//     ctx.arc(observations.ball2.x, observations.ball2.y, 1, 0, 2 * Math.PI);
//     ctx.fill();

//     // Draw estimated positions
//     ctx.fillStyle = 'green';
//     ctx.beginPath();
//     ctx.arc(estimate.ball1.x, estimate.ball1.y, 1, 0, 2 * Math.PI);
//     ctx.arc(estimate.ball2.x, estimate.ball2.y, 1, 0, 2 * Math.PI);
//     ctx.fill();

// }

// Create plots using Chart.js
function createPlots(data) {
    const truePositionsx = data.map(item => item.trueState.ball1.x);
    const truePositions1 = data.map(item => item.trueState.ball1.y);
    const truePositions2 = data.map(item => item.trueState.ball2.y);
    const estimatedPositions1 = data.map(item => item.estimate.ball1.y);
    const estimatedPositions2 = data.map(item => item.estimate.ball2.y);
    const measuredPositions1 = data.map(item => item.observations.ball1.y);
    const measuredPositions2 = data.map(item => item.observations.ball2.y);

    const chartData = {
        labels: truePositionsx,
        datasets: [
            {
                label: 'True Position Ball 1',
                data: truePositions1,
                borderColor: 'blue',
                fill: false,
            },
            {
                label: 'Estimated Position Ball 1',
                data: estimatedPositions1,
                borderColor: 'green',
                fill: false,

            },
            {
                label: 'Observation Position Ball 1',
                data: measuredPositions1,
                borderColor: 'orange',
                fill: false,
                pointRadius: 4,
                borderWidth: 2,
                borderDash: [5, 5],
            },
            {
                label: 'True Position Ball 2',
                data: truePositions2,
                borderColor: 'violet',
                fill: false,
            },
            {
                label: 'Estimated Position Ball 2',
                data: estimatedPositions2,
                borderColor: 'green',
                fill: false,
            },
            {
                label: 'Observation Position Ball 2',
                data: measuredPositions2,
                borderColor: 'red',
                fill: false,
                pointRadius: 4,
                borderWidth: 2,
                borderDash: [5, 5],
            }
            
        ]
    };

    const config = {
        type: 'line',
        data: chartData,
        options: {
            scales: {
                x: { title: { display: true, text: 'X' } },
                y: { title: { display: true, text: 'Y' } }
            }
        }
    };

    new Chart(chartCanvas, config);
}

// Main loop
const data = [];
function mainLoop() {
    simulate(state);
    const observations = generateNoisyObservations(state);
    updateParticles(observations);
    const estimate = estimateState();

    data.push({ trueState: JSON.parse(JSON.stringify(state)), estimate: estimate, observations: observations });
    // draw(state, observations, estimate);

    if (data.length < 100) {
        requestAnimationFrame(mainLoop);
    } else {
        createPlots(data);
    }
}

// Initialize particles and start the main loop
initializeParticles();
mainLoop();
