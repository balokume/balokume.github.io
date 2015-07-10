"use strict";

var canvas;
var gl;
var vBufferId;

var numTimesToSubdivide = 0;

var points = [];

window.onload = function init()
{
    canvas = document.getElementById( "gl-canvas" );

    gl = WebGLUtils.setupWebGL( canvas );
    if ( !gl ) { alert( "WebGL isn't available" ); }

    gl.viewport( 0, 0, canvas.width, canvas.height );
    gl.clearColor( 1.0, 1.0, 1.0, 1.0 );
    
    points = [vec2(-1, -1), vec2(0,1), vec2(1,-1)];

    gl.enable(gl.DEPTH_TEST);

    //
    //  Load shaders and initialize attribute buffers
    //
    var program = initShaders( gl, "vertex-shader", "fragment-shader" );
    gl.useProgram( program );

    vBufferId = gl.createBuffer();
    gl.bindBuffer( gl.ARRAY_BUFFER, vBufferId );
    //gl.bufferData( gl.ARRAY_BUFFER, flatten(points), gl.STATIC_DRAW );

    var vPosition = gl.getAttribLocation( program, "vPosition" );
    gl.vertexAttribPointer( vPosition, 2, gl.FLOAT, false, 0, 0 );
    gl.enableVertexAttribArray( vPosition );
    
    var thetaLoc = gl.getUniformLocation(program, "theta");
    gl.uniform1f(thetaLoc, 30);

    //event listeners for slider

    document.getElementById( "slider" ).onchange = function () {
        numTimesToSubdivide = event.srcElement.value;
        render();
    };

    render();
}

function generateVertices()
{
    points = [];
    var vertices = [vec2(-0.5, -0.5), vec2(0,0.5), vec2(0.5,-0.5)];
    subDivide(vertices[0], vertices[1], vertices[2], numTimesToSubdivide);
}

function subDivide(a, b, c, iterations)
{
    points.push(a);
    points.push(b);
    points.push(c);
    
    if(iterations == 0)
        return;
        
    iterations--;
    var ab = mix(a, b, 0.5);
    var ac = mix(a, c, 0.5);
    var bc = mix(b, c, 0.5);
    subDivide(a, ab, ac, iterations);
    subDivide(ab, b, c, iterations);
    subDivide(ac, bc, c, iterations);
    subDivide(bc, ac, ab, iterations);
}

function render()
{
    gl.clear( gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    generateVertices();
    
    gl.bufferData( gl.ARRAY_BUFFER, flatten(points), gl.STATIC_DRAW );

    gl.drawArrays( gl.TRIANGLES, 0, points.length );
}
