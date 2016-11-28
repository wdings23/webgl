precision highp float;

uniform samplerCube sampler;
uniform vec4 color;

varying vec4 vColor;
varying vec3 vNorm;

void main()
{
	vec4 texColor = textureCube(sampler, vNorm);
	gl_FragColor = texColor * (vColor + vec4(0.2, 0.2, 0.2, 0.0));
}