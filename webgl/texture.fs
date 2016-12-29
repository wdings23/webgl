precision highp float;

uniform sampler2D textureMap;

varying vec2 vUV;

void main()
{
	gl_FragColor = texture2D(textureMap, vUV);
}