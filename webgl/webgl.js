var gl;
var gVBO;
var gShaderManager;
var gModel;
var gCamera;
var gCharacter;
var gGun;
var gEnvMap;
var gBob;
var gBobInc;

var gaMaterialModels = [];

/*
**
*/
function loadSorceress(character)
{
    character.loadOBJ('models/sorceress/sorceress.obj');
    character.loadTextures([
        'models/sorceress/Drenai_Body_BaseColor.png',
        'models/sorceress/Drenai_Body_Metallic.jpg',
        'models/sorceress/Drenai_Body_Roughness.jpg',
        'models/sorceress/Drenai_Body_Normal.jpg',
        'models/sorceress/Drenai_Skirt_BaseColor.jpg',
        'models/sorceress/Drenai_Skirt_Metallic.jpg',
        'models/sorceress/Drenai_Skirt_Roughness.jpg',
        'models/sorceress/Drenai_Skirt_Normal.jpg',
    ]);

    character.albedo = [0, 4];
    character.metalness = [1, 5];
    character.roughness = [2, 6];
    character.normalMap = [3, 7];
}

/*
**
*/
function loadCar(character)
{
    character.loadOBJ('oldcar.obj');
    character.loadTextures([
        'oldcar_d.png',
        'oldcar_m.png',
        'oldcar_r.png',
        'oldcar_n.png',
    ]);

    character.albedo = [0, 0, 0];
    character.metalness = [1, 1, 1];
    character.roughness = [2, 2, 2];
    character.normalMap = [3, 3, 3];
}

/*
**
*/
function loadPink(character)
{
    character.loadOBJ('models/pink/pink.obj');
    character.loadTextures([
       'models/pink/body_albedo_2048.png',
       'models/pink/body_SPEC_2048.png',
       'models/pink/body_Roughness_1024.png',
       'models/pink/body_Normal_DirectX.png',
    ]);

    character.albedo = [0, 0, 0];
    character.metalness = [1, 1, 1];
    character.roughness = [2, 2, 2];
    character.normalMap = [3, 3, 3];
}

/*
**
*/
function loadMetal(character, textures)
{
    var floatArray = createSphere(1.0, 0, 0, 0, 12);
    var model = new Model('sphere');
    model.floatArray = new Float32Array(floatArray);
    model.updateVBO();
    model.numFaces = (model.floatArray.length / 9) / 3;
    character.models.push(model);

    character.loadTextures(textures);

    character.albedo = [0];
    character.metalness = [1];
    character.normalMap = [2];
    character.roughness = [3];
}

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
        var available_extensions = gl.getSupportedExtensions();
        var float_texture_ext = gl.getExtension('EXT_shader_texture_lod');

        gl.clearColor(0.0, 0.0, 0.5, 1.0);
        gl.enable(gl.DEPTH_TEST);

        gl.enable(gl.BLEND);
        gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

        gl.depthFunc(gl.LEQUAL);
        gl.viewport(0, 0, canvas.width, canvas.height);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        gShaderManager = new ShaderManager();

        gShaderManager.readInAllShaders("shaders");

        /*var textures = ['materials/greasy-metal-pan1-Unreal-Engine/greasy-metal-pan1-albedo.png',
         'materials/greasy-metal-pan1-Unreal-Engine/greasy-metal-pan1-metal.png',
         'materials/greasy-metal-pan1-Unreal-Engine/greasy-metal-pan1-normal.png',
         'materials/greasy-metal-pan1-Unreal-Engine/greasy-metal-pan1-roughness.png']
        */

        var textures0 = [
            'materials/iron-rusted4-Unreal-Engine/iron-rusted4-basecolor.png',
            'materials/iron-rusted4-Unreal-Engine/iron-rusted4-metalness.png',
            'materials/iron-rusted4-Unreal-Engine/iron-rusted4-normal.png',
            'materials/iron-rusted4-Unreal-Engine/iron-rusted4-roughness.png'
        ];

        var textures1 = [
            'materials/greasy-metal-pan1-Unreal-Engine/greasy-metal-pan1-albedo.png',
            'materials/greasy-metal-pan1-Unreal-Engine/greasy-metal-pan1-metal.png',
            'materials/greasy-metal-pan1-Unreal-Engine/greasy-metal-pan1-normal.png',
            'materials/greasy-metal-pan1-Unreal-Engine/greasy-metal-pan1-roughness.png'
        ];

        var textures2= [
            'materials/copper-rock1-Unreal-Engine/copper-rock1-alb.png',
            'materials/copper-rock1-Unreal-Engine/copper-rock1-metal.png',
            'materials/copper-rock1-Unreal-Engine/copper-rock1-normal.png',
            'materials/copper-rock1-Unreal-Engine/copper-rock1-rough.png'
        ];

        var textures3 = [
            'materials/scuffed-plastic-1-Unreal-Engine/scuffed-plastic6-alb.png',
            'materials/scuffed-plastic-1-Unreal-Engine/scuffed-plastic-metal.png',
            'materials/scuffed-plastic-1-Unreal-Engine/scuffed-plastic-normal.png',
            'materials/scuffed-plastic-1-Unreal-Engine/scuffed-plastic-rough.png'
        ];

        //gCharacter = new Character();


        var materialModel = new Character();
        loadMetal(materialModel, textures0);
        gaMaterialModels.push(materialModel);
        
        materialModel = new Character();
        loadMetal(materialModel, textures1);
        gaMaterialModels.push(materialModel);

        materialModel = new Character();
        loadMetal(materialModel, textures2);
        gaMaterialModels.push(materialModel);

        materialModel = new Character();
        loadMetal(materialModel, textures3);
        gaMaterialModels.push(materialModel);

        //gGun = new Character();
        //gGun.loadOBJ('zarya_gun.obj');

        //loadSorceress(gCharacter);
        //loadCar(gCharacter);
        //loadPink(gCharacter);

        //gCharacter.loadOBJ('oldcar.obj');
        //gCharacter.loadTextures([
        //    'oldcar_d.png',
        //    'oldcar_m.png',
        //    'oldcar_r.png',
        //    'oldcar_n.png',
        //]);

        //gCharacter.albedo = [0, 0, 0];
        //gCharacter.metalness = [1, 1, 1];
        //gCharacter.roughness = [2, 2, 2];
        //gCharacter.normalMap = [3, 3, 3];

        /*
        gCharacter.loadOBJ('Mercy_Witch.obj');
        gCharacter.loadTextures([
            'body_d.jpg',
            'eyeball_iris.jpg',
            'hair_d.jpg',
            'staff_d.jpg',
            'teeth_d.jpg',
            'wingglow_d.png',
            'wings.jpg',
            'body_e.jpg',
            'staff_e.jpg',
            'hair_e.jpg',
            'default_rough.png',
            'staff_hud.jpg']);
        gCharacter.diffuseTextureMappings =
        [
            11,
            0,
            0,
            0,
            0,
            1,
            3,
            1,
            0,
            3,
            0,
            0,
            3,
            5,
            2,
        ];

        gCharacter.pbrMappings =
        [
            10,
            7,
            7,
            7,
            7,
            10,
            10,
            10,
            7,
            8,
            7,
            7,
            8,
            10,
            9,
        ]
        */
        gCamera = new Camera(new Vector3(0.0, 0.0, -2.0), new Vector3(0.0, 0.0, 100.0));

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

        gBob = 0.0;
        gBobInc = 1.0;

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

        gCamera.lookAt.x = gCamera.position.x + lookAt.x * lookDistance;
        gCamera.lookAt.y = gCamera.position.y + lookAt.y * lookDistance;
        gCamera.lookAt.z = gCamera.position.z + lookAt.z * lookDistance;
    }
    else if (event.key == 's') {
        gCamera.position.x -= zAxis.x * speed;
        gCamera.position.y -= zAxis.y * speed;
        gCamera.position.z -= zAxis.z * speed;

        gCamera.lookAt.x = gCamera.position.x + lookAt.x * lookDistance;
        gCamera.lookAt.y = gCamera.position.y + lookAt.y * lookDistance;
        gCamera.lookAt.z = gCamera.position.z + lookAt.z * lookDistance;
    }
    else if (event.key == 'a') {
        gCamera.position.x -= xAxis.x * speed;
        gCamera.position.y -= xAxis.y * speed;
        gCamera.position.z -= xAxis.z * speed;

        gCamera.lookAt.x = gCamera.position.x + lookAt.x * lookDistance;
        gCamera.lookAt.y = gCamera.position.y + lookAt.y * lookDistance;
        gCamera.lookAt.z = gCamera.position.z + lookAt.z * lookDistance;
    }
    else if (event.key == 'd') {
        gCamera.position.x += xAxis.x * speed;
        gCamera.position.y += xAxis.y * speed;
        gCamera.position.z += xAxis.z * speed;

        gCamera.lookAt.x = gCamera.position.x + lookAt.x * lookDistance;
        gCamera.lookAt.y = gCamera.position.y + lookAt.y * lookDistance;
        gCamera.lookAt.z = gCamera.position.z + lookAt.z * lookDistance;
    }
    else if (event.key == 'ArrowUp') {
        gCamera.position.y += speed;
        gCamera.lookAt.y += speed;
    }
    else if (event.key == 'ArrowDown') {
        gCamera.position.y -= speed;
        gCamera.lookAt.y -= speed;
    }

    

    if (Math.abs(gBob) > 0.5) {
        gBobInc *= -1.0;
    }

    gBob += (gBobInc * 0.05);
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
    //matTrans.translate(gCamera.position.x - 0.85, (gCamera.position.y - 0.6) + gBob, gCamera.position.z - 1.1);
    matTrans.translate(0.0, 0.0, 0.0);
    var matModel = matTrans.multiply(totalRot);
    
    var totalMat = gCamera.matrix.multiply(matModel);
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
        var eyeCoordUniform = gl.getUniformLocation(shaderProgram.program, 'eyePos');

        var samplePos = getSampleCoords(128);
        gl.uniform2fv(sampleCoordUniform, new Float32Array(samplePos));
        
        gl.uniform3f(eyeCoordUniform, gCamera.position.x, gCamera.position.y, gCamera.position.z);

        var lightPos = [-5.0, 20.0, 0.0, 1.0];
        gl.uniform4fv(lightPosUniform, new Float32Array(lightPos));

        // attribs (position and normal)
        var vertexAttrib = gl.getAttribLocation(shaderProgram.program, "position");
        gl.enableVertexAttribArray(vertexAttrib);

        var normalAttrib = gl.getAttribLocation(shaderProgram.program, "normal");
        gl.enableVertexAttribArray(normalAttrib);

        var uvAttrib = gl.getAttribLocation(shaderProgram.program, "uv");
        gl.enableVertexAttribArray(uvAttrib);

        var tex0Uniform = gl.getUniformLocation(shaderProgram.program, 'environmentSampler');
        var tex1Uniform = gl.getUniformLocation(shaderProgram.program, 'albedoSampler');
        var tex2Uniform = gl.getUniformLocation(shaderProgram.program, 'metalnessSampler');
        var tex3Uniform = gl.getUniformLocation(shaderProgram.program, 'roughnessSampler');
        var tex4Uniform = gl.getUniformLocation(shaderProgram.program, 'normalSampler');

        gl.uniform1i(tex0Uniform, 0);
        gl.uniform1i(tex1Uniform, 1);
        gl.uniform1i(tex2Uniform, 2);
        gl.uniform1i(tex3Uniform, 3);
        gl.uniform1i(tex4Uniform, 4);

        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        var stride = 3 * Float32Array.BYTES_PER_ELEMENT;

        

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

        //// model
        //for (var i = 0; i < gGun.models.length; i++)
        //{
        //    var model = gGun.models[i];
        //    gl.bindBuffer(gl.ARRAY_BUFFER, model.vbo)
        //    gl.vertexAttribPointer(vertexAttrib, 3, gl.FLOAT, false, 32, 0);
        //    gl.vertexAttribPointer(normalAttrib, 3, gl.FLOAT, false, 32, stride);
        //    gl.vertexAttribPointer(uvAttrib, 2, gl.FLOAT, false, 32, stride + stride);
        //    gl.drawArrays(gl.TRIANGLES, 0, model.numFaces * 3);
        //}

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

        for (var i = 0; i < gaMaterialModels.length; i++)
        {
            var materialModel = gaMaterialModels[i];

            var matRotY = new Matrix44();
            matRotY.rotateY(3.14159 * 1.87);

            var matRotX = new Matrix44();
            matRotX.rotateX(0.15);

            var totalRot = matRotX.multiply(matRotY);

            var matTrans = new Matrix44();
            matTrans.translate(i * 3.0, 0.0, 0.0);
            var matModel = matTrans.multiply(totalRot);

            // matrix uniforms
            if (modelMatrixUniform)
            {
                gl.uniformMatrix4fv(modelMatrixUniform, false, new Float32Array(matModel.entries));
            }

            for(var j = 0; j < materialModel.models.length; j++)
            {
                var model = materialModel.models[j];

                gl.activeTexture(gl.TEXTURE0 + 1);
                gl.bindTexture(gl.TEXTURE_2D, materialModel.textures[materialModel.albedo[j]]);

                gl.activeTexture(gl.TEXTURE0 + 2);
                gl.bindTexture(gl.TEXTURE_2D, materialModel.textures[materialModel.metalness[j]]);

                gl.activeTexture(gl.TEXTURE0 + 3);
                gl.bindTexture(gl.TEXTURE_2D, materialModel.textures[materialModel.roughness[j]]);

                gl.activeTexture(gl.TEXTURE0 + 4);
                gl.bindTexture(gl.TEXTURE_2D, materialModel.textures[materialModel.normalMap[j]]);

                gl.bindBuffer(gl.ARRAY_BUFFER, model.vbo)
                gl.vertexAttribPointer(vertexAttrib, 3, gl.FLOAT, false, 32, 0);
                gl.vertexAttribPointer(normalAttrib, 3, gl.FLOAT, false, 32, stride);
                gl.vertexAttribPointer(uvAttrib, 2, gl.FLOAT, false, 32, stride + stride);
                gl.drawArrays(gl.TRIANGLES, 0, model.floatArray.length / 8);
            }
        }

        /*for (var i = 0; i < gCharacter.models.length; i++)
        {
            var model = gCharacter.models[i];

            gl.activeTexture(gl.TEXTURE0 + 1);
            gl.bindTexture(gl.TEXTURE_2D, gCharacter.textures[gCharacter.albedo[i]]);
            
            gl.activeTexture(gl.TEXTURE0 + 2);
            gl.bindTexture(gl.TEXTURE_2D, gCharacter.textures[gCharacter.metalness[i]]);

            gl.activeTexture(gl.TEXTURE0 + 3);
            gl.bindTexture(gl.TEXTURE_2D, gCharacter.textures[gCharacter.roughness[i]]);

            gl.activeTexture(gl.TEXTURE0 + 4);
            gl.bindTexture(gl.TEXTURE_2D, gCharacter.textures[gCharacter.normalMap[i]]);

            gl.bindBuffer(gl.ARRAY_BUFFER, model.vbo)
            gl.vertexAttribPointer(vertexAttrib, 3, gl.FLOAT, false, 32, 0);
            gl.vertexAttribPointer(normalAttrib, 3, gl.FLOAT, false, 32, stride);
            gl.vertexAttribPointer(uvAttrib, 2, gl.FLOAT, false, 32, stride + stride);
            gl.drawArrays(gl.TRIANGLES, 0, model.floatArray.length / 8);
          
        }   */
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

    gl.generateMipmap(gl.TEXTURE_CUBE_MAP);

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

/*
**
*/
function createSphere(radius, centerX, centerY, centerZ, numSegments)
{
    var circlePos = [];
    
    var twoPI = Math.PI * 2.0;

    var inc = (2.0 * Math.PI) / numSegments;
    for (var i = 0; i < numSegments; i++)
    {
        var x = Math.cos(inc * i);
        var z = Math.sin(inc * i);

        circlePos.push(new Vector3(x, 0.0, z));
    }

    var vertPos = [];
    var vertUV = [];
    var vertNorm = [];
    var halfPI = Math.PI / 2;

    var halfSegments = numSegments / 2;
    for (var i = 0; i < numSegments; i++)
    {
        var nextIndexI = (i + 1) % numSegments;

        var topRadius = (i / halfSegments) * halfPI;
        var bottomRadius = ((i + 1) / halfSegments) * halfPI;

        if (i >= halfSegments)
        {
            topRadius = ((numSegments - i) / halfSegments) * halfPI;
            bottomRadius = ((numSegments - (i + 1)) / halfSegments) * halfPI;
        }

        topRadius = Math.sin(topRadius) * radius;
        bottomRadius = Math.sin(bottomRadius) * radius;

        console.log('top radius ' + topRadius + ' bottom radius ' + bottomRadius);

        var topNormY = Math.cos((i / numSegments) * Math.PI);
        var bottomNormY = Math.cos(((i + 1) / numSegments) * Math.PI);

        console.log('*********** ' + i + ' ***********');

        for(var j = 0; j < numSegments; j++)
        {
            var nextIndexJ = (j + 1) % numSegments;
            var yMult = 1.0;
            if (i + 1 >= numSegments)
            {
                yMult = -1.0;
            }

            var topX0 = topRadius * circlePos[j].x;
            var topY0 = ((halfSegments - i) / halfSegments) * halfPI;
            var topZ0 = topRadius * circlePos[j].z;

            var topX1 = topRadius * circlePos[nextIndexJ].x;
            var topY1 = ((halfSegments - i) / halfSegments) * halfPI;
            var topZ1 = topRadius * circlePos[nextIndexJ].z;

            var bottomX0 = bottomRadius * circlePos[j].x;
            var bottomY0 = ((halfSegments - nextIndexI) / halfSegments) * halfPI * yMult;
            var bottomZ0 = bottomRadius * circlePos[j].z;

            var bottomX1 = bottomRadius * circlePos[nextIndexJ].x;
            var bottomY1 = ((halfSegments - nextIndexI) / halfSegments) * halfPI * yMult;
            var bottomZ1 = bottomRadius * circlePos[nextIndexJ].z;

            topY0 = Math.sin(topY0);
            topY1 = Math.sin(topY1);
            bottomY0 = Math.sin(bottomY0);
            bottomY1 = Math.sin(bottomY1);

            // 0 --- 2
            // |  / |
            // |/ _ |
            // 1    3

            // face
            // position
            vertPos.push(new Vector3(topX0, topY0, topZ0));
            vertPos.push(new Vector3(bottomX0, bottomY0, bottomZ0));
            vertPos.push(new Vector3(topX1, topY1, topZ1));

            vertPos.push(new Vector3(topX1, topY1, topZ1));
            vertPos.push(new Vector3(bottomX0, bottomY0, bottomZ0));
            vertPos.push(new Vector3(bottomX1, bottomY1, bottomZ1));

            //console.log('0 (' + topX0 + ', ' + topY0 + ', ' + topZ0 + ')');
            //console.log('1 (' + topX0 + ', ' + bottomY0 + ', ' + topZ0 + ')');
            //console.log('2 (' + topX1 + ', ' + topY1 + ', ' + topZ1 + ')');
            //console.log('3 (' + bottomX1 + ', ' + bottomY1 + ', ' + bottomZ1 + ')');

            // normal
            var topNorm0 = new Vector3(circlePos[j].x * topRadius, topNormY, circlePos[j].z * topRadius);
            var topNorm1 = new Vector3(circlePos[nextIndexJ].x * topRadius, topNormY, circlePos[nextIndexJ].z * topRadius);

            var bottomNorm0 = new Vector3(circlePos[j].x * bottomRadius, bottomNormY, circlePos[j].z * bottomRadius);
            var bottomNorm1 = new Vector3(circlePos[nextIndexJ].x * bottomRadius, bottomNormY, circlePos[nextIndexJ].z * bottomRadius);

            topNorm0.normalize();
            topNorm1.normalize();
            bottomNorm0.normalize();
            bottomNorm1.normalize();

            vertNorm.push(topNorm0);
            vertNorm.push(bottomNorm0);
            vertNorm.push(topNorm1);

            vertNorm.push(topNorm1);
            vertNorm.push(bottomNorm0);
            vertNorm.push(bottomNorm1);

            // uv
            var dTop0 = new Vector3(topX0, topY0, topZ0);
            var dTop1 = new Vector3(topX1, topY1, topZ1);
            dTop0.normalize();
            dTop1.normalize();

            var dBottom0 = new Vector3(bottomX0, bottomY0, bottomZ0);
            var dBottom1 = new Vector3(bottomX1, bottomY1, bottomZ1);
            dBottom0.normalize();
            dBottom1.normalize();

            var topUV0 = new Vector3(0.5 + Math.atan2(dTop0.z, dTop0.x) / twoPI, 0.5 - Math.asin(dTop0.y) / Math.PI, 0.0);
            var topUV1 = new Vector3(0.5 + Math.atan2(dTop1.z, dTop1.x) / twoPI, 0.5 - Math.asin(dTop1.y) / Math.PI, 0.0);

            var bottomUV0 = new Vector3(0.5 + Math.atan2(dBottom0.z, dBottom0.x) / twoPI, 0.5 - Math.asin(dBottom0.y) / Math.PI, 0.0);
            var bottomUV1 = new Vector3(0.5 + Math.atan2(dBottom1.z, dBottom1.x) / twoPI, 0.5 - Math.asin(dBottom1.y) / Math.PI, 0.0);

            vertUV.push(topUV0);
            vertUV.push(bottomUV0);
            vertUV.push(topUV1);

            vertUV.push(topUV1);
            vertUV.push(bottomUV0);
            vertUV.push(bottomUV1);
        }
    }

    // to number array
    var floatArray = [];
    for (var i = 0; i < vertPos.length; i++)
    {
        floatArray.push(vertPos[i].x);
        floatArray.push(vertPos[i].y);
        floatArray.push(vertPos[i].z);

        floatArray.push(vertNorm[i].x);
        floatArray.push(vertNorm[i].y);
        floatArray.push(vertNorm[i].z);

        floatArray.push(vertUV[i].x);
        floatArray.push(vertUV[i].y);
    }

    return floatArray;
}