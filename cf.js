var canvas = document.getElementById('myCanvas');
var context = canvas.getContext('2d');

var pixelWidth = 5;
var matrixLength = 128;

var rabbitMaxAge = 5;
var foxMaxAge = 8;
var foxMaxHunger = 5;

var matrix;
var newMatrix;

var iteration = 0;

var interval;

function startSimulation() {
	interval = setInterval(iterate, 100);
}

function stopSimulation () {
	clearInterval(interval);
}

function initSimulation() {
	matrix = createMatrix();

	/*rabbitMaxAge = document.getElementById('rabbitAge').value;
	foxMaxAge = document.getElementById('foxAge').value;*/

	var i, x, y;

	// generate rabbits
	for (i = 0; i < 1000; i += 1) {
		x = getRandomNumber(0, matrixLength);
		y = getRandomNumber(0, matrixLength);

		if (!matrix[x][y]) {
			matrix[x][y] = { 'type': 'rabbit', 'age': getRandomNumber(0, rabbitMaxAge) }; 
		} else {
			i--;
		}
	}

	// generate foxes
	for (i = 0; i < 100; i += 1) {
		x = getRandomNumber(0, matrixLength);
		y = getRandomNumber(0, matrixLength);

		if (!matrix[x][y]) {
			matrix[x][y] = { 
				'type': 'fox', 
				'age': getRandomNumber(0, foxMaxAge),
				'hunger': 0
			}; 
		} else {
			i--;
		}
	}

	drawCanvas();
}

function iterate() {
	var i, j, k, n8;
	var newPos;
	newMatrix = createMatrix();

	// RABBIT ITERATION
	for (i = 0; i < matrix.length; i += 1) {
		for (j = 0; j < matrix[i].length; j += 1) {
			if (matrix[i][j] && matrix[i][j].type == 'rabbit') {
				var rabbit = matrix[i][j];
				rabbit.age += 1;

				if (rabbit.age > rabbitMaxAge) {
					delete matrix[i][j];
					// reproduce
					newPos = getRandomN8(i, j);
					newMatrix[newPos.x][newPos.y] = { 'type': 'rabbit', 'age': 0 };
					newPos = getRandomN8(i, j);
					newMatrix[newPos.x][newPos.y] = { 'type': 'rabbit', 'age': 0 };
				} else {
					newPos = getRandomN8(i, j);
					newMatrix[newPos.x][newPos.y] = matrix[i][j];
					delete matrix[i][j];
				}
			}	
		}
	}

	// FOX ITERATION
	for (i = 0; i < matrix.length; i += 1) {
		for (j = 0; j < matrix[i].length; j += 1) {
			if (matrix[i][j] && matrix[i][j].type == 'fox') {
				var fox = matrix[i][j];
				fox.age += 1;
				fox.hunger += 1;

				if (fox.age > foxMaxAge) {
					delete matrix[i][j];
					// reproduce
					/*newPos = getRandomN8(i, j);
					newMatrix[newPos.x][newPos.y] = { 'type': 'fox', 'age': 0, 'hunger': fox.hunger };
					newPos = getRandomN8(i, j);
					newMatrix[newPos.x][newPos.y] = { 'type': 'fox', 'age': 0, 'hunger': fox.hunger };*/
					n8 = getN8(i, j);
					var possiblePositions = [];

					for (k = 0; k < n8.length; k += 1) {
						if (!newMatrix[n8[k].x][n8[k].y] || newMatrix[n8[k].x][n8[k].y].type != 'fox') {
							possiblePositions.push(n8[k]);
						}
					}

					for (k = 0; k < 2; k += 1) {
						var randomNumber = getRandomNumber(0, possiblePositions.length);
						newPos = possiblePositions[randomNumber];
						possiblePositions.splice(randomNumber, 1);
						newMatrix[newPos.x][newPos.y] = { 'type': 'fox', 'age': 0, 'hunger': fox.hunger };
					}

				} else {
					if (fox.hunger > foxMaxHunger) {
						delete matrix[i][j];
					} else {
						// look for a rabbit
						n8 = getN8(i, j);
						var eatableRabbits = [];

						for (k = 0; k < n8.length; k += 1) {
							if (newMatrix[n8[k].x][n8[k].y] && newMatrix[n8[k].x][n8[k].y].type == 'rabbit') {
								eatableRabbits.push(n8[k]);
							}
						}

						if (eatableRabbits.length !== 0) {
							var rabbitPos = eatableRabbits[getRandomNumber(0, eatableRabbits.length)];
							fox.hunger -= newMatrix[rabbitPos.x][rabbitPos.y].age;
							fox.hunger = fox.hunger < 0 ? 0 : fox.hunger;
							newMatrix[rabbitPos.x][rabbitPos.y] = fox;
						} else {
							// no rabbit? :( just move
							newPos = getRandomN8(i, j);
							newMatrix[newPos.x][newPos.y] = matrix[i][j];
							delete matrix[i][j];
						}	
					}
				}			
			}	
		}
	}

	matrix = newMatrix;
	drawCanvas();
}

function drawCanvas () {
	var rabbitCount = 0;
	context.clearRect(0, 0, canvas.width, canvas.height);

	// TODO: cache array length
	for (var i = 0, length = matrix.length; i < length; i += 1) {
		for (var j = 0; j < length; j += 1) {

			if (matrix[i][j]) {
				switch(matrix[i][j].type) {
					case 'rabbit':
						drawRabbit(i, j);
						//rabbitCount += 1;
						break;
					case 'fox':
						drawFox(i, j);
						break;
					default:
				}
			}
		}
	}

	///iteration += 1;
	//console.log("(" + iteration + "): " + rabbitCount + " rabbits");
}

function getN8(x, y) {
	var	results = [];
	
	for (var i = -1; i < 2; i += 1) {
		for (var j = -1; j < 2; j += 1) {
			var newX = x + i;
			var newY = y + j;

			if (newX < 0) {
				newX = matrixLength - 1;
			} 
			else if (newX >= matrixLength) {
				newX = 0;
			}

			if (newY < 0) {
				newY = matrixLength - 1;
			} 
			else if (newY >= matrixLength) {
				newY = 0;
			}

			results.push({ x: newX, y: newY });
		}
	}

	return results;
}

function getRandomN8(x, y) {
	var	results = getN8(x, y),
			newResults = [];

	if (results.length !== 0) {
		for (var i = 0, length = results.length; i < length; i += 1) {
			var myX = results[i].x;
			var myY = results[i].y;

			if (!matrix[myX][myY] && !newMatrix[myX][myY]) {
				newResults.push(results[i]);
			} 
		}
	}

	if (newResults.length === 0) {
			newResults.push({ x: x, y: y });
	}

	return newResults[getRandomNumber(0, newResults.length)];
}

function drawRabbit(x, y) {
	drawPixel(x, y, 'rgb(0, 200, 0)');
}
	
function drawFox(x, y) {
	drawPixel(x, y, 'rgb(200, 0, 0)');
}

function drawPixel(x, y, color) {
	context.fillStyle = color;
	context.fillRect(x * pixelWidth, y * pixelWidth, pixelWidth, pixelWidth);
}

function getRandomNumber(min, max) {
	return Math.floor(Math.random() * (max - min) + min);
}

function createMatrix() {
	var newMatrix = new Array(matrixLength);

	for (var i = 0; i < newMatrix.length; i += 1) {
		newMatrix[i] = new Array(matrixLength);
	}

	return newMatrix;
}
