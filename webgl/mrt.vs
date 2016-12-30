attribute vec3 position;
attribute vec3 normal;
attribute vec2 uv;

uniform mat4 modelMatrix;
uniform mat4 viewMatrix;
uniform mat4 projMatrix;
uniform mat4 normMatrix;

varying vec4 vNorm;
varying vec4 vWorldPos;
varying vec4 vUV;
varying vec4 vClipSpacePos;

void main()
{
	vNorm = normMatrix * vec4(normal, 1.0);
	vWorldPos = modelMatrix * vec4(position, 1.0);
	vUV = vec4(uv.xy, 0.0, 1.0);
	vec4 clipSpace = projMatrix * viewMatrix * modelMatrix * vec4(position, 1.0);

	vClipSpacePos = clipSpace;

	gl_Position = clipSpace;
}