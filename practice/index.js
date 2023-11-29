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
    vec4 color = vec4(0.2,0.3,0.9,0.6);
    vec4 mix_color = vec4(0.2,0.2,0.2,0.6);
    out vec4 outColor;
    void main(){
        outColor = mix(mix_color,color, f_mix_amount);
    }
`;

let array = [];
for(let i=0; i<30;i++){
    for(let j=0;j<30;j++){
        for(let k=0;k<30;k++){
            array.push(1-i/15);
            array.push(1-j/15);
            array.push(1-k/15);
        }
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



function main(){
    var matrix = math.matrix([
        [1,0,0,0],
        [0,1,0,0],
        [0,0,1,0.5],
        [0,0,0,1],
    ]);
    function addChangeListner(el,i,j){
        el.addEventListener("change",(event)=>{
            matrix.set([i,j],parseFloat(event.target.value));
            drawScene();
        })
    }
    
    //ui elements
    const i11 = document.querySelector("#m11");
    const i12 = document.querySelector("#m12");
    const i13 = document.querySelector("#m13");
    const i14 = document.querySelector("#m14");
    
    const i21 = document.querySelector("#m21");
    const i22 = document.querySelector("#m22");
    const i23 = document.querySelector("#m23");
    const i24 = document.querySelector("#m24");
    
    const i31 = document.querySelector("#m31");
    const i32 = document.querySelector("#m32");
    const i33 = document.querySelector("#m33");
    const i34 = document.querySelector("#m34");

    const i41 = document.querySelector("#m41");
    const i42 = document.querySelector("#m42");
    const i43 = document.querySelector("#m43");
    const i44 = document.querySelector("#m44");
    
    addChangeListner(i11,0,0);
    addChangeListner(i12,0,1);
    addChangeListner(i13,0,2);
    addChangeListner(i14,0,3);

    addChangeListner(i21,1,0);
    addChangeListner(i22,1,1);
    addChangeListner(i23,1,2);
    addChangeListner(i24,1,3);

    addChangeListner(i31,2,0);
    addChangeListner(i32,2,1);
    addChangeListner(i33,2,2);
    addChangeListner(i34,2,3);

    addChangeListner(i41,3,0);
    addChangeListner(i42,3,1);
    addChangeListner(i43,3,2);
    addChangeListner(i44,3,3);




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
        
        gl.uniformMatrix4fv(matrixLocation,false,math.flatten(matrix)._data);
        var primitiveType = gl.POINTS;
        var offset = 0;
        var count = numberOfPoints;
        gl.drawArrays(primitiveType,offset,count);
    }
}
function setPoints(gl){
    
    let arrayBuffer = new Float32Array(array);
    gl.bufferData(gl.ARRAY_BUFFER,arrayBuffer,gl.STATIC_DRAW);
    return array.length/3;
}
main();