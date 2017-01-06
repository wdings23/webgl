#extension GL_EXT_draw_buffers : require
#extension GL_OES_standard_derivatives : enable

precision highp float;

varying vec4 vClipSpacePos;

void main()
{
	float fDepth = (vClipSpacePos.z / vClipSpacePos.w) * 0.5 + 0.5;
	float fDepthSquared = fDepth * fDepth;
	
	float fDX = dFdx(fDepth);
	float fDY = dFdy(fDepth);
	float fMoment2 = fDepthSquared + 0.25 * (fDX * fDX + fDY * fDY);


	gl_FragData[0] = vec4(fDepth, fMoment2, 0.0, 1.0);
}