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

var color = vec3(0,0,0);

var lineWidth = 2;
var prevC;
var prevB;

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

    //event listeners
    document.getElementById("colorpicker").onchange = function()
    {
      color = hexToRgb(event.srcElement.value);
    }
    document.getElementById("width").onchange = function()
    {
      lineWidth = event.srcElement.value;
    }

    canvas.addEventListener("mousedown", onMouseDown);
    canvas.addEventListener("mousemove", onMouseMove);
    canvas.addEventListener("mouseup", onMouseUp);
}

function hexToRgb(hex) {
    hex = hex.replace(/[^0-9A-F]/gi, '');
    var bigint = parseInt(hex, 16);

    var r = (bigint >> 16) & 255;
    var g = (bigint >> 8) & 255;
    var b = bigint & 255;

    return vec3(r/255,g/255,b/255);
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

  var vColor = gl.getUniformLocation( paintProgram, "color" );
  gl.uniform3fv(vColor, flatten(color));

  //gl.drawArrays(gl.LINES, 0, 2);
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
  //drawLine(curPos);
  drawPolygen(curPos);

  prevPos = curPos;
  prevB = b;
  prevC = c;
}

function onMouseUp()
{
  mouseDown = false;
  prevC = null;
  prevB = null;
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
  gl.drawArrays(gl.LINES, 0, 2);

  drawToCanvas();
}

function drawPolygen(curPos)
{
  var line = subtract(curPos, prevPos);
  var len = length(line);
  if(len == 0)
    return;
  var cos = line[0] / len;
  var sin = line[1] / len;

  /*************
  d----c
  |    |
  a----b
  *************/
  var a = vec2(0, -lineWidth/2/canvas.height);
  var b = vec2(len, -lineWidth/2/canvas.height);
  var c = vec2(len, lineWidth/2/canvas.height);
  var d = vec2(0, lineWidth/2/canvas.height);

  var rot = [
       [cos, -sin] ,
       [sin, cos]
  ];

  // rotate
  a = mul(rot, a);
  b = mul(rot, b);
  c = mul(rot, c);
  d = mul(rot, d);

  // translate
  a = add(a, prevPos);
  b = add(b, prevPos);
  c = add(c, prevPos);
  d = add(d, prevPos);

  // build polygen
  var points = [];
  if(prevC != null)
  {
    points.push(prevB);
    points.push(a);
    points.push(d);
    points.push(d);
    points.push(prevC);
    points.push(prevB);
  }
  points.push(a);
  points.push(b);
  points.push(c);
  points.push(c);
  points.push(d);
  points.push(a);

  gl.bindBuffer(gl.ARRAY_BUFFER, lineVertBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, flatten(points), gl.STATIC_DRAW);

  drawToBuffer();
  gl.drawArrays(gl.TRIANGLES, 0, points.length);

  drawToCanvas();
}

function mul(m, v)
{
  var res = vec2(
    m[0][0] * v[0] + m[0][1] * v[1],
    m[1][0] * v[0] + m[1][1] * v[1]);
  return res;
}
