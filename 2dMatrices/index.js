"use strict"

var vertexShaderSource = `#version 300 es
    //an attribute is an input (in) to a vertex shader.
    // It will receive data from a buffer
    in vec2 a_position;
    uniform mat3 u_matrix;

    //all shaders have main function
    void main() {
        gl_Position = vec4((u_matrix * vec3(a_position,1)).xy,0,1);
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
    var size = 2;   // 2 components per iteration
    var type = gl.FLOAT; // the data is 32bit floats
    var normalize = false; // don't normalize the data
    var stride = 0; //0 = move forward size * sizeof(type) each iteration to get the next position
    var offset = 0; //start at the beginning of the buffer
    gl.vertexAttribPointer(positionAttributeLocation,size,type,normalize,stride,offset);


    // First let us make some variables
    // to hold the translation, width and height of the rectangle
    var translation = [100,150]
    let rotationInRadians = 0;
    var scale = [1,1]
    var color = [Math.random(), Math.random(), Math.random(),1];

    drawScene();

    webglLessonsUI.setupSlider('#x',{value:translation[0],slide:updatePosition(0), max: gl.canvas.width});
    webglLessonsUI.setupSlider('#y',{value:translation[1],slide:updatePosition(1), max: gl.canvas.height});
    webglLessonsUI.setupSlider('#angle',{slide:updateAngle, max: 360});
    webglLessonsUI.setupSlider('#scaleX',{value:scale[0],slide:updateScale(0), min:-5,max: 5, step:0.01, precision:2});
    webglLessonsUI.setupSlider('#scaleY',{value:scale[1],slide:updateScale(1), min:-5,max: 5, step:0.01, precision:2});

    function updateScale(index){
        return function(event,ui){
            scale[index] = ui.value;
            drawScene();
        }
    }


    function updateAngle(index,ui){
        var angleInDegrees = 360 - ui.value;
        var angleInRadians = angleInDegrees * Math.PI /180;
        rotationInRadians = angleInRadians;
        drawScene();
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
        

        var proectionMatrix = m3.projection(gl.canvas.clientWidth, gl.canvas.clientHeight);
        var moveOriginMatrix = m3.translation(-50,-75)
        var translationMatrix = m3.translation(translation[0],translation[1]);
        var rotationMatrix = m3.rotation(rotationInRadians);
        var scaleMatrix = m3.scaling(scale[0],scale[1]);

        var matrix = m3.multiply(proectionMatrix,translationMatrix);
        matrix = m3.multiply(matrix,rotationMatrix);
        matrix = m3.multiply(matrix,scaleMatrix);
        matrix = m3.multiply(matrix,moveOriginMatrix);
        gl.uniformMatrix3fv(matrixLocation,false,matrix);

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
            0,0,
            30,0,
            0,150,
            0,150,
            30,0,
            30,150,

            // top rung
            30,0,
            100,0,
            30,30,
            30,30,
            100,0,
            100,30,

            //middle rung
            30,60,
            67,60,
            30,90,
            30,90,
            67,60,
            67,90,
        ]),
        gl.STATIC_DRAW
    )
}


var m3 = {
    multiply: function(a, b) {
      var a00 = a[0 * 3 + 0];
      var a01 = a[0 * 3 + 1];
      var a02 = a[0 * 3 + 2];
      var a10 = a[1 * 3 + 0];
      var a11 = a[1 * 3 + 1];
      var a12 = a[1 * 3 + 2];
      var a20 = a[2 * 3 + 0];
      var a21 = a[2 * 3 + 1];
      var a22 = a[2 * 3 + 2];
      var b00 = b[0 * 3 + 0];
      var b01 = b[0 * 3 + 1];
      var b02 = b[0 * 3 + 2];
      var b10 = b[1 * 3 + 0];
      var b11 = b[1 * 3 + 1];
      var b12 = b[1 * 3 + 2];
      var b20 = b[2 * 3 + 0];
      var b21 = b[2 * 3 + 1];
      var b22 = b[2 * 3 + 2];
   
      return [
        b00 * a00 + b01 * a10 + b02 * a20,
        b00 * a01 + b01 * a11 + b02 * a21,
        b00 * a02 + b01 * a12 + b02 * a22,
        b10 * a00 + b11 * a10 + b12 * a20,
        b10 * a01 + b11 * a11 + b12 * a21,
        b10 * a02 + b11 * a12 + b12 * a22,
        b20 * a00 + b21 * a10 + b22 * a20,
        b20 * a01 + b21 * a11 + b22 * a21,
        b20 * a02 + b21 * a12 + b22 * a22,
      ];
    },

    translation: function(tx, ty) {
        return [
          1, 0, 0,
          0, 1, 0,
          tx, ty, 1,
        ];
      },
     
      rotation: function(angleInRadians) {
        var c = Math.cos(angleInRadians);
        var s = Math.sin(angleInRadians);
        return [
          c,-s, 0,
          s, c, 0,
          0, 0, 1,
        ];
      },
     
      scaling: function(sx, sy) {
        return [
          sx, 0, 0,
          0, sy, 0,
          0, 0, 1,
        ];
      },
      identity: function(){
        return[
            1, 0, 0,
            0, 1, 0,
            0, 0, 1,
        ]
      },
      projection: function(width,height){
        return [
            2/width, 0, 0,
            0, -2/height, 0,
            -1, 1, 1,
        ]
      }
  }


main();