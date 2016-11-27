function parseVec3(content) {
    // parse positions
    var pos = [];
    var compCount = 0;
    var start = 0;
    for (; ;) {
        var end = content.indexOf(',', start);
        if (end == -1) {
            end = content.length;
        }

        var comp = content.substring(start, end);
        start = end + 1;
        pos.push(parseFloat(comp));

        if (end == content.length) {
            break;
        }

    }   // loop until until done

    return pos;
}

function loadOBJ(lines, verts, norms, uvs, floatArray, lastLine)
{
    var name = null;
    var material = null;
    var numFaces = 0;

    
    for (var lineIndex = lastLine; lineIndex < lines.length; lineIndex++)
    {
        var line = lines[lineIndex];
        var words = line.split(' ');

        var firstWord = words[0];
        
        if (firstWord == 'g')
        {
            if (name == null)
            {
                name = words[1];
            }
            else
            {
                return [name, material, numFaces, lineIndex];
            }
        }
        else if(firstWord == 'usemtl')
        {
            material = words[1];
        }
        else if (firstWord == 'v')
        {
            var x = parseFloat(words[1]);
            var y = parseFloat(words[2]);
            var z = parseFloat(words[3]);

            var v = new Vector3(x, y, z);
            verts.push(v);
        }
        else if(firstWord == 'vn')
        {
            var x = parseFloat(words[1]);
            var y = parseFloat(words[2]);
            var z = parseFloat(words[3]);

            var n = new Vector3(x, y, z);
            norms.push(n);
        }
        else if (firstWord == 'vt')
        {
            var x = parseFloat(words[1]);
            var y = parseFloat(words[2]);

            var t = new Vector3(x, y, 0.0);
            uvs.push(t);
        }
        else if(firstWord == 'f')
        {
            var faceV = [];
            var faceUV = [];
            var faceNorm = [];

            for(var i = 1; i < words.length; i++)
            {
                var start = 0;
                var count = 0;
                for(;;)
                {
                    if(start == -1)
                    {
                        break;
                    }

                    var end = words[i].indexOf('/', start);
                    if (end == -1)
                    {
                        end = words[i].length;
                    }

                    var fStr = words[i].substring(start, end);
                    var f = parseInt(fStr) - 1;
                    start = end + 1;
                    if (start >= words[i].length)
                    {
                        start = words[i].length - 1;
                    }

                    if (end >= words[i].length - 1)
                    {
                        start = -1;
                    }

                    if(count == 0)
                    {
                        faceV.push(f);
                        //console.log('v ' + f);
                    }
                    else if(count == 1)
                    {
                        faceUV.push(f);
                        //console.log('n ' + f);
                    }
                    else if(count == 2)
                    {
                        faceNorm.push(f);
                        //console.log('t ' + f);
                    }

                    ++count;
                }

            }   // for i = 0 to num words


            for(var i = 0; i < faceV.length; i++)
            {
                var vertIndex = faceV[i];
                var normIndex = faceNorm[i];
                var uvIndex = -1;

                if(faceUV.length > i)
                {
                    uvIndex = faceUV[i];
                }


                floatArray.push(verts[vertIndex].x);
                floatArray.push(verts[vertIndex].y);
                floatArray.push(verts[vertIndex].z);

                floatArray.push(norms[normIndex].x);
                floatArray.push(norms[normIndex].y);
                floatArray.push(norms[normIndex].z);

                //if(uvIndex >= 0)
                //{
                //    floatArray.push(uvs[uvIndex].x);
                //    floatArray.push(uvs[uvIndex].y);
                //}
            }

            ++numFaces;

        }   // if face



    }   // for i = 0 to num lines

    return [name, material, numFaces, -1];
}


Character = function (name)
{
    this.name = name;
    this.models = [];
}

Character.prototype.loadOBJ = function(filename)
{
    var self = this;

    var httpRequestClient = new XMLHttpRequest();
    httpRequestClient.onreadystatechange = function () {
        if (httpRequestClient.readyState == 4) {
            var fileContent = httpRequestClient.responseText;

            var lines = fileContent.split('\n');
            var lastLine = 0;

            var verts = [];
            var norms = [];
            var uvs = [];

            for (; ;)
            {
                var floatArray = [];
                var modelInfo = loadOBJ(lines, verts, norms, uvs, floatArray, lastLine);
                lastLine = modelInfo[3];

                var model = new Model(modelInfo[4]);
                model.floatArray = new Float32Array(floatArray);
                model.updateVBO();
                model.numFaces = modelInfo[2];
                model.name = modelInfo[0];
                self.models.push(model);

                console.log('loaded ' + model.name);

                if(lastLine == -1)
                {
                    break;
                }
            }

        }
    }

    httpRequestClient.open("GET", filename);
    httpRequestClient.send();
}



Character.prototype.loadFile = function(filename)
{
    var self = this;

    var httpRequestClient = new XMLHttpRequest();
    httpRequestClient.onreadystatechange = function () {
        if (httpRequestClient.readyState == 4) {
            var fileContent = httpRequestClient.responseText;

            var modelContents = [];
            var startIndex = 0;
            for (;;) {
                var currStartIndex = fileContent.indexOf('<model>', startIndex);
                if (currStartIndex == -1) {
                    break;
                }

                currEndIndex = fileContent.indexOf('</model>', currStartIndex + 1);
                currEndIndex += '</model>'.length;
                var modelText = fileContent.substr(currStartIndex, currEndIndex + currStartIndex);

                modelContents.push(modelText);
                startIndex = currEndIndex;
            }

            for (var i = 0; i < modelContents.length; i++) {
                var content = modelContents[i].trim();
                
                //console.log(content);
                
                var positionTextStart = content.indexOf('<positions>') + '<positions>'.length;
                var positionTextEnd = content.indexOf('</positions>');
                var positionText = content.substring(positionTextStart, positionTextEnd);
                
                var texCoordStart = content.indexOf('<texcoord>') + '<texcoord>'.length;
                var texCoordEnd = content.indexOf('</texcoord>');
                var texCoordText = content.substring(texCoordStart, texCoordEnd);

                var normalStart = content.indexOf('<normals>') + '<normals>'.length;
                var normalEnd = content.indexOf('</normals>');
                var normalText = content.substring(normalStart, normalEnd);

                var model = new Model();

                // parse positions
                model.vertices = parseVec3(positionText);
                model.numVertices = model.vertices.length / 3;
                model.numFaces = model.vertices.length / 9;

                model.normals = parseVec3(normalText);
                model.numNormals = model.normals.length / 3;

                if (model.vertices.length != model.normals.length)
                {
                    console.log('model.vertices.length != model.normals.length');
                    debugger;
                }

                var verts = [];
                var count = 0;
                for (var i = 0; i < model.vertices.length; i++)
                //for (var i = 18; i <= 19; i++)
                {
                    verts.push(model.vertices[i * 3]);
                    verts.push(model.vertices[i * 3 + 1]);
                    verts.push(model.vertices[i * 3 + 2]);

                    verts.push(model.normals[i * 3]);
                    verts.push(model.normals[i * 3 + 1]);
                    verts.push(model.normals[i * 3 + 2]);

                    count += 3;
                }

                model.floatArray = new Float32Array(verts);
                model.updateVBO();

                self.models.push(model);

            }   // for i = 0 to model content length

            

            
        }
    }

    httpRequestClient.open("GET", filename);
    httpRequestClient.send();
}