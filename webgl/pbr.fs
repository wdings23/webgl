#extension GL_EXT_shader_texture_lod : enable

#define NUM_SAMPLES 128

precision highp float;

uniform samplerCube environmentSampler;
uniform sampler2D albedoSampler;
uniform sampler2D metalnessSampler;
uniform sampler2D roughnessSampler;
uniform sampler2D normalSampler;

uniform vec4 color;
uniform vec2 afSamplePos[NUM_SAMPLES];

varying vec4 vColor;
varying vec3 vNorm;
varying vec3 vView;
varying vec2 vUV;

float fImageDimension = 128.0;
float fOneOverPI = 1.0 / 3.14159;
float gfTextureMult = 1.5;

struct SpecularOut
{
	vec3		color;
	float		fresnel;
};

/*
**
*/
float distribution(float fNDotH, float fVDotH, float fRoughness)
{
	float fA = fRoughness * fRoughness;
	float fCosSquared = fNDotH * fNDotH;
	float fDenom = 1.0 / (1.0 + fCosSquared * (fA * fA - 1.0));
	float fDGGX = fA * fA * fOneOverPI * fDenom * fDenom;
	float fPDF = fDGGX * fNDotH / (4.0 * fVDotH);
	float fSolidAngle = log2(fImageDimension * fImageDimension / float(NUM_SAMPLES));
	float fB = log2(fPDF);

	float fLOD = 0.5 * fSolidAngle - 0.5 * fB;
	if (fLOD < 0.0)
	{
		fLOD = 0.0;
	}

	return ceil(fLOD);
}

/*
**
*/
float geometry(float fVDotH, float fLDotH, float fRoughness)
{
	float fK = fRoughness * fRoughness * fRoughness * fRoughness * 0.5;
	float fGeometry0 = 1.0 / (fVDotH * (1.0 - fK) + fK);
	float fGeometry1 = 1.0 / (fLDotH * (1.0 - fK) + fK);

	return fGeometry0 * fGeometry1;
}

/*
**
*/
float fresnel(float fVDotH, float fRefractIndex)
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

	/*for(int i = 0; i < NUM_SAMPLES; i++)
	{
		vec3 halfV = importanceSampleGGX(afSamplePos[i], 1.0, normal, tangent, binormal);
		if(dot(halfV, normal) > 0.0)
		{
			vec4 color = textureCube(environmentSampler, halfV, 0.0) / 3.14159;
			ret.xyz += color.xyz;
			fTotal += 1.0;
		}
	}*/
	
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
			vec4 color = textureCube(environmentSampler, lightV, 0.0);
			ret.xyz += color.xyz;
			fTotal += 1.0;
		}	
	}

	ret.xyz /= (fTotal * 3.14159);
	return ret;
}

/*
**
*/
vec3 diffuse2(vec3 normal)
{
	vec3 ret = vec3(0.0, 0.0, 0.0);

	vec3 up = vec3(0.0, 1.0, 0.0);
	if(normal.y >= 0.9999)
	{
		up = vec3(0.0, 0.0, 1.0);
	}
	vec3 tangent = normalize(cross(up, normal));
	vec3 binormal = normalize(cross(normal, tangent));

	float fPhi = 0.0;
	float fTotal = 0.0;
	for(int i = 0; i < 100000; i++)
	{
		if(fPhi > 3.14159 * 0.5)
		{
			break;
		}

		float fTheta = 0.0;
		for(int j = 0; j < 100000; j++)
		{
			if(fTheta > 2.0 * 3.14159)
			{
				break;
			}

			vec3 temp = cos(fPhi) * tangent + sin(fPhi) * binormal;
			vec3 sampleV = cos(fTheta) * normal + sin(fTheta) * temp;
			ret += textureCube(environmentSampler, sampleV, 0.0).xyz * gfTextureMult;

			fTheta += 0.2;
			fTotal += 1.0;
		}

		fPhi += 0.1;
	}

	ret /= fTotal;
	return ret;
	
}

/*
**
*/
SpecularOut brdf(vec3 normal, float fRoughness, float fRefract)
{
	SpecularOut specularOut;
	specularOut.color = vec3(0.0, 0.0, 0.0);
	specularOut.fresnel = 0.0;

	vec3 ret = vec3(0.0, 0.0, 0.0);

	vec3 up = vec3(0.0, 0.0, 1.0);
	if(normal.z >= 0.9999)
	{
		up = vec3(1.0, 0.0, 0.0);
	}

	vec3 tangent = normalize(cross(up, normal));
	vec3 binormal = normalize(cross(normal, tangent));

	float fTotal = 0.0;
	float fNDotV = clamp(dot(normal, vView), 0.0, 1.0);
	for(int i = 0; i < NUM_SAMPLES; i++)
	{
		vec3 halfV = importanceSampleGGX(afSamplePos[i], fRoughness, normal, tangent, binormal);
		
		float fVDotH = clamp(dot(vView, halfV), 0.0, 1.0);
		vec3 lightV = 2.0 * fVDotH * halfV - vView;
		float fNDotL = clamp(dot(normal, lightV), 0.0, 1.0);

		if(fNDotL > 0.0) 
		{
			float fNDotH = clamp(dot(normal, halfV), 0.0, 1.0);
			float fLDotH = clamp(dot(lightV, halfV), 0.0, 1.0);

			float fLOD = distribution(fNDotH, fVDotH, fRoughness);
			vec4 color = textureCube(environmentSampler, lightV, fLOD) * gfTextureMult;

			float fFresnel = fresnel(fVDotH, fRefract);
			float fGeometry = geometry(fVDotH, fLDotH, fRoughness);
			float fDenom = 1.0 / (fNDotH * fNDotV);
			float fBRDF = clamp(fGeometry * fFresnel * fVDotH * fDenom, 0.0, 1.0);

			ret.xyz += color.xyz * fBRDF;
			fTotal += 1.0;

			specularOut.fresnel += fFresnel;
			specularOut.color += color.xyz * fBRDF;
		}
	}

	ret.xyz /= float(NUM_SAMPLES);

	specularOut.color /= fTotal;
	specularOut.fresnel /= fTotal;

	return specularOut;
}

/*
**
*/
void main()
{
	//vec4 texColor = textureCube(environmentSampler, vNorm);
	//gl_FragColor = texColor;// + vColor * 0.5;

	vec2 invertUV = vUV;
	invertUV.y = 1.0 - invertUV.y;

	vec4 albedo = texture2D(albedoSampler, invertUV);
	vec4 metalnessColor = texture2D(metalnessSampler, invertUV);
	vec4 roughnessColor = texture2D(roughnessSampler, invertUV);
	vec4 normalColor = texture2D(normalSampler, invertUV) * 2.0 - 1.0;
	normalColor.w = 1.0;

	float fRoughness = roughnessColor.x;
	float fMetalVal = metalnessColor.x;
	float fRefract = 0.03;

	// tangent space vectors
	vec3 up = vec3(0.0, 0.0, 1.0);
	if(vNorm.z >= 0.9999)
	{
		up = vec3(1.0, 0.0, 0.0);
	}
	vec3 tangent = normalize(cross(up, vNorm));
	vec3 binormal = normalize(cross(vNorm, tangent));

	// convert normal map from tangent space to world
	mat4 worldSpaceMat;
	worldSpaceMat[0] = vec4(tangent.xyz, 0.0);
	worldSpaceMat[1] = vec4(binormal.xyz, 0.0);
	worldSpaceMat[2] = vec4(vNorm.xyz, 0.0);
	worldSpaceMat[3] = vec4(0.0, 0.0, 0.0, 1.0);
	
	vec4 worldSpaceNormal = worldSpaceMat * normalColor;
	vec3 worldSpaceNormal3 = vec3(worldSpaceNormal.xyz);

	vec3 KDiffuse = diffuse2(worldSpaceNormal3);//diffuse(worldSpaceNormal3);
	SpecularOut specularOut = brdf(worldSpaceNormal3, fRoughness, fRefract);
	vec3 KSpecular = specularOut.color;

	vec3 dielectric = KDiffuse;
	vec3 metal = KSpecular;
	vec3 color = dielectric * (1.0 - fMetalVal) + metal * (fMetalVal);
	gl_FragColor = vec4(color, 1.0) * albedo; 
	//gl_FragColor = vec4(KSpecular, 1.0);
	
	//gl_FragColor = textureCube(environmentSampler, vNorm.xyz, 2.0);

	//vec3 color = diffuse(vNorm) + brdf(vNorm, fRoughness, fRefract);
	//gl_FragColor = vec4(color, 1.0) * albedo;
	//gl_FragColor = vec4(brdf(vNorm, fRoughness, fRefract), 1.0) * albedo;

	//gl_FragColor = vec4(worldSpaceNormal.xyz * 0.5 + 0.5, 1.0);
}