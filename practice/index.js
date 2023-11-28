"use strict"
var vertexShaderSource = `#version 300 es
    in vec4 a_position;

    uniform mat4 u_matrix;
    out float f_mix_amount;
    void main(){
        gl_Position = u_matrix * a_position;
        gl_PointSize = 4.0;
        float z = a_position.z;
        f_mix_amount = 1.0-((1.0+z)/2.0);
    }
`

var fragmentShaderSource = `#version 300 es
    precision highp float;
    in float f_mix_amount;
    vec4 color = vec4(0.2,0.3,0.7,1);
    vec4 mix_color = vec4(0.5,0.5,0.5,1);
    out vec4 outColor;
    void main(){
        outColor = mix(color,mix_color, f_mix_amount);
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
    var canvas = document.querySelector("#canvas");
    var gl = canvas.getContext('webgl2');
    if(!gl){
        console.log("This browser doesn't support webgl2");
        return;
    }

    var vertexShader = createShader(gl, gl.VERTEX_SHADER,vertexShaderSource);
    var fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fragmentShaderSource);
    var program = createProgram(gl, vertexShader, fragmentShader);

    var positionAttributeLocation = gl.getAttribLocation(program, "a_position");

    var matrixLocation = gl.getUniformLocation(program,"u_matrix");

    var positionBuffer = gl.createBuffer();
    var voa = gl.createVertexArray();
    gl.bindVertexArray(voa);
    gl.enableVertexAttribArray(positionAttributeLocation);
    gl.bindBuffer(gl.ARRAY_BUFFER,positionBuffer);
    let numberOfPoints = setPoints(gl);
    let size = 3;
    let type = gl.FLOAT;
    var normalize = false;
    var stride = 0;
    var offset = 0;
    gl.vertexAttribPointer(positionAttributeLocation,size,type,normalize,stride,offset);
    drawScene();
    function drawScene(){
        webglUtils.resizeCanvasToDisplaySize(gl.canvas);
        gl.viewport(0,0,gl.canvas.width,gl.canvas.height);
        gl.clearColor(0,0,0,0);
        gl.clear(gl.COLOR_BUFFER | gl.DEPTH_BUFFER_BIT);
        gl.enable(gl.CULL_FACE);
        gl.enable(gl.DEPTH_TEST);
        gl.useProgram(program);
        gl.bindVertexArray(voa);
        var matrix = math.matrix([
            [1,0,0,0],
            [0,1,0,0],
            [0,0,1,0.5],
            [0,0,0,1],
        ]);
        console.log(math.flatten(matrix)._data)
        gl.uniformMatrix4fv(matrixLocation,false,math.flatten(matrix)._data);
        var primitiveType = gl.POINTS;
        var offset = 0;
        var count = numberOfPoints;
        console.log(count);
        gl.drawArrays(primitiveType,offset,count);
    }
}
function setPoints(gl){
    let array = [];
    for(let i=0; i<10;i++){
        for(let j=0;j<10;j++){
            for(let k=0;k<10;k++){
                array.push(1-i/5);
                array.push(1-j/5);
                array.push(1-k/5);
            }
        }
    }
    let arrayBuffer = new Float32Array(array);
    gl.bufferData(gl.ARRAY_BUFFER,arrayBuffer,gl.STATIC_DRAW);
    return array.length/3;
}
main();