
class KalmanFilter {
    constructor(dt, R, Q, P, x0) {
        this.dt = dt;

        // Initial state vector [x_position, y_position, x_velocity, y_velocity]
        this.x = x0;

        // State transition matrix
        this.F = math.matrix([
            [1, 0, dt, 0],
            [0, 1, 0, dt],
            [0, 0, 1, 0],
            [0, 0, 0, 1]
        ]);

        // Control matrix
        this.B = math.matrix([
            [0.5 * dt ** 2, 0],
            [0, 0.5 * dt ** 2],
            [dt, 0],
            [0, dt]
        ]);

        // Measurement matrix
        this.H = math.matrix([
            [1, 0, 0, 0],
            [0, 1, 0, 0]
        ]);

        // Measurement noise covariance
        this.R = R;

        // Process noise covariance
        this.Q = Q;

        // Error covariance matrix
        this.P = P;
    }

    predict(u) {
        u = math.matrix([[u[0]], [u[1]]]);

        // Predict the state
        this.x = math.add(math.multiply(this.F, this.x), math.multiply(this.B, u));

        // Predict the error covariance
        this.P = math.add(math.multiply(math.multiply(this.F, this.P), math.transpose(this.F)), this.Q);

        return this.x;
    }

    update(z) {
        z = math.matrix([[z[0]], [z[1]]]);

        // Measurement residual
        let y = math.subtract(z, math.multiply(this.H, this.x));

        // Residual covariance
        let S = math.add(math.multiply(math.multiply(this.H, this.P), math.transpose(this.H)), this.R);

        // Kalman gain
        let K = math.multiply(math.multiply(this.P, math.transpose(this.H)), math.inv(S));

        // Update state estimate
        this.x = math.add(this.x, math.multiply(K, y));

        // Update error covariance
        let I = math.identity(this.P.size()[0]);
        this.P = math.multiply(math.subtract(I, math.multiply(K, this.H)), this.P);

        return this.x;
    }
}

function simulateBallThrowing(numSteps, dt, launchPosition, launchSpeed, launchAngle, measurementNoise, dropOutRate) {
    let g = 9.81;
    let radianAngle = launchAngle * (Math.PI / 180);
    let truePosition = [launchPosition[0], launchPosition[1]];
    let trueVelocity = [launchSpeed * Math.cos(radianAngle), launchSpeed * Math.sin(radianAngle)];

    let positions = [];
    let measurements = [];

    for (let t = 0; t < numSteps; t++) {
        // Update true position and velocity
        truePosition[0] += trueVelocity[0] * dt;
        truePosition[1] += trueVelocity[1] * dt - 0.5 * g * dt ** 2;
        trueVelocity[1] -= g * dt;

        // Simulate measurement with noise
        let measurement = [
            truePosition[0] + measurementNoise * (Math.random() - 0.5),
            truePosition[1] + measurementNoise * (Math.random() - 0.5)
        ];

        // Random dropout of measurements
        if (Math.random() < dropOutRate) {
            measurement = [null, null];
        }

        positions.push([...truePosition]);
        measurements.push(measurement);
    }

    return { positions, measurements };
}


function applyKalmanFilter(numSteps, dt, measurements, R, Q, P, x0) {
    let kf = new KalmanFilter(dt, R, Q, P, x0);
    let estimates = [];

    for (let t = 0; t < numSteps; t++) {
        let measurement = measurements[t];

        // Predict the next state
        kf.predict([0, -9.81]);

        // Update with measurement if available
        if (measurement[0] !== null && measurement[1] !== null) {
            kf.update(measurement);
        }

        let estimate = kf.x.toArray().flat();
        estimates.push([estimate[0], estimate[1]]);
    }

    return estimates;
}

document.addEventListener('DOMContentLoaded', function() {
    const dt = 0.1;
    const numSteps = 70;
    const launchPosition = [0, 0]; // x, y
    const launchSpeed = 50; // m/s
    const launchAngle = 45; // degrees
    const measurementNoise = 7; // noise in measurement
    const dropOutRate = 0.1; // 10% dropout rate

    // Process noise covariance
    const Q = math.matrix([
        [1, 0, 0, 0],
        [0, 1, 0, 0],
        [0, 0, 1, 0],
        [0, 0, 0, 1]
    ]);

    // Measurement noise covariance
    const R = math.matrix([
        [measurementNoise, 0],
        [0, measurementNoise]
    ]);

    // Initial error covariance
    const P = math.matrix([
        [1, 0, 0, 0],
        [0, 1, 0, 0],
        [0, 0, 1, 0],
        [0, 0, 0, 1]
    ]);

    // Initial state [x_position, y_position, x_velocity, y_velocity]
    const x0 = math.matrix([
        [launchPosition[0]],
        [launchPosition[1]],
        [launchSpeed * Math.cos(launchAngle * Math.PI / 180)],
        [launchSpeed * Math.sin(launchAngle * Math.PI / 180)]
    ]);

    // Simulate ball throwing
    const { positions, measurements } = simulateBallThrowing(numSteps, dt, launchPosition, launchSpeed, launchAngle, measurementNoise, dropOutRate);

    // Apply Kalman Filter
    const estimates = applyKalmanFilter(numSteps, dt, measurements, R, Q, P, x0);

    // Prepare data for plotting
    // const time = Array.from({ length: numSteps }, (_, i) => i * dt);
    const trueX = positions.map(p => p[0]);
    const trueY = positions.map(p => p[1]);
    const measuredX = measurements.map(m => m[0] !== null ? m[0] : null);
    const measuredY = measurements.map(m => m[1] !== null ? m[1] : null);
    const estimatedX = estimates.map(e => e[0]);
    const estimatedY = estimates.map(e => e[1]);

    // Plot the results
 
    let xyTrue = [];
    let xyMeasured = [];
    let xyEstimated = [];

    for (let i = 0; i < trueX.length; i++) {
        xyTrue[i]={
            x: trueX[i],
            y: trueY[i],
        };
    };
    for (let i = 0; i < measuredX.length; i++) {
        xyMeasured[i]={
            xMeasured: measuredX[i],
            yMeasured: measuredY[i],
        };
    };
    for (let i = 0; i < estimatedX.length; i++) {
        xyEstimated[i]={
            xEstimated: estimatedX[i],
            yEstimated: estimatedY[i],
        };
    };


    new Chart("myChart", {
    type: "line",
    data: {
        labels: trueX,
        datasets: [
            {
                label: 'Real flight curve',
                borderColor: 'blue',
                fill: false,
                data: xyTrue,
                borderWidth: 1.5,
            },
          
            {
                label: 'Estimated XY Position',
                data: estimatedY,
                borderColor: 'green',
                fill: false,
            },
            {
                label: 'Observations',
                data: measuredY,
                borderColor: 'red',
                fill: false,
                pointRadius: 4,
                borderWidth: 2,
                borderDash: [5, 5]
            },
        ]
    },
    options: {
        legend: {display: false},
        scales: {
            xAxes: [{
                scaleLabel: {
                    display: true,
                    labelString: 'X'
                }
            }],
            yAxes: [{
                scaleLabel: {
                    display: true,
                    labelString: 'Y'
                }
            }]
        }
    }
    });
});
