"use strict"

var vertexShaderSource = `#version 300 es
    //an attribute is an input (in) to a vertex shader.
    // It will receive data from a buffer
    in vec2 a_position;
    uniform vec2 u_resolution;

    // translation to add to position
    uniform vec2 u_translation;

    uniform vec2 u_rotation;

    //all shaders have main function
    void main() {
        vec2 rotatedPosition = vec2(
            a_position.x*u_rotation.y + a_position.y*u_rotation.x,
            a_position.y*u_rotation.y - a_position.x*u_rotation.x
        );
        // add in the translation
        vec2 position = rotatedPosition + u_translation;
        //convert the position from pixeles to 0.0 to 1.0
        vec2 zeroToOne = position/u_resolution;

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
    var resolutionUnifomLocation = gl.getUniformLocation(program,"u_resolution");
    var colorLocation = gl.getUniformLocation(program, "u_color");
    var translationLocation = gl.getUniformLocation(program, "u_translation");
    var rotationLocation = gl.getUniformLocation(program,"u_rotation")

    
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
    var translation = [0,0]
    var rotation = [0,1]
    var color = [Math.random(), Math.random(), Math.random(),1];

    drawScene();

    webglLessonsUI.setupSlider('#x',{slide:updatePosition(0), max: gl.canvas.width});
    webglLessonsUI.setupSlider('#y',{slide:updatePosition(1), max: gl.canvas.height});
    webglLessonsUI.setupSlider('#angle',{slide:updateAngle, max: 360});
    function updateAngle(index,ui){
        var angleInDegrees = 360 - ui.value;
        var angleInRadians = angleInDegrees * Math.PI /180;
        rotation[0] = Math.sin(angleInRadians);
        rotation[1] = Math.cos(angleInRadians);
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
        gl.uniform2f(resolutionUnifomLocation, gl.canvas.width, gl.canvas.height);
        gl.uniform4fv(colorLocation,color);
        gl.uniform2fv(translationLocation,translation);
        gl.uniform2fv(rotationLocation,rotation);
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
main();