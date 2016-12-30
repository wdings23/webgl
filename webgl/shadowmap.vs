attribute vec3 position;

uniform mat4 modelMatrix;
uniform mat4 viewMatrix;
uniform mat4 projMatrix;

varying vec4 vClipSpacePos;

void main()
{
	vClipSpacePos = projMatrix * viewMatrix * modelMatrix * vec4(position, 1.0);
	gl_Position = vClipSpacePos;
}