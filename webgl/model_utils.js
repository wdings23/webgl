var ModelUtils =
{
    /*
    **
    */
    createQuad : function (size, offsetX, offsetY)
    {
        var vert = [];
        var halfSize = size * 0.5;

        vert.push(halfSize + offsetX);
        vert.push(halfSize + offsetY);
        vert.push(0.0);
        vert.push(1.0);

        vert.push(1.0);
        vert.push(1.0);

        vert.push(-halfSize + offsetX);
        vert.push(-halfSize + offsetY);
        vert.push(0.0);
        vert.push(1.0);

        vert.push(0.0);
        vert.push(0.0);

        vert.push(halfSize + offsetX);
        vert.push(-halfSize + offsetY);
        vert.push(0.0);
        vert.push(1.0);

        vert.push(1.0);
        vert.push(0.0);

        vert.push(-halfSize + offsetX);
        vert.push(halfSize + offsetY);
        vert.push(0.0);
        vert.push(1.0);

        vert.push(0.0);
        vert.push(1.0);

        vert.push(-halfSize + offsetX);
        vert.push(-halfSize + offsetY);
        vert.push(0.0);
        vert.push(1.0);

        vert.push(0.0);
        vert.push(0.0);

        vert.push(halfSize + offsetX);
        vert.push(halfSize + offsetY);
        vert.push(0.0);
        vert.push(1.0);

        vert.push(1.0);
        vert.push(1.0);

        var buffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vert), gl.STATIC_DRAW);
        gl.bindBuffer(gl.ARRAY_BUFFER, null);

        return buffer;
    },

    /*
    **
    */
    createSphere : function createSphere(radius, centerX, centerY, centerZ, numSegments) {
        var circlePos = [];

        var twoPI = Math.PI * 2.0;

        var inc = (2.0 * Math.PI) / numSegments;
        for (var i = 0; i < numSegments; i++) {
            var x = Math.cos(inc * i);
            var z = Math.sin(inc * i);

            circlePos.push(new Vector3(x, 0.0, z));
        }

        var vertPos = [];
        var vertUV = [];
        var vertNorm = [];
        var halfPI = Math.PI / 2;

        var halfSegments = numSegments / 2;
        for (var i = 0; i < numSegments; i++) {
            var nextIndexI = (i + 1) % numSegments;

            var topRadius = (i / halfSegments) * halfPI;
            var bottomRadius = ((i + 1) / halfSegments) * halfPI;

            if (i >= halfSegments) {
                topRadius = ((numSegments - i) / halfSegments) * halfPI;
                bottomRadius = ((numSegments - (i + 1)) / halfSegments) * halfPI;
            }

            topRadius = Math.sin(topRadius) * radius;
            bottomRadius = Math.sin(bottomRadius) * radius;

            var topNormY = Math.cos((i / numSegments) * Math.PI);
            var bottomNormY = Math.cos(((i + 1) / numSegments) * Math.PI);

            for (var j = 0; j < numSegments; j++) {
                var nextIndexJ = (j + 1) % numSegments;
                var yMult = 1.0;
                if (i + 1 >= numSegments) {
                    yMult = -1.0;
                }

                var topX0 = topRadius * circlePos[j].x;
                var topY0 = ((halfSegments - i) / halfSegments) * halfPI;
                var topZ0 = topRadius * circlePos[j].z;

                var topX1 = topRadius * circlePos[nextIndexJ].x;
                var topY1 = ((halfSegments - i) / halfSegments) * halfPI;
                var topZ1 = topRadius * circlePos[nextIndexJ].z;

                var bottomX0 = bottomRadius * circlePos[j].x;
                var bottomY0 = ((halfSegments - nextIndexI) / halfSegments) * halfPI * yMult;
                var bottomZ0 = bottomRadius * circlePos[j].z;

                var bottomX1 = bottomRadius * circlePos[nextIndexJ].x;
                var bottomY1 = ((halfSegments - nextIndexI) / halfSegments) * halfPI * yMult;
                var bottomZ1 = bottomRadius * circlePos[nextIndexJ].z;

                topY0 = Math.sin(topY0) * radius;
                topY1 = Math.sin(topY1) * radius;
                bottomY0 = Math.sin(bottomY0) * radius;
                bottomY1 = Math.sin(bottomY1) * radius;

                // 0 --- 2
                // |  / |
                // |/ _ |
                // 1    3

                // face
                // position
                vertPos.push(new Vector3(topX0, topY0, topZ0));
                vertPos.push(new Vector3(bottomX0, bottomY0, bottomZ0));
                vertPos.push(new Vector3(topX1, topY1, topZ1));

                vertPos.push(new Vector3(topX1, topY1, topZ1));
                vertPos.push(new Vector3(bottomX0, bottomY0, bottomZ0));
                vertPos.push(new Vector3(bottomX1, bottomY1, bottomZ1));

                //console.log('0 (' + topX0 + ', ' + topY0 + ', ' + topZ0 + ')');
                //console.log('1 (' + topX0 + ', ' + bottomY0 + ', ' + topZ0 + ')');
                //console.log('2 (' + topX1 + ', ' + topY1 + ', ' + topZ1 + ')');
                //console.log('3 (' + bottomX1 + ', ' + bottomY1 + ', ' + bottomZ1 + ')');

                // normal
                var topNorm0 = new Vector3(circlePos[j].x * topRadius, topNormY, circlePos[j].z * topRadius);
                var topNorm1 = new Vector3(circlePos[nextIndexJ].x * topRadius, topNormY, circlePos[nextIndexJ].z * topRadius);

                var bottomNorm0 = new Vector3(circlePos[j].x * bottomRadius, bottomNormY, circlePos[j].z * bottomRadius);
                var bottomNorm1 = new Vector3(circlePos[nextIndexJ].x * bottomRadius, bottomNormY, circlePos[nextIndexJ].z * bottomRadius);

                topNorm0.normalize();
                topNorm1.normalize();
                bottomNorm0.normalize();
                bottomNorm1.normalize();

                vertNorm.push(topNorm0);
                vertNorm.push(bottomNorm0);
                vertNorm.push(topNorm1);

                vertNorm.push(topNorm1);
                vertNorm.push(bottomNorm0);
                vertNorm.push(bottomNorm1);

                // uv
                var dTop0 = new Vector3(topX0, topY0, topZ0);
                var dTop1 = new Vector3(topX1, topY1, topZ1);
                dTop0.normalize();
                dTop1.normalize();

                var dBottom0 = new Vector3(bottomX0, bottomY0, bottomZ0);
                var dBottom1 = new Vector3(bottomX1, bottomY1, bottomZ1);
                dBottom0.normalize();
                dBottom1.normalize();

                var topUV0 = new Vector3(0.5 + Math.atan2(dTop0.z, dTop0.x) / twoPI, 0.5 - Math.asin(dTop0.y) / Math.PI, 0.0);
                var topUV1 = new Vector3(0.5 + Math.atan2(dTop1.z, dTop1.x) / twoPI, 0.5 - Math.asin(dTop1.y) / Math.PI, 0.0);

                var bottomUV0 = new Vector3(0.5 + Math.atan2(dBottom0.z, dBottom0.x) / twoPI, 0.5 - Math.asin(dBottom0.y) / Math.PI, 0.0);
                var bottomUV1 = new Vector3(0.5 + Math.atan2(dBottom1.z, dBottom1.x) / twoPI, 0.5 - Math.asin(dBottom1.y) / Math.PI, 0.0);

                vertUV.push(topUV0);
                vertUV.push(bottomUV0);
                vertUV.push(topUV1);

                vertUV.push(topUV1);
                vertUV.push(bottomUV0);
                vertUV.push(bottomUV1);
            }
        }

        // to number array
        var floatArray = [];
        for (var i = 0; i < vertPos.length; i++) {
            floatArray.push(vertPos[i].x);
            floatArray.push(vertPos[i].y);
            floatArray.push(vertPos[i].z);

            floatArray.push(vertNorm[i].x);
            floatArray.push(vertNorm[i].y);
            floatArray.push(vertNorm[i].z);

            floatArray.push(vertUV[i].x);
            floatArray.push(vertUV[i].y);
        }

        return floatArray;
    },

    /*
    **
    */
    createGround : function (size, offsetX, offsetY, offsetZ)
    {
        var vert = [];
        var halfSize = size * 0.5;

        vert.push(halfSize + offsetX);
        vert.push(offsetY);
        vert.push(halfSize + offsetZ);

        vert.push(0.0);
        vert.push(1.0);
        vert.push(0.0);

        vert.push(1.0);
        vert.push(1.0);

        vert.push(-halfSize + offsetX);
        vert.push(offsetY);
        vert.push(-halfSize + offsetZ);

        vert.push(0.0);
        vert.push(1.0);
        vert.push(0.0);

        vert.push(0.0);
        vert.push(0.0);

        vert.push(halfSize + offsetX);
        vert.push(offsetY);
        vert.push(-halfSize + offsetZ);

        vert.push(0.0);
        vert.push(1.0);
        vert.push(0.0);

        vert.push(1.0);
        vert.push(0.0);

        vert.push(-halfSize + offsetX);
        vert.push(offsetY);
        vert.push(halfSize + offsetZ);

        vert.push(0.0);
        vert.push(1.0);
        vert.push(0.0);

        vert.push(0.0);
        vert.push(1.0);

        vert.push(-halfSize + offsetX);
        vert.push(offsetY);
        vert.push(-halfSize + offsetZ);

        vert.push(0.0);
        vert.push(1.0);
        vert.push(0.0);

        vert.push(0.0);
        vert.push(0.0);

        vert.push(halfSize + offsetX);
        vert.push(offsetY);
        vert.push(halfSize + offsetZ);

        vert.push(0.0);
        vert.push(1.0);
        vert.push(0.0);

        vert.push(1.0);
        vert.push(1.0);

        var buffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vert), gl.STATIC_DRAW);
        gl.bindBuffer(gl.ARRAY_BUFFER, null);

        return buffer;
    },

    /*
    **
    */
    createCrossHair : function(size)
    {
        var numIter = 100;
        var twoPI = Math.PI * 2.0;
        var coords = [];
        for (var i = 0; i < numIter; i++) {
            var angle0 = (i / numIter) * twoPI;
            var angle1 = (((i + 1) % numIter) / numIter) * twoPI;

            var posX0 = size * Math.cos(angle0);
            var posY0 = size * Math.sin(angle0);

            var posX1 = size * Math.cos(angle1);
            var posY1 = size * Math.sin(angle1);

            coords.push(posX0);
            coords.push(posY0);
            coords.push(0.0);
            coords.push(1.0);

            coords.push(posX1);
            coords.push(posY1);
            coords.push(0.0);
            coords.push(1.0);
        }

        for (var i = 0; i < numIter; i++) {
            var angle0 = (i / numIter) * twoPI;
            var angle1 = (((i + 1) % numIter) / numIter) * twoPI;

            var posX0 = 0.01 * Math.cos(angle0);
            var posY0 = 0.01 * Math.sin(angle0);

            var posX1 = 0.01 * Math.cos(angle1);
            var posY1 = 0.01 * Math.sin(angle1);

            coords.push(posX0);
            coords.push(posY0);
            coords.push(0.0);
            coords.push(1.0);

            coords.push(posX1);
            coords.push(posY1);
            coords.push(0.0);
            coords.push(1.0);
        }

        var buffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(coords), gl.STATIC_DRAW);
        gl.lineWidth(30.0);
        gl.bindBuffer(gl.ARRAY_BUFFER, null);

        return [buffer, coords.length / 4];
    },

    /*
    **
    */
    drawCrossHair : function(buffer, numLinePts)
    {
        var crossHairShader = ShaderProgramManager.get().getShaderProgram("default");
        if (gCrossHairShader == null)
        {
            return;
        }

        gl.useProgram(gCrossHairShader.program);
        var colorUniform = gl.getUniformLocation(gCrossHairShader.program, "color");
        gl.uniform4f(colorUniform, 1.0, 0.0, 0.0, 1.0);

        gl.bindBuffer(gl.ARRAY_BUFFER, buffer);

        var vertexAttrib = gl.getAttribLocation(gCrossHairShader.program, "position");
        gl.enableVertexAttribArray(vertexAttrib);

        gl.vertexAttribPointer(vertexAttrib, 4, gl.FLOAT, false, 16, 0);

        gl.disable(gl.DEPTH_TEST);
        gl.drawArrays(gl.LINES, 0, numLinePts);
        gl.enable(gl.DEPTH_TEST);

        gl.bindBuffer(gl.ARRAY_BUFFER, null);
    },

    /*
    **
    */
    drawQuad : function(quadBuffer, texture) {
        var shader = ShaderProgramManager.get().getShaderProgram('texture');

        if (shader != null) {
            gl.useProgram(shader.program);

            // vertex attribs (position and normal)
            var vertexAttrib = gl.getAttribLocation(shader.program, "position");
            var uvAttrib = gl.getAttribLocation(shader.program, "uv");

            gl.enableVertexAttribArray(vertexAttrib);
            gl.enableVertexAttribArray(uvAttrib);

            var tex0Uniform = gl.getUniformLocation(shader.program, 'textureMap');
            gl.uniform1i(tex0Uniform, 0);

            gl.activeTexture(gl.TEXTURE0);
            gl.bindTexture(gl.TEXTURE_2D, texture);

            var stride = 4 * Float32Array.BYTES_PER_ELEMENT;
            gl.bindBuffer(gl.ARRAY_BUFFER, quadBuffer)
            gl.vertexAttribPointer(vertexAttrib, 4, gl.FLOAT, false, 24, 0);
            gl.vertexAttribPointer(uvAttrib, 2, gl.FLOAT, false, 24, stride);

            gl.drawArrays(gl.TRIANGLES, 0, 6);
        }
    },
}