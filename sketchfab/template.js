Model = function()
{
    this.verts = [];
    this.normals = [];
    this.uvs = [];
    this.indices = [];

    this.textureSrc = [];
    this.instanceID = -1;
};

var gNumTotalModels = 0;
var gTextureSrc = null;
var gTextureImageData = null;
var gModels = [];

function checkModelCreated(obj)
{
    var primitives = obj._geometry._primitives;
    var created = false;
    for (var i = 0; i < primitives.length; i++) {
        var primitive = primitives[i];
        if (primitive.indices._gl) {
            created = true;
            break;
        }
    }

    return created;
}

function saveModel(obj)
{
    var model = new Model();
    model.instanceID = obj._geometry._primitives[0].indices._instanceID;

    var boundingBox = obj._geometry._boundingBox;
    var boundX = boundingBox._max[0] - boundingBox._min[0];
    var boundY = boundingBox._max[1] - boundingBox._min[1];
    var boundZ = boundingBox._max[2] - boundingBox._min[2];

    var modelScale = 1.0 / boundX;
    if (boundY > boundX && boundY > boundZ)
    {
        modelScale = 1.0 / boundY;
    }
    else if (boundZ > boundX && boundZ > boundY)
    {
        modelScale = 1.0 / boundZ;
    }

    var dataOutput = 'g model\n';
    var materialOutput = 'newmtl material0\nKa 1.000000 1.000000 1.000000\nKd 1.000000 1.000000 1.000000\n\nKs 0.000000 0.000000 0.000000\nTr 1.000000\nillum 1\nNs 0.000000';

    var vertices = obj._geometry._attributes['Vertex']._elements;
    for (var i = 0; i < vertices.length; i += 3) {
        model.verts.push(vertices[i] * modelScale);
        model.verts.push(vertices[i + 1] * modelScale);
        model.verts.push(vertices[i + 2] * modelScale);

        dataOutput += 'v ' + (vertices[i] * modelScale) + ' ' + (vertices[i + 2] * modelScale) + ' ' + (vertices[i + 1] * modelScale) + '\n';
    }

    var uvs = null;
    for (var key in obj._geometry._attributes)
    {
        if (obj._geometry._attributes.hasOwnProperty(key))
        {
            if(key.indexOf('TexCoord') != -1)
            {
                uvs = obj._geometry._attributes[key]._elements;
                break;
            }
        }
    }

    for (var i = 0; i < uvs.length; i += 2) {
        model.uvs.push(uvs[i]);
        model.uvs.push(uvs[i + 1]);

        dataOutput += 'vt ' + uvs[i] + ' ' + uvs[i + 1] + '\n';
    }

    if ('Normal' in obj._geometry._attributes) {
        var normals = obj._geometry._attributes['Normal']._elements;
        for (var i = 0; i < normals.length; i += 3) {
            model.normals.push(normals[i]);
            model.normals.push(normals[i + 1]);
            model.normals.push(normals[i + 2]);

            dataOutput += 'vn ' + normals[i] + ' ' + normals[i + 2] + ' ' + normals[i + 1] + '\n';
        }
    }

    dataOutput += 'usemtl material0\n'

    var primitives = obj._geometry._primitives;
    for (var i = 0; i < primitives.length; i++) {
        var primitive = primitives[i];

        var indices = [];
        if (primitive.mode == 4) {
            // triangle
            for (var j = 0; j < primitive.indices._elements.length; j += 3) {
                if (primitive.indices._elements[j] != primitive.indices._elements[j + 1] &&
                    primitive.indices._elements[j + 1] != primitive.indices._elements[j + 2] &&
                    primitive.indices._elements[j + 2] != primitive.indices._elements[j]) {
                    var v0 = parseInt(primitive.indices._elements[j]) + 1;
                    var v1 = parseInt(primitive.indices._elements[j + 1]) + 1;
                    var v2 = parseInt(primitive.indices._elements[j + 2]) + 1;

                    dataOutput += 'f ';
                    dataOutput += v0 + '/' + v0 + '/' + v0 + ' ';
                    dataOutput += v1 + '/' + v1 + '/' + v1 + ' ';
                    dataOutput += v2 + '/' + v2 + '/' + v2 + '\n';

                    model.indices.push(v0);
                    model.indices.push(v1);
                    model.indices.push(v2);
                }
            }
        }
        else if (primitive.mode == 5) {
            // tri strip
            for (var j = 0; j < primitive.indices._elements.length; j++) {
                if (j >= primitive.indices._elements.length - 2) {
                    break;
                }

                if (primitive.indices._elements[j] != primitive.indices._elements[j + 1] &&
                    primitive.indices._elements[j + 1] != primitive.indices._elements[j + 2] &&
                    primitive.indices._elements[j + 2] != primitive.indices._elements[j]) {
                    var v0 = parseInt(primitive.indices._elements[j]) + 1;
                    var v1 = parseInt(primitive.indices._elements[j + 1]) + 1;
                    var v2 = parseInt(primitive.indices._elements[j + 2]) + 1;

                    dataOutput += 'f ';
                    if (j % 2 == 0) {
                        dataOutput += v0 + '/' + v0 + '/' + v0 + ' ';
                        dataOutput += v1 + '/' + v1 + '/' + v1 + ' ';
                        dataOutput += v2 + '/' + v2 + '/' + v2 + '\n';
                    }
                    else
                    {
                        dataOutput += v0 + '/' + v0 + '/' + v0 + ' ';
                        dataOutput += v2 + '/' + v2 + '/' + v2 + ' ';
                        dataOutput += v1 + '/' + v1 + '/' + v1 + '\n';
                    }
                }
            }
        }

    }


    var a = window.document.createElement('a');
    a.href = window.URL.createObjectURL(new Blob([dataOutput], { type: 'text/plain' }));
    a.download = 'new_model_' + gNumTotalModels + '.obj';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);

    a = window.document.createElement('a');
    a.href = window.URL.createObjectURL(new Blob([materialOutput], { type: 'text/plain' }));
    a.download = 'new_model_' + gNumTotalModels + '.mtl';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);

    console.log('new model ' + a.download);

    gModels.push(model);

    ++gNumTotalModels;
}

function saveImageSrc(arguments)
{
    if (arguments[arguments.length - 1] != null && arguments[arguments.length - 1] instanceof Image) {
        var image = arguments[arguments.length - 1];
        var imageSrc = new String(image.src);
        var baseName = imageSrc.substring(imageSrc.lastIndexOf('/') + 1);
        var extension = imageSrc.substring(imageSrc.lastIndexOf('.') + 1);

        if (gTextureSrc == null)
        {
            gTextureSrc = new Array();
        }

        gTextureSrc.push(image.src);

        console.log('image src = ' + image.src + ' (' + image.width + ', ' + image.height + ')');
    }
    /*else {
        gTextureImageData = new Array();
        for (var i = 0; i < arguments[arguments.length - 1].length; i++) {
            gTextureImageData.push(arguments[arguments.length - 1][i]);
        }
    }*/
}

function setModelTexture(obj)
{
    for (var i = 0; i < gModels.length; i++) {
        var model = gModels[i];
        if (model.instanceID == obj._geometry._primitives[0].indices._instanceID) {
            if (gTextureSrc) {
                for (var j = 0; j < gTextureSrc.length; j++) {
                    model.textureSrc.push(gTextureSrc[j]);
                }
            }

            break;
        }
    }

    gTextureSrc = new Array();
    gTextureImageData = null;
}