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

Character = function (name)
{
    this.name = name;
    this.models = [];
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