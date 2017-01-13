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
var gCrossHairInfo;
var gCrossHairShader;
var gKeydown = {};
var gaMRTTextures;
var gMRTFramebuffer;
var gaMRTQuadBuffer = [];
var gDepthTexture;
var gMRTFinalQuadBuffer;
var gLightViewFrameBuffers = new Array(3);
var gLightViewTextures = new Array(3);
var gLightViewQuadBuffers = new Array(3);
var gLightViewCameras = new Array(3);
var gFrustumClipZ = new Array(3);

var gDVA;
var gPistol = null;
var gSky;

var gGround = {vbo: null, textures: null};

var MRTEnum =
{
    NORMAL: 0,
    CLIPSPACE: 1,
    WORLDSPACE: 2,
    ALBEDO: 3,
    NORMALMAP: 4,
    METAL_ROUGHNESS: 5,

    NUM_MRT : 6,
};

/*
**
*/
function loadSorceress(character)
{
    chargacter.loadOBJ('models/sorceress/sorceress.obj');
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
function loadDVA()
{
    var character = new Character();

    character.loadOBJ('models/dva.obj');
    character.loadTextures([
       'models/dva_albedo.jpg',
       'models/dva_metal.jpg',
       'models/dva_rough.jpg',
       'models/dva_normal.jpg',
    ]);

    character.albedo = [0, 0, 0];
    character.metalness = [1, 1, 1];
    character.roughness = [2, 2, 2];
    character.normalMap = [3, 3, 3];

    return character;
}

/*
**
*/
function loadCharacter(url, loadedFunc)
{
    /*
    <character>
        <model>models/pistol/pistol.obj</model>
        <albedo>models/pistol/pistol_albedo.jpg</albedo>
        <metal>models/pistol/pistol_metal.jpg</metal>
        <rough>models/pistol/pistol_rough.jpg</rough>
        <normal>models/pistol/pistol_normal.jpg</normal>
    </character>
    */

    var xhr = new XMLHttpRequest();
    xhr.addEventListener('load',
        function () {
            var parser = new DOMParser();
            var xmlDoc = parser.parseFromString(this.responseText, 'text/xml');
            var modelName = xmlDoc.getElementsByTagName('model')[0].textContent;
            var albedo = xmlDoc.getElementsByTagName('albedo')[0].textContent;
            var metal = xmlDoc.getElementsByTagName('metal')[0].textContent;
            var rough = xmlDoc.getElementsByTagName('rough')[0].textContent;
            var normal = xmlDoc.getElementsByTagName('normal')[0].textContent;

            var character = new Character();
            character.name = modelName;
            var textureNames = [albedo, metal, rough, normal];

            character.loadOBJ(modelName);
            character.loadTextures(textureNames);

            character.albedo = [0, 0, 0];
            character.metalness = [1, 1, 1];
            character.roughness = [2, 2, 2];
            character.normalMap = [3, 3, 3];

            loadedFunc(character);

        });

    xhr.open('GET', url);
    xhr.send();
}

/*
**
*/
var gLookAngleX = 0.0;
var gLookAngleY = 0.0;
function initGL()
{
    var canvas = document.getElementById("glcanvas");
    gl = canvas.getContext("webgl");
    if (!gl)
    {
        gl = canvas.getContext("experimental-webgl");
    }

    document.body.onclick = function (event) {
        canvas.requestPointerLock = canvas.requestPointerLock || canvas.mozRequestPointerLock;

        canvas.requestPointerLock();
    }

    document.body.onmouseenter = function(event)
    {
        gEnterCanvasEvent = event;
    }

    document.body.onmousemove = function (event)
    {

        if (gCamera === undefined)
        {
            return;
        }

        if (document.pointerLockElement === null) {
            return;
        }

        if (document.pointerLockElement !== undefined && document.pointerLockElement !== null)
        {
            if (document.pointerLockElement.id != 'glcanvas')
            {
                return;
            }
        }

        if (document.mozPointerLockElement !== undefined)
        {
            if (document.mozPointerLockElement.id != 'glcanvas')
            {
                return;
            }
        }

        var diffX = event.movementX;
        var diffY = event.movementY;

        var speedMultiplier = 0.005;

        var rotMatrixX = new Matrix44();
        var rotMatrixY = new Matrix44();

        var lookAt = gCamera.lookAt.subtract(gCamera.position)
        lookAt.normalize();

        var incX = (diffX * speedMultiplier) / (Math.PI * 2.0);
        var incY = (diffY * speedMultiplier) / (Math.PI * 0.5);

        gLookAngleX += incX;
        gLookAngleY += incY;

        if (gLookAngleY <= -Math.PI * 0.49)
        {
            gLookAngleY = -Math.PI * 0.49;
        }
        else if (gLookAngleY > Math.PI * 0.49)
        {
            gLookAngleY = Math.PI * 0.49;
        }

        rotMatrixX.rotateX(gLookAngleY);
        rotMatrixY.rotateY(gLookAngleX);
        var rotMatrix = rotMatrixY.multiply(rotMatrixX);

        var defaultLook = new Vector3(0.0, 0.0, 1.0);
        var newLookAt = rotMatrix.xform(defaultLook);
        gCamera.lookAt.x = newLookAt.x * 100.0;
        gCamera.lookAt.y = newLookAt.y * 100.0;
        gCamera.lookAt.z = newLookAt.z * 100.0;

    }

    if (gl)
    {
        gl.getExtension("OES_standard_derivatives");

        [gMRTFramebuffer, gaMRTTextures, gDepthTexture] = createFBTextures();
        [gLightViewFrameBuffers[0], gLightViewTextures[0]] = createLightViewFrameBuffer();
        [gLightViewFrameBuffers[1], gLightViewTextures[1]] = createLightViewFrameBuffer();
        [gLightViewFrameBuffers[2], gLightViewTextures[2]] = createLightViewFrameBuffer();

        // debug texture quads
        gaMRTQuadBuffer.push(createQuad(0.4, -1.4, -0.5));
        gaMRTQuadBuffer.push(createQuad(0.4, -0.9, -0.5));
        gaMRTQuadBuffer.push(createQuad(0.4, -0.4, -0.5));
        gaMRTQuadBuffer.push(createQuad(0.4, 0.1, -0.5));
        gaMRTQuadBuffer.push(createQuad(0.4, 0.6, -0.5));
        gaMRTQuadBuffer.push(createQuad(0.4, 1.1, -0.5));
        
        gLightViewQuadBuffers[0] = createQuad(0.4, -1.4, 0.5);
        gLightViewQuadBuffers[1] = createQuad(0.4, -0.9, 0.5);
        gLightViewQuadBuffers[2] = createQuad(0.4, -0.4, 0.5);
        gMRTFinalQuadBuffer = createQuad(2.0, 0.0, 0.0);

        loadData();

        var groundBuffer = createGround(20.0, 0.0, 0.0, 0.0);
        gGround.vbo = groundBuffer;
        (function createGroundTextures() {
            createTextures2(['ground_albedo.jpeg', 'ground_metallic.jpeg', 'ground_roughness.jpeg', 'ground_normal.jpeg'],
                function (textures) {
                    gGround.textures = textures;
                });
        })();

        var available_extensions = gl.getSupportedExtensions();
        var float_texture_ext = gl.getExtension('EXT_shader_texture_lod');
        var draw_buffers_ext = gl.getExtension('WEBGL_draw_buffers');

        gCrossHairInfo = initCrossHair(0.04);

        gl.clearColor(0.0, 0.0, 0.5, 1.0);
        gl.enable(gl.DEPTH_TEST);

        gl.enable(gl.BLEND);
        gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

        gl.depthFunc(gl.LEQUAL);
        gl.viewport(0, 0, canvas.width, canvas.height);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        gShaderManager = new ShaderManager();

        gShaderManager.readInAllShaders("shaders");

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


        /*var materialModel = new Character();
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
        gaMaterialModels.push(materialModel);*/

        gDVA = loadDVA();
        

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
        gCamera = new Camera(new Vector3(0.0, 1.0, -2.0), new Vector3(0.0, 0.0, 100.0));
        //gCamera = new Camera(new Vector3(5.0, 10.0, 5.0), new Vector3(0.0, 0.0, 0.0));
        gLightViewCameras[0] = new Camera(new Vector3(-6.0, 10.0, 4.0), new Vector3(0.0, 0.0, 0.0));
        gLightViewCameras[1] = new Camera(new Vector3(-6.0, 10.0, 4.0), new Vector3(0.0, 0.0, 0.0));
        gLightViewCameras[2] = new Camera(new Vector3(-6.0, 10.0, 4.0), new Vector3(0.0, 0.0, 0.0));

        window.setInterval(handleKeyboard, 16);
        window.addEventListener('keydown', onKeyDown);
        window.addEventListener('keyup', onKeyUp);

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
function handleKeyboard()
{
    var up = new Vector3(0.0, 1.0, 0.0);
    var zAxis = gCamera.lookAt.subtract(gCamera.position);
    var xAxis = up.cross(zAxis);
    var yAxis = zAxis.cross(xAxis);

    xAxis.normalize();
    yAxis.normalize();
    zAxis.normalize();

    var speed = 0.05;
    var lookDistance = 100.0;
    var lookAt = gCamera.lookAt.subtract(gCamera.position);
    lookAt.normalize();

    if (gKeydown['w']) {
        gCamera.position.x += zAxis.x * speed;
        gCamera.position.y += zAxis.y * speed;
        gCamera.position.z += zAxis.z * speed;

        gCamera.lookAt.x = gCamera.position.x + lookAt.x * lookDistance;
        gCamera.lookAt.y = gCamera.position.y + lookAt.y * lookDistance;
        gCamera.lookAt.z = gCamera.position.z + lookAt.z * lookDistance;
    }
    else if (gKeydown['s']) {
        gCamera.position.x -= zAxis.x * speed;
        gCamera.position.y -= zAxis.y * speed;
        gCamera.position.z -= zAxis.z * speed;

        gCamera.lookAt.x = gCamera.position.x + lookAt.x * lookDistance;
        gCamera.lookAt.y = gCamera.position.y + lookAt.y * lookDistance;
        gCamera.lookAt.z = gCamera.position.z + lookAt.z * lookDistance;
    }
    else if (gKeydown['a']) {
        gCamera.position.x -= xAxis.x * speed;
        gCamera.position.y -= xAxis.y * speed;
        gCamera.position.z -= xAxis.z * speed;

        gCamera.lookAt.x = gCamera.position.x + lookAt.x * lookDistance;
        gCamera.lookAt.y = gCamera.position.y + lookAt.y * lookDistance;
        gCamera.lookAt.z = gCamera.position.z + lookAt.z * lookDistance;
    }
    else if (gKeydown['d']) {
        gCamera.position.x += xAxis.x * speed;
        gCamera.position.y += xAxis.y * speed;
        gCamera.position.z += xAxis.z * speed;

        gCamera.lookAt.x = gCamera.position.x + lookAt.x * lookDistance;
        gCamera.lookAt.y = gCamera.position.y + lookAt.y * lookDistance;
        gCamera.lookAt.z = gCamera.position.z + lookAt.z * lookDistance;
    }
    else if (gKeydown['ArrowUp']) {
        gCamera.position.y += speed;
        gCamera.lookAt.y += speed;
    }
    else if (gKeydown['ArrowDown']) {
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
function onKeyDown(event)
{
    gKeydown[event.key] = true;
}

/*
**
*/
function onKeyUp(event)
{
    delete gKeydown[event.key];
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
    if (!gShaderManager.finishLoading())
    {
        return;
    }

    update();
    drawFromLight();

    drawMRT('mrt');
    drawMRTFinal();

    updateUI();
}

/*
**
*/
var gfMult = 1.0;
var gFar = 12.0;
var gNear = 2.0;
var gLightDir = new Vector3(1.0, -1.0, -1.0);
function update()
{
    gLightDir.normalize();

    var canvas = document.getElementById('glcanvas');

    gCamera.computeViewMatrix();
    gCamera.updatePerspectiveProjection(100.0, 0.5, canvas.clientWidth, canvas.clientHeight);

    /*gLightViewCameras[0].position.z += (0.01 * gfMult);
    if (Math.abs(gLightViewCameras[0].position.z) > 15.0)
    {
        gfMult *= -1.0;
    }*/

    for (var cameraIndex = 0; cameraIndex < gLightViewCameras.length; cameraIndex++)
    {
        var worldSpaceFrustumInfo = getFrustumBounding(gCamera, cameraIndex);
        var worldSpaceFrustumCoords = worldSpaceFrustumInfo[0];

        gFrustumClipZ[cameraIndex] = [worldSpaceFrustumInfo[1], worldSpaceFrustumInfo[2]];

        var bounds = getBounds(worldSpaceFrustumCoords);
        var center = new Vector3(
            (bounds[1].x + bounds[0].x) * 0.5,
            (bounds[1].y + bounds[0].y) * 0.5,
            (bounds[1].z + bounds[0].z) * 0.5);

        // frustum bounds for placing light view camera
        var frustumBounds = new Vector3(
            bounds[1].x - bounds[0].x,
            bounds[1].y - bounds[0].y,
            bounds[1].z - bounds[0].z);

        var largestCoord = frustumBounds.x;
        if(frustumBounds.y > frustumBounds.x && frustumBounds.y > frustumBounds.z)
        {
            largestCoord = frustumBounds.y;
        }
        else if(frustumBounds.z > frustumBounds.x && frustumBounds.z > frustumBounds.y)
        {
            largestCoord = frustumBounds.z;
        }

        largestCoord += 5.0;
        var lightPos = new Vector3(
            center.x - gLightDir.x * largestCoord,
            center.y - gLightDir.y * largestCoord,
            center.z - gLightDir.z * largestCoord);

        // update view matrix with new position and look at
        gLightViewCameras[cameraIndex].position = lightPos;
        gLightViewCameras[cameraIndex].lookAt = center;
        gLightViewCameras[cameraIndex].computeViewMatrix();

        // transform to light space
        var lightSpaceFrustumCoords = [];
        for (var i = 0; i < worldSpaceFrustumCoords.length; i++)
        {
            lightSpaceFrustumCoords.push(gLightViewCameras[cameraIndex].viewMatrix.xform(worldSpaceFrustumCoords[i]));
        }

        var lightSpaceBounds = getBounds(lightSpaceFrustumCoords);
        var diff = new Vector3(
            lightSpaceBounds[1].x - lightSpaceBounds[0].x,
            lightSpaceBounds[1].y - lightSpaceBounds[0].y,
            lightSpaceBounds[1].z - lightSpaceBounds[0].z);

        var center = new Vector3(
            (lightSpaceBounds[1].x + lightSpaceBounds[0].x) / 2,
            (lightSpaceBounds[1].y + lightSpaceBounds[0].y) / 2,
            (lightSpaceBounds[1].z + lightSpaceBounds[0].z) / 2);

        var largestBound = diff.x;
        if (diff.y > diff.x && diff.y > diff.z)
        {
            largestBound = diff.y;
        }
        else if (diff.z > diff.x && diff.z > diff.y)
        {
            largestBound = diff.z;
        }

        largestBound *= 1.25;
        gLightViewCameras[cameraIndex].updateOrthographicProjection(
            center.x - largestBound * 0.5,
            center.x + largestBound * 0.5,
            center.y - largestBound * 0.5,
            center.y + largestBound * 0.5,
            center.z - largestBound * 0.5,
            center.z + largestBound * 0.5);
    }

    //console.log('gNear = ' + gNear + ' gFar = ' + gFar);
}

/*
**
*/
function drawCharacters(
    characters,
    modelMatrices,
    normalMatrices,
    modelMatrixUniform,
    normalMatrixUniform,
    vertexAttrib,
    normalAttrib,
    uvAttrib,
    isTextured,
    textureStartIndex)
{
    var stride = 3 * Float32Array.BYTES_PER_ELEMENT;

    for (var i = 0; i < characters.length; i++) {
        var character = characters[i];
        var matModel = modelMatrices[i];
        var matNormal = normalMatrices[i];

        // matrix uniforms
        if (modelMatrixUniform) {
            gl.uniformMatrix4fv(modelMatrixUniform, false, new Float32Array(matModel.entries));
        }

        if (normalMatrixUniform) {
            gl.uniformMatrix4fv(normalMatrixUniform, false, new Float32Array(matNormal.entries));
        }

        for (var j = 0; j < character.models.length; j++) {
            var model = character.models[j];

            if (isTextured) {
                gl.activeTexture(gl.TEXTURE0 + textureStartIndex);
                gl.bindTexture(gl.TEXTURE_2D, character.textures[character.albedo[j]]);

                gl.activeTexture(gl.TEXTURE0 + textureStartIndex + 1);
                gl.bindTexture(gl.TEXTURE_2D, character.textures[character.metalness[j]]);

                gl.activeTexture(gl.TEXTURE0 + textureStartIndex + 2);
                gl.bindTexture(gl.TEXTURE_2D, character.textures[character.roughness[j]]);

                gl.activeTexture(gl.TEXTURE0 + textureStartIndex + 3);
                gl.bindTexture(gl.TEXTURE_2D, character.textures[character.normalMap[j]]);
            }

            gl.bindBuffer(gl.ARRAY_BUFFER, model.vbo)
            gl.vertexAttribPointer(vertexAttrib, 3, gl.FLOAT, false, 32, 0);

            if (normalAttrib >= 0) {
                gl.vertexAttribPointer(normalAttrib, 3, gl.FLOAT, false, 32, stride);
            }

            if (uvAttrib >= 0) {
                gl.vertexAttribPointer(uvAttrib, 2, gl.FLOAT, false, 32, stride + stride);
            }

            gl.drawArrays(gl.TRIANGLES, 0, model.floatArray.length / 8);
        }
    }
}

/*
**
*/
function updateUI()
{
    var pos = document.getElementById('position');
    pos.innerText = 'position ' + gCamera.position.x + ' ' + gCamera.position.y + ' ' + gCamera.position.z;

    var lookAt = document.getElementById('lookAt');
    lookAt.innerText = 'lookAt ' + gCamera.lookAt.x + ' ' + gCamera.lookAt.y + ' ' + gCamera.lookAt.z;
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

    return texture;
}

/*
**
*/
function createCubeTexture(ids) {
    var texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_CUBE_MAP, texture);
    gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
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

        var topNormY = Math.cos((i / numSegments) * Math.PI);
        var bottomNormY = Math.cos(((i + 1) / numSegments) * Math.PI);

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

            topY0 = Math.sin(topY0) * radius;
            topY1 = Math.sin(topY1) * radius;
            bottomY0 = Math.sin(bottomY0) * radius;
            bottomY1 = Math.sin(bottomY1) * radius;

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

/*
**
*/
function initCrossHair(size)
{
    var numIter = 100;
    var twoPI = Math.PI * 2.0;
    var coords = [];
    for (var i = 0; i < numIter; i++)
    {
        var angle0 = (i / numIter) * twoPI;
        var angle1 = (((i + 1) % numIter) / numIter) * twoPI;

        var posX0 = size * Math.cos(angle0);
        var posY0 = size * Math.sin(angle0);

        var posX1 = size * Math.cos(angle1);
        var posY1 = size * Math.sin(angle1);
        
        coords.push(posX0);
        coords.push(posY0);
        coords.push(0.0);
        coords.push(1.0);

        coords.push(posX1);
        coords.push(posY1);
        coords.push(0.0);
        coords.push(1.0);
    }

    for (var i = 0; i < numIter; i++) {
        var angle0 = (i / numIter) * twoPI;
        var angle1 = (((i + 1) % numIter) / numIter) * twoPI;

        var posX0 = 0.01 * Math.cos(angle0);
        var posY0 = 0.01 * Math.sin(angle0);

        var posX1 = 0.01 * Math.cos(angle1);
        var posY1 = 0.01 * Math.sin(angle1);

        coords.push(posX0);
        coords.push(posY0);
        coords.push(0.0);
        coords.push(1.0);

        coords.push(posX1);
        coords.push(posY1);
        coords.push(0.0);
        coords.push(1.0);
    }

    var buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(coords), gl.STATIC_DRAW);
    gl.lineWidth(30.0);
    gl.bindBuffer(gl.ARRAY_BUFFER, null);

    return [buffer, coords.length / 4];
}

/*
**
*/
function drawCrossHair(buffer, numLinePts)
{
    gCrossHairShader = gShaderManager.getShaderProgram("default");
    if (gCrossHairShader == null)
    {
        return;
    }

    gl.useProgram(gCrossHairShader.program);
    var colorUniform = gl.getUniformLocation(gCrossHairShader.program, "color");
    gl.uniform4f(colorUniform, 1.0, 0.0, 0.0, 1.0);

    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);

    var vertexAttrib = gl.getAttribLocation(gCrossHairShader.program, "position");
    gl.enableVertexAttribArray(vertexAttrib);

    gl.vertexAttribPointer(vertexAttrib, 4, gl.FLOAT, false, 16, 0);

    gl.disable(gl.DEPTH_TEST);
    gl.drawArrays(gl.LINES, 0, numLinePts);
    gl.enable(gl.DEPTH_TEST);

    gl.bindBuffer(gl.ARRAY_BUFFER, null);
}

/*
**
*/
function createLightViewFrameBuffer()
{
    var drawBuffersEXT = gl.getExtension('WEBGL_draw_buffers');
    var floatingPointTextureEXT = gl.getExtension('OES_texture_float');
    var canvas = document.getElementById('glcanvas');

    if (floatingPointTextureEXT == null || drawBuffersEXT == null) {
        debugger;
    }

    var oldFB = gl.getParameter(gl.FRAMEBUFFER_BINDING);

    var frameBuffer = gl.createFramebuffer();
    gl.bindFramebuffer(gl.FRAMEBUFFER, frameBuffer);

    var texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.texImage2D(
        gl.TEXTURE_2D,
        0,
        gl.RGBA,
        canvas.width,
        canvas.height,
        0,
        gl.RGBA,
        gl.FLOAT,
        null);

    gl.framebufferTexture2D(gl.FRAMEBUFFER, drawBuffersEXT.COLOR_ATTACHMENT0_WEBGL, gl.TEXTURE_2D, texture, 0);

    var depthRenderBuffer = gl.createRenderbuffer();
    gl.bindRenderbuffer(gl.RENDERBUFFER, depthRenderBuffer);
    gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT16, canvas.width, canvas.height);
    gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, depthRenderBuffer);

    drawBuffersEXT.drawBuffersWEBGL([drawBuffersEXT.COLOR_ATTACHMENT0_WEBGL]);
    for (var i = 0; i < 100; i++) {
        var status = gl.checkFramebufferStatus(gl.FRAMEBUFFER);
        console.log('status = ' + status);
        if (status == gl.FRAMEBUFFER_COMPLETE) {
            break;
        }
        else {
            debugger;
        }
    }

    gl.bindFramebuffer(gl.FRAMEBUFFER, oldFB);
    gl.bindRenderbuffer(gl.RENDERBUFFER, null);

    return [frameBuffer, texture];
}

/*
**
*/
function createFBTextures()
{
    console.log(gl.getSupportedExtensions());

    var drawBuffersEXT = gl.getExtension('WEBGL_draw_buffers');
    var floatingPointTextureEXT = gl.getExtension('OES_texture_float');
    var canvas = document.getElementById('glcanvas');

    if (floatingPointTextureEXT == null || drawBuffersEXT == null)
    {
        debugger;
    }

    var oldFB = gl.getParameter(gl.FRAMEBUFFER_BINDING);

    var frameBuffer = gl.createFramebuffer();
    gl.bindFramebuffer(gl.FRAMEBUFFER, frameBuffer);
    var mrtTextures = new Array(6);

    for (var i = 0; i < mrtTextures.length; i++) {
        var texture = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
        gl.texImage2D(
            gl.TEXTURE_2D,
            0,
            gl.RGBA,
            canvas.width,
            canvas.height,
            0,
            gl.RGBA,
            gl.FLOAT,
            null);

        //gl.texImage2D(
        //    gl.TEXTURE_2D,
        //    0,
        //    gl.RGBA,
        //    gl.RGBA,
        //    gl.UNSIGNED_BYTE,
        //    null);   

        mrtTextures[i] = texture;
        gl.framebufferTexture2D(gl.FRAMEBUFFER, drawBuffersEXT.COLOR_ATTACHMENT0_WEBGL + i, gl.TEXTURE_2D, mrtTextures[i], 0);
    }

    var depthRenderBuffer = gl.createRenderbuffer();
    gl.bindRenderbuffer(gl.RENDERBUFFER, depthRenderBuffer);
    gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT16, canvas.width, canvas.height);
    gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, depthRenderBuffer);

    drawBuffersEXT.drawBuffersWEBGL([
        drawBuffersEXT.COLOR_ATTACHMENT0_WEBGL,
        drawBuffersEXT.COLOR_ATTACHMENT1_WEBGL,
        drawBuffersEXT.COLOR_ATTACHMENT2_WEBGL,
        drawBuffersEXT.COLOR_ATTACHMENT3_WEBGL,
        drawBuffersEXT.COLOR_ATTACHMENT4_WEBGL,
        drawBuffersEXT.COLOR_ATTACHMENT5_WEBGL,
    ]);

    for (var i = 0; i < 100; i++)
    {
        var status = gl.checkFramebufferStatus(gl.FRAMEBUFFER);
        console.log('status = ' + status);
        if (status == gl.FRAMEBUFFER_COMPLETE) {
            break;
        }
        else
        {
            debugger;
        }
    }

    var depthTexture = createDepthTexture(canvas.width, canvas.height);

    gl.bindFramebuffer(gl.FRAMEBUFFER, oldFB);
    gl.bindRenderbuffer(gl.RENDERBUFFER, null);

    return [frameBuffer, mrtTextures, depthTexture];
}


/*
**
*/
function createQuad(size, offsetX, offsetY)
{
    var vert = [];
    var halfSize = size * 0.5;

    vert.push(halfSize + offsetX);
    vert.push(halfSize + offsetY);
    vert.push(0.0);
    vert.push(1.0);

    vert.push(1.0);
    vert.push(1.0);

    vert.push(-halfSize + offsetX);
    vert.push(-halfSize + offsetY);
    vert.push(0.0);
    vert.push(1.0);

    vert.push(0.0);
    vert.push(0.0);

    vert.push(halfSize + offsetX);
    vert.push(-halfSize + offsetY);
    vert.push(0.0);
    vert.push(1.0);

    vert.push(1.0);
    vert.push(0.0);

    vert.push(-halfSize + offsetX);
    vert.push(halfSize + offsetY);
    vert.push(0.0);
    vert.push(1.0);

    vert.push(0.0);
    vert.push(1.0);

    vert.push(-halfSize + offsetX);
    vert.push(-halfSize + offsetY);
    vert.push(0.0);
    vert.push(1.0);

    vert.push(0.0);
    vert.push(0.0);

    vert.push(halfSize + offsetX);
    vert.push(halfSize + offsetY);
    vert.push(0.0);
    vert.push(1.0);

    vert.push(1.0);
    vert.push(1.0);

    var buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vert), gl.STATIC_DRAW);
    gl.bindBuffer(gl.ARRAY_BUFFER, null);

    return buffer;
}

/*
**
*/
function createGround(size, offsetX, offsetY, offsetZ) {
    var vert = [];
    var halfSize = size * 0.5;

    vert.push(halfSize + offsetX);
    vert.push(offsetY);
    vert.push(halfSize + offsetZ);
    
    vert.push(0.0);
    vert.push(1.0);
    vert.push(0.0);

    vert.push(1.0);
    vert.push(1.0);

    vert.push(-halfSize + offsetX);
    vert.push(offsetY);
    vert.push(-halfSize + offsetZ);
    
    vert.push(0.0);
    vert.push(1.0);
    vert.push(0.0);

    vert.push(0.0);
    vert.push(0.0);

    vert.push(halfSize + offsetX);
    vert.push(offsetY);
    vert.push(-halfSize + offsetZ);
    
    vert.push(0.0);
    vert.push(1.0);
    vert.push(0.0);

    vert.push(1.0);
    vert.push(0.0);

    vert.push(-halfSize + offsetX);
    vert.push(offsetY);
    vert.push(halfSize + offsetZ);
    
    vert.push(0.0);
    vert.push(1.0);
    vert.push(0.0);

    vert.push(0.0);
    vert.push(1.0);

    vert.push(-halfSize + offsetX);
    vert.push(offsetY);
    vert.push(-halfSize + offsetZ);
    
    vert.push(0.0);
    vert.push(1.0);
    vert.push(0.0);

    vert.push(0.0);
    vert.push(0.0);

    vert.push(halfSize + offsetX);
    vert.push(offsetY);
    vert.push(halfSize + offsetZ);
    
    vert.push(0.0);
    vert.push(1.0);
    vert.push(0.0);

    vert.push(1.0);
    vert.push(1.0);

    var buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vert), gl.STATIC_DRAW);
    gl.bindBuffer(gl.ARRAY_BUFFER, null);

    return buffer;
}

/*
**
*/
function drawQuad(quadBuffer, texture)
{
    var shader = gShaderManager.getShaderProgram('texture');

    if (shader != null)
    {
        gl.useProgram(shader.program);

        // vertex attribs (position and normal)
        var vertexAttrib = gl.getAttribLocation(shader.program, "position");
        var uvAttrib = gl.getAttribLocation(shader.program, "uv");

        gl.enableVertexAttribArray(vertexAttrib);
        gl.enableVertexAttribArray(uvAttrib);

        var tex0Uniform = gl.getUniformLocation(shader.program, 'textureMap');
        gl.uniform1i(tex0Uniform, 0);

        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, texture);

        var stride = 4 * Float32Array.BYTES_PER_ELEMENT;
        gl.bindBuffer(gl.ARRAY_BUFFER, quadBuffer)
        gl.vertexAttribPointer(vertexAttrib, 4, gl.FLOAT, false,24, 0);
        gl.vertexAttribPointer(uvAttrib, 2, gl.FLOAT, false, 24, stride);

        gl.drawArrays(gl.TRIANGLES, 0, 6);
    }
}



/*
**
*/
function createDepthTexture(width, height) {
    var depthTexture = null;
    var depthTextureEXT = gl.getExtension('WEBKIT_WEBGL_depth_texture');
    if (depthTextureEXT) {
        depthTexture = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, depthTexture);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.texImage2D(
            gl.TEXTURE_2D,
            0,
            gl.DEPTH_COMPONENT,
            width,
            height,
            0,
            gl.DEPTH_COMPONENT,
            gl.UNSIGNED_SHORT,
            null);
        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.TEXTURE_2D, depthTexture, 0);
        gl.bindTexture(gl.TEXTURE_2D, null);
    }

    return depthTexture;
}

/*
**
*/
function createTextures2(textureNames, callBack)
{
    var textures = new Array(textureNames.length);
    var numTextureLoaded = 0;
    for (var i = 0; i < textureNames.length; i++) {
        var textureName = textureNames[i];

        var texture = gl.createTexture();
        texture.image = new Image();
        texture.image.texture = texture;
        texture.image.onload = function () {
            gl.bindTexture(gl.TEXTURE_2D, this.texture);
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
                this);

            gl.bindTexture(gl.TEXTURE_2D, null);

            // place in array
            for (var j = 0; j < textureNames.length; j++)
            {
                if(this.src.indexOf(textureNames[j]) == this.src.length - textureNames[j].length)
                {
                    textures[j] = this.texture;
                    break;
                }
            }
            
            numTextureLoaded += 1;

            if (numTextureLoaded >= textureNames.length)
            {
                callBack(textures);
            }
        }

        texture.image.src = textureName;
        texture.image.index = i;
    }
}

/*
**
*/
function drawScene(shaderName, newFrameBuffer, camera)
{
    var oldFB = gl.getParameter(gl.FRAMEBUFFER_BINDING);
    gl.bindFramebuffer(gl.FRAMEBUFFER, newFrameBuffer);

    var shader = gShaderManager.getShaderProgram(shaderName);
    if (shader == null) {
        gl.bindFramebuffer(gl.FRAMEBUFFER, oldFB);
        return;
    }

    gl.useProgram(shader.program);
    var shader = gShaderManager.getShaderProgram(shaderName);
    if (shader) {
        gl.useProgram(shader.program);

        // uniforms
        var modelMatrixUniform = gl.getUniformLocation(shader.program, "modelMatrix");
        var viewMatrixUniform = gl.getUniformLocation(shader.program, 'viewMatrix');
        var projectionMatrixUniform = gl.getUniformLocation(shader.program, 'projMatrix');
        var normalMatrixUniform = gl.getUniformLocation(shader.program, 'normMatrix');
        var cameraTangentMatrixUniform = gl.getUniformLocation(shader.program, 'cameraTangentMatrix');

        // vertex attribs (position and normal)
        var vertexAttrib = gl.getAttribLocation(shader.program, "position");
        var normalAttrib = gl.getAttribLocation(shader.program, "normal");
        var uvAttrib = gl.getAttribLocation(shader.program, "uv");

        gl.enableVertexAttribArray(vertexAttrib);

        if (normalAttrib >= 0) {
            gl.enableVertexAttribArray(normalAttrib);
        }

        if (uvAttrib >= 0) {
            gl.enableVertexAttribArray(uvAttrib);
        }

        // texture uniforms
        var tex0Uniform = gl.getUniformLocation(shader.program, 'albedoSampler');
        var tex1Uniform = gl.getUniformLocation(shader.program, 'metalnessSampler');
        var tex2Uniform = gl.getUniformLocation(shader.program, 'roughnessSampler');
        var tex3Uniform = gl.getUniformLocation(shader.program, 'normalSampler');

        if (tex0Uniform && tex1Uniform && tex2Uniform && tex3Uniform) {
            gl.uniform1i(tex0Uniform, 0);
            gl.uniform1i(tex1Uniform, 1);
            gl.uniform1i(tex2Uniform, 2);
            gl.uniform1i(tex3Uniform, 3);
        }

        var stride = 3 * Float32Array.BYTES_PER_ELEMENT;
        if (viewMatrixUniform) {
            gl.uniformMatrix4fv(viewMatrixUniform, false, new Float32Array(camera.viewMatrix.entries));
        }

        if (projectionMatrixUniform) {
            gl.uniformMatrix4fv(projectionMatrixUniform, false, new Float32Array(camera.projectionMatrix.entries));
        }

        if (cameraTangentMatrixUniform) {
            // camera tangent space
            var up = new Vector3(0.0, 1.0, 0.0);
            var zAxis = camera.lookAt.subtract(camera.position);
            zAxis.normalize();
            var xAxis = up.cross(zAxis);
            var yAxis = zAxis.cross(xAxis);
            xAxis.normalize();
            yAxis.normalize();

            var cameraTangentMatrix = new Matrix44();
            cameraTangentMatrix.entries[0] = xAxis.x;
            cameraTangentMatrix.entries[1] = xAxis.y;
            cameraTangentMatrix.entries[2] = xAxis.z;
            cameraTangentMatrix.entries[4] = yAxis.x;
            cameraTangentMatrix.entries[5] = yAxis.y;
            cameraTangentMatrix.entries[6] = yAxis.z;
            cameraTangentMatrix.entries[7] = zAxis.x;
            cameraTangentMatrix.entries[8] = zAxis.y;
            cameraTangentMatrix.entries[9] = zAxis.z;

            gl.uniformMatrix4fv(cameraTangentMatrixUniform, false, new Float32Array(cameraTangentMatrix.entries));
        }

        gl.clearColor(0.0, 0.0, 0.0, 0.0);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        {
            var allModels = [gDVA];
            var allModelMatrices = [];
            var allNormalMatrices = [];
            for (var i = 0; i < allModels.length; i++) {
                // rotation
                var matRotY = new Matrix44();
                matRotY.rotateY(3.14159 * 1.87);
                var matRotX = new Matrix44();
                matRotX.rotateX(0.15);
                var totalRot = matRotX.multiply(matRotY);

                // translation
                var matTrans = new Matrix44();
                var posX = ((i - allModelMatrices.length / 2) + i);
                matTrans.translate(posX, 0.0, 0.0);

                // scaling
                var matScale = new Matrix44();
                matScale.scale(3.0, 3.0, 3.0);
                var matTransRot = matTrans.multiply(totalRot);

                // total
                var matModel = matScale.multiply(matTransRot);
                allModelMatrices.push(matModel);
                allNormalMatrices.push(totalRot);
            }

            drawCharacters(
                allModels,
                allModelMatrices,
                allNormalMatrices,
                modelMatrixUniform,
                normalMatrixUniform,
                vertexAttrib,
                normalAttrib,
                uvAttrib,
                true,
                0);
        }

        // pistol
        {
            var matRotX = new Matrix44();
            var matRotY = new Matrix44();
            var matRotZ = new Matrix44();
            var matRotYX = new Matrix44();
            var matRotZYX = new Matrix44();
            var matTrans = new Matrix44();

            matRotX.rotateX(gLookAngleY);
            matRotY.rotateY(gLookAngleX)
            matRotZ.rotateZ(Math.PI);
            matRotYX = matRotY.multiply(matRotX);
            matRotZYX = matRotZ.multiply(matRotYX);
            matTrans.translate(2.0, 1.0, 0.0);
            //var matModel = matTrans.multiply(matRotZYX);

            //var mat0 = cameraTangentMatrix.multiply(matTrans);
            var matModel = matTrans.multiply(matRotYX); // matRotZYX.multiply(mat0);

            drawCharacters(
                [gPistol],
                [matTrans],
                [new Matrix44()],
                modelMatrixUniform,
                normalMatrixUniform,
                vertexAttrib,
                normalAttrib,
                uvAttrib,
                true,
                0);
        }


        // ground
        (function drawGround()
        {
            if (gGround.textures == null)
            {
                return;
            }

            var stride = 3 * Float32Array.BYTES_PER_ELEMENT;
            for (var i = 0; i < gGround.textures.length; i++)
            {
                gl.activeTexture(gl.TEXTURE0 + i);
                gl.bindTexture(gl.TEXTURE_2D, gGround.textures[i]);
            }

            // matrix uniforms
            var matrix = new Matrix44();
            if (modelMatrixUniform) {
                gl.uniformMatrix4fv(modelMatrixUniform, false, new Float32Array(matrix.entries));
            }

            if (normalMatrixUniform) {
                gl.uniformMatrix4fv(normalMatrixUniform, false, new Float32Array(matrix.entries));
            }

            // vertex attribs (position and normal)
            var vertexAttrib = gl.getAttribLocation(shader.program, "position");
            var normalAttrib = gl.getAttribLocation(shader.program, "normal");
            var uvAttrib = gl.getAttribLocation(shader.program, "uv");

            gl.bindBuffer(gl.ARRAY_BUFFER, gGround.vbo)
            gl.vertexAttribPointer(vertexAttrib, 3, gl.FLOAT, false, 32, 0);
            if (normalAttrib >= 0) {
                gl.vertexAttribPointer(normalAttrib, 3, gl.FLOAT, false, 32, stride);
            }

            if (uvAttrib >= 0) {
                gl.vertexAttribPointer(uvAttrib, 2, gl.FLOAT, false, 32, stride + stride);
            }

            gl.drawArrays(gl.TRIANGLES, 0, 6);

        })();

        (function drawSky() {
            var shader = gShaderManager.getShaderProgram('sky');
            if (shader == null) {
                gl.bindFramebuffer(gl.FRAMEBUFFER, oldFB);
                return;
            }

            if (gEnvMap == null)
            {
                return;
            }

            gl.useProgram(shader.program);
            
            gl.disable(gl.CULL_FACE);

            var modelMatrixUniform = gl.getUniformLocation(shader.program, "modelMatrix");
            var viewMatrixUniform = gl.getUniformLocation(shader.program, 'viewMatrix');
            var projectionMatrixUniform = gl.getUniformLocation(shader.program, 'projMatrix');

            if (viewMatrixUniform) {
                gl.uniformMatrix4fv(viewMatrixUniform, false, new Float32Array(camera.viewMatrix.entries));
            }

            if (projectionMatrixUniform) {
                gl.uniformMatrix4fv(projectionMatrixUniform, false, new Float32Array(camera.projectionMatrix.entries));
            }

            var matrix = new Matrix44();
            if (modelMatrixUniform) {
                gl.uniformMatrix4fv(modelMatrixUniform, false, new Float32Array(matrix.entries));
            }

            // texture uniform
            var tex0Uniform = gl.getUniformLocation(shader.program, 'textureSampler');
            gl.uniform1i(tex0Uniform, 0);
            gl.activeTexture(gl.TEXTURE0);
            gl.bindTexture(gl.TEXTURE_CUBE_MAP, gEnvMap);

            // vertex attribs (position and normal)
            var vertexAttrib = gl.getAttribLocation(shader.program, "position");
            var normalAttrib = gl.getAttribLocation(shader.program, "normal");
            var uvAttrib = gl.getAttribLocation(shader.program, "uv");

            var stride = 3 * Float32Array.BYTES_PER_ELEMENT;
            gl.bindBuffer(gl.ARRAY_BUFFER, gSky.vbo)
            gl.vertexAttribPointer(vertexAttrib, 3, gl.FLOAT, false, 32, 0);
            if (normalAttrib >= 0) {
                gl.vertexAttribPointer(normalAttrib, 3, gl.FLOAT, false, 32, stride);
            }

            if (uvAttrib >= 0) {
                gl.vertexAttribPointer(uvAttrib, 2, gl.FLOAT, false, 32, stride + stride);
            }

            gl.drawArrays(gl.TRIANGLES, 0, gSky.numFaces * 3);

            gl.enable(gl.CULL_FACE);

        })();

        gl.bindFramebuffer(gl.FRAMEBUFFER, oldFB);

    }   // if valid shader 
}

/*
**
*/
function drawFromLight()
{
    drawScene('shadowmap', gLightViewFrameBuffers[0], gLightViewCameras[0]);
    drawScene('shadowmap', gLightViewFrameBuffers[1], gLightViewCameras[1]);
    drawScene('shadowmap', gLightViewFrameBuffers[2], gLightViewCameras[2]);
}

/*
**
*/
function drawMRT(shaderName) {
    drawScene('mrt', gMRTFramebuffer, gCamera);
}


/*
**
*/
function drawMRTFinal(quadBuffer) {
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    var shader = gShaderManager.getShaderProgram('mrt_pbr');
    if (shader != null) {
        gl.useProgram(shader.program);

        // light view camera matrix
        for (var i = 0; i < gLightViewCameras.length; i++) {
            var viewMatrixName = 'lightViewMatrix' + i;
            var projMatrixName = 'lightProjectionMatrix' + i;

            var lightViewMatrixUniform = gl.getUniformLocation(shader.program, viewMatrixName);
            var lightProjectionMatrixUniform = gl.getUniformLocation(shader.program, projMatrixName);
            gl.uniformMatrix4fv(lightViewMatrixUniform, false, new Float32Array(gLightViewCameras[i].viewMatrix.entries));
            gl.uniformMatrix4fv(lightProjectionMatrixUniform, false, new Float32Array(gLightViewCameras[i].projectionMatrix.entries));
        }

        // sampling and eye coordinates uniforms
        var sampleCoordUniform = gl.getUniformLocation(shader.program, 'afSamplePos');
        var eyeCoordUniform = gl.getUniformLocation(shader.program, 'eyePos');
        var lookDirUniform = gl.getUniformLocation(shader.program, 'lookDir');

        var lookDir = gCamera.lookAt.subtract(gCamera.position);
        lookDir.normalize();
        gl.uniform3f(lookDirUniform, lookDir.x, lookDir.y, lookDir.z);

        var samplePos = getSampleCoords(128);
        gl.uniform2fv(sampleCoordUniform, new Float32Array(samplePos));
        gl.uniform3f(eyeCoordUniform, gCamera.position.x, gCamera.position.y, gCamera.position.z);

        var lightPositionUniform = gl.getUniformLocation(shader.program, 'lightPosition');
        if (lightPositionUniform) {
            gl.uniform3f(lightPositionUniform, gLightViewCameras[0].position.x, gLightViewCameras[0].position.y, gLightViewCameras[0].position.z);
        }

        // attribs (position and uv)
        var vertexAttrib = gl.getAttribLocation(shader.program, "position");
        gl.enableVertexAttribArray(vertexAttrib);

        var uvAttrib = gl.getAttribLocation(shader.program, "uv");
        gl.enableVertexAttribArray(uvAttrib);

        var samplerNames =
        [
            'environmentSampler',
            'normalMap',
            'clipSpaceMap',
            'worldSpaceMap',
            'albedoMap',
            'normalSampler',
            'metalRoughnessMap',
        ];

        // texture map samplers
        var uniforms = [];
        for (var i = 0; i < samplerNames.length; i++) {
            uniforms.push(gl.getUniformLocation(shader.program, samplerNames[i]));
            gl.uniform1i(uniforms[i], i);
        }

        var lightViewUniform0 = gl.getUniformLocation(shader.program, 'lightViewDepthMap0');
        gl.uniform1i(lightViewUniform0, samplerNames.length);

        var lightViewUniform1 = gl.getUniformLocation(shader.program, 'lightViewDepthMap1');
        if (lightViewUniform1) {
            gl.uniform1i(lightViewUniform1, samplerNames.length + 1);
        }

        var lightViewUniform2 = gl.getUniformLocation(shader.program, 'lightViewDepthMap2');
        if (lightViewUniform2) {
            gl.uniform1i(lightViewUniform2, samplerNames.length + 2);
        }

        var clipSpaceUniform0 = gl.getUniformLocation(shader.program, 'uClipSpaceZ0');
        if (clipSpaceUniform0)
        {
            gl.uniform1f(clipSpaceUniform0, gFrustumClipZ[0][1]);
        }

        var clipSpaceUniform1 = gl.getUniformLocation(shader.program, 'uClipSpaceZ1');
        if (clipSpaceUniform1) {
            gl.uniform1f(clipSpaceUniform1, gFrustumClipZ[1][1]);
        }


        //var MRTEnum =
        //{
        //    NORMAL: 0,
        //    CLIPSPACE: 1,
        //    WORLDSPACE: 2,
        //    ALBEDO: 3,
        //    NORMALMAP: 4,
        //    METAL_ROUGHNESS: 5,
        //};

        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_CUBE_MAP, gEnvMap);

        for (var i = 0; i <= MRTEnum.NUM_MRT; i++) {
            gl.activeTexture(gl.TEXTURE0 + i + 1);
            gl.bindTexture(gl.TEXTURE_2D, gaMRTTextures[i]);
        }

        for (var i = 0; i < gLightViewTextures.length; i++) {
            gl.activeTexture(gl.TEXTURE0 + samplerNames.length + i);
            gl.bindTexture(gl.TEXTURE_2D, gLightViewTextures[i]);
        }

        var stride = 4 * Float32Array.BYTES_PER_ELEMENT;
        var vertexSize = (4 + 2) * Float32Array.BYTES_PER_ELEMENT;

        // draw
        var stride = 4 * Float32Array.BYTES_PER_ELEMENT;
        gl.bindBuffer(gl.ARRAY_BUFFER, gMRTFinalQuadBuffer)
        gl.vertexAttribPointer(vertexAttrib, 4, gl.FLOAT, false, vertexSize, 0);
        gl.vertexAttribPointer(uvAttrib, 2, gl.FLOAT, false, vertexSize, stride);

        gl.drawArrays(gl.TRIANGLES, 0, 6);
    }

    gl.disable(gl.DEPTH_TEST);
    drawCrossHair(gCrossHairInfo[0], gCrossHairInfo[1]);
    for (var i = 0; i < gaMRTQuadBuffer.length; i++) {
        drawQuad(gaMRTQuadBuffer[i], gaMRTTextures[i]);
    }

    for (var i = 0; i < gLightViewQuadBuffers.length; i++) {
        drawQuad(gLightViewQuadBuffers[i], gLightViewTextures[i]);
    }
    gl.enable(gl.DEPTH_TEST);
}

/*
**
*/
function loadData() {
    loadCharacter('http://localhost:8000/models/pokeball/pokeball.xml',
        function (character) {
            gPistol = character;
        });

    var floatArray = createSphere(30.0, 0.0, 0.0, 0.0, 12);

    gSky = new Model('sky');
    gSky.floatArray = new Float32Array(floatArray);
    gSky.updateVBO();
    gSky.numFaces = (gSky.floatArray.length / 8) / 3;
}

/*
**
*/
function getFrustumBounding(camera, cascadeIndex)
{
    var cascadeDistance = [1.0, 5.0, 20.0, 50.0];

    var near = cascadeDistance[cascadeIndex];
    var far = cascadeDistance[cascadeIndex + 1];

    var halfAngle = camera.fovAngle / 2;

    var nearLeftX = -near * Math.tan(halfAngle);
    var nearRightX = near * Math.tan(halfAngle);
    var nearZ = near;

    var farLeftX = -far * Math.tan(halfAngle);
    var farRightX = far * Math.tan(halfAngle);
    var farZ = far;

    var nearTopLeft = new Vector3(nearLeftX, nearRightX, nearZ);
    var nearTopRight = new Vector3(nearRightX, nearRightX, nearZ);

    var nearBottomLeft = new Vector3(nearLeftX, -nearRightX, nearZ);
    var nearBottomRight = new Vector3(nearRightX, -nearRightX, nearZ);

    var farTopLeft = new Vector3(farLeftX, farRightX, farZ);
    var farTopRight = new Vector3(farRightX, farRightX, farZ);

    var farBottomLeft = new Vector3(farLeftX, -farRightX, farZ);
    var farBottomRight = new Vector3(farRightX, -farRightX, farZ);

    var xforms = new Array(8);
    xforms[0] = camera.projectionMatrix.xform(nearTopLeft);
    xforms[1] = camera.projectionMatrix.xform(nearTopRight);
    xforms[2] = camera.projectionMatrix.xform(nearBottomLeft);
    xforms[3] = camera.projectionMatrix.xform(nearBottomRight);
    xforms[4] = camera.projectionMatrix.xform(farTopLeft);
    xforms[5] = camera.projectionMatrix.xform(farTopRight);
    xforms[6] = camera.projectionMatrix.xform(farBottomLeft);
    xforms[7] = camera.projectionMatrix.xform(farBottomRight);
    
    var smallestZ = xforms[0].z / xforms[0].w;
    var largestZ = smallestZ;
    for (var i = 0; i < xforms.length; i++)
    {
        var clipSpaceZ = xforms[i].z / xforms[i].w;
        if(clipSpaceZ < smallestZ)
        {
            smallestZ = clipSpaceZ;
        }

        if(clipSpaceZ > largestZ)
        {
            largestZ = clipSpaceZ;
        }
    }

    var coords = [];

    var inverseViewMatrix = camera.viewMatrix.invert();
    var check = camera.viewMatrix.multiply(inverseViewMatrix);

    coords.push(inverseViewMatrix.xform(nearTopLeft));
    coords.push(inverseViewMatrix.xform(nearTopRight));
    coords.push(inverseViewMatrix.xform(nearBottomLeft));
    coords.push(inverseViewMatrix.xform(nearBottomRight));

    coords.push(inverseViewMatrix.xform(farTopLeft));
    coords.push(inverseViewMatrix.xform(farTopRight));
    coords.push(inverseViewMatrix.xform(farBottomLeft));
    coords.push(inverseViewMatrix.xform(farBottomRight));
    
    return [coords, smallestZ, largestZ];
}

/*
**
*/
function getBounds(coords) {
    var smallest = new Vector3(9999.0, 9999.0, 9999.0);
    var largest = new Vector3(-9999.0, -9999.0, -9999.0);
    for (var i = 0; i < coords.length; i++) {
        if (smallest.x > coords[i].x) {
            smallest.x = coords[i].x;
        }

        if (largest.x < coords[i].x) {
            largest.x = coords[i].x;
        }

        if (smallest.y > coords[i].y) {
            smallest.y = coords[i].y;
        }

        if (largest.y < coords[i].y) {
            largest.y = coords[i].y;
        }

        if (smallest.z > coords[i].z) {
            smallest.z = coords[i].z;
        }

        if (largest.z < coords[i].z) {
            largest.z = coords[i].z;
        }
    }

    return [smallest, largest];
}