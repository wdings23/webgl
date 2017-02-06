/*
**
*/
ModelLoader = function ()
{
}

/*
**
*/
ModelLoader.prototype.load = function(url, loadedFunc)
{
    /*
    <character>
        <model>models/pistol/pistol.obj</model>
        <albedo>models/pistol/pistol_albedo.jpg</albedo>
        <metal>models/pistol/pistol_metal.jpg</metal>
        <rough>models/pistol/pistol_rough.jpg</rough>
        <normal>models/pistol/pistol_normal.jpg</normal>
    </character>
    */

    var xhr = new XMLHttpRequest();
    xhr.addEventListener('load',
        function () {
            var parser = new DOMParser();
            var xmlDoc = parser.parseFromString(this.responseText, 'text/xml');
            var modelName = xmlDoc.getElementsByTagName('model')[0].textContent;
            var albedo = xmlDoc.getElementsByTagName('albedo')[0].textContent;
            var metal = xmlDoc.getElementsByTagName('metal')[0].textContent;
            var rough = xmlDoc.getElementsByTagName('rough')[0].textContent;
            var normal = xmlDoc.getElementsByTagName('normal')[0].textContent;

            var character = new Character();
            character.name = modelName;
            var textureNames = [albedo, metal, rough, normal];

            character.loadOBJ(modelName);
            character.loadTextures(textureNames);

            character.albedo = [0, 0, 0];
            character.metalness = [1, 1, 1];
            character.roughness = [2, 2, 2];
            character.normalMap = [3, 3, 3];

            loadedFunc(character);

        });

    xhr.open('GET', url);
    xhr.send();
}