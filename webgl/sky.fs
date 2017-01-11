#extension GL_EXT_draw_buffers : require

precision highp float;

uniform samplerCube		textureSampler;
varying vec3 vNormal;

/*
**
*/
void main()
{
	vec4 color = textureCube(textureSampler, vNormal);
	gl_FragData[0] = vec4(0.0, 0.0, 0.0, 0.0);
	gl_FragData[1] = vec4(0.0, 0.0, 0.0, 0.0);
	gl_FragData[2] = vec4(0.0, 0.0, 0.0, 0.0);
	gl_FragData[3] = color;
	gl_FragData[4] = vec4(0.0, 0.0, 0.0, 0.0);
	gl_FragData[5] = vec4(0.0, 0.0, 0.0, 0.0);
}