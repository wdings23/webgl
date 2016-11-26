Model = function (name)
{
    this.name = name;
    this.numVertices = 0;
    this.numCurrVertices = 0;
    this.numFaces = 0;
    this.numNormals = 0;
    this.vertices = [];
    this.normals = [];
    this.vbo = null;
    this.floatArray = null;
    this.floatNormalArray = null;
    this.max = new Vector3(-9999.0, -9999.0, -9999.0);
    this.min = new Vector3(9999.0, 9999.0, 9999.0);
    this.needUpdateData = false;

    this.tempVerts = [];
}

Model.prototype.updateVBO = function()
{
    if (this.vbo)
    {
        gl.deleteBuffer(this.vbo);
    }

    this.vbo = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, this.vbo);
    gl.bufferData(gl.ARRAY_BUFFER, this.floatArray, gl.STATIC_DRAW);
}

Model.prototype.updateData = function()
{
    if (this.needUpdateData == true)
    {
        this.floatArray = new Float32Array(this.vertices);
        this.updateVBO();
        this.needUpdateData = false;
    }
}