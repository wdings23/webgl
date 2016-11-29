#define NUM_SAMPLES 64

precision highp float;

uniform samplerCube sampler;
uniform vec4 color;
uniform vec2 afSamplePos[NUM_SAMPLES];

varying vec4 vColor;
varying vec3 vNorm;

/*
**
*/
vec3 importanceSampleGGX(
	vec2 xi, 
	float fRoughness, 
	vec3 normal, 
	vec3 tangent, 
	vec3 binormal)
{
	float fRoughnessSquared = fRoughness * fRoughness;
	float fPhi = 2.0 * 3.14159 * xi.x;
	float fCosTheta = sqrt((1.0 - xi.y) / (1.0 + (fRoughnessSquared * fRoughnessSquared - 1.0) * xi.y));
	float fSinTheta = sqrt(1.0 - fCosTheta * fCosTheta);

	vec3 h = vec3(fSinTheta * cos(fPhi), fSinTheta * sin(fPhi), fCosTheta);
	vec3 result = tangent * h.x + binormal * h.y + normal * h.z;

	return result;
}

/*
**
*/
vec3 brdf(vec3 normal)
{
	vec3 ret = vec3(0.0, 0.0, 0.0);

	vec3 up = vec3(0.0, 0.0, 1.0);
	if(normal.z >= 0.9999)
	{
		up = vec3(1.0, 0.0, 0.0);
	}

	vec3 tangent = normalize(cross(up, normal));
	vec3 binormal = normalize(cross(normal, tangent));

	for(int i = 0; i < NUM_SAMPLES; i++)
	{
		vec3 halfV = importanceSampleGGX(afSamplePos[i], 0.5, normal, tangent, binormal);
		vec4 color = textureCube(sampler, halfV);

		ret.xyz += color.xyz;
	}

	ret.xyz /= float(NUM_SAMPLES);

	return ret;
}

/*
**
*/
void main()
{
	//vec4 texColor = textureCube(sampler, vNorm);
	//gl_FragColor = texColor;// + vColor * 0.5;

	gl_FragColor = vec4(brdf(vNorm), 1.0);
}