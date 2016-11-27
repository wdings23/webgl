var gl;
var gVBO;
var gShaderManager;
var gModel;
var gCamera;
var gCharacter;

function initGL()
{
    var canvas = document.getElementById("glcanvas");
    gl = canvas.getContext("webgl");
    if (!gl)
    {
        gl = canvas.getContext("experimental-webgl");
    }

    if (gl)
    {
        gl.clearColor(0.0, 0.0, 0.5, 1.0);
        gl.enable(gl.DEPTH_TEST);
        gl.depthFunc(gl.LEQUAL);
        gl.viewport(0, 0, canvas.width, canvas.height);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        gShaderManager = new ShaderManager();

        gShaderManager.readInAllShaders("shaders");

        //var vertPos =
	    //[
		//    -0.5, 0.5, 0.0,
		//    -0.5, -0.5, 0.0,
		//    0.5, 0.5, 0.0,
		//    0.5, -0.5, 0.0
	    //];

        //gVBO = createVBO(vertPos);
        //gModel = new Model();
        //gModel.loadFile("output.mdl");

        gCharacter = new Character();

        gCharacter.loadOBJ('mercy_rotated.obj');

        //gCharacter.loadFile('output.mdl');

        gCamera = new Camera(new Vector3(0.0, 3.0, -3.0), new Vector3(0.0, 3.0, 100.0));

        tick();
    }
}

function createVBO(vertPos)
{
    vbo = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertPos), gl.STATIC_DRAW);

    return vbo;
}

function tick()
{
    requestAnimationFrame(tick);
    update();
    draw();
}

var angle = 0.0;
function update()
{
    var up = new Vector3(0.0, 1.0, 0.0);
    //gCamera.position.z += 0.1;
    gCamera.update(up, 100.0, 1.0, 500.0, 500.0);
}


function draw()
{
    var matRotY = new Matrix44();
    matRotY.rotateY(angle);

    var matRotZ = new Matrix44();
    matRotZ.rotateZ(0.0);

    var totalRotMat = matRotZ.multiply(matRotY);
    
    var totalMat = gCamera.matrix;
    var model = gCharacter.models[0];
    var componentCount = 0;
    var count = 0;

    //for (var i = 0; i < 4; i++)
    //{
    //    console.log(gCamera.projectionMatrix.entries[i * 4] + ' ' + gCamera.projectionMatrix.entries[i * 4 + 1] + ' ' + gCamera.projectionMatrix.entries[i * 4 + 2] + ' ' + gCamera.projectionMatrix.entries[i * 4 + 3]);
    //}

    //console.log('**********');
    //for (var i = 0; i < 21; i++) {
    //    var v = new Vector4(model.vertices[i*3], model.vertices[i*3+1], model.vertices[i*3+2], 1.0);
    //    var world = gCamera.viewMatrix.xform(v);
    //    var frustum = gCamera.projectionMatrix.xform(world);
    //    var total = gCamera.matrix.xform(v);

    //    console.log(i);
    //    console.log('orig (' + v.x + ', ' + v.y + ', ' + v.z + ', ' + v.w + ')');
    //    console.log('world (' + world.x + ', ' + world.y + ', ' + world.z + ', ' + world.w + ')');
    //    console.log('frustum (' + (frustum.x / frustum.w) + ', ' + (frustum.y / frustum.w) + ', ' + (frustum.z / frustum.w) + ', ' + (frustum.w / frustum.w) + ')');
    //    console.log('total (' + (total.x / total.w) + ', ' + (total.y / total.w) + ', ' + (total.z / total.w) + ', ' + (total.w / total.w) + ')');
    //    console.log('**********');
    //}

    var shaderProgram = gShaderManager.getShaderProgram("flat");
    if (shaderProgram)
    {
        gl.useProgram(shaderProgram.program);

        var colorUniform = gl.getUniformLocation(shaderProgram.program, "color");
        var modelMatrixUniform = gl.getUniformLocation(shaderProgram.program, "modelMatrix");

        var red = Math.random();
        var green = Math.random();
        var blue = Math.random();
        var colorArray = [1.0, 1.0, 1.0, 1.0];
        gl.uniform4fv(colorUniform, new Float32Array(colorArray))

        if (modelMatrixUniform)
        {
            gl.uniformMatrix4fv(modelMatrixUniform, false, new Float32Array(totalMat.entries));
        }

        var vertexAttrib = gl.getAttribLocation(shaderProgram.program, "position");
        gl.enableVertexAttribArray(vertexAttrib);

        var normalAttrib = gl.getAttribLocation(shaderProgram.program, "normal");
        gl.enableVertexAttribArray(normalAttrib);

        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        //
        var stride = 3 * Float32Array.BYTES_PER_ELEMENT;
        for (var i = 0; i < gCharacter.models.length; i++) {
            var model = gCharacter.models[i];

            gl.bindBuffer(gl.ARRAY_BUFFER, model.vbo)
            gl.vertexAttribPointer(vertexAttrib, 3, gl.FLOAT, false, 24, 0);
            gl.vertexAttribPointer(normalAttrib, 3, gl.FLOAT, false, 24, stride);
            gl.drawArrays(gl.TRIANGLES, 0, model.numFaces * 3);
        }
    }
}