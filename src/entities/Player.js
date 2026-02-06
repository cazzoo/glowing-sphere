/**
 * Player Entity
 * Manages player mesh, physics, movement, and special abilities
 */

import * as THREE from 'three';
import { PLAYER, CAMERA, ARENA } from '../utils/Constants.js';

export class Player {
  /**
   * @param {THREE.Scene} scene - Three.js scene
   */
  constructor(scene) {
    this.scene = scene;
    this.mesh = null;
    this.glow = null;
    this.dashTrailSegments = [];
    this.breakShield = null;
    
    // Physics state
    this.position = new THREE.Vector3(0, 0, 0);
    this.velocity = new THREE.Vector3(0, 0, 0);
    this.radius = PLAYER.RADIUS;
    
    // Movement settings
    this.acceleration = PLAYER.ACCELERATION;
    this.friction = PLAYER.FRICTION;
    this.maxSpeed = PLAYER.MAX_SPEED;
    
    // Dash mechanics
    this.dashSpeedBoost = PLAYER.DASH_SPEED_BOOST;
    this.dashDuration = PLAYER.DASH_DURATION;
    this.dashCooldown = PLAYER.DASH_COOLDOWN;
    this.dashActive = false;
    this.dashTimeRemaining = 0;
    this.dashCooldownRemaining = 0;
    
    // Handbrake mechanics
    this.handbrakeFriction = PLAYER.HANDBRAKE_FRICTION;
    this.handbrakeDuration = PLAYER.HANDBRAKE_DURATION;
    this.handbrakeActive = false;
    this.handbrakeTimeRemaining = 0;
    this.handbrakeCooldownRemaining = 0;
    
    // Camera zoom
    this.cameraZoom = {
      currentHeight: CAMERA.DEFAULT_HEIGHT,
      targetHeight: CAMERA.DEFAULT_HEIGHT,
      minHeight: CAMERA.MIN_HEIGHT,
      maxHeight: CAMERA.MAX_HEIGHT,
      zoomSpeed: CAMERA.ZOOM_SPEED,
      defaultHeight: CAMERA.DEFAULT_HEIGHT
    };
    
    this._createMesh();
    this._createGlow();
    this._createDashTrail();
    this._createBreakShield();
  }

  /**
   * Create player sphere mesh
   * @private
   */
  _createMesh() {
    const geometry = new THREE.SphereGeometry(this.radius, 32, 32);
    const material = new THREE.ShaderMaterial({
      uniforms: {
        time: { value: 0 }
      },
      vertexShader: `
        varying vec3 vNormal;
        varying vec3 vPosition;
        void main() {
          vNormal = normalize(normalMatrix * normal);
          vPosition = position;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform float time;
        varying vec3 vNormal;
        varying vec3 vPosition;
        void main() {
          vec3 viewDir = normalize(cameraPosition - vPosition);
          float fresnel = pow(1.0 - dot(vNormal, viewDir), 2.0);
          float pulse = sin(time * 4.0) * 0.2 + 0.8;
          vec3 color = mix(vec3(0.2, 0.5, 1.0), vec3(0.5, 0.2, 1.0), vPosition.y * 0.5 + 0.5);
          color += vec3(0.3, 0.6, 1.0) * fresnel * 2.0 * pulse;
          gl_FragColor = vec4(color, 0.9);
        }
      `,
      transparent: true
    });
    
    this.mesh = new THREE.Mesh(geometry, material);
    this.scene.add(this.mesh);
  }

  /**
   * Create player glow effect
   * @private
   */
  _createGlow() {
    const geometry = new THREE.SphereGeometry(1.2, 16, 16);
    const material = new THREE.ShaderMaterial({
      uniforms: {
        time: { value: 0 }
      },
      vertexShader: `
        varying vec3 vNormal;
        void main() {
          vNormal = normalize(normalMatrix * normal);
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform float time;
        varying vec3 vNormal;
        void main() {
          float glow = pow(0.7 - dot(vNormal, vec3(0.0, 0.0, 1.0)), 2.0);
          float pulse = sin(time * 3.0) * 0.3 + 0.7;
          gl_FragColor = vec4(0.3, 0.6, 1.0, glow * 0.5 * pulse);
        }
      `,
      transparent: true,
      side: THREE.BackSide,
      blending: THREE.AdditiveBlending
    });
    
    this.glow = new THREE.Mesh(geometry, material);
    this.mesh.add(this.glow);
  }

  /**
   * Create dash trail segments
   * @private
   */
  _createDashTrail() {
    const trailSegments = 8;
    
    for (let i = 0; i < trailSegments; i++) {
      const size = 0.8 - (i * 0.08);
      const opacity = 0.5 - (i * 0.05);
      
      const geometry = new THREE.SphereGeometry(size, 16, 16);
      const material = new THREE.ShaderMaterial({
        uniforms: {
          time: { value: 0 },
          opacity: { value: opacity }
        },
        vertexShader: `
          varying vec3 vNormal;
          varying vec3 vPosition;
          void main() {
            vNormal = normalize(normalMatrix * normal);
            vPosition = position;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }
        `,
        fragmentShader: `
          uniform float time;
          uniform float opacity;
          varying vec3 vNormal;
          varying vec3 vPosition;
          void main() {
            vec3 viewDir = normalize(cameraPosition - vPosition);
            float fresnel = pow(1.0 - dot(vNormal, viewDir), 2.0);
            float pulse = sin(time * 8.0) * 0.3 + 0.7;
            vec3 color = mix(vec3(0.5, 0.8, 1.0), vec3(1.0, 0.9, 0.5), vPosition.y * 0.5 + 0.5);
            color += vec3(0.3, 0.6, 1.0) * fresnel * 2.0 * pulse;
            gl_FragColor = vec4(color, opacity * pulse);
          }
        `,
        transparent: true,
        blending: THREE.AdditiveBlending
      });
      
      const segment = new THREE.Mesh(geometry, material);
      segment.visible = false;
      this.scene.add(segment);
      this.dashTrailSegments.push(segment);
    }
  }

  /**
   * Create break shield indicator
   * @private
   */
  _createBreakShield() {
    const geometry = new THREE.CircleGeometry(1.2, 32);
    const material = new THREE.ShaderMaterial({
      uniforms: {
        time: { value: 0 }
      },
      vertexShader: `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform float time;
        varying vec2 vUv;
        void main() {
          vec2 center = vUv - 0.5;
          float dist = length(center);
          float ring = smoothstep(0.3, 0.4, dist) * smoothstep(0.5, 0.4, dist);
          float pulse = sin(time * 6.0) * 0.3 + 0.7;
          vec3 shieldColor = vec3(1.0, 0.5, 0.2) * ring * pulse;
          float alpha = ring * pulse * 0.6;
          gl_FragColor = vec4(shieldColor, alpha);
        }
      `,
      transparent: true,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending
    });
    
    this.breakShield = new THREE.Mesh(geometry, material);
    this.breakShield.visible = false;
    this.scene.add(this.breakShield);
  }

  /**
   * Update player state
   * @param {number} deltaTime - Time delta in seconds
   * @param {Object} input - Input state {x, y, dashPressed, breakPressed, ...}
   * @param {Object} powerUpEffects - Active power-up effects
   */
  update(deltaTime, input, powerUpEffects = {}) {
    this._updateCooldowns(deltaTime);
    this._updateDash(deltaTime, input.dashPressed);
    this._updateBreak(deltaTime, input.breakPressed);
    this._updateZoom(deltaTime, input);
    this._updateMovement(deltaTime, input, powerUpEffects);
    this._updateVisuals(deltaTime);
    this._updateBoundaries();
  }

  /**
   * Update cooldown timers
   * @private
   */
  _updateCooldowns(deltaTime) {
    this.dashTimeRemaining = Math.max(0, this.dashTimeRemaining - deltaTime);
    this.dashActive = this.dashTimeRemaining > 0;
    this.dashCooldownRemaining = Math.max(0, this.dashCooldownRemaining - deltaTime);
    
    this.handbrakeTimeRemaining = Math.max(0, this.handbrakeTimeRemaining - deltaTime);
    this.handbrakeActive = this.handbrakeTimeRemaining > 0;
    this.handbrakeCooldownRemaining = Math.max(0, this.handbrakeCooldownRemaining - deltaTime);
  }

  /**
   * Update dash state
   * @private
   */
  _updateDash(deltaTime, dashPressed, prevDashPressed = false) {
    if (dashPressed && !prevDashPressed && !this.dashActive && this.dashCooldownRemaining <= 0) {
      this.dashActive = true;
      this.dashTimeRemaining = this.dashDuration;
      this.dashCooldownRemaining = this.dashCooldown;
    }
  }

  /**
   * Update handbrake state
   * @private
   */
  _updateBreak(deltaTime, breakPressed, prevBreakPressed = false) {
    if (breakPressed && !prevBreakPressed && !this.handbrakeActive && this.handbrakeCooldownRemaining <= 0) {
      this.handbrakeActive = true;
      this.handbrakeTimeRemaining = this.handbrakeDuration;
      this.handbrakeCooldownRemaining = this.dashCooldown;
    }
  }

  /**
   * Update camera zoom
   * @private
   */
  _updateZoom(deltaTime, input) {
    const r2Value = input.r2Value || 0;
    const l2Value = input.l2Value || 0;
    const hasZoomInput = r2Value > 0.01 || l2Value > 0.01 || input.zoomInPressed || input.zoomOutPressed;

    if (r2Value > 0.01) {
      this.cameraZoom.targetHeight = this.cameraZoom.defaultHeight - (r2Value * (this.cameraZoom.defaultHeight - this.cameraZoom.minHeight));
    } else if (l2Value > 0.01) {
      this.cameraZoom.targetHeight = this.cameraZoom.defaultHeight + (l2Value * (this.cameraZoom.maxHeight - this.cameraZoom.defaultHeight));
    } else if (input.zoomInPressed) {
      this.cameraZoom.targetHeight = this.cameraZoom.minHeight;
    } else if (input.zoomOutPressed) {
      this.cameraZoom.targetHeight = this.cameraZoom.maxHeight;
    } else {
      this.cameraZoom.targetHeight = this.cameraZoom.defaultHeight;
    }

    this.cameraZoom.currentHeight += (this.cameraZoom.targetHeight - this.cameraZoom.currentHeight) * this.cameraZoom.zoomSpeed;
  }

  /**
   * Update movement physics
   * @private
   */
  _updateMovement(deltaTime, input, powerUpEffects) {
    let inputX = input.x;
    let inputZ = input.y;

    // Normalize diagonal input
    if (inputX !== 0 && inputZ !== 0) {
      inputX *= 0.707;
      inputZ *= 0.707;
    }

    // Apply power-up effects
    let effectiveMaxSpeed = this.maxSpeed * (powerUpEffects.speed || 1);
    if (this.dashActive) {
      effectiveMaxSpeed *= this.dashSpeedBoost;
    }

    // Apply acceleration
    this.velocity.x += inputX * this.acceleration * 0.1;
    this.velocity.z += inputZ * this.acceleration * 0.1;

    // Apply friction
    const friction = this.handbrakeActive ? this.handbrakeFriction : this.friction;
    this.velocity.x *= friction;
    this.velocity.z *= friction;

    // Clamp speed
    const speed = Math.sqrt(this.velocity.x ** 2 + this.velocity.z ** 2);
    if (speed > effectiveMaxSpeed) {
      this.velocity.x *= effectiveMaxSpeed / speed;
      this.velocity.z *= effectiveMaxSpeed / speed;
    }

    // Update position
    this.position.x += this.velocity.x;
    this.position.z += this.velocity.z;
  }

  /**
   * Update visual elements
   * @private
   */
  _updateVisuals(deltaTime) {
    const time = performance.now() / 1000;
    
    // Update mesh
    this.mesh.position.copy(this.position);
    
    // Rotate based on movement
    const speed = Math.sqrt(this.velocity.x ** 2 + this.velocity.z ** 2);
    if (speed > 0.01) {
      const angle = Math.atan2(this.velocity.x, this.velocity.z);
      this.mesh.rotation.y = angle;
      this.glow.rotation.y = angle;
    }

    // Update shader uniforms
    this.mesh.material.uniforms.time.value = time;
    this.glow.material.uniforms.time.value = time;

    // Update dash trail
    this.dashTrailSegments.forEach((segment, index) => {
      segment.visible = this.dashActive;
      segment.material.uniforms.time.value = time;

      if (this.dashActive && speed > 0.01) {
        const baseDistance = 1.2;
        const segmentSpacing = 0.4;
        const trailDistance = baseDistance + (index * segmentSpacing);

        const trailX = this.position.x - (this.velocity.x / speed) * trailDistance;
        const trailZ = this.position.z - (this.velocity.z / speed) * trailDistance;

        segment.position.set(trailX, 0, trailZ);
      } else if (this.dashActive) {
        segment.position.copy(this.position);
      }
    });

    // Update break shield
    this.breakShield.visible = this.handbrakeActive;
    this.breakShield.material.uniforms.time.value = time;

    if (this.handbrakeActive && speed > 0.01) {
      const shieldDistance = 1.5;
      const shieldX = this.position.x + (this.velocity.x / speed) * shieldDistance;
      const shieldZ = this.position.z + (this.velocity.z / speed) * shieldDistance;

      this.breakShield.position.set(shieldX, 0, shieldZ);

      const angle = Math.atan2(this.velocity.x, this.velocity.z);
      this.breakShield.rotation.y = -angle;
    } else if (this.handbrakeActive) {
      this.breakShield.position.copy(this.position);
    }
  }

  /**
   * Update and enforce arena boundaries
   * @private
   */
  _updateBoundaries() {
    const halfWidth = (ARENA?.WIDTH || 30) / 2 - this.radius;
    const halfHeight = (ARENA?.HEIGHT || 20) / 2 - this.radius;

    if (this.position.x < -halfWidth) {
      this.position.x = -halfWidth;
      this.velocity.x *= -0.3;
    }
    if (this.position.x > halfWidth) {
      this.position.x = halfWidth;
      this.velocity.x *= -0.3;
    }
    if (this.position.z < -halfHeight) {
      this.position.z = -halfHeight;
      this.velocity.z *= -0.3;
    }
    if (this.position.z > halfHeight) {
      this.position.z = halfHeight;
      this.velocity.z *= -0.3;
    }
  }

  /**
   * Reset player to initial state
   */
  reset() {
    this.position.set(0, 0, 0);
    this.velocity.set(0, 0, 0);
    this.dashActive = false;
    this.dashTimeRemaining = 0;
    this.dashCooldownRemaining = 0;
    this.handbrakeActive = false;
    this.handbrakeTimeRemaining = 0;
    this.handbrakeCooldownRemaining = 0;
    this.cameraZoom.currentHeight = this.cameraZoom.defaultHeight;
    this.cameraZoom.targetHeight = this.cameraZoom.defaultHeight;
  }

  /**
   * Apply push force to player
   * @param {THREE.Vector3} direction - Push direction
   * @param {number} force - Push force magnitude
   */
  push(direction, force) {
    this.velocity.x += direction.x * force;
    this.velocity.z += direction.z * force;
  }

  /**
   * Get camera height
   * @returns {number} Current camera height
   */
  getCameraHeight() {
    return this.cameraZoom.currentHeight;
  }

  /**
   * Set max speed (used by power-ups)
   * @param {number} speed - New max speed
   */
  setMaxSpeed(speed) {
    this.maxSpeed = speed;
  }

  /**
   * Cleanup resources
   */
  dispose() {
    this.scene.remove(this.mesh);
    this.dashTrailSegments.forEach(segment => {
      this.scene.remove(segment);
      segment.geometry.dispose();
      segment.material.dispose();
    });
    this.scene.remove(this.breakShield);
    this.mesh.geometry.dispose();
    this.mesh.material.dispose();
    this.glow.geometry.dispose();
    this.glow.material.dispose();
    this.breakShield.geometry.dispose();
    this.breakShield.material.dispose();
  }
}
