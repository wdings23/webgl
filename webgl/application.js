/*
**
*/
Application = function (canvas) {
    
    this.camera = new Camera(new Vector3(0.0, 1.0, -2.0), new Vector3(0.0, 0.0, 100.0));

    this.lightViewCameras = [];

    this.glUtils = new GLUtils(canvas);
    
    this.canvas = canvas;
    this.takeScreenShot = false;

    this.zValue = 0.0;
    this.zValueInc = 1.0;

    this.frustumClipZ = new Array(3);
    this.sceneRender = new SceneRender(canvas, this.glUtils);
    this.keyDown = {};

    this.lightViewFrameBuffers = new Array(3);
    this.lightViewTextures = new Array(3);
    this.lightViewCameras = [];

    this.lookAngleX = 0.0;
    this.lookAngleY = 0.0;

    this.lightDir = new Vector3(1.0, -3.0, -1.0);
}

/*
**
*/
Application.prototype.init = function () {
    var self = this;
    gl.getExtension("OES_standard_derivatives");

    this.initEvents();

    if (this.glUtils.gl) {

        this.camera = new Camera(new Vector3(0.0, 1.0, -2.0), new Vector3(0.0, 0.0, 100.0));
        this.lightViewCameras.push(new Camera(new Vector3(-6.0, 10.0, 4.0), new Vector3(0.0, 0.0, 0.0)));
        this.lightViewCameras.push(new Camera(new Vector3(-6.0, 10.0, 4.0), new Vector3(0.0, 0.0, 0.0)));
        this.lightViewCameras.push(new Camera(new Vector3(-6.0, 10.0, 4.0), new Vector3(0.0, 0.0, 0.0)));

        this.tick();
    }
}

/*
**
*/
Application.prototype.initEvents = function () {

    var self = this;
    document.body.onclick = function (event) {
        self.canvas.requestPointerLock = self.canvas.requestPointerLock || self.canvas.mozRequestPointerLock;
        self.canvas.requestPointerLock();
    }

    document.body.onmouseenter = function (event) {
    }

    document.body.onmousemove = function (event) {

        if (self.camera === undefined) {
            return;
        }

        if (document.pointerLockElement === null) {
            return;
        }

        if (document.pointerLockElement !== undefined && document.pointerLockElement !== null) {
            if (document.pointerLockElement.id != self.canvas.id) {
                return;
            }
        }

        if (document.mozPointerLockElement !== undefined) {
            if (document.mozPointerLockElement.id != self.canvas.id) {
                return;
            }
        }

        var diffX = event.movementX;
        var diffY = event.movementY;

        var speedMultiplier = 0.005;

        var rotMatrixX = new Matrix44();
        var rotMatrixY = new Matrix44();

        var lookAt = self.camera.lookAt.subtract(self.camera.position)
        lookAt.normalize();

        var incX = (diffX * speedMultiplier) / (Math.PI * 2.0);
        var incY = (diffY * speedMultiplier) / (Math.PI * 0.5);

        self.lookAngleX += incX;
        self.lookAngleY += incY;

        if (self.lookAngleY <= -Math.PI * 0.49) {
            self.lookAngleY = -Math.PI * 0.49;
        }
        else if (self.lookAngleY > Math.PI * 0.49) {
            self.lookAngleY = Math.PI * 0.49;
        }

        rotMatrixX.rotateX(self.lookAngleY);
        rotMatrixY.rotateY(self.lookAngleX);
        var rotMatrix = rotMatrixY.multiply(rotMatrixX);

        var defaultLook = new Vector3(0.0, 0.0, 1.0);
        var newLookAt = rotMatrix.xform(defaultLook);
        self.camera.lookAt.x = newLookAt.x * 100.0;
        self.camera.lookAt.y = newLookAt.y * 100.0;
        self.camera.lookAt.z = newLookAt.z * 100.0;

    }

    var self = this;
    window.setInterval(function () { self.handleKeyboard(); }, 16);
    window.addEventListener('keydown', function (event) { self.onKeyDown(event); });
    window.addEventListener('keyup', function (event) { self.onKeyUp(event); });
}

/*
**
*/
Application.prototype.tick = function ()
{
    var self = this;
    window.requestAnimationFrame(
        function () {
            self.tick();
        });

    if (!this.sceneRender.shaderManager.finishLoading()) {
        return;
    }

    this.update();
    this.sceneRender.render(this.camera, this.lightViewCameras, this.frustumClipZ);

    this.updateUI();
}

/*
**
*/
Application.prototype.update = function()
{
    if (Math.abs(this.zValue) >= 1.0) {
        this.zValueInc *= -1.0;
    }

    this.camera.computeViewMatrix();
    this.camera.updatePerspectiveProjection(100.0, 0.5, this.canvas.clientWidth, this.canvas.clientHeight);

    this.fitShadowFrustum();
}

/*
**
*/
Application.prototype.handleKeyboard = function() {
    var up = new Vector3(0.0, 1.0, 0.0);
    var zAxis = this.camera.lookAt.subtract(this.camera.position);
    var xAxis = up.cross(zAxis);
    var yAxis = zAxis.cross(xAxis);

    xAxis.normalize();
    yAxis.normalize();
    zAxis.normalize();

    var speed = 0.05;
    var lookDistance = 100.0;
    var lookAt = this.camera.lookAt.subtract(this.camera.position);
    lookAt.normalize();

    if (this.keyDown['w']) {
        this.camera.position.x += zAxis.x * speed;
        this.camera.position.y += zAxis.y * speed;
        this.camera.position.z += zAxis.z * speed;

        this.camera.lookAt.x = this.camera.position.x + lookAt.x * lookDistance;
        this.camera.lookAt.y = this.camera.position.y + lookAt.y * lookDistance;
        this.camera.lookAt.z = this.camera.position.z + lookAt.z * lookDistance;
    }
    else if (this.keyDown['s']) {
        this.camera.position.x -= zAxis.x * speed;
        this.camera.position.y -= zAxis.y * speed;
        this.camera.position.z -= zAxis.z * speed;

        this.camera.lookAt.x = this.camera.position.x + lookAt.x * lookDistance;
        this.camera.lookAt.y = this.camera.position.y + lookAt.y * lookDistance;
        this.camera.lookAt.z = this.camera.position.z + lookAt.z * lookDistance;
    }
    else if (this.keyDown['a']) {
        this.camera.position.x -= xAxis.x * speed;
        this.camera.position.y -= xAxis.y * speed;
        this.camera.position.z -= xAxis.z * speed;

        this.camera.lookAt.x = this.camera.position.x + lookAt.x * lookDistance;
        this.camera.lookAt.y = this.camera.position.y + lookAt.y * lookDistance;
        this.camera.lookAt.z = this.camera.position.z + lookAt.z * lookDistance;
    }
    else if (this.keyDown['d']) {
        this.camera.position.x += xAxis.x * speed;
        this.camera.position.y += xAxis.y * speed;
        this.camera.position.z += xAxis.z * speed;

        this.camera.lookAt.x = this.camera.position.x + lookAt.x * lookDistance;
        this.camera.lookAt.y = this.camera.position.y + lookAt.y * lookDistance;
        this.camera.lookAt.z = this.camera.position.z + lookAt.z * lookDistance;
    }
    else if (this.keyDown['ArrowUp']) {
        this.camera.position.y += speed;
        this.camera.lookAt.y += speed;
    }
    else if (this.keyDown['ArrowDown']) {
        this.camera.position.y -= speed;
        this.camera.lookAt.y -= speed;
    }
    else if (this.keyDown['k']) {
        this.takeScreenShot = true;
    }
}

/*
**
*/
Application.prototype.onKeyDown = function(event) {
    this.keyDown[event.key] = true;
}

/*
**
*/
Application.prototype.onKeyUp = function (event) {
    delete this.keyDown[event.key];
}

/*
**
*/
Application.prototype.fitShadowFrustum = function()
{
    for (var cameraIndex = 0; cameraIndex < this.lightViewCameras.length; cameraIndex++) {
        // frustum's world position and bound
        var worldSpaceFrustumInfo = this.getFrustumBounding(this.camera, cameraIndex, this.canvas.clientWidth, this.canvas.clientHeight);
        var worldSpaceFrustumCoords = worldSpaceFrustumInfo[0];

        this.frustumClipZ[cameraIndex] = [worldSpaceFrustumInfo[1], worldSpaceFrustumInfo[2]];

        var bounds = this.getBounds(worldSpaceFrustumCoords);
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
        if (frustumBounds.y > frustumBounds.x && frustumBounds.y > frustumBounds.z) {
            largestCoord = frustumBounds.y;
        }
        else if (frustumBounds.z > frustumBounds.x && frustumBounds.z > frustumBounds.y) {
            largestCoord = frustumBounds.z;
        }


        var lightPos = new Vector3(
            center.x - this.lightDir.x * largestCoord,
            center.y - this.lightDir.y * largestCoord,
            center.z - this.lightDir.z * largestCoord);

        // update view matrix with new position and look at
        this.lightViewCameras[cameraIndex].position = lightPos;
        this.lightViewCameras[cameraIndex].lookAt = center;
        this.lightViewCameras[cameraIndex].computeViewMatrix();

        // transform to light space
        var lightSpaceFrustumCoords = [];
        for (var i = 0; i < worldSpaceFrustumCoords.length; i++) {
            lightSpaceFrustumCoords.push(this.lightViewCameras[cameraIndex].viewMatrix.xform(worldSpaceFrustumCoords[i]));
        }

        var lightSpaceBounds = this.getBounds(lightSpaceFrustumCoords);
        var diff = new Vector3(
            lightSpaceBounds[1].x - lightSpaceBounds[0].x,
            lightSpaceBounds[1].y - lightSpaceBounds[0].y,
            lightSpaceBounds[1].z - lightSpaceBounds[0].z);

        var center = new Vector3(
            (lightSpaceBounds[1].x + lightSpaceBounds[0].x) / 2,
            (lightSpaceBounds[1].y + lightSpaceBounds[0].y) / 2,
            (lightSpaceBounds[1].z + lightSpaceBounds[0].z) / 2);

        var largestBound = diff.x;
        if (diff.y > diff.x && diff.y > diff.z) {
            largestBound = diff.y;
        }
        else if (diff.z > diff.x && diff.z > diff.y) {
            largestBound = diff.z;
        }

        // sphere test for getting the correct ortho projection size to encompass the frustum part
        var multX = 0.5;
        var multY = 0.5;
        var multZ = 0.5;
        while (true) {
            var doneX = true;
            var doneY = true;
            var doneZ = true;

            var newLargestBoundX = diff.x * multX;
            var newLargestBoundY = diff.y * multY;
            var newLargestBoundZ = diff.z * multZ;

            for (var i = 0; i < lightSpaceFrustumCoords.length; i++) {
                var centerToFrustumV = lightSpaceFrustumCoords[i].subtract(center);
                var length = centerToFrustumV.magnitude();

                if (length >= newLargestBoundX) {
                    doneX = false;
                    break;
                }

                if (length >= newLargestBoundY) {
                    doneY = false;
                    break;
                }

                if (length >= newLargestBoundZ) {
                    doneZ = false;
                    break;
                }
            }

            if (doneX && doneY && doneZ) {
                break;
            }
            else {
                if (!doneX) {
                    multX += 0.05;
                }

                if (!doneY) {
                    multY += 0.05;
                }

                if (!doneZ) {
                    multZ += 0.05;
                }
            }

        }

        this.lightViewCameras[cameraIndex].updateOrthographicProjection(
            center.x - diff.x * multX,
            center.x + diff.x * multX,
            center.y - diff.y * multY,
            center.y + diff.y * multY,
            center.z - diff.z * multZ,
            center.z + diff.z * multZ);
    }
}

/*
**
*/
Application.prototype.updateUI = function ()
{
    var pos = document.getElementById('position');
    pos.innerText = 'position ' + this.camera.position.x + ' ' + this.camera.position.y + ' ' + this.camera.position.z;

    var lookAt = document.getElementById('lookAt');
    lookAt.innerText = 'lookAt ' + this.camera.lookAt.x + ' ' + this.camera.lookAt.y + ' ' + this.camera.lookAt.z;
}

/*
**
*/
Application.prototype.getBounds = function (coords)
{
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

/*
**
*/
Application.prototype.getFrustumBounding = function (camera, cascadeIndex, width, height) {
    var cascadeDistance = [1.0, 5.0, 20.0, 50.0];
    var aspectRatio = width / height;

    var near = cascadeDistance[cascadeIndex];
    var far = cascadeDistance[cascadeIndex + 1];

    var halfAngle = camera.fovAngle / 2;

    var nearLeftX = -near * Math.tan(halfAngle) * aspectRatio;
    var nearRightX = near * Math.tan(halfAngle) * aspectRatio;
    var nearZ = near;

    var farLeftX = -far * Math.tan(halfAngle) * aspectRatio;
    var farRightX = far * Math.tan(halfAngle) * aspectRatio;
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
    for (var i = 0; i < xforms.length; i++) {
        var clipSpaceZ = xforms[i].z / xforms[i].w;
        if (clipSpaceZ < smallestZ) {
            smallestZ = clipSpaceZ;
        }

        if (clipSpaceZ > largestZ) {
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

function testRaySphere(origin, direction, center, radius) {
    var radius2 = radius * radius;
    var l = center.subtract(origin);
    var tca = l.dot(direction);
    var d2 = l.dot(l) - tca * tca;
    if (d2 > radius2) {
        return [-1, -1];
    }

    var thc = Math.sqrt(radius2 - d2);
    var t0 = tca - thc;
    var t1 = tca + thc;

    return [t0, t1];
}

