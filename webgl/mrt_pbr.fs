precision highp float;

#define NUM_SAMPLES 128

uniform samplerCube		environmentSampler;
uniform sampler2D		normalMap;
uniform sampler2D		clipSpaceMap;
uniform sampler2D		worldSpaceMap;
uniform sampler2D		albedoMap;
uniform sampler2D		normalSampler;
uniform sampler2D		metalRoughnessMap;
uniform sampler2D		lightViewDepthMap;

uniform vec2			afSamplePos[NUM_SAMPLES];
uniform vec3			eyePos;
uniform vec3			lookDir;
uniform vec3			lightPosition;

uniform mat4			lightViewMatrix;
uniform mat4			lightProjectionMatrix;

varying vec2			vUV;

float fImageDimension = 128.0;
float fOneOverPI = 1.0 / 3.14159;
float gfTextureMult = 1.0;

struct IBLSpecularOut
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
	float fF0 = abs((1.0 - fRefractIndex) / (1.0 + fRefractIndex));
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
		}	

		fTotal += 1.0;
	}

	ret.xyz /= fTotal;
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
IBLSpecularOut brdf(vec3 normal, float fRoughness, float fRefract, vec3 view)
{
	IBLSpecularOut specularOut;
	specularOut.color = vec3(0.0, 0.0, 0.0);
	specularOut.fresnel = 0.0;

	vec3 up = vec3(0.0, 0.0, 1.0);
	if(normal.z >= 0.9999)
	{
		up = vec3(1.0, 0.0, 0.0);
	}

	vec3 tangent = normalize(cross(up, normal));
	vec3 binormal = normalize(cross(normal, tangent));

	vec3 normalizedView = normalize(view);

	float fTotal = 0.0;
	float fNDotV = clamp(dot(normal, normalizedView), 0.0, 1.0);
	for(int i = 0; i < NUM_SAMPLES; i++)
	{
		vec3 sampleV = importanceSampleGGX(afSamplePos[i], fRoughness, normal, tangent, binormal);
		float fVDotH = max(dot(normalizedView, sampleV), 0.0);

		vec3 lightV = reflect(-normalizedView, sampleV); //2.0 * fVDotH * halfV - view;
		float fNDotL = dot(normal, lightV);

		//if(fNDotL > 0.0) 
		{
			float fNDotH = clamp(dot(normal, sampleV), 0.0, 1.0);
			float fLDotH = clamp(dot(lightV, sampleV), 0.0, 1.0);

			float fLOD = distribution(fNDotH, fVDotH, fRoughness);
			vec4 color = textureCube(environmentSampler, lightV, fLOD) * gfTextureMult;
			
			float fFresnel = fresnel(fVDotH, fRefract);
			float fGeometry = geometry(fVDotH, fLDotH, fRoughness);
			float fDenom = 1.0 / (fNDotH * fNDotV);
			float fBRDF = clamp(fGeometry * fFresnel * fDenom, 0.0, 1.0);

			specularOut.fresnel += fFresnel;
			specularOut.color += color.xyz * fBRDF;
		
			fTotal += 1.0;
		}
	}

	specularOut.color /= fTotal;
	specularOut.fresnel /= fTotal;

	return specularOut;
}

/*
**
*/
float chebyshevUpperBound(vec2 moments, float fDistance)
{
	const float fMinVariance = 0.000001;

	if(fDistance <= moments.x)
	{
		return 1.0;
	}

	float fVariance = moments.y - (moments.x * moments.x);
	fVariance = max(fVariance, fMinVariance);

	float fD = fDistance - moments.x;
	float fPMax = fVariance / (fVariance + fD * fD);

	return fPMax;
}

/*
**
*/
vec4 inShadow(vec4 worldPos)
{
	const float fSampleSpread = 0.001;
	const float fSampleRate = 0.002;
	const float fBias = 0.0;

	vec4 lightSpacePos = lightProjectionMatrix * lightViewMatrix * worldPos;

	float fX = lightSpacePos.x / lightSpacePos.w;
	float fY = lightSpacePos.y / lightSpacePos.w;
	
	vec4 totalColor = vec4(0.0, 0.0, 0.0, 1.0);
	float fTotalSamples = 0.0;
	
	for(float i = -fSampleRate; i <= fSampleRate; i += fSampleSpread)
	{
		for(float j = -fSampleRate; j <= fSampleRate; j += fSampleSpread)
		{
			float fOffsetX = fX + i;
			float fOffsetY = fY + j;

			float fU = fOffsetX * 0.5 + 0.5;
			float fV = fOffsetY * 0.5 + 0.5;

			vec2 lightSpaceUV = vec2(fU, fV);
			vec4 depth = texture2D(lightViewDepthMap, lightSpaceUV);
			float fCurrDepth = (lightSpacePos.z / lightSpacePos.w) * 0.5 + 0.5;
			
			vec2 moments = vec2(depth.x, depth.y);
			float fContrib = chebyshevUpperBound(moments, fCurrDepth);
			totalColor.x += fContrib;
			totalColor.y += fContrib;
			totalColor.z += fContrib;

			/*if(depth.x <= fCurrDepth - fBias)
			{
				totalColor.x += 0.3;
				totalColor.y += 0.3;
				totalColor.z += 0.3;
			}
			else
			{
				totalColor.x += 1.0;
				totalColor.y += 1.0;
				totalColor.z += 1.0;
			}*/

			fTotalSamples += 1.0;
		}
	}

	totalColor.xyz /= fTotalSamples;

	return totalColor;
}

/*
**
*/
vec3 computeSpecular(
	vec3 specularColor,
	vec3 worldPos,
	vec3 normal, 
	float fRoughness,
	float fRefractIndex, 
	vec3 view,
	vec3 lightPos)
{
	vec3 normalizedView = normalize(view);

	vec3 lightV = normalize(lightPos - worldPos);
	vec3 halfV = normalize(lightV + normalizedView);
	
	float fVDotH = clamp(dot(halfV, normalizedView), 0.0, 1.0);
	float fLDotH = clamp(dot(lightV, halfV), 0.0, 1.0);
	float fNDotH = clamp(dot(normal, halfV), 0.0, 1.0);
	float fNDotV = clamp(dot(normal, normalizedView), 0.0, 1.0);

	//fRoughness = 0.3;

	float fA = fRoughness * fRoughness;
	float fCosSquared = fNDotH * fNDotH;
	float fDistributionDenom = 1.0 / (1.0 + fCosSquared * (fA * fA - 1.0));
	float fDistribution = fA * fA * fOneOverPI * fDistributionDenom * fDistributionDenom;

	float fFresnel = fresnel(fVDotH, fRefractIndex);
	float fGeometry = geometry(fVDotH, fLDotH, fRoughness);
	float fDenom = clamp(1.0 / ((4.0 * fNDotV * fNDotH) + 0.005), 0.0, 1.0);

	return specularColor * fFresnel * fDistribution * fGeometry * fDenom; // * fFresnel * fGeometry;	
}

/*
**
*/
vec3 hbao()
{
	const float fNumDirections = 24.0;
	const float fOneOverTwoPI = 1.0 / (2.0 * 3.14159);
	const float fOneOverNumDirections = 1.0 / fNumDirections;
	const float fAngleThreshold = 3.14159 / 200.0;
	const float fOneOverFrameBufferWidth = 1.0 / 640.0;
	const float fOneOverFrameBufferHeight = 1.0 / 384.0;
	const float fNumAdjacentUV = 5.0;
	const float fShortestTestDistance = 1.0;

	vec3 worldSpace = texture2D(worldSpaceMap, vUV).xyz;
	vec3 normal = texture2D(normalMap, vUV).xyz;
	float fTotalValue = 0.0;
	float fSavedSamples = 0.0;

	vec3 ret = vec3(1.0, 1.0, 1.0);
	for(float i = 0.0; i < fNumDirections; i++)
	{
		float fAngle = i * fOneOverNumDirections * 2.0 * 3.14159; 
		float fCosAngle = cos(fAngle);
		float fSinAngle = sin(fAngle);

		for(float j = 1.0; j <= fNumAdjacentUV; j++)
		{
			vec2 sampleV = vec2(j, 0.0);

			vec2 samplePt = vec2(fCosAngle * sampleV.x, fSinAngle * sampleV.x);
			vec2 sampleUV = vec2(vUV.x + samplePt.x * fOneOverFrameBufferWidth, vUV.y + samplePt.y * fOneOverFrameBufferHeight);
			vec3 sampleWorldSpace = texture2D(worldSpaceMap, sampleUV).xyz;

			float fLength = length(sampleWorldSpace - worldSpace);
			if(fLength <= fShortestTestDistance)
			{
				vec3 sampleDir = normalize(sampleWorldSpace - worldSpace);

				float fSampleAngle = 3.14159 * 0.5 - acos(dot(sampleDir, normal));
				if(fSampleAngle > fAngleThreshold)
				{
					float fValue = fSampleAngle - fAngleThreshold;
					float fAttenuation = fShortestTestDistance - fLength;
					fValue *= (0.02 * fAttenuation);
					ret.xyz -= fValue;
				}
			}
		}
	}

	float fX = ret.x;
	if(fX > 0.8)
	{
		ret.x = 1.0;
		ret.y = 1.0;
		ret.z = 1.0;
	}

	clamp(ret.xyz, 0.0, 1.0);

	return ret;
}

/*
**
*/
void main()
{
	/*uniform samplerCube		environmentSampler;
	uniform sampler2D		normalMap;
	uniform sampler2D		clipSpaceMap;
	uniform sampler2D		worldSpaceMap;
	uniform sampler2D		albedoMap;
	uniform sampler2D		metalRoughnessMap;
	uniform sampler2D		normalSampler;
	*/

	//gl_FragColor = vec4(1.0, 0.0, 0.0, 1.0);
	//gl_FragColor = texture2D(normalSampler, vUV);
	

	vec4 clipSpace = texture2D(clipSpaceMap, vUV);
	vec4 albedo = texture2D(albedoMap, vUV);
	vec4 normal = texture2D(normalMap, vUV);
	vec4 metalRoughness = texture2D(metalRoughnessMap, vUV);
	vec4 normalColor = texture2D(normalSampler, vUV) * 2.0 - 1.0;
	vec4 worldPos = texture2D(worldSpaceMap, vUV);

	if(normal.w <= 0.0)
	{
		gl_FragColor = vec4(0.0, 0.0, 0.0, 0.0);
		return;
	}

	float fMetalVal = metalRoughness.x;
	float fRoughness = metalRoughness.y;
	float fRefract = 0.9;

	// tangent space vectors
	vec3 up = vec3(0.0, 0.0, 1.0);
	if(normal.z >= 0.9999)
	{
		up = vec3(1.0, 0.0, 0.0);
	}
	vec3 tangent = normalize(cross(up, normal.xyz));
	vec3 binormal = normalize(cross(normal.xyz, tangent));

	// convert normal map from tangent space to world
	mat4 worldSpaceMat;
	worldSpaceMat[0] = vec4(tangent.xyz, 0.0);
	worldSpaceMat[1] = vec4(binormal.xyz, 0.0);
	worldSpaceMat[2] = vec4(normal.xyz, 0.0);
	worldSpaceMat[3] = vec4(0.0, 0.0, 0.0, 1.0);
	
	// ibl diffuse
	vec4 worldSpaceNormal = worldSpaceMat * normalColor;
	vec3 worldSpaceNormal3 = vec3(worldSpaceNormal.xyz);
	vec3 iblDiffuse = diffuse(worldSpaceNormal3);

	// ibl specular
	vec3 view = -normalize(clipSpace.xyz);
	IBLSpecularOut iblSpecular = brdf(worldSpaceNormal3, fRoughness, fRefract, view);
	
	//vec3 lightPos = vec3(4.0, 10.0, -10.0);

	// specular
	vec3 specularColor = computeSpecular(
		vec3(1.0), //albedo.xyz,
		worldPos.xyz,
		worldSpaceNormal3,
		fRoughness,
		fRefract,
		view,
		lightPosition);

	vec3 lightV = normalize(lightPosition - worldPos.xyz);
	vec3 diffuseColor = vec3(clamp(dot(worldSpaceNormal3, lightV), 0.0, 1.0));

	//fMetalVal = 1.0;

	//vec3 diffuse = (diffuseColor * iblDiffuse) * (1.0 - fMetalVal) * albedo.xyz;
	vec3 diffuse = (diffuseColor + iblDiffuse) * (1.0 - fMetalVal) * albedo.xyz;
	vec3 specular = (specularColor + (iblSpecular.color)) * fMetalVal;
	vec3 color =  diffuse + specular;
	vec3 ao = hbao();
	//gl_FragColor = vec4(color, 1.0); 
	//gl_FragColor *= inShadow(worldPos);
	gl_FragColor = vec4(ao, 1.0);
}
