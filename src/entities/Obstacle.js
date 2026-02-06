/**
 * Obstacle Entity
 * Manages obstacle mesh, movement, and collision
 */

import * as THREE from 'three';

export class Obstacle {
  /**
   * @param {THREE.Scene} scene - Three.js scene
   * @param {number} x - X position
   * @param {number} z - Z position
   * @param {number} width - Obstacle width
   * @param {number} depth - Obstacle depth
   * @param {boolean} isMoving - Whether obstacle moves
   * @param {number} moveSpeed - Movement speed
   * @param {number} moveRange - Movement range
   * @param {string} moveAxis - Axis of movement ('x' or 'z')
   * @param {number} level - Current game level
   */
  constructor(scene, x, z, width, depth, isMoving, moveSpeed, moveRange, moveAxis, level) {
    this.scene = scene;
    this.position = new THREE.Vector3(x, 0, z);
    this.baseX = x;
    this.baseZ = z;
    this.width = width;
    this.depth = depth;
    this.isMoving = isMoving;
    this.moveSpeed = moveSpeed;
    this.moveRange = moveRange;
    this.moveAxis = moveAxis;
    this.level = level;
    
    this.mesh = null;
    this._createMesh();
  }

  /**
   * Create obstacle mesh
   * @private
   */
  _createMesh() {
    const geometry = new THREE.BoxGeometry(this.width, 1.5, this.depth);
    const material = new THREE.ShaderMaterial({
      uniforms: {
        time: { value: 0 },
        level: { value: this.level }
      },
      vertexShader: `
        varying vec3 vPosition;
        varying vec3 vNormal;
        void main() {
          vPosition = position;
          vNormal = normal;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform float time;
        uniform float level;
        varying vec3 vPosition;
        varying vec3 vNormal;
        void main() {
          float pulse = sin(time * (2.0 + level * 0.2)) * 0.3 + 0.7;
          vec3 color = mix(vec3(1.0, 0.2, 0.1), vec3(1.0, 0.3, 0.15), level / 10.0) * pulse;
          float edge = 1.0 - abs(dot(vNormal, vec3(0.0, 1.0, 0.0)));
          color += vec3(0.5, 0.1, 0.0) * edge;
          gl_FragColor = vec4(color, 0.9);
        }
      `,
      transparent: true
    });
    
    this.mesh = new THREE.Mesh(geometry, material);
    this.mesh.position.copy(this.position);
    this.scene.add(this.mesh);
  }

  /**
   * Update obstacle state
   * @param {number} time - Current time
   */
  update(time) {
    // Update shader uniforms
    if (this.mesh.material.uniforms) {
      this.mesh.material.uniforms.time.value = time;
      this.mesh.material.uniforms.level.value = this.level;
    }
    
    // Update position if moving
    if (this.isMoving) {
      const offset = Math.sin(time * this.moveSpeed) * this.moveRange;
      if (this.moveAxis === 'x') {
        this.position.x = this.baseX + offset;
      } else {
        this.position.z = this.baseZ + offset;
      }
      this.mesh.position.x = this.position.x;
      this.mesh.position.z = this.position.z;
    }
  }

  /**
   * Check collision with player
   * @param {THREE.Vector3} playerPosition - Player position
   * @param {number} playerRadius - Player radius
   * @returns {boolean} True if collision detected
   */
  checkCollision(playerPosition, playerRadius) {
    const halfW = this.width / 2 + playerRadius;
    const halfD = this.depth / 2 + playerRadius;
    
    return Math.abs(playerPosition.x - this.position.x) < halfW &&
           Math.abs(playerPosition.z - this.position.z) < halfD;
  }

  /**
   * Get obstacle data for AI calculations
   * @returns {Object} Obstacle position data
   */
  getData() {
    return {
      x: this.position.x,
      z: this.position.z,
      width: this.width,
      depth: this.depth
    };
  }

  /**
   * Cleanup resources
   */
  dispose() {
    this.scene.remove(this.mesh);
    this.mesh.geometry.dispose();
    this.mesh.material.dispose();
  }
}

/**
 * MovingWall Entity
 * Special obstacle that moves on a track
 */
export class MovingWall {
  /**
   * @param {THREE.Scene} scene - Three.js scene
   * @param {number} x - X position
   * @param {number} z - Z position
   * @param {number} length - Wall length
   * @param {number} thickness - Wall thickness
   * @param {boolean} isHorizontal - True if horizontal wall
   * @param {number} moveSpeed - Movement speed
   * @param {number} moveRange - Movement range
   * @param {number} level - Current game level
   */
  constructor(scene, x, z, length, thickness, isHorizontal, moveSpeed, moveRange, level) {
    this.scene = scene;
    this.baseX = x;
    this.baseZ = z;
    this.isHorizontal = isHorizontal;
    this.moveSpeed = moveSpeed;
    this.moveRange = moveRange;
    this.length = length;
    this.thickness = thickness;
    this.level = level;
    
    this.position = new THREE.Vector3(x, 0, z);
    this.mesh = null;
    this._createMesh();
  }

  /**
   * Create moving wall mesh
   * @private
   */
  _createMesh() {
    const geometry = new THREE.BoxGeometry(
      this.isHorizontal ? this.length : this.thickness,
      2,
      this.isHorizontal ? this.thickness : this.length
    );
    const material = new THREE.ShaderMaterial({
      uniforms: {
        time: { value: 0 },
        level: { value: this.level }
      },
      vertexShader: `
        varying vec3 vPosition;
        varying vec3 vNormal;
        void main() {
          vPosition = position;
          vNormal = normal;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform float time;
        uniform float level;
        varying vec3 vPosition;
        varying vec3 vNormal;
        void main() {
          float pulse = sin(time * (3.0 + level * 0.3)) * 0.4 + 0.6;
          vec3 color = mix(vec3(1.0, 0.4, 0.1), vec3(1.0, 0.6, 0.2), level / 15.0) * pulse;
          float edge = 1.0 - abs(dot(vNormal, vec3(0.0, 1.0, 0.0)));
          color += vec3(0.8, 0.3, 0.1) * edge * 0.5;
          gl_FragColor = vec4(color, 0.85);
        }
      `,
      transparent: true
    });
    
    this.mesh = new THREE.Mesh(geometry, material);
    this.mesh.position.copy(this.position);
    this.scene.add(this.mesh);
  }

  /**
   * Update moving wall
   * @param {number} time - Current time
   */
  update(time) {
    // Update shader uniforms
    if (this.mesh.material.uniforms) {
      this.mesh.material.uniforms.time.value = time;
      this.mesh.material.uniforms.level.value = this.level;
    }
    
    // Animate movement
    const offset = Math.sin(time * this.moveSpeed) * this.moveRange;
    if (this.isHorizontal) {
      this.position.x = this.baseX + offset;
    } else {
      this.position.z = this.baseZ + offset;
    }
    this.mesh.position.x = this.position.x;
    this.mesh.position.z = this.position.z;
  }

  /**
   * Check collision with player
   * @param {THREE.Vector3} playerPosition - Player position
   * @param {number} playerRadius - Player radius
   * @returns {boolean} True if collision detected
   */
  checkCollision(playerPosition, playerRadius) {
    const width = this.isHorizontal ? this.length : this.thickness;
    const depth = this.isHorizontal ? this.thickness : this.length;
    
    const halfW = width / 2 + playerRadius;
    const halfD = depth / 2 + playerRadius;
    
    return Math.abs(playerPosition.x - this.position.x) < halfW &&
           Math.abs(playerPosition.z - this.position.z) < halfD;
  }

  /**
   * Cleanup resources
   */
  dispose() {
    this.scene.remove(this.mesh);
    this.mesh.geometry.dispose();
    this.mesh.material.dispose();
  }
}
