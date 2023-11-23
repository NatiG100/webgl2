"use strict"

var vertexShaderSource = `#version 300 es
    //an attribute is an input (in) to a vertex shader.
    // It will receive data from a buffer
    in vec4 a_position;

    //all shaders have main function
    void main() {
        //gl_Position is a special variable a vertex shader is responsible for setting
        gl_Position = a_position;
    }
`

var fragmentShaderSource = `#version 300 es
    // fragment shaders don't have a default precision so we
    // need to pick one. highp is a good default. It means "high precision"
    precision highp float;

    // we need to declare an output for the fragment shader
    out vec4 outColor;

    void main() {
        //Just set the output to a constant redish-purple
        outColor = vec4(1,0,0.5,1);
    }
`
function createShader(gl, type, source){
    var shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    var success = gl.getShaderParameter(shader, gl.COMPILE_STATUS);
    if(success){
        return shader;
    }
    console.log(gl.getShaderInfoLog(shader));
    gl.deleteShader(shader);
    return undefined;
}
function createProgram(gl, vertexShader, fragmentShader){
    var program = gl.createProgram();
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);
    var success = gl.getProgramParameter(program, gl.LINK_STATUS);
    if(success){
        return program;
    }

    console.log(gl.getProgramInfoLog(program));
    gl.deleteProgram(program);
    return undefined;
}

function main(){
    var canvas = document.querySelector("#c");
    var gl = canvas.getContext('webgl2');
    if(!gl){
        console.log("can't get wegl2 context")
        return;
    }

    var vertexShader = createShader(gl,gl.VERTEX_SHADER,vertexShaderSource);
    var fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fragmentShaderSource);
    var program = createProgram(gl,vertexShader,fragmentShader);
    var positionAttributeLocation = gl.getAttribLocation(program, "a_position");
    var positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer)
    var position = [
        0,0,
        0,0.5,
        0.7,0.5,
    ];

    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(position), gl.STATIC_DRAW);
    var voa = gl.createVertexArray();
    gl.bindVertexArray(voa);
    gl.enableVertexAttribArray(positionAttributeLocation);
    var size = 2;
    var type = gl.FLOAT;
    var normalize = false;
    var stride = 0;
    var offset = 0;
    gl.vertexAttribPointer(positionAttributeLocation,size,type,normalize,stride,offset);
    gl.viewport(0,0,gl.canvas.width,gl.canvas.height);
    gl.clearColor(0,0,0,0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.useProgram(program);
    gl.bindVertexArray(voa);
    var primitiveType = gl.TRIANGLES;
    var offset = 0;
    var count =3;
    gl.drawArrays(primitiveType,offset,count);
}
main();