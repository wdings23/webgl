#define NUM_SAMPLES 256

precision highp float;

uniform samplerCube sampler;
uniform sampler2D albedoSampler;
uniform vec4 color;
uniform vec2 afSamplePos[NUM_SAMPLES];

varying vec4 vColor;
varying vec3 vNorm;
varying vec3 vView;
varying vec2 vUV;

float fRoughness = 0.1;
float fRefractIndex = 0.2;

/*
**
*/
float geometry(float fVDotH, float fLDotH)
{
	float fK = fRoughness * fRoughness * fRoughness * fRoughness * 0.5;
	float fGeometry0 = 1.0 / (fVDotH * (1.0 - fK) + fK);
	float fGeometry1 = 1.0 / (fLDotH * (1.0 - fK) + fK);

	return fGeometry0 * fGeometry1;
}

/*
**
*/
float fresnel(float fVDotH)
{
	float fFC = pow(1.0 - fVDotH, 5.0);
	float fF0 = (1.0 - fRefractIndex) / (1.0 + fRefractIndex);
	fF0 *= fF0;

	float fFresnel = fF0 + (1.0 - fF0) * fFC;
	return fFresnel;
}

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
vec3 diffuse(vec3 normal)
{
	vec3 ret = vec3(0.0, 0.0, 0.0);

	vec3 up = vec3(0.0, 0.0, 1.0);
	if(normal.z >= 0.9999)
	{
		up = vec3(1.0, 0.0, 0.0);
	}

	vec3 tangent = normalize(cross(up, normal));
	vec3 binormal = normalize(cross(normal, tangent));

	float fTotal = 0.0;
	for(int i = 0; i < NUM_SAMPLES; i++)
	{
		vec2 xi = afSamplePos[i];
		float fTheta = 2.0 * acos(sqrt(1.0 - xi.x));
		float fPhi = 2.0 * 3.14159 * xi.y;
		float fSinTheta = sin(fTheta);

		vec3 h = vec3(
			fSinTheta * cos(fPhi),
			fSinTheta * sin(fPhi),
			cos(fTheta)
		);

		vec3 lightV = tangent * h.x + binormal * h.y + normal * h.z;
		float fNDotL = dot(normal, lightV);
		if (fNDotL > 0.0)
		{
			vec4 color = textureCube(sampler, lightV);
			ret.xyz += color.xyz;
			fTotal += 1.0;
		}	
	}

	ret.xyz /= fTotal;
	return ret;
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

	float fNDotV = clamp(dot(normal, vView), 0.0, 1.0);

	for(int i = 0; i < NUM_SAMPLES; i++)
	{
		vec3 halfV = importanceSampleGGX(afSamplePos[i], fRoughness, normal, tangent, binormal);
		
		float fVDotH = clamp(dot(vView, halfV), 0.0, 1.0);
		vec3 lightV = 2.0 * fVDotH * halfV - vView;
		float fNDotL = clamp(dot(normal, lightV), 0.0, 1.0);
		float fNDotH = clamp(dot(normal, halfV), 0.0, 1.0);
		float fLDotH = clamp(dot(lightV, halfV), 0.0, 1.0);

		vec4 color = textureCube(sampler, lightV);

		float fFresnel = fresnel(fVDotH);
		float fGeometry = geometry(fVDotH, fLDotH);
		float fDenom = 1.0 / (fNDotH * fNDotV);
		float fBRDF = clamp(fGeometry * fFresnel * fVDotH * fDenom, 0.0, 1.0);

		ret.xyz += color.xyz * fBRDF;
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

	vec2 invertUV = vUV;
	invertUV.y = 1.0 - invertUV.y;

	vec4 albedo = texture2D(albedoSampler, invertUV);

	gl_FragColor = vec4(diffuse(vNorm) * fRoughness + brdf(vNorm) * (1.0 - fRoughness), 1.0) * albedo;
	//gl_FragColor = vec4(diffuse(vNorm), 1.0);

	
}