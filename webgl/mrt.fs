#extension GL_EXT_draw_buffers : require

precision highp float;

uniform sampler2D albedoSampler;
uniform sampler2D metalnessSampler;
uniform sampler2D roughnessSampler;
uniform sampler2D normalSampler;

varying vec4 vNorm;
varying vec4 vClipSpacePos;
varying vec4 vUV;
varying vec4 vWorldPos;

/*
**
*/
void main()
{
	float fClipX = vClipSpacePos.x / vClipSpacePos.w;
	float fClipY = vClipSpacePos.y / vClipSpacePos.w;
	float fClipZ = (vClipSpacePos.z / vClipSpacePos.w);

	gl_FragData[0] = vNorm;
	gl_FragData[1].x = fClipX;
	gl_FragData[1].y = fClipY;
	gl_FragData[1].z = fClipZ;
	gl_FragData[1].w = 1.0;

	vec2 newUV = vUV.xy;
	newUV.y = 1.0 - newUV.y;

	gl_FragData[2] = vWorldPos;
	gl_FragData[3] = texture2D(albedoSampler, newUV);
	gl_FragData[4] = texture2D(normalSampler, newUV);
	gl_FragData[5].x = texture2D(metalnessSampler, newUV).x;
	gl_FragData[5].y = texture2D(roughnessSampler, newUV).y;
	gl_FragData[5].z = 0.0;
	gl_FragData[5].w = 1.0;
	
	//gl_FragColor = vec4(vNorm.xyz, 1.0);
}