attribute vec4 position;

void main()
{
	gl_Position = position;
	gl_Position.x *= (384.0 / 640.0);
}