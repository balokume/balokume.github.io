"use strict";

var canvas;
var gl;
var program;

var cameraPos = vec3(0,0,3);

// mesh vertices and normals
var sphereVerts = [];
var sphereNormals = [];

// light properties
var lightPos = vec4(0,0,5,0);
var lightAmbient = vec4(0.1,0.2,0.3,1);
var lightDiffuse = vec4(0.9,0.2,0.3,1);
var lightSpecular = vec4(1,0,0,1);
var shininess = 200;

var lightPower = 55;

var texture;

var rot = vec3(0,0,0);

var chessImg;
var gifImg;

window.onload = function init()
{
  initCanvas();

  //
  //  Load shaders and initialize attribute buffers
  //
  program = initShaders( gl, "vertex-shader", "fragment-shader" );
  gl.useProgram( program );

  gifImg = new Image();
  gifImg.src = 'pic.gif';
  gifImg.onload = function ()
  {
  };

  // generate mesh
  generateSphere();

  createChessImage();
  createTexture();
  drawChessTexture();

  // rotation
  document.getElementById("rx").onchange = function(event){
    rot[0] = event.srcElement.value;
    render();
  }
  document.getElementById("ry").onchange = function(event){
    rot[1] = event.srcElement.value;
    render();
  }
  document.getElementById("rz").onchange = function(event){
    rot[2] = event.srcElement.value;
    render();
  }

  document.getElementById("texSelect").onclick = function(event){
    switch(event.target.index)
    {
      case 0: drawChessTexture();
      break;
      case 1: drawGifTexture();
      break;
    }
  }

  document.getElementById("uvSelect").onclick = function(event){
    switch(event.target.index)
    {
      case 0: gl.uniform1f(gl.getUniformLocation(program, "uvType"), 0.0);
      render();
      break;
      case 1: gl.uniform1f(gl.getUniformLocation(program, "uvType"), 1.0);
      render();
      break;
    }
  }
}

function initCanvas()
{
  canvas = document.getElementById( "gl-canvas" );

  gl = WebGLUtils.setupWebGL( canvas );
  if ( !gl ) { alert( "WebGL isn't available" ); }

  gl.viewport( 0, 0, canvas.width, canvas.height );
  gl.clearColor( 0.0, 1.0, 1.0, 1.0 );

  gl.enable(gl.DEPTH_TEST);
}

function generateSphere()
{
  // top vertex
  var topCenter = vec3(0,1,0);
  var latitudeVerts = [];

  // bottom center
  var bottomCenter = vec3(0, -1, 0);

  var latitudeVertCount = 50;
  var longitudeVertCount = 50;
  for(var i = 0; i < latitudeVertCount+1; i++)
  {
    var theta = Math.PI / latitudeVertCount * i;

    for(var j = 0; j < longitudeVertCount; j++)
    {
      var phi = Math.PI * 2 / longitudeVertCount * j;
      latitudeVerts.push(vec3(1*Math.sin(theta)*Math.cos(phi),1*Math.cos(theta), -1*Math.sin(theta)*Math.sin(phi)));
    }
  }

  for(var i = 0; i < latitudeVertCount; i++)
  {
    for(var j = 0; j < longitudeVertCount; j++)
    {
      sphereVerts.push(latitudeVerts[i*longitudeVertCount+j]);
      sphereVerts.push(latitudeVerts[(i+1)*longitudeVertCount+j]);
      sphereVerts.push(latitudeVerts[(i+1)*longitudeVertCount+(j+1)%longitudeVertCount]);

      sphereVerts.push(latitudeVerts[(i+1)*longitudeVertCount+(j+1)%longitudeVertCount]);
      sphereVerts.push(latitudeVerts[i*longitudeVertCount+(j+1)%longitudeVertCount]);
      sphereVerts.push(latitudeVerts[i*longitudeVertCount+j]);
    }
  }
}

function createChessImage()
{
  chessImg = new Uint8Array(8*128*128);
  for(var i = 0; i < 128; i++)
  {
    for(var j = 0; j < 128; j++)
    {
      var c = (((i & 0x8) == 0) ^ ((j & 0x8)  == 0));
      for(var k =0; k<4; k++)
        chessImg[4*128*i+4*j+k] = 255*c;
    }
  }
}

function drawChessTexture()
{
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 128, 128, 0, gl.RGBA, gl.UNSIGNED_BYTE, chessImg);
  render();
}

function drawGifTexture()
{
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB,  gl.RGB, gl.UNSIGNED_BYTE, gifImg);
  render();
}

function createTexture()
{
  if(texture == null)
  {
    texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
    //gl.generateMipmap(gl.TEXTURE_2D);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
  }
}

function render()
{
  gl.clear( gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  // draw sphere
  var vBufferId = gl.createBuffer();
  gl.bindBuffer( gl.ARRAY_BUFFER, vBufferId );
  gl.bufferData( gl.ARRAY_BUFFER, flatten(sphereVerts), gl.STATIC_DRAW );

  var vPosition = gl.getAttribLocation( program, "vPosition" );
  gl.vertexAttribPointer( vPosition, 3, gl.FLOAT, false, 0, 0 );
  gl.enableVertexAttribArray( vPosition );

  var vNormal = gl.getAttribLocation(program, "vNormal");
  gl.vertexAttribPointer( vNormal, 3, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(vNormal);

  var model = mult(rotate(rot[2], vec3(0,0,1)),
    mult(rotate(rot[1], vec3(0,1,0)), rotate(rot[0], vec3(1,0,0))));
  var view = lookAt(cameraPos, vec3(0,0,0), vec3(0,1,0));
  //var proj = ortho(-2, 2, -2, 2, -10, 10);
  var proj = perspective(60, 1, 0.1, 100);

  gl.uniformMatrix4fv(gl.getUniformLocation(program, "model"), false, flatten(model));
  gl.uniformMatrix4fv(gl.getUniformLocation(program, "view"), false, flatten(view));
  gl.uniformMatrix4fv(gl.getUniformLocation(program, "proj"), false, flatten(proj));

  gl.uniform4fv(gl.getUniformLocation(program, "ambient"), flatten(lightAmbient));
  gl.uniform4fv(gl.getUniformLocation(program, "diffuse"), flatten(lightDiffuse));
  gl.uniform4fv(gl.getUniformLocation(program, "specular"), flatten(lightSpecular));
  gl.uniform1f(gl.getUniformLocation(program, "shininess"), shininess);
  gl.uniform4fv(gl.getUniformLocation(program, "lightLoc"), flatten(lightPos));
  gl.uniform1f(gl.getUniformLocation(program, "power"), lightPower);

  // set texture
  gl.uniform1i(gl.getUniformLocation(program, "texture"), 0);

  gl.drawArrays( gl.TRIANGLES, 0, sphereVerts.length );
  //requestAnimFrame(render);
}
