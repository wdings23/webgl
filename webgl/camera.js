Camera = function(pos, lookAt)
{
    this.position = pos;
    this.lookAt = lookAt;
    this.matrix = new Matrix44();
    this.projectionType = 0;
    this.viewMatrix = new Matrix44();
    this.projectionMatrix = new Matrix44();
}

Camera.prototype.update = function(up, far, near, width, height)
{
    var lookAt = this.lookAt.subtract(this.position);
    lookAt.normalize();

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

    var transMatrix = new Matrix44();
    transMatrix.entries[12] = -this.position.x;
    transMatrix.entries[13] = -this.position.y;
    transMatrix.entries[14] = -this.position.z;

    this.viewMatrix = rotMatrix.multiply(transMatrix);

    var f = Math.tan(Math.PI / 3.);

    var oneOverFarMinusNear = 1.0 / (far - near);
    var aspectRatio = 1280.0 / 768.0;


    this.projectionMatrix.entries[0] = f;
    this.projectionMatrix.entries[5] = f * aspectRatio;

    this.projectionMatrix.entries[10] = (far + near) * oneOverFarMinusNear;
    this.projectionMatrix.entries[11] = -1.0;

    this.projectionMatrix.entries[14] = 2.0 * far * near * oneOverFarMinusNear;
    this.projectionMatrix.entries[15] = 0.0;

    var mat = this.projectionMatrix.transpose();
    this.projectionMatrix = mat;

    //this.matrix = this.projectionMatrix.multiply(this.viewMatrix);
}