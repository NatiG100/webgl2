"use strict"

var vertexShaderSource = `#version 300 es
    //an attribute is an input (in) to a vertex shader.
    // It will receive data from a buffer
    in vec2 a_position;
    uniform vec2 u_resolution;

    //all shaders have main function
    void main() {
        //convert the position from pixeles to 0.0 to 1.0
        vec2 zeroToOne = a_position/u_resolution;

        //convert from 0-1 to 0->2
        vec2 zeroToTwo = zeroToOne * 2.0;

        //convert fom 0->2 to -1 to 1(clip space)
        vec2 clipSpace = zeroToTwo - 1.0;
        gl_Position = vec4(clipSpace*vec2(1,-1),0,1);
    }
`

var fragmentShaderSource = `#version 300 es
    // fragment shaders don't have a default precision so we
    // need to pick one. highp is a good default. It means "high precision"
    precision highp float;

    uniform vec4 u_color;

    // we need to declare an output for the fragment shader
    out vec4 outColor;

    void main() {
        //Just set the output to a constant redish-purple
        outColor = u_color;
    }
`


function randomInt(range){
    return Math.floor(Math.random()*range);
}

function setRectangle(gl, x,y,width,height){
    var x1 = x;
    var x2 = x + width;
    var y1 = y;
    var y2 = y + height;
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
        x1,y1,
        x2,y1,
        x1,y2,
        x1,y2,
        x2,y1,
        x2,y2,
    ]), gl.STATIC_DRAW);
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
    var resolutionUnifomLocation = gl.getUniformLocation(program,"u_resolution");
    var colorLocation = gl.getUniformLocation(program, "u_color");
    
    var positionBuffer = gl.createBuffer();
    var voa = gl.createVertexArray();
    gl.bindVertexArray(voa);
    gl.enableVertexAttribArray(positionAttributeLocation);
    gl.bindBuffer(gl.ARRAY_BUFFER,positionBuffer);
    var size = 2;
    var type = gl.FLOAT;
    var normalize = false;
    var stride = 0;
    var offset = 0;
    gl.vertexAttribPointer(positionAttributeLocation,size,type,normalize,stride,offset);
    webglUtils.resizeCanvasToDisplaySize(gl.canvas);
    gl.viewport(0,0,gl.canvas.width,gl.canvas.height);
    gl.clearColor(0,0,0,0);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.useProgram(program);
    // Pass in the canvas resolution so we can convert from
    // pixels to clip space in the shader
    gl.uniform2f(resolutionUnifomLocation, gl.canvas.width, gl.canvas.height);
    for(var ii=0;ii<50; ++ii){
        // setup a random rectangle
        setRectangle(gl, randomInt(300),randomInt(300),randomInt(300),randomInt(300));
        gl.uniform4f(colorLocation,Math.random(), Math.random(),Math.random(),1);
        
        var primitiveType = gl.TRIANGLES;
        var offset = 0;
        var count = 6;
        gl.drawArrays(primitiveType,offset,count);
    }
}
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
main();