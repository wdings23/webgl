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
	gl_FragData[0] = vNorm;
	gl_FragData[1] = vClipSpacePos;
	gl_FragData[2] = vWorldPos;
	gl_FragData[3] = texture2D(albedoSampler, vUV.xy);
	gl_FragData[4] = texture2D(normalSampler, vUV.xy);
	gl_FragData[5].x = texture2D(metalnessSampler, vUV.xy).x;
	gl_FragData[5].y = texture2D(roughnessSampler, vUV.xy).y;
	gl_FragData[5].z = 0.0;
	gl_FragData[5].w = 1.0;
	
	


	//gl_FragColor = vec4(vNorm.xyz, 1.0);
}