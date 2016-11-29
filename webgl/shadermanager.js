ShaderProgram = function (name, vertexShader, fragmentShader, program)
{
    this.name = name;
    this.vertexShader = vertexShader;
    this.fragmentShader = fragmentShader;
    this.program = program;
}

ShaderManager = function ()
{
    this.shaders = [];
}

ShaderManager.prototype.addShaderProgram = function (shaderProgram)
{
    this.shaders.push(shaderProgram);
}

ShaderManager.prototype.getShaderProgram = function (name)
{
    var ret = null;
    var numShaders = this.shaders.length;
    for (var i = 0; i < numShaders; i++)
    {
        if (this.shaders[i].name == name)
        {
            ret = this.shaders[i];
            break;
        }
    }

    return ret;
}

ShaderManager.prototype.readInAllShaders = function (shaderHTMLID)
{
    var shaderManager = this;   // need to save this when getting into onreadystatechange function below

    var shaderScriptTag = document.getElementById(shaderHTMLID +'?random=1');
    var client = new XMLHttpRequest();
    client.onreadystatechange = function () {
        if (client.readyState == 4 && client.status == 200) {
            // read in the string from file
            console.log(client.responseText);
            var parser = new DOMParser();
            var xmlDoc = parser.parseFromString(client.responseText, "text/xml");
            var programNodes = xmlDoc.getElementsByTagName("program");
            for (var i = 0; i < programNodes.length; i++)
            {
                var nameNode = programNodes[i].getElementsByTagName("name")[0];

                // source nodes
                var vertexNode = programNodes[i].getElementsByTagName("vertex")[0];
                var fragmentNode = programNodes[i].getElementsByTagName("fragment")[0];

                // source names
                var vertexSrc = vertexNode.firstChild.data
                var fragmentSrc = fragmentNode.firstChild.data;

                compileShaderProgram(shaderManager, nameNode.firstChild.data, vertexSrc, fragmentSrc);
            }
        }
    }

    //client.open("GET", shaderScriptTag.src);
    client.open("GET", "http://localhost:8000/shaders.xml", true);
    client.setRequestHeader('Cache-Control', 'no-cache');
    client.setRequestHeader('Pragma', 'no-cache');
    client.send();
}

function compileShaderProgram(shaderManager, programName, vertexSrc, fragmentSrc)
{
    // get the shader file as new http request
    var vertexClient = new XMLHttpRequest();
    var vertexShader = null;
    vertexClient.onreadystatechange = function ()
    {
        if (vertexClient.readyState == 4 && vertexClient.status == 200)
        {
            // compile the shader
            console.log(vertexClient.responseText);
            vertexShader = gl.createShader(gl.VERTEX_SHADER);
            gl.shaderSource(vertexShader, vertexClient.responseText);
            gl.compileShader(vertexShader);
            if (gl.getShaderParameter(vertexShader, gl.COMPILE_STATUS))
            {
                console.log("Success building vertex shader");
            }
            else
            {
                console.log("Error: " + gl.getShaderInfoLog(vertexShader));
            }

            if (vertexShader && fragmentShader)
            {
                linkShaderProgram(shaderManager, programName, vertexShader, fragmentShader);
            }
        }
    }

    vertexClient.open("GET", vertexSrc);
    vertexClient.setRequestHeader('Cache-Control', 'no-cache');
    vertexClient.setRequestHeader('Pragma', 'no-cache');
    vertexClient.send();

    // get the shader file as new http request
    var fragmentClient = new XMLHttpRequest();
    var fragmentShader = null;
    fragmentClient.onreadystatechange = function ()
    {
        if (fragmentClient.readyState == 4 && fragmentClient.status == 200)
        {
            // compile
            console.log(fragmentClient.responseText);
            fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
            gl.shaderSource(fragmentShader, fragmentClient.responseText);
            gl.compileShader(fragmentShader);
            if (gl.getShaderParameter(fragmentShader, gl.COMPILE_STATUS))
            {
                console.log("Success building fragment shader");
            }
            else
            {
                console.log("Error: " + gl.getShaderInfoLog(fragmentShader));
            }

            if (vertexShader && fragmentShader)
            {
                linkShaderProgram(shaderManager, programName, vertexShader, fragmentShader);
            }
        }
    }

    fragmentClient.open("GET", fragmentSrc);
    fragmentClient.setRequestHeader('Cache-Control', 'no-cache');
    fragmentClient.setRequestHeader('Pragma', 'no-cache');
    fragmentClient.send();
}

function linkShaderProgram(shaderManager, programName, vertexShader, fragmentShader)
{
    // attach and link to shader program
    var program = gl.createProgram();
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);

    var linked = gl.getProgramParameter(program, gl.LINK_STATUS);
    if (!linked)
    {
        var error = gl.getProgramInfoLog(program);
        console.log("Error in program linking: " + error);
        gl.deleteProgram(program);
    }
    else
    {
        // register the shader program with the manager
        shaderProgram = new ShaderProgram(programName, vertexShader, fragmentShader, program);
        shaderManager.addShaderProgram(shaderProgram);
    }
}