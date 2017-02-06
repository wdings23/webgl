var gl;

/*
**
*/
GLUtils = function (canvas)
{
    this.gl = canvas.getContext("webgl");
    if (!this.gl) {
        this.gl = canvas.getContext("experimental-webgl");
    }

    gl = this.gl;
    
}

/*
**
*/
GLUtils.prototype.createMRTTextures = function (width, height)
{
    console.log(gl.getSupportedExtensions());

    var drawBuffersEXT = gl.getExtension('WEBGL_draw_buffers');
    var floatingPointTextureEXT = gl.getExtension('OES_texture_float');

    if (floatingPointTextureEXT == null || drawBuffersEXT == null) {
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
            width,
            height,
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
    gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT16, width, height);
    gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, depthRenderBuffer);

    drawBuffersEXT.drawBuffersWEBGL([
        drawBuffersEXT.COLOR_ATTACHMENT0_WEBGL,
        drawBuffersEXT.COLOR_ATTACHMENT1_WEBGL,
        drawBuffersEXT.COLOR_ATTACHMENT2_WEBGL,
        drawBuffersEXT.COLOR_ATTACHMENT3_WEBGL,
        drawBuffersEXT.COLOR_ATTACHMENT4_WEBGL,
        drawBuffersEXT.COLOR_ATTACHMENT5_WEBGL,
    ]);

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

    var depthTexture = this.createDepthTexture(width, height);

    gl.bindFramebuffer(gl.FRAMEBUFFER, oldFB);
    gl.bindRenderbuffer(gl.RENDERBUFFER, null);

    return [frameBuffer, mrtTextures, depthTexture];
}

/*
**
*/
GLUtils.prototype.createFBTextures = function (width, height)
{
    var drawBuffersEXT = gl.getExtension('WEBGL_draw_buffers');
    var floatingPointTextureEXT = gl.getExtension('OES_texture_float');
    
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
        width,
        height,
        0,
        gl.RGBA,
        gl.FLOAT,
        null);

    gl.framebufferTexture2D(gl.FRAMEBUFFER, drawBuffersEXT.COLOR_ATTACHMENT0_WEBGL, gl.TEXTURE_2D, texture, 0);

    var depthRenderBuffer = gl.createRenderbuffer();
    gl.bindRenderbuffer(gl.RENDERBUFFER, depthRenderBuffer);
    gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT16, width, height);
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
GLUtils.prototype.createDepthTexture = function (width, height)
{
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
GLUtils.prototype.createTextures2 = function(textureNames, callBack)
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
GLUtils.prototype.createCubeTexture = function (ids)
{
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
GLUtils.prototype.createFrameBuffer = function (width, height)
{
    var drawBuffersEXT = gl.getExtension('WEBGL_draw_buffers');
    var oldFB = gl.getParameter(gl.FRAMEBUFFER_BINDING);

    var frameBuffer = gl.createFramebuffer();
    gl.bindFramebuffer(gl.FRAMEBUFFER, frameBuffer);

    var depthRenderBuffer = gl.createRenderbuffer();
    gl.bindRenderbuffer(gl.RENDERBUFFER, depthRenderBuffer);
    gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT16, width, height);
    gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, depthRenderBuffer);

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
        width,
        height,
        0,
        gl.RGBA,
        gl.UNSIGNED_BYTE,
        null);

    gl.framebufferTexture2D(gl.FRAMEBUFFER, drawBuffersEXT.COLOR_ATTACHMENT0_WEBGL, gl.TEXTURE_2D, texture, 0);

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
GLUtils.prototype.createLightViewFrameBuffer = function(width, height) {
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
    gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT16, width, height);
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