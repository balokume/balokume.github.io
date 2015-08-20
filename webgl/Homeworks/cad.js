"use strict";

var canvas;
var gl;

var cameraPos = vec3(0,0,5);

var mvpLoc;
var colorLoc;

var objects = [];
var matrices = [];
var curObjIndex = -1;
var pos = vec3(0,0,0);
var rot = vec3(0,0,0);
var sca = vec3(1,1,1);

window.onload = function init()
{
  initCanvas();

  //
  //  Load shaders and initialize attribute buffers
  //
  var program = initShaders( gl, "vertex-shader", "fragment-shader" );
  gl.useProgram( program );

  var vBufferId = gl.createBuffer();
  gl.bindBuffer( gl.ARRAY_BUFFER, vBufferId );

  var vPosition = gl.getAttribLocation( program, "vPosition" );
  gl.vertexAttribPointer( vPosition, 3, gl.FLOAT, false, 0, 0 );
  gl.enableVertexAttribArray( vPosition );

  mvpLoc = gl.getUniformLocation(program, "mvp");
  colorLoc = gl.getUniformLocation(program, "color");

  render();

  // place ojbects
  document.getElementById("cone").onclick = function(){
    resetTransform();
    generateCone();
    render();
  }
  document.getElementById("cylinder").onclick = function(){
    resetTransform();
    generateCylinder();
    render();
  }
  document.getElementById("sphere").onclick = function(){
    resetTransform();
    generateSphere();
    render();
  }

  // change transform
  // position
  document.getElementById("pxminus").onclick = function(){
    pos[0] -= 0.1;
    calcMVP();
    render();
  }
  document.getElementById("pxplus").onclick = function(){
    pos[0] += 0.1;
    calcMVP();
    render();
  }
  document.getElementById("pyminus").onclick = function(){
    pos[1] -= 0.1;
    calcMVP();
    render();
  }
  document.getElementById("pyplus").onclick = function(){
    pos[1] += 0.1;
    calcMVP();
    render();
  }
  document.getElementById("pzminus").onclick = function(){
    pos[2] -= 0.1;
    calcMVP();
    render();
  }
  document.getElementById("pzplus").onclick = function(){
    pos[2] += 0.1;
    calcMVP();
    render();
  }
  // rotation
  document.getElementById("rxminus").onclick = function(){
    rot[0] -= 5;
    calcMVP();
    render();
  }
  document.getElementById("rxplus").onclick = function(){
    rot[0] += 5;
    calcMVP();
    render();
  }
  document.getElementById("ryminus").onclick = function(){
    rot[1] -= 5;
    calcMVP();
    render();
  }
  document.getElementById("ryplus").onclick = function(){
    rot[1] += 5;
    calcMVP();
    render();
  }
  document.getElementById("rzminus").onclick = function(){
    rot[2] -= 5;
    calcMVP();
    render();
  }
  document.getElementById("rzplus").onclick = function(){
    rot[2] += 5;
    calcMVP();
    render();
  }
  // scale
  document.getElementById("sxminus").onclick = function(){
    sca[0] -= 0.1;
    calcMVP();
    render();
  }
  document.getElementById("sxplus").onclick = function(){
    sca[0] += 0.1;
    calcMVP();
    render();
  }
  document.getElementById("syminus").onclick = function(){
    sca[1] -= 0.1;
    calcMVP();
    render();
  }
  document.getElementById("syplus").onclick = function(){
    sca[1] += 0.1;
    calcMVP();
    render();
  }
  document.getElementById("szminus").onclick = function(){
    sca[2] -= 0.1;
    calcMVP();
    render();
  }
  document.getElementById("szplus").onclick = function(){
    sca[2] += 0.1;
    calcMVP();
    render();
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
  gl.enable(gl.POLYGON_OFFSET_FILL);
  gl.polygonOffset(1.0,2.0);
}

function generateCone()
{
  var coneVerts = [];
  // top vertex
  var top = vec3(0,0.5,0);
  // bottom center
  var bottomCenter = vec3(0, -0.5, 0);
  var bottomVerts = [];
  var bottomVertCount = 50;
  for(var i = 0; i < bottomVertCount; i++)
  {
    var theta = Math.PI * 2 / bottomVertCount * i;
    bottomVerts.push(vec3(0.5*Math.cos(theta), -0.5, 0.5*Math.sin(theta)));
  }

  // push vertices
  for(var i = 0; i < bottomVertCount; i++)
  {
    coneVerts.push(top);
    coneVerts.push(bottomVerts[i]);
    coneVerts.push(bottomVerts[(i+1)%bottomVertCount]);

    coneVerts.push(bottomCenter);
    coneVerts.push(bottomVerts[i]);
    coneVerts.push(bottomVerts[(i+1)%bottomVertCount]);
  }

  objects.push(coneVerts);
  matrices.push(mat4());
  curObjIndex++;
  calcMVP();
}

function generateCylinder()
{
  var cylinderVerts = [];
  // top vertex
  var topCenter = vec3(0,0.5,0);
  var topVerts = [];

  // bottom center
  var bottomCenter = vec3(0, -0.5, 0);
  var bottomVerts = [];
  var bottomVertCount = 50;
  for(var i = 0; i < bottomVertCount; i++)
  {
    var theta = Math.PI * 2 / bottomVertCount * i;
    topVerts.push(vec3(0.5*Math.cos(theta), 0.5, -0.5*Math.sin(theta)));
    bottomVerts.push(vec3(0.5*Math.cos(theta), -0.5, -0.5*Math.sin(theta)));
  }

  // push vertices
  for(var i = 0; i < bottomVertCount; i++)
  {
    cylinderVerts.push(topCenter);
    cylinderVerts.push(topVerts[i]);
    cylinderVerts.push(topVerts[(i+1)%bottomVertCount]);

    cylinderVerts.push(bottomCenter);
    cylinderVerts.push(bottomVerts[i]);
    cylinderVerts.push(bottomVerts[(i+1)%bottomVertCount]);

    cylinderVerts.push(topVerts[i]);
    cylinderVerts.push(bottomVerts[i]);
    cylinderVerts.push(topVerts[(i+1)%bottomVertCount]);

    cylinderVerts.push(topVerts[(i+1)%bottomVertCount]);
    cylinderVerts.push(bottomVerts[i]);
    cylinderVerts.push(bottomVerts[(i+1)%bottomVertCount]);
  }

  objects.push(cylinderVerts);
  matrices.push(mat4());
  curObjIndex++;
  calcMVP();
}

function generateSphere()
{
  var sphereVerts = [];
  // top vertex
  var topCenter = vec3(0,0.5,0);
  var latitudeVerts = [];

  // bottom center
  var bottomCenter = vec3(0, -0.5, 0);

  var latitudeVertCount = 50;
  var longitudeVertCount = 50;
  for(var i = 0; i < latitudeVertCount; i++)
  {
    var theta = Math.PI / latitudeVertCount * i;

    for(var j = 0; j < longitudeVertCount; j++)
    {
      var phi = Math.PI * 2 / longitudeVertCount * j;
      latitudeVerts.push(vec3(0.5*Math.sin(theta)*Math.cos(phi),0.5*Math.cos(theta), -0.5*Math.sin(theta)*Math.sin(phi)));
    }
  }

  for(var i = 0; i < latitudeVertCount-1; i++)
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

  objects.push(sphereVerts);
  matrices.push(mat4());
  curObjIndex++;
  calcMVP();
}

function resetTransform()
{
  pos = vec3(0,0,0);
  rot = vec3(0,0,0);
  sca = vec3(1,1,1);
}

function calcMVP()
{
  var tMat = translate(pos[0],pos[1],pos[2]);
  var rMat = mult(rotate(rot[2], vec3(0,0,1)),
    mult(rotate(rot[1], vec3(0,1,0)), rotate(rot[0], vec3(1,0,0))));
  var sMat = scale(sca[0], sca[1], sca[2]);

  var model = mult(tMat, mult(rMat, sMat));
  var view = lookAt(cameraPos, vec3(0,0,0), vec3(0,1,0));
  //var proj = perspective(60, 1, 0.1, 100);
   var proj = ortho(-2, 2, -2, 2, -10, 10);

  var mvp = mult(proj, mult(view, model));

  matrices[curObjIndex] = mvp;
}

function render()
{
  gl.clear( gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  for(var i = 0; i < objects.length; i++)
  {
    gl.bufferData( gl.ARRAY_BUFFER, flatten(objects[i]), gl.STATIC_DRAW );
    gl.uniformMatrix4fv(mvpLoc, false, flatten(matrices[i]));
    gl.uniform4f(colorLoc, 1,0,0,1);
    gl.drawArrays( gl.TRIANGLES, 0, objects[i].length );
    gl.uniform4f(colorLoc, 0,0,0,1);
    gl.drawArrays( gl.LINE_STRIP, 0, objects[i].length );
  }
}
