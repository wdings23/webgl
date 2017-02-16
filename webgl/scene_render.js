var gl;

var MRTEnum =
{
    NORMAL: 0,
    CLIPSPACE: 1,
    WORLDSPACE: 2,
    ALBEDO: 3,
    NORMALMAP: 4,
    METAL_ROUGHNESS: 5,

    NUM_MRT: 6,
};

/*
**
*/
SceneRender = function(canvas, glUtils)
{
    var self = this;
    this.canvas = canvas;
    gl = canvas.getContext("webgl");
    if (!gl)
    {
        gl = canvas.getContext("experimental-webgl");
    }

    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.clearColor(0.0, 0.0, 0.0, 0.0);

    this.models = [];
    this.modelLoader = new ModelLoader();
    this.modelLoader.load('models/dva/dva.xml',
        function (character) {
            self.models.push(character);
        });

    this.modelLoader.load('http://localhost:8000/models/pokeball/pokeball.xml',
        function (character) {
            self.models.push(character);
        });

    this.glUtils = glUtils;

    this.shaderManager = new ShaderManager();
    this.shaderManager.readInAllShaders("shaders");

    this.lightViewFrameBuffers = new Array(3);
    this.lightViewTextures = new Array(3);

    [this.mrtFramebuffer, this.mrtTextures, this.depthTexture] = this.glUtils.createMRTTextures(this.canvas.clientWidth, this.canvas.clientHeight);

    [this.lightViewFrameBuffers[0], this.lightViewTextures[0]] = this.glUtils.createLightViewFrameBuffer(this.canvas.clientWidth, this.canvas.clientHeight);
    [this.lightViewFrameBuffers[1], this.lightViewTextures[1]] = this.glUtils.createLightViewFrameBuffer(this.canvas.clientWidth, this.canvas.clientHeight);
    [this.lightViewFrameBuffers[2], this.lightViewTextures[2]] = this.glUtils.createLightViewFrameBuffer(this.canvas.clientWidth, this.canvas.clientHeight);

    this.mrtFinalQuadBuffer = ModelUtils.createQuad(2.0, 0.0, 0.0);

    var floatArray = ModelUtils.createSphere(80.0, 0.0, 0.0, 0.0, 16);

    this.sky = new Model('sky');
    this.sky.floatArray = new Float32Array(floatArray);
    this.sky.updateVBO();
    this.sky.numFaces = (this.sky.floatArray.length / 8) / 3;

    this.ground = { vbo: null, textures: null };
    this.ground.vbo = ModelUtils.createGround(20.0, 0.0, -0.25, 0.0);
    (function createGroundTextures() {
        self.glUtils.createTextures2(['ground_albedo.jpeg', 'ground_metallic.jpeg', 'ground_roughness.jpeg', 'ground_normal.jpeg'],
            function (textures) {
                self.ground.textures = textures;
            });
    })();

    this.crossHairInfo = ModelUtils.createCrossHair(0.04);
   
    this.environmentMap = this.glUtils.createCubeTexture(
        [
            ['rightImage', gl.TEXTURE_CUBE_MAP_POSITIVE_X],
            ['leftImage', gl.TEXTURE_CUBE_MAP_NEGATIVE_X],
            ['topImage', gl.TEXTURE_CUBE_MAP_POSITIVE_Y],
            ['bottomImage', gl.TEXTURE_CUBE_MAP_NEGATIVE_Y],
            ['backImage', gl.TEXTURE_CUBE_MAP_POSITIVE_Z],
            ['frontImage', gl.TEXTURE_CUBE_MAP_NEGATIVE_Z],
        ]);

    [this.captureFrameBuffer, this.captureTextures, this.captureDepthTexture] = this.glUtils.createMRTTextures(128, 128);
    this.finalCaptureFrameBuffer = this.glUtils.createFrameBuffer(128, 128);

    gl.enable(gl.DEPTH_TEST);

    // debug texture quads
    this.mrtQuadBuffers = [];
    this.mrtQuadBuffers.push(ModelUtils.createQuad(0.4, -1.4, -0.5));
    this.mrtQuadBuffers.push(ModelUtils.createQuad(0.4, -0.9, -0.5));
    this.mrtQuadBuffers.push(ModelUtils.createQuad(0.4, -0.4, -0.5));
    this.mrtQuadBuffers.push(ModelUtils.createQuad(0.4, 0.1, -0.5));
    this.mrtQuadBuffers.push(ModelUtils.createQuad(0.4, 0.6, -0.5));
    this.mrtQuadBuffers.push(ModelUtils.createQuad(0.4, 1.1, -0.5));

    this.lightViewQuadBuffers = [];
    this.lightViewQuadBuffers.push(ModelUtils.createQuad(0.4, -1.4, 0.5));
    this.lightViewQuadBuffers.push(ModelUtils.createQuad(0.4, -0.9, 0.5));
    this.lightViewQuadBuffers.push(ModelUtils.createQuad(0.4, -0.4, 0.5));
}

/*
**
*/
SceneRender.prototype.render = function(camera, lightViewCameras, frustumClipZ)
{
    this.glUtils.gl.clearColor(1.0, 0.0, 0.0, 1.0);
    this.glUtils.gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    this.drawFromLight(lightViewCameras);

    if (this.takeScreenShot) {
        this.makeEnvironmentMap(new Vector3(0.0, 1.0, 0.0), lightViewCameras, frustumClipZ);
        this.takeScreenShot = false;
    }
    else {

        this.drawMRT(this.mrtFramebuffer, camera, 'mrt');
        this.drawMRTFinal(
            camera,
            null,
            this.mrtTextures,
            null,
            lightViewCameras,
            frustumClipZ,
            this.environmentMap,
            this.lightViewTextures,
            this.mrtFinalQuadBuffer);
    }
}

/*
**
*/
SceneRender.prototype.drawFromLight = function (lightViewCameras) {
    this.drawScene('shadowmap', this.lightViewFrameBuffers[0], lightViewCameras[0], this.models, null, this.ground, this.environmentMap);
    this.drawScene('shadowmap', this.lightViewFrameBuffers[1], lightViewCameras[1], this.models, null, this.ground, this.environmentMap);
    this.drawScene('shadowmap', this.lightViewFrameBuffers[2], lightViewCameras[2], this.models, null, this.ground, this.environmentMap);
}

/*
**
*/
SceneRender.prototype.drawMRT = function (frameBuffer, camera, shaderName) {
    this.drawScene('mrt', frameBuffer, camera, this.models, this.sky, this.ground, this.environmentMap);
}

/*
**
*/
SceneRender.prototype.drawScene = function (
    shaderName,
    newFrameBuffer,
    camera,
    models,
    sky,
    ground,
    environmentMap)
{
    var self = this;
    var oldFB = gl.getParameter(gl.FRAMEBUFFER_BINDING);
    gl.bindFramebuffer(gl.FRAMEBUFFER, newFrameBuffer);

    var shader = this.shaderManager.getShaderProgram(shaderName);
    if (shader == null) {
        gl.bindFramebuffer(gl.FRAMEBUFFER, oldFB);
        return;
    }

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

    if(models && models.length > 0)
    {
        var allModels = models;
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

        this.drawCharacters(
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

    // ground
    (function drawGround()
    {
        if (self.ground && (self.ground.textures == undefined || self.ground.textures == null))
        {
            return;
        }

        var stride = 3 * Float32Array.BYTES_PER_ELEMENT;
        for (var i = 0; i < self.ground.textures.length; i++)
        {
            gl.activeTexture(gl.TEXTURE0 + i);
            gl.bindTexture(gl.TEXTURE_2D, self.ground.textures[i]);
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

        gl.bindBuffer(gl.ARRAY_BUFFER, self.ground.vbo)
        gl.vertexAttribPointer(vertexAttrib, 3, gl.FLOAT, false, 32, 0);
        if (normalAttrib >= 0) {
            gl.vertexAttribPointer(normalAttrib, 3, gl.FLOAT, false, 32, stride);
        }

        if (uvAttrib >= 0) {
            gl.vertexAttribPointer(uvAttrib, 2, gl.FLOAT, false, 32, stride + stride);
        }

        gl.drawArrays(gl.TRIANGLES, 0, 6);

    })();

    if (sky) {
        (function drawSky() {
            var shader = self.shaderManager.getShaderProgram('sky');
            if (shader == null) {
                gl.bindFramebuffer(gl.FRAMEBUFFER, oldFB);
                return;
            }

            if (environmentMap == null) {
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
            gl.bindTexture(gl.TEXTURE_CUBE_MAP, environmentMap);

            // vertex attribs (position and normal)
            var vertexAttrib = gl.getAttribLocation(shader.program, "position");
            var normalAttrib = gl.getAttribLocation(shader.program, "normal");
            var uvAttrib = gl.getAttribLocation(shader.program, "uv");

            var stride = 3 * Float32Array.BYTES_PER_ELEMENT;
            gl.bindBuffer(gl.ARRAY_BUFFER, self.sky.vbo)
            gl.vertexAttribPointer(vertexAttrib, 3, gl.FLOAT, false, 32, 0);
            if (normalAttrib >= 0) {
                gl.vertexAttribPointer(normalAttrib, 3, gl.FLOAT, false, 32, stride);
            }

            if (uvAttrib >= 0) {
                gl.vertexAttribPointer(uvAttrib, 2, gl.FLOAT, false, 32, stride + stride);
            }

            gl.drawArrays(gl.TRIANGLES, 0, self.sky.numFaces * 3);

            gl.enable(gl.CULL_FACE);

        })();
    }

    gl.bindFramebuffer(gl.FRAMEBUFFER, oldFB);

    
}


/*
**
*/
SceneRender.prototype.drawCharacters = function(
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
SceneRender.prototype.makeEnvironmentMap = function(position, lightViewCameras, frustumClipZ) {
    var lookV = [
        new Vector3(1.0, 0.0, 0.0),
        new Vector3(-1.0, 0.0, 0.0),
        new Vector3(0.0, 1.0, 0.0),
        new Vector3(0.0, -1.0, 0.0),
        new Vector3(0.0, 0.0, -1.0),
        new Vector3(0.0, 0.0, 1.0)
    ];

    var crossImageDimension = 128 * 4;
    var crossImageArray = new ArrayBuffer(crossImageDimension * crossImageDimension * 4);
    var crossImageUint8Array = new Uint8Array(crossImageArray);

    var texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_CUBE_MAP, texture);
    gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
    gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MAG_FILTER, gl.LINEAR);

    var imagePos = [
        [256, 128],
        [0, 128],
        [128, 0],
        [128, 256],
        [128, 384],
        [128, 128],
    ];

    var flipYFlags = [
        false,
        false,
        true,
        false,
        true,
        false,
    ];

    var flipXFlags = [
        false,
        false,
        true,
        false,
        false,
        false,
    ]

    for (var dir = 0; dir < lookV.length; dir++) {
        var faceSide = gl.TEXTURE_CUBE_MAP_POSITIVE_X;
        switch (dir) {
            case 0:
                faceSide = gl.TEXTURE_CUBE_MAP_POSITIVE_X;
                break;
            case 1:
                faceSide = gl.TEXTURE_CUBE_MAP_NEGATIVE_X;
                break;
            case 2:
                faceSide = gl.TEXTURE_CUBE_MAP_POSITIVE_Y;
                break;
            case 3:
                faceSide = gl.TEXTURE_CUBE_MAP_NEGATIVE_Y;
                break;
            case 4:
                faceSide = gl.TEXTURE_CUBE_MAP_POSITIVE_Z;
                break;
            case 5:
                faceSide = gl.TEXTURE_CUBE_MAP_NEGATIVE_Z;
                break;
        }

        var lookAt = new Vector3(position.x + lookV[dir].x * 50.0, position.y + lookV[dir].y * 50.0, position.z + lookV[dir].z * 50.0);
        var camera = new Camera(position, lookAt);

        gl.viewport(0, 0, 128, 128);

        camera.computeViewMatrix();
        camera.updatePerspectiveProjection(100.0, 0.5, 128, 128);

        var arrayBuffer = new ArrayBuffer(128 * 128 * 4);
        var uint8Array = new Uint8Array(arrayBuffer);

        this.drawMRT(this.captureFrameBuffer, camera, 'mrt');
        this.drawMRTFinal(
            camera,
            this.finalCaptureFrameBuffer[0],
            this.captureTextures,
            uint8Array,
            lightViewCameras,
            frustumClipZ,
            this.environmentMap,
            this.lightViewTextures,
            this.mrtFinalQuadBuffer);

        gl.bindTexture(gl.TEXTURE_CUBE_MAP, texture);
        gl.texImage2D(
            faceSide,
            0,
            gl.RGBA,
            128,
            128,
            0,
            gl.RGBA,
            gl.UNSIGNED_BYTE,
            uint8Array);

        //var imageCanvas = document.createElement('canvas');
        //imageCanvas.width = 128;
        //imageCanvas.height = 128;
        //var context = imageCanvas.getContext('2d');
        //var imageData = context.createImageData(128, 128);
        //imageData.data.set(uint8Array);
        //context.putImageData(imageData, 0, 0);

        //var img = new Image();
        //img.src = imageCanvas.toDataURL();

        //var link = document.createElement('a');
        //link.href = img.src;
        //link.download = 'image' + dir + '.png';
        //link.click();

        writeToCrossImage(
            crossImageUint8Array,
            uint8Array,
            imagePos[dir][0],
            imagePos[dir][1],
            128,
            128,
            crossImageDimension,
            crossImageDimension,
            flipYFlags[dir],
            flipXFlags[dir]);
        
    }

    gl.generateMipmap(gl.TEXTURE_CUBE_MAP);
    gl.bindTexture(gl.TEXTURE_CUBE_MAP, null);

    gl.viewport(0, 0, this.canvas.clientWidth, this.canvas.clientHeight);

    var imageCanvas = document.createElement('canvas');
    imageCanvas.width = crossImageDimension;
    imageCanvas.height = crossImageDimension;
    var context = imageCanvas.getContext('2d');
    var imageData = context.createImageData(crossImageDimension, crossImageDimension);
    imageData.data.set(crossImageUint8Array);
    context.putImageData(imageData, 0, 0);

    var img = new Image();
    img.src = imageCanvas.toDataURL();

    var link = document.createElement('a');
    link.href = img.src;
    link.download = 'image' + dir + '.png';
    link.click();



    return texture;
}

/*
**
*/
function writeToCrossImage(
    result,
    image,
    imageX,
    imageY,
    imageWidth,
    imageHeight,
    resultWidth,
    resultHeight,
    flipY,
    flipX)
{
    for(var y = 0; y < imageHeight; y++)
    {
        var resultY = imageY + y;
        var currY = y;
        if (flipY)
        {
            currY = imageHeight - y - 1;
        }

        for(var x = 0; x < imageWidth; x++)
        {
            var resultX = imageX + x;
            var resultIndex = (resultY * resultWidth + resultX) * 4;
         
            var currX = x;
            if (flipX)
            {
                currX = imageWidth - x - 1;
            }

            var imageIndex = (currY * imageWidth + currX) * 4;

            result[resultIndex] = image[imageIndex];
            result[resultIndex+1] = image[imageIndex+1];
            result[resultIndex+2] = image[imageIndex+2];
            result[resultIndex+3] = image[imageIndex+3];
        }
    }
}

/*
**
*/
SceneRender.prototype.drawMRTFinal = function (
    camera,
    frameBuffer,
    mrtTextures,
    screenshotBuffer,
    lightViewCameras,
    frustumClipZ,
    environmentMap,
    lightViewTextures,
    mrtFinalQuadBuffer)
{
    var oldFB = gl.getParameter(gl.FRAMEBUFFER_BINDING);
    gl.bindFramebuffer(gl.FRAMEBUFFER, frameBuffer);

    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    var shader = this.shaderManager.getShaderProgram('mrt_pbr');
    if (shader != null) {
        gl.useProgram(shader.program);

        // light view camera matrix
        for (var i = 0; i < lightViewCameras.length; i++) {
            var viewMatrixName = 'lightViewMatrix' + i;
            var projMatrixName = 'lightProjectionMatrix' + i;

            var lightViewMatrixUniform = gl.getUniformLocation(shader.program, viewMatrixName);
            var lightProjectionMatrixUniform = gl.getUniformLocation(shader.program, projMatrixName);
            gl.uniformMatrix4fv(lightViewMatrixUniform, false, new Float32Array(lightViewCameras[i].viewMatrix.entries));
            gl.uniformMatrix4fv(lightProjectionMatrixUniform, false, new Float32Array(lightViewCameras[i].projectionMatrix.entries));
        }

        // sampling and eye coordinates uniforms
        var sampleCoordUniform = gl.getUniformLocation(shader.program, 'afSamplePos');
        var eyeCoordUniform = gl.getUniformLocation(shader.program, 'eyePos');
        var lookDirUniform = gl.getUniformLocation(shader.program, 'lookDir');

        var lookDir = camera.lookAt.subtract(camera.position);
        lookDir.normalize();
        gl.uniform3f(lookDirUniform, lookDir.x, lookDir.y, lookDir.z);

        var samplePos = this.getSampleCoords(128);
        gl.uniform2fv(sampleCoordUniform, new Float32Array(samplePos));
        gl.uniform3f(eyeCoordUniform, camera.position.x, camera.position.y, camera.position.z);

        var lightPositionUniform = gl.getUniformLocation(shader.program, 'lightPosition');
        if (lightPositionUniform) {
            gl.uniform3f(lightPositionUniform, lightViewCameras[0].position.x, lightViewCameras[0].position.y, lightViewCameras[0].position.z);
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
        if (clipSpaceUniform0) {
            gl.uniform1f(clipSpaceUniform0, frustumClipZ[0][1]);
        }

        var clipSpaceUniform1 = gl.getUniformLocation(shader.program, 'uClipSpaceZ1');
        if (clipSpaceUniform1) {
            gl.uniform1f(clipSpaceUniform1, frustumClipZ[1][1]);
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
        gl.bindTexture(gl.TEXTURE_CUBE_MAP, environmentMap);

        for (var i = 0; i <= MRTEnum.NUM_MRT; i++) {
            gl.activeTexture(gl.TEXTURE0 + i + 1);
            gl.bindTexture(gl.TEXTURE_2D, mrtTextures[i]);
        }

        for (var i = 0; i < lightViewTextures.length; i++) {
            gl.activeTexture(gl.TEXTURE0 + samplerNames.length + i);
            gl.bindTexture(gl.TEXTURE_2D, lightViewTextures[i]);
        }

        var stride = 4 * Float32Array.BYTES_PER_ELEMENT;
        var vertexSize = (4 + 2) * Float32Array.BYTES_PER_ELEMENT;

        // draw
        var stride = 4 * Float32Array.BYTES_PER_ELEMENT;
        gl.bindBuffer(gl.ARRAY_BUFFER, mrtFinalQuadBuffer)
        gl.vertexAttribPointer(vertexAttrib, 4, gl.FLOAT, false, vertexSize, 0);
        gl.vertexAttribPointer(uvAttrib, 2, gl.FLOAT, false, vertexSize, stride);

        gl.drawArrays(gl.TRIANGLES, 0, 6);
    }

    if (screenshotBuffer != undefined && screenshotBuffer) {
        gl.readPixels(0, 0, 128, 128, gl.RGBA, gl.UNSIGNED_BYTE, screenshotBuffer);
        for (var y = 0; y < 128 / 2; y++) {
            for (var x = 0; x < 128; x++) {
                for (var pix = 0; pix < 4; pix++) {
                    var index0 = (y * 128 + x) * 4 + pix;
                    var index1 = ((128 - y - 1) * 128 + x) * 4 + pix;

                    var temp = screenshotBuffer[index0];
                    screenshotBuffer[index0] = screenshotBuffer[index1];
                    screenshotBuffer[index1] = temp;
                }
            }
        }
    }


    gl.bindFramebuffer(gl.FRAMEBUFFER, oldFB);
    this.drawRenderTargets(mrtTextures, lightViewTextures);
}

/*
**
*/
SceneRender.prototype.drawRenderTargets = function(mrtTextures, lightViewTextures)
{
    gl.disable(gl.DEPTH_TEST);
    //ModelUtils.drawCrossHair(gCrossHairInfo[0], gCrossHairInfo[1]);
    for (var i = 0; i < this.mrtQuadBuffers.length; i++) {
        ModelUtils.drawQuad(this.mrtQuadBuffers[i], mrtTextures[i]);
    }

    for (var i = 0; i < this.lightViewQuadBuffers.length; i++) {
        ModelUtils.drawQuad(this.lightViewQuadBuffers[i], lightViewTextures[i]);
    }
    gl.enable(gl.DEPTH_TEST);
}

/*
**
*/
SceneRender.prototype.getSampleCoords = function (numSamples)
{
    var ret = [];

    for (var i = 0; i < numSamples; i++) {
        var xiX = i / numSamples;
        var xiY = this.radicalInverseVDC(i);

        ret.push(xiX);
        ret.push(xiY);
    }

    return ret;
}

/*
**
*/
SceneRender.prototype.radicalInverseVDC = function(iBits) {
    iBits = (iBits << 16) | (iBits >> 16);
    iBits = ((iBits & 0x55555555) << 1) | ((iBits & 0xAAAAAAAA) >> 1);
    iBits = ((iBits & 0x33333333) << 2) | ((iBits & 0xCCCCCCCC) >> 2);
    iBits = ((iBits & 0x0F0F0F0F) << 4) | ((iBits & 0xF0F0F0F0) >> 4);
    iBits = ((iBits & 0x00FF00FF) << 8) | ((iBits & 0xFF00FF00) >> 8);

    //return (iBits / 0x100000000);
    return (iBits * 2.3283064365386963e-10);
}