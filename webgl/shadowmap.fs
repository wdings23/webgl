#extension GL_EXT_draw_buffers : require

precision highp float;

varying vec4 vClipSpacePos;

void main()
{
	float fX = vClipSpacePos.x / vClipSpacePos.w;
	float fY = vClipSpacePos.y / vClipSpacePos.w;
	float fZ = vClipSpacePos.z / vClipSpacePos.w;

	gl_FragData[0] = vec4(fZ, fZ, fZ, 1.0);
}