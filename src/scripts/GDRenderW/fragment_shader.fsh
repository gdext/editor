precision mediump float;

varying vec2 o_texcoord;
uniform sampler2D a_sampler;

uniform vec4 a_tint;
uniform int  type;

void main(void) {
    vec4 texture = texture2D(a_sampler, o_texcoord);

    if (type == 1)
        gl_FragColor = a_tint;
    else if (type == 2) {
        gl_FragColor   = mix(texture, a_tint, a_tint.a);
        gl_FragColor.a = texture.a;
    } else
        gl_FragColor = texture * a_tint;
}