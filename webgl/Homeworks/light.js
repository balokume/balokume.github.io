"use strict";

var canvas;
var gl;
var program;

var cameraPos = vec3(0,1,5);

var modelLoc;
var viewLoc;
var projLoc;
var ambientLoc;
var diffuseLoc;
var specularLoc;
var shinessLoc;
var lightLoc;
var isPointLightLoc;

// mesh vertices and normals
var coneVerts = [];
var cylinderVerts = [];
var sphereVerts = [];
var conePos = vec3(0,0,0);
var cylinderPos = vec3(-1.2,0,0);
var spherePos = vec3(1.2,0,0);
var coneNormals = [];
var cylinderNormals = [];
var sphereNormals = [];

// mesh materials
var coneAmbient = vec4(0,1,1,1);
var coneDiffuse = vec4(0.8, 0.6, 0.9);
var coneSpecular = vec4(0.9, 1, 1);
var coneShiness = 200;
var cylinderAmbient = vec4(0,1,1,1);
var cylinderDiffuse = vec4(0.8, 0.6, 0.9);
var cylinderSpecular = vec4(0.9, 1, 1);
var cylinderShiness = 20;
var sphereAmbient = vec4(0,1,1,1);
var sphereDiffuse = vec4(0.8, 0.6, 0.9);
var sphereSpecular = vec4(0.9, 1, 1);
var sphereShiness = 200;

// light properties
var lightPos = [];
var lightAmbient = [];
var lightDiffuse = [];
var lightSpecular = [];

var lightRadius = [10,10];

var lightAlpha = [0,0];
var lightRotate = [true, true];
var objAlpha = 0;
var lightPower = 55;

window.onload = function init()
{
  initCanvas();

  //
  //  Load shaders and initialize attribute buffers
  //
  program = initShaders( gl, "vertex-shader", "fragment-shader" );
  gl.useProgram( program );

  // get shader uniform locations
  modelLoc = gl.getUniformLocation(program, "model");
  viewLoc = gl.getUniformLocation(program, "view");
  projLoc = gl.getUniformLocation(program, "proj");
  ambientLoc = gl.getUniformLocation(program, "ambient");
  diffuseLoc = gl.getUniformLocation(program, "diffuse");
  specularLoc = gl.getUniformLocation(program, "specular");
  shinessLoc = gl.getUniformLocation(program, "shiness");
  lightLoc = gl.getUniformLocation(program, "lightPos");
  isPointLightLoc = gl.getUniformLocation(program, "isPointLight");

  // generate mesh
  generateCone();
  generateCylinder();
  generateSphere();

  // initialize lights
  lightPos.push(vec4(10,0,0,0));
  lightAmbient.push(vec4(0.1,0.2,0.3,1));
  lightDiffuse.push(vec4(0.9,0.2,0.3,1));
  lightSpecular.push(vec4(1,0,0,1));

  lightPos.push(vec4(0,10,0,0));
  lightAmbient.push(vec4(0.0,0.4,0.1,1));
  lightDiffuse.push(vec4(0.4,0.7,1,1));
  lightSpecular.push(vec4(0,1,0,1));

  document.getElementById("switch1").onchange = function(event)
  {
    if((event.srcElement.checked))
    {
      lightAmbient[0] = vec4(0.1,0.2,0.3,1);
      lightDiffuse[0] = vec4(0.9,0.2,0.3,1);
      lightSpecular[0] = vec4(1,0,0,1);
    }
    else {
      lightAmbient[0] = vec4(0.1,0.1,0.1,1);
      lightDiffuse[0] = vec4(0.0,0.0,0.0,1);
      lightSpecular[0] = vec4(0,0,0,1);
    }
  }
  document.getElementById("switch2").onchange = function(event)
  {
    if((event.srcElement.checked))
    {
      lightAmbient[1] = vec4(0.0,0.4,0.1,1);
      lightDiffuse[1] = vec4(0.4,0.7,1,1);
      lightSpecular[1] = vec4(0,1,0,1);
    }
    else {
      lightAmbient[1] = vec4(0.1,0.1,0.1,1);
      lightDiffuse[1] = vec4(0.0,0.0,0.0,1);
      lightSpecular[1] = vec4(0,0,0,1);
    }
  }

  document.getElementById("rotate1").onchange = function(event)
  {
    lightRotate[0] = event.srcElement.checked;
  }
  document.getElementById("rotate2").onchange = function(event)
  {
    lightRotate[1] = event.srcElement.checked;
  }

  document.getElementById("radius1").onchange = function(event)
  {
    lightRadius[0] = event.srcElement.value;
  }
  document.getElementById("radius2").onchange = function(event)
  {
    lightRadius[1] = event.srcElement.value;
  }

  document.getElementById("power").onchange = function(event)
  {
    lightPower = event.srcElement.value;
  }

  render();
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

function generateCone()
{
  // top vertex
  var top = vec3(0,0.5,0);
  // bottom center
  var bottomCenter = vec3(0, -0.5, 0);
  var bottomVerts = [];
  var bottomVertCount = 50;
  for(var i = 0; i < bottomVertCount; i++)
  {
    var theta = Math.PI * 2 / bottomVertCount * i;
    bottomVerts.push(vec3(0.5*Math.cos(theta), -0.5, -0.5*Math.sin(theta)));
  }

  var normals = [];
  // calculate normals
  for(var i = 0; i < bottomVertCount; i++)
  {
    var sideNormal1 = normalize(cross(subtract(bottomVerts[i], top), subtract(bottomVerts[(i+1)%bottomVertCount], top)));
    var sideNormal2 = normalize(cross(subtract(bottomVerts[(i+bottomVertCount-1)%bottomVertCount], top), subtract(bottomVerts[i], top)));
    var bottomNormal1 = normalize(cross(subtract(bottomVerts[(i+1)%bottomVertCount], bottomCenter), subtract(bottomVerts[i], bottomCenter)));
    var bottomNormal2 = normalize(cross(subtract(bottomVerts[i], bottomCenter), subtract(bottomVerts[(i+bottomVertCount-1)%bottomVertCount], bottomCenter)));

    var normal = add(add(add(sideNormal1, sideNormal2), bottomNormal1), bottomNormal2);
    normals.push(normalize(normal));
  }

  // push vertices and normals
  for(var i = 0; i < bottomVertCount; i++)
  {
    coneVerts.push(top);
    coneVerts.push(bottomVerts[i]);
    coneVerts.push(bottomVerts[(i+1)%bottomVertCount]);

    coneVerts.push(bottomCenter);
    coneVerts.push(bottomVerts[(i+1)%bottomVertCount]);
    coneVerts.push(bottomVerts[i]);

    coneNormals.push(vec3(0,1,0));
    coneNormals.push(normals[i]);
    coneNormals.push(normals[(i+1)%bottomVertCount]);

    coneNormals.push(vec3(0,-1,0));
    coneNormals.push(normals[(i+1)%bottomVertCount]);
    coneNormals.push(normals[i]);
  }
}

function generateCylinder()
{
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

  // calculate normals
  var topNormals = [];
  var bottomNormals = [];
  for(var i = 0; i < bottomVertCount; i++)
  {
    var topNormal1 = vec3(0, 1, 0);
    var topNormal2 = vec3(0, 1, 0);
    var bottomNormal1 = vec3(0, -1, 0);
    var bottomNormal2 = vec3(0, -1, 0);
    var sideNormal1 = normalize(cross(subtract(bottomVerts[i], topVerts[i]), subtract(topVerts[(i+1)%bottomVertCount], topVerts[i])));
    var sideNormal2 = normalize(cross(subtract(bottomVerts[(i+bottomVertCount-1)%bottomVertCount], topVerts[i]), subtract(bottomVerts[i], topVerts[i])));

    var topNormal = add(add(add(add(topNormal1, topNormal2), sideNormal1), sideNormal2), sideNormal2);
    topNormals.push(normalize(topNormal));
    var bottomNormal = add(add(add(add(bottomNormal1, bottomNormal2), sideNormal1), sideNormal2), sideNormal1);
    bottomNormals.push(normalize(bottomNormal));
  }

  // push vertices and normals
  for(var i = 0; i < bottomVertCount; i++)
  {
    // vertices
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

    // normals
    cylinderNormals.push(vec3(0,1,0));
    cylinderNormals.push(topNormals[i]);
    cylinderNormals.push(topNormals[(i+1)%bottomVertCount]);

    cylinderNormals.push(vec3(0,-1,0));
    cylinderNormals.push(bottomNormals[i]);
    cylinderNormals.push(bottomNormals[(i+1)%bottomVertCount]);

    cylinderNormals.push(topNormals[i]);
    cylinderNormals.push(bottomNormals[i]);
    cylinderNormals.push(topNormals[(i+1)%bottomVertCount]);

    cylinderNormals.push(topNormals[(i+1)%bottomVertCount]);
    cylinderNormals.push(bottomNormals[i]);
    cylinderNormals.push(bottomNormals[(i+1)%bottomVertCount]);
  }
}

function generateSphere()
{
  // top vertex
  var topCenter = vec3(0,0.5,0);
  var latitudeVerts = [];

  // bottom center
  var bottomCenter = vec3(0, -0.5, 0);

  var latitudeVertCount = 50;
  var longitudeVertCount = 50;
  for(var i = 0; i < latitudeVertCount+1; i++)
  {
    var theta = Math.PI / latitudeVertCount * i;

    for(var j = 0; j < longitudeVertCount; j++)
    {
      var phi = Math.PI * 2 / longitudeVertCount * j;
      latitudeVerts.push(vec3(0.5*Math.sin(theta)*Math.cos(phi),0.5*Math.cos(theta), -0.5*Math.sin(theta)*Math.sin(phi)));
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

function render()
{
  gl.clear( gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  // calculate light positions each frame
  for(var i = 0; i < lightAlpha.length; i++)
  {
    if(lightRotate[i])
      lightAlpha[i] += 0.5 /180 * Math.PI;
  }

  lightPos[0] = vec4(lightRadius[0] * Math.cos(lightAlpha[0]), 0, lightRadius[0] * Math.sin(lightAlpha[0]), 1);
  lightPos[1] = vec4(0, lightRadius[1] * Math.cos(lightAlpha[1]), lightRadius[1] * Math.sin(lightAlpha[1]), 1);

  objAlpha += 1;

  // draw cone
  var vBufferId = gl.createBuffer();
  gl.bindBuffer( gl.ARRAY_BUFFER, vBufferId );
  gl.bufferData( gl.ARRAY_BUFFER, flatten(coneVerts), gl.STATIC_DRAW );

  var vPosition = gl.getAttribLocation( program, "vPosition" );
  gl.vertexAttribPointer( vPosition, 3, gl.FLOAT, false, 0, 0 );
  gl.enableVertexAttribArray( vPosition );

  var nBufferId = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, nBufferId);
  gl.bufferData(gl.ARRAY_BUFFER, flatten(coneNormals), gl.STATIC_DRAW);

  var vNormal = gl.getAttribLocation(program, "vNormal");
  gl.vertexAttribPointer( vNormal, 3, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(vNormal);

  var model = mult(translate(conePos[0], conePos[1], conePos[2]), rotate(objAlpha, vec3(1,0,0)));
  var view = lookAt(cameraPos, vec3(0,0,0), vec3(0,1,0));
  var proj = ortho(-2, 2, -2, 2, -10, 10);

  var ambientProduct = [];
  var diffuseProduct = [];
  var specularProduct = [];
  for(var i = 0; i < lightPos.length; i++)
  {
    ambientProduct.push(mult(coneAmbient, lightAmbient[i]));
    diffuseProduct.push(mult(coneDiffuse, lightDiffuse[i]));
    specularProduct.push(mult(coneSpecular, lightSpecular[i]));
  }

  gl.uniformMatrix4fv(modelLoc, false, flatten(model));
  gl.uniformMatrix4fv(viewLoc, false, flatten(view));
  gl.uniformMatrix4fv(projLoc, false, flatten(proj));

  gl.uniform4fv(ambientLoc, flatten(ambientProduct));
  gl.uniform4fv(diffuseLoc, flatten(diffuseProduct));
  gl.uniform4fv(specularLoc, flatten(specularProduct));
  gl.uniform1f(shinessLoc, coneShiness);
  gl.uniform4fv(lightLoc, flatten(lightPos));
  gl.uniform1fv(isPointLightLoc, flatten([1, 0]));
  gl.uniform1f(gl.getUniformLocation(program, "power"), lightPower);

  gl.drawArrays( gl.TRIANGLES, 0, coneVerts.length );

  // draw cylinder
  gl.bindBuffer( gl.ARRAY_BUFFER, vBufferId );
  gl.bufferData( gl.ARRAY_BUFFER, flatten(cylinderVerts), gl.STATIC_DRAW );

  gl.vertexAttribPointer( vPosition, 3, gl.FLOAT, false, 0, 0 );
  gl.enableVertexAttribArray( vPosition );

  gl.bindBuffer( gl.ARRAY_BUFFER, nBufferId );
  gl.bufferData( gl.ARRAY_BUFFER, flatten(cylinderNormals), gl.STATIC_DRAW );

  gl.vertexAttribPointer( vNormal, 3, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(vNormal);

  model = mult(translate(cylinderPos[0], cylinderPos[1], cylinderPos[2]), rotate(objAlpha, vec3(1,0,0)));

  ambientProduct = [];
  diffuseProduct = [];
  specularProduct = [];
  for(var i = 0; i < lightPos.length; i++)
  {
    ambientProduct.push(mult(cylinderAmbient, lightAmbient[i]));
    diffuseProduct.push(mult(cylinderDiffuse, lightDiffuse[i]));
    specularProduct.push(mult(cylinderSpecular, lightSpecular[i]));
  }

  gl.uniformMatrix4fv(modelLoc, false, flatten(model));
  gl.uniformMatrix4fv(viewLoc, false, flatten(view));
  gl.uniformMatrix4fv(projLoc, false, flatten(proj));

  gl.uniform4fv(ambientLoc, flatten(ambientProduct));
  gl.uniform4fv(diffuseLoc, flatten(diffuseProduct));
  gl.uniform4fv(specularLoc, flatten(specularProduct));
  gl.uniform1f(shinessLoc, cylinderShiness);
  gl.uniform4fv(lightLoc, flatten(lightPos));

  gl.bindBuffer( gl.ARRAY_BUFFER, vBufferId );
  gl.drawArrays( gl.TRIANGLES, 0, cylinderVerts.length );

  // draw sphere
  gl.bindBuffer( gl.ARRAY_BUFFER, vBufferId );
  gl.bufferData( gl.ARRAY_BUFFER, flatten(sphereVerts), gl.STATIC_DRAW );

  gl.vertexAttribPointer( vPosition, 3, gl.FLOAT, false, 0, 0 );
  gl.enableVertexAttribArray( vPosition );

  gl.vertexAttribPointer( vNormal, 3, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(vNormal);

  model = mult(translate(spherePos[0], spherePos[1], spherePos[2]), rotate(objAlpha, vec3(1,0,0)));

  ambientProduct = [];
  diffuseProduct = [];
  specularProduct = [];
  for(var i = 0; i < lightPos.length; i++)
  {
    ambientProduct.push(mult(sphereAmbient, lightAmbient[i]));
    diffuseProduct.push(mult(sphereDiffuse, lightDiffuse[i]));
    specularProduct.push(mult(sphereSpecular, lightSpecular[i]));
  }

  gl.uniformMatrix4fv(modelLoc, false, flatten(model));
  gl.uniformMatrix4fv(viewLoc, false, flatten(view));
  gl.uniformMatrix4fv(projLoc, false, flatten(proj));

  gl.uniform4fv(ambientLoc, flatten(ambientProduct));
  gl.uniform4fv(diffuseLoc, flatten(diffuseProduct));
  gl.uniform4fv(specularLoc, flatten(specularProduct));
  gl.uniform1f(shinessLoc, sphereShiness);
  gl.uniform4fv(lightLoc, flatten(lightPos));

  gl.drawArrays( gl.TRIANGLES, 0, sphereVerts.length );

  requestAnimFrame(render);
}
