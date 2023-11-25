"use strict"

var vertexShaderSource = `#version 300 es
    in vec4 a_position;
    uniform mat4 u_matrix;
    void main() {
        gl_Position = u_matrix * a_position;
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
function radToDeg(r) {
    return r * 180 / Math.PI;
  }

  function degToRad(d) {
    return d * Math.PI / 180;
  }
function main(){
    //get a webgl context
    var canvas = document.querySelector("#c");
    var gl = canvas.getContext('webgl2');
    if(!gl){
        console.log("can't get wegl2 context")
        return;
    }
    
    // compile shaders and create program
    var vertexShader = createShader(gl,gl.VERTEX_SHADER,vertexShaderSource);
    var fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fragmentShaderSource);
    var program = createProgram(gl,vertexShader,fragmentShader);
    
    // look up where the vertex data needs to go
    var positionAttributeLocation = gl.getAttribLocation(program, "a_position");
    
    // look up uniform locations
    var colorLocation = gl.getUniformLocation(program, "u_color");
    var matrixLocation = gl.getUniformLocation(program,"u_matrix");

    
    // create a buffer
    var positionBuffer = gl.createBuffer();
    
    // create a vertex array object
    var voa = gl.createVertexArray();

    //and make it the one we're currently working on with
    gl.bindVertexArray(voa);

    //turn on the attribute
    gl.enableVertexAttribArray(positionAttributeLocation);
    
    // bind it to ARRAY_BUFFER
    gl.bindBuffer(gl.ARRAY_BUFFER,positionBuffer);

    //set Geometry

    setGeometry(gl);

    // Tell the attribute how to get data out of positionBuffer (ARRAY_BUFFER)
    var size = 3;   // 2 components per iteration
    var type = gl.FLOAT; // the data is 32bit floats
    var normalize = false; // don't normalize the data
    var stride = 0; //0 = move forward size * sizeof(type) each iteration to get the next position
    var offset = 0; //start at the beginning of the buffer
    gl.vertexAttribPointer(positionAttributeLocation,size,type,normalize,stride,offset);


    // First let us make some variables
    // to hold the translation, width and height of the rectangle
    var translation = [45,150,0]
    var rotation = [degToRad(40), degToRad(25), degToRad(325)]
    let rotationInRadians = 0;
    var scale = [1,1,1]
    var color = [Math.random(), Math.random(), Math.random(),1];

    drawScene();

    webglLessonsUI.setupSlider('#x',{value:translation[0],slide:updatePosition(0), max: gl.canvas.width});
    webglLessonsUI.setupSlider('#y',{value:translation[1],slide:updatePosition(1), max: gl.canvas.height});
    webglLessonsUI.setupSlider('#z',{value:translation[2],slide:updatePosition(2), max: gl.canvas.height});
    webglLessonsUI.setupSlider('#angleX',{value:radToDeg(rotation[0]),slide:updateRotation(0), max: 360});
    webglLessonsUI.setupSlider('#angleY',{value:radToDeg(rotation[1]),slide:updateRotation(1), max: 360});
    webglLessonsUI.setupSlider('#angleZ',{value:radToDeg(rotation[2]),slide:updateRotation(2), max: 360});
    webglLessonsUI.setupSlider('#scaleX',{value:scale[0],slide:updateScale(0), min:-5,max: 5, step:0.01, precision:2});
    webglLessonsUI.setupSlider('#scaleY',{value:scale[1],slide:updateScale(1), min:-5,max: 5, step:0.01, precision:2});
    webglLessonsUI.setupSlider('#scaleZ',{value:scale[2],slide:updateScale(2), min:-5,max: 5, step:0.01, precision:2});

    function updateScale(index){
        return function(event,ui){
            scale[index] = ui.value;
            drawScene();
        }
    }


    function updateRotation(index){
        return function(event,ui){
            var angleInDeg = ui.value;
            var angleInRad = degToRad(angleInDeg);
            rotation[index] = angleInRad;
            drawScene();
        }
    }
    

    function updatePosition(index){
        return function(event,ui){
            translation[index] = ui.value;
            drawScene();
        }
    }

    function drawScene(){
        webglUtils.resizeCanvasToDisplaySize(gl.canvas);
    
        // tell the webgl how to convert from clip space to pixel space
        gl.viewport(0,0,gl.canvas.width,gl.canvas.height);
    
        // clear the canvas
        gl.clearColor(0,0,0,0);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    
        // Tell it to use our program (pair of shaders)
        gl.useProgram(program);
    
        gl.bindVertexArray(voa);
    
        // Pass in the canvas resolution so we can convert from
        // pixels to clip space in the shader
        gl.uniform4fv(colorLocation,color);
        

        var matrix = m4.projection(gl.canvas.clientWidth,gl.canvas.clientHeight,400);
        console.log(matrix)
        matrix = m4.translate(matrix, translation[0], translation[1], translation[2]);
        matrix = m4.xRotate(matrix,rotation[0]);
        matrix = m4.yRotate(matrix, rotation[1]);
        matrix = m4.zRotate(matrix, rotation[2]);
        matrix = m4.scale(matrix,scale[0],scale[1],scale[2]);
        gl.uniformMatrix4fv(matrixLocation,false,matrix);

        var primitiveType = gl.TRIANGLES;
        var offset = 0;
        var count = 18;
        gl.drawArrays(primitiveType,offset,count);
    }
}

function setGeometry(gl){
    gl.bufferData(
        gl.ARRAY_BUFFER,
        new Float32Array([
            // left column
            0,0, 0,
            30,0, 0, 
            0,150, 0,
            0,150, 0,
            30,0, 0,
            30,150, 0,

            // top rung
            30,0, 0,
            100,0, 0,
            30,30, 0,
            30,30, 0,
            100,0, 0,
            100,30, 0,

            //middle rung
            30,60, 0,
            67,60, 0,
            30,90, 0,
            30,90, 0,
            67,60, 0,
            67,90, 0,
        ]),
        gl.STATIC_DRAW
    )
}


var m4 = {
    multiply: function(a, b) {
        var b00 = b[0 * 4 + 0];
        var b01 = b[0 * 4 + 1];
        var b02 = b[0 * 4 + 2];
        var b03 = b[0 * 4 + 3];
        var b10 = b[1 * 4 + 0];
        var b11 = b[1 * 4 + 1];
        var b12 = b[1 * 4 + 2];
        var b13 = b[1 * 4 + 3];
        var b20 = b[2 * 4 + 0];
        var b21 = b[2 * 4 + 1];
        var b22 = b[2 * 4 + 2];
        var b23 = b[2 * 4 + 3];
        var b30 = b[3 * 4 + 0];
        var b31 = b[3 * 4 + 1];
        var b32 = b[3 * 4 + 2];
        var b33 = b[3 * 4 + 3];
        var a00 = a[0 * 4 + 0];
        var a01 = a[0 * 4 + 1];
        var a02 = a[0 * 4 + 2];
        var a03 = a[0 * 4 + 3];
        var a10 = a[1 * 4 + 0];
        var a11 = a[1 * 4 + 1];
        var a12 = a[1 * 4 + 2];
        var a13 = a[1 * 4 + 3];
        var a20 = a[2 * 4 + 0];
        var a21 = a[2 * 4 + 1];
        var a22 = a[2 * 4 + 2];
        var a23 = a[2 * 4 + 3];
        var a30 = a[3 * 4 + 0];
        var a31 = a[3 * 4 + 1];
        var a32 = a[3 * 4 + 2];
        var a33 = a[3 * 4 + 3];
     
        return [
          b00 * a00 + b01 * a10 + b02 * a20 + b03 * a30,
          b00 * a01 + b01 * a11 + b02 * a21 + b03 * a31,
          b00 * a02 + b01 * a12 + b02 * a22 + b03 * a32,
          b00 * a03 + b01 * a13 + b02 * a23 + b03 * a33,
          b10 * a00 + b11 * a10 + b12 * a20 + b13 * a30,
          b10 * a01 + b11 * a11 + b12 * a21 + b13 * a31,
          b10 * a02 + b11 * a12 + b12 * a22 + b13 * a32,
          b10 * a03 + b11 * a13 + b12 * a23 + b13 * a33,
          b20 * a00 + b21 * a10 + b22 * a20 + b23 * a30,
          b20 * a01 + b21 * a11 + b22 * a21 + b23 * a31,
          b20 * a02 + b21 * a12 + b22 * a22 + b23 * a32,
          b20 * a03 + b21 * a13 + b22 * a23 + b23 * a33,
          b30 * a00 + b31 * a10 + b32 * a20 + b33 * a30,
          b30 * a01 + b31 * a11 + b32 * a21 + b33 * a31,
          b30 * a02 + b31 * a12 + b32 * a22 + b33 * a32,
          b30 * a03 + b31 * a13 + b32 * a23 + b33 * a33,
        ];
      },

    translation: function(tx, ty, tz) {
        return [
          1,  0,  0,  0,
          0,  1,  0,  0,
          0,  0,  1,  0,
          tx, ty, tz, 1,
        ];
      },
     
      xRotation: function(angleInRadians) {
        var c = Math.cos(angleInRadians);
        var s = Math.sin(angleInRadians);
        return [
          1, 0, 0,  0,
          0, c, s,  0,
          0,-s, c,  0,
          0, 0, 0,  1,
        ];
      },
      yRotation: function(angleInRadians) {
        var c = Math.cos(angleInRadians);
        var s = Math.sin(angleInRadians);
     
        return [
          c, 0, -s, 0,
          0, 1, 0, 0,
          s, 0, c, 0,
          0, 0, 0, 1,
        ];
      },
     
      zRotation: function(angleInRadians) {
        var c = Math.cos(angleInRadians);
        var s = Math.sin(angleInRadians);
     
        return [
           c, s, 0, 0,
          -s, c, 0, 0,
           0, 0, 1, 0,
           0, 0, 0, 1,
        ];
      },
     
      scaling: function(sx, sy, sz) {
        return [
          sx, 0, 0, 0,
          0, sy, 0, 0,
          0, 0, sz, 0,
          0, 0,  0, 1,
        ];
      },
      identity: function(){
        return[
            1, 0, 0,
            0, 1, 0,
            0, 0, 1,
        ]
      },
      projection: function(width, height, depth) {
        // Note: This matrix flips the Y axis so 0 is at the top.
        return [
           2 / width, 0, 0, 0,
           0, -2 / height, 0, 0,
           0, 0, 2 / depth, 0,
          -1, 1, 0, 1,
        ];
      },

      translate: function(m, tx, ty, tz) {
        return m4.multiply(m, m4.translation(tx, ty, tz));
      },
     
      xRotate: function(m, angleInRadians) {
        return m4.multiply(m, m4.xRotation(angleInRadians));
      },
     
      yRotate: function(m, angleInRadians) {
        return m4.multiply(m, m4.yRotation(angleInRadians));
      },
     
      zRotate: function(m, angleInRadians) {
        return m4.multiply(m, m4.zRotation(angleInRadians));
      },
     
      scale: function(m, sx, sy, sz) {
        return m4.multiply(m, m4.scaling(sx, sy, sz));
      },
  }


main();