precision highp float;

uniform sampler2D sampler;

varying vec2 vUV;

void main()
{
	gl_FragColor = texture2D(sampler, vUV);
}