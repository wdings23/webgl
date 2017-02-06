

var MRTEnum =
{
    NORMAL: 0,
    CLIPSPACE: 1,
    WORLDSPACE: 2,
    ALBEDO: 3,
    NORMALMAP: 4,
    METAL_ROUGHNESS: 5,

    NUM_MRT : 6,
};

var gApp;
function initGL()
{
    var canvas = document.getElementById("glcanvas");
    gApp = new Application(canvas);
    gApp.init();
    
}

