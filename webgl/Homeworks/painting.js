"use strict";

var canvas;
var gl;


var mouseDown = false;
var prevPos = null;

var frameTexture;
var frameBuffer;

var texProgram;
var paintProgram;

var texVertBuffer;
var texUVBuffer;
var lineVertBuffer;

window.onload = function init()
{
    canvas = document.getElementById( "gl-canvas" );

    gl = WebGLUtils.setupWebGL( canvas );
    if ( !gl ) { alert( "WebGL isn't available" ); }

    gl.viewport( 0, 0, canvas.width, canvas.height );
    gl.clearColor( 1.0, 1.0, 1.0, 1.0 );

    gl.enable(gl.DEPTH_TEST);

    //
    //  Load shaders and initialize attribute buffers
    //
    texProgram = initShaders( gl, "texture-vertex-shader", "texture-fragment-shader" );
    paintProgram = initShaders( gl, "paint-vertex-shader", "paint-fragment-shader" );

    createFrameBuffer();

    lineVertBuffer = gl.createBuffer();

    //event listeners for slider

    document.getElementById( "slider" ).onchange = function (event) {
        console.log(event.srcElement.value);
    };

    canvas.addEventListener("mousedown", onMouseDown);
    canvas.addEventListener("mousemove", onMouseMove);
    canvas.addEventListener("mouseup", onMouseUp);
}

function createFrameBuffer()
{
  // setup texture
  frameTexture = createTexture();
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, canvas.width, canvas.height, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);

  // setup frame buffer
  frameBuffer = gl.createFramebuffer();
  gl.bindFramebuffer(gl.FRAMEBUFFER, frameBuffer)
  gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, frameTexture, 0);

  // setup buffer data
  texVertBuffer = gl.createBuffer();
  gl.bindBuffer( gl.ARRAY_BUFFER, texVertBuffer );

  var points = [vec2(-1,-1),vec2(1,-1),vec2(1,1),vec2(-1,1)];
  gl.bufferData( gl.ARRAY_BUFFER, flatten(points), gl.STATIC_DRAW );


  texUVBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, texUVBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
    0.0, 0.0,
    1.0, 0.0,
    1.0, 1.0,
    0.0, 1.0
  ]), gl.STATIC_DRAW);
}

function drawToBuffer()
{
  gl.bindFramebuffer(gl.FRAMEBUFFER, frameBuffer);
  gl.viewport( 0, 0, canvas.width, canvas.height );

  gl.useProgram( paintProgram );

  gl.bindBuffer(gl.ARRAY_BUFFER, lineVertBuffer);

  var vPosition = gl.getAttribLocation( paintProgram, "vPosition" );
  gl.vertexAttribPointer( vPosition, 2, gl.FLOAT, false, 0, 0 );
  gl.enableVertexAttribArray( vPosition );

  var vColor = gl.getAttribLocation( paintProgram, "vColor" );
  gl.vertexAttribPointer( vColor, 2, gl.FLOAT, false, 0, 0 );
  gl.enableVertexAttribArray( vColor );

  gl.drawArrays(gl.LINES, 0, 2);
}

function drawToCanvas()
{
  gl.bindFramebuffer(gl.FRAMEBUFFER, null);
  gl.viewport( 0, 0, canvas.width, canvas.height );

  gl.useProgram( texProgram );

  gl.bindBuffer(gl.ARRAY_BUFFER, texVertBuffer);

  var vPosition = gl.getAttribLocation( paintProgram, "vPosition" );
  gl.vertexAttribPointer( vPosition, 2, gl.FLOAT, false, 0, 0 );
  gl.enableVertexAttribArray( vPosition );

  gl.bindBuffer(gl.ARRAY_BUFFER, texUVBuffer);

  var vTexCoord = gl.getAttribLocation(texProgram, "vTexCoord");
  gl.enableVertexAttribArray(vTexCoord);
  gl.vertexAttribPointer(vTexCoord, 2, gl.FLOAT, false, 0, 0);

  gl.activeTexture(gl.TEXTURE0);
  gl.bindTexture(gl.TEXTURE_2D, frameTexture);
  gl.uniform1i(gl.getUniformLocation(texProgram, "tex"), 0);

  gl.drawArrays( gl.TRIANGLE_FAN, 0, 4 );
}

function createTexture()
{
  var texture = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
  return texture;
}

function onMouseDown(event)
{
  mouseDown = true;

  prevPos = getMousePosition(event);
}

function onMouseMove(event)
{
  if(!mouseDown)
    return;

  var curPos = getMousePosition(event);
  drawLine(curPos);
  prevPos = curPos;
}

function onMouseUp()
{
  mouseDown = false;
}

function getMousePosition(event)
{
  var rect = canvas.getBoundingClientRect();
  var mouseX = event.clientX - rect.left;
  var clipX = mouseX / rect.width * 2 - 1;
  var mouseY = event.clientY - rect.top;
  var clipY = (rect.height - mouseY) / rect.height * 2 - 1;
  return vec2(clipX, clipY);
}

function drawLine(curPos)
{
  gl.bindBuffer(gl.ARRAY_BUFFER, lineVertBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, flatten([prevPos, curPos]), gl.STATIC_DRAW);

  drawToBuffer();
  drawToCanvas();
}
