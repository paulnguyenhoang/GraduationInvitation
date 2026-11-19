import { Suspense, useEffect, useMemo, useRef } from 'react'
import type { RefObject } from 'react'
import { OrthographicCamera, useGLTF } from '@react-three/drei'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { gsap } from 'gsap'
import { CanvasTexture, Group, MathUtils, Mesh, MeshStandardMaterial, Raycaster, RepeatWrapping, SRGBColorSpace, Vector2, Vector3 } from 'three'
import type { BufferGeometry, Object3D, OrthographicCamera as ThreeOrthographicCamera } from 'three'

const modelUrl = `${import.meta.env.BASE_URL}assets/models/envelope-prototype.glb`
const closedFlap = Math.PI + 0.025
const restingYaw = -0.19
const restingPitch = -0.11
const touchThreshold = 7

export type EnvelopePhase = 'loading' | 'closed' | 'opening' | 'open'

type Props = {
  actionRef: RefObject<(() => void) | null>
  sealButtonRef: RefObject<HTMLButtonElement | null>
  onPhaseChange: (phase: EnvelopePhase) => void
  onSceneError: () => void
}

type Gesture = {
  id: number
  x: number
  y: number
  lastX: number
  lastY: number
  lastTime: number
  velocity: number
  dragged: boolean
}

function part(model: Object3D, name: string) {
  const mesh = model.getObjectByName(name)
  if (!(mesh instanceof Mesh)) throw new Error(`Missing envelope part: ${name}`)
  return mesh
}

function flapLining(source: BufferGeometry) {
  const canvas = document.createElement('canvas')
  canvas.width = canvas.height = 96
  const ctx = canvas.getContext('2d')
  if (!ctx) return null
  ctx.fillStyle = '#e6ebe3'
  ctx.fillRect(0, 0, 96, 96)
  for (let offset = -96; offset < 96; offset += 24) {
    for (const [shift, width, color] of [[0, 4, '#486e84'], [8, 1, '#809da5']] as const) {
      ctx.strokeStyle = color
      ctx.lineWidth = width
      ctx.beginPath()
      ctx.moveTo(offset + shift, 96)
      ctx.lineTo(offset + shift + 96, 0)
      ctx.stroke()
    }
  }

  // The GLB's inward-facing triangles point along local +Z before the flap folds over.
  const normals = source.getAttribute('normal')
  const sourceIndex = source.getIndex()
  const triangles: number[] = []
  for (let i = 0; i < (sourceIndex?.count ?? normals.count); i += 3) {
    const face = [i, i + 1, i + 2].map((index) => sourceIndex?.getX(index) ?? index)
    if (face.reduce((sum, index) => sum + normals.getZ(index), 0) > 1.5) triangles.push(...face)
  }
  const geometry = source.clone()
  geometry.setIndex(triangles)
  const map = new CanvasTexture(canvas)
  map.colorSpace = SRGBColorSpace
  map.wrapS = map.wrapT = RepeatWrapping
  const material = new MeshStandardMaterial({ map, roughness: 0.92, metalness: 0 })
  const mesh = new Mesh(geometry, material)
  mesh.name = 'Diagonal paper lining'
  mesh.position.z = 0.0014
  mesh.visible = false
  return { mesh, dispose: () => { geometry.dispose(); material.dispose(); map.dispose() } }
}

function EnvelopeScene({ actionRef, sealButtonRef, onPhaseChange, onSceneError }: Props) {
  const { scene } = useGLTF(modelUrl, false, false)
  const model = useMemo(() => {
    const model = scene.clone(true)
    model.traverse((object) => {
      if (object instanceof Mesh) {
        object.castShadow = true
        object.receiveShadow = true
      }
    })
    return model
  }, [scene])
  const body = part(model, 'EnvelopeBody')
  const flap = part(model, 'FlapHinge')
  const card = part(model, 'InvitationCard')
  const seal = part(model, 'WaxSeal')
  const { get, invalidate } = useThree()
  const cameraRef = useRef<ThreeOrthographicCamera>(null)
  const framing = useRef({ progress: 0 })
  const floatGroup = useRef<Group>(null)
  const pose = useRef<Group>(null)
  const phase = useRef<EnvelopePhase>('loading')
  const target = useRef({ yaw: restingYaw, pitch: restingPitch })
  const floatPhase = useRef(0)
  const floatWeight = useRef(0)
  const reducedMotion = useRef(false)
  const sealActive = useRef(false)
  const sealWeight = useRef(1)
  const sealOrigin = useMemo(() => new Vector3(), [])
  const sealScale = useMemo(() => seal.scale.clone(), [seal])

  useFrame(({ camera, size }, delta) => {
    const lens = cameraRef.current
    if (lens) {
      const progress = framing.current.progress
      const zoom = Math.min(size.width / 2.35, size.height / MathUtils.lerp(1.62, 2.77, progress))
      if (zoom !== lens.zoom) {
        lens.zoom = zoom
        lens.updateProjectionMatrix()
      }
      lens.position.y = MathUtils.lerp(1.01, 1.23, progress)
      lens.updateMatrixWorld()
    }
    const floating = floatGroup.current
    const orientation = pose.current
    if (!floating || !orientation || phase.current !== 'closed') return
    const { yaw, pitch } = target.current
    const moving = Math.abs(orientation.rotation.y - yaw) > 0.0005 ||
      Math.abs(orientation.rotation.x - pitch) > 0.0005
    const step = Math.min(delta, 0.05)
    orientation.rotation.y = MathUtils.damp(orientation.rotation.y, yaw, 16, step)
    orientation.rotation.x = MathUtils.damp(orientation.rotation.x, pitch, 15, step)
    const selectedScale = sealActive.current && !reducedMotion.current ? 1.045 : 1
    sealWeight.current = MathUtils.damp(sealWeight.current, selectedScale, 22, step)
    seal.scale.copy(sealScale).multiplyScalar(sealWeight.current)
    if (reducedMotion.current) {
      floating.position.y = 0
    } else {
      floatPhase.current += step * 1.6
      floatWeight.current = MathUtils.damp(floatWeight.current, 1, 2.6, step)
      floating.position.y = Math.sin(floatPhase.current) * 0.032 * floatWeight.current
    }
    const button = sealButtonRef.current
    if (button && document.activeElement === button) {
      seal.getWorldPosition(sealOrigin).project(camera)
      button.style.setProperty('--seal-x', `${(sealOrigin.x + 1) * size.width / 2}px`)
      button.style.setProperty('--seal-y', `${(1 - sealOrigin.y) * size.height / 2}px`)
      button.style.setProperty('--seal-size', `${Math.max(44, (lens?.zoom ?? 1) * 0.41)}px`)
    }
    if (moving || !reducedMotion.current) invalidate()
  })

  useEffect(() => {
    const orientation = pose.current
    const floating = floatGroup.current
    if (!orientation || !floating) return

    const canvas = get().gl.domElement
    const sealButton = sealButtonRef.current
    const motionPreference = window.matchMedia('(prefers-reduced-motion: reduce)')
    const ray = new Raycaster()
    const pointer = new Vector2()
    const visibleParts = [seal, body, flap, card]
    const cardStart = card.position.clone()
    const lining = flapLining(flap.geometry)
    if (lining) flap.add(lining.mesh)
    let gesture: Gesture | null = null
    let timeline: gsap.core.Timeline | undefined

    function updateMotion() {
      reducedMotion.current = motionPreference.matches
      invalidate()
    }

    function setPhase(next: EnvelopePhase) {
      phase.current = next
      canvas.style.cursor = next === 'closed' ? 'grab' : 'default'
      onPhaseChange(next)
      invalidate()
    }

    function openEnvelope() {
      if (phase.current !== 'closed') return
      if (!orientation || !floating) return
      sealActive.current = false
      sealWeight.current = 1
      seal.scale.copy(sealScale)
      gesture = null
      setPhase('opening')
      if (reducedMotion.current) {
        setPhase('open')
        return
      }

      timeline = gsap.timeline({
        defaults: { ease: 'power2.inOut' },
        onUpdate: () => invalidate(),
        onComplete: () => setPhase('open'),
      })

      const offset = restingYaw - orientation.rotation.y
      const nearestYaw = orientation.rotation.y + Math.atan2(Math.sin(offset), Math.cos(offset))
      timeline
        .to(floating.position, { y: 0, duration: 0.19 }, 0)
        .to(orientation.rotation, { x: restingPitch, y: nearestYaw, duration: 0.25 }, 0)
        .to(framing.current, { progress: 1, duration: 0.35 }, 0.1)
        .to(flap.rotation, { x: 0, duration: 0.33 }, 0.17)
        .call(() => { if (lining) lining.mesh.visible = true }, [], 0.27)
        .to(card.position, { y: cardStart.y + 1.11, z: cardStart.z + 0.15, duration: 0.49, ease: 'power2.inOut' }, 0.49)
        .to(floating.position, { y: -0.09, duration: 0.49 }, 0.49)
    }

    function hitsSeal(event: PointerEvent) {
      const rect = canvas.getBoundingClientRect()
      pointer.set((event.clientX - rect.left) / rect.width * 2 - 1,
        1 - (event.clientY - rect.top) / rect.height * 2)
      ray.setFromCamera(pointer, get().camera)
      return ray.intersectObjects(visibleParts, false)[0]?.object === seal
    }

    function onPointerDown(event: PointerEvent) {
      if (phase.current !== 'closed' || gesture || event.button !== 0 || !event.isPrimary) return
      gesture = {
        id: event.pointerId, x: event.clientX, y: event.clientY,
        lastX: event.clientX, lastY: event.clientY, lastTime: event.timeStamp,
        velocity: 0, dragged: false,
      }
      canvas.setPointerCapture(event.pointerId)
      sealActive.current = hitsSeal(event)
    }

    function onPointerMove(event: PointerEvent) {
      if (phase.current !== 'closed') return
      if (!gesture) {
        if (event.pointerType === 'mouse') {
          sealActive.current = hitsSeal(event)
          canvas.style.cursor = sealActive.current ? 'pointer' : 'grab'
        }
        return
      }
      if (event.pointerId !== gesture.id) return
      if (!gesture.dragged && Math.hypot(event.clientX - gesture.x, event.clientY - gesture.y) < touchThreshold) return
      const dx = event.clientX - gesture.lastX
      const dy = event.clientY - gesture.lastY
      const dt = Math.max(event.timeStamp - gesture.lastTime, 12)
      gesture.dragged = true
      sealActive.current = false
      const turn = dx * 0.011
      target.current.yaw += turn
      target.current.pitch = MathUtils.clamp(target.current.pitch + dy * 0.005, -0.55, 0.55)
      gesture.velocity = MathUtils.lerp(gesture.velocity, turn / dt, 0.42)
      gesture.lastX = event.clientX
      gesture.lastY = event.clientY
      gesture.lastTime = event.timeStamp
      canvas.style.cursor = 'grabbing'
      invalidate()
    }

    function onPointerUp(event: PointerEvent) {
      if (gesture?.id !== event.pointerId) return
      const finished = gesture
      gesture = null
      const moved = finished.dragged || Math.hypot(event.clientX - finished.x, event.clientY - finished.y) >= touchThreshold
      if (moved && !reducedMotion.current && event.timeStamp - finished.lastTime < 100) {
        target.current.yaw += MathUtils.clamp(finished.velocity * 88, -0.57, 0.57)
      }
      const overSeal = hitsSeal(event)
      sealActive.current = event.pointerType === 'mouse' && !moved && overSeal
      if (!moved && overSeal) openEnvelope()
      else if (phase.current === 'closed') canvas.style.cursor = overSeal ? 'pointer' : 'grab'
      invalidate()
    }

    function cancelPointer(event: PointerEvent) {
      if (gesture?.id === event.pointerId) {
        gesture = null
        sealActive.current = false
        if (phase.current === 'closed') canvas.style.cursor = 'grab'
      }
    }

    function leaveSeal() {
      sealActive.current = false
    }

    function focusSeal() {
      if (phase.current !== 'closed' || !orientation) return
      const offset = restingYaw - orientation.rotation.y
      target.current = {
        yaw: orientation.rotation.y + Math.atan2(Math.sin(offset), Math.cos(offset)),
        pitch: restingPitch,
      }
      invalidate()
    }

    motionPreference.addEventListener('change', updateMotion)
    canvas.addEventListener('pointerdown', onPointerDown)
    canvas.addEventListener('pointermove', onPointerMove)
    canvas.addEventListener('pointerup', onPointerUp)
    canvas.addEventListener('pointercancel', cancelPointer)
    canvas.addEventListener('lostpointercapture', cancelPointer)
    canvas.addEventListener('pointerleave', leaveSeal)
    canvas.addEventListener('webglcontextlost', onSceneError)
    sealButton?.addEventListener('focus', focusSeal)
    updateMotion()
    flap.rotation.set(closedFlap, 0, 0)
    setPhase('closed')
    actionRef.current = openEnvelope

    return () => {
      timeline?.kill()
      actionRef.current = null
      motionPreference.removeEventListener('change', updateMotion)
      canvas.removeEventListener('pointerdown', onPointerDown)
      canvas.removeEventListener('pointermove', onPointerMove)
      canvas.removeEventListener('pointerup', onPointerUp)
      canvas.removeEventListener('pointercancel', cancelPointer)
      canvas.removeEventListener('lostpointercapture', cancelPointer)
      canvas.removeEventListener('pointerleave', leaveSeal)
      canvas.removeEventListener('webglcontextlost', onSceneError)
      sealButton?.removeEventListener('focus', focusSeal)
      if (lining) {
        flap.remove(lining.mesh)
        lining.dispose()
      }
      canvas.style.cursor = ''
    }
  }, [actionRef, body, card, flap, get, invalidate, onPhaseChange, onSceneError, seal, sealButtonRef, sealScale])

  return (
    <>
      <OrthographicCamera ref={cameraRef} makeDefault position={[0, 1.01, 6]} rotation={[-0.16, 0, 0]} near={0.1} far={24} />
      <hemisphereLight args={['#fff8f0', '#bac7c7', 1.75]} />
      <directionalLight position={[-0.65, 7, 3.1]} color="#fff5e6" intensity={2.1} castShadow
        shadow-mapSize={[512, 512]} shadow-camera-left={-2.4} shadow-camera-right={2.4}
        shadow-camera-top={2.4} shadow-camera-bottom={-2.4} shadow-camera-near={0.5}
        shadow-camera-far={13} shadow-normalBias={0.008} shadow-bias={-0.00015} shadow-radius={8} />
      <directionalLight position={[2, 1.6, -3]} color="#fff8ed" intensity={0.6} />
      <group ref={floatGroup}>
        <group ref={pose} rotation={[restingPitch, restingYaw, 0, 'YXZ']}>
          <primitive object={model} />
        </group>
      </group>
      <mesh position={[0, -0.69, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[14, 14]} />
        <shadowMaterial color="#314d60" opacity={0.16} />
      </mesh>
    </>
  )
}

export default function EnvelopeViewport(props: Props) {
  return (
    <Canvas aria-hidden="true" frameloop="demand" dpr={[1, 1.6]} shadows="percentage"
      gl={{ alpha: true, antialias: true, powerPreference: 'low-power' }}>
      <Suspense fallback={null}>
        <EnvelopeScene {...props} />
      </Suspense>
    </Canvas>
  )
}
