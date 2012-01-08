var canvas = document.getElementById('myCanvas');
var context = canvas.getContext('2d');

var pixelWidth = 5;
var matrixLength = 128;

var rabbitMaxAge = 5;
var foxMaxAge = 8;
var foxMaxHunger = 5;

var tempMatrix;
var matrix;
var newMatrix;

var iteration = 0;

var interval;

var greenColors = [];
var redColors = [];

var index = 0;
var plot;
var data;
var data = [[1, 10], [2, 30]];
var options = {
  series: { shadowSize: 0 }, // drawing is faster without shadows
  yaxis: { min: 0, max: 100 },
  xaxis: { show: false }
};

function startSimulation() {
	interval = setInterval(iterate, 150);

	plot = $.plot($(".stats"), data, options);
}

function stopSimulation () {
	clearInterval(interval);
}

function initSimulation() {
	matrix = createMatrix();
	tempMatrix = createMatrix();

	// generate colors
	for (i = 0; i < 10; i += 1) {
		greenColors.push('rgb(0, ' + getRandomNumber(200, 250) + ', 0)');
	}

	for (i = 0; i < 10; i += 1) {
		redColors.push('rgb(' + getRandomNumber(200, 250) + ', 0, 0)');
	}

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
					newMatrix[newPos.x][newPos.y] = { 'type': 'rabbit', 'age': rabbit.age }; //matrix[i][j];
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
						newMatrix[newPos.x][newPos.y] = { 'type': 'fox', 'age': 0, 'hunger': fox.hunger };
						possiblePositions.splice(randomNumber, 1);
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
							newMatrix[rabbitPos.x][rabbitPos.y] = { 'type': 'fox', 'age': matrix[i][j].age, 'hunger': matrix[i][j].hunger};
							delete matrix[i][j];
						} else {
							// no rabbit? :( just move
							newPos = getRandomN8(i, j);
							newMatrix[newPos.x][newPos.y] = { 'type': 'fox', 'age': matrix[i][j].age, 'hunger': matrix[i][j].hunger};
							delete matrix[i][j];
						}
					}
				}
			}
		}
	}

	//matrix = newMatrix.clone();
	matrix = JSON.parse(JSON.stringify(newMatrix));
	drawCanvas();
}

function drawCanvas () {
	var rabbitCount = 0,
			foxCount = 0;
	//canvas.width = canvas.width;

	for (var i = 0, length = matrix.length; i < length; i += 1) {
		for (var j = 0; j < length; j += 1) {

			/*if (matrix[i][j]) {
				switch(matrix[i][j].type) {
					case 'rabbit':
						drawRabbit(i, j);
						rabbitCount += 1;
						break;
					case 'fox':
						drawFox(i, j);
						foxCount += 1;
						break;
					default:
				}
			}*/

			if (tempMatrix[i][j] !== matrix[i][j]) {
				if (matrix[i][j]) {
					switch(matrix[i][j].type) {
					case 'rabbit':
						// dirty little hack
						if (tempMatrix[i][j] && tempMatrix[i][j].type == 'rabbit')
							break;
						drawRabbit(i, j);
						rabbitCount += 1;
						break;
					case 'fox':
						if (tempMatrix[i][j] && tempMatrix[i][j].type == 'fox')
							break;
						drawFox(i, j);
						foxCount += 1;
						break;
					default:
						break;
					}
				} else {
					drawPixel(i, j, 'rgb(255, 255, 255)');
				}
			}
		}
	}

	//data = [[[0, rabbitCount], [1, foxCount]]];
	data = [[[1, rabbitCount]]];
	index++;

	plot.setData(data);
  plot.draw();

	tempMatrix = JSON.parse(JSON.stringify(matrix));
	//tempMatrix = matrix.clone();
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
	drawPixel(x, y, greenColors[getRandomNumber(0, 10)]);
}
	
function drawFox(x, y) {
	drawPixel(x, y, redColors[getRandomNumber(0, 10)]);
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




// $(function () {
    // we use an inline data source in the example, usually data would
    // be fetched from a server
    // var data = [], totalPoints = 300;
    // function getRandomData() {
    //     if (data.length > 0)
    //         data = data.slice(1);

    //     // do a random walk
    //     while (data.length < totalPoints) {
    //         var prev = data.length > 0 ? data[data.length - 1] : 50;
    //         var y = prev + Math.random() * 10 - 5;
    //         if (y < 0)
    //             y = 0;
    //         if (y > 100)
    //             y = 100;
    //         data.push(y);
    //     }

    //     // zip the generated y values with the x values
    //     var res = [];
    //     for (var i = 0; i < data.length; ++i)
    //         res.push([i, data[i]]);
    //     return res;
    // }

    // setup control widget
    // var updateInterval = 30;
    // // $("#updateInterval").val(updateInterval).change(function () {
    // //     var v = $(this).val();
    // //     if (v && !isNaN(+v)) {
    // //         updateInterval = +v;
    // //         if (updateInterval < 1)
    // //             updateInterval = 1;
    // //         if (updateInterval > 2000)
    // //             updateInterval = 2000;
    // //         $(this).val("" + updateInterval);
    // //     }
    // // });

    // // setup plot
    
    // var plot = $.plot($("#placeholder"), [ getRandomData() ], options);

    // function update() {
    //     plot.setData([ getRandomData() ]);
    //     // since the axes don't change, we don't need to call plot.setupGrid()
    //     plot.draw();
        
    //     setTimeout(update, updateInterval);
    // }
// });