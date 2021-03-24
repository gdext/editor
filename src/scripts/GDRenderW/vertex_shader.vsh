attribute vec2 a_position;
attribute vec2 a_texcoord;

uniform mat3 model;
uniform mat3 proj;
uniform mat3 view;

uniform float camx;
uniform float camy;

uniform float textX;
uniform float textY;
uniform float textW;
uniform float textH;

uniform mat3  textM;

varying vec2 o_texcoord;

void main(void) {
    o_texcoord  = ( vec3( a_texcoord, 1 ) * textM ).xy + vec2( textM[2][0], textM[2][1] );

    vec3 pos    = proj * (model * vec3(a_position, 1) + vec3(camx, camy, 1));
    gl_Position = vec4((pos * view).xy, 0.0, 1.0);
    //o_texcoord  = vec2(a_texcoord.x * textW + textX, a_texcoord.y * textH + textY);
}