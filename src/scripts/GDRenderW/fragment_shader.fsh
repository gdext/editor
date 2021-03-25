precision mediump float;

varying vec2 o_texcoord;
uniform sampler2D a_sampler;

uniform vec4 a_tint;
uniform int  render_line;

void main(void) {
    if (render_line == 1)
        gl_FragColor = a_tint;
    else
        gl_FragColor = texture2D(a_sampler, o_texcoord) * a_tint;
}