ShaderProgram = function (name, vertexShader, fragmentShader, program) {
    this.name = name;
    this.vertexShader = vertexShader;
    this.fragmentShader = fragmentShader;
    this.program = program;
}

ShaderManager = function () {
    this.shaders = [];
}

ShaderManager.prototype.addShaderProgram = function (shaderProgram) {
    this.shaders.push(shaderProgram);
}

ShaderManager.prototype.getShaderProgram = function (name) {
    var ret = null;
    var numShaders = this.shaders.length;
    for (var i = 0; i < numShaders; i++) {
        if (this.shaders[i].name == name) {
            ret = this.shaders[i];
            break;
        }
    }

    return ret;
}
