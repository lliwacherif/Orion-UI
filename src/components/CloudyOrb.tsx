import React, { useRef, useMemo } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";

// --- SHADERS ---
const vertexShader = `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const fragmentShader = `
  uniform float uTime;
  uniform vec3 uColorStart;
  uniform vec3 uColorEnd;
  varying vec2 vUv;

  // Simple noise function
  vec3 permute(vec3 x) { return mod(((x*34.0)+1.0)*x, 289.0); }

  float snoise(vec2 v){
    const vec4 C = vec4(0.211324865405187, 0.366025403784439, -0.577350269189626, 0.024390243902439);
    vec2 i  = floor(v + dot(v, C.yy) );
    vec2 x0 = v -   i + dot(i, C.xx);
    vec2 i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
    vec4 x12 = x0.xyxy + C.xxzz;
    x12.xy -= i1;
    i = mod(i, 289.0);
    vec3 p = permute( permute( i.y + vec3(0.0, i1.y, 1.0 )) + i.x + vec3(0.0, i1.x, 1.0 ));
    vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy), dot(x12.zw,x12.zw)), 0.0);
    m = m*m ; m = m*m ;
    vec3 x = 2.0 * fract(p * C.www) - 1.0;
    vec3 h = abs(x) - 0.5;
    vec3 ox = floor(x + 0.5);
    vec3 a0 = x - ox;
    m *= 1.79284291400159 - 0.85373472095314 * ( a0*a0 + h*h );
    vec3 g;
    g.x  = a0.x  * x0.x  + h.x  * x0.y;
    g.yz = a0.yz * x12.xz + h.yz * x12.yw;
    return 130.0 * dot(m, g);
  }

  // Fractal Brownian Motion
  float fbm(vec2 x) {
    float v = 0.0; float a = 0.5;
    vec2 shift = vec2(100.0);
    mat2 rot = mat2(cos(0.5), sin(0.5), -sin(0.5), cos(0.50));
    for (int i = 0; i < 3; ++i) {
      v += a * snoise(x);
      x = rot * x * 2.0 + shift;
      a *= 0.5;
    }
    return v;
  }

  void main() {
    vec2 uv = vUv - 0.5;
    float dist = length(uv);
    float circleAlpha = smoothstep(0.5, 0.4, dist);

    vec2 noiseUV = uv * 2.0;
    float noiseVal1 = fbm(noiseUV + uTime * 0.2);
    float noiseVal2 = fbm(noiseUV - uTime * 0.15 + 4.0);
    
    float turbulence = noiseVal1 * 0.6 + noiseVal2 * 0.4;
    float mixFactor = (uv.y * 1.5) + (turbulence * 0.8) + 0.2;
    mixFactor = smoothstep(-0.5, 0.8, mixFactor);

    vec3 color = mix(uColorStart, uColorEnd, mixFactor);
    gl_FragColor = vec4(color, circleAlpha);
  }
`;

interface CloudProps {
    primaryColor?: string;
    secondaryColor?: string;
    speed?: number;
}

const CloudMesh: React.FC<CloudProps> = ({ primaryColor = "#54a0ff", secondaryColor = "#ffffff", speed = 1.0 }) => {
    const meshRef = useRef<THREE.Mesh>(null);

    const uniforms = useMemo(() => ({
        uTime: { value: 0 },
        uColorStart: { value: new THREE.Color(primaryColor) },
        uColorEnd: { value: new THREE.Color(secondaryColor) },
    }), [primaryColor, secondaryColor]);

    useFrame((state) => {
        if (meshRef.current) {
            (meshRef.current.material as THREE.ShaderMaterial).uniforms.uTime.value = state.clock.getElapsedTime() * speed;
        }
    });

    return (
        <mesh ref={meshRef}>
            <planeGeometry args={[2, 2]} />
            <shaderMaterial
                vertexShader={vertexShader}
                fragmentShader={fragmentShader}
                uniforms={uniforms}
                transparent={true}
            />
        </mesh>
    );
};

export default function CloudyOrb({ speed = 0.5, className = "h-[400px] w-full", primaryColor = "#54a0ff" }) {
    return (
        <div className={className}>
            <Canvas camera={{ position: [0, 0, 2] }} gl={{ alpha: true, antialias: true }}>
                <CloudMesh primaryColor={primaryColor} speed={speed} />
            </Canvas>
        </div>
    );
}
