Camera = function(pos, lookAt)
{
    this.position = pos;
    this.lookAt = lookAt;
    this.matrix = new Matrix44();
    this.projectionType = 0;
    this.viewMatrix = new Matrix44();
    this.rotMatrix = null;
    this.projectionMatrix = new Matrix44();
    this.fovAngle = Math.PI * 0.5;
}

Camera.prototype.computeViewMatrix = function()
{
    var up = new Vector3(0.0, 1.0, 0.0);
    var lookAt = this.lookAt.subtract(this.position);
    lookAt.normalize();
    if (Math.abs(lookAt.y) >= 0.9999) {
        up.x = 0.0; up.y = 0.0; up.z = 1.0;
    }

    var zAxis = lookAt;
    var xAxis = up.cross(lookAt);
    xAxis.normalize();

    var yAxis = zAxis.cross(xAxis);
    yAxis.normalize();

    var rotMatrix = new Matrix44();

    rotMatrix.entries[0] = xAxis.x;
    rotMatrix.entries[4] = xAxis.y;
    rotMatrix.entries[8] = xAxis.z;

    rotMatrix.entries[1] = yAxis.x;
    rotMatrix.entries[5] = yAxis.y;
    rotMatrix.entries[9] = yAxis.z;

    rotMatrix.entries[2] = zAxis.x;
    rotMatrix.entries[6] = zAxis.y;
    rotMatrix.entries[10] = zAxis.z;

    this.rotMatrix = rotMatrix;

    var transMatrix = new Matrix44();
    transMatrix.entries[12] = -this.position.x;
    transMatrix.entries[13] = -this.position.y;
    transMatrix.entries[14] = -this.position.z;

    this.viewMatrix = rotMatrix.multiply(transMatrix);
}

Camera.prototype.updateOrthographicProjection = function (left, right, bottom, top, near, far)
{
    for (var i = 0; i < 16; i++)
    {
        this.projectionMatrix.entries[i] = 0.0;
    }

    this.projectionMatrix.entries[0] = this.projectionMatrix.entries[5] = this.projectionMatrix.entries[10] = this.projectionMatrix.entries[15] = 1.0;

    this.projectionMatrix.entries[0] = 2.0 / (right - left);
    this.projectionMatrix.entries[5] = 2.0 / (top - bottom);
    this.projectionMatrix.entries[10] = 2.0 / (far - near);
    this.projectionMatrix.entries[3] = -(right + left) / (right - left);
    this.projectionMatrix.entries[7] = -(top + bottom) / (top - bottom);
    this.projectionMatrix.entries[11] = -(far + near) / (far - near);

    var mat = this.projectionMatrix.transpose();
    this.projectionMatrix = mat;
}

Camera.prototype.updatePerspectiveProjection = function(far, near, width, height)
{
    var fov = Math.tan(this.fovAngle / Math.PI);

    var oneOverFarMinusNear = 1.0 / (far - near);
    var aspectRatio = width / height;

    this.projectionMatrix.entries[0] = fov;
    this.projectionMatrix.entries[5] = fov * aspectRatio;

    this.projectionMatrix.entries[10] = (far + near) * oneOverFarMinusNear;
    this.projectionMatrix.entries[11] = -1.0;

    this.projectionMatrix.entries[14] = 2.0 * far * near * oneOverFarMinusNear;
    this.projectionMatrix.entries[15] = 0.0;

    var mat = this.projectionMatrix.transpose();
    this.projectionMatrix = mat;
    
}