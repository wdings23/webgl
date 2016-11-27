precision highp float;

uniform vec4 color;
varying vec4 vColor;

void main()
{
	gl_FragColor = vColor;
}