const radius = 30;
const cellSize = radius / Math.sqrt(2);
const samplesBeforeRejection = 100;
const ratio = window.devicePixelRatio || 1;
const cellsX = Math.round(1280 / cellSize) * ratio;
const cellsY = Math.round(640 / cellSize) * ratio;
const width = cellsX * cellSize;
const height = cellsY * cellSize;
// const grid = [cellsX * cellsY];
const xMid = width * 0.5;
const yMid = height * 0.5;

let timer;
let startTime = 0;

const canvas = d3
  .select('#root')
  .append('canvas')
  .attr('id', 'canvas')
  .attr('width', width)
  .attr('height', height)
  .style('width', width / ratio + 'px')
  .style('height', height / ratio + 'px');

const context = canvas.node().getContext('2d');
context.lineWidth = 1;
context.strokeStyle = '#cccccc';
context.fillStyle = '#333333';

draw();

document.getElementById('start').onclick = () => {
  draw();
};

// TODO poisson-fast
// add tailwind style

function draw() {
  clear();
  document.getElementById('message').innerText = '...';
  if (document.getElementById('grid').checked) drawGrid();

  const selection = getSelection();
  if (timer) timer.stop();
  startTime = 0;

  switch (selection) {
    case '0': {
      randomPoints();
      break;
    }
    case '1': {
      poissonDisc();
      break;
    }
    default:
      break;
  }
}

function poissonDisc() {
  const candidatePoints = [];
  const points = [];
  const gridWidth = Math.ceil(width / cellSize);
  const gridHeight = Math.ceil(height / cellSize);
  const grid = [];
  let finished = false;

  candidatePoints.push({ x: width / 2, y: height / 2 });

  timer = new d3.timer((e) => {
    if (finished) {
      timer.stop();
      document.getElementById('message').innerText =
        'Generated ' + points.length + ' points.';
      return;
    }

    const start = Date.now();

    while (!finished && Date.now() - start < 15) {
      const index = (Math.random() * (candidatePoints.length - 1)) | 0;
      let newPointIsValid = false;

      for (let k = 0; k < samplesBeforeRejection; k++) {
        const a = Math.random() * Math.PI * 2;
        const r = Math.random() * 2 * radius + radius;

        const newPoint = {
          x: candidatePoints[index].x + r * Math.cos(a),
          y: candidatePoints[index].y + r * Math.sin(a),
        };

        if (isValidPoint(newPoint, points)) {
          points.push(newPoint);
          candidatePoints.push(newPoint);
          const gridIndex =
            gridWidth * ((newPoint.y / cellSize) | 0) +
            ((newPoint.x / cellSize) | 0);

          grid[gridIndex] = newPoint;

          newPointIsValid = true;

          context.beginPath();
          context.arc(newPoint.x, newPoint.y, 3, 0, 2 * Math.PI);
          context.fill();

          break;
        }
      }

      if (!newPointIsValid) {
        candidatePoints.splice(index, 1);
      }

      if (candidatePoints.length <= 0) finished = true;
    }
  });

  // Fast Poisson Disk Sampling in Arbitrary Dimensions by Robert Bridson
  // https://www.cs.ubc.ca/~rbridson/docs/bridson-siggraph07-poissondisk.pdf
  function isValidPointFast(newPoint, points, grid) {
    const gridX = (newPoint.x / cellSize) | 0;
    const gridY = (newPoint.y / cellSize) | 0;
    const searchStartX = Math.max(0, gridX - 2);
    const searchStartY = Math.max(0, gridY - 2);
    const searchEndX = Math.min(gridX + 2 + 1, gridWidth);
    const searchEndY = Math.min(gridY + 2 + 1, gridHeight);

    for (let y = searchStartY; y < searchEndY; y++) {
      const gridRow = y * gridWidth;
      for (let x = searchStartX; x < searchEndX; x++) {
        const gridCell = grid[gridRow + x];
        console.log(newPoint);

        if (gridCell)
          console.log(
            newPoint,
            points[gridCell],
            sqrDistance(newPoint, points[gridCell]),
            radius * radius
          );

        if (
          gridCell &&
          sqrDistance(newPoint, points[gridCell]) <= radius * radius
        ) {
          console.log('reject point');
          return false;
        }
      }
    }

    return true;
  }

  function isValidPoint(newPoint, points) {
    if (
      newPoint.x < 0 ||
      newPoint.x >= width ||
      newPoint.y < 0 ||
      newPoint.y >= height
    ) {
      return false;
    }

    for (let i = 0; i < points.length; i++) {
      if (sqrDistance(newPoint, points[i]) <= radius * radius) {
        return false;
      }
    }

    return true;
  }
}

function randomPoints() {
  context.fillStyle = '#333333';
  const numPoints = 2400;

  for (let i = 0; i < numPoints; i++) {
    const x = Math.random() * width;
    const y = Math.random() * height;

    context.beginPath();
    context.arc(x, y, 3, 0, 2 * Math.PI);
    context.fill();
  }

  document.getElementById('message').innerText =
    'Generated ' + numPoints + ' points.';
}

function drawGrid() {
  context.lineWidth = 1;
  context.strokeStyle = '#cccccc';

  for (let i = 0; i < cellsX * cellsY; i++) {
    let x = i * cellSize;
    context.beginPath();
    context.moveTo(x, 0);
    context.lineTo(x, height);
    context.stroke();
  }

  for (let i = 0; i < cellsX * cellsY; i++) {
    let y = i * cellSize;
    context.beginPath();
    context.moveTo(0, y);
    context.lineTo(width, y);
    context.stroke();
  }
}

function sqrDistance(pointA, pointB) {
  return Math.pow(pointA.x - pointB.x, 2) + Math.pow(pointA.y - pointB.y, 2);
}

function addPoint(arr, point) {
  arr.push({ x: point.x, y: point.y });
}

function clear() {
  context.clearRect(0, 0, width, height);
}

function getSelection() {
  const radios = document.getElementsByName('poisson-disc');

  for (let i = 0; i < radios.length; i++) {
    if (radios[i].checked) return radios[i].value;
  }
}
