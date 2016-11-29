var gl;
var gVBO;
var gShaderManager;
var gModel;
var gCamera;
var gCharacter;
var gGun;
var gEnvMap;

/*
**
*/
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

        gGun = new Character();
        gGun.loadOBJ('zarya_gun.obj');

        gCharacter = new Character();
        gCharacter.loadOBJ('mercy_rotated.obj');

        gCamera = new Camera(new Vector3(0.0, 3.0, 2.0), new Vector3(0.0, 3.0, -100.0));

        document.addEventListener('keydown', onKeyDown);

        gEnvMap = createCubeTexture(
            [
                ['rightImage', gl.TEXTURE_CUBE_MAP_POSITIVE_X],
                ['leftImage', gl.TEXTURE_CUBE_MAP_NEGATIVE_X],
                ['topImage', gl.TEXTURE_CUBE_MAP_POSITIVE_Y],
                ['bottomImage', gl.TEXTURE_CUBE_MAP_NEGATIVE_Y],
                ['backImage', gl.TEXTURE_CUBE_MAP_POSITIVE_Z],
                ['frontImage', gl.TEXTURE_CUBE_MAP_NEGATIVE_Z],
            ]);

        tick();
    }
}

/*
**
*/
function onKeyDown(event)
{
    console.log('event = ' + event.key);

    var up = new Vector3(0.0, 1.0, 0.0);
    var zAxis = gCamera.lookAt.subtract(gCamera.position);
    var xAxis = up.cross(zAxis);
    var yAxis = zAxis.cross(xAxis);

    xAxis.normalize();
    yAxis.normalize();
    zAxis.normalize();

    var speed = 0.1;
    var lookDistance = 100.0;
    var lookAt = gCamera.lookAt.subtract(gCamera.position);
    lookAt.normalize();

    if(event.key == 'w')
    {
        gCamera.position.x += zAxis.x * speed;
        gCamera.position.y += zAxis.y * speed;
        gCamera.position.z += zAxis.z * speed;
    }
    else if (event.key == 's') {
        gCamera.position.x -= zAxis.x * speed;
        gCamera.position.y -= zAxis.y * speed;
        gCamera.position.z -= zAxis.z * speed;
    }
    else if (event.key == 'a') {
        gCamera.position.x -= xAxis.x * speed;
        gCamera.position.y -= xAxis.y * speed;
        gCamera.position.z -= xAxis.z * speed;
    }
    else if (event.key == 'd') {
        gCamera.position.x += xAxis.x * speed;
        gCamera.position.y += xAxis.y * speed;
        gCamera.position.z += xAxis.z * speed;
    }

    gCamera.lookAt.x = gCamera.position.x + lookAt.x * lookDistance;
    gCamera.lookAt.y = gCamera.position.y + lookAt.y * lookDistance;
    gCamera.lookAt.z = gCamera.position.z + lookAt.z * lookDistance;
}

/*
**
*/
function createVBO(vertPos)
{
    vbo = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertPos), gl.STATIC_DRAW);

    return vbo;
}

/*
**
*/
function tick()
{
    requestAnimationFrame(tick);
    update();
    draw();

    updateUI();
}

/*
**
*/
function update()
{
    var up = new Vector3(0.0, 1.0, 0.0);
    gCamera.update(up, 100.0, 1.0, 500.0, 500.0);

}

/*
**
*/
function draw()
{
    var matRotY = new Matrix44();
    matRotY.rotateY(3.14159 * 1.87);
    
    var matRotX = new Matrix44();
    matRotX.rotateX(0.15);

    var totalRot = matRotX.multiply(matRotY);

    var matTrans = new Matrix44();
    matTrans.translate(gCamera.position.x - 0.85, gCamera.position.y - 0.6, gCamera.position.z - 1.1);
    var matModel = matTrans.multiply(totalRot);
    
    var totalMat = gCamera.matrix.multiply(matModel);
    var model = gCharacter.models[0];
    var componentCount = 0;
    var count = 0;

    var shaderProgram = gShaderManager.getShaderProgram("flat");
    if (shaderProgram)
    {
        gl.useProgram(shaderProgram.program);

        // uniforms
        var colorUniform = gl.getUniformLocation(shaderProgram.program, "color");
        var modelMatrixUniform = gl.getUniformLocation(shaderProgram.program, "modelMatrix");
        var viewMatrixUniform = gl.getUniformLocation(shaderProgram.program, 'viewMatrix');
        var projectionMatrixUniform = gl.getUniformLocation(shaderProgram.program, 'projMatrix');
        var normalMatrixUniform = gl.getUniformLocation(shaderProgram.program, 'normMatrix');
        var lightPosUniform = gl.getUniformLocation(shaderProgram.program, 'lightPos');

        var sampleCoordUniform = gl.getUniformLocation(shaderProgram.program, 'afSamplePos');
        
        var samplePos = getSampleCoords(64);
        gl.uniform2fv(sampleCoordUniform, new Float32Array(samplePos));
        

        var red = Math.random();
        var green = Math.random();
        var blue = Math.random();
        var colorArray = [1.0, 1.0, 1.0, 1.0];
        gl.uniform4fv(colorUniform, new Float32Array(colorArray))

        var lightPos = [-5.0, 20.0, 0.0, 1.0];
        gl.uniform4fv(lightPosUniform, new Float32Array(lightPos));

        // attribs (position and normal)
        var vertexAttrib = gl.getAttribLocation(shaderProgram.program, "position");
        gl.enableVertexAttribArray(vertexAttrib);

        var normalAttrib = gl.getAttribLocation(shaderProgram.program, "normal");
        gl.enableVertexAttribArray(normalAttrib);

        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        var stride = 3 * Float32Array.BYTES_PER_ELEMENT;

        // matrix uniforms
        if (modelMatrixUniform)
        {
            gl.uniformMatrix4fv(modelMatrixUniform, false, new Float32Array(matModel.entries));
        }

        if (viewMatrixUniform)
        {
            gl.uniformMatrix4fv(viewMatrixUniform, false, new Float32Array(gCamera.viewMatrix.entries));
        }

        if (projectionMatrixUniform)
        {
            gl.uniformMatrix4fv(projectionMatrixUniform, false, new Float32Array(gCamera.projectionMatrix.entries));
        }

        if (normalMatrixUniform)
        {
            var orthonormalViewMatrix = gCamera.viewMatrix;
            orthonormalViewMatrix.entries[12] = orthonormalViewMatrix.entries[13] = orthonormalViewMatrix.entries[14] = 0.0;

            var totalNormMatrix = matRotY.multiply(orthonormalViewMatrix);
            gl.uniformMatrix4fv(normalMatrixUniform, false, new Float32Array(totalNormMatrix.entries));
        }

        // environment texture
        gl.bindTexture(gl.TEXTURE_CUBE_MAP, gEnvMap);
        gl.activeTexture(gl.TEXTURE0);

        // model
        for (var i = 0; i < gGun.models.length; i++)
        {
            var model = gGun.models[i];
            gl.bindBuffer(gl.ARRAY_BUFFER, model.vbo)
            gl.vertexAttribPointer(vertexAttrib, 3, gl.FLOAT, false, 24, 0);
            gl.vertexAttribPointer(normalAttrib, 3, gl.FLOAT, false, 24, stride);
            gl.drawArrays(gl.TRIANGLES, 0, model.numFaces * 3);
        }

        // character
        var identity = new Matrix44();
        if (modelMatrixUniform)
        {
            gl.uniformMatrix4fv(modelMatrixUniform, false, new Float32Array(identity.entries));
        }

        if (normalMatrixUniform)
        {
            gl.uniformMatrix4fv(normalMatrixUniform, false, new Float32Array(identity.entries));
        }

        for (var i = 0; i < gCharacter.models.length; i++)
        {
            var model = gCharacter.models[i];

            gl.bindBuffer(gl.ARRAY_BUFFER, model.vbo)
            gl.vertexAttribPointer(vertexAttrib, 3, gl.FLOAT, false, 24, 0);
            gl.vertexAttribPointer(normalAttrib, 3, gl.FLOAT, false, 24, stride);
            gl.drawArrays(gl.TRIANGLES, 0, model.numFaces * 3);
        }   
    }
}

/*
**
*/
function updateUI()
{
    var pos = document.getElementById('position');
    pos.innerText = gCamera.position.x + ' ' + gCamera.position.y + ' ' + gCamera.position.z;

    var lookAt = document.getElementById('lookAt');
    lookAt.innerText = gCamera.lookAt.x + ' ' + gCamera.lookAt.y + ' ' + gCamera.lookAt.z;
}

/*
**
*/
function createTexture(id)
{
    var texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texImage2D(
        gl.TEXTURE_2D,
        0,
        gl.RGBA,
        gl.RGBA,
        gl.UNSIGNED_BYTE,
        document.getElementById(id));

    gl.bindTexture(gl.TEXTURE_2D, null);

}

/*
**
*/
function createCubeTexture(ids) {
    var texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_CUBE_MAP, texture);
    gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MAG_FILTER, gl.LINEAR);

    for (var i = 0; i < ids.length; i++) {
        var id = ids[i][0];
        var faceSide = ids[i][1];

        gl.bindTexture(gl.TEXTURE_CUBE_MAP, texture);
        gl.texImage2D(
            faceSide,
            0,
            gl.RGBA,
            gl.RGBA,
            gl.UNSIGNED_BYTE,
            document.getElementById(id));
    }

    gl.bindTexture(gl.TEXTURE_CUBE_MAP, null);

    return texture;
}

/*
**
*/
function radicalInverseVDC(iBits)
{
	iBits = (iBits << 16) | (iBits >> 16);
    iBits = ((iBits & 0x55555555) << 1) | ((iBits & 0xAAAAAAAA) >> 1);
    iBits = ((iBits & 0x33333333) << 2) | ((iBits & 0xCCCCCCCC) >> 2);
    iBits = ((iBits & 0x0F0F0F0F) << 4) | ((iBits & 0xF0F0F0F0) >> 4);
    iBits = ((iBits & 0x00FF00FF) << 8) | ((iBits & 0xFF00FF00) >> 8);

    //return (iBits / 0x100000000);
    return (iBits * 2.3283064365386963e-10);
}

/*
**
*/
function getSampleCoords(numSamples)
{
    var ret = [];

    for(var i = 0; i < numSamples; i++)
    {
        var xiX = i / numSamples;
        var xiY = radicalInverseVDC(i);

        ret.push(xiX);
        ret.push(xiY);
    }

    return ret;
}