var gl;
var glprog;
var glmat;
var glmatnew;

var FLOATS = Float32Array.BYTES_PER_ELEMENT;

// obtains a WebGL context by a given canvas id
function getContext(id_canvas)
{
	var canvas = document.getElementById(id_canvas);
	if (!canvas)
	{
		alert(`Cannot obtain a canvas with id=${id}..`);
		return null;
	}

	var context = canvas.getContext("webgl");
	if (!context)
	{
		context = canvas.getContext("experimental-webgl");
	}

	if (!context)
	{
		alert("Error, while obtaining WebGL context..");
	}

	return context;
}


// obtains a compiled shader
function getShader(id,type)
{
	var source = document.getElementById(id).text;
	var shader = gl.createShader(type);

	gl.shaderSource(shader,source);
	gl.compileShader(shader);
	if (!gl.getShaderParameter(shader,gl.COMPILE_STATUS))
	{
		alert(gl.getShaderInfoLog(shader));
		return null;
	}

	return shader;
}


// obtains a shader program
function getProgram(idv,idf)
{
	var vShader = getShader(idv,gl.VERTEX_SHADER);
	var fShader = getShader(idf,gl.FRAGMENT_SHADER);

	if (!vShader || !fShader) {return null;}

	var shaderProgram = gl.createProgram();
	gl.attachShader(shaderProgram,vShader);
	gl.attachShader(shaderProgram,fShader);
	gl.linkProgram(shaderProgram);

	if (!gl.getProgramParameter(shaderProgram,gl.LINK_STATUS))
	{
		alert(gl.getProgramInfoLog(shaderProgram));
		return null;
	}

	gl.useProgram(shaderProgram);
	return shaderProgram;
}

// to radians function
function radians(degrees)
{
	return degrees*Math.PI/180;
}

// obataining a unit vector
function unitVector(x)
{
	var len = 1/Math.sqrt( x[0]*x[0]+x[1]*x[1]+x[2]*x[2] );
	return [ len*x[0], len*x[1], len*x[2] ];
}

// obtaining a perspective matrix
function perspMatrix(angle, aspect, near, far)
{
	var fov = 1/Math.tan(radians(angle)/2);
	var matrix = [
		fov/aspect, 0, 0, 0,
		0, fov, 0, 0,
		0, 0, (far+near)/(near-far), -1,
		0, 0, 2.0*near*far/(near-far), 0];
	return new Float32Array(matrix);
}

function vectorProduct(x,y)
{
	return [
		x[1]*y[2]-x[2]*y[1],
		x[2]*y[0]-x[0]*y[2],
		x[0]*y[1]-x[1]*y[0] ];
}

function scalarProduct(x,y)
{
	return x[0]*y[0] + x[1]*y[1] + x[2]*y[2];
}

function vectorPoints(x,y)
{
	return [ x[0]-y[0], x[1]-y[1], x[2]-y[2] ];
}

function viewMatrix (eye, focus, up)
{
	var z = unitVector(vectorPoints(eye,focus));
	var x = unitVector(vectorProduct(up,z));
	var y = unitVector(vectorProduct(z,x));

	var matrix = [
		x[0], y[0], z[0], 0,
		x[1], y[1], z[1], 0,
		x[2], y[2], z[2], 0,
		-scalarProduct(x,eye),
		-scalarProduct(y,eye),
		-scalarProduct(z,eye), 1 ];
	return new Float32Array(matrix);
};

// зарежда единичната матрица в матрицата на модела
function identity()
{
	glmatnew = true;
	glmat = new Float32Array( [1,0,0,0, 0,1,0,0, 0,0,1,0, 0,0,0,1] );
}

// добавя транслация към матрицата на модела
function translate(v)
{
	glmatnew = true;
	glmat[12] += glmat[0]*v[0]+glmat[4]*v[1]+glmat[8]*v[2];
	glmat[13] += glmat[1]*v[0]+glmat[5]*v[1]+glmat[9]*v[2];
	glmat[14] += glmat[2]*v[0]+glmat[6]*v[1]+glmat[10]*v[2];
}

// добавя мащабиране към матрицата на модела
function scale(v)
{
	glmatnew = true;
	glmat[0] *= v[0];
	glmat[1] *= v[0];
	glmat[2] *= v[0];

	glmat[4] *= v[1];
	glmat[5] *= v[1];
	glmat[6] *= v[1];

	glmat[8] *= v[2];
	glmat[9] *= v[2];
	glmat[10] *= v[2];
}


// ако матрицата на модела е променена, изпраща я към шейдъра
function useMatrix()
{
	if (glmatnew)
	{
		glmatnew = false;
		gl.uniformMatrix4fv(uModelMatrix,false,glmat);
	}
}

// добавя въртене около Z към матрицата на модела
function zRotate(a)
{
	glmatnew = true;

	a = radians(a);
	var s = Math.sin(a);
	var c = Math.cos(a);

	a = glmat[0]*s+glmat[4]*c;
	glmat[0]=glmat[0]*c-glmat[4]*s;
	glmat[4]=a;

	a = glmat[1]*s+glmat[5]*c;
	glmat[1]=glmat[1]*c-glmat[5]*s;
	glmat[5]=a;

	a = glmat[2]*s+glmat[6]*c;
	glmat[2]=glmat[2]*c-glmat[6]*s;
	glmat[6]=a;
}
