/**
 * Star Entity
 * Manages star mesh, animation, and collection
 */

import * as THREE from 'three';
import { STAR } from '../utils/Constants.js';

export class Star {
  /**
   * @param {THREE.Scene} scene - Three.js scene
   * @param {number} x - X position
   * @param {number} z - Z position
   */
  constructor(scene, x, z) {
    this.scene = scene;
    this.position = new THREE.Vector3(x, 0, z);
    this.baseY = 0;
    this.collected = false;
    this.rotationSpeed = 2 + Math.random() * 2;
    
    this.mesh = null;
    this._createMesh();
  }

  /**
   * Create star mesh
   * @private
   */
  _createMesh() {
    this.mesh = new THREE.Group();
    
    // Core
    const coreGeometry = new THREE.SphereGeometry(0.3, 16, 16);
    const coreMaterial = new THREE.MeshBasicMaterial({
      color: 0xffff00,
      transparent: true,
      opacity: 0.9
    });
    const core = new THREE.Mesh(coreGeometry, coreMaterial);
    this.mesh.add(core);
    
    // Points
    for (let i = 0; i < 5; i++) {
      const pointGeometry = new THREE.ConeGeometry(0.15, 0.6, 4);
      const pointMaterial = new THREE.MeshBasicMaterial({
        color: 0xffdd00,
        transparent: true,
        opacity: 0.8
      });
      const point = new THREE.Mesh(pointGeometry, pointMaterial);
      point.rotation.z = (i * Math.PI * 2) / 5;
      point.position.y = Math.cos(point.rotation.z) * 0.3;
      point.position.x = Math.sin(point.rotation.z) * 0.3;
      point.rotation.x = Math.PI / 2;
      this.mesh.add(point);
    }
    
    // Glow
    const glowGeometry = new THREE.SphereGeometry(0.8, 16, 16);
    const glowMaterial = new THREE.MeshBasicMaterial({
      color: 0xffff00,
      transparent: true,
      opacity: 0.2
    });
    const glow = new THREE.Mesh(glowGeometry, glowMaterial);
    this.mesh.add(glow);
    
    this.mesh.position.copy(this.position);
    this.scene.add(this.mesh);
  }

  /**
   * Update star animation
   * @param {number} time - Current time
   */
  update(time) {
    if (!this.collected) {
      this.mesh.rotation.y += this.rotationSpeed * 0.02;
      this.mesh.position.y = this.baseY + Math.sin(time * 3 + this.position.x) * 0.2;
    }
  }

  /**
   * Check if star is collected by player
   * @param {THREE.Vector3} playerPosition - Player position
   * @param {number} playerRadius - Player radius
   * @param {number} magnetRange - Additional magnet range from power-ups
   * @returns {boolean} True if star should be collected
   */
  checkCollection(playerPosition, playerRadius, magnetRange = 0) {
    if (this.collected) return false;
    
    const dx = playerPosition.x - this.position.x;
    const dz = playerPosition.z - this.position.z;
    const dist = Math.sqrt(dx * dx + dz * dz);
    
    const collectRange = playerRadius + STAR.COLLECT_RANGE + magnetRange;
    
    // Apply magnet effect
    if (dist > playerRadius + 0.5 && dist < collectRange && magnetRange > 0) {
      const pullSpeed = 0.3;
      this.position.x += (dx / dist) * pullSpeed;
      this.position.z += (dz / dist) * pullSpeed;
      this.mesh.position.x = this.position.x;
      this.mesh.position.z = this.position.z;
    }
    
    return dist < playerRadius + 0.5;
  }

  /**
   * Mark star as collected
   */
  collect() {
    this.collected = true;
    this.mesh.visible = false;
  }

  /**
   * Reset star to uncollected state
   */
  reset() {
    this.collected = false;
    this.mesh.visible = true;
  }

  /**
   * Check if star is collected
   * @returns {boolean} True if collected
   */
  isCollected() {
    return this.collected;
  }

  /**
   * Get star position
   * @returns {THREE.Vector3} Star position
   */
  getPosition() {
    return this.position.clone();
  }

  /**
   * Cleanup resources
   */
  dispose() {
    this.scene.remove(this.mesh);
    this.mesh.children.forEach(child => {
      if (child.geometry) child.geometry.dispose();
      if (child.material) child.material.dispose();
    });
  }
}
