Vector3 = function (x, y, z)
{
    this.x = x;
    this.y = y;
    this.z = z;
}

Vector3.prototype.subtract = function (v)
{
    var ret = new Vector3(this.x - v.x,
                          this.y - v.y,
                          this.z - v.z);

    return ret;
}

Vector3.prototype.cross = function (v)
{
    var ret = new Vector3(0.0, 0.0, 0.0);
    ret.x = this.y * v.z - this.z * v.y;
    ret.y = this.z * v.x - this.x * v.z;
    ret.z = this.x * v.y - this.y * v.x;

    return ret;
}

Vector3.prototype.magnitude = function ()
{
    var length = Math.sqrt(this.x * this.x + this.y * this.y + this.z * this.z);
    return length;
}

Vector3.prototype.normalize = function ()
{
    var length = this.magnitude();
    if (Math.abs(length) > 0.0)
    {
        this.x /= length;
        this.y /= length;
        this.z /= length;
    }
}

Vector3.prototype.dot = function(v)
{
    var dp = this.x * v.x + this.y * v.y + this.z * v.z;
    return dp;
}

Vector4 = function (x, y, z, w) {
    this.x = x;
    this.y = y;
    this.z = z;
    this.w = 1.0;
}

Vector4.prototype.subtract = function (v) {
    var ret = new Vector4(this.x - v.x,
                          this.y - v.y,
                          this.z - v.z,
                          1.0);

    return ret;
}

Vector4.prototype.cross = function (v) {
    var ret = new Vector4(0.0, 0.0, 0.0, 1.0);
    ret.x = this.y * v.z - this.z * v.y;
    ret.y = this.z * v.x - this.x * v.z;
    ret.z = this.x * v.y - this.y * v.x;
    
    return ret;
}

Vector4.prototype.magnitude = function () {
    var length = Math.sqrt(this.x * this.x + this.y * this.y + this.z * this.z);
    return length;
}

Vector4.prototype.normalize = function () {
    var length = this.magnitude();
    if (Math.abs(length) > 0.0) {
        this.x /= length;
        this.y /= length;
        this.z /= length;
    }
}

Vector4.prototype.dot = function (v) {
    var dp = this.x * v.x + this.y * v.y + this.z * v.z;
    return dp;
}