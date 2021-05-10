const radius = 40;
const cellSize = radius / Math.sqrt(2);
const samplesBeforeRejection = 100;
const ratio = window.devicePixelRatio || 1;
const cellsX = Math.round(800 / cellSize) * ratio;
const cellsY = Math.round(450 / cellSize) * ratio;
const width = cellsX * cellSize;
const height = cellsY * cellSize;
const grid = [cellsX * cellsY];
const xMid = width * 0.5;
const yMid = height * 0.5;
const points = [];

let timer;

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

// TODO put all algos in timer
// TODO sort out timer start/stop
// TODO poisson-fast
// add tailwind style

function draw() {
  // timer.stop();
  clear();
  if (document.getElementById('grid').checked) drawGrid();

  const selection = getSelection();

  switch (selection) {
    case '0': {
      randomPoints();
      break;
    }
    case '1': {
      poissonDiscSlow();
      break;
    }
    case '2': {
      poissonDiscFast();
      break;
    }
    default:
      break;
  }
}

// Fast Poisson Disk Sampling in Arbitrary Dimensions by Robert Bridson
// https://www.cs.ubc.ca/~rbridson/docs/bridson-siggraph07-poissondisk.pdf
function poissonDiscFast() {}

function poissonDiscSlow() {
  const candidatePoints = [];
  candidatePoints.push({ x: width / 2, y: height / 2 });

  timer = d3.timer(() => {
    const index = (Math.random() * (candidatePoints.length - 1)) | 0;
    let newPointIsValid = false;

    for (let k = 0; k < samplesBeforeRejection; k++) {
      const a = Math.random() * Math.PI * 2;
      const r = Math.random() * 2 * radius + radius;

      const newPoint = {
        x: candidatePoints[index].x + r * Math.cos(a),
        y: candidatePoints[index].y + r * Math.sin(a),
      };

      if (isValidPoint(newPoint)) {
        points.push(newPoint);
        candidatePoints.push(newPoint);
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

    if (candidatePoints.length <= 0) timer.stop();
  });

  function isValidPoint(newPoint) {
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

  for (let i = 0; i < 640; i++) {
    const x = Math.random() * width;
    const y = Math.random() * height;

    points.push({ x, y });

    context.beginPath();
    context.arc(x, y, 3, 0, 2 * Math.PI);
    context.fill();
  }
}

function drawGrid() {
  context.lineWidth = 1;
  context.strokeStyle = '#cccccc';

  for (let i = 0; i < width / grid.length; i++) {
    let x = i * cellSize;
    context.beginPath();
    context.moveTo(x, 0);
    context.lineTo(x, height);
    context.stroke();
  }

  for (let i = 0; i < height / grid.length; i++) {
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
