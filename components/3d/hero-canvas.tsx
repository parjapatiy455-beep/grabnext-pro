"use client"

import { useEffect, useRef } from "react"
import * as THREE from "three"

export function HeroCanvas() {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!containerRef.current) return

    const container = containerRef.current
    const width = container.clientWidth
    const height = container.clientHeight

    // Scene, Camera, Renderer
    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 1000)
    camera.position.z = 15

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true })
    renderer.setSize(width, height)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    container.appendChild(renderer.domElement)

    // Group for objects
    const group = new THREE.Group()
    scene.add(group)

    // 1. Central Metallic Torus Knot
    const geometry = new THREE.TorusKnotGeometry(2.5, 0.7, 128, 32)
    const material = new THREE.MeshPhysicalMaterial({
      color: 0x6366f1, // Indigo
      metalness: 0.2,
      roughness: 0.15,
      clearcoat: 1.0,
      clearcoatRoughness: 0.1,
      wireframe: false,
    })
    const torusKnot = new THREE.Mesh(geometry, material)
    group.add(torusKnot)

    // 2. Wireframe Outer Sphere
    const sphereGeo = new THREE.IcosahedronGeometry(4.8, 2)
    const sphereMat = new THREE.MeshBasicMaterial({
      color: 0x818cf8,
      wireframe: true,
      transparent: true,
      opacity: 0.18,
    })
    const wireSphere = new THREE.Mesh(sphereGeo, sphereMat)
    group.add(wireSphere)

    // 3. Floating Cubes
    const floatGroup = new THREE.Group()
    const cubeGeo = new THREE.BoxGeometry(0.6, 0.6, 0.6)
    const cubeMat = new THREE.MeshStandardMaterial({
      color: 0x38bdf8,
      roughness: 0.3,
      metalness: 0.8,
    })

    const cubePositions = [
      [-4.5, 3, 1],
      [4.5, -2.5, 2],
      [-3.5, -3, -1],
      [5, 3.5, -2],
      [-5.5, -1, 3],
      [3.8, 4, 1.5],
    ]

    const cubes: THREE.Mesh[] = []
    cubePositions.forEach(([x, y, z]) => {
      const cube = new THREE.Mesh(cubeGeo, cubeMat)
      cube.position.set(x, y, z)
      floatGroup.add(cube)
      cubes.push(cube)
    })
    scene.add(floatGroup)

    // 4. Background Particles
    const particlesGeo = new THREE.BufferGeometry()
    const particleCount = 180
    const posArray = new Float32Array(particleCount * 3)

    for (let i = 0; i < particleCount * 3; i += 3) {
      posArray[i] = (Math.random() - 0.5) * 35
      posArray[i + 1] = (Math.random() - 0.5) * 35
      posArray[i + 2] = (Math.random() - 0.5) * 30
    }

    particlesGeo.setAttribute("position", new THREE.BufferAttribute(posArray, 3))
    const particlesMat = new THREE.PointsMaterial({
      size: 0.08,
      color: 0x6366f1,
      transparent: true,
      opacity: 0.6,
    })
    const particleMesh = new THREE.Points(particlesGeo, particlesMat)
    scene.add(particleMesh)

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.2)
    scene.add(ambientLight)

    const pointLight1 = new THREE.PointLight(0x6366f1, 4, 50)
    pointLight1.position.set(10, 10, 10)
    scene.add(pointLight1)

    const pointLight2 = new THREE.PointLight(0x38bdf8, 3, 50)
    pointLight2.position.set(-10, -10, 10)
    scene.add(pointLight2)

    // Mouse Interaction
    let mouseX = 0
    let mouseY = 0
    let targetX = 0
    let targetY = 0

    const onMouseMove = (event: MouseEvent) => {
      const rect = container.getBoundingClientRect()
      mouseX = ((event.clientX - rect.left) / width - 0.5) * 2
      mouseY = ((event.clientY - rect.top) / height - 0.5) * 2
    }

    window.addEventListener("mousemove", onMouseMove)

    const onResize = () => {
      if (!container) return
      const w = container.clientWidth
      const h = container.clientHeight
      camera.aspect = w / h
      camera.updateProjectionMatrix()
      renderer.setSize(w, h)
    }

    window.addEventListener("resize", onResize)

    let animationFrameId: number

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate)

      targetX += (mouseX - targetX) * 0.05
      targetY += (mouseY - targetY) * 0.05

      group.rotation.x = targetY * 0.6
      group.rotation.y = targetX * 0.8
      torusKnot.rotation.x += 0.005
      torusKnot.rotation.y += 0.008

      wireSphere.rotation.x -= 0.002
      wireSphere.rotation.y -= 0.003

      floatGroup.rotation.y += 0.004

      const time = Date.now() * 0.002
      cubes.forEach((cube, index) => {
        cube.position.y += Math.sin(time + index) * 0.003
        cube.rotation.x += 0.01
        cube.rotation.y += 0.01
      })

      particleMesh.rotation.y = time * 0.02

      renderer.render(scene, camera)
    }

    animate()

    return () => {
      window.removeEventListener("mousemove", onMouseMove)
      window.removeEventListener("resize", onResize)
      cancelAnimationFrame(animationFrameId)
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement)
      }
      renderer.dispose()
    }
  }, [])

  return (
    <div
      ref={containerRef}
      className="w-full h-full min-h-[350px] md:min-h-[500px] relative pointer-events-none"
    />
  )
}
