
var gl = null; // WebGL context
var shaderProgram = null;
var triangleVertexPositionBuffer = null;
var triangleVertexColorBuffer = null;

var grid_height;
var grid_width;
var pause = false;
var gameover = true;
var game_message = "Destroy all invaders!!<br />";

// The GLOBAL transformation parameter
var globalTz = 0.0;

// translation and game variables
var tdown = 0.0;
var tboss = -1.3;
var tdboss = 0;
var level = 1;
var points = 0;
var tplayer = 0.0;
var txbullet = 0.0;
var tybullet = 1.1;
var bulletready = true;

var invpos = [[0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
[0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]];

// The rotation angles in degrees
var angleYY = 0.0;
var angleplayer = 0.0;

// Local Animation controls
var rotationYY_DIR = 1;
var rotationYY_SPEED = 1;

// To allow choosing the way of drawing the model triangles
var primitiveType = null;
var vertices = [];
var colors = [];

//----------------------------------------------------------------------------
// The WebGL code

// Handling the Vertex and the Color Buffers
function initBuffers() {

    // Coordinates
    // triangleVertexPositionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, triangleVertexPositionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
    triangleVertexPositionBuffer.itemSize = 3;
    triangleVertexPositionBuffer.numItems = vertices.length / 3;

    // Associating to the vertex shader
    gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute,
        triangleVertexPositionBuffer.itemSize,
        gl.FLOAT, false, 0, 0);

    // Colors
    // triangleVertexColorBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, triangleVertexColorBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(colors), gl.STATIC_DRAW);
    triangleVertexColorBuffer.itemSize = 3;
    triangleVertexColorBuffer.numItems = colors.length / 3;

    // Associating to the vertex shader
    gl.vertexAttribPointer(shaderProgram.vertexColorAttribute,
        triangleVertexColorBuffer.itemSize,
        gl.FLOAT, false, 0, 0);
}

//----------------------------------------------------------------------------

function drawModel(angleXX, angleYY, angleZZ,
    sx, sy, sz,
    tx, ty, tz,
    mvMatrix,
    primitiveType) { //gl.TRIANGLES

    mvMatrix = mult(mvMatrix, translationMatrix(tx, ty, tz));
    mvMatrix = mult(mvMatrix, rotationZZMatrix(angleZZ));
    mvMatrix = mult(mvMatrix, rotationYYMatrix(angleYY));
    mvMatrix = mult(mvMatrix, rotationXXMatrix(- 90));
    mvMatrix = mult(mvMatrix, scalingMatrix(sx, sy, sz));

    // Passing the Model View Matrix to apply the current transformation
    var mvUniform = gl.getUniformLocation(shaderProgram, "uMVMatrix");
    gl.uniformMatrix4fv(mvUniform, false, new Float32Array(flatten(mvMatrix)));

    // Associating the data to the vertex shader
    initBuffers();

    // Drawing 
    gl.drawArrays(primitiveType, 0, triangleVertexPositionBuffer.numItems);
}

//----------------------------------------------------------------------------

//  Drawing the 3D scene
function drawScene() {
    var pMatrix;
    var mvMatrix = [[1, 0, 0, 0], [0, 1, 0, 0], [0, 0, 1, 0], [0, 0, 0, 1]];// mat4();
    mvMatrix.matrix = true;

    // Clearing the frame-buffer and the depth-buffer
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    // Computing the Projection Matrix
    pMatrix = perspective(45, 1, 0.05, 15);

    // Global transformation !!
    globalTz = -2.5;

    // Passing the Projection Matrix to apply the current projection
    var pUniform = gl.getUniformLocation(shaderProgram, "uPMatrix");

    gl.uniformMatrix4fv(pUniform, false, new Float32Array(flatten(pMatrix)));

    // GLOBAL TRANSFORMATION FOR THE WHOLE SCENE
    mvMatrix = translationMatrix(0, 0, globalTz);

    // Instantianting the current model
    //INVADERS GRID
    for (grid_height = 0; grid_height < 5; grid_height++) {
        var invindex = [1, 1, 2, 2, 3];

        switch (invindex[grid_height]) {
            case 1: // red invaders
                vertices = invader1.slice();
                colors = invader1.slice();
                break;
            case 2: // green invaders
                vertices = invader2.slice();
                colors = invader2.slice();
                break;
            case 3: // blue invaders
                vertices = invader3.slice();
                colors = invader3.slice();
                break;
        }

        for (var i = 0; i < colors.length; i++) {
            if (i % 3 === invindex[grid_height] - 1) {
                colors[i] += 1;
            }
        }

        for (grid_width = 0; grid_width < 15; grid_width++) {
            drawModel(0.0, angleYY, 0.0,
                0.1, 0.1, 0.1,
                grid_width * 0.12 - 0.84 + invpos[grid_height][grid_width], grid_height * 0.11 + 0.2 - tdown, 0,
                mvMatrix,
                primitiveType);
        }
    }

    //BOSS
    vertices = boss.slice();
    colors = boss.slice();
    for (var i = 0; i < colors.length; i++) {
        if (i % 3 === 0) {
            colors[i] += 1;
            colors[i + 1] += 0.7;
            colors[i + 2] += 0.2;
        }
    }
    drawModel(0.0, angleYY, 0.0,
        0.1, 0.1, 0.1,
        tboss + tdboss, 0.8 - tdown, 0,
        mvMatrix,
        primitiveType);

    //PLAYER
    vertices = player.slice();
    colors = player.slice();
    for (var i = 0; i < colors.length; i++) {
        if (i % 3 === 0) {
            colors[i] += 0.55;
        }
    }
    drawModel(0.0, angleplayer, 0.0,
        0.1, 0.1, 0.1,
        tplayer, -0.85, 0,
        mvMatrix,
        primitiveType);

    //BULLET
    vertices = cube.slice();
    colors = cube.slice();
    for (var i = 0; i < colors.length; i++) {
        if (i % 3 === 0) {
            colors[i] += 0.9;
            colors[i + 1] += 0.9;
            colors[i + 2] += 0.9;
        }
    }
    drawModel(0.0, angleYY, 0.0,
        0.02, 0.02, 0.05,
        txbullet, tybullet, 0,
        mvMatrix,
        primitiveType);

}

//----------------------------------------------------------------------------
// Animation

var lastTime = 0;

function animate() {
    var timeNow = new Date().getTime();
    if (lastTime != 0) {
        var elapsed = timeNow - lastTime;

        // Local rotations
        angleYY += rotationYY_DIR * rotationYY_SPEED * (90 * elapsed) / 1000.0;
        if (Math.abs(angleYY) >= 30) {

            if (angleYY >= 30)
                angleYY = 29;
            else
                angleYY = -29;
            rotationYY_DIR = -rotationYY_DIR;
        }

        angleplayer = -tplayer * 50;

        // position
        tdown += level / 2 * 0.0003;
        tboss += (level / 2 + 1) / 2 * 0.02;

        if (tboss > 2.9) { // if boss dead
            tboss = 3;
        }
        if (tboss > 1.3) { // if boss alive
            tboss = - 1.3;
        }

        //bullet
        tybullet += 0.1;
        if (tybullet > 1.1) {
            tybullet = 1.1;
            bulletready = true;
        }

        killinvaders();
    }


    // updating game variables
    var rowskilled = 0;

    if (!invpos[0].includes(0)) {
        rowskilled = 1;
        if (!invpos[1].includes(0)) {
            rowskilled = 2;
            if (!invpos[2].includes(0)) {  // checking how many rows got eliminated
                rowskilled = 3;
                if (!invpos[3].includes(0)) {
                    rowskilled = 4;
                    if (!invpos[4].includes(0)) {
                        rowskilled = 5;
                    }
                }
            }
        }
    }

    if (rowskilled == 5) {
        level += 1;
        resetlevel();
        document.getElementById('right').innerHTML = "Level: " + level + " <br> Points: " + points;
    }

    if (0.11 * (rowskilled + 1) + 0.2 - tdown < -0.63) { // gameover condition
        gameover = true;
        document.getElementById('myLink').innerHTML = "Game Over - Press R to restart<br />";
    }

    lastTime = timeNow;
}

function killinvaders() {
    var x = parseInt(-txbullet / -0.12) + 7; // x pos of invader
    var y = 0; //1st row
    if (tybullet > (-tdown + 0.2) - 0.05 && tybullet < (-tdown + 0.2) + 0.05) {
        if (invpos[y][x] === 0) {
            invpos[y][x] = 3;
            points += 10;
            document.getElementById('right').innerHTML = "Level: " + level + " <br> Points: " + points;
            tybullet = 1.3;
            return;
        }
    }
    if (tybullet > (-tdown + 0.2) - 0.05 + 0.11 && tybullet < (-tdown + 0.2) + 0.05 + 0.11) {
        y = 1; //2nd row
        if (invpos[y][x] === 0) {
            invpos[y][x] = 3;
            points += 10;
            document.getElementById('right').innerHTML = "Level: " + level + " <br> Points: " + points;
            tybullet = 1.3;
            return;
        }
    }
    if (tybullet > (-tdown + 0.2) - 0.05 + 0.22 && tybullet < (-tdown + 0.2) + 0.05 + 0.22) {
        y = 2; //3rd row
        if (invpos[y][x] === 0) {
            invpos[y][x] = 3;
            points += 20;
            document.getElementById('right').innerHTML = "Level: " + level + " <br> Points: " + points;
            tybullet = 1.3;
            return;
        }
    }
    if (tybullet > (-tdown + 0.2) - 0.05 + 0.33 && tybullet < (-tdown + 0.2) + 0.05 + 0.33) {
        y = 3; //4th row
        if (invpos[y][x] === 0) {
            invpos[y][x] = 3;
            points += 20;
            document.getElementById('right').innerHTML = "Level: " + level + " <br> Points: " + points;
            tybullet = 1.3;
            return;
        }
    }
    if (tybullet > (-tdown + 0.2) - 0.05 + 0.44 && tybullet < (-tdown + 0.2) + 0.05 + 0.44) {
        y = 4; //5th row
        if (invpos[y][x] === 0) {
            invpos[y][x] = 3;
            points += 40;
            document.getElementById('right').innerHTML = "Level: " + level + " <br> Points: " + points;
            tybullet = 1.3;
            return;
        }
    }
    if (tybullet > (-tdown + 0.2) - 0.05 + 0.60 && tybullet < (-tdown + 0.2) + 0.05 + 0.60) {
        //boss row
        if ((txbullet > (tboss + tdboss) - 0.17) && (txbullet < (tboss + tdboss) + 0.17)) {
            tdboss = 3;
            points += 300;
            document.getElementById('right').innerHTML = "Level: " + level + " <br> Points: " + points;
            tybullet = 1.3;
            return;
        }
    }
}

function resetlevel() {
    tdown = 0.0;
    tboss = -1.3;
    tdboss = 0;
    tplayer = 0.0;
    txbullet = 1.3;
    invpos = [[0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]];

}

//----------------------------------------------------------------------------
// Timer
function tick() {
    requestAnimFrame(tick);
    drawScene();
    if (!pause && !gameover) {
        animate();
    }
}
//----------------------------------------------------------------------------

function setEventListeners() {
    document.addEventListener("keydown", function (event) {
        if (!pause && !gameover) {
            switch (event.key) {

                //left
                case "ArrowLeft": //left arrow
                case "a": case "A": // A
                    if (tplayer < -0.85) {
                        console.log("Already at max LEFT");
                        break;
                    }
                    tplayer -= 0.12;
                    console.log("Moved LEFT");
                    break;

                //right
                case "ArrowRight": //right arrow
                case "d": case "D": // D
                    if (tplayer > 0.85) {
                        console.log("Already at max RIGHT");
                        break;
                    }
                    tplayer += 0.12;
                    console.log("Moved RIGHT");
                    break;
            }
        }
    });

    document.addEventListener("keypress", function (event) {
        switch (event.key) {
            //shoot or restart
            case " ": // space bar
                if (!pause && !gameover) {
                    //stop scrolling when shooting on screens with small height
                    event.preventDefault();
                }
            case "w": case "W": // w
                if (!pause && !gameover && bulletready) {
                    // shoot
                    tybullet = -0.75;
                    txbullet = tplayer;
                    bulletready = false;
                    console.log("PEW!");
                }
                break;
            case "r": case "R": // R
                if (gameover) {
                    console.log("Starting game.");
                    // restart game
                    resetlevel();
                    level = 1;
                    points = 0;
                    document.getElementById('myLink').innerHTML = game_message;
                    // document.getElementById('myLink').innerHTML = "";
                    document.getElementById('right').innerHTML = "Level: 1 <br> Points: 0";
                    gameover = false;
                }
                break;

            //pause
            case "p": case "P": // P
                if (!gameover) {
                    console.log("Pause");
                    pause = !pause;
                    if (pause) document.getElementById('myLink').innerHTML = "Game Paused<br />";
                    else document.getElementById('myLink').innerHTML = game_message;
                    //else document.getElementById('myLink').innerHTML = "";
                    break;
                }
        }
    });
}

//----------------------------------------------------------------------------
// WebGL Initialization
function initWebGL(canvas) {
    try {
        // Create the WebGL context
        gl = canvas.getContext("webgl") || canvas.getContext("experimental-webgl");
        primitiveType = gl.TRIANGLES;
        // Enable FACE CULLING
        gl.enable(gl.CULL_FACE);
        // DEFAULT: The BACK FACE is culled!!
        gl.cullFace(gl.BACK);
        // Enable DEPTH-TEST
        gl.enable(gl.DEPTH_TEST);
    } catch (e) {
    }
    if (!gl) {
        alert("Could not initialise WebGL, sorry! :-(");
    }
}

//----------------------------------------------------------------------------

function runWebGL() {
    var canvas = document.getElementById("my-canvas");
    initWebGL(canvas);
    shaderProgram = initShaders(gl);
    setEventListeners();
    triangleVertexPositionBuffer = gl.createBuffer();
    triangleVertexColorBuffer = gl.createBuffer();
    initBuffers();
    tick();
}