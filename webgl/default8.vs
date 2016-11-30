attribute vec3 position;
attribute vec3 normal;
attribute vec2 uv;

vec4 lightDir = vec4(0.707, 0.707, 0.0, 1.0);
varying vec4 vColor;
varying vec3 vNorm;
varying vec3 vView;
varying vec2 vUV;

uniform mat4 modelMatrix;
uniform mat4 viewMatrix;
uniform mat4 projMatrix;
uniform mat4 normMatrix;

uniform vec4 lightPos;
uniform vec3 eyePos;

void main()
{
	vec4 norm = normMatrix * vec4(normal, 1.0);
	vNorm = norm.xyz;

	vec4 xformPos = modelMatrix * vec4(position, 1.0);
	vec4 lightToV = xformPos - lightPos;
	lightToV = normalize(lightToV);

	float fDP = lightToV.x * vNorm.x + lightToV.y * vNorm.y + lightToV.z * vNorm.z;
	fDP = clamp(fDP, 0.0, 1.0);
	vColor = vec4(fDP, fDP, fDP, 1.0);  

	vView = normalize(eyePos - vec3(xformPos.xyz));

	//gl_Position = modelMatrix * vec4(position, 1.0);

	vUV = uv;
	gl_Position = projMatrix * viewMatrix * modelMatrix * vec4(position, 1.0);
}