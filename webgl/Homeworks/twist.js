"use strict";

var canvas;
var gl;
var thetaLoc;

var numVertices = 3;
var numTimesToSubdivide = 0;
var angle = 0;

var points = [];

window.onload = function init()
{
    canvas = document.getElementById( "gl-canvas" );

    gl = WebGLUtils.setupWebGL( canvas );
    if ( !gl ) { alert( "WebGL isn't available" ); }

    gl.viewport( 0, 0, canvas.width, canvas.height );
    gl.clearColor( 1.0, 1.0, 1.0, 1.0 );

    generateVertices();

    gl.enable(gl.DEPTH_TEST);

    //
    //  Load shaders and initialize attribute buffers
    //
    var program = initShaders( gl, "vertex-shader", "fragment-shader" );
    gl.useProgram( program );

    var vBufferId = gl.createBuffer();
    gl.bindBuffer( gl.ARRAY_BUFFER, vBufferId );

    var vPosition = gl.getAttribLocation( program, "vPosition" );
    gl.vertexAttribPointer( vPosition, 2, gl.FLOAT, false, 0, 0 );
    gl.enableVertexAttribArray( vPosition );

    thetaLoc = gl.getUniformLocation(program, "theta");

    //event listeners for slider
    document.getElementById( "vertices" ).onchange = function () {
      numVertices = event.srcElement.value;
      generateVertices();
      render();
    };

    document.getElementById( "steps" ).onchange = function () {
      numTimesToSubdivide = event.srcElement.value;
      generateVertices();
      render();
    };

    document.getElementById( "angle" ).onchange = function () {
        angle = event.srcElement.value;
        render();
    };

    render();
}

function generateVertices()
{
    points = [];

    var vertices = [vec2(0,0)];
    var theta = Math.PI*2 / numVertices;
    for(var i = 0; i < numVertices; i++)
    {
      vertices.push(vec2(0.5*Math.cos(theta * i), 0.5*Math.sin(theta * i)));
    }
    for(var i = 1; i < vertices.length; i++)
    {
      subDivide(vertices[0], vertices[i], vertices[i%(vertices.length-1)+1], numTimesToSubdivide);
    }
}

function subDivide(a, b, c, iterations)
{
    if(iterations == 0)
    {
      points.push(a);
      points.push(b);
      points.push(c);
      return;
    }

    iterations--;
    var ab = mix(a, b, 0.5);
    var ac = mix(a, c, 0.5);
    var bc = mix(b, c, 0.5);
    subDivide(a, ab, ac, iterations);
    subDivide(ab, b, bc, iterations);
    subDivide(ac, bc, c, iterations);
    subDivide(bc, ac, ab, iterations);
}

function render()
{
    gl.clear( gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    // angle+=1;
    gl.uniform1f(thetaLoc, angle);
    gl.bufferData( gl.ARRAY_BUFFER, flatten(points), gl.STATIC_DRAW );

    gl.drawArrays( gl.TRIANGLES, 0, points.length );

    // requestAnimFrame(render);
}
