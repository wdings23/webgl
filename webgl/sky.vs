attribute vec3 position;
attribute vec3 normal;
attribute vec2 uv;

uniform mat4 modelMatrix;
uniform mat4 viewMatrix;
uniform mat4 projMatrix;

varying vec3 vNormal;

void main()
{
	vNormal = normal;
	vec4 clipSpace = projMatrix * viewMatrix * modelMatrix * vec4(position, 1.0);
	gl_Position = clipSpace;
}