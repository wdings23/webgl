// column major matrix

Matrix44 = function()
{
    this.entries =
    [
        1.0, 0.0, 0.0, 0.0,
        0.0, 1.0, 0.0, 0.0,
        0.0, 0.0, 1.0, 0.0,
        0.0, 0.0, 0.0, 1.0
    ];
}

Matrix44.prototype.copy = function(matrix)
{
    this.entries = [];
    for(var i = 0; i < 16; i++)
    {
        this.entries.push(matrix.entries[i]);
    }
}

Matrix44.prototype.identity = function ()
{
    this.entries =
    [
        1.0, 0.0, 0.0, 0.0,
        0.0, 1.0, 0.0, 0.0,
        0.0, 0.0, 1.0, 0.0,
        0.0, 0.0, 0.0, 1.0
    ];
}

Matrix44.prototype.translate = function (x, y, z)
{
    this.identity();

    this.entries[12] = x;
    this.entries[13] = y;
    this.entries[14] = z;
}

Matrix44.prototype.scale = function (x, y, z)
{
    this.entries[0] = x;
    this.entries[5] = y;
    this.entries[10] = z;
}

Matrix44.prototype.rotateX = function (angle)
{
    this.entries[5] = Math.cos(angle);
    this.entries[6] = Math.sin(angle);

    this.entries[9] = -Math.sin(angle);
    this.entries[10] = Math.cos(angle);
}

Matrix44.prototype.rotateY = function (angle)
{
    this.entries[0] = Math.cos(angle);
    this.entries[2] = -Math.sin(angle);

    this.entries[8] = Math.sin(angle);
    this.entries[10] = Math.cos(angle);
}

Matrix44.prototype.rotateZ = function (angle)
{
    this.entries[0] = Math.cos(angle);
    this.entries[1] = Math.sin(angle);

    this.entries[4] = -Math.sin(angle);
    this.entries[5] = Math.cos(angle);
}

Matrix44.prototype.multiply = function (matrix)
{
    var ret = new Matrix44();

    // row 0
    ret.entries[0] = this.entries[0] * matrix.entries[0] +
                     this.entries[4] * matrix.entries[1] +
                     this.entries[8] * matrix.entries[2] +
                     this.entries[12] * matrix.entries[3];

    ret.entries[1] = this.entries[1] * matrix.entries[0] +
                     this.entries[5] * matrix.entries[1] +
                     this.entries[9] * matrix.entries[2] +
                     this.entries[13] * matrix.entries[3];

    ret.entries[2] = this.entries[2] * matrix.entries[0] +
                     this.entries[6] * matrix.entries[1] +
                     this.entries[10] * matrix.entries[2] +
                     this.entries[14] * matrix.entries[3];

    ret.entries[3] = this.entries[3] * matrix.entries[0] +
                     this.entries[7] * matrix.entries[1] +
                     this.entries[11] * matrix.entries[2] +
                     this.entries[15] * matrix.entries[3];

    // row 1
    ret.entries[4] = this.entries[0] * matrix.entries[4] +
                     this.entries[4] * matrix.entries[5] +
                     this.entries[8] * matrix.entries[6] +
                     this.entries[12] * matrix.entries[7];

    ret.entries[5] = this.entries[1] * matrix.entries[4] +
                     this.entries[5] * matrix.entries[5] +
                     this.entries[9] * matrix.entries[6] +
                     this.entries[13] * matrix.entries[7];

    ret.entries[6] = this.entries[2] * matrix.entries[4] +
                     this.entries[6] * matrix.entries[5] +
                     this.entries[10] * matrix.entries[6] +
                     this.entries[14] * matrix.entries[7];

    ret.entries[7] = this.entries[3] * matrix.entries[4] +
                     this.entries[7] * matrix.entries[5] +
                     this.entries[11] * matrix.entries[6] +
                     this.entries[15] * matrix.entries[7];

    // row 2
    ret.entries[8] = this.entries[0] * matrix.entries[8] +
                     this.entries[4] * matrix.entries[9] +
                     this.entries[8] * matrix.entries[10] +
                     this.entries[12] * matrix.entries[11];

    ret.entries[9] = this.entries[1] * matrix.entries[8] +
                     this.entries[5] * matrix.entries[9] +
                     this.entries[9] * matrix.entries[10] +
                     this.entries[13] * matrix.entries[11];

    ret.entries[10] = this.entries[2] * matrix.entries[8] +
                      this.entries[6] * matrix.entries[9] +
                      this.entries[10] * matrix.entries[10] +
                      this.entries[14] * matrix.entries[11];

    ret.entries[11] = this.entries[3] * matrix.entries[8] +
                      this.entries[7] * matrix.entries[9] +
                      this.entries[11] * matrix.entries[10] +
                      this.entries[15] * matrix.entries[11];

    // row 3
    ret.entries[12] = this.entries[0] * matrix.entries[12] +
                      this.entries[4] * matrix.entries[13] +
                      this.entries[8] * matrix.entries[14] +
                      this.entries[12] * matrix.entries[15];

    ret.entries[13] = this.entries[1] * matrix.entries[12] +
                      this.entries[5] * matrix.entries[13] +
                      this.entries[9] * matrix.entries[14] +
                      this.entries[13] * matrix.entries[15];

    ret.entries[14] = this.entries[2] * matrix.entries[12] +
                      this.entries[6] * matrix.entries[13] +
                      this.entries[10] * matrix.entries[14] +
                      this.entries[14] * matrix.entries[15];

    ret.entries[15] = this.entries[3] * matrix.entries[12] +
                      this.entries[7] * matrix.entries[13] +
                      this.entries[11] * matrix.entries[14] +
                      this.entries[15] * matrix.entries[15];

    return ret;
}

Matrix44.prototype.transpose = function()
{
    var ret = new Matrix44();

    // row 0
    ret.entries[0] = this.entries[0];
    ret.entries[1] = this.entries[4];
    ret.entries[2] = this.entries[8];
    ret.entries[3] = this.entries[12];

    // row 0
    ret.entries[4] = this.entries[1];
    ret.entries[5] = this.entries[5];
    ret.entries[6] = this.entries[9];
    ret.entries[7] = this.entries[13];

    // row 0
    ret.entries[8] = this.entries[2];
    ret.entries[9] = this.entries[6];
    ret.entries[10] = this.entries[10];
    ret.entries[11] = this.entries[14];

    // row 0
    ret.entries[12] = this.entries[3];
    ret.entries[13] = this.entries[7];
    ret.entries[14] = this.entries[11];
    ret.entries[15] = this.entries[15];

    return ret;
}

Matrix44.prototype.xform = function(orig)
{
    var ret = new Vector4();

    ret.x = orig.x * this.entries[0] + orig.y * this.entries[4] + orig.z * this.entries[8] + this.entries[12];
    ret.y = orig.x * this.entries[1] + orig.y * this.entries[5] + orig.z * this.entries[9] + this.entries[13];
    ret.z = orig.x * this.entries[2] + orig.y * this.entries[6] + orig.z * this.entries[10] + this.entries[14];
    ret.w = orig.x * this.entries[3] + orig.y * this.entries[7] + orig.z * this.entries[11] + this.entries[15];

    return ret;
}

Matrix44.prototype.invert = function()
{
    var inv = new Array(16);

    inv[0] = this.entries[5]  * this.entries[10] * this.entries[15] - 
             this.entries[5]  * this.entries[11] * this.entries[14] - 
             this.entries[9]  * this.entries[6]  * this.entries[15] + 
             this.entries[9]  * this.entries[7]  * this.entries[14] +
             this.entries[13] * this.entries[6]  * this.entries[11] - 
             this.entries[13] * this.entries[7]  * this.entries[10];

    inv[4] = -this.entries[4]  * this.entries[10] * this.entries[15] + 
              this.entries[4]  * this.entries[11] * this.entries[14] + 
              this.entries[8]  * this.entries[6]  * this.entries[15] - 
              this.entries[8]  * this.entries[7]  * this.entries[14] - 
              this.entries[12] * this.entries[6]  * this.entries[11] + 
              this.entries[12] * this.entries[7]  * this.entries[10];

    inv[8] = this.entries[4]  * this.entries[9] * this.entries[15] - 
             this.entries[4]  * this.entries[11] * this.entries[13] - 
             this.entries[8]  * this.entries[5] * this.entries[15] + 
             this.entries[8]  * this.entries[7] * this.entries[13] + 
             this.entries[12] * this.entries[5] * this.entries[11] - 
             this.entries[12] * this.entries[7] * this.entries[9];

    inv[12] = -this.entries[4]  * this.entries[9] * this.entries[14] + 
               this.entries[4]  * this.entries[10] * this.entries[13] +
               this.entries[8]  * this.entries[5] * this.entries[14] - 
               this.entries[8]  * this.entries[6] * this.entries[13] - 
               this.entries[12] * this.entries[5] * this.entries[10] + 
               this.entries[12] * this.entries[6] * this.entries[9];

    inv[1] = -this.entries[1]  * this.entries[10] * this.entries[15] + 
              this.entries[1]  * this.entries[11] * this.entries[14] + 
              this.entries[9]  * this.entries[2] * this.entries[15] - 
              this.entries[9]  * this.entries[3] * this.entries[14] - 
              this.entries[13] * this.entries[2] * this.entries[11] + 
              this.entries[13] * this.entries[3] * this.entries[10];

    inv[5] = this.entries[0]  * this.entries[10] * this.entries[15] - 
             this.entries[0]  * this.entries[11] * this.entries[14] - 
             this.entries[8]  * this.entries[2] * this.entries[15] + 
             this.entries[8]  * this.entries[3] * this.entries[14] + 
             this.entries[12] * this.entries[2] * this.entries[11] - 
             this.entries[12] * this.entries[3] * this.entries[10];

    inv[9] = -this.entries[0]  * this.entries[9] * this.entries[15] + 
              this.entries[0]  * this.entries[11] * this.entries[13] + 
              this.entries[8]  * this.entries[1] * this.entries[15] - 
              this.entries[8]  * this.entries[3] * this.entries[13] - 
              this.entries[12] * this.entries[1] * this.entries[11] + 
              this.entries[12] * this.entries[3] * this.entries[9];

    inv[13] = this.entries[0]  * this.entries[9] * this.entries[14] - 
              this.entries[0]  * this.entries[10] * this.entries[13] - 
              this.entries[8]  * this.entries[1] * this.entries[14] + 
              this.entries[8]  * this.entries[2] * this.entries[13] + 
              this.entries[12] * this.entries[1] * this.entries[10] - 
              this.entries[12] * this.entries[2] * this.entries[9];

    inv[2] = this.entries[1]  * this.entries[6] * this.entries[15] - 
             this.entries[1]  * this.entries[7] * this.entries[14] - 
             this.entries[5]  * this.entries[2] * this.entries[15] + 
             this.entries[5]  * this.entries[3] * this.entries[14] + 
             this.entries[13] * this.entries[2] * this.entries[7] - 
             this.entries[13] * this.entries[3] * this.entries[6];

    inv[6] = -this.entries[0]  * this.entries[6] * this.entries[15] + 
              this.entries[0]  * this.entries[7] * this.entries[14] + 
              this.entries[4]  * this.entries[2] * this.entries[15] - 
              this.entries[4]  * this.entries[3] * this.entries[14] - 
              this.entries[12] * this.entries[2] * this.entries[7] + 
              this.entries[12] * this.entries[3] * this.entries[6];

    inv[10] = this.entries[0]  * this.entries[5] * this.entries[15] - 
              this.entries[0]  * this.entries[7] * this.entries[13] - 
              this.entries[4]  * this.entries[1] * this.entries[15] + 
              this.entries[4]  * this.entries[3] * this.entries[13] + 
              this.entries[12] * this.entries[1] * this.entries[7] - 
              this.entries[12] * this.entries[3] * this.entries[5];

    inv[14] = -this.entries[0]  * this.entries[5] * this.entries[14] + 
               this.entries[0]  * this.entries[6] * this.entries[13] + 
               this.entries[4]  * this.entries[1] * this.entries[14] - 
               this.entries[4]  * this.entries[2] * this.entries[13] - 
               this.entries[12] * this.entries[1] * this.entries[6] + 
               this.entries[12] * this.entries[2] * this.entries[5];

    inv[3] = -this.entries[1] * this.entries[6] * this.entries[11] + 
              this.entries[1] * this.entries[7] * this.entries[10] + 
              this.entries[5] * this.entries[2] * this.entries[11] - 
              this.entries[5] * this.entries[3] * this.entries[10] - 
              this.entries[9] * this.entries[2] * this.entries[7] + 
              this.entries[9] * this.entries[3] * this.entries[6];

    inv[7] = this.entries[0] * this.entries[6] * this.entries[11] - 
             this.entries[0] * this.entries[7] * this.entries[10] - 
             this.entries[4] * this.entries[2] * this.entries[11] + 
             this.entries[4] * this.entries[3] * this.entries[10] + 
             this.entries[8] * this.entries[2] * this.entries[7] - 
             this.entries[8] * this.entries[3] * this.entries[6];

    inv[11] = -this.entries[0] * this.entries[5] * this.entries[11] + 
               this.entries[0] * this.entries[7] * this.entries[9] + 
               this.entries[4] * this.entries[1] * this.entries[11] - 
               this.entries[4] * this.entries[3] * this.entries[9] - 
               this.entries[8] * this.entries[1] * this.entries[7] + 
               this.entries[8] * this.entries[3] * this.entries[5];

    inv[15] = this.entries[0] * this.entries[5] * this.entries[10] - 
              this.entries[0] * this.entries[6] * this.entries[9] - 
              this.entries[4] * this.entries[1] * this.entries[10] + 
              this.entries[4] * this.entries[2] * this.entries[9] + 
              this.entries[8] * this.entries[1] * this.entries[6] - 
              this.entries[8] * this.entries[2] * this.entries[5];

    var det = this.entries[0] * inv[0] + this.entries[1] * inv[4] + this.entries[2] * inv[8] + this.entries[3] * inv[12];

    if (det == 0)
        return false;

    det = 1.0 / det;

    var ret = new Matrix44();
    for (var i = 0; i < 16; i++)
        ret.entries[i] = inv[i] * det;

    return ret;
}