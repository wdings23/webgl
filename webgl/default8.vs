attribute vec3 position;
attribute vec3 normal;

vec4 lightDir = vec4(0.707, 0.707, 0.0, 1.0);
varying vec4 vColor;
uniform mat4 modelMatrix;
//uniform mat4 viewMatrix;
//uniform mat4 projMatrix;
void main()
{
	float fDP = lightDir.x * normal.x + lightDir.y * normal.y + lightDir.z * normal.z;
	fDP = clamp(fDP, 0.0, 1.0);
	vColor = vec4(fDP, fDP, fDP, 1.0);  

	gl_Position = modelMatrix * vec4(position, 1.0);
}